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

let currentSelectedWorkoutDay = null;

function selectWorkoutDay(dayName) {
    currentSelectedWorkoutDay = dayName;
    loadTodayWorkout(dayName);
}

// 1. Load Profile & Today's Workout Split
async function loadTodayWorkout(dayOverride) {
    document.getElementById("memberNameDisplay").textContent = currentUser.name || "Athlete";
    document.getElementById("memberCustomId").textContent = currentUser.gymId || currentUser.customId || currentUser.memberId || "UDGMEM-1001";
    document.getElementById("memberIdBadge").textContent = currentUser.gymId || currentUser.customId || currentUser.memberId || "UDGMEM-1001";
    document.getElementById("memberWelcomeTitle").textContent = `Welcome Back, ${currentUser.name || 'Member'}!`;

    try {
        try {
            const profile = await fetchAuth("/member/profile");
            if (profile && profile.assignedTrainer) {
                document.getElementById("memberCoachSubtitle").textContent = `Assigned Coach: ${profile.assignedTrainer.name} (${profile.assignedTrainer.specialization || 'Strength Coach'})`;
            } else {
                document.getElementById("memberCoachSubtitle").textContent = `Floor Coach On Duty`;
            }
        } catch (pe) {}

        // User's browser local day
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const localToday = days[new Date().getDay()];
        const targetDay = dayOverride || currentSelectedWorkoutDay || localToday;
        currentSelectedWorkoutDay = targetDay;

        // Highlight active day pill in UI
        document.querySelectorAll('.day-pill').forEach(pill => {
            if (pill.getAttribute('data-day') === targetDay) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        });

        // Fetch workout split for targetDay (passing local client day)
        let workoutData = null;
        try {
            workoutData = await fetchAuth(`/member/today-workout?day=${encodeURIComponent(targetDay)}`);
        } catch (e) {
            workoutData = await fetchAuth("/member/workouts");
        }

        const currentDay = targetDay;
        let todayList = [];

        if (workoutData.todayWorkouts && Array.isArray(workoutData.todayWorkouts) && workoutData.todayWorkouts.length > 0) {
            todayList = workoutData.todayWorkouts;
        } else if (workoutData.allWorkouts && Array.isArray(workoutData.allWorkouts)) {
            todayList = workoutData.allWorkouts.filter(w => (w.day || w.dayOfWeek) === currentDay);
        } else if (Array.isArray(workoutData)) {
            todayList = workoutData.filter(w => (w.day || w.dayOfWeek) === currentDay);
        } else if (workoutData.todayWorkout && (workoutData.todayWorkout.day || workoutData.todayWorkout.dayOfWeek) === currentDay) {
            todayList = [workoutData.todayWorkout];
        }

        const statusContainer = document.getElementById("workoutStatusBadgeContainer");
        const tbody = document.getElementById("todayWorkoutTableBody");

        if (todayList.length === 0) {
            document.getElementById("workoutDaySubtitle").textContent = `${currentDay}: Rest & Active Recovery Day`;
            document.getElementById("coachNotesText").textContent = `"Rest day or light mobility / cardio recovery."`;
            if (statusContainer) {
                statusContainer.innerHTML = `<span class="badge-active" style="padding: 6px 14px; font-size: 13px; background: rgba(59, 130, 246, 0.15); color: #60a5fa;">Rest Day</span>`;
            }
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#777;">No workout routine scheduled for ${currentDay}. Click another day above to view routines!</td></tr>`;
            return;
        }

        // Set routine details
        const titles = todayList.map(w => w.workoutTitle || w.title || w.category || 'General Routine').filter(Boolean);
        const dayLabel = todayList[0].day || todayList[0].dayOfWeek || currentDay;
        document.getElementById("workoutDaySubtitle").textContent = `${dayLabel}'s Split: ${titles.join(' + ')}`;

        // Set Coach Notes
        const notesList = todayList.map(w => w.notes).filter(Boolean);
        if (notesList.length > 0) {
            document.getElementById("coachNotesText").textContent = `"${notesList.join(' | ')}"`;
        } else {
            document.getElementById("coachNotesText").textContent = `"Keep strict form on all sets and stay hydrated!"`;
        }

        // Set Live Status Badge
        const allCompleted = todayList.every(w => w.isCompleted === true);
        if (statusContainer) {
            statusContainer.innerHTML = allCompleted
                ? `<span class="badge-active" style="padding: 6px 14px; font-size: 13px;">Completed (Marked by Coach)</span>`
                : `<span class="badge-due" style="padding: 6px 14px; font-size: 13px;">Pending Today</span>`;
        }

        // Populate All Exercises Table
        let rowsHtml = '';
        todayList.forEach((w, idx) => {
            const rTitle = w.workoutTitle || w.title || w.category || `Routine #${idx + 1}`;
            if (todayList.length > 1) {
                rowsHtml += `<tr style="background: rgba(243, 156, 18, 0.08);"><td colspan="4" style="color: #f39c12; font-weight: bold; font-size: 13px;">📌 ${rTitle} (${w.isCompleted ? 'Completed' : 'Pending'})</td></tr>`;
            }

            if (w.exercises && Array.isArray(w.exercises) && w.exercises.length > 0) {
                rowsHtml += w.exercises.map(e => `
                    <tr>
                        <td><strong style="color:#f39c12;">${e.name}</strong></td>
                        <td>${e.sets || 4} sets</td>
                        <td>${e.reps || 10} reps</td>
                        <td>${e.weight ? `${e.weight}` : '-'}</td>
                    </tr>
                `).join('');
            } else if (w.exercise) {
                rowsHtml += `
                    <tr>
                        <td><strong style="color:#f39c12;">${w.exercise}</strong></td>
                        <td>${w.sets || 4} sets</td>
                        <td>${w.reps || w.setsReps || 10} reps</td>
                        <td>${w.weight ? `${w.weight} kg` : '-'}</td>
                    </tr>
                `;
            }
        });

        if (!rowsHtml) {
            rowsHtml = `<tr><td colspan="4" style="text-align:center; color:#777;">No individual exercises detailed. Follow coach instructions.</td></tr>`;
        }

        tbody.innerHTML = rowsHtml;

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

                if (bMeal) bText = bMeal.items;
                if (lMeal) lText = lMeal.items;
                if (pMeal) pText = pMeal.items;
                if (dMeal) dText = dMeal.items;
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