'use strict';

/* 日语小说站 · 账号与权限服务
 *
 * 权限唯一真相在服务端。前端只缓存 state 用来避免首屏闪烁，每次心跳都会拿到新结论。
 *
 *   guest    未登录，首次打开 15 分钟（本地记，接口不参与）
 *   member   注册后 72 小时内，全功能
 *   staying  72 小时已过，今日累计阅读不足 10 分钟
 *   daily    今日满 10 分钟，领到当天 15 分钟
 *   limited  今日 15 分钟已用完
 *   paid     access_until 未过期
 */

const TRIAL_MS = 72 * 3600 * 1000;
const DAILY_NEED_SEC = 600;
const DAILY_GRANT_MS = 15 * 60 * 1000;
const CODE_TTL_MS = 10 * 60 * 1000;
const CODE_MAX_PER_HOUR = 5;
const PING_STEP_SEC = 15;
const TOKEN_TTL_MS = 30 * 24 * 3600 * 1000;
const SHANGHAI_OFFSET_MS = 8 * 3600 * 1000;

const ALLOWED_ORIGINS = new Set([
  'https://hcpthanks.com',
  'https://www.hcpthanks.com',
  'https://hcpthanks.github.io',
  'http://localhost:4311',
  'http://127.0.0.1:4311',
  'http://localhost:4321',
  'http://127.0.0.1:4321'
]);

function corsHeaders(env, request) {
  const origin = request.headers.get('Origin') || '';
  const devLike = env.MAIL_MODE === 'dev';
  const ok = ALLOWED_ORIGINS.has(origin) || (devLike && (origin === 'null' || origin === ''));
  return {
    'Access-Control-Allow-Origin': ok ? origin || '*' : 'https://hcpthanks.com',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function json(body, status, extra) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, extra || {})
  });
}

function dayInShanghai(ms) {
  return new Date(ms + SHANGHAI_OFFSET_MS).toISOString().slice(0, 10);
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmac(secret, payload) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function issueToken(env, userId) {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = userId + '.' + exp;
  return payload + '.' + await hmac(env.AUTH_SECRET, payload);
}

async function readToken(env, header) {
  const raw = (header || '').replace(/^Bearer\s+/i, '').trim();
  const parts = raw.split('.');
  if (parts.length !== 3) return null;
  const payload = parts[0] + '.' + parts[1];
  if (await hmac(env.AUTH_SECRET, payload) !== parts[2]) return null;
  if (Number(parts[1]) < Date.now()) return null;
  return parts[0];
}

function normalizeEmail(v) {
  return String(v || '').trim().toLowerCase();
}

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254;
}

/* ---------- 权限计算 ---------- */

async function loadUser(env, userId) {
  return env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
}

async function loadDaily(env, userId, day) {
  return env.DB.prepare('SELECT * FROM daily WHERE user_id = ? AND day = ?')
    .bind(userId, day).first();
}

function decide(user, today, now) {
  if (user.access_until && user.access_until > now) {
    return { state: 'paid', full: true, remaining: user.access_until - now, needSeconds: 0 };
  }
  if (user.trial_ends_at > now) {
    return { state: 'member', full: true, remaining: user.trial_ends_at - now, needSeconds: 0 };
  }
  if (today && today.granted_at) {
    if (now < today.granted_at + DAILY_GRANT_MS) {
      return {
        state: 'daily', full: true,
        remaining: today.granted_at + DAILY_GRANT_MS - now,
        needSeconds: 0
      };
    }
    return { state: 'limited', full: false, remaining: 0, needSeconds: 0 };
  }
  return {
    state: 'staying', full: false, remaining: 0,
    needSeconds: Math.max(0, DAILY_NEED_SEC - (today ? today.seconds : 0))
  };
}

