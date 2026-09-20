const API_BASE = "/api";

// 1. API Helper (Matches Product 2 methods: get, post, put, delete)
const api = {
    getToken() {
        return localStorage.getItem('udg_token') || localStorage.getItem('token');
    },
    getUser() {
        try {
            return JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('udg_user') || '{}');
        } catch (e) {
            return {};
        }
    },
    async request(endpoint, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {})
        };
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        return data;
    },
    get(endpoint) { return this.request(endpoint, { method: 'GET' }); },
    post(endpoint, body) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) }); },
    put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }); },
    delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
};

// 2. Guard Check
const user = api.getUser();
if (!user || user.role !== 'owner') {
    alert('Access forbidden. Please log in as Owner.');
    window.location.href = '../index.html';
}

// Global cached lists
let globalMembers = [];
let globalTrainers = [];
let globalPlans = [];

// Modal Helpers
function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

window.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal-bg')) {
        e.target.style.display = 'none';
    }
});

// Section Switcher
function switchSection(tabId) {
    document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
    
    const target = document.getElementById(`section-${tabId}`);
    if (target) target.style.display = 'block';

    const btn = Array.from(document.querySelectorAll('.nav-tab')).find(b => 
        b.getAttribute('onclick') && b.getAttribute('onclick').includes(tabId)
    );
    if (btn) btn.classList.add('active');

    if (tabId === 'overview') loadAllData();
    if (tabId === 'members') renderMembers();
    if (tabId === 'trainers') renderTrainers();
    if (tabId === 'plans') renderPlans();
    if (tabId === 'member-attendance') loadAttendance();
    if (tabId === 'trainer-attendance') loadAttendance();
    if (tabId === 'payments') loadPayments();
    if (tabId === 'salaries') loadSalaries();
    if (tabId === 'workouts-overview') loadWorkouts();
    if (tabId === 'diets-overview') loadDiets();
}

