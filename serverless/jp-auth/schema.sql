-- 日语小说站 · 账号与每日阅读额度
-- 在 Cloudflare D1 执行：wrangler d1 execute jp-auth --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,           -- uuid
  email         TEXT UNIQUE NOT NULL,
  created_at    INTEGER NOT NULL,           -- 注册时刻 ms
  trial_ends_at INTEGER NOT NULL,           -- created_at + 72h
  access_until  INTEGER NOT NULL DEFAULT 0  -- 付费到期 ms，0 = 未付费
);

CREATE TABLE IF NOT EXISTS daily (
  user_id     TEXT NOT NULL,
  day         TEXT NOT NULL,                -- YYYY-MM-DD，按 Asia/Shanghai
  seconds     INTEGER NOT NULL DEFAULT 0,   -- 当天累计阅读秒数
  granted_at  INTEGER,                      -- 当天 15 分钟额度的领取时刻
  last_ping   INTEGER,                      -- 上次心跳时刻，用于增量计算
  PRIMARY KEY (user_id, day)
);

CREATE TABLE IF NOT EXISTS login_codes (
  email      TEXT NOT NULL,
  code_hash  TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- 每次请求验证码都记一条，用于按 IP 限频和全局日熔断
CREATE TABLE IF NOT EXISTS send_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ip         TEXT NOT NULL,               -- CF-Connecting-IP，取不到时记 'unknown'
  created_at INTEGER NOT NULL             -- 请求时刻 ms
);

CREATE INDEX IF NOT EXISTS idx_codes_email ON login_codes (email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_day ON daily (day);
CREATE INDEX IF NOT EXISTS idx_send_log_ip ON send_log (ip, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_send_log_time ON send_log (created_at);
