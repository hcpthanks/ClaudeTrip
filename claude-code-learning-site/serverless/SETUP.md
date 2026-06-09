# 激活码云端校验 — 腾讯云部署指南

## 架构

```
客户 → recover.html → API 网关 → SCF 云函数 → COS 存储（activations.json）
                        ↑ HTTP 层     ↑ 校验激活码
                                      ↑ 检查设备数 < 2
                                      ↑ 记录新设备
```

## 第一步：创建 COS 存储桶

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 搜索"对象存储 COS" → 进入
3. 点击 **创建存储桶**
   - 名称：`cc-activation`（或任意名，记下完整名称如 `cc-activation-1253632363`）
   - 地域：选 **广州**（推荐，与 API 网关同地域）
   - 访问权限：**私有读写**
4. 创建后记住：**存储桶名称** 和 **地域代码**（如 `ap-guangzhou`）

## 第二步：创建 SCF 云函数

1. 搜索"云函数 SCF" → 进入
2. 点击 **新建函数**
   - 函数类型：**事件函数**
   - 函数名称：`cc-activation-verify`
   - 运行环境：**Node.js 18.x**
   - 地域：**与 COS 相同地域**
3. 函数代码 → 上传方式选 **在线编辑**
4. 把 `serverless/activate/index.js` 的内容粘贴进去
5. 往下滚动 → **环境变量**：
   | 变量名 | 值 | 说明 |
   |--------|-----|------|
   | `COS_BUCKET` | `cc-activation-1253632363` | 第一步的完整桶名 |
   | `COS_REGION` | `ap-guangzhou` | 第一步的地域代码 |
6. 点击 **完成**

## 第三步：配置 SCF 访问 COS 的权限

不需要手动配 SecretId/SecretKey。SCF 执行角色会自动注入临时密钥。

1. 在函数详情页 → **函数配置** → **运行角色**
2. 如果还没有角色，点"新建角色"→ 选择"云函数 SCF"
3. 点击角色名进入 CAM 控制台 → **添加权限策略**
4. 搜索 `QcloudCOSFullAccess` → 勾选 → 确定
5. （生产环境建议：改为只授权特定 Bucket 的读写，不用 FullAccess）

## 第四步：创建 API 网关触发器

> ⚠️ 不用 Function URL（不稳定）。用独立 API 网关产品。

1. 搜索"API 网关" → 进入
2. 点击 **新建服务**
   - 服务名称：`cc-activation-api`
   - 前端类型：HTTP
   - 地域：与 SCF/COS 相同
3. 进入刚创建的服务 → **管理 API** → **新建 API**
   - API 名称：`activate`
   - 请求路径：`/activate`
   - 请求方法：`POST`
   - 后端类型：**云函数 SCF**
   - 云函数：选择 `cc-activation-verify`
   - 超时时间：10 秒
   - 鉴权：**免鉴权**
4. 创建后返回到 API 列表 → 点击 `/activate` → **编辑 CORS**
   - 勾选 **启用 CORS**
   - Access-Control-Allow-Origin：`*`
   - Allow-Methods：`POST, OPTIONS`
   - Allow-Headers：`Content-Type`
5. 发布服务：点 **发布** → 发布环境选 `release`
6. 复制 **API 网关访问路径**（格式：`https://service-xxx-xxxxxxxx.gz.apigw.tencentcs.com/release`）

## 第五步：更新前端 API 地址

1. 编辑 `pay/recover.html`
2. 找到第 119 行附近的：
   ```javascript
   var API_BASE = 'https://your-api-gateway-url.apigw.tencentcs.com/release';
   ```
3. 替换为第四步获取的实际 API 网关地址
4. 推送到 GitHub Pages

## 第六步：测试

### 测试 1：正常激活（首次设备）
```
POST https://service-xxx-xxxxxxxx.gz.apigw.tencentcs.com/release/activate
Content-Type: application/json

{
  "code": "CC-SXXX-YYYY-ZZZZ",
  "fingerprint": "test-device-001"
}
```

期望返回：
```json
{ "ok": true, "type": "single", "remaining": 1, "message": "激活成功！可在 2 台设备上使用" }
```

### 测试 2：同一设备再次激活（清缓存场景）
用相同 `fingerprint` 再发一次 → 应返回 `ok: true`（同设备不计数，`remaining` 不变）

### 测试 3：第二台设备激活
换一个新的 `fingerprint` → 应返回：
```json
{ "ok": true, "type": "single", "remaining": 0, "message": "激活成功！可在 2 台设备上使用" }
```

### 测试 4：超限拒绝（第三台设备）
再换一个全新的 `fingerprint` → 应返回：
```json
{ "ok": false, "error": "该激活码已超过激活次数限制（2台设备）。如需解绑旧设备，请发邮件至 hcpthanks@163.com" }
```

## 第七步：人工解绑（客服操作）

当用户换设备且 2 名额已满时：

1. 登录腾讯云 COS 控制台 → 进入 `cc-activation-1253632363` 桶
2. 找到 `activations.json` → 下载
3. 找到对应激活码的 entry → 清空 `devices` 数组 → `count` 改为 0
4. 上传覆盖
5. 告知用户重新激活

（后续可加管理后台一键解绑，当前手动操作）

---

## 费用

| 服务 | 免费额度 | 预估月用量 | 月费 |
|------|----------|------------|------|
| SCF | 100 万次调用/月 | < 1000 | ¥0 |
| COS | 50 GB 存储 | < 1 KB | ¥0 |
| API 网关 | 100 万次/月 | < 1000 | ¥0 |

**总计：¥0/月**

---

## 故障恢复

如果云端不可达，recovery.js 会自动**降级为本地校验**，不会阻塞已付费用户：

```javascript
// recovery.js 内置降级逻辑
.catch(function (err) {
  console.warn('[激活] 云端不可达，降级为本地校验:', ...);
  window.applyActivationCode(localResult);  // 仍可解锁
  callback({ ok: true, ... });
});
```

这在云端故障时是个安全网——优先保证已付费用户能看课。

---

## 设备指纹说明

设备指纹算法使用浏览器和硬件特征生成：
- 屏幕尺寸 + 色深
- 语言 + 时区
- CPU 核心数
- 操作系统平台
- 浏览器 User-Agent

清浏览器缓存**不影响**以上任何值，所以同设备回来能被识别为同一台。
不同设备（如 PC vs iPad）生成不同指纹，会占用新名额。
