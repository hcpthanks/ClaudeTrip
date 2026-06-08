'use strict';

/* ═══════════════════════════════════════════════════════
   激活码云端校验 — 腾讯云 SCF 云函数

   部署方式：上传到腾讯云 SCF，API 网关触发器
   存储：COS Bucket，文件 activations.json 记录所有激活

   每个激活码最多 3 台设备激活，超过需联系客服
   ═══════════════════════════════════════════════════════ */

const COS = require('cos-nodejs-sdk-v5');

// ══════ 配置 ══════
const BUCKET = process.env.COS_BUCKET;       // COS 存储桶名，如 cc-activation-1250000000
const REGION = process.env.COS_REGION;       // COS 地域，如 ap-guangzhou
const MAX_ACTIVATIONS = 3;                   // 每个码最多激活设备数
const SECRET_SALT = 0xCC1E4;
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// ══════ 激活码校验（与 recovery.js 算法一致）══════
function verifyChecksum(code) {
  code = code.toUpperCase().trim();

  // v3 格式：CC-SXXX-YYYY-ZZZZ（16字符）
  var parts = code.match(
    /^CC-([SA])([A-HJ-NP-Z2-9]{3})([A-HJ-NP-Z2-9]{4})-([A-HJ-NP-Z2-9]{4})$/
  );
  if (!parts) return null;

  var prefix = 'CC-' + parts[1] + parts[2] + parts[3];

  // 校验和
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

  return {
    type: parts[1] === 'A' ? 'all' : 'single',
    code: code
  };
}

// ══════ COS 读写 ══════
function getCOSClient() {
  return new COS({
    SecretId: process.env.TENCENTCLOUD_SECRETID,
    SecretKey: process.env.TENCENTCLOUD_SECRETKEY,
    SessionToken: process.env.TENCENTCLOUD_SESSIONTOKEN
  });
}

function readActivations() {
  return new Promise(function (resolve, reject) {
    var cos = getCOSClient();
    cos.getObject({
      Bucket: BUCKET,
      Region: REGION,
      Key: 'activations.json'
    }, function (err, data) {
      if (err) {
        // 文件不存在 → 首次启动，返回空对象
        if (err.statusCode === 404 || err.code === 'NoSuchKey') {
          return resolve({});
        }
        return reject(err);
      }
      try {
        resolve(JSON.parse(data.Body.toString()));
      } catch (e) {
        resolve({});
      }
    });
  });
}

function writeActivations(data) {
  return new Promise(function (resolve, reject) {
    var cos = getCOSClient();
    cos.putObject({
      Bucket: BUCKET,
      Region: REGION,
      Key: 'activations.json',
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json'
    }, function (err, result) {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

// ══════ 主处理 ══════
exports.main_handler = async function (event, context) {
  // 设置 CORS 头
  var headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // OPTIONS 预检请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: headers, body: '' };
  }

  try {
    // 解析请求体
    var body;
    if (typeof event.body === 'string') {
      body = JSON.parse(event.body);
    } else {
      body = event.body;
    }

    var code = (body.code || '').toUpperCase().trim();
    var fingerprint = (body.fingerprint || 'unknown').substring(0, 64);

    if (!code) {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({ ok: false, error: '请提供激活码' })
      };
    }

    // 1. 校验激活码格式
    var valid = verifyChecksum(code);
    if (!valid) {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({ ok: false, error: '激活码无效' })
      };
    }

    // 2. 读激活记录
    var records = await readActivations();
    var entry = records[code] || {
      count: 0,
      maxAllowed: MAX_ACTIVATIONS,
      devices: [],
      type: valid.type,
      firstActivated: null,
      lastActivated: null
    };

    // 3. 检查是否同一设备已激活过
    var existingDevice = entry.devices.find(function (d) {
      return d.fp === fingerprint;
    });

    if (existingDevice) {
      // 同一设备 → 允许（可能换浏览器/清缓存后恢复）
      existingDevice.time = new Date().toISOString();
      await writeActivations(records);
      return {
        statusCode: 200,
        headers: headers,
        body: JSON.stringify({
          ok: true,
          type: valid.type,
          remaining: entry.maxAllowed - entry.count,
          message: '设备已认证，恢复成功'
        })
      };
    }

    // 4. 新设备 → 检查是否超限
    if (entry.count >= entry.maxAllowed) {
      return {
        statusCode: 403,
        headers: headers,
        body: JSON.stringify({
          ok: false,
          error: '该激活码已超过激活次数限制（' + entry.maxAllowed + '台设备）。如需更多设备，请联系客服 hcpthanks@163.com',
          count: entry.count,
          maxAllowed: entry.maxAllowed
        })
      };
    }

    // 5. 记录新设备
    entry.count++;
    entry.devices.push({
      fp: fingerprint,
      time: new Date().toISOString()
    });
    if (!entry.firstActivated) {
      entry.firstActivated = new Date().toISOString();
    }
    entry.lastActivated = new Date().toISOString();
    records[code] = entry;

    await writeActivations(records);

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        ok: true,
        type: valid.type,
        remaining: entry.maxAllowed - entry.count,
        message: '激活成功！可在 ' + entry.maxAllowed + ' 台设备上使用'
      })
    };

  } catch (err) {
    console.error('Activation error:', err);
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({
        ok: false,
        error: '服务暂时不可用，请稍后重试。如持续失败请联系 hcpthanks@163.com'
      })
    };
  }
};