/* 今天读满 10 分钟就发额度，只发一次 */
async function ensureGrant(env, userId, day, today, user, now) {
  if (!today || today.granted_at) return today;
  if (user.trial_ends_at > now) return today;
  if (today.seconds < DAILY_NEED_SEC) return today;
  await env.DB.prepare('UPDATE daily SET granted_at = ? WHERE user_id = ? AND day = ?')
    .bind(now, userId, day).run();
  return Object.assign({}, today, { granted_at: now });
}

async function snapshot(env, userId) {
  const now = Date.now();
  const day = dayInShanghai(now);
  const user = await loadUser(env, userId);
  if (!user) return null;
  let today = await loadDaily(env, userId, day);
  today = await ensureGrant(env, userId, day, today, user, now);
  const verdict = decide(user, today, now);
  return Object.assign(verdict, {
    email: user.email,
    registeredAt: user.created_at,
    trialEndsAt: user.trial_ends_at,
    accessUntil: user.access_until,
    todaySeconds: today ? today.seconds : 0,
    day
  });
}

/* ---------- 路由 ---------- */

async function requestCode(env, body, request) {
  const email = normalizeEmail(body.email);
  if (!isEmail(email)) return json({ ok: false, error: '邮箱格式不对' }, 400);

  const hourAgo = Date.now() - 3600 * 1000;
  const recent = await env.DB.prepare(
    'SELECT COUNT(*) AS n FROM login_codes WHERE email = ? AND created_at > ?'
  ).bind(email, hourAgo).first();
  if (recent && recent.n >= CODE_MAX_PER_HOUR) {
    return json({ ok: false, error: '这个邮箱请求太频繁，过一会儿再来' }, 429);
  }

  const rand = new Uint32Array(1);
  crypto.getRandomValues(rand);
  const code = String(100000 + (rand[0] % 900000));
  const now = Date.now();
  await env.DB.prepare(
    'INSERT INTO login_codes (email, code_hash, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).bind(email, await sha256Hex(email + ':' + code + ':' + env.AUTH_SECRET), now + CODE_TTL_MS, now).run();
  await env.DB.prepare('DELETE FROM login_codes WHERE expires_at < ?').bind(now).run();

  if (env.MAIL_MODE === 'dev') {
    return json({ ok: true, devMode: true, devCode: code });
  }

  const sent = await sendMail(env, email, code);
  if (!sent.ok) {
    console.error('mail failed', sent.reason || 'unknown');
    return json({ ok: false, error: '验证码没发出去，稍后再试' }, 502);
  }
  return json({ ok: true });
}

async function sendMail(env, email, code) {
  if (env.MAIL_MODE === 'resend') return sendResend(env, email, code);
  if (env.MAIL_MODE === 'ses') return sendTencentSes(env, email, code);
  return { ok: false, reason: '未知的 MAIL_MODE' };
}

async function sendResend(env, email, code) {
  if (!env.RESEND_KEY) return { ok: false, reason: '缺 RESEND_KEY' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + env.RESEND_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [email],
      subject: '登录验证码 · ' + code,
      text: mailText(code)
    })
  });
  return { ok: res.ok };
}

function mailText(code) {
  return '验证码 ' + code + '，十分钟内有效。\n\n如果不是你本人操作，忽略这封邮件即可。';
}

function mailHtml(code) {
  return '<div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.8;color:#1c1a17">'
    + '<p>登录验证码</p>'
    + '<p style="font-size:28px;letter-spacing:6px;font-weight:600;margin:12px 0">' + code + '</p>'
    + '<p style="color:#6b645b;font-size:13px">十分钟内有效。如果不是你本人操作，忽略这封邮件即可。</p>'
    + '</div>';
}

/* 腾讯云 SES 的 Simple.Text / Simple.Html 要求 Base64（UTF-8） */
function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/* ---------- 腾讯云 SES（TC3-HMAC-SHA256 签名） ---------- */

function toHex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacKey(keyBytes, msg) {
  const key = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
}

