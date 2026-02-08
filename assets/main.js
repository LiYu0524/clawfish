const registerForm = document.querySelector("#register-form");
const registerFeedback = document.querySelector("#register-feedback");

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const contact = registerForm.contact.value.trim();
  const password = registerForm.password.value.trim();

  if (!contact || password.length < 6) {
    registerFeedback.textContent = "信息不完整，请检查输入。";
    return;
  }

  registerFeedback.textContent = "注册中...";

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

    registerFeedback.textContent = "注册成功，正在跳转邀请码页面...";
    window.location.assign(payload.nextPath);
  } catch (error) {
    registerFeedback.textContent = error.message || "注册失败，请稍后重试。";
  }
});
