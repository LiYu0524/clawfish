const adminForm = document.querySelector("#admin-form");
const adminFeedback = document.querySelector("#admin-feedback");
const registeredCountEl = document.querySelector("#registered-count");
const issuedCountEl = document.querySelector("#issued-count");
const recentCountEl = document.querySelector("#recent-count");
const recentListEl = document.querySelector("#recent-list");

function renderRecentAgents(recentAgents) {
  recentListEl.innerHTML = "";
  if (!recentAgents.length) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "暂无注册记录。";
    recentListEl.appendChild(emptyItem);
    return;
  }

  recentAgents.forEach((item) => {
    const li = document.createElement("li");
    const date = new Date(item.registeredAt);
    const dateText = Number.isNaN(date.getTime()) ? item.registeredAt : date.toLocaleString();
    li.textContent = `${item.contactMasked} · ${dateText}`;
    recentListEl.appendChild(li);
  });
}

adminForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const adminKey = adminForm.adminKey.value.trim();
  if (!adminKey) {
    adminFeedback.textContent = "请输入后台密钥。";
    return;
  }

  adminFeedback.textContent = "加载统计中...";

  try {
    const response = await fetch("/api/admin/stats", {
      method: "GET",
      headers: {
        "x-admin-key": adminKey
      }
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || "读取统计失败。");
    }

    registeredCountEl.textContent = String(payload.registeredAgents);
    issuedCountEl.textContent = String(payload.verificationIssuedAgents);
    recentCountEl.textContent = String(payload.recentAgents.length);
    renderRecentAgents(payload.recentAgents);
    adminFeedback.textContent = "统计已更新。";
  } catch (error) {
    adminFeedback.textContent = error.message || "读取统计失败。";
  }
});
