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
    const m = document.getElementById(modalId);
    if (m) m.style.display = "flex";
}

function closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.style.display = "none";
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

// 1. Load Profile & Today's Workout
async function loadTodayWorkout() {
    document.getElementById("memberNameDisplay").textContent = currentUser.name || "Athlete";
    document.getElementById("memberCustomId").textContent = currentUser.gymId || currentUser.customId || currentUser.memberId || "UDGMEM-1001";
    document.getElementById("memberIdBadge").textContent = currentUser.gymId || currentUser.customId || currentUser.memberId || "UDGMEM-1001";
    document.getElementById("memberWelcomeTitle").textContent = `Welcome Back, ${currentUser.name || 'Member'}!`;

    try {
        const profile = await fetchAuth("/member/profile");
        
        if (profile.assignedTrainer) {
            document.getElementById("memberCoachSubtitle").textContent = `Assigned Coach: ${profile.assignedTrainer.name} (${profile.assignedTrainer.specialization || 'Strength Coach'})`;
        } else {
            document.getElementById("memberCoachSubtitle").textContent = `Floor Coach On Duty`;
        }

        // Fetch today's workout split
        let workoutData = null;
        try {
            workoutData = await fetchAuth("/member/today-workout");
        } catch (e) {
            workoutData = await fetchAuth("/member/workouts");
        }

        const currentDay = workoutData.currentDay || ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
        let todayWorkout = workoutData.todayWorkout;

        if (!todayWorkout && Array.isArray(workoutData)) {
            todayWorkout = workoutData.find(w => (w.day || w.dayOfWeek) === currentDay) || workoutData[0];
        } else if (!todayWorkout && workoutData.allWorkouts && workoutData.allWorkouts.length > 0) {
            todayWorkout = workoutData.allWorkouts.find(w => (w.day || w.dayOfWeek) === currentDay) || workoutData.allWorkouts[0];
        }

        const statusContainer = document.getElementById("workoutStatusBadgeContainer");
        const tbody = document.getElementById("todayWorkoutTableBody");

        if (!todayWorkout) {
            document.getElementById("workoutDaySubtitle").textContent = `${currentDay}: Rest & Active Recovery Day`;
            document.getElementById("coachNotesText").textContent = `"Rest day or light mobility / cardio recovery."`;
            if (statusContainer) {
                statusContainer.innerHTML = `<span class="badge-active" style="padding: 6px 14px; font-size: 13px; background: rgba(59, 130, 246, 0.15); color: #60a5fa;">Rest Day</span>`;
            }
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#777;">No specific workout split scheduled for ${currentDay}. Check with your coach!</td></tr>`;
            return;
        }

        // Set routine details
        const routineTitle = todayWorkout.workoutTitle || todayWorkout.title || todayWorkout.category || 'General Routine';
        const dayLabel = todayWorkout.day || todayWorkout.dayOfWeek || currentDay;
        document.getElementById("workoutDaySubtitle").textContent = `${dayLabel}'s Split: ${routineTitle}`;

        // Set Coach Notes
        if (todayWorkout.notes) {
            document.getElementById("coachNotesText").textContent = `"${todayWorkout.notes}"`;
        } else {
            document.getElementById("coachNotesText").textContent = `"Keep strict form on all sets and stay hydrated!"`;
        }

        // Set Live Status Badge
        const isCompleted = todayWorkout.isCompleted === true;
        if (statusContainer) {
            statusContainer.innerHTML = isCompleted
                ? `<span class="badge-active" style="padding: 6px 14px; font-size: 13px;">Completed (Marked by Coach)</span>`
                : `<span class="badge-due" style="padding: 6px 14px; font-size: 13px;">Pending Today</span>`;
        }

        // Populate Exercises Table
        const exercises = todayWorkout.exercises || [];
        if (exercises.length > 0) {
            tbody.innerHTML = exercises.map(e => `
                <tr>
                    <td><strong style="color:#f39c12;">${e.name}</strong></td>
                    <td>${e.sets || 4} sets</td>
                    <td>${e.reps || 10} reps</td>
                    <td>${e.weight ? `${e.weight}` : '-'}</td>
                </tr>
            `).join("");
        } else if (todayWorkout.exercise) {
            tbody.innerHTML = `
                <tr>
                    <td><strong style="color:#f39c12;">${todayWorkout.exercise}</strong></td>
                    <td>${todayWorkout.sets || 4} sets</td>
                    <td>${todayWorkout.reps || todayWorkout.setsReps || 10} reps</td>
                    <td>${todayWorkout.weight ? `${todayWorkout.weight} kg` : '-'}</td>
                </tr>
            `;
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#777;">No individual exercises detailed. Follow coach instructions.</td></tr>`;
        }

    } catch (err) {
        console.error("Member workout error:", err);
    }
}

