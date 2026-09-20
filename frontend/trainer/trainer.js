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
        if (!myTrainees || myTrainees.length === 0) {
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
        const data = await fetchAuth("/trainer/workouts");
        allWorkouts = Array.isArray(data) ? data : (data.workouts || []);
        const tbody = document.getElementById("workoutsTableBody");

        if (!allWorkouts || allWorkouts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#777;">No workout schedules assigned yet</td></tr>`;
            return;
        }

        tbody.innerHTML = allWorkouts.map(w => {
            const isCompleted = w.isCompleted === true;
            const statusBadge = isCompleted 
                ? '<span class="badge-active">Completed</span>' 
                : '<span class="badge-due">Pending</span>';

            const toggleBtn = isCompleted
                ? `<button class="btn-done-pending" onclick="toggleWorkoutDone('${w._id}')">Mark Pending</button>`
                : `<button class="btn-done-complete" onclick="toggleWorkoutDone('${w._id}')">Mark Done</button>`;

            return `
                <tr>
                    <td><strong>${w.day || w.dayOfWeek || 'Daily'}</strong></td>
                    <td>${w.member ? w.member.name : (w.athleteName || '-')}</td>
                    <td><strong style="color:#f39c12;">${w.workoutTitle || w.title || w.category || 'Workout'}</strong></td>
                    <td>
                        ${w.exercises && w.exercises.length > 0 
                            ? w.exercises.map(e => `${e.name} (${e.sets || 4}x${e.reps || 10}${e.weight ? ` @ ${e.weight}` : ''})`).join("<br>") 
                            : (w.exercise ? `${w.exercise} (${w.setsReps || '4x10'})` : '-')}
                    </td>
                    <td style="color:#a0aec0; font-size:12px;">${w.notes || '-'}</td>
                    <td>${statusBadge}</td>
                    <td>
                        ${toggleBtn}
                        <button class="btn-action-delete" onclick="deleteWorkoutRoutine('${w._id}')">Delete</button>
                    </td>
                </tr>
            `;
        }).join("");
    } catch (err) {
        console.error("Workouts error:", err);
    }
}

// Toggle Workout Completion Status
async function toggleWorkoutDone(workoutId) {
    try {
        const data = await fetchAuth(`/trainer/workouts/${workoutId}/complete`, {
            method: "PUT"
        });
        alert(data.message || "Workout completion status updated!");
        loadWorkouts();
    } catch (err) {
        alert(err.message);
    }
}

// Delete Workout Routine
async function deleteWorkoutRoutine(workoutId) {
    const confirmed = await customConfirm("Are you sure you want to delete this workout routine?", "Delete Workout Routine", "Yes, Delete", "Cancel", true);
    if (!confirmed) return;
    try {
        await fetchAuth(`/trainer/workouts/${workoutId}`, {
            method: "DELETE"
        });
        await customAlert("Workout routine removed successfully.", "Workout Deleted", "success");
        loadWorkouts();
    } catch (err) {
        customAlert(err.message, "Error", "error");
    }
}

// 3. Load Diets
async function loadDiets() {
    try {
        const data = await fetchAuth("/trainer/diets");
        allDiets = Array.isArray(data) ? data : (data.diets || []);
        const tbody = document.getElementById("dietsTableBody");

        if (!allDiets || allDiets.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#777;">No diet plans set yet</td></tr>`;
            return;
        }

        tbody.innerHTML = allDiets.map(d => {
            let mealsHtml = '-';
            if (d.meals && Array.isArray(d.meals) && d.meals.length > 0) {
                mealsHtml = d.meals.map(m => `<strong>${m.mealTime || 'Meal'}:</strong> ${m.items}`).join('<br>');
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
    } catch (err) {
        console.error("Diets error:", err);
    }
}

// 4. Load Trainee Attendance
async function loadTraineeAttendance() {
    const dateInput = document.getElementById("traineeAttDate");
    const date = dateInput.value || new Date().toISOString().split("T")[0];
    dateInput.value = date;

    try {
        const data = await fetchAuth(`/trainer/trainee-attendance?date=${date}`);
        const list = Array.isArray(data) ? data : (data.attendance || []);
        const tbody = document.getElementById("traineeAttendanceTableBody");

        if (!list || list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#777;">No check-ins recorded for ${date}</td></tr>`;
            return;
        }

        tbody.innerHTML = list.map(a => {
            const traineeName = a.user ? a.user.name : '-';
            const gymId = a.user ? (a.user.gymId || a.user.customId || '-') : '-';
            const safeName = traineeName.replace(/'/g, "\\'");
            const safeNotes = (a.notes || '').replace(/'/g, "\\'");

            const statusClass = a.status === 'Present' ? 'badge-active' : 'badge-due';

            return `
                <tr>
                    <td><strong>${gymId}</strong></td>
                    <td>${traineeName}</td>
                    <td>${a.inTime || new Date(a.date).toLocaleDateString()}</td>
                    <td><span class="${statusClass}">${a.status}</span></td>
                    <td>
                        <button class="btn-action-edit" onclick="openEditTraineeAttendanceModal('${a._id}', '${safeName}', '${a.status}', '${safeNotes}')">Edit</button>
                        <button class="btn-action-delete" onclick="deleteTraineeAttendanceRecord('${a._id}')">Delete</button>
                    </td>
                </tr>
            `;
        }).join("");
    } catch (err) {
        console.error("Trainee attendance error:", err);
    }
}

// Modal Open/Close for Edit Trainee Attendance
function openEditTraineeAttendanceModal(id, name, status, notes) {
    document.getElementById("editTraineeAttId").value = id;
    document.getElementById("editTraineeAttName").value = name;
    document.getElementById("editTraineeAttStatus").value = status || "Present";
    document.getElementById("editTraineeAttNotes").value = notes || "";
    openModal("editTraineeAttendanceModal");
}

// Delete Trainee Attendance Record
async function deleteTraineeAttendanceRecord(id) {
    const confirmed = await customConfirm("Are you sure you want to delete this trainee attendance record?", "Delete Attendance Record", "Yes, Delete", "Cancel", true);
    if (!confirmed) return;
    try {
        await fetchAuth(`/trainer/trainee-attendance/${id}`, {
            method: "DELETE"
        });
        await customAlert("Trainee attendance record removed.", "Attendance Deleted", "success");
        loadTraineeAttendance();
    } catch (err) {
        customAlert(err.message, "Error", "error");
    }
}

// 5. Load My Attendance
async function loadMyAttendance() {
    try {
        const data = await fetchAuth("/trainer/my-attendance");
        const history = Array.isArray(data) ? data : (data.attendance || []);
        const tbody = document.getElementById("myAttendanceTableBody");

        if (!history || history.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#777;">No coach attendance history recorded yet</td></tr>`;
            return;
        }

        tbody.innerHTML = history.map(h => `
            <tr>
                <td>${h.date ? new Date(h.date).toLocaleDateString() : '-'}</td>
                <td>${h.inTime || 'Present'}</td>
                <td><span class="${h.status === 'Present' ? 'badge-active' : 'badge-due'}">${h.status}</span></td>
            </tr>
        `).join("");
    } catch (err) {
        console.error("My attendance error:", err);
    }
}

// 6. Load Salary Slips
async function loadSalarySlips() {
    try {
        const data = await fetchAuth("/trainer/my-salaries");
        const slips = Array.isArray(data) ? data : (data.salaries || []);
        const tbody = document.getElementById("salarySlipsTableBody");

        if (!slips || slips.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#777;">No salary slips issued yet</td></tr>`;
            return;
        }

        tbody.innerHTML = slips.map(s => {
            const voucherNum = s.receiptNumber 
                ? (s.receiptNumber.startsWith("SAL-") ? s.receiptNumber : `SAL-UDG-${s.receiptNumber}`)
                : (s.voucherNo 
                    ? (s.voucherNo.startsWith("SAL-") ? s.voucherNo : `SAL-UDG-${s.voucherNo}`)
                    : `SAL-UDG-${s._id ? s._id.slice(-4).toUpperCase() : '1001'}`);

            const base = s.baseSalary || 0;
            const bonus = s.bonuses || s.bonus || 0;
            const deductions = s.deductions || 0;
            const net = s.netSalary !== undefined ? s.netSalary : ((base + bonus) - deductions);

            const formattedDate = s.paymentDate || s.createdAt || s.date
                ? new Date(s.paymentDate || s.createdAt || s.date).toLocaleDateString("en-IN")
                : '-';

            return `
                <tr>
                    <td><strong>${voucherNum}</strong></td>
                    <td>${s.month || '-'}</td>
                    <td>₹${base.toLocaleString()}</td>
                    <td>+₹${bonus.toLocaleString()}</td>
                    <td>-₹${deductions.toLocaleString()}</td>
                    <td><strong style="color:#2ecc71;">₹${net.toLocaleString()}</strong></td>
                    <td>${formattedDate}</td>
                </tr>
            `;
        }).join("");
    } catch (err) {
        console.error("Salaries error:", err);
    }
}

// Helper: Populate trainee selects
function populateTraineeDropdowns() {
    const options = myTrainees.map(m => 
        `<option value="${m._id}">${m.name} (${m.gymId || m.customId || m.memberId || 'ID'})</option>`
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
    const day = document.getElementById("workoutDaySelect").value;
    const workoutTitle = document.getElementById("workoutTitleInput").value.trim();
    const notes = document.getElementById("workoutNotesInput").value.trim();

    const exercises = [];
    const ex1Name = document.getElementById("ex1Name").value.trim();
    if (ex1Name) {
        exercises.push({
            name: ex1Name,
            sets: parseInt(document.getElementById("ex1Sets").value) || 4,
            reps: document.getElementById("ex1Reps").value.trim() || "10",
            weight: document.getElementById("ex1Weight").value.trim() || ""
        });
    }

    const ex2Name = document.getElementById("ex2Name").value.trim();
    if (ex2Name) {
        exercises.push({
            name: ex2Name,
            sets: parseInt(document.getElementById("ex2Sets").value) || 3,
            reps: document.getElementById("ex2Reps").value.trim() || "12",
            weight: document.getElementById("ex2Weight").value.trim() || ""
        });
    }

    try {
        await fetchAuth("/trainer/workouts", {
            method: "POST",
            body: JSON.stringify({ memberId, day, workoutTitle, exercises, notes })
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
    const dailyGoal = document.getElementById("dietGoalInput").value.trim();
    const breakfast = document.getElementById("dietBreakfastInput").value.trim();
    const lunch = document.getElementById("dietLunchInput").value.trim();
    const preWorkout = document.getElementById("dietPreWorkoutInput").value.trim();
    const dinner = document.getElementById("dietDinnerInput").value.trim();

    try {
        await fetchAuth("/trainer/diets", {
            method: "POST",
            body: JSON.stringify({ memberId, dietType, dailyGoal, breakfast, lunch, preWorkout, dinner })
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
    const memberId = document.getElementById("attTraineeSelect").value;
    const status = document.getElementById("attStatusSelect").value;

    try {
        await fetchAuth("/trainer/attendance", {
            method: "POST",
            body: JSON.stringify({ memberId, status })
        });
        alert("Trainee check-in recorded!");
        closeModal("markTraineeAttendanceModal");
        loadTraineeAttendance();
    } catch (err) {
        alert(err.message);
    }
});

// 4. Edit Trainee Attendance Submit
document.getElementById("editTraineeAttendanceForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const id = document.getElementById("editTraineeAttId").value;
    const status = document.getElementById("editTraineeAttStatus").value;
    const notes = document.getElementById("editTraineeAttNotes").value.trim();

    try {
        await fetchAuth(`/trainer/trainee-attendance/${id}`, {
            method: "PUT",
            body: JSON.stringify({ status, notes })
        });
        alert("Trainee attendance updated successfully!");
        closeModal("editTraineeAttendanceModal");
        loadTraineeAttendance();
    } catch (err) {
        alert(err.message);
    }
});

// 5. Change Password
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