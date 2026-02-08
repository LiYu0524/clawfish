# clawfish

Clawfish 是一个简易平台落地页模板，目标是完成两件事：

- 用户快速注册
- 用户转发邀请链接拉新

## Project Structure

```
clawfish/
├─ index.html
├─ assets/
│  ├─ styles.css
│  └─ main.js
└─ README.md
```

## Local Preview

直接用浏览器打开 `index.html` 即可预览，或执行：

```bash
python3 -m http.server 8080
```

然后访问 `http://localhost:8080`。

## How To Customize

- 改品牌名与文案：`index.html`
- 改视觉风格：`assets/styles.css`
- 改注册/邀请逻辑：`assets/main.js`