// 2. Load Diet Plan
async function loadMyDiet() {
    try {
        const res = await fetchAuth("/member/diet");
        const diet = (res && res.diet) ? res.diet : res;
        
        if (diet && (diet.dailyGoal || diet.goal || diet.title || (diet.meals && diet.meals.length > 0))) {
            const goalText = diet.dailyGoal || diet.goal || diet.title || 'Personalized Nutrition';
            const typeText = diet.dietType || 'Custom Plan';
            document.getElementById("dietGoalSubtitle").textContent = `Goal Target: ${goalText} (${typeText})`;
            
            let bText = diet.breakfast;
            let lText = diet.lunch;
            let pText = diet.preWorkout;
            let dText = diet.dinner;

            if (diet.meals && Array.isArray(diet.meals)) {
                const bMeal = diet.meals.find(m => m.mealTime === 'Breakfast');
                const lMeal = diet.meals.find(m => m.mealTime === 'Lunch');
                const pMeal = diet.meals.find(m => m.mealTime === 'Pre-Workout' || m.mealTime === 'Morning Snack');
                const dMeal = diet.meals.find(m => m.mealTime === 'Dinner' || m.mealTime === 'Post-Workout');

                if (bMeal) bText = bMeal.items + (bMeal.calories ? ` <span style="color:#f39c12;">(${bMeal.calories} kcal)</span>` : '');
                if (lMeal) lText = lMeal.items + (lMeal.calories ? ` <span style="color:#f39c12;">(${lMeal.calories} kcal)</span>` : '');
                if (pMeal) pText = pMeal.items + (pMeal.calories ? ` <span style="color:#f39c12;">(${pMeal.calories} kcal)</span>` : '');
                if (dMeal) dText = dMeal.items + (dMeal.calories ? ` <span style="color:#f39c12;">(${dMeal.calories} kcal)</span>` : '');
            }

            document.getElementById("dietBreakfastText").innerHTML = bText || '4 Whole Eggs / 100g Paneer + 60g Oats + 1 Banana';
            document.getElementById("dietLunchText").innerHTML = lText || '150g Chicken / Soya Chunks + 100g Rice + Veggies';
            document.getElementById("dietPreWorkoutText").innerHTML = pText || '2 Brown Bread + 1 tbsp Peanut Butter + Black Coffee';
            document.getElementById("dietDinnerText").innerHTML = dText || '150g Fish / Paneer / Dal + 2 Chapatis + Green Salad';
        } else {
            document.getElementById("dietGoalSubtitle").textContent = "Standard Fitness & Muscle Building (Non-Vegetarian)";
            document.getElementById("dietBreakfastText").innerHTML = "4 Eggs / 100g Paneer + 50g Oats + 1 Banana";
            document.getElementById("dietLunchText").innerHTML = "150g Chicken / Soya Chunks + 100g Rice + Green Salad";
            document.getElementById("dietPreWorkoutText").innerHTML = "2 Brown Bread + 1 tbsp Peanut Butter + Black Coffee";
            document.getElementById("dietDinnerText").innerHTML = "150g Fish / Paneer / Dal + 2 Chapatis + Salad";
        }
    } catch (err) {
        console.error("Member diet error:", err);
    }
}

