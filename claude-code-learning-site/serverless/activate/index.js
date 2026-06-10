'use strict';

/* ═══════════════════════════════════════════════════════
   激活码云端校验 — 腾讯云 SCF + API 网关
   每码 2 台设备，零依赖，纯 Node.js 内置模块
   防止激活码分享：同设备可恢复，不同设备最多 2 台
   ═══════════════════════════════════════════════════════ */

const https = require('https');
const crypto = require('crypto');

// ══════ 配置 ══════
const BUCKET = process.env.COS_BUCKET;
const REGION = process.env.COS_REGION;
const MAX_ACTIVATIONS = 2;
const SECRET_SALT = 0xCC1E4;
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const COS_HOST = BUCKET + '.cos.' + REGION + '.myqcloud.com';
const COS_KEY = 'activations.json';

// ══════ 激活码校验 ══════
function verifyChecksum(code) {
  code = code.toUpperCase().trim();
  var parts = code.match(/^CC-([SA])([A-HJ-NP-Z2-9]{3})([A-HJ-NP-Z2-9]{4})-([A-HJ-NP-Z2-9]{4})$/);
  if (!parts) return null;
  var prefix = 'CC-' + parts[1] + parts[2] + parts[3];
  var hash = SECRET_SALT;
  for (var i = 0; i < prefix.length; i++) {
    hash = ((hash << 5) - hash) + prefix.charCodeAt(i);
    hash = hash | 0;
  }
  var expected = '';
  for (var j = 0; j < 4; j++) {
    expected += CHARS[Math.abs((hash >> (j * 5)) % CHARS.length)];
  }
  if (expected !== parts[4]) return null;
  return { type: parts[1] === 'A' ? 'all' : 'single', code: code };
}

// ══════ COS HTTP 请求（零依赖签名）══════
function getSignHeaders(method, key, body) {
  var now = Math.floor(Date.now() / 1000);
  var expire = now + 900; // 15 分钟有效期

  var qSignAlgorithm = 'sha1';
  var qAk = process.env.TENCENTCLOUD_SECRETID;
  var qSk = process.env.TENCENTCLOUD_SECRETKEY;
  var qToken = process.env.TENCENTCLOUD_SESSIONTOKEN;
  var qKeyTime = now + ';' + expire;
  var qSignTime = qKeyTime;

  // SignKey = HMAC-SHA1(SecretKey, q-key-time)
  var signKey = crypto.createHmac('sha1', qSk).update(qKeyTime).digest('hex');

  // HttpString
  var httpMethod = method.toLowerCase();
  var uriPathname = '/' + key;
  var httpParameters = '';
  var httpHeaders = 'host=' + encodeURIComponent(COS_HOST).toLowerCase();

  // StringToSign
  var sha1HttpString = crypto.createHash('sha1').update(
    httpMethod + '\n' + uriPathname + '\n' + httpParameters + '\n' + httpHeaders + '\n'
  ).digest('hex');

  var stringToSign = qSignAlgorithm + '\n' + qSignTime + '\n' + sha1HttpString + '\n';

  // Signature = HMAC-SHA1(SignKey, StringToSign)
  var signature = crypto.createHmac('sha1', signKey).update(stringToSign).digest('hex');

  var authorization =
    'q-sign-algorithm=' + qSignAlgorithm +
    '&q-ak=' + qAk +
    '&q-sign-time=' + qSignTime +
    '&q-key-time=' + qKeyTime +
    '&q-header-list=host' +
    '&q-url-param-list=' +
    '&q-signature=' + signature;

  var headers = {
    'Host': COS_HOST,
    'Authorization': authorization
  };

  if (qToken) {
    headers['x-cos-security-token'] = qToken;
  }

  if (body) {
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = Buffer.byteLength(body, 'utf8');
  }

  return headers;
}

function cosGet() {
  return new Promise(function (resolve) {
    var headers = getSignHeaders('GET', COS_KEY, null);
    var req = https.request({
      hostname: COS_HOST, port: 443, path: '/' + COS_KEY,
      method: 'GET', headers: headers, timeout: 5000
    }, function (res) {
      var data = '';
      res.on('data', function (c) { data += c; });
      res.on('end', function () {
        if (res.statusCode === 404) return resolve({});
        try { resolve(JSON.parse(data)); } catch (e) { resolve({}); }
      });
    });
    req.on('error', function () { resolve({}); });
    req.on('timeout', function () { req.destroy(); resolve({}); });
    req.end();
  });
}

function cosPut(data) {
  return new Promise(function (resolve, reject) {
    var body = JSON.stringify(data, null, 2);
    var headers = getSignHeaders('PUT', COS_KEY, body);
    var req = https.request({
      hostname: COS_HOST, port: 443, path: '/' + COS_KEY,
      method: 'PUT', headers: headers, timeout: 5000
    }, function (res) {
      var d = '';
      res.on('data', function (c) { d += c; });
      res.on('end', function () {
        if (res.statusCode === 200) resolve(true);
        else reject(new Error('COS PUT failed: ' + res.statusCode + ' ' + d));
      });
    });
    req.on('error', function (e) { reject(e); });
    req.on('timeout', function () { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

// ══════ 主处理 ══════
exports.main_handler = async function (event) {
  var headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: headers, body: '' };
  }

  try {
    var body = typeof event.body === 'string' ? JSON.parse(event.body) : (event.body || {});
    var code = (body.code || '').toUpperCase().trim();
    var fingerprint = (body.fingerprint || 'unknown').substring(0, 64);

    if (!code) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ ok: false, error: '请提供激活码' }) };
    }

    // 1. 本地校验
    var valid = verifyChecksum(code);
    if (!valid) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ ok: false, error: '激活码无效' }) };
    }

    // 2. 读 COS
    var records = await cosGet();
    var entry = records[code] || {
      count: 0, maxAllowed: MAX_ACTIVATIONS, devices: [],
      type: valid.type, firstActivated: null, lastActivated: null
    };

    // 3. 检查是否已激活
    var existing = entry.devices.find(function (d) { return d.fp === fingerprint; });
    if (existing) {
      existing.time = new Date().toISOString();
      await cosPut(records);
      return {
        statusCode: 200, headers: headers,
        body: JSON.stringify({ ok: true, type: valid.type, remaining: entry.maxAllowed - entry.count, message: '设备已认证' })
      };
    }

    // 4. 超限检查
    if (entry.count >= entry.maxAllowed) {
      return {
        statusCode: 403, headers: headers,
        body: JSON.stringify({
          ok: false,
          error: '该激活码已超过激活次数限制（' + entry.maxAllowed + '台设备）。如需解绑旧设备，请发邮件至 hcpthanks@163.com',
          count: entry.count, maxAllowed: entry.maxAllowed
        })
      };
    }

    // 5. 记录新设备
    entry.count++;
    entry.devices.push({ fp: fingerprint, time: new Date().toISOString() });
    if (!entry.firstActivated) entry.firstActivated = new Date().toISOString();
    entry.lastActivated = new Date().toISOString();
    records[code] = entry;

    await cosPut(records);

    return {
      statusCode: 200, headers: headers,
      body: JSON.stringify({
        ok: true, type: valid.type, remaining: entry.maxAllowed - entry.count,
        message: '激活成功！可在 ' + entry.maxAllowed + ' 台设备上使用'
      })
    };

  } catch (err) {
    console.error('Activation error:', err.message || err);
    return {
      statusCode: 500, headers: headers,
      body: JSON.stringify({ ok: false, error: '服务暂时不可用，请稍后重试。如持续失败请联系 hcpthanks@163.com', _dbg: (err.message || String(err)).substring(0, 300) })
    };
  }
};
