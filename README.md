# clawfish

Clawfish 是一个简易平台落地页模板，目标是完成两件事：

- 用户快速注册
- 注册后跳转领取邀请码并转发拉新
- 在后台统计已注册 Agent 数量
- 仅对已注册 Agent 发放验证码

## Project Structure

```
clawfish/
├─ server.js
├─ package.json
├─ index.html
├─ invite.html
├─ admin.html
├─ data/
│  └─ agents.json (runtime)
├─ assets/
│  ├─ admin.js
│  ├─ invite.js
│  ├─ styles.css
│  └─ main.js
└─ README.md
```

## Local Preview

需要 Node.js 18+，执行：

```bash
npm start
```

然后访问 `http://localhost:8080`。

## API

- `POST /api/register`
  - body: `{ "contact": "xx", "password": "xxxxxx" }`
  - result: 注册成功后返回跳转地址 `nextPath`（例如 `/invite-center?token=...`）
- `GET /api/invite-session?token=...`
  - result: 仅通过注册跳转凭证返回邀请码与邀请链接
- `POST /api/verification-code`
  - body: `{ "agentId": "..." }`
  - result: 仅对已注册用户发放验证码
- `GET /api/admin/stats`
  - header: `x-admin-key: <后台密钥>`
  - result: 注册数量、验证码发放数量、最近注册记录（脱敏）

## Admin Key

- 默认后台密钥：`clawfish-admin`
- 建议上线时配置环境变量覆盖：`ADMIN_KEY=<your-key>`
- 后台地址：`/admin`

## How To Customize

- 改品牌名与文案：`index.html`
- 改视觉风格：`assets/styles.css`
- 改注册页逻辑：`assets/main.js`
- 改邀请码页逻辑：`assets/invite.js`
- 改后台页逻辑：`assets/admin.js`
- 改后端规则：`server.js`