function logout() {
    localStorage.removeItem('udg_token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('udg_user');
    window.location.href = '../index.html';
}

// ==================== LOAD ALL DATA ====================
async function loadAllData() {
    try {
        // Stats
        const statsRes = await api.get('/owner/stats');
        if (statsRes.success && statsRes.stats) {
            document.getElementById('statMembers').innerText = statsRes.stats.totalMembers || 0;
            document.getElementById('statTrainers').innerText = statsRes.stats.totalTrainers || 0;
            document.getElementById('statRevenue').innerText = `₹${(statsRes.stats.totalRevenue || 0).toLocaleString('en-IN')}`;
            document.getElementById('statDues').innerText = `₹${(statsRes.stats.totalDue || 0).toLocaleString('en-IN')}`;
        }

        // Members
        const memRes = await api.get('/owner/members');
        globalMembers = memRes.members || memRes.data || (Array.isArray(memRes) ? memRes : []);
        renderMembers();

        // Recent Members table in overview
        const recentTbody = document.getElementById('overviewMembersTable');
        if (recentTbody) {
            if (globalMembers.length > 0) {
                recentTbody.innerHTML = globalMembers.slice(0, 5).map(m => `
                    <tr>
                        <td><span class="badge-active" style="font-family: monospace;">${m.gymId || m.customId || '-'}</span></td>
                        <td><strong>${m.name}</strong></td>
                        <td>${m.currentPlan ? (m.currentPlan.planName || m.currentPlan.name) : (m.membershipPlan ? (m.membershipPlan.planName || m.membershipPlan.name) : '<span style="color: #718096;">No Plan Active</span>')}</td>
                        <td>${m.assignedTrainer ? m.assignedTrainer.name : '<span style="color: #718096;">Unassigned</span>'}</td>
                        <td><span class="${m.isActive !== false ? 'badge-active' : 'badge-due'}">${m.isActive !== false ? 'ACTIVE' : 'INACTIVE'}</span></td>
                    </tr>
                `).join('');
            } else {
                recentTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#777;">No members registered yet</td></tr>`;
            }
        }

        // Trainers
        const trRes = await api.get('/owner/trainers');
        globalTrainers = trRes.trainers || trRes.data || (Array.isArray(trRes) ? trRes : []);
        renderTrainers();

        // Plans
        const planRes = await api.get('/owner/plans');
        globalPlans = planRes.plans || planRes.data || (Array.isArray(planRes) ? planRes : []);
        renderPlans();

        populateDropdowns();
        loadAttendance();
        loadPayments();
        loadSalaries();
        loadWorkouts();
        loadDiets();

    } catch (err) {
        console.error('Error loading dashboard data:', err);
    }
}

// Render Members Table
function renderMembers() {
    const tbody = document.getElementById('membersTableBody');
    if (!tbody) return;

    if (!globalMembers || globalMembers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#777;">No members found</td></tr>`;
        return;
    }

    tbody.innerHTML = globalMembers.map(m => `
        <tr>
            <td><strong style="color: #f39c12; font-family: monospace;">${m.gymId || m.customId || '-'}</strong></td>
            <td><strong>${m.name}</strong></td>
            <td>${m.phone || '-'}</td>
            <td>${m.email || '-'}</td>
            <td>${m.currentPlan ? (m.currentPlan.planName || m.currentPlan.name) : (m.membershipPlan ? (m.membershipPlan.planName || m.membershipPlan.name) : '<span style="color: #718096;">No Plan Active</span>')}</td>
            <td>${m.assignedTrainer ? `<span class="badge-active">${m.assignedTrainer.name}</span>` : '<span style="color: #718096;">Unassigned</span>'}</td>
            <td><span class="${m.isActive !== false ? 'badge-active' : 'badge-due'}">${m.isActive !== false ? 'ACTIVE' : 'INACTIVE'}</span></td>
            <td>
                <button onclick="openEditMemberModal('${m._id}')" class="btn-action-edit">Edit</button>
                <button onclick="promptResetPassword('${m._id}', '${m.name}')" class="btn-action-reset">Reset Pass</button>
                <button onclick="deleteMember('${m._id}', '${m.name}')" class="btn-action-delete">Delete</button>
            </td>
        </tr>
    `).join('');
}

function filterMembers() {
    const q = document.getElementById('memberSearch').value.toLowerCase();
    const filtered = globalMembers.filter(m => 
        m.name.toLowerCase().includes(q) || 
        (m.gymId && m.gymId.toLowerCase().includes(q)) ||
        (m.phone && m.phone.includes(q))
    );
    const tbody = document.getElementById('membersTableBody');
    tbody.innerHTML = filtered.map(m => `
        <tr>
            <td><strong style="color: #f39c12; font-family: monospace;">${m.gymId || m.customId || '-'}</strong></td>
            <td><strong>${m.name}</strong></td>
            <td>${m.phone || '-'}</td>
            <td>${m.email || '-'}</td>
            <td>${m.currentPlan ? (m.currentPlan.planName || m.currentPlan.name) : (m.membershipPlan ? (m.membershipPlan.planName || m.membershipPlan.name) : '<span style="color: #718096;">No Plan Active</span>')}</td>
            <td>${m.assignedTrainer ? `<span class="badge-active">${m.assignedTrainer.name}</span>` : '<span style="color: #718096;">Unassigned</span>'}</td>
            <td><span class="${m.isActive !== false ? 'badge-active' : 'badge-due'}">${m.isActive !== false ? 'ACTIVE' : 'INACTIVE'}</span></td>
            <td>
                <button onclick="openEditMemberModal('${m._id}')" class="btn-action-edit">Edit</button>
                <button onclick="promptResetPassword('${m._id}', '${m.name}')" class="btn-action-reset">Reset Pass</button>
                <button onclick="deleteMember('${m._id}', '${m.name}')" class="btn-action-delete">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Render Trainers Table
function renderTrainers() {
    const tbody = document.getElementById('trainersTableBody');
    if (!tbody) return;

    if (!globalTrainers || globalTrainers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#777;">No trainers hired yet</td></tr>`;
        return;
    }

    tbody.innerHTML = globalTrainers.map(t => `
        <tr>
            <td><strong style="color: #60a5fa; font-family: monospace;">${t.gymId || t.customId || '-'}</strong></td>
            <td><strong>${t.name}</strong></td>
            <td>${t.phone || '-'}</td>
            <td>${t.specialization || 'General Fitness'}</td>
            <td><strong>₹${(t.monthlySalary || t.salary || 0).toLocaleString('en-IN')}</strong></td>
            <td>${t.traineesCount || 0} Athletes</td>
            <td>
                <button onclick="openEditTrainerModal('${t._id}')" class="btn-action-edit">Edit</button>
                <button onclick="promptResetPassword('${t._id}', '${t.name}')" class="btn-action-reset">Reset Pass</button>
                <button onclick="deleteTrainer('${t._id}', '${t.name}')" class="btn-action-delete">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Render Plans Grid
function renderPlans() {
    const container = document.getElementById('plansContainer');
    if (!container) return;

    if (!globalPlans || globalPlans.length === 0) {
        container.innerHTML = `<p style="color:#777;">No membership plans created yet.</p>`;
        return;
    }

    container.innerHTML = globalPlans.map(p => `
        <div class="plan-item-card">
            <h3>${p.planName || p.name}</h3>
            <div class="plan-item-price">₹${(p.price || 0).toLocaleString('en-IN')} <span style="font-size:12px; color:#888;">/ ${p.durationInMonths || p.durationMonths || 1} Mo</span></div>
            <p style="color:#a0aec0; font-size:13px; margin-bottom:15px; flex-grow:1;">${(p.features || []).join(' • ')}</p>
            <div style="display: flex; gap: 8px;">
                <button onclick="openEditPlanModal('${p._id}')" class="btn-action-edit">Edit Plan</button>
                <button onclick="deletePlan('${p._id}', '${p.planName || p.name}')" class="btn-action-delete">Delete</button>
            </div>
        </div>
    `).join('');
}

// Populate Dropdowns
function populateDropdowns() {
    const memOptions = `<option value="">-- Select Member --</option>` + 
        globalMembers.map(m => `<option value="${m._id}">${m.name} (${m.gymId || m.customId})</option>`).join('');

    ['assignPlanMemberSelect', 'feeMemberSelect', 'assignTraineeMemberSelect'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = memOptions;
    });

    const trOptions = `<option value="">-- No Trainer (Unassigned) --</option>` + 
        globalTrainers.map(t => `<option value="${t._id}" data-salary="${t.monthlySalary || 0}">${t.name} (${t.gymId || t.customId})</option>`).join('');

    ['regMemTrainer', 'assignTraineeTrainerSelect', 'editMemTrainer', 'salTrainerSelect'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = trOptions;
    });

    const planOptions = `<option value="">-- Select Plan --</option>` + 
        globalPlans.map(p => `<option value="${p._id}" data-price="${p.price}">${p.planName || p.name} (₹${p.price})</option>`).join('');

    ['regMemPlan', 'assignPlanSelect', 'feePlanSelect'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = planOptions;
    });

    const feePlan = document.getElementById('feePlanSelect');
    if (feePlan) {
        feePlan.addEventListener('change', () => {
            const selected = feePlan.options[feePlan.selectedIndex];
            const price = selected.getAttribute('data-price') || 0;
            document.getElementById('feeTotalCost').value = price;
            document.getElementById('feeAmountPaid').value = price;
        });
    }

    const startDateInput = document.getElementById('assignPlanStartDate');
    if (startDateInput) startDateInput.value = new Date().toISOString().split('T')[0];

    onAttRoleChange();
}

function onAttRoleChange() {
    const role = document.getElementById('attRoleSelect').value;
    const personSelect = document.getElementById('attPersonSelect');
    if (role === 'member') {
        personSelect.innerHTML = globalMembers.map(m => `<option value="${m._id}">${m.name} (${m.gymId || m.customId})</option>`).join('');
    } else {
        personSelect.innerHTML = globalTrainers.map(t => `<option value="${t._id}">${t.name} (${t.gymId || t.customId})</option>`).join('');
    }
}

// Attendance
async function loadAttendance() {
    try {
        const memAtt = await api.get('/owner/attendance/members');
        const mList = memAtt.attendance || memAtt.data || [];
        const mBody = document.getElementById('memberAttendanceTableBody');
        if (mBody) {
            mBody.innerHTML = mList.length > 0 ? mList.map(a => `
                <tr>
                    <td><strong>${a.user ? (a.user.gymId || a.user.customId) : '-'}</strong></td>
                    <td>${a.user ? a.user.name : 'Athlete'}</td>
                    <td>${a.time || a.inTime || new Date(a.date).toLocaleDateString()}</td>
                    <td><span class="${a.status === 'Present' ? 'badge-active' : 'badge-due'}">${a.status}</span></td>
                    <td><button onclick="openEditAttendanceModal('${a._id}', '${a.user ? a.user.name : ''}', '${a.status}')" class="btn-action-edit">Edit</button>
                    <button onclick="deleteAttendanceRecord('${a._id}')" class="btn-action-delete">Delete</button></td>
                </tr>
            `).join('') : `<tr><td colspan="5" style="text-align:center; color:#777;">No member attendance recorded</td></tr>`;
        }

        const trAtt = await api.get('/owner/attendance/trainers');
        const tList = trAtt.attendance || trAtt.data || [];
        const tBody = document.getElementById('trainerAttendanceTableBody');
        if (tBody) {
            tBody.innerHTML = tList.length > 0 ? tList.map(a => `
                <tr>
                    <td><strong>${a.user ? (a.user.gymId || a.user.customId) : '-'}</strong></td>
                    <td>${a.user ? a.user.name : 'Coach'}</td>
                    <td>${a.time || a.inTime || new Date(a.date).toLocaleDateString()}</td>
                    <td><span class="${a.status === 'Present' ? 'badge-active' : 'badge-due'}">${a.status}</span></td>
                    <td>
                    <button onclick="openEditAttendanceModal('${a._id}', '${a.user ? a.user.name : ''}', '${a.status}')" class="btn-action-edit">Edit</button>
                    <button onclick="deleteAttendanceRecord('${a._id}')" class="btn-action-delete">Delete</button></td>
                </tr>
            `).join('') : `<tr><td colspan="4" style="text-align:center; color:#777;">No trainer attendance recorded</td></tr>`;
        }
    } catch (err) {}
}

async function deleteAttendanceRecord(id) {
    if (!confirm('Delete this attendance record?')) return;
    try {
        const res = await api.delete(`/owner/attendance/${id}`);
        alert(res.message || 'Deleted successfully');
        loadAttendance();
    } catch (err) { alert(err.message); }
}

// Payments
async function loadPayments() {
    try {
        const res = await api.get('/owner/payments');
        const list = res.payments || res.data || [];
        const tbody = document.getElementById('paymentsTableBody');

        if (!tbody) return;
        tbody.innerHTML = list.length > 0 ? list.map(p => `
            <tr>
                <td><strong style="color:#f39c12; font-family: monospace;">${p.invoiceNumber || p.invoiceNo || '-'}</strong></td>
                <td>${p.member ? p.member.name : 'Athlete'}</td>
                <td>${p.membershipPlan ? (p.membershipPlan.planName || p.membershipPlan.name) : '-'}</td>
                <td><strong style="color:#2ecc71;">₹${(p.paidAmount || p.amountPaid || 0).toLocaleString('en-IN')}</strong></td>
                <td><strong style="color:${p.dueAmount > 0 ? '#e74c3c' : '#718096'};">₹${(p.dueAmount || 0).toLocaleString('en-IN')}</strong></td>
                <td>${new Date(p.paymentDate || p.createdAt).toLocaleDateString()}</td>
                <td>
                    <div style="display:flex; gap:6px; align-items:center;">
                        ${p.dueAmount > 0 ? `<button onclick="openPayDueModal('${p._id}', '${p.invoiceNumber || p.invoiceNo}', ${p.dueAmount})" class="btn-sm" style="background:#2ecc71; color:#000; font-weight:bold;">Collect Due</button>` : `<span class="badge-active">Paid</span>`}
                        <button onclick="deletePaymentRecord('${p._id}', '${p.invoiceNumber || p.invoiceNo}')" class="btn-action-delete">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('') : `<tr><td colspan="7" style="text-align:center; color:#777;">No customer payments yet</td></tr>`;
    } catch (err) {}
}

async function deletePaymentRecord(id, inv) {
    if (!confirm(`Delete invoice ${inv}?`)) return;
    try {
        const res = await api.delete(`/owner/payments/${id}`);
        alert(res.message || 'Invoice deleted');
        loadPayments();
    } catch (err) { alert(err.message); }
}

function openPayDueModal(id, invoiceNumber, dueAmount) {
    document.getElementById('duePaymentId').value = id;
    document.getElementById('dueInvoiceNo').value = invoiceNumber;
    document.getElementById('dueOutstanding').value = dueAmount;
    document.getElementById('dueAmountPaying').value = dueAmount;
    openModal('collectDueModal');
}

// Salaries
async function loadSalaries() {
    try {
        const res = await api.get('/owner/salaries');
        const list = res.salaries || res.data || [];
        const tbody = document.getElementById('salariesTableBody');

        if (!tbody) return;
        tbody.innerHTML = list.length > 0 ? list.map(s => `
            <tr>
                <td><strong style="color:#60a5fa; font-family: monospace;">${s.receiptNumber || s.voucherNo || '-'}</strong></td>
                <td><strong>${s.trainer ? s.trainer.name : 'Coach'}</strong></td>
                <td>${s.month}</td>
                <td>₹${(s.baseSalary || 0).toLocaleString('en-IN')}</td>
                <td>+₹${s.bonuses || s.bonus || 0}</td>
                <td><strong style="color:#2ecc71;">₹${(s.netSalary || ((s.baseSalary + (s.bonuses || 0)) - (s.deductions || 0))).toLocaleString('en-IN')}</strong></td>
                <td>${new Date(s.createdAt || Date.now()).toLocaleDateString()}</td>
            </tr>
        `).join('') : `<tr><td colspan="7" style="text-align:center; color:#777;">No salary vouchers issued yet</td></tr>`;
    } catch (err) {}
}

// Workouts & Diets Overview
async function loadWorkouts() {
    try {
        const res = await api.get('/owner/workouts');
        const list = res.workouts || res.data || [];
        const tbody = document.getElementById('allWorkoutsTableBody');

        if (!tbody) return;
        tbody.innerHTML = list.length > 0 ? list.map(w => `
            <tr>
                <td>${w.date || w.day || '-'}</td>
                <td><strong>${w.member ? w.member.name : (w.athleteName || '-')}</strong></td>
                <td>${w.trainer ? w.trainer.name : 'Floor Coach'}</td>
                <td>${w.workoutTitle || w.category || 'General'}</td>
                <td>${w.exercise || (w.exercises ? w.exercises.map(e => e.name).join(', ') : '-')}</td>
                <td>${w.setsReps || (w.exercises ? `${w.exercises.length} exercises` : '-')}</td>
                <td>${w.weight ? `${w.weight} kg` : '-'}</td>
            </tr>
        `).join('') : `<tr><td colspan="7" style="text-align:center; color:#777;">No workout splits logged</td></tr>`;
    } catch (err) {}
}

async function loadDiets() {
    try {
        const res = await api.get('/owner/diets');
        const list = res.diets || res.data || [];
        const tbody = document.getElementById('allDietsTableBody');

        if (!tbody) return;
        tbody.innerHTML = list.length > 0 ? list.map(d => `
            <tr>
                <td><strong>${d.member ? d.member.name : '-'}</strong></td>
                <td>${d.trainer ? d.trainer.name : 'Coach'}</td>
                <td>${d.goal || d.title || d.dailyGoal || 'Nutrition Plan'}</td>
                <td>${d.calories ? `${d.calories} kcal` : '-'}</td>
                <td>${d.protein ? `${d.protein}g` : '-'}</td>
                <td style="font-size:12px; color:#a0aec0;">${d.meals ? `${d.meals.length} meals/day` : (d.instructions || d.breakfast || '-')}</td>
            </tr>
        `).join('') : `<tr><td colspan="6" style="text-align:center; color:#777;">No diet sheets logged</td></tr>`;
    } catch (err) {}
}

// ==================== FORM HANDLERS ====================

// Add Member
document.getElementById('registerMemberForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
        await api.post('/owner/members', {
            name: document.getElementById('regMemName').value,
            email: document.getElementById('regMemEmail').value,
            phone: document.getElementById('regMemPhone').value,
            password: document.getElementById('regMemPassword').value || 'member123',
            assignedTrainer: document.getElementById('regMemTrainer').value || null
        });
        alert('Member registered successfully!');
        closeModal('registerMemberModal');
        this.reset();
        loadAllData();
    } catch (err) { alert(err.message); }
});

