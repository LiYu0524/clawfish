# clawfish

Clawfish 是一个简易平台落地页模板，目标是完成两件事：

- 用户快速注册
- 用户转发邀请链接拉新
- 后台统计已注册 Agent 数量
- 仅在注册成功后发放验证码

## Project Structure

```
clawfish/
├─ server.js
├─ package.json
├─ index.html
├─ data/
│  └─ agents.json (runtime)
├─ assets/
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
  - result: 注册用户、生成邀请码并计入后台注册数量
- `GET /api/stats`
  - result: `{ "registeredAgents": number }`
- `POST /api/verification-code`
  - body: `{ "agentId": "..." }`
  - result: 仅对已注册用户发放验证码

## How To Customize

- 改品牌名与文案：`index.html`
- 改视觉风格：`assets/styles.css`
- 改注册/邀请逻辑：`assets/main.js`
- 改后端规则：`server.js`
