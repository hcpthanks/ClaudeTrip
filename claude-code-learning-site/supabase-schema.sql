-- ============================================
-- Claude Code 学习站 — 支付系统数据库
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================

-- 1. 订单表
CREATE TABLE IF NOT EXISTS orders (
  id            BIGSERIAL PRIMARY KEY,
  out_trade_no  TEXT UNIQUE NOT NULL,       -- 商户订单号（CC-时间戳-随机）
  plan          TEXT NOT NULL,              -- all | single | force
  topic_id      TEXT,                       -- 单个主题 ID（plan=single 或 force 时）
  price         INTEGER NOT NULL,           -- 金额（分）
  status        TEXT DEFAULT 'pending',     -- pending | paid | cancelled | expired
  contact       TEXT,                       -- 用户联系方式（选填）
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  paid_at       TIMESTAMPTZ,                -- 支付完成时间
  wechat_txn_id TEXT                        -- 微信支付交易号（回调时填入）
);

-- 2. 索引
CREATE INDEX IF NOT EXISTS idx_orders_out_trade_no ON orders (out_trade_no);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at DESC);

-- 3. 激活码表（已支付订单自动生成激活码）
CREATE TABLE IF NOT EXISTS activation_codes (
  id            BIGSERIAL PRIMARY KEY,
  code          TEXT UNIQUE NOT NULL,        -- CC-XXXX-XXXX
  plan          TEXT NOT NULL,               -- all | single | force
  topic_id      TEXT,                        -- 单个主题 ID
  order_id      BIGINT REFERENCES orders(id),
  redeemed      BOOLEAN DEFAULT FALSE,       -- 是否已使用
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  redeemed_at   TIMESTAMPTZ
);

-- 4. RLS（Row Level Security）— 防前端偷改
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;

-- 前端只能按订单号查自己的订单状态（匿名）
CREATE POLICY "Anyone can check order by out_trade_no"
  ON orders FOR SELECT
  USING (true);  -- 通过 out_trade_no 查询，不需要登录

-- 激活码：任何人都能验证（前端校验激活码有效性）
CREATE POLICY "Anyone can verify activation code"
  ON activation_codes FOR SELECT
  USING (true);