async function tc3Authorization(secretId, secretKey, host, action, region, payload) {
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
  const service = 'ses';
  const contentType = 'application/json; charset=utf-8';

  const canonicalHeaders =
    'content-type:' + contentType + '\n' +
    'host:' + host + '\n' +
    'x-tc-action:' + action.toLowerCase() + '\n';
  const signedHeaders = 'content-type;host;x-tc-action';
  const canonicalRequest = [
    'POST', '/', '', canonicalHeaders, signedHeaders, await sha256Hex(payload)
  ].join('\n');

  const scope = date + '/' + service + '/tc3_request';
  const stringToSign = [
    'TC3-HMAC-SHA256', String(timestamp), scope, await sha256Hex(canonicalRequest)
  ].join('\n');

  const enc = new TextEncoder();
  const kDate = await hmacKey(enc.encode('TC3' + secretKey), date);
  const kService = await hmacKey(kDate, service);
  const kSigning = await hmacKey(kService, 'tc3_request');
  const signature = toHex(await crypto.subtle.sign(
    'HMAC',
    await crypto.subtle.importKey('raw', kSigning, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
    enc.encode(stringToSign)
  ));

  return {
    timestamp,
    authorization: 'TC3-HMAC-SHA256 Credential=' + secretId + '/' + scope +
      ', SignedHeaders=' + signedHeaders + ', Signature=' + signature
  };
}

/* 控制台复制出来的值常带 "SecretId " / "SecretKey " 前缀或引号，统一清掉 */
function cleanSecret(v, label) {
  return String(v || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(new RegExp('^' + label + '\\s*', 'i'), '')
    .trim();
}

async function sendTencentSes(env, email, code) {
  if (!env.TENCENT_SECRET_ID || !env.TENCENT_SECRET_KEY) {
    return { ok: false, reason: '缺腾讯云密钥' };
  }
  if (!env.MAIL_FROM) return { ok: false, reason: '缺 MAIL_FROM' };

  const secretId = cleanSecret(env.TENCENT_SECRET_ID, 'SecretId');
  const secretKey = cleanSecret(env.TENCENT_SECRET_KEY, 'SecretKey');

  const host = 'ses.tencentcloudapi.com';
  const region = env.SES_REGION || 'ap-guangzhou';
  const action = 'SendEmail';
  const subject = '登录验证码';
  const body = {
    FromEmailAddress: env.MAIL_FROM,
    Destination: [email],
    Subject: subject
  };
  if (env.SES_TEMPLATE_ID) {
    body.Template = {
      TemplateID: Number(env.SES_TEMPLATE_ID),
      TemplateData: JSON.stringify({ code: code })
    };
  } else {
    body.Subject = subject + ' · ' + code;
    body.Simple = { Text: toBase64(mailText(code)), Html: toBase64(mailHtml(code)) };
  }
  const payload = JSON.stringify(body);

  const { timestamp, authorization } = await tc3Authorization(
    secretId, secretKey, host, action, region, payload
  );

  const res = await fetch('https://' + host + '/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: authorization,
      'X-TC-Action': action,
      'X-TC-Version': '2020-10-02',
      'X-TC-Region': region,
      'X-TC-Timestamp': String(timestamp)
    },
    body: payload
  });

  const raw = await res.text();
  let data = {};
  try { data = JSON.parse(raw); } catch (e) { }
  const err = data && data.Response && data.Response.Error;
  if (err) {
    console.error('SES error', err.Code, err.Message);
    return { ok: false, reason: err.Code + ': ' + err.Message };
  }
  if (!res.ok) {
    const hdrs = ['server', 'x-tc-requestid', 'x-tc-trace', 'content-type', 'cf-ray']
      .map(k => k + '=' + (res.headers.get(k) || '-')).join(',');
    console.error('SES http', res.status, hdrs, raw.slice(0, 200));
    return { ok: false, reason: 'HTTP ' + res.status + ' | ' + hdrs + ' | ' + raw.slice(0, 120) };
  }
  return { ok: true };
}

async function verifyCode(env, body) {
  const email = normalizeEmail(body.email);
  const code = String(body.code || '').trim();
  if (!isEmail(email) || !/^\d{6}$/.test(code)) {
    return json({ ok: false, error: '邮箱或验证码不对' }, 400);
  }

  const now = Date.now();
  const hash = await sha256Hex(email + ':' + code + ':' + env.AUTH_SECRET);
  const row = await env.DB.prepare(
    'SELECT rowid FROM login_codes WHERE email = ? AND code_hash = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1'
  ).bind(email, hash, now).first();
  if (!row) return json({ ok: false, error: '验证码不正确或已过期' }, 401);

  await env.DB.prepare('DELETE FROM login_codes WHERE email = ?').bind(email).run();

  let user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) {
    const id = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO users (id, email, created_at, trial_ends_at, access_until) VALUES (?, ?, ?, ?, 0)'
    ).bind(id, email, now, now + TRIAL_MS).run();
    user = { id, email, created_at: now, trial_ends_at: now + TRIAL_MS, access_until: 0 };
  }

  const token = await issueToken(env, user.id);
  const snap = await snapshot(env, user.id);
  return json(Object.assign({ ok: true, token }, snap));
}

async function heartbeat(env, userId) {
  const now = Date.now();
  const day = dayInShanghai(now);
  const user = await loadUser(env, userId);
  if (!user) return json({ ok: false, error: '账号不存在' }, 401);

  const today = await loadDaily(env, userId, day);
  const last = today && today.last_ping ? today.last_ping : 0;
  // 只认两次心跳之间真实经过的秒数，客户端谎报无效
  const delta = Math.max(0, Math.min(PING_STEP_SEC * 2, Math.floor((now - last) / 1000)));

  if (!today) {
    await env.DB.prepare(
      'INSERT INTO daily (user_id, day, seconds, last_ping) VALUES (?, ?, ?, ?)'
    ).bind(userId, day, 0, now).run();
  } else {
    await env.DB.prepare(
      'UPDATE daily SET seconds = seconds + ?, last_ping = ? WHERE user_id = ? AND day = ?'
    ).bind(delta, now, userId, day).run();
  }

  const snap = await snapshot(env, userId);
  return json(Object.assign({ ok: true }, snap));
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env, request);
    if (request.method === 'OPTIONS') {
      return new Response('', { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '');

    if (request.method === 'GET' && path === '/health') {
      return json({ ok: true, mode: env.MAIL_MODE }, 200, cors);
    }


    let body = {};
    if (request.method === 'POST') {
      try { body = await request.json(); } catch { body = {}; }
    }

    try {
      if (request.method === 'POST' && path === '/auth/request-code') {
        const res = await requestCode(env, body, request);
        return withCors(res, cors);
      }
      if (request.method === 'POST' && path === '/auth/verify') {
        return withCors(await verifyCode(env, body), cors);
      }
      if (request.method === 'POST' && path === '/heartbeat') {
        const uid = await readToken(env, request.headers.get('Authorization'));
        if (!uid) return json({ ok: false, error: '登录已过期' }, 401, cors);
        return withCors(await heartbeat(env, uid), cors);
      }
      if (request.method === 'GET' && path === '/entitlement') {
        const uid = await readToken(env, request.headers.get('Authorization'));
        if (!uid) return json({ ok: false, error: '登录已过期' }, 401, cors);
        const snap = await snapshot(env, uid);
        if (!snap) return json({ ok: false, error: '账号不存在' }, 401, cors);
        return json(Object.assign({ ok: true }, snap), 200, cors);
      }
      return json({ ok: false, error: '没有这个接口' }, 404, cors);
    } catch (err) {
      return json({ ok: false, error: '服务出了点问题' }, 500, cors);
    }
  }
};

async function withCors(res, cors) {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
}
