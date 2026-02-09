const http = require("http");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const HOST = "0.0.0.0";
const PORT = Number(process.env.PORT || 8080);
const ADMIN_KEY = process.env.ADMIN_KEY || "clawfish-admin";
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "agents.json");
const PUBLIC_DIR = __dirname;
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ agents: [] }, null, 2), "utf8");
  }
}

function loadData() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed.agents || !Array.isArray(parsed.agents)) {
    return { agents: [] };
  }
  return parsed;
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sendFile(res, filePath) {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const content = fs.readFileSync(filePath);
  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": content.length
  });
  res.end(content);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 1024 * 1024) {
        reject(new Error("Request body is too large."));
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("Invalid JSON body."));
      }
    });

    req.on("error", reject);
  });
}

function createInviteCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

function createVerificationCode() {
  const value = Math.floor(100000 + Math.random() * 900000);
  return String(value);
}

function createInviteAccessToken() {
  return crypto.randomBytes(20).toString("hex");
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function getBaseUrl(req) {
  const protocol = req.headers["x-forwarded-proto"] || "http";
  return `${protocol}://${req.headers.host}`;
}

function maskContact(contact) {
  if (contact.includes("@")) {
    const [name, domain] = contact.split("@");
    const shownName = `${name.slice(0, 2)}***`;
    return `${shownName}@${domain}`;
  }

  if (contact.length >= 7) {
    return `${contact.slice(0, 3)}****${contact.slice(-2)}`;
  }

  return `${contact.slice(0, 2)}***`;
}

function handleAdminStats(req, res) {
  const adminKey = String(req.headers["x-admin-key"] || "");
  if (!adminKey || adminKey !== ADMIN_KEY) {
    sendJson(res, 401, { message: "后台密钥无效。" });
    return;
  }

  const data = loadData();
  const verificationIssuedAgents = data.agents.filter((item) => item.verificationCode).length;
  const recentAgents = data.agents
    .slice(-10)
    .reverse()
    .map((item) => ({
      contactMasked: maskContact(item.contact),
      registeredAt: item.registeredAt
    }));

  sendJson(res, 200, {
    registeredAgents: data.agents.length,
    verificationIssuedAgents,
    recentAgents
  });
}

async function handleRegister(req, res) {
  let payload;
  try {
    payload = await parseJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { message: error.message });
    return;
  }

  const contact = String(payload.contact || "").trim();
  const password = String(payload.password || "").trim();
  const referralCode = String(payload.inviteCode || "").trim();

  if (!contact) {
    sendJson(res, 400, { message: "联系方式不能为空。" });
    return;
  }
  if (password.length < 6) {
    sendJson(res, 400, { message: "密码至少 6 位。" });
    return;
  }

  const data = loadData();
  const existingAgent = data.agents.find((agent) => agent.contact === contact);
  if (existingAgent) {
    sendJson(res, 409, { message: "该联系方式已注册。" });
    return;
  }

  const inviteCode = createInviteCode(8);
  const inviteAccessToken = createInviteAccessToken();
  const agent = {
    agentId: crypto.randomUUID(),
    contact,
    passwordHash: hashPassword(password),
    inviteCode,
    inviteAccessToken,
    inviteTokenIssuedAt: new Date().toISOString(),
    referredByCode: referralCode,
    verificationCode: "",
    verificationIssuedAt: "",
    registeredAt: new Date().toISOString()
  };
  data.agents.push(agent);
  saveData(data);

  sendJson(res, 201, {
    message: "注册成功。",
    nextPath: `/invite-center?token=${agent.inviteAccessToken}`
  });
}

function handleInviteSession(req, res, requestUrl) {
  const token = String(requestUrl.searchParams.get("token") || "").trim();
  if (!token) {
    sendJson(res, 400, { message: "缺少邀请码访问凭证。" });
    return;
  }

  const data = loadData();
  const agent = data.agents.find((item) => item.inviteAccessToken === token);
  if (!agent) {
    sendJson(res, 404, { message: "邀请码访问凭证无效，请重新注册。" });
    return;
  }

  sendJson(res, 200, {
    agentId: agent.agentId,
    inviteCode: agent.inviteCode,
    inviteLink: `${getBaseUrl(req)}/invite/${agent.inviteCode}`
  });
}

async function handleVerificationCode(req, res) {
  let payload;
  try {
    payload = await parseJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { message: error.message });
    return;
  }

  const agentId = String(payload.agentId || "").trim();
  if (!agentId) {
    sendJson(res, 400, { message: "缺少 agentId。" });
    return;
  }

  const data = loadData();
  const agent = data.agents.find((item) => item.agentId === agentId);
  if (!agent) {
    sendJson(res, 404, { message: "未找到该注册用户，请先注册。" });
    return;
  }

  agent.verificationCode = createVerificationCode();
  agent.verificationIssuedAt = new Date().toISOString();
  saveData(data);

  sendJson(res, 200, {
    verificationCode: agent.verificationCode,
    issuedAt: agent.verificationIssuedAt
  });
}

function handleStatic(req, res, pathname) {
  if (pathname === "/" || pathname.startsWith("/invite/")) {
    sendFile(res, path.join(PUBLIC_DIR, "index.html"));
    return;
  }

  if (pathname === "/invite-center") {
    sendFile(res, path.join(PUBLIC_DIR, "invite.html"));
    return;
  }

  if (pathname === "/admin") {
    sendFile(res, path.join(PUBLIC_DIR, "admin.html"));
    return;
  }

  if (pathname.startsWith("/assets/")) {
    const relativePath = pathname.replace(/^\/+/, "");
    const normalizedPath = path.normalize(relativePath);
    if (normalizedPath.startsWith("..")) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Forbidden");
      return;
    }
    sendFile(res, path.join(PUBLIC_DIR, normalizedPath));
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = requestUrl.pathname;

  if (req.method === "GET" && pathname === "/api/admin/stats") {
    handleAdminStats(req, res);
    return;
  }

  if (req.method === "GET" && pathname === "/api/invite-session") {
    handleInviteSession(req, res, requestUrl);
    return;
  }

  if (req.method === "POST" && pathname === "/api/register") {
    await handleRegister(req, res);
    return;
  }

  if (req.method === "POST" && pathname === "/api/verification-code") {
    await handleVerificationCode(req, res);
    return;
  }

  if (req.method === "GET") {
    handleStatic(req, res, pathname);
    return;
  }

  res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Method not allowed");
});

ensureDataFile();
server.listen(PORT, HOST, () => {
  console.log(`Clawfish server running on http://${HOST}:${PORT}`);
});
