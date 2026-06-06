/**
 * 微信支付 Native 支付工具库
 * 使用 API v3 规范（RSA 签名 + JSON）
 *
 * 环境变量：
 *   WECHAT_MCH_ID              商户号
 *   WECHAT_API_KEY             API v3 密钥（32 字符，也用作 AES 回调解密）
 *   WECHAT_CERT_SERIAL_NO      商户 API 证书序列号（用于请求签名）
 *   WECHAT_PRIVATE_KEY         商户 API 私钥（PEM 格式，用于请求签名）
 *   WECHAT_PLATFORM_CERT       微信支付平台证书（PEM 格式，用于回调验签）
 *   WECHAT_PLATFORM_CERT_SNO   微信支付平台证书序列号（用于匹配回调头）
 *   WECHAT_NOTIFY_URL          支付结果通知地址
 */

const crypto = require('crypto');
const https = require('https');

// ── 配置（从环境变量读取） ──
const MCH_ID = process.env.WECHAT_MCH_ID;
const API_KEY = process.env.WECHAT_API_KEY;
const CERT_SERIAL_NO = process.env.WECHAT_CERT_SERIAL_NO;
const PRIVATE_KEY = (process.env.WECHAT_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const NOTIFY_URL = process.env.WECHAT_NOTIFY_URL;

// 平台证书（用于验证微信回调签名）
const PLATFORM_CERT = (process.env.WECHAT_PLATFORM_CERT || '').replace(/\\n/g, '\n');
const PLATFORM_CERT_SNO = process.env.WECHAT_PLATFORM_CERT_SNO;

// 缓存解析后的平台公钥
let _platformPublicKey = null;
function getPlatformPublicKey() {
  if (_platformPublicKey) return _platformPublicKey;
  if (!PLATFORM_CERT) {
    throw new Error('WECHAT_PLATFORM_CERT 未配置');
  }
  // 从 PEM 证书中提取公钥
  _platformPublicKey = crypto.createPublicKey({
    key: PLATFORM_CERT,
    format: 'pem',
  });
  return _platformPublicKey;
}

// ── 生成商户订单号 ──
function generateOrderNo() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `CC${ts}${rand}`;
}

// ── API v3 签名（RSA-SHA256） ──
function sign(method, path, body) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const bodyStr = body ? JSON.stringify(body) : '';

  // 构建签名串
  const signStr = `${method}\n${path}\n${timestamp}\n${nonce}\n${bodyStr}\n`;

  const signature = crypto
    .createSign('RSA-SHA256')
    .update(signStr)
    .sign(PRIVATE_KEY, 'base64');

  // 构建 Authorization 头
  const auth = `WECHATPAY2-SHA256-RSA2048 mchid="${MCH_ID}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${CERT_SERIAL_NO}",signature="${signature}"`;

  return { Authorization: auth, timestamp, nonce };
}

// ── 发送 HTTPS 请求 ──
function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'ClaudeCode-Learning/1.0',
      ...sign(method, path, body),
    };

    const req = https.request(
      {
        hostname: 'api.mch.weixin.qq.com',
        path: path,
        method: method,
        headers: headers,
        timeout: 10000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve({ status: res.statusCode, data: result });
          } catch {
            resolve({ status: res.statusCode, data: data });
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('微信支付请求超时'));
    });
    req.on('error', reject);

    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ── 统一下单（Native 支付） ──
async function createNativeOrder({ outTradeNo, description, amount, plan, topicId }) {
  const body = {
    appid: '', // Native 支付不需要 appid（使用服务商模式留空）
    mchid: MCH_ID,
    description: description || 'Claude Code 学习课程',
    out_trade_no: outTradeNo,
    notify_url: NOTIFY_URL,
    amount: {
      total: amount, // 单位：分
      currency: 'CNY',
    },
    attach: JSON.stringify({ plan, topicId }), // 附加数据，回调时原样返回
  };

  const { status, data } = await request('POST', '/v3/pay/transactions/native', body);

  if (status === 200 && data.code_url) {
    return { success: true, codeUrl: data.code_url, orderNo: outTradeNo };
  }

  return {
    success: false,
    error: data.message || '下单失败',
    detail: data,
  };
}

// ── 按订单号查询 ──
async function queryOrder(outTradeNo) {
  const path = `/v3/pay/transactions/out-trade-no/${outTradeNo}?mchid=${MCH_ID}`;
  const { status, data } = await request('GET', path);

  if (status === 200) {
    return {
      success: true,
      tradeState: data.trade_state,
      txnId: data.transaction_id,
      amount: data.amount?.total,
      payer: data.payer?.openid,
    };
  }

  return { success: false, tradeState: 'NOT_FOUND' };
}

// ── 验证回调签名 ──
// 微信支付使用商户 API 私钥对请求签名（RSA-SHA256 + PKCS1）
// 回调通知使用微信平台私钥签名 → 用平台证书公钥验签（RSA-SHA256 + PKCS1）
function verifyNotifySignature(headers, body) {
  const timestamp = headers['wechatpay-timestamp'];
  const nonce = headers['wechatpay-nonce'];
  const signature = headers['wechatpay-signature'];
  const certSerial = headers['wechatpay-serial'];

  // 1. 验证书序列号（平台证书序列号，非商户证书）
  if (!PLATFORM_CERT_SNO || certSerial !== PLATFORM_CERT_SNO) {
    return false;
  }

  // 2. 构建验签串（与请求签名格式一致）
  const signStr = `${timestamp}\n${nonce}\n${body}\n`;

  // 3. 用微信平台公钥验签（RSA-SHA256，PKCS1 填充）
  try {
    const platformKey = getPlatformPublicKey();
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(signStr);

    return verify.verify(
      {
        key: platformKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      signature,
      'base64'
    );
  } catch {
    return false;
  }
}

// ── 激活码生成（与 recovery.js 同算法，保证客户端可校验） ──
// 格式: CC-{typeChar}{topicChar}{random2}-{check4}  例: CC-A0XK-W9M3
// 客户端 verifyActivationCode() 通过 checksum 自校验，无需查数据库
const ACT_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ACT_SALT = 0xCC1E4;

// Topic 顺序必须与 assets/js/nav.js 中 TOPIC_ORDER 完全一致
const TOPIC_ORDER = [
  'pc-basics', 'open-ps', 'install-cc', 'first-chat', 'file-basics',
  'troubleshoot', 'intro', 'plan', 'shortcuts', 'convo', 'init', 'workflow',
];

function topicToChar(topicId) {
  const idx = TOPIC_ORDER.indexOf(topicId);
  return idx >= 0 ? ACT_CHARS[idx + 1] : 'X';
}

function computeCheck(prefix) {
  let hash = ACT_SALT;
  for (let i = 0; i < prefix.length; i++) {
    hash = ((hash << 5) - hash) + prefix.charCodeAt(i);
    hash = hash | 0;
  }
  let result = '';
  for (let j = 0; j < 4; j++) {
    result += ACT_CHARS[Math.abs((hash >> (j * 5)) % ACT_CHARS.length)];
  }
  return result;
}

function generateActivationCode(plan, topicId) {
  const typeChar = plan === 'all' ? 'A' : 'S';
  const topicChar = plan === 'all' ? '0' : topicToChar(topicId);

  // 用 crypto.randomBytes 替代 Math.random（服务端安全随机）
  const randBuf = crypto.randomBytes(2);
  const random = ACT_CHARS[randBuf[0] % ACT_CHARS.length]
               + ACT_CHARS[randBuf[1] % ACT_CHARS.length];

  const prefix = 'CC-' + typeChar + topicChar + random;
  const check = computeCheck(prefix);
  return prefix + '-' + check;
}

module.exports = {
  generateOrderNo,
  createNativeOrder,
  queryOrder,
  verifyNotifySignature,
  generateActivationCode,
};
