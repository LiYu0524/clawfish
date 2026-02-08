const inviteCodeEl = document.querySelector("#invite-code");
const inviteLinkEl = document.querySelector("#invite-link");
const verificationCodeEl = document.querySelector("#verification-code");
const inviteFeedback = document.querySelector("#invite-feedback");
const copyBtn = document.querySelector("#copy-link-btn");
const shareBtn = document.querySelector("#share-link-btn");
const requestCodeBtn = document.querySelector("#request-code-btn");

function setActionState(enabled) {
  copyBtn.disabled = !enabled;
  shareBtn.disabled = !enabled;
  requestCodeBtn.disabled = !enabled;
}

function getToken() {
  const url = new URL(window.location.href);
  return String(url.searchParams.get("token") || "").trim();
}

function updateInviteUI(inviteCode, inviteLink) {
  inviteCodeEl.textContent = inviteCode;
  inviteLinkEl.textContent = inviteLink;
}

let currentAgentId = "";
let currentInviteLink = "";
setActionState(false);

async function loadInviteSession() {
  const token = getToken();
  if (!token) {
    inviteFeedback.textContent = "缺少访问凭证，请从注册页重新进入。";
    return;
  }

  inviteFeedback.textContent = "加载邀请码中...";

  try {
    const response = await fetch(`/api/invite-session?token=${encodeURIComponent(token)}`);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || "获取邀请码失败。");
    }

    currentAgentId = payload.agentId;
    currentInviteLink = payload.inviteLink;
    updateInviteUI(payload.inviteCode, payload.inviteLink);
    setActionState(true);
    inviteFeedback.textContent = "邀请码已就绪。";
  } catch (error) {
    inviteFeedback.textContent = error.message || "邀请码加载失败。";
  }
}

copyBtn.addEventListener("click", async () => {
  if (!currentInviteLink) {
    inviteFeedback.textContent = "邀请码尚未加载完成。";
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
  if (!currentInviteLink) {
    inviteFeedback.textContent = "邀请码尚未加载完成。";
    return;
  }

  const payload = {
    title: "Clawfish 邀请你注册",
    text: "通过该链接注册后可继续邀请好友。",
    url: currentInviteLink
  };

  if (!navigator.share) {
    inviteFeedback.textContent = "当前浏览器不支持系统分享，请先复制链接。";
    return;
  }

  try {
    await navigator.share(payload);
    inviteFeedback.textContent = "已打开系统分享。";
  } catch (error) {
    inviteFeedback.textContent = "已取消分享。";
  }
});

requestCodeBtn.addEventListener("click", async () => {
  if (!currentAgentId) {
    inviteFeedback.textContent = "请先完成注册并从跳转页进入。";
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
      throw new Error(payload.message || "领取验证码失败。");
    }

    verificationCodeEl.textContent = `验证码：${payload.verificationCode}`;
    inviteFeedback.textContent = "验证码已发放。";
  } catch (error) {
    inviteFeedback.textContent = error.message || "领取验证码失败。";
  }
});

loadInviteSession();
