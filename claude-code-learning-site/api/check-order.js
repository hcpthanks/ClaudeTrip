/**
 * GET /api/check-order?orderNo=xxx
 * 前端轮询查订单支付状态
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || 'https://hcpthanks.github.io';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: '仅支持 GET' });

  try {
    const orderNo = req.query.orderNo;
    if (!orderNo) {
      return res.status(400).json({ error: '缺少 orderNo 参数' });
    }

    // 格式校验 — 防遍历（格式: CC + 36进制时间戳 + 6位hex随机）
    if (!/^CC[A-Z0-9]{10,14}$/.test(orderNo)) {
      return res.status(200).json({ status: 'pending' });
    }

    const { data, error } = await supabase
      .from('orders')
      .select('id, status, plan, topic_id, price, paid_at')
      .eq('out_trade_no', orderNo)
      .single();

    if (error || !data) {
      return res.status(200).json({ status: 'pending' });
    }

    if (data.status === 'paid') {
      // 返回激活码
      const { data: codeData } = await supabase
        .from('activation_codes')
        .select('code')
        .eq('order_id', data.id)
        .single();

      return res.status(200).json({
        status: 'paid',
        plan: data.plan,
        topicId: data.topic_id,
        code: codeData?.code || null,
        paidAt: data.paid_at,
      });
    }

    return res.status(200).json({ status: data.status });
  } catch (err) {
    return res.status(500).json({ error: '服务器错误' });
  }
};
