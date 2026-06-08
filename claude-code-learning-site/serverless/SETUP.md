# 激活码云端校验 — 腾讯云部署指南

## 架构

```
客户 → recover.html → SCF 云函数 → COS 存储（activations.json）
                        ↑ 校验激活码
                        ↑ 检查设备数 < 3
                        ↑ 记录新设备
```

---

## 第一步：创建 COS 存储桶

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 搜索"对象存储 COS" → 进入
3. 点击 **创建存储桶**
   - 名称：`cc-activation`（或任意名）
   - 地域：选 **广州**（或其他国内地域）
   - 访问权限：**私有读写**
4. 创建后记住：**存储桶名称** 和 **所属地域**

---

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
   - `COS_BUCKET` = 第一步的存储桶名称（如 `cc-activation-1250000000`）
   - `COS_REGION` = 第一步的地域代码（如 `ap-guangzhou`）
6. 点击 **完成**

---

## 第三步：配置 API 网关触发器

1. 在函数详情页 → **触发管理** → **创建触发器**
2. 触发方式：**API 网关触发器**
3. API 服务：**新建 API 服务**
   - 服务名称：`cc-activation-api`
   - 前端类型：HTTP
   - 路径：`/activate`
   - 方法：`POST`
   - 鉴权：**免鉴权**
4. 勾选 **启用 CORS**
5. 创建后，复制 **API 网关访问路径**（类似 `https://service-xxx.gz.apigw.tencentcs.com/release`）

---

## 第四步：配置 COS 访问权限

1. 回到 SCF 函数详情页 → **函数配置** → **运行角色**
2. 点击角色名 → **添加权限策略**
3. 搜索 `QcloudCOSFullAccess` → 勾选 → 确定
4. （安全建议：生产环境可改为只授权特定 Bucket 的读写，而不是 FullAccess）

---

## 第五步：更新前端 API 地址

1. 编辑 `pay/recover.html`
2. 找到第 111 行附近的：
   ```javascript
   var API_BASE = 'https://service-xxxxxxxx-xxxxxxxxxx.gz.apigw.tencentcs.com/release';
   ```
3. 替换为第三步获取的实际 API 网关地址
4. 同样编辑 `docs/pay/recover.html`
5. 推送到 GitHub Pages

---

## 第六步：测试

### 测试 1：正常激活
```
POST https://service-xxx.gz.apigw.tencentcs.com/release/activate
Content-Type: application/json

{
  "code": "CC-SXXX-YYYY-ZZZZ",
  "fingerprint": "test-device-001"
}
```

期望返回：
```json
{ "ok": true, "type": "single", "remaining": 2, "message": "激活成功！可在 3 台设备上使用" }
```

### 测试 2：同一设备再次激活
用相同 `fingerprint` 再发一次 → 应返回 `ok: true`（同设备不计数）

### 测试 3：超限拒绝
用不同的 `fingerprint` 发到同一 `code` 累计 3 次 → 第 4 次应返回：
```json
{ "ok": false, "error": "该激活码已超过激活次数限制（3台设备）..." }
```

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