// Add Trainer
document.getElementById('addTrainerForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
        await api.post('/owner/trainers', {
            name: document.getElementById('addTraName').value,
            email: document.getElementById('addTraEmail').value,
            phone: document.getElementById('addTraPhone').value,
            password: document.getElementById('addTraPassword').value || 'trainer123',
            specialization: document.getElementById('addTraSpec').value,
            monthlySalary: Number(document.getElementById('addTraSalary').value)
        });
        alert('Trainer added successfully!');
        closeModal('addTrainerModal');
        this.reset();
        loadAllData();
    } catch (err) { alert(err.message); }
});

// Assign Plan
document.getElementById('assignPlanForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
        const res = await api.post('/owner/assign-plan', {
            memberId: document.getElementById('assignPlanMemberSelect').value,
            planId: document.getElementById('assignPlanSelect').value,
            startDate: document.getElementById('assignPlanStartDate').value
        });
        alert(res.message || 'Plan activated!');
        closeModal('assignPlanModal');
        loadAllData();
    } catch (err) { alert(err.message); }
});

// Create Plan
document.getElementById('createPlanForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
        await api.post('/owner/plans', {
            planName: document.getElementById('planName').value,
            durationInMonths: Number(document.getElementById('planDuration').value),
            price: Number(document.getElementById('planPrice').value),
            features: document.getElementById('planFeatures').value
        });
        alert('Plan created successfully!');
        closeModal('createPlanModal');
        this.reset();
        loadAllData();
    } catch (err) { alert(err.message); }
});

