/**
 * POST /api/payment-notify
 * 微信支付结果回调（由微信服务器调用，非用户浏览器）
 *
 * 流程：
 * 1. 验证签名（确认是微信服务器的请求）
 * 2. 解密报文（AES-256-GCM）
 * 3. 更新 Supabase orders 表
 * 4. 生成激活码写入 activation_codes 表
 * 5. 返回成功应答给微信
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { verifyNotifySignature, generateActivationCode } = require('../lib/wechat-pay');

const API_KEY = process.env.WECHAT_API_KEY;
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

// ── AES-256-GCM 解密 ──
// 微信 API v3 回调 resource 中的 ciphertext 是 Base64(AAD || CT || Tag)
// 其中 Tag 为最后 16 字节，CT 为中间部分，AAD 通过 associated_data 字段传入
function decryptResource(ciphertext, nonce, associatedData) {
  const key = Buffer.from(API_KEY, 'utf8'); // API v3 密钥即 AES 密钥（32 字节）

  // 解码 Base64 → 分离 ciphertext 和 auth tag（GCM tag 在最后 16 字节）
  const buf = Buffer.from(ciphertext, 'base64');
  const authTag = buf.subarray(buf.length - 16);    // 最后 16 字节 = GCM 认证标签
  const encrypted = buf.subarray(0, buf.length - 16); // 前面 = 密文

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(nonce, 'utf8')
  );
  decipher.setAuthTag(authTag);

  if (associatedData) {
    decipher.setAAD(Buffer.from(associatedData, 'utf8'));
  }

  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

// ── 生成激活码（使用 wechat-pay.js 共享函数，与客户端 recovery.js 同算法） ──
// generateActivationCode 已从 ../lib/wechat-pay 引入

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // 0. 读取原始 body（验签需要原始字符串）
    const rawBody = typeof req.body === 'string'
      ? req.body
      : JSON.stringify(req.body);

    // 1. 验证微信签名（防伪造回调）
    const signatureValid = verifyNotifySignature(req.headers, rawBody);
    if (!signatureValid) {
      return res.status(401).json({ code: 'FAIL', message: '签名验证失败' });
    }

    const notifyData = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body;

    // 2. 解密 resource
    if (!notifyData.resource) {
      return res.status(400).json({ code: 'FAIL', message: '缺少 resource' });
    }

    const { ciphertext, nonce, associated_data } = notifyData.resource;
    const decrypted = decryptResource(ciphertext, nonce, associated_data || '');

    // 3. 检查支付状态
    if (decrypted.trade_state !== 'SUCCESS') {
      // 非成功状态不处理（微信可能重复通知 pending/fail）
      return res.status(200).json({ code: 'SUCCESS', message: 'OK' });
    }

    const outTradeNo = decrypted.out_trade_no;

    // 4. 查 Supabase — 避免重复处理
    const { data: existing } = await supabase
      .from('orders')
      .select('id, status')
      .eq('out_trade_no', outTradeNo)
      .single();

    if (!existing) {
      // 订单不存在（可能数据库问题），返回成功避免微信重复通知
      return res.status(200).json({ code: 'SUCCESS', message: 'OK' });
    }

    if (existing.status === 'paid') {
      // 已处理过，幂等返回成功
      return res.status(200).json({ code: 'SUCCESS', message: 'OK' });
    }

    // 5. 更新订单状态
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        wechat_txn_id: decrypted.transaction_id,
      })
      .eq('out_trade_no', outTradeNo);

    if (updateError) {
      return res.status(500).json({ code: 'FAIL', message: '数据库错误' });
    }

    // 6. 生成激活码
    let plan = 'unknown';
    let topicId = null;
    if (decrypted.attach) {
      try {
        const attach = JSON.parse(decrypted.attach);
        plan = attach.plan || 'unknown';
        topicId = attach.topicId || null;
      } catch { /* attach 解析失败，使用默认值 */ }
    }

    const code = generateActivationCode(plan, topicId);
    await supabase.from('activation_codes').insert({
      code,
      plan,
      topic_id: topicId,
      order_id: existing.id,
    });

    // 7. 返回成功给微信（不返回成功微信会重复通知）
    return res.status(200).json({ code: 'SUCCESS', message: 'OK' });
  } catch (err) {
    // 捕获异常但仍返回 200 给微信，避免微信持续重试
    return res.status(200).json({ code: 'FAIL', message: err.message });
  }
};
