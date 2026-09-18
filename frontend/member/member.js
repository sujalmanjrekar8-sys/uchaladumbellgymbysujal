const API_BASE = "/api";
let currentToken = localStorage.getItem("udg_token") || localStorage.getItem("uchala_token") || localStorage.getItem("token");
let currentUser = {};
try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("uchala_user") || "{}");
} catch(e) {}

// 1. Guard Check
if (!currentToken || currentUser.role !== "member") {
    alert("Access restricted to Members only.");
    window.location.href = "/login.html";
}

// API Helper
async function fetchAuth(endpoint, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentToken}`,
        ...(options.headers || {})
    };
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
}

// Modal Helpers
function openModal(modalId) {
    document.getElementById(modalId).style.display = "flex";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

window.addEventListener("click", function (e) {
    if (e.target.classList.contains("modal-bg")) {
        e.target.style.display = "none";
    }
});

// Switch Section
function switchSection(sectionName) {
    document.querySelectorAll(".content-section").forEach(s => s.style.display = "none");
    document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));

    const target = document.getElementById(`section-${sectionName}`);
    if (target) target.style.display = "block";

    const btn = Array.from(document.querySelectorAll(".nav-tab")).find(b => 
        b.getAttribute("onclick") && b.getAttribute("onclick").includes(sectionName)
    );
    if (btn) btn.classList.add("active");

    if (sectionName === "workout") loadTodayWorkout();
    if (sectionName === "diet") loadMyDiet();
    if (sectionName === "membership") loadMembershipAndInvoices();
    if (sectionName === "attendance") loadMyAttendance();
}

function logout() {
    localStorage.removeItem("udg_token");
    localStorage.removeItem("uchala_token");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("uchala_user");
    localStorage.removeItem("token");
    window.location.href = "/login.html";
}

// ==================== DATA LOADERS ====================

// 1. Load Profile & Workout
async function loadTodayWorkout() {
    document.getElementById("memberNameDisplay").textContent = currentUser.name || "Athlete";
    document.getElementById("memberCustomId").textContent = currentUser.gymId || currentUser.customId || currentUser.memberId || "UDGMEM-1001";
    document.getElementById("memberIdBadge").textContent = currentUser.gymId || currentUser.customId || currentUser.memberId || "UDGMEM-1001";
    document.getElementById("memberWelcomeTitle").textContent = `Welcome Back, ${currentUser.name || 'Member'}!`;

    try {
        const profile = await fetchAuth("/member/profile");
        
        if (profile.assignedTrainer) {
            document.getElementById("memberCoachSubtitle").textContent = `Assigned Coach: ${profile.assignedTrainer.name} (${profile.assignedTrainer.specialization || 'Fitness Coach'})`;
        } else {
            document.getElementById("memberCoachSubtitle").textContent = `Floor Coach On Duty`;
        }

        const workouts = await fetchAuth("/member/workouts");
        const tbody = document.getElementById("todayWorkoutTableBody");

        if (!workouts || workouts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#777;">No workouts assigned for today yet. Ask your coach!</td></tr>`;
            document.getElementById("coachNotesText").textContent = `"Rest day or light cardio recovery."`;
            return;
        }

        const latest = workouts[0];
        if (latest.notes) {
            document.getElementById("coachNotesText").textContent = `"${latest.notes}"`;
        } else {
            document.getElementById("coachNotesText").textContent = `"Keep good form on all exercises."`;
        }

        if (latest.title || latest.dayOfWeek) {
            document.getElementById("workoutDaySubtitle").textContent = `${latest.dayOfWeek || 'Today'}'s Routine: ${latest.title || 'General Workout'}`;
        }

        if (latest.exercises && latest.exercises.length > 0) {
            tbody.innerHTML = latest.exercises.map(e => `
                <tr>
                    <td><strong style="color:#f39c12;">${e.name}</strong></td>
                    <td>${e.sets || 4} sets</td>
                    <td>${e.reps || 10} reps</td>
                    <td>${e.weight ? `${e.weight}` : '-'}</td>
                </tr>
            `).join("");
        } else {
            tbody.innerHTML = workouts.map(w => `
                <tr>
                    <td><strong style="color:#f39c12;">${w.exercise || w.title || '-'}</strong></td>
                    <td>${w.sets || 4} sets</td>
                    <td>${w.reps || w.setsReps || 10} reps</td>
                    <td>${w.weight ? `${w.weight} kg` : '-'}</td>
                </tr>
            `).join("");
        }

    } catch (err) {
        console.error("Member workout error:", err);
    }
}