// Record Fee Payment
document.getElementById('recordFeeForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
        await api.post('/owner/payments', {
            memberId: document.getElementById('feeMemberSelect').value,
            planId: document.getElementById('feePlanSelect').value,
            totalAmount: Number(document.getElementById('feeTotalCost').value),
            paidAmount: Number(document.getElementById('feeAmountPaid').value),
            paymentMode: document.getElementById('feePaymentMode').value
        });
        alert('Payment recorded and Invoice generated!');
        closeModal('recordFeeModal');
        this.reset();
        loadAllData();
    } catch (err) { alert(err.message); }
});

// Assign Trainer Direct Form
document.getElementById('assignTrainerDirectForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
        await api.post('/owner/assign-trainer', {
            memberId: document.getElementById('assignTraineeMemberSelect').value,
            trainerId: document.getElementById('assignTraineeTrainerSelect').value
        });
        alert('Trainer assigned successfully!');
        loadAllData();
    } catch (err) { alert(err.message); }
});

// Mark Attendance
document.getElementById('markAttendanceForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
        await api.post('/owner/attendance', {
            userId: document.getElementById('attPersonSelect').value,
            userRole: document.getElementById('attRoleSelect').value,
            status: document.getElementById('attStatusSelect').value
        });
        alert('Attendance marked successfully!');
        closeModal('markAttendanceModal');
        loadAllData();
    } catch (err) { alert(err.message); }
});

// Salary Voucher
function onSalTrainerChange() {
    const select = document.getElementById('salTrainerSelect');
    const option = select.options[select.selectedIndex];
    const salary = option ? (option.getAttribute('data-salary') || 0) : 0;
    document.getElementById('salBase').value = salary;
}

document.getElementById('salaryVoucherForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
        await api.post('/owner/salaries', {
            trainerId: document.getElementById('salTrainerSelect').value,
            month: document.getElementById('salMonth').value,
            baseSalary: Number(document.getElementById('salBase').value),
            bonuses: Number(document.getElementById('salBonus').value) || 0,
            deductions: Number(document.getElementById('salDeductions').value) || 0
        });
        alert('Salary voucher issued!');
        closeModal('salaryVoucherModal');
        this.reset();
        loadAllData();
    } catch (err) { alert(err.message); }
});

// Reset Password
function promptResetPassword(userId, userName) {
    document.getElementById('resetUserId').value = userId;
    document.getElementById('resetUserName').value = userName;
    document.getElementById('resetNewPass').value = '';
    openModal('resetPasswordModal');
}

document.getElementById('resetPasswordForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const userId = document.getElementById('resetUserId').value;
    const newPassword = document.getElementById('resetNewPass').value;
    try {
        const res = await api.put(`/owner/users/${userId}/reset-password`, { newPassword });
        alert(res.message || 'Password reset successfully!');
        closeModal('resetPasswordModal');
    } catch (err) { alert(err.message); }
});

// Edit Member
function openEditMemberModal(id) {
    const m = globalMembers.find(item => item._id === id);
    if (!m) return;
    document.getElementById('editMemId').value = m._id;
    document.getElementById('editMemName').value = m.name;
    document.getElementById('editMemEmail').value = m.email || '';
    document.getElementById('editMemPhone').value = m.phone || '';
    document.getElementById('editMemStatus').value = m.isActive !== false ? 'Active' : 'Inactive';
    document.getElementById('editMemTrainer').value = m.assignedTrainer ? (m.assignedTrainer._id || m.assignedTrainer) : '';
    openModal('editMemberModal');
}

document.getElementById('editMemberForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const id = document.getElementById('editMemId').value;
    try {
        await api.put(`/owner/members/${id}`, {
            name: document.getElementById('editMemName').value,
            email: document.getElementById('editMemEmail').value,
            phone: document.getElementById('editMemPhone').value,
            assignedTrainer: document.getElementById('editMemTrainer').value || null,
            isActive: document.getElementById('editMemStatus').value === 'Active'
        });
        alert('Member details updated!');
        closeModal('editMemberModal');
        loadAllData();
    } catch (err) { alert(err.message); }
});

async function deleteMember(id, name) {
    if (!confirm(`Delete member "${name}"?`)) return;
    try {
        const res = await api.delete(`/owner/members/${id}`);
        alert(res.message || 'Member deleted');
        loadAllData();
    } catch (err) { alert(err.message); }
}

// Edit Trainer
function openEditTrainerModal(id) {
    const t = globalTrainers.find(item => item._id === id);
    if (!t) return;
    document.getElementById('editTraId').value = t._id;
    document.getElementById('editTraName').value = t.name;
    document.getElementById('editTraEmail').value = t.email || '';
    document.getElementById('editTraPhone').value = t.phone || '';
    document.getElementById('editTraSpec').value = t.specialization || '';
    document.getElementById('editTraSalary').value = t.monthlySalary || 0;
    document.getElementById('editTraStatus').value = t.isActive !== false ? 'Active' : 'Inactive';
    openModal('editTrainerModal');
}

document.getElementById('editTrainerForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const id = document.getElementById('editTraId').value;
    try {
        await api.put(`/owner/trainers/${id}`, {
            name: document.getElementById('editTraName').value,
            email: document.getElementById('editTraEmail').value,
            phone: document.getElementById('editTraPhone').value,
            specialization: document.getElementById('editTraSpec').value,
            monthlySalary: Number(document.getElementById('editTraSalary').value),
            isActive: document.getElementById('editTraStatus').value === 'Active'
        });
        alert('Trainer details updated!');
        closeModal('editTrainerModal');
        loadAllData();
    } catch (err) { alert(err.message); }
});

async function deleteTrainer(id, name) {
    if (!confirm(`Delete trainer "${name}"?`)) return;
    try {
        const res = await api.delete(`/owner/trainers/${id}`);
        alert(res.message || 'Trainer deleted');
        loadAllData();
    } catch (err) { alert(err.message); }
}

// Edit Plan
function openEditPlanModal(id) {
    const p = globalPlans.find(item => item._id === id);
    if (!p) return;
    document.getElementById('planName').value = p.planName || p.name;
    document.getElementById('planDuration').value = p.durationInMonths || p.durationMonths;
    document.getElementById('planPrice').value = p.price;
    document.getElementById('planFeatures').value = (p.features || []).join(', ');
    openModal('createPlanModal');
}

async function deletePlan(id, name) {
    if (!confirm(`Delete plan "${name}"?`)) return;
    try {
        const res = await api.delete(`/owner/plans/${id}`);
        alert(res.message || 'Plan deleted');
        loadAllData();
    } catch (err) { alert(err.message); }
}

// Collect Remaining Due Fee
document.getElementById('collectDueForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const id = document.getElementById('duePaymentId').value;
    const amount = Number(document.getElementById('dueAmountPaying').value);
    const paymentMode = document.getElementById('duePaymentMode').value;
    try {
        const res = await api.put(`/owner/payments/${id}/pay-due`, { amount, paymentMode });
        alert(res.message || 'Due payment collected successfully!');
        closeModal('collectDueModal');
        loadAllData();
    } catch (err) { alert(err.message); }
});

// Change Password (Self)
document.getElementById('changePasswordForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
        const res = await api.put('/auth/change-password', {
            currentPassword: document.getElementById('ownerOldPass').value,
            newPassword: document.getElementById('ownerNewPass').value
        });
        alert(res.message || 'Password updated successfully!');
        closeModal('changePasswordModal');
        this.reset();
    } catch (err) { alert(err.message); }
});
 
// Initial Launch
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
});

// Open Edit Modal
function openEditAttendanceModal(id, name, status) {
    document.getElementById('editAttId').value = id;
    document.getElementById('editAttPersonName').value = name || 'User';
    document.getElementById('editAttStatus').value = status || 'Present';
    openModal('editAttendanceModal');
}

document.getElementById('editAttendanceForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const id = document.getElementById('editAttId').value;
    const status = document.getElementById('editAttStatus').value;

    try {
        const res = await api.put(`/owner/attendance/${id}`, { status });
        alert(res.message || 'Attendance record updated!');
        closeModal('editAttendanceModal');
        loadAttendance();
    } catch (err) {
        alert(err.message || 'Failed to update attendance');
    }
});