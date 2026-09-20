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

    // Automatically load live membership plans from database onto homepage
    loadPublicPlans();
});

// Dynamic Membership Plans Loader
async function loadPublicPlans() {
    const grid = document.getElementById("publicPlansGrid");
    if (!grid) return;

    try {
        const res = await fetch(`${API_BASE}/auth/plans`);
        const data = await res.json();
        const plans = data.plans || (Array.isArray(data) ? data : []);

        if (!plans || plans.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 30px;">
                    <h3>No plans available currently</h3>
                    <p style="margin-top: 6px; font-size: 13px;">Please check back soon or visit the gym reception!</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = plans.map((p, index) => {
            const isFeatured = index === 1 || p.durationInMonths === 3 || p.durationInMonths === 6;
            const features = Array.isArray(p.features) ? p.features : (p.features ? p.features.split(',') : []);
            
            return `
                <div class="card plan-card ${isFeatured ? 'featured-plan' : ''}">
                    ${isFeatured ? '<span class="plan-tag">POPULAR</span>' : ''}
                    <h3>${p.planName}</h3>
                    <div class="plan-price">₹${Number(p.price).toLocaleString('en-IN')} <span>/ ${p.durationInMonths} ${p.durationInMonths === 1 ? 'Month' : 'Months'}</span></div>
                    <ul class="plan-list">
                        ${features.length > 0 
                            ? features.map(f => `<li>${f.trim()}</li>`).join('') 
                            : (p.description ? `<li>${p.description}</li>` : '<li>Full Gym Access</li><li>Locker & Shower Facilities</li>')}
                    </ul>
                    <button type="button" onclick="openLoginModal('member')" class="${isFeatured ? 'btn-primary' : 'btn-card'}" style="${isFeatured ? 'width: 100%;' : ''}">Join at Reception</button>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error("Error loading public plans:", err);
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 20px;">
                <p>Unable to load membership plans. Please refresh or contact gym reception.</p>
            </div>
        `;
    }
}