// 3. Load Membership & Invoices
async function loadMembershipAndInvoices() {
    try {
        let planData = null;
        try {
            planData = await fetchAuth("/member/my-plan");
        } catch (e) {
            planData = { user: await fetchAuth("/member/profile"), payments: await fetchAuth("/member/payments") };
        }

        const user = planData.user || {};
        const currentPlan = user.currentPlan || {};
        const payments = planData.payments || [];

        // Display Real Active Plan Name
        const planName = currentPlan.planName || currentPlan.name || user.plan || "Starter Transformation Plan";
        document.getElementById("myPlanTitle").textContent = planName;

        // Display Perks / Features
        let perksText = "Full Gym Access, Free Locker & Shower Facility";
        if (currentPlan.features && Array.isArray(currentPlan.features) && currentPlan.features.length > 0) {
            perksText = currentPlan.features.join(" • ");
        } else if (currentPlan.description) {
            perksText = currentPlan.description;
        }
        document.getElementById("myPlanPerks").textContent = perksText;

        // Display Price
        const price = currentPlan.price !== undefined ? currentPlan.price : 1200;
        document.getElementById("myPlanPriceDisplay").textContent = `₹${price.toLocaleString()}`;

        // Display Plan Validity & Status
        const statusBadge = document.getElementById("myPlanStatusBadge");
        const validityText = document.getElementById("myPlanValidityText");
        const dueDisplay = document.getElementById("myPlanDueDisplay");

        if (user.planEndDate) {
            const endDate = new Date(user.planEndDate);
            const isExpired = user.daysRemaining !== null && user.daysRemaining <= 0;

            if (isExpired) {
                statusBadge.textContent = "Membership Expired";
                statusBadge.className = "badge-due";
                validityText.textContent = `Expired on ${endDate.toLocaleDateString("en-IN")}`;
            } else {
                statusBadge.textContent = "Active Membership";
                statusBadge.className = "badge-active";
                validityText.textContent = `Valid until ${endDate.toLocaleDateString("en-IN")} (${user.daysRemaining || 0} days remaining)`;
            }
        } else {
            statusBadge.textContent = "Active Member";
            statusBadge.className = "badge-active";
            validityText.textContent = "Valid & Standing";
        }

        // Check payments for outstanding dues
        const totalDue = payments.reduce((acc, p) => acc + (p.dueAmount || p.amountDue || 0), 0);
        if (totalDue > 0) {
            dueDisplay.textContent = `₹${totalDue.toLocaleString()} Pending Due`;
            dueDisplay.style.color = "#ef4444";
        } else {
            dueDisplay.textContent = "Fully Cleared";
            dueDisplay.style.color = "#2ecc71";
        }

        // Populate Invoices Table
        const tbody = document.getElementById("memberInvoicesTableBody");
        if (!payments || payments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#777;">No payment invoices issued yet</td></tr>`;
            return;
        }

        tbody.innerHTML = payments.map(p => {
            const invoiceNo = p.invoiceNumber || p.invoiceNo || (p._id ? `INV-UDG-${p._id.slice(-4).toUpperCase()}` : 'INV-UDG-1001');
            const pPlanName = p.membershipPlan ? p.membershipPlan.planName : (p.planName || planName);
            const paid = p.paidAmount !== undefined ? p.paidAmount : (p.amountPaid || 0);
            const due = p.dueAmount !== undefined ? p.dueAmount : (p.amountDue || 0);
            const dateStr = p.paymentDate || p.createdAt || p.date
                ? new Date(p.paymentDate || p.createdAt || p.date).toLocaleDateString("en-IN")
                : '-';

            const status = p.status || (due === 0 ? 'Paid' : 'Due');
            const isPaid = status === 'Paid';

            return `
                <tr>
                    <td><strong>${invoiceNo}</strong></td>
                    <td>${pPlanName}</td>
                    <td>₹${paid.toLocaleString()}</td>
                    <td>${due > 0 ? `<strong style="color:#ef4444;">₹${due.toLocaleString()}</strong>` : '₹0'}</td>
                    <td>${dateStr}</td>
                    <td><span class="${isPaid ? 'badge-active' : 'badge-due'}">${status}</span></td>
                </tr>
            `;
        }).join("");

    } catch (err) {
        console.error("Membership error:", err);
    }
}

// 4. Load My Attendance
async function loadMyAttendance() {
    try {
        const data = await fetchAuth("/member/attendance");
        const history = Array.isArray(data) ? data : (data.attendance || []);
        const tbody = document.getElementById("memberAttendanceTableBody");

        if (!history || history.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#777;">No attendance check-in history found</td></tr>`;
            return;
        }

        tbody.innerHTML = history.map(a => {
            const formattedDate = a.date ? new Date(a.date).toLocaleDateString("en-IN") : '-';
            const isPresent = a.status === 'Present';
            return `
                <tr>
                    <td>${formattedDate}</td>
                    <td>${a.inTime || (a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Checked In')}</td>
                    <td><span class="${isPresent ? 'badge-active' : 'badge-due'}">${a.status}</span></td>
                </tr>
            `;
        }).join("");
    } catch (err) {
        console.error("Attendance error:", err);
    }
}

// Change Password Handler
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