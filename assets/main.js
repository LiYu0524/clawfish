const registerForm = document.querySelector("#register-form");
const registerFeedback = document.querySelector("#register-feedback");
const inviteCodeEl = document.querySelector("#invite-code");
const inviteLinkEl = document.querySelector("#invite-link");
const inviteFeedback = document.querySelector("#invite-feedback");
const copyBtn = document.querySelector("#copy-link-btn");
const shareBtn = document.querySelector("#share-link-btn");

function makeInviteCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function updateInviteInfo(code) {
  const link = `https://clawfish.app/invite/${code}`;
  inviteCodeEl.textContent = code;
  inviteLinkEl.textContent = link;
  return link;
}

let currentInviteLink = updateInviteInfo(makeInviteCode());

registerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const contact = registerForm.contact.value.trim();
  const password = registerForm.password.value.trim();

  if (!contact || password.length < 6) {
    registerFeedback.textContent = "信息不完整，请检查输入。";
    return;
  }

  const newCode = makeInviteCode();
  currentInviteLink = updateInviteInfo(newCode);
  registerFeedback.textContent = "注册成功，邀请码已生成，可以直接分享。";
  inviteFeedback.textContent = "";
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(currentInviteLink);
    inviteFeedback.textContent = "已复制邀请链接。";
  } catch (error) {
    inviteFeedback.textContent = "复制失败，请手动复制页面中的链接。";
  }
});

shareBtn.addEventListener("click", async () => {
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
