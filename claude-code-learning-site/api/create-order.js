/**
 * POST /api/create-order
 * 创建微信 Native 支付订单，返回 code_url（用于生成二维码）
 */

const { createClient } = require('@supabase/supabase-js');
const { generateOrderNo, createNativeOrder } = require('../lib/wechat-pay');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

// 价格表（单位：分）— 服务端强制，防客户端篡改
const PLAN_PRICES = {
  all: 69900,   // ¥699 永久
  pro: 39900,   // ¥399 3年
  single: 500,  // ¥5
};

// CORS 白名单（生产环境改为实际域名）
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || 'https://hcpthanks.github.io';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: '仅支持 POST' });

  try {
    const { plan, topicId } = req.body;

    // 校验 plan
    const validPlans = Object.keys(PLAN_PRICES);
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: '无效的 plan 参数' });
    }

    // 服务端强制金额（忽略客户端 price，防篡改）
    const amount = PLAN_PRICES[plan];

    const orderNo = generateOrderNo();

    // 生成商品描述
    const descriptions = {
      all: 'Claude Code 学习站 — ¥699 全站永久解锁',
      pro: 'Claude Code 学习站 — ¥399 全站3年解锁',
      single: 'Claude Code 学习站 — 单课解锁',
    };
    const description = descriptions[plan] || 'Claude Code 学习课程';

    // 调微信下单
    const result = await createNativeOrder({
      outTradeNo: orderNo,
      description,
      amount,
      plan,
      topicId: topicId || null,
    });

    if (!result.success) {
      return res.status(500).json({
        error: '支付下单失败',
        detail: result.error,
      });
    }

    // 订单写入 Supabase
    const { error: dbError } = await supabase.from('orders').insert({
      out_trade_no: orderNo,
      plan,
      topic_id: topicId || null,
      price: amount,
      status: 'pending',
    });

    if (dbError) {
      // 订单写入失败不阻塞用户，微信已下单成功
      // 回调时通过 out_trade_no 仍可匹配
    }

    return res.status(200).json({
      success: true,
      orderNo,
      codeUrl: result.codeUrl,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(result.codeUrl)}`,
    });
  } catch (err) {
    return res.status(500).json({ error: '服务器错误', detail: err.message });
  }
};
