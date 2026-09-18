const API_BASE = "/api";

function openLoginModal(suggestedRole = '') {
    const modal = document.getElementById("loginModal");
    if (modal) {
        modal.style.display = "flex";
        const idInput = document.getElementById("customId");
        if (idInput) {
            if (suggestedRole === "owner") idInput.placeholder = "e.g. UDGOWNER-1001";
            else if (suggestedRole === "trainer") idInput.placeholder = "e.g. UDGTRA-1001";
            else if (suggestedRole === "member") idInput.placeholder = "e.g. UDGMEM-1001";
            idInput.focus();
        }
    }
}

function closeLoginModal() {
    const modal = document.getElementById("loginModal");
    if (modal) modal.style.display = "none";
}

window.addEventListener("click", function (e) {
    const modal = document.getElementById("loginModal");
    if (e.target === modal) closeLoginModal();
});

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    if (!loginForm) return;

    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const customId = (document.getElementById("customId")?.value || "").trim();
        const password = (document.getElementById("password")?.value || "").trim();
        const errorBox = document.getElementById("loginError");
        const submitBtn = document.getElementById("loginSubmitBtn");

        console.log("Submitting login for:", customId);

        if (!customId || !password) {
            if (errorBox) {
                errorBox.style.display = "block";
                errorBox.textContent = "Please enter both User ID and Password.";
            }
            return;
        }

        if (errorBox) errorBox.style.display = "none";
        if (submitBtn) {
            submitBtn.textContent = "Signing In...";
            submitBtn.disabled = true;
        }

        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customId: customId,
                    identifier: customId,
                    username: customId,
                    password: password
                })
            });

            const data = await res.json();
            console.log("Login response:", data);

            if (!res.ok) {
                throw new Error(data.message || "Invalid Credentials");
            }

            // Save auth session
            localStorage.setItem("udg_token", data.token);
            localStorage.setItem("currentUser", JSON.stringify(data.user));

            // Role-based redirection
            const role = (data.user && data.user.role) ? data.user.role.toLowerCase() : "";
            if (role === "owner") {
                window.location.href = "owner/owner-dashboard.html";
            } else if (role === "trainer") {
                window.location.href = "trainer/trainer-dashboard.html";
            } else if (role === "member") {
                window.location.href = "member/member-dashboard.html";
            } else {
                window.location.href = "owner/owner-dashboard.html";
            }
        } catch (err) {
            console.error("Login error:", err);
            if (errorBox) {
                errorBox.style.display = "block";
                errorBox.textContent = err.message || "Login failed";
            } else {
                alert(err.message);
            }
        } finally {
            if (submitBtn) {
                submitBtn.textContent = "Sign In";
                submitBtn.disabled = false;
            }
        }
    });
});