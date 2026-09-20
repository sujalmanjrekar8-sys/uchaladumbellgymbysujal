const API_BASE = "/api";
let currentToken = localStorage.getItem("udg_token") || localStorage.getItem("uchala_token") || localStorage.getItem("token");
let currentUser = {};
try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("uchala_user") || "{}");
} catch(e) {}

// 1. Guard Check
if (!currentToken || currentUser.role !== "trainer") {
    alert("Access restricted to Trainers only.");
    window.location.href = "/login.html";
}

let myTrainees = [];
let allWorkouts = [];
let allDiets = [];

// Helper API Fetch
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

// Section Switcher
function switchSection(sectionName) {
    document.querySelectorAll(".content-section").forEach(s => s.style.display = "none");
    document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));

    const target = document.getElementById(`section-${sectionName}`);
    if (target) target.style.display = "block";

    const btn = Array.from(document.querySelectorAll(".nav-tab")).find(b => 
        b.getAttribute("onclick") && b.getAttribute("onclick").includes(sectionName)
    );
    if (btn) btn.classList.add("active");

    if (sectionName === "trainees") loadTrainees();
    if (sectionName === "workouts") loadWorkouts();
    if (sectionName === "diets") loadDiets();
    if (sectionName === "trainee-attendance") loadTraineeAttendance();
    if (sectionName === "my-attendance") loadMyAttendance();
    if (sectionName === "salary-slips") loadSalarySlips();
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

// 1. Load Trainees
async function loadTrainees() {
    document.getElementById("trainerNameDisplay").textContent = `Trainer ${currentUser.name || 'Alex'}`;
    if (currentUser.specialization) {
        document.getElementById("trainerSpecializationText").textContent = currentUser.specialization;
    }

    try {
        const data = await fetchAuth("/trainer/trainees");
        myTrainees = Array.isArray(data) ? data : (data.trainees || []);

        const tbody = document.getElementById("traineesTableBody");
        if (myTrainees.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#777;">No athletes currently assigned to you</td></tr>`;
            return;
        }

        tbody.innerHTML = myTrainees.map(m => `
            <tr>
                <td><strong>${m.gymId || m.customId || m.memberId || '-'}</strong></td>
                <td>${m.name}</td>
                <td>${m.phone || '-'}</td>
                <td><span class="badge-active">${m.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="btn-action" onclick="quickAssignWorkout('${m._id}')">Assign Workout</button>
                    <button class="btn-action" onclick="quickSetDiet('${m._id}')">Set Diet</button>
                </td>
            </tr>
        `).join("");

        populateTraineeDropdowns();
    } catch (err) {
        console.error("Trainees error:", err);
    }
}

// 2. Load Workouts
async function loadWorkouts() {
    try {
        allWorkouts = await fetchAuth("/trainer/workouts");
        const tbody = document.getElementById("workoutsTableBody");

        if (!allWorkouts || allWorkouts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#777;">No workout schedules assigned yet</td></tr>`;
            return;
        }

        tbody.innerHTML = allWorkouts.map(w => `
            <tr>
                <td><strong>${w.dayOfWeek || w.date || 'Daily'}</strong></td>
                <td>${w.member ? w.member.name : (w.athleteName || '-')}</td>
                <td><strong style="color:#f39c12;">${w.title || w.category || 'Workout'}</strong></td>
                <td>
                    ${w.exercises && w.exercises.length > 0 
                        ? w.exercises.map(e => `${e.name} (${e.sets}x${e.reps}${e.weight ? ` @ ${e.weight}` : ''})`).join("<br>") 
                        : (w.exercise ? `${w.exercise} (${w.setsReps || '4x10'})` : '-')}
                </td>
                <td style="color:#a0aec0; font-size:12px;">${w.notes || '-'}</td>
            </tr>
        `).join("");
    } catch (err) {}
}

// 3. Load Diets
async function loadDiets() {
    try {
        allDiets = await fetchAuth("/trainer/diets");
        const tbody = document.getElementById("dietsTableBody");

        if (!allDiets || allDiets.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#777;">No diet plans set yet</td></tr>`;
            return;
        }

        tbody.innerHTML = allDiets.map(d => {
            let mealsHtml = '-';
            if (d.meals && Array.isArray(d.meals) && d.meals.length > 0) {
                mealsHtml = d.meals.map(m => `<strong>${m.mealTime || 'Meal'}:</strong> ${m.items}${m.calories ? ` <span style="color:#a0aec0;">(${m.calories} kcal)</span>` : ''}`).join('<br>');
            } else {
                const parts = [];
                if (d.breakfast) parts.push(`<strong>Breakfast:</strong> ${d.breakfast}`);
                if (d.lunch) parts.push(`<strong>Lunch:</strong> ${d.lunch}`);
                if (d.preWorkout) parts.push(`<strong>Pre-Workout:</strong> ${d.preWorkout}`);
                if (d.dinner) parts.push(`<strong>Dinner:</strong> ${d.dinner}`);
                mealsHtml = parts.length > 0 ? parts.join('<br>') : (d.instructions || d.notes || '-');
            }

            return `
                <tr>
                    <td><strong>${d.member ? d.member.name : '-'}</strong></td>
                    <td><span class="badge-role" style="background:#2ecc71; color:#000;">${d.dietType || 'Non-Vegetarian'}</span></td>
                    <td><strong style="color:#f39c12;">${d.dailyGoal || d.goal || d.title || 'General Fitness'}</strong></td>
                    <td style="font-size:12px; line-height:1.6; color:#cbd5e1;">
                        ${mealsHtml}
                    </td>
                </tr>
            `;
        }).join("");
    } catch (err) {}
}

// 4. Load Trainee Attendance
async function loadTraineeAttendance() {
    const dateInput = document.getElementById("traineeAttDate");
    const date = dateInput.value || new Date().toISOString().split("T")[0];
    dateInput.value = date;

    try {
        const list = await fetchAuth(`/trainer/trainee-attendance?date=${date}`);
        const tbody = document.getElementById("traineeAttendanceTableBody");

        if (!list || list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#777;">No check-ins recorded for ${date}</td></tr>`;
            return;
        }

        tbody.innerHTML = list.map(a => `
            <tr>
                <td><strong>${a.user ? (a.user.gymId || a.user.customId || '-') : '-'}</strong></td>
                <td>${a.user ? a.user.name : '-'}</td>
                <td>${a.inTime || 'Present'}</td>
                <td><span class="badge-active">${a.status}</span></td>
            </tr>
        `).join("");
    } catch (err) {}
}

// 5. Load My Attendance
async function loadMyAttendance() {
    try {
        const history = await fetchAuth("/trainer/my-attendance");
        const tbody = document.getElementById("myAttendanceTableBody");

        if (!history || history.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#777;">No coach attendance history recorded yet</td></tr>`;
            return;
        }

        tbody.innerHTML = history.map(h => `
            <tr>
                <td>${h.date || '-'}</td>
                <td>${h.inTime || 'Present'}</td>
                <td><span class="badge-active">${h.status}</span></td>
            </tr>
        `).join("");
    } catch (err) {}
}

// 6. Load Salary Slips
async function loadSalarySlips() {
    try {
        const slips = await fetchAuth("/trainer/my-salaries");
        const tbody = document.getElementById("salarySlipsTableBody");

        if (!slips || slips.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#777;">No salary slips issued yet</td></tr>`;
            return;
        }

        tbody.innerHTML = slips.map(s => `
            <tr>
                <td><strong>${s.voucherNo || s._id.slice(-6).toUpperCase()}</strong></td>
                <td>${s.month}</td>
                <td>₹${s.baseSalary}</td>
                <td>+₹${s.bonus || 0}</td>
                <td>-₹${s.deductions || 0}</td>
                <td><strong style="color:#2ecc71;">₹${(s.baseSalary + (s.bonus || 0)) - (s.deductions || 0)}</strong></td>
                <td>${new Date(s.createdAt || Date.now()).toLocaleDateString()}</td>
            </tr>
        `).join("");
    } catch (err) {}
}