// 2. Load Diet Plan
async function loadMyDiet() {
    try {
        const diet = await fetchAuth("/member/diet");
        
        if (diet && (diet.goal || diet.title)) {
            document.getElementById("dietGoalSubtitle").textContent = `Goal Target: ${diet.goal || diet.title} (${diet.dietType || 'Custom Plan'})`;
            document.getElementById("dietBreakfastText").textContent = diet.breakfast || diet.instructions || 'Eggs / Oats / Shaker';
            document.getElementById("dietLunchText").textContent = diet.lunch || 'Whole food lean protein + carbs + vegetables';
            document.getElementById("dietPreWorkoutText").textContent = diet.preWorkout || 'Banana / Peanut butter toast + Caffeine';
            document.getElementById("dietDinnerText").textContent = diet.dinner || 'Light protein + fiber + vegetables';
        } else {
            document.getElementById("dietGoalSubtitle").textContent = "Standard Gym Nutrition";
            document.getElementById("dietBreakfastText").textContent = "4 Eggs / 100g Paneer + 50g Oats + 1 Banana";
            document.getElementById("dietLunchText").textContent = "150g Chicken / Soya Chunks + 100g Rice + Green Salad";
            document.getElementById("dietPreWorkoutText").textContent = "2 Brown Bread + 1 tbsp Peanut Butter + Black Coffee";
            document.getElementById("dietDinnerText").textContent = "150g Fish / Paneer / Dal + 2 Chapatis + Salad";
        }
    } catch (err) {}
}

// 3. Load Membership & Invoices
async function loadMembershipAndInvoices() {
    try {
        const profile = await fetchAuth("/member/profile");
        
        if (profile.membershipPlan) {
            document.getElementById("myPlanTitle").textContent = profile.membershipPlan.name;
            document.getElementById("myPlanPerks").textContent = (profile.membershipPlan.features || []).join(", ") || "Full Gym Access & Facilities";
            document.getElementById("myPlanPriceDisplay").textContent = `₹${profile.membershipPlan.price}`;
        } else {
            document.getElementById("myPlanTitle").textContent = profile.plan || "Starter Plan";
        }

        if (profile.dueAmount > 0) {
            document.getElementById("myPlanDueDisplay").textContent = `₹${profile.dueAmount} Pending Due`;
            document.getElementById("myPlanDueDisplay").style.color = "#e74c3c";
        } else {
            document.getElementById("myPlanDueDisplay").textContent = "Fully Cleared";
            document.getElementById("myPlanDueDisplay").style.color = "#2ecc71";
        }

        const invoices = await fetchAuth("/member/payments");
        const tbody = document.getElementById("memberInvoicesTableBody");

        if (!invoices || invoices.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#777;">No invoices issued yet</td></tr>`;
            return;
        }

        tbody.innerHTML = invoices.map(p => `
            <tr>
                <td><strong>${p.invoiceNo || p._id.slice(-6).toUpperCase()}</strong></td>
                <td>${p.plan ? p.plan.name : (p.planName || 'Starter Plan')}</td>
                <td>₹${p.amountPaid}</td>
                <td>${p.amountDue > 0 ? `<span style="color:#e74c3c; font-weight:bold;">₹${p.amountDue}</span>` : '₹0'}</td>
                <td>${new Date(p.createdAt || Date.now()).toLocaleDateString()}</td>
                <td>${p.amountDue > 0 ? `<span class="badge-due">Due</span>` : `<span class="badge-active">Paid</span>`}</td>
            </tr>
        `).join("");
    } catch (err) {}
}

// 4. Load Attendance
async function loadMyAttendance() {
    try {
        const history = await fetchAuth("/member/my-attendance");
        const tbody = document.getElementById("memberAttendanceTableBody");

        if (!history || history.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#777;">No attendance check-in history found</td></tr>`;
            return;
        }

        tbody.innerHTML = history.map(a => `
            <tr>
                <td>${a.date || '-'}</td>
                <td>${a.inTime || 'Present'}</td>
                <td><span class="badge-active">${a.status}</span></td>
            </tr>
        `).join("");
    } catch (err) {}
}

// Change Password
document.getElementById("changePasswordForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const currentPassword = document.getElementById("memberOldPass").value;
    const newPassword = document.getElementById("memberNewPass").value;

    try {
        await fetchAuth("/auth/change-password", {
            method: "PUT",
            body: JSON.stringify({ currentPassword, newPassword })
        });
        alert("Password updated successfully!");
        closeModal("changePasswordModal");
        this.reset();
    } catch (err) {
        alert(err.message);
    }
});

// Initial Load
document.addEventListener("DOMContentLoaded", () => {
    loadTodayWorkout();
});