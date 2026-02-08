const registerForm = document.querySelector("#register-form");
const registerFeedback = document.querySelector("#register-feedback");
const agentCountEl = document.querySelector("#agent-count");
const inviteCodeEl = document.querySelector("#invite-code");
const inviteLinkEl = document.querySelector("#invite-link");
const verificationCodeEl = document.querySelector("#verification-code");
const inviteFeedback = document.querySelector("#invite-feedback");
const copyBtn = document.querySelector("#copy-link-btn");
const shareBtn = document.querySelector("#share-link-btn");
const requestCodeBtn = document.querySelector("#request-code-btn");

function updateInviteInfo(code) {
  const link = `${window.location.origin}/invite/${code}`;
  inviteCodeEl.textContent = code;
  inviteLinkEl.textContent = link;
  return link;
}

function setInviteActionState(enabled) {
  copyBtn.disabled = !enabled;
  shareBtn.disabled = !enabled;
  requestCodeBtn.disabled = !enabled;
}

async function fetchStats() {
  try {
    const response = await fetch("/api/stats");
    if (!response.ok) {
      throw new Error("stats request failed");
    }
    const stats = await response.json();
    agentCountEl.textContent = String(stats.registeredAgents ?? 0);
  } catch (error) {
    agentCountEl.textContent = "N/A";
  }
}

let currentInviteLink = updateInviteInfo("-");
let currentAgentId = "";
setInviteActionState(false);
fetchStats();

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const contact = registerForm.contact.value.trim();
  const password = registerForm.password.value.trim();

  if (!contact || password.length < 6) {
    registerFeedback.textContent = "信息不完整，请检查输入。";
    return;
  }

  registerFeedback.textContent = "注册中...";
  inviteFeedback.textContent = "";

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ contact, password })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || "注册失败");
    }

    currentAgentId = payload.agentId;
    currentInviteLink = updateInviteInfo(payload.inviteCode);
    verificationCodeEl.textContent = "验证码：-";
    setInviteActionState(true);
    registerFeedback.textContent = "注册成功，邀请码已生成。";
    await fetchStats();
  } catch (error) {
    registerFeedback.textContent = error.message || "注册失败，请稍后重试。";
  }
});

copyBtn.addEventListener("click", async () => {
  if (!currentAgentId) {
    inviteFeedback.textContent = "请先完成注册。";
    return;
  }

  try {
    await navigator.clipboard.writeText(currentInviteLink);
    inviteFeedback.textContent = "已复制邀请链接。";
  } catch (error) {
    inviteFeedback.textContent = "复制失败，请手动复制页面中的链接。";
  }
});

shareBtn.addEventListener("click", async () => {
  if (!currentAgentId) {
    inviteFeedback.textContent = "请先完成注册。";
    return;
  }

  const payload = {
    title: "Clawfish 邀请你注册",
    text: "注册后可继续邀请好友，一起加入。",
    url: currentInviteLink
  };

  if (navigator.share) {
    try {
      await navigator.share(payload);
      inviteFeedback.textContent = "已打开系统分享。";
    } catch (error) {
      inviteFeedback.textContent = "已取消分享。";
    }
    return;
  }

  inviteFeedback.textContent = "当前浏览器不支持系统分享，请先复制链接。";
});

requestCodeBtn.addEventListener("click", async () => {
  if (!currentAgentId) {
    inviteFeedback.textContent = "请先完成注册。";
    return;
  }

  inviteFeedback.textContent = "正在领取验证码...";

  try {
    const response = await fetch("/api/verification-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ agentId: currentAgentId })
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || "领取验证码失败");
    }

    verificationCodeEl.textContent = `验证码：${payload.verificationCode}`;
    inviteFeedback.textContent = "验证码已发放。";
  } catch (error) {
    inviteFeedback.textContent = error.message || "领取验证码失败。";
  }
});
