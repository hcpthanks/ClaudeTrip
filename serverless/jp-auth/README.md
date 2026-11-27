# 日语小说站 · 账号与权限服务

Cloudflare Worker + D1。权限结论只由服务端给出，前端拿到的 `state` 只是缓存，用来避免首屏闪一下。

## 状态机

| state | 条件 | 全功能 |
|---|---|---|
| `member` | 注册后 72 小时内 | 是 |
| `daily` | 当天第一次请求就发 15 分钟，还没用完 | 是 |
| `limited` | 当天这 15 分钟已用完 | 否 |
| `paid` | `access_until` 未过期 | 是 |

72 小时结束后，**每个自然日首次请求即赠送 15 分钟**（不需要先读满多少分钟），一天只发一次，按 `Asia/Shanghai` 切日。

未登录用户的「每天 15 分钟」不经过这里，由前端本地记（`jp-guest-day` + `jp-guest-used`），清缓存可重置——这是无账号方案的固有代价。

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/auth/request-code` | `{email}` → 发 6 位验证码。dev 模式下直接返回 `devCode` |
| POST | `/auth/verify` | `{email, code}` → `{token, state, full, remaining, ...}`，首次登录自动建号 |
| POST | `/heartbeat` | 需 `Authorization: Bearer`。累加当天阅读秒数（仅统计用），并触发当天额度的发放 |
| GET | `/entitlement` | 需 `Authorization: Bearer`。只读当前结论 |
| GET | `/health` | 存活检查 |

心跳每 15 秒一次，服务端只认「距上次心跳实际过去多少秒」并截断到 30 秒，客户端谎报无效。

## 本地跑

```bash
cd serverless/jp-auth
npx wrangler d1 execute jp-auth --local --file=schema.sql
npx wrangler dev --port 8787
```

`.dev.vars` 里放 `AUTH_SECRET`（本地随便写，别提交）。dev 模式下 `request-code` 会把验证码直接返回，方便自测。

## 部署

```bash
npx wrangler d1 create jp-auth          # 把返回的 database_id 填进 wrangler.toml
npx wrangler d1 execute jp-auth --remote --file=schema.sql
npx wrangler secret put AUTH_SECRET     # 至少 32 位随机串
npx wrangler deploy
```

部署后配发信。三家都支持，由 `MAIL_MODE` 切换：

| MAIL_MODE | 说明 |
|---|---|
| `dev` | 验证码直接写在接口响应里，**只能本地/临时用** |
| `ses` | 腾讯云 SES（当前生产用） |
| `resend` | Resend |

### 腾讯云 SES（当前方案）

```bash
npx wrangler secret put TENCENT_SECRET_ID
npx wrangler secret put TENCENT_SECRET_KEY
```

`[vars]` 里需要 `SES_REGION`、`MAIL_FROM`，模板审核通过后再填 `SES_TEMPLATE_ID`。

三个坑：

1. **默认没有自定义发送权限**，不填 `SES_TEMPLATE_ID` 会报 `FailedOperation.WithOutPermission`。必须在控制台建模板并审核通过。
2. `Simple.Text` / `Simple.Html` 必须是 **Base64**（UTF-8），传明文报 `InvalidParameterValue.EmailContentIsWrong`。
3. 从控制台复制密钥常带上 `SecretId ` / `SecretKey ` 前缀，代码里 `cleanSecret()` 会自动剥掉。

香港地域不需要域名备案；中国大陆地域要求发信域名有 ICP 备案。

## 前端接入要点

1. `index.js` 的 `ALLOWED_ORIGINS` 要包含实际站点域名（现在已含 `hcpthanks.com`、`www`、`github.io` 和本地预览端口）。
2. 阅读页每 15 秒 `POST /heartbeat`，页面隐藏时停，回到前台立刻补一次。
3. 登录态存 `localStorage`，首屏用缓存的 `state` 先渲染，拿到接口结论再更正。
4. 心跳失败（断网）时按本地缓存继续，恢复后自动重试；断网期间规则会偏松，这是已知取舍。
5. 30 分钟付费提醒由前端按本次会话累计时长触发，服务端不参与。