// Helper: Populate trainee selects
function populateTraineeDropdowns() {
    const options = myTrainees.map(m => 
        `<option value="${m._id}">${m.name} (${m.gymId || m.customId || m.memberId})</option>`
    ).join("");

    ["workoutTraineeSelect", "dietTraineeSelect", "attTraineeSelect"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = options;
    });
}

function quickAssignWorkout(memberId) {
    openModal("assignWorkoutModal");
    const select = document.getElementById("workoutTraineeSelect");
    if (select) select.value = memberId;
}

function quickSetDiet(memberId) {
    openModal("setDietModal");
    const select = document.getElementById("dietTraineeSelect");
    if (select) select.value = memberId;
}

// ==================== MODAL SUBMIT HANDLERS ====================

// 1. Assign Daily Workout
document.getElementById("assignWorkoutForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const memberId = document.getElementById("workoutTraineeSelect").value;
    const dayOfWeek = document.getElementById("workoutDaySelect").value;
    const title = document.getElementById("workoutTitleInput").value.trim();
    const notes = document.getElementById("workoutNotesInput").value.trim();

    const exercises = [];
    const ex1Name = document.getElementById("ex1Name").value.trim();
    if (ex1Name) {
        exercises.push({
            name: ex1Name,
            sets: document.getElementById("ex1Sets").value.trim() || "4",
            reps: document.getElementById("ex1Reps").value.trim() || "10",
            weight: document.getElementById("ex1Weight").value.trim() || ""
        });
    }

    const ex2Name = document.getElementById("ex2Name").value.trim();
    if (ex2Name) {
        exercises.push({
            name: ex2Name,
            sets: document.getElementById("ex2Sets").value.trim() || "3",
            reps: document.getElementById("ex2Reps").value.trim() || "12",
            weight: document.getElementById("ex2Weight").value.trim() || ""
        });
    }

    try {
        await fetchAuth("/trainer/workouts", {
            method: "POST",
            body: JSON.stringify({ memberId, dayOfWeek, title, exercises, notes })
        });
        alert("Workout routine saved & assigned to athlete!");
        closeModal("assignWorkoutModal");
        this.reset();
        loadWorkouts();
    } catch (err) {
        alert(err.message);
    }
});

// 2. Set Diet Plan
document.getElementById("setDietForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const memberId = document.getElementById("dietTraineeSelect").value;
    const dietType = document.getElementById("dietTypeSelect").value;
    const goal = document.getElementById("dietGoalInput").value.trim();
    const breakfast = document.getElementById("dietBreakfastInput").value.trim();
    const lunch = document.getElementById("dietLunchInput").value.trim();
    const preWorkout = document.getElementById("dietPreWorkoutInput").value.trim();
    const dinner = document.getElementById("dietDinnerInput").value.trim();

    try {
        await fetchAuth("/trainer/diets", {
            method: "POST",
            body: JSON.stringify({ memberId, dietType, goal, breakfast, lunch, preWorkout, dinner })
        });
        alert("Diet plan saved & assigned to athlete!");
        closeModal("setDietModal");
        this.reset();
        loadDiets();
    } catch (err) {
        alert(err.message);
    }
});

// 3. Mark Trainee Attendance Check-In
document.getElementById("markTraineeAttendanceForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const userId = document.getElementById("attTraineeSelect").value;
    const status = document.getElementById("attStatusSelect").value;

    try {
        await fetchAuth("/owner/attendance", {
            method: "POST",
            body: JSON.stringify({ userId, role: "member", status })
        });
        alert("Trainee check-in recorded!");
        closeModal("markTraineeAttendanceModal");
        loadTraineeAttendance();
    } catch (err) {
        alert(err.message);
    }
});

// 4. Change Password
document.getElementById("changePasswordForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const currentPassword = document.getElementById("trainerOldPass").value;
    const newPassword = document.getElementById("trainerNewPass").value;

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

// Initial load
document.addEventListener("DOMContentLoaded", () => {
    loadTrainees();
});