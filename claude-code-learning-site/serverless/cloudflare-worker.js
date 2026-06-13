'use strict';

/* ═══════════════════════════════════════════════════
   激活码云端校验 — Cloudflare Worker + KV
   每个码最多 3 台设备，30 行部署
   ═══════════════════════════════════════════════════ */

const SECRET_SALT = 0xCC1E4;
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_ACTIVATIONS = 3;

function verifyChecksum(code) {
  code = code.toUpperCase().trim();
  const parts = code.match(/^CC-([SA])([A-HJ-NP-Z2-9]{3})([A-HJ-NP-Z2-9]{4})-([A-HJ-NP-Z2-9]{4})$/);
  if (!parts) return null;
  const prefix = 'CC-' + parts[1] + parts[2] + parts[3];
  let hash = SECRET_SALT;
  for (let i = 0; i < prefix.length; i++) { hash = ((hash << 5) - hash) + prefix.charCodeAt(i); hash |= 0; }
  let expected = '';
  for (let j = 0; j < 4; j++) { expected += CHARS[Math.abs((hash >> (j * 5)) % CHARS.length)]; }
  return expected === parts[4] ? { type: parts[1] === 'A' ? 'all' : 'single' } : null;
}

export default {
  async fetch(request, env) {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') return new Response('', { status: 200, headers });

    try {
      const { code, fingerprint } = await request.json();
      const c = (code || '').toUpperCase().trim();
      const fp = (fingerprint || 'unknown').substring(0, 64);

      if (!c) return new Response(JSON.stringify({ ok: false, error: '请提供激活码' }), { status: 400, headers });
      if (!verifyChecksum(c)) return new Response(JSON.stringify({ ok: false, error: '激活码无效' }), { status: 400, headers });

      // 读 KV
      let entry = await env.DB.get(c, { type: 'json' });
      if (!entry) entry = { count: 0, devices: [] };

      // 同设备
      if (entry.devices.find(d => d.fp === fp)) {
        return new Response(JSON.stringify({ ok: true, type: verifyChecksum(c).type, remaining: MAX_ACTIVATIONS - entry.count, message: '设备已认证' }), { headers });
      }

      // 超限
      if (entry.count >= MAX_ACTIVATIONS) {
        return new Response(JSON.stringify({ ok: false, error: '该码已超过激活次数限制（3台设备）。请联系 hcpthanks@163.com' }), { status: 403, headers });
      }

      // 新设备
      entry.count++;
      entry.devices.push({ fp, time: new Date().toISOString() });
      await env.DB.put(c, JSON.stringify(entry));

      return new Response(JSON.stringify({ ok: true, type: verifyChecksum(c).type, remaining: MAX_ACTIVATIONS - entry.count, message: '激活成功！可在3台设备上使用' }), { headers });

    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: '服务暂不可用' }), { status: 500, headers });
    }
  }
};
