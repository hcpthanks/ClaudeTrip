/**
 * GET /api/recover-code?orderNo=xxx
 * 激活码丢失恢复 — 用订单号查询激活码
 *
 * 安全说明：
 * - 激活码自身含 checksum，不可伪造
 * - 订单号格式 CC{timestamp}{random}，外部难以猜测
 * - 仅返回已支付的订单
 */
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || 'https://hcpthanks.github.io';
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'GET') return res.status(405).json({ error: '仅支持 GET' });

  try {
    const orderNo = req.query.orderNo;
    if (!orderNo) {
      return res.status(400).json({ error: '缺少 orderNo 参数' });
    }

    // 基本格式校验
    if (!/^CC[A-Z0-9]{10,14}$/.test(orderNo)) {
      return res.status(400).json({ error: '无效的订单号格式' });
    }

    // 查订单 → 查激活码
    const { data: order } = await supabase
      .from('orders')
      .select('id, status, plan, topic_id')
      .eq('out_trade_no', orderNo)
      .single();

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.status !== 'paid') {
      return res.status(404).json({ error: '该订单尚未支付' });
    }

    const { data: codeRow } = await supabase
      .from('activation_codes')
      .select('code')
      .eq('order_id', order.id)
      .single();

    if (!codeRow) {
      return res.status(404).json({ error: '激活码未生成，请联系客服' });
    }

    const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || 'https://hcpthanks.github.io';
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    return res.status(200).json({
      code: codeRow.code,
      plan: order.plan,
      topicId: order.topic_id || null,
    });
  } catch (err) {
    return res.status(500).json({ error: '服务器错误' });
  }
};
