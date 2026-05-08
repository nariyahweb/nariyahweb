// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCfj2Xdj6et3fThyA2gg-GWG8yZOhoqREA",
    authDomain: "floupyud.firebaseapp.com",
    projectId: "floupyud"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let importType = "prospek";
let chartCustomer = null;
let chartProspek = null;
let sidebarTimeout = null;
let currentConvertProspekId = null;
let currentPendingId = null;
let pendingItems = [];
let currentProspekId = null;

let customersData = [];
let prospekData = [];

// ========== HELPER FUNCTIONS ==========
function showNotif(msg, isError = false) {
    const notif = document.createElement('div');
    notif.textContent = msg;
    notif.className = `notif-toast ${isError ? 'notif-error' : 'notif-success'}`;
    document.getElementById('notifBox').appendChild(notif);
    setTimeout(() => notif.remove(), 5000);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
    document.body.classList.remove('modal-open');
}

function openWA(hp) {
    if (!hp) return;
    let nomor = hp.toString().replace('+', '').replace(/^0/, '62');
    window.open('https://wa.me/' + nomor, '_blank');
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

function isMobile() { return window.innerWidth <= 768; }
function updateSidebarBodyClass() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('active')) document.body.classList.add('sidebar-open');
    else document.body.classList.remove('sidebar-open');
}

function getStatusBadge(status) {
    const statusMap = {
        'baru': 'status-baru', 'followup': 'status-followup',
        'pending': 'status-pending', 'closing': 'status-closing',
        'Baru': 'status-baru', 'Dihubungi': 'status-dihubungi',
        'Negosiasi': 'status-negosiasi', 'Tertarik': 'status-tertarik'
    };
    const className = statusMap[status] || 'status-baru';
    let displayName = status;
    if (status === 'followup') displayName = 'Follow Up';
    else if (status === 'Dihubungi') displayName = 'Dihubungi';
    else if (status === 'Negosiasi') displayName = 'Negosiasi';
    else if (status === 'Tertarik') displayName = 'Tertarik';
    return `<span class="status-badge ${className}">${displayName}</span>`;
}

// ========== FUNGSI DEADLINE ==========
function addDaysToDate(dateStr, days) {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// ========== FUNGSI FORMAT INPUT ==========
function formatAgentId(input) {
    let value = input.value.toUpperCase();
    value = value.replace(/[^A-Z0-9-]/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    input.value = value;
}

function formatNama(input) {
    let value = input.value;
    if (value.length > 20) value = value.slice(0, 20);
    value = value.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
    input.value = value;
}

function formatPhone(input) {
    let value = input.value.replace(/[^\d]/g, '');
    if (value.startsWith('62')) value = value.substring(2);
    if (value.startsWith('0')) value = value.substring(1);
    if (value.length > 12) value = value.slice(0, 12);
    if (value.length > 0 && !value.startsWith('8')) {
        value = '8' + value;
    }
    input.value = value;
}

// ========== FUNGSI KONFIRMASI DENGAN POPUP ==========
function showConfirmDialog(title, message, onConfirm, onCancel) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h3 style="color: #ef4444;">⚠️ ${title}</h3>
            <div class="modal-subtitle" style="color: #374151; white-space: pre-line;">${message}</div>
            <div style="padding: 0 20px 20px 20px;">
                <p style="font-size: 12px; color: #ef4444; margin-bottom: 16px;">⚠️ Peringatan: Data yang sudah dipindahkan TIDAK BISA dikembalikan!</p>
                <div class="modal-buttons">
                    <button id="confirmYesBtn" class="btn-danger" style="background: #dc2626;">✅ Ya, Lanjutkan</button>
                    <button id="confirmNoBtn" class="btn-outline">❌ Batal</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    
    const yesBtn = modal.querySelector('#confirmYesBtn');
    const noBtn = modal.querySelector('#confirmNoBtn');
    
    yesBtn.onclick = () => {
        modal.remove();
        document.body.classList.remove('modal-open');
        if (onConfirm) onConfirm();
    };
    noBtn.onclick = () => {
        modal.remove();
        document.body.classList.remove('modal-open');
        if (onCancel) onCancel();
    };
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
            document.body.classList.remove('modal-open');
            if (onCancel) onCancel();
        }
    };
}

// ========== FUNGSI INPUT DIALOG ==========
function showInputDialog(title, message, fields, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    let fieldsHtml = '';
    fields.forEach(field => {
        if (field.type === 'select') {
            let optionsHtml = '';
            field.options.forEach(opt => {
                optionsHtml += `<option value="${opt}">${opt}</option>`;
            });
            fieldsHtml += `
                <div class="form-group">
                    <label>${field.label} ${field.required ? '<span class="required">*</span>' : ''}</label>
                    <select id="${field.id}" style="width:100%; padding:12px; border-radius:14px; border:1.5px solid #e5e7eb;">
                        <option value="">Pilih ${field.label}</option>
                        ${optionsHtml}
                    </select>
                </div>
            `;
        } else {
            fieldsHtml += `
                <div class="form-group">
                    <label>${field.label} ${field.required ? '<span class="required">*</span>' : ''}</label>
                    <input type="${field.type}" id="${field.id}" placeholder="${field.placeholder}" style="width:100%; padding:12px; border-radius:14px; border:1.5px solid #e5e7eb;">
                </div>
            `;
        }
    });
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 450px;">
            <h3>${title}</h3>
            <div class="modal-subtitle" style="white-space: pre-line;">${message}</div>
            <div style="padding: 0 20px;">
                ${fieldsHtml}
            </div>
            <div class="modal-buttons">
                <button id="inputConfirmBtn" class="btn-primary">✅ Lanjutkan</button>
                <button id="inputCancelBtn" class="btn-outline">❌ Batal</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    
    const confirmBtn = modal.querySelector('#inputConfirmBtn');
    const cancelBtn = modal.querySelector('#inputCancelBtn');
    
    confirmBtn.onclick = () => {
        const values = {};
        let allFilled = true;
        fields.forEach(field => {
            const input = document.getElementById(field.id);
            if (input) {
                values[field.id] = input.value;
                if (field.required && !input.value) {
                    allFilled = false;
                }
            }
        });
        if (!allFilled) {
            showNotif('⚠️ Semua field wajib diisi!', true);
            return;
        }
        modal.remove();
        document.body.classList.remove('modal-open');
        if (onConfirm) onConfirm(values);
    };
    cancelBtn.onclick = () => {
        modal.remove();
        document.body.classList.remove('modal-open');
    };
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
            document.body.classList.remove('modal-open');
        }
    };
}

// ========== FUNGSI EDIT DEADLINE ==========
let currentEditItem = null;
let currentEditType = null;

function openEditDeadlineModal(id, type, currentDeadline) {
    currentEditItem = id;
    currentEditType = type;
    document.getElementById('editDeadlineDate').value = currentDeadline || getTodayDate();
    document.getElementById('editDeadlineModal').style.display = 'flex';
}

document.getElementById('saveDeadlineBtn')?.addEventListener('click', async () => {
    const newDeadline = document.getElementById('editDeadlineDate').value;
    if (!newDeadline) {
        showNotif('⚠️ Tanggal deadline harus diisi!', true);
        return;
    }
    
    try {
        if (currentEditType === 'customer') {
            await db.collection('customers').doc(currentEditItem).update({ tanggal: newDeadline });
            showNotif('✅ Deadline customer berhasil diubah menjadi ' + newDeadline);
        } else if (currentEditType === 'prospek') {
            await db.collection('prospek').doc(currentEditItem).update({ deadline: newDeadline });
            showNotif('✅ Deadline prospek berhasil diubah menjadi ' + newDeadline);
        }
        closeModal('editDeadlineModal');
        loadAllData();
    } catch(e) {
        showNotif('❌ Gagal: ' + e.message, true);
    }
});

document.getElementById('cancelDeadlineBtn')?.addEventListener('click', () => {
    closeModal('editDeadlineModal');
});

// ========== SIDEBAR ==========
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const hoverZone = document.getElementById('hoverZone');
    const toggleBtn = document.getElementById('toggleSidebarBtn');
    function updateState() { updateSidebarBodyClass(); }
    if (hoverZone) {
        hoverZone.addEventListener('mouseenter', function() {
            if (!isMobile() && sidebar) { clearTimeout(sidebarTimeout); sidebar.classList.add('active'); updateState(); }
        });
    }
    if (sidebar) {
        sidebar.addEventListener('mouseleave', function() {
            if (!isMobile()) { sidebarTimeout = setTimeout(() => { sidebar.classList.remove('active'); updateState(); }, 200); }
        });
        sidebar.addEventListener('mouseenter', () => clearTimeout(sidebarTimeout));
    }
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function(e) { e.stopPropagation(); if (sidebar) sidebar.classList.toggle('active'); updateState(); });
    }
    document.addEventListener('click', function(e) {
        if (isMobile() && sidebar && toggleBtn && !sidebar.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
            sidebar.classList.remove('active'); updateState();
        }
    });
    window.addEventListener('resize', function() {
        if (sidebar) sidebar.classList.remove('active');
        updateState();
    });
    updateState();
    setupConvertModal();
});

const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const loginPassword = document.getElementById('loginPassword');
if (togglePasswordBtn && loginPassword) {
    togglePasswordBtn.addEventListener('click', function() {
        if (loginPassword.type === 'password') { loginPassword.type = 'text'; this.textContent = '🙈'; }
        else { loginPassword.type = 'password'; this.textContent = '👁️'; }
    });
}

const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
    loginBtn.addEventListener('click', function() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');
        if (!email || !password) { errorDiv.textContent = 'Email dan password harus diisi!'; return; }
        errorDiv.textContent = '';
        this.textContent = 'Loading...';
        this.disabled = true;
        auth.signInWithEmailAndPassword(email, password)
            .then(() => { this.textContent = 'Masuk'; this.disabled = false; })
            .catch(err => { errorDiv.textContent = 'Login gagal: ' + err.message; this.textContent = 'Masuk'; this.disabled = false; });
    });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', () => auth.signOut());

async function updateDeadlineBadge() {
    if (!currentUser) return;
    const badge = document.getElementById('deadlineCount');
    if (!badge) return;
    try {
        const today = getTodayDate();
        const customerOverdue = await db.collection('customers').where('user_id', '==', currentUser.uid).where('tanggal', '<', today).get();
        const prospekOverdue = await db.collection('prospek').where('user_id', '==', currentUser.uid).where('deadline', '<', today).get();
        const deadlineCount = customerOverdue.size + prospekOverdue.size;
        badge.innerText = deadlineCount;
        if (deadlineCount > 0) badge.classList.add('has-notif');
        else badge.classList.remove('has-notif');
    } catch(e) { console.error(e); }
}

async function updatePesanBadge() {
    if (!currentUser) return;
    const badge = document.getElementById('pesanCount');
    if (!badge) return;
    try {
        const pesanSnapshot = await db.collection('messages').where('to_id', '==', currentUser.uid).where('is_read', '==', false).get();
        const pesanCount = pesanSnapshot.size;
        badge.innerText = pesanCount;
        if (pesanCount > 0) badge.classList.add('has-notif');
        else badge.classList.remove('has-notif');
    } catch(e) { console.error(e); }
}

async function updateAllBadges() {
    await updateDeadlineBadge();
    await updatePesanBadge();
}

auth.onAuthStateChanged(async user => {
    const loginPage = document.getElementById('loginPage');
    const app = document.getElementById('app');
    if (user) {
        currentUser = user;
        loginPage.style.display = 'none';
        app.style.display = 'block';
        db.collection('users').doc(user.uid).get().then(doc => {
            let nama = 'CS Agent', foto = 'https://i.pravatar.cc/40';
            if (doc.exists && doc.data().nama) nama = doc.data().nama;
            if (doc.exists && doc.data().foto) foto = doc.data().foto;
            document.getElementById('topUserName').innerText = nama;
            document.getElementById('profileName').value = nama;
            document.getElementById('profileImg').src = foto;
            document.getElementById('previewFoto').src = foto;
        });
        document.getElementById('profileEmail').value = user.email;
        await updateAllBadges();
        loadAllData();
        loadReminders();
        loadPesan();
        loadDBClosing();
        loadDBTidak();
        loadDBNomorSalah();
        loadDBCommitment();
    } else {
        loginPage.style.display = 'flex';
        app.style.display = 'none';
        currentUser = null;
    }
});

document.querySelectorAll('.menu-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;
        const pages = ['dashboardPage', 'importPage', 'dbClosingPage', 'dbTidakPage', 'dbNomorSalahPage', 'dbCommitmentPage', 'reminderPage', 'pesanPage', 'broadcastPage', 'followupFullPage', 'prospekFullPage'];
        pages.forEach(p => { const el = document.getElementById(p); if (el) el.style.display = 'none'; });
        if (page === 'dashboard') document.getElementById('dashboardPage').style.display = 'block';
        else if (page === 'import') document.getElementById('importPage').style.display = 'block';
        else if (page === 'dbClosing') { document.getElementById('dbClosingPage').style.display = 'block'; loadDBClosing(); }
        else if (page === 'dbTidak') { document.getElementById('dbTidakPage').style.display = 'block'; loadDBTidak(); }
        else if (page === 'dbNomorSalah') { document.getElementById('dbNomorSalahPage').style.display = 'block'; loadDBNomorSalah(); }
        else if (page === 'dbCommitment') { document.getElementById('dbCommitmentPage').style.display = 'block'; loadDBCommitment(); }
        else if (page === 'reminder') { document.getElementById('reminderPage').style.display = 'block'; loadReminders(); }
        else if (page === 'pesan') { document.getElementById('pesanPage').style.display = 'block'; loadPesan(); loadUsersForSelect(); }
        else if (page === 'broadcast') { document.getElementById('broadcastPage').style.display = 'block'; initBroadcast(); }
        else if (page === 'followupFull') { document.getElementById('followupFullPage').style.display = 'block'; renderFullFollowupKanban(); }
        else if (page === 'prospekFull') { document.getElementById('prospekFullPage').style.display = 'block'; renderFullProspekKanban(); }
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        item.classList.add('active');
        if (window.innerWidth <= 768) document.getElementById('sidebar')?.classList.remove('active');
        updateSidebarBodyClass();
    });
});

document.querySelectorAll('.closeModalBtn').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.modal)));
document.querySelectorAll('.modal').forEach(modal => modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal.id); }));

// ========== TOMBOL INFORMASI ==========
document.getElementById('infoBtn')?.addEventListener('click', () => {
    document.getElementById('infoModal').style.display = 'flex';
});

document.getElementById('infoModalClose')?.addEventListener('click', () => {
    closeModal('infoModal');
});

const profileImg = document.getElementById('profileImg');
if (profileImg) {
    profileImg.addEventListener('click', () => {
        document.getElementById('profileModal').style.display = 'flex';
        db.collection('users').doc(currentUser.uid).get().then(doc => {
            if (doc.exists) {
                document.getElementById('profileName').value = doc.data().nama || '';
                document.getElementById('profilePhone').value = doc.data().hp ? doc.data().hp.replace('+62', '') : '';
                if (doc.data().foto) document.getElementById('previewFoto').src = doc.data().foto;
            }
        });
    });
}
function showPhotoPreview(imageUrl) {
    const previewModal = document.getElementById('previewPhotoModal');
    const previewImage = document.getElementById('previewPhotoLarge');
    if (previewImage && previewModal) {
        previewImage.src = imageUrl;
        previewModal.style.display = 'flex';
        document.body.classList.add('modal-open');
    }
}
const previewFoto = document.getElementById('previewFoto');
if (previewFoto) previewFoto.addEventListener('click', (e) => { e.stopPropagation(); showPhotoPreview(document.getElementById('previewFoto').src); });
const cameraIcon = document.getElementById('cameraIcon');
if (cameraIcon) cameraIcon.addEventListener('click', () => document.getElementById('profileFoto').click());
const profileFotoInput = document.getElementById('profileFoto');
if (profileFotoInput) {
    profileFotoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            if (file.size > 1024*1024) { showNotif('Ukuran foto maksimal 1MB', true); return; }
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('previewFoto').src = e.target.result;
                document.getElementById('profileImg').src = e.target.result;
                showNotif('Foto baru dipilih, klik Simpan untuk menyimpan');
            };
            reader.readAsDataURL(file);
        }
    });
}
const saveProfileBtn = document.getElementById('saveProfileBtn');
if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', async () => {
        const nama = document.getElementById('profileName').value;
        let hp = document.getElementById('profilePhone').value;
        const foto = document.getElementById('previewFoto').src;
        if (!nama) { showNotif('Nama wajib diisi', true); return; }
        if (hp) { hp = hp.replace(/\D/g, ''); if (hp.startsWith('0')) hp = hp.substring(1); hp = '+62' + hp; }
        else hp = '+62';
        try {
            await db.collection('users').doc(currentUser.uid).set({ nama, hp, foto, email: currentUser.email, updated_at: new Date().toISOString() }, { merge: true });
            document.getElementById('topUserName').innerText = nama;
            document.getElementById('profileImg').src = foto;
            closeModal('profileModal');
            showNotif('Profile tersimpan');
        } catch(e) { showNotif('Gagal: ' + e.message, true); }
    });
}
function formatPhoneInput(input) {
    if (input) input.addEventListener('input', function() { let value = this.value.replace(/\D/g, ''); if (value.startsWith('0')) value = value.substring(1); this.value = value; });
}
formatPhoneInput(document.getElementById('customerPhone'));
formatPhoneInput(document.getElementById('prospekPhone'));
formatPhoneInput(document.getElementById('profilePhone'));
document.getElementById('previewPhotoModal')?.addEventListener('click', (e) => { if (e.target === document.getElementById('previewPhotoModal')) closeModal('previewPhotoModal'); });

// ========== FORMAT INPUT UNTUK MODAL ==========
const customerIdInput = document.getElementById('customerId');
const customerNameInput = document.getElementById('customerName');
const customerPhoneInput2 = document.getElementById('customerPhone');
const prospekNameInput = document.getElementById('prospekName');
const prospekPhoneInput2 = document.getElementById('prospekPhone');

if (customerIdInput) {
    customerIdInput.addEventListener('input', function() { formatAgentId(this); });
    customerIdInput.addEventListener('blur', function() { formatAgentId(this); });
}
if (customerNameInput) {
    customerNameInput.addEventListener('input', function() { formatNama(this); });
    customerNameInput.addEventListener('blur', function() { formatNama(this); });
}
if (customerPhoneInput2) {
    customerPhoneInput2.addEventListener('input', function() { formatPhone(this); });
    customerPhoneInput2.addEventListener('blur', function() { formatPhone(this); });
}
if (prospekNameInput) {
    prospekNameInput.addEventListener('input', function() { formatNama(this); });
    prospekNameInput.addEventListener('blur', function() { formatNama(this); });
}
if (prospekPhoneInput2) {
    prospekPhoneInput2.addEventListener('input', function() { formatPhone(this); });
    prospekPhoneInput2.addEventListener('blur', function() { formatPhone(this); });
}

// ========== CUSTOMER CRUD ==========
document.getElementById('addCustomerBtn')?.addEventListener('click', () => {
    const today = getTodayDate();
    document.getElementById('customerDate').value = today;
    document.getElementById('customerModal').style.display = 'flex';
});

const saveCustomerBtn = document.getElementById('saveCustomerBtn');
if (saveCustomerBtn) {
    const newSaveCustomerBtn = saveCustomerBtn.cloneNode(true);
    saveCustomerBtn.parentNode.replaceChild(newSaveCustomerBtn, saveCustomerBtn);
    
    newSaveCustomerBtn.addEventListener('click', () => {
        let agentId = document.getElementById('customerId').value;
        let nama = document.getElementById('customerName').value;
        let hp = document.getElementById('customerPhone').value;
        const apk = document.getElementById('customerApk').value;
        let tanggal = document.getElementById('customerDate').value;
        
        if (!agentId) { showNotif('ID Agent wajib diisi!', true); return; }
        if (!nama) { showNotif('Nama wajib diisi!', true); return; }
        if (!hp) { showNotif('Nomor WhatsApp wajib diisi!', true); return; }
        if (hp.length < 9) { showNotif('Nomor WhatsApp minimal 9 digit!', true); return; }
        if (hp.length > 12) { showNotif('Nomor WhatsApp maksimal 12 digit!', true); return; }
        if (!hp.startsWith('8')) { showNotif('Nomor WhatsApp harus diawali dengan 8!', true); return; }
        if (!apk) { showNotif('Aplikasi wajib dipilih!', true); return; }
        
        if (!tanggal) tanggal = getTodayDate();
        let cleanHp = '+62' + hp;
        
        db.collection('customers').add({ 
            agent_id: agentId, 
            nama: nama, 
            hp: cleanHp, 
            apk: apk, 
            tanggal: tanggal, 
            status: 'baru', 
            user_id: currentUser.uid, 
            created_at: new Date().toISOString(), 
            followup_data: null, 
            pending_data: [] 
        })
        .then(() => { 
            closeModal('customerModal'); 
            document.getElementById('customerId').value = ''; 
            document.getElementById('customerName').value = ''; 
            document.getElementById('customerPhone').value = ''; 
            document.getElementById('customerApk').value = ''; 
            document.getElementById('customerDate').value = ''; 
            showNotif('Customer berhasil ditambahkan'); 
            updateAllBadges(); 
            loadAllData();
        })
        .catch(e => showNotif('Error: ' + e.message, true));
    });
}

// ========== PROSPEK CRUD ==========
document.getElementById('addProspekBtn')?.addEventListener('click', () => {
    const today = getTodayDate();
    document.getElementById('prospekDeadline').value = today;
    document.getElementById('prospekModal').style.display = 'flex';
});

const saveProspekBtn = document.getElementById('saveProspekBtn');
if (saveProspekBtn) {
    const newSaveProspekBtn = saveProspekBtn.cloneNode(true);
    saveProspekBtn.parentNode.replaceChild(newSaveProspekBtn, saveProspekBtn);
    
    newSaveProspekBtn.addEventListener('click', () => {
        let nama = document.getElementById('prospekName').value;
        let hp = document.getElementById('prospekPhone').value;
        const status = document.getElementById('prospekStatusSelect').value;
        let deadline = document.getElementById('prospekDeadline').value;
        
        if (!nama) { showNotif('Nama wajib diisi!', true); return; }
        if (!hp) { showNotif('Nomor WhatsApp wajib diisi!', true); return; }
        if (hp.length < 9) { showNotif('Nomor WhatsApp minimal 9 digit!', true); return; }
        if (hp.length > 12) { showNotif('Nomor WhatsApp maksimal 12 digit!', true); return; }
        if (!hp.startsWith('8')) { showNotif('Nomor WhatsApp harus diawali dengan 8!', true); return; }
        
        if (!deadline) deadline = getTodayDate();
        let cleanHp = '+62' + hp;
        
        db.collection('prospek').add({ 
            nama: nama, 
            hp: cleanHp, 
            status: status || 'Baru', 
            deadline: deadline, 
            user_id: currentUser.uid, 
            created_at: new Date().toISOString(), 
            dihubungi_data: null,
            negosiasi_data: null
        })
        .then(() => { 
            closeModal('prospekModal'); 
            document.getElementById('prospekName').value = ''; 
            document.getElementById('prospekPhone').value = ''; 
            document.getElementById('prospekDeadline').value = ''; 
            showNotif('Prospek berhasil ditambahkan'); 
            updateAllBadges(); 
            loadAllData();
        })
        .catch(e => showNotif('Error: ' + e.message, true));
    });
}

// ========== DETAIL MODAL ==========
function showModal(modalId) { const modal = document.getElementById(modalId); if (modal) { modal.style.display = 'flex'; document.body.classList.add('modal-open'); } }

function openDetailCustomer(id) {
    db.collection('customers').doc(id).get().then(doc => {
        const d = doc.data();
        const statusIcon = d.status === 'closing' ? '🎉' : d.status === 'pending' ? '⏳' : d.status === 'followup' ? '📞' : '🆕';
        let actionButtons = '';
        if (d.status === 'baru') {
            actionButtons = `<button class="btn-primary" onclick="updateCustomerStatus('${id}','followup')">📞 Lanjut ke Follow Up</button>`;
        } else if (d.status === 'followup') {
            actionButtons = `<button class="btn-primary" onclick="openFollowupConfirm('${id}')">📞 Konfirmasi Follow Up</button>`;
        } else if (d.status === 'pending') {
            actionButtons = `<button class="btn-warning" onclick="openPendingModal('${id}')">📝 Kelola Pending</button>`;
        } else if (d.status === 'closing') {
            actionButtons = `<button class="btn-success" onclick="saveToClosingNow('${id}')">💾 Simpan ke DB Closing</button>`;
        }
        let followupInfo = '';
        if (d.followup_data) {
            followupInfo = `<div class="detail-info-item"><div class="detail-info-icon">✅</div><div class="detail-info-content"><label>Follow Up</label><div class="value">Terkirim: ${d.followup_data.terkirim ? 'Ya' : 'Tidak'} | Dibalas: ${d.followup_data.dibalas ? 'Ya' : 'Tidak'}</div></div></div>`;
        }
        let pendingInfo = '';
        if (d.pending_data && d.pending_data.length) {
            pendingInfo = `<div class="detail-info-item"><div class="detail-info-icon">📝</div><div class="detail-info-content"><label>Pending Responses</label><div class="value">${d.pending_data.length} balasan tercatat</div></div></div>`;
        }
        
        const deadlineDisplay = d.tanggal || '-';
        const editBtn = `<button class="edit-deadline-btn" onclick="openEditDeadlineModal('${id}','customer','${d.tanggal || ''}')" title="Edit deadline">✏️</button>`;
        
        document.getElementById('detailContent').innerHTML = `
            <div class="detail-header"><div class="detail-avatar">${statusIcon}</div><h3>${escapeHtml(d.nama)}</h3><div class="detail-status">${getStatusBadge(d.status)}</div></div>
            <div class="detail-body">
                <div class="detail-info">
                    <div class="detail-info-item"><div class="detail-info-icon">🆔</div><div class="detail-info-content"><label>ID Agent</label><div class="value">${escapeHtml(d.agent_id || '-')}</div></div></div>
                    <div class="detail-info-item"><div class="detail-info-icon">📱</div><div class="detail-info-content"><label>Aplikasi</label><div class="value">${escapeHtml(d.apk || '-')}</div></div></div>
                    <div class="detail-info-item"><div class="detail-info-icon">📱</div><div class="detail-info-content"><label>Nomor WhatsApp</label><div class="value">${escapeHtml(d.hp)}</div></div></div>
                    <div class="detail-info-item"><div class="detail-info-icon">📅</div><div class="detail-info-content"><label>Deadline</label><div class="value">${deadlineDisplay} ${editBtn}</div></div></div>
                    ${followupInfo}
                    ${pendingInfo}
                    <div class="detail-info-item"><div class="detail-info-icon">📌</div><div class="detail-info-content"><label>Status</label><div class="value">${d.status === 'followup' ? 'Follow Up' : d.status === 'baru' ? 'Baru' : d.status}</div></div></div>
                </div>
                <div class="detail-actions"><button class="btn-success" onclick="openWA('${d.hp}')">💬 WhatsApp</button>${actionButtons}</div>
            </div>
            <div class="detail-footer"><button class="btn-outline" onclick="closeModal('detailModal')">❌ Tutup</button><button class="btn-danger" onclick="deleteCustomer('${id}')">🗑️ Hapus</button></div>
        `;
        showModal('detailModal');
    });
}

window.updateCustomerStatus = async function(id, newStatus) {
    if (newStatus === 'followup') {
        const doc = await db.collection('customers').doc(id).get();
        const currentDeadline = doc.data().tanggal || getTodayDate();
        const newDeadline = addDaysToDate(currentDeadline, 1);
        await db.collection('customers').doc(id).update({ 
            status: 'followup',
            tanggal: newDeadline
        });
        showNotif(`✅ Status berhasil diupdate ke Follow Up. Deadline +1 hari menjadi ${newDeadline}`);
        closeModal('detailModal');
        loadAllData();
    }
};

window.deleteCustomer = function(id) { if (confirm('Yakin hapus customer ini?')) { db.collection('customers').doc(id).delete(); closeModal('detailModal'); showNotif('Data dihapus'); updateAllBadges(); } };
window.deleteProspek = function(id) { if (confirm('Yakin hapus prospek ini?')) { db.collection('prospek').doc(id).delete(); closeModal('detailModal'); showNotif('Data dihapus'); updateAllBadges(); } };

// ========== FOLLOWUP CONFIRMATION ==========
function openFollowupConfirm(id) {
    currentPendingId = id;
    document.getElementById('followup_terkirim').checked = false;
    document.getElementById('followup_dibalas').checked = false;
    document.getElementById('followupConfirmYes').disabled = true;
    document.getElementById('followupConfirmModal').style.display = 'flex';
    const cb1 = document.getElementById('followup_terkirim');
    const cb2 = document.getElementById('followup_dibalas');
    const yesBtn = document.getElementById('followupConfirmYes');
    const noBtn = document.getElementById('followupConfirmNo');
    const checkBoth = () => { yesBtn.disabled = !(cb1.checked && cb2.checked); };
    cb1.onchange = checkBoth;
    cb2.onchange = checkBoth;
    yesBtn.onclick = async () => {
        const doc = await db.collection('customers').doc(id).get();
        const currentDeadline = doc.data().tanggal || getTodayDate();
        const newDeadline = addDaysToDate(currentDeadline, 1);
        await db.collection('customers').doc(id).update({ 
            followup_data: { terkirim: true, dibalas: true, timestamp: new Date().toISOString() }, 
            status: 'pending',
            tanggal: newDeadline
        });
        closeModal('followupConfirmModal');
        showNotif(`✅ Customer dipindahkan ke Pending. Deadline +1 hari menjadi ${newDeadline}`);
        loadAllData();
        closeModal('detailModal');
    };
    noBtn.onclick = async () => {
        const doc = await db.collection('customers').doc(id).get();
        if (doc.exists) {
            showConfirmDialog(
                'Pindahkan ke Database Nomor Salah?',
                `Apakah Anda yakin nomor "${escapeHtml(doc.data().hp)}" milik "${escapeHtml(doc.data().nama)}" tidak dapat dihubungi?\n\n⚠️ Data yang sudah dipindahkan TIDAK BISA dikembalikan ke Followup Agen!`,
                async () => {
                    await db.collection('nomor_salah').add({ ...doc.data(), alasan: 'Nomor tidak bisa dihubungi / tidak aktif', deleted_at: new Date().toISOString(), user_id: currentUser.uid });
                    await db.collection('customers').doc(id).delete();
                    showNotif('📵 Data dipindahkan ke Database Nomor Salah');
                    closeModal('followupConfirmModal');
                    closeModal('detailModal');
                    loadAllData();
                }
            );
        }
    };
}

// ========== PENDING MODAL DENGAN TOMBOL SIMPAN ==========
function openPendingModal(id) {
    currentPendingId = id;
    db.collection('customers').doc(id).get().then(doc => {
        const data = doc.data();
        pendingItems = data.pending_data || [];
        renderPendingModal();
        document.getElementById('pendingModal').style.display = 'flex';
    });
}

function renderPendingModal() {
    const container = document.getElementById('pendingItemsContainer');
    if (!container) return;
    container.innerHTML = '';
    
    if (pendingItems.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.textAlign = 'center';
        emptyDiv.style.padding = '20px';
        emptyDiv.style.color = '#9ca3af';
        emptyDiv.innerHTML = 'Belum ada catatan pending. Klik "+ Tambah Balasan" untuk menambahkan.';
        container.appendChild(emptyDiv);
    }
    
    pendingItems.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'pending-item';
        div.innerHTML = `
            <input type="text" value="${escapeHtml(item.text)}" placeholder="Balasan/respon..." style="flex:1; padding: 6px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <input type="checkbox" ${item.checked ? 'checked' : ''} style="width: 20px; height: 20px;">
            <button class="delete-pending-item" data-idx="${idx}" style="background: none; border: none; cursor: pointer; font-size: 16px;">🗑️</button>
        `;
        const textInput = div.querySelector('input[type="text"]');
        const checkBox = div.querySelector('input[type="checkbox"]');
        const delBtn = div.querySelector('.delete-pending-item');
        
        textInput.addEventListener('change', (e) => { 
            pendingItems[idx].text = e.target.value; 
            updatePendingButtons();
        });
        checkBox.addEventListener('change', (e) => { 
            pendingItems[idx].checked = e.target.checked; 
            updatePendingButtons();
        });
        delBtn.addEventListener('click', () => { 
            pendingItems.splice(idx, 1); 
            renderPendingModal(); 
            updatePendingButtons();
        });
        container.appendChild(div);
    });
    
    const addBtn = document.getElementById('addPendingItemBtn');
    if (addBtn) {
        addBtn.onclick = () => { 
            pendingItems.push({ text: '', checked: false }); 
            renderPendingModal(); 
            updatePendingButtons();
        };
    }
    
    updatePendingButtons();
}

function updatePendingButtons() {
    const allFilledAndChecked = pendingItems.length > 0 && pendingItems.every(item => item.checked === true && item.text.trim() !== '');
    
    const finishBtn = document.getElementById('pendingFinishBtn');
    if (finishBtn) {
        finishBtn.disabled = !allFilledAndChecked;
        if (allFilledAndChecked) {
            finishBtn.onclick = async () => {
                await db.collection('customers').doc(currentPendingId).update({ pending_data: pendingItems });
                await window.confirmClosing(currentPendingId);
                closeModal('pendingModal');
            };
        }
    }
    
    const saveBtn = document.getElementById('pendingSaveBtn');
    if (saveBtn) {
        saveBtn.onclick = async () => {
            const doc = await db.collection('customers').doc(currentPendingId).get();
            const currentDeadline = doc.data().tanggal || getTodayDate();
            const newDeadline = addDaysToDate(currentDeadline, 3);
            await db.collection('customers').doc(currentPendingId).update({ 
                pending_data: pendingItems,
                tanggal: newDeadline
            });
            showNotif(`💾 Data pending berhasil disimpan. Deadline +3 hari menjadi ${newDeadline}`);
            closeModal('pendingModal');
            loadAllData();
        };
    }
    
    const cancelBtn = document.getElementById('pendingCancelBtn');
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            closeModal('pendingModal');
        };
    }
}

// ========== FUNGSI UNTUK PROSPEK ==========

function openDetailProspek(id) {
    db.collection('prospek').doc(id).get().then(doc => {
        const d = doc.data();
        let statusIcon = d.status === 'Negosiasi' ? '📋' : d.status === 'Dihubungi' ? '📞' : d.status === 'Tertarik' ? '⭐' : '🆕';
        let actionButtons = '';
        
        if (d.status === 'Baru') {
            actionButtons = `<button class="btn-primary" onclick="lanjutKeDihubungi('${id}')">📞 Lanjut ke Dihubungi</button>`;
        } else if (d.status === 'Dihubungi') {
            actionButtons = `<button class="btn-primary" onclick="openProspekDihubungiConfirm('${id}')">✅ Konfirmasi Dihubungi</button>`;
        } else if (d.status === 'Negosiasi') {
            actionButtons = `<button class="btn-primary" onclick="openProspekNegosiasiModal('${id}')">📝 Kelola Negosiasi</button>`;
        } else if (d.status === 'Tertarik') {
            actionButtons = `<button class="btn-primary" onclick="showConvertToCustomerModal('${id}')">🔄 Jadikan Customer</button>`;
        }
        
        let negosiasiInfo = '';
        if (d.negosiasi_data) {
            negosiasiInfo = `<div class="detail-info-item"><div class="detail-info-icon">📋</div><div class="detail-info-content"><label>Data Negosiasi</label><div class="value">Aplikasi: ${d.negosiasi_data.aplikasi || '-'}<br>Domisili: ${d.negosiasi_data.domisili || '-'}<br>Transaksi: ${d.negosiasi_data.transaksi || '-'}<br>Deposit: ${d.negosiasi_data.deposit || '-'}<br>Tertarik: ${d.negosiasi_data.tertarik || '-'}<br>Penawaran: ${d.negosiasi_data.penawaran || '-'}</div></div></div>`;
        }
        
        let dihubungiInfo = '';
        if (d.dihubungi_data) {
            dihubungiInfo = `<div class="detail-info-item"><div class="detail-info-icon">✅</div><div class="detail-info-content"><label>Konfirmasi Dihubungi</label><div class="value">Terkirim: ${d.dihubungi_data.terkirim ? 'Ya' : 'Tidak'} | Dibalas: ${d.dihubungi_data.dibalas ? 'Ya' : 'Tidak'}</div></div></div>`;
        }
        
        const deadlineDisplay = d.deadline || '-';
        const editBtn = `<button class="edit-deadline-btn" onclick="openEditDeadlineModal('${id}','prospek','${d.deadline || ''}')" title="Edit deadline">✏️</button>`;
        
        document.getElementById('detailContent').innerHTML = `
            <div class="detail-header"><div class="detail-avatar">${statusIcon}</div><h3>${escapeHtml(d.nama)}</h3><div class="detail-status">${getStatusBadge(d.status)}</div></div>
            <div class="detail-body">
                <div class="detail-info">
                    <div class="detail-info-item"><div class="detail-info-icon">📱</div><div class="detail-info-content"><label>Nomor WhatsApp</label><div class="value">${escapeHtml(d.hp)}</div></div></div>
                    <div class="detail-info-item"><div class="detail-info-icon">📅</div><div class="detail-info-content"><label>Deadline</label><div class="value">${deadlineDisplay} ${editBtn}</div></div></div>
                    ${dihubungiInfo}
                    ${negosiasiInfo}
                    <div class="detail-info-item"><div class="detail-info-icon">📌</div><div class="detail-info-content"><label>Status</label><div class="value">${d.status}</div></div></div>
                </div>
                <div class="detail-actions">
                    <button class="btn-success" onclick="openWA('${d.hp}')">💬 WhatsApp</button>
                    ${actionButtons}
                </div>
            </div>
            <div class="detail-footer"><button class="btn-outline" onclick="closeModal('detailModal')">❌ Tutup</button><button class="btn-danger" onclick="deleteProspek('${id}')">🗑️ Hapus</button></div>
        `;
        showModal('detailModal');
    });
}

function lanjutKeDihubungi(id) {
    db.collection('prospek').doc(id).get().then(doc => {
        const currentDeadline = doc.data().deadline || getTodayDate();
        const newDeadline = addDaysToDate(currentDeadline, 1);
        db.collection('prospek').doc(id).update({ 
            status: 'Dihubungi',
            deadline: newDeadline
        }).then(() => {
            showNotif(`✅ Status berubah menjadi Dihubungi. Deadline +1 hari menjadi ${newDeadline}`);
            loadAllData();
            closeModal('detailModal');
        }).catch(err => showNotif('❌ Gagal: ' + err.message, true));
    });
}

function openProspekDihubungiConfirm(id) {
    currentProspekId = id;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h3>✅ Konfirmasi Dihubungi</h3>
            <div class="modal-subtitle">Pastikan sudah melakukan komunikasi dengan prospek</div>
            <div style="padding: 0 20px;">
                <div class="form-group">
                    <label><input type="checkbox" id="prospek_terkirim" style="margin-right: 8px;"> Apakah pesan sudah terkirim dan terbaca?</label>
                </div>
                <div class="form-group">
                    <label><input type="checkbox" id="prospek_dibalas" style="margin-right: 8px;"> Apakah sudah di balas?</label>
                </div>
            </div>
            <div class="modal-buttons">
                <button id="prospekConfirmYes" class="btn-primary" disabled>✅ Lanjut ke Negosiasi</button>
                <button id="prospekConfirmCancel" class="btn-outline">Batal</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    
    const cb1 = modal.querySelector('#prospek_terkirim');
    const cb2 = modal.querySelector('#prospek_dibalas');
    const yesBtn = modal.querySelector('#prospekConfirmYes');
    const cancelBtn = modal.querySelector('#prospekConfirmCancel');
    
    const checkBoth = () => { yesBtn.disabled = !(cb1.checked && cb2.checked); };
    cb1.onchange = checkBoth;
    cb2.onchange = checkBoth;
    
    yesBtn.onclick = async () => {
        const doc = await db.collection('prospek').doc(id).get();
        const currentDeadline = doc.data().deadline || getTodayDate();
        const newDeadline = addDaysToDate(currentDeadline, 1);
        await db.collection('prospek').doc(id).update({ 
            status: 'Negosiasi',
            deadline: newDeadline,
            dihubungi_data: { 
                terkirim: true, 
                dibalas: true, 
                timestamp: new Date().toISOString(),
                via_wa: true
            }
        });
        modal.remove();
        document.body.classList.remove('modal-open');
        showNotif(`✅ Prospek dipindahkan ke Negosiasi. Deadline +1 hari menjadi ${newDeadline}`);
        loadAllData();
        closeModal('detailModal');
    };
    
    cancelBtn.onclick = () => {
        modal.remove();
        document.body.classList.remove('modal-open');
    };
    modal.onclick = (e) => { if (e.target === modal) { modal.remove(); document.body.classList.remove('modal-open'); } };
}

function openProspekNegosiasiModal(id) {
    currentProspekId = id;
    const fields = ['prospek_aplikasi', 'prospek_domisili', 'prospek_transaksi', 'prospek_deposit', 'prospek_tertarik', 'prospek_penawaran'];
    fields.forEach(f => document.getElementById(f).value = '');
    
    db.collection('prospek').doc(id).get().then(doc => {
        const data = doc.data();
        if (data.negosiasi_data) {
            document.getElementById('prospek_aplikasi').value = data.negosiasi_data.aplikasi || '';
            document.getElementById('prospek_domisili').value = data.negosiasi_data.domisili || '';
            document.getElementById('prospek_transaksi').value = data.negosiasi_data.transaksi || '';
            document.getElementById('prospek_deposit').value = data.negosiasi_data.deposit || '';
            document.getElementById('prospek_tertarik').value = data.negosiasi_data.tertarik || '';
            document.getElementById('prospek_penawaran').value = data.negosiasi_data.penawaran || '';
        }
    });
    
    const modal = document.getElementById('prospekNegosiasiModal');
    modal.style.display = 'flex';
    
    document.getElementById('negosiasiTertarikBtn').onclick = async () => {
        const aplikasi = document.getElementById('prospek_aplikasi').value;
        const domisili = document.getElementById('prospek_domisili').value;
        const transaksi = document.getElementById('prospek_transaksi').value;
        const deposit = document.getElementById('prospek_deposit').value;
        const tertarik = document.getElementById('prospek_tertarik').value;
        const penawaran = document.getElementById('prospek_penawaran').value;
        
        if (!aplikasi || !domisili || !transaksi || !deposit || !tertarik || !penawaran) {
            showNotif('⚠️ Semua field harus diisi!', true);
            return;
        }
        
        showConfirmDialog(
            'Pindahkan ke Status Tertarik?',
            `Apakah data kuesioner sudah lengkap dan prospek tertarik?\n\n⚠️ Setelah ini prospek akan masuk ke status TERTARIK.`,
            async () => {
                const negosiasi_data = { aplikasi, domisili, transaksi, deposit, tertarik, penawaran, timestamp: new Date().toISOString() };
                await db.collection('prospek').doc(currentProspekId).update({ 
                    status: 'Tertarik',
                    negosiasi_data: negosiasi_data
                });
                showNotif('✅ Prospek dipindahkan ke Tertarik');
                closeModal('prospekNegosiasiModal');
                loadAllData();
                closeModal('detailModal');
            }
        );
    };
    
    document.getElementById('negosiasiTidakTertarikBtn').onclick = async () => {
        const doc = await db.collection('prospek').doc(currentProspekId).get();
        const data = doc.data();
        if (data) {
            showConfirmDialog(
                'Pindahkan ke Database Tidak Tertarik?',
                `Apakah Anda yakin ingin memindahkan "${escapeHtml(data.nama)}" ke DATABASE TIDAK TERTARIK?\n\n⚠️ Data yang sudah dipindahkan TIDAK BISA dikembalikan!`,
                async () => {
                    await db.collection('db_tidak_tertarik').add({
                        nama: data.nama,
                        hp: data.hp,
                        tanggal: new Date().toISOString(),
                        user_id: currentUser.uid,
                        alasan: 'Tidak tertarik setelah negosiasi',
                        status_sebelumnya: data.status,
                        negosiasi_data: data.negosiasi_data || null
                    });
                    await db.collection('prospek').doc(currentProspekId).delete();
                    showNotif('📵 Data dipindahkan ke Database Tidak Tertarik');
                    closeModal('prospekNegosiasiModal');
                    loadAllData();
                    closeModal('detailModal');
                    updateAllBadges();
                }
            );
        }
    };
    
    document.getElementById('negosiasiSimpanBtn').onclick = async () => {
        const aplikasi = document.getElementById('prospek_aplikasi').value;
        const domisili = document.getElementById('prospek_domisili').value;
        const transaksi = document.getElementById('prospek_transaksi').value;
        const deposit = document.getElementById('prospek_deposit').value;
        const tertarik = document.getElementById('prospek_tertarik').value;
        const penawaran = document.getElementById('prospek_penawaran').value;
        
        if (!aplikasi || !domisili || !transaksi || !deposit || !tertarik || !penawaran) {
            showNotif('⚠️ Semua field harus diisi!', true);
            return;
        }
        
        const doc = await db.collection('prospek').doc(currentProspekId).get();
        const currentDeadline = doc.data().deadline || getTodayDate();
        const newDeadline = addDaysToDate(currentDeadline, 3);
        
        const negosiasi_data = { aplikasi, domisili, transaksi, deposit, tertarik, penawaran, timestamp: new Date().toISOString() };
        await db.collection('prospek').doc(currentProspekId).update({ 
            negosiasi_data: negosiasi_data,
            deadline: newDeadline
        });
        showNotif(`💾 Data kuesioner berhasil disimpan. Deadline +3 hari menjadi ${newDeadline}`);
        closeModal('prospekNegosiasiModal');
        loadAllData();
        closeModal('detailModal');
    };
    
    document.getElementById('negosiasiBatalBtn').onclick = () => {
        closeModal('prospekNegosiasiModal');
    };
}

// ========== CLOSING & TIDAK TERTARIK ==========
async function saveToClosingDB(id, data) { 
    try { 
        await db.collection('db_closing').add({ 
            nama: data.nama, hp: data.hp, tanggal: data.tanggal || getTodayDate(), 
            closing_date: new Date().toISOString(), user_id: currentUser.uid,
            followup_data: data.followup_data || null,
            pending_data: data.pending_data || []
        }); 
        await db.collection('customers').doc(id).delete(); 
        showNotif('✅ Data berhasil masuk Database Closing!'); 
        updateAllBadges(); 
        return true; 
    } catch(e) { 
        showNotif('❌ Gagal: ' + e.message, true); 
        return false; 
    } 
}

async function saveToTidakTertarikDB(id, data) { 
    try { 
        await db.collection('db_tidak_tertarik').add({ 
            nama: data.nama, hp: data.hp, tanggal: new Date().toISOString(), user_id: currentUser.uid, 
            dihubungi_data: data.dihubungi_data || null,
            negosiasi_data: data.negosiasi_data || null
        }); 
        await db.collection('prospek').doc(id).delete(); 
        showNotif('✅ Data berhasil masuk Database Tidak Tertarik!'); 
        updateAllBadges(); 
        return true; 
    } catch(e) { 
        showNotif('❌ Gagal: ' + e.message, true); 
        return false; 
    } 
}

window.confirmClosing = async function(id) { 
    showConfirmDialog(
        'Pindahkan ke Database Closing?',
        `Apakah Anda yakin ingin memindahkan data ini ke DATABASE CLOSING?\n\n⚠️ Data yang sudah dipindahkan TIDAK BISA dikembalikan ke Followup Agen!`,
        async () => {
            const doc = await db.collection('customers').doc(id).get();
            if (doc.exists) await saveToClosingDB(id, doc.data());
            loadAllData();
            updateAllBadges();
        },
        async () => {
            await db.collection('customers').doc(id).update({ status: 'closing' });
            showNotif('📌 Data tetap di kolom Closing');
            loadAllData();
            updateAllBadges();
        }
    );
};

window.saveToClosingNow = async function(id) {
    showConfirmDialog(
        'Pindahkan ke Database Closing?',
        `Apakah Anda yakin ingin memindahkan customer ini ke DATABASE CLOSING?\n\n⚠️ Data yang sudah dipindahkan TIDAK BISA dikembalikan ke Followup Agen!`,
        async () => {
            try {
                const doc = await db.collection('customers').doc(id).get();
                if (doc.exists) {
                    await saveToClosingDB(id, doc.data());
                    closeModal('detailModal');
                    showNotif('✅ Data berhasil dipindahkan ke DB Closing');
                    updateAllBadges();
                }
            } catch(err) {
                showNotif('❌ Gagal: ' + err.message, true);
            }
        }
    );
};

window.showConvertToCustomerModal = async function(prospekId) {
    const doc = await db.collection('prospek').doc(prospekId).get();
    const data = doc.data();
    if (!data.negosiasi_data) {
        showNotif('⚠️ Data prospek belum lengkap, isi kuesioner Negosiasi dulu!', true);
        openProspekNegosiasiModal(prospekId);
        return;
    }
    
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    const followupDate = nextMonth.toISOString().split('T')[0];
    
    showInputDialog(
        '📋 Lengkapi Data Customer',
        `Data prospek "${escapeHtml(data.nama)}" akan dipindahkan ke Followup Agen.\n\nSilakan lengkapi data berikut:`,
        [
            { id: 'inputAgentId', label: 'ID Agent', type: 'text', placeholder: 'Contoh: AG-001', required: true },
            { id: 'inputAplikasi', label: 'Aplikasi', type: 'select', options: ['GNP', 'BSB', 'BTN'], required: true }
        ],
        async (values) => {
            if (!values.inputAgentId || !values.inputAplikasi) {
                showNotif('⚠️ ID Agent dan Aplikasi wajib diisi!', true);
                return;
            }
            
            showConfirmDialog(
                'Jadikan Customer & Pindahkan ke DB Commitment?',
                `Apakah Anda yakin ingin menjadikan "${escapeHtml(data.nama)}" sebagai Customer?\n\n` +
                `🆔 ID Agent: ${values.inputAgentId}\n` +
                `📱 Aplikasi: ${values.inputAplikasi}\n` +
                `📅 Tanggal Followup: ${followupDate}\n\n` +
                `📋 Data akan DISIMPAN ke DATABASE COMMITMENT sebagai arsip.\n` +
                `📞 Data akan DIPINDAHKAN ke FOLLOWUP AGEN dengan status "Baru".\n\n` +
                `⚠️ Proses ini TIDAK BISA dibatalkan dan data akan DIHAPUS dari Prospek Agen!`,
                async () => {
                    try {
                        showNotif('⏳ Memproses pemindahan data...');
                        
                        await db.collection('db_commitment').add({
                            nama: data.nama,
                            hp: data.hp,
                            negosiasi_data: data.negosiasi_data,
                            agent_id: values.inputAgentId,
                            aplikasi: values.inputAplikasi,
                            committed_at: new Date().toISOString(),
                            user_id: currentUser.uid,
                            original_prospek_id: prospekId,
                            followup_date: followupDate
                        });
                        
                        await db.collection('customers').add({
                            agent_id: values.inputAgentId,
                            nama: data.nama,
                            hp: data.hp,
                            apk: values.inputAplikasi,
                            tanggal: followupDate,
                            status: 'baru',
                            user_id: currentUser.uid,
                            created_at: new Date().toISOString(),
                            converted_from: 'prospek_commitment',
                            followup_data: null,
                            pending_data: []
                        });
                        
                        await db.collection('prospek').doc(prospekId).delete();
                        
                        showNotif('✅ Berhasil! Customer telah ditambahkan ke Followup Agen dan disimpan ke DB Commitment');
                        closeModal('detailModal');
                        closeModal('convertModal');
                        loadAllData();
                        updateAllBadges();
                    } catch(error) {
                        showNotif('❌ Gagal: ' + error.message, true);
                        console.error(error);
                    }
                }
            );
        }
    );
};

function setupConvertModal() {
    const confirmBtn = document.getElementById('confirmConvertBtn');
    const cancelBtn = document.getElementById('cancelConvertBtn');
    const modal = document.getElementById('convertModal');
    if (!modal) return;
    if (confirmBtn) {
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.onclick = async function(e) {
            e.preventDefault(); e.stopPropagation();
            const agentId = document.getElementById('convertAgentId')?.value;
            const followupDate = document.getElementById('convertFollowupDate')?.value;
            if (!agentId) { alert('⚠️ ID Agent wajib diisi!'); return; }
            if (!followupDate) { alert('⚠️ Tanggal followup wajib diisi!'); return; }
            if (!currentConvertProspekId) { alert('⚠️ Error: Data prospek tidak ditemukan'); return; }
            
            showConfirmDialog(
                'Pindahkan ke Followup Agen?',
                `Apakah Anda yakin ingin memindahkan prospek ini ke FOLLOWUP AGEN dengan ID Agent: ${agentId}?\n\n⚠️ Data yang sudah dipindahkan TIDAK BISA dikembalikan ke Prospek Agen!`,
                async () => {
                    try {
                        showNotif('⏳ Memproses pemindahan...');
                        const prospekDoc = await db.collection('prospek').doc(currentConvertProspekId).get();
                        const prospekData = prospekDoc.data();
                        if (!prospekData) { showNotif('❌ Data prospek tidak ditemukan', true); return; }
                        await db.collection('customers').add({ agent_id: agentId, nama: prospekData.nama, hp: prospekData.hp, tanggal: followupDate, status: 'baru', apk: '', user_id: currentUser.uid, created_at: new Date().toISOString(), followup_data: null, pending_data: [] });
                        await db.collection('prospek').doc(currentConvertProspekId).delete();
                        modal.style.display = 'none'; document.body.classList.remove('modal-open'); closeModal('detailModal');
                        showNotif('✅ Berhasil dipindahkan ke Followup Agen!'); loadAllData();
                    } catch(error) { showNotif('❌ Gagal: ' + error.message, true); }
                }
            );
        };
    }
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.onclick = function(e) { e.preventDefault(); e.stopPropagation(); modal.style.display = 'none'; document.body.classList.remove('modal-open'); };
    }
    modal.onclick = function(e) { if (e.target === modal) { modal.style.display = 'none'; document.body.classList.remove('modal-open'); } };
}

// ========== FITUR SIMPAN TEMPLATE BROADCAST ==========
let savedTemplates = [];

function loadTemplates() {
    const saved = localStorage.getItem('broadcast_templates');
    if (saved) {
        savedTemplates = JSON.parse(saved);
    }
    renderTemplateList();
}

function saveTemplate(name, message) {
    if (!name || !message) {
        showNotif('⚠️ Nama template dan pesan harus diisi!', true);
        return;
    }
    savedTemplates.unshift({ name, message, created_at: new Date().toISOString() });
    if (savedTemplates.length > 10) savedTemplates = savedTemplates.slice(0, 10);
    localStorage.setItem('broadcast_templates', JSON.stringify(savedTemplates));
    renderTemplateList();
    showNotif('✅ Template berhasil disimpan');
}

function deleteTemplate(index) {
    savedTemplates.splice(index, 1);
    localStorage.setItem('broadcast_templates', JSON.stringify(savedTemplates));
    renderTemplateList();
    showNotif('🗑️ Template dihapus');
}

function renderTemplateList() {
    const container = document.getElementById('templateList');
    if (!container) return;
    
    if (savedTemplates.length === 0) {
        container.innerHTML = '<p style="color:#9ca3af; text-align:center; padding:20px;">Belum ada template tersimpan</p>';
        return;
    }
    
    container.innerHTML = savedTemplates.map((template, idx) => `
        <div class="template-item" style="background: #f9fafb; border-radius: 8px; padding: 10px; margin-bottom: 8px; border: 1px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 13px;">📝 ${escapeHtml(template.name)}</strong>
                <div>
                    <button class="template-use-btn" data-idx="${idx}" style="background: #4f46e5; color: white; border: none; border-radius: 6px; padding: 4px 10px; font-size: 11px; margin-right: 5px; cursor: pointer;">Gunakan</button>
                    <button class="template-delete-btn" data-idx="${idx}" style="background: #ef4444; color: white; border: none; border-radius: 6px; padding: 4px 10px; font-size: 11px; cursor: pointer;">Hapus</button>
                </div>
            </div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(template.message.substring(0, 100))}${template.message.length > 100 ? '...' : ''}</div>
        </div>
    `).join('');
    
    document.querySelectorAll('.template-use-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.idx);
            const template = savedTemplates[idx];
            if (template) {
                document.getElementById('broadcastMessage').value = template.message;
                showNotif(`✅ Template "${template.name}" diterapkan`);
            }
        });
    });
    
    document.querySelectorAll('.template-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.idx);
            if (confirm('Hapus template ini?')) {
                deleteTemplate(idx);
            }
        });
    });
}

function initTemplateFeature() {
    loadTemplates();
    const saveTemplateBtn = document.getElementById('saveTemplateBtn');
    if (saveTemplateBtn) {
        saveTemplateBtn.onclick = () => {
            const name = document.getElementById('templateName').value;
            const message = document.getElementById('broadcastMessage').value;
            if (!name) {
                showNotif('⚠️ Masukkan nama template!', true);
                return;
            }
            if (!message) {
                showNotif('⚠️ Pesan tidak boleh kosong!', true);
                return;
            }
            saveTemplate(name, message);
            document.getElementById('templateName').value = '';
        };
    }
}

// ========== BROADCAST WHATSAPP FUNCTIONS ==========
let currentNumbers = [], currentBroadcastIndex = 0, broadcastNumbers = [], broadcastMessageTemplate = '', isBroadcasting = false, broadcastStatus = [];

function initBroadcast() {
    document.querySelectorAll('input[name="sourceType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const value = this.value;
            document.getElementById('filterStatusCard').style.display = value === 'custom' ? 'none' : 'block';
            document.getElementById('customNumbersCard').style.display = value === 'custom' ? 'block' : 'none';
            document.getElementById('prospekFilter').style.display = value === 'prospek' ? 'flex' : 'none';
            document.getElementById('customerFilter').style.display = value === 'customer' ? 'flex' : 'none';
            loadNumbers();
        });
    });
    document.querySelectorAll('#customerFilter input, #prospekFilter input').forEach(cb => cb.addEventListener('change', () => loadNumbers()));
    document.getElementById('customNumbers')?.addEventListener('input', () => loadNumbers());
    document.getElementById('refreshNumbersBtn')?.addEventListener('click', () => loadNumbers());
    document.getElementById('sendBroadcastBtn')?.addEventListener('click', sendBroadcast);
    
    initTemplateFeature();
    loadNumbers();
}

async function loadNumbers() {
    const sourceType = document.querySelector('input[name="sourceType"]:checked')?.value || 'customer';
    let numbers = [];
    if (sourceType === 'custom') {
        const customText = document.getElementById('customNumbers')?.value || '';
        numbers = customText.split(/[\n,]+/).map(n => n.trim()).filter(n => n && /^62\d+$/.test(n));
    } else {
        let collection = 'customers', statusField = 'status', statusValues = [];
        if (sourceType === 'prospek') { collection = 'prospek'; statusValues = Array.from(document.querySelectorAll('#prospekFilter input:checked')).map(cb => cb.value); }
        else if (sourceType === 'customer') { collection = 'customers'; statusValues = Array.from(document.querySelectorAll('#customerFilter input:checked')).map(cb => cb.value); }
        else if (sourceType === 'closing') { collection = 'db_closing'; statusField = null; }
        else if (sourceType === 'dbTidak') { collection = 'db_tidak_tertarik'; statusField = null; }
        let query = db.collection(collection).where('user_id', '==', currentUser.uid);
        if (statusValues && statusValues.length > 0 && statusField) query = query.where(statusField, 'in', statusValues);
        const snapshot = await query.get();
        snapshot.forEach(doc => { const data = doc.data(); numbers.push({ hp: data.hp, nama: data.nama }); });
    }
    currentNumbers = numbers;
    document.getElementById('selectedCount').innerText = numbers.length;
    const listDiv = document.getElementById('selectedNumbersList');
    if (numbers.length === 0) listDiv.innerHTML = '<p style="color:#9ca3af;">Tidak ada nomor yang dipilih</p>';
    else if (typeof numbers[0] === 'string') listDiv.innerHTML = numbers.map(n => `<div class="number-item">${escapeHtml(n)}</div>`).join('');
    else listDiv.innerHTML = numbers.map(n => `<div class="number-item">${escapeHtml(n.nama)} - ${escapeHtml(n.hp)}</div>`).join('');
}

async function sendBroadcast() {
    const messageTemplate = document.getElementById('broadcastMessage')?.value, sendOneByOne = document.getElementById('sendOneByOne')?.checked;
    if (!messageTemplate) { showNotif('Pesan tidak boleh kosong!', true); return; }
    if (currentNumbers.length === 0) { showNotif('Tidak ada nomor tujuan!', true); return; }
    if (!sendOneByOne) {
        for (const item of currentNumbers) { const hp = typeof item === 'string' ? item : item.hp, nama = typeof item === 'string' ? '' : item.nama, message = messageTemplate.replace(/{nama}/g, nama || 'Customer'), nomor = hp.toString().replace('+', '').replace(/^0/, '62'); window.open('https://wa.me/' + nomor + '?text=' + encodeURIComponent(message), '_blank'); }
        showNotif(`✅ Membuka ${currentNumbers.length} chat WhatsApp`); return;
    }
    if (isBroadcasting) { showNotif('⚠️ Broadcast sedang berjalan!', true); return; }
    broadcastNumbers = [...currentNumbers]; broadcastMessageTemplate = messageTemplate; currentBroadcastIndex = 0; broadcastStatus = []; isBroadcasting = true;
    showBroadcastPanel(); displayCurrentBroadcast();
}

function showBroadcastPanel() {
    let panelDiv = document.getElementById('broadcastPanel');
    if (!panelDiv) {
        const broadcastCard = document.querySelector('#broadcastPage .broadcast-card:last-child');
        if (broadcastCard) {
            panelDiv = document.createElement('div'); panelDiv.id = 'broadcastPanel'; panelDiv.className = 'broadcast-panel';
            panelDiv.innerHTML = `<div class="panel-header"><span>📢 Broadcast Manual</span><button id="closeBroadcastPanelBtn" class="close-panel-btn">✕</button></div><div class="panel-content"><div class="current-info"><div class="current-label">Sedang Diproses:</div><div class="current-name" id="currentName">-</div><div class="current-number" id="currentNumber">-</div></div><div class="message-preview" id="messagePreview"></div><div class="action-buttons"><button id="markSentBtn" class="mark-sent-btn">✅ Tandai Terkirim & Lanjut</button><button id="markFailedBtn" class="mark-failed-btn">❌ Tandai Gagal Kirim & Lanjut</button><button id="stopBroadcastPanelBtn" class="stop-btn">⏹️ Hentikan Broadcast</button></div><div class="whatsapp-link-container"><a href="#" id="whatsappLink" target="_blank" class="whatsapp-link-btn">💬 Buka WhatsApp</a></div></div><div class="progress-panel"><div class="progress-bar-container"><div class="progress-bar-fill" id="progressBarFillPanel"></div></div><div class="progress-text" id="progressTextPanel">0 / 0</div><div class="progress-list" id="progressListPanel"></div></div>`;
            broadcastCard.parentNode.insertBefore(panelDiv, broadcastCard.nextSibling);
            document.getElementById('closeBroadcastPanelBtn')?.addEventListener('click', () => { document.getElementById('broadcastPanel').style.display = 'none'; isBroadcasting = false; });
            document.getElementById('markSentBtn')?.addEventListener('click', () => { if (isBroadcasting) { broadcastStatus[currentBroadcastIndex] = 'success'; currentBroadcastIndex++; updateBroadcastPanel(); if (currentBroadcastIndex >= broadcastNumbers.length) finishBroadcast(); else displayCurrentBroadcast(); } });
            document.getElementById('markFailedBtn')?.addEventListener('click', () => { if (isBroadcasting) { broadcastStatus[currentBroadcastIndex] = 'failed'; currentBroadcastIndex++; updateBroadcastPanel(); if (currentBroadcastIndex >= broadcastNumbers.length) finishBroadcast(); else displayCurrentBroadcast(); } });
            document.getElementById('stopBroadcastPanelBtn')?.addEventListener('click', () => { if (confirm('⏹️ Hentikan broadcast?')) { isBroadcasting = false; document.getElementById('broadcastPanel').style.display = 'none'; showNotif('⏹️ Broadcast dihentikan'); } });
        }
    } else panelDiv.style.display = 'block';
}

function displayCurrentBroadcast() {
    if (!isBroadcasting) return;
    if (currentBroadcastIndex >= broadcastNumbers.length) { finishBroadcast(); return; }
    const item = broadcastNumbers[currentBroadcastIndex], hp = typeof item === 'string' ? item : item.hp, nama = typeof item === 'string' ? '' : item.nama, message = broadcastMessageTemplate.replace(/{nama}/g, nama || 'Customer'), nomor = hp.toString().replace('+', '').replace(/^0/, '62');
    document.getElementById('currentName').innerHTML = escapeHtml(nama || '-'); document.getElementById('currentNumber').innerHTML = escapeHtml(hp); document.getElementById('messagePreview').innerHTML = `<strong>Pesan:</strong><br>${escapeHtml(message)}`; document.getElementById('whatsappLink').href = 'https://wa.me/' + nomor + '?text=' + encodeURIComponent(message);
    updateBroadcastPanel();
}

function updateBroadcastPanel() {
    const total = broadcastNumbers.length, processed = currentBroadcastIndex, percent = total > 0 ? (processed / total) * 100 : 0;
    document.getElementById('progressBarFillPanel').style.width = `${percent}%`; document.getElementById('progressTextPanel').innerText = `${processed} / ${total} terproses`;
    const progressList = document.getElementById('progressListPanel');
    if (progressList && broadcastNumbers.length > 0) {
        let html = '';
        for (let i = 0; i < broadcastNumbers.length; i++) {
            const item = broadcastNumbers[i], hp = typeof item === 'string' ? item : item.hp, nama = typeof item === 'string' ? '' : item.nama, displayName = nama ? `${nama} (${hp})` : hp, isCurrent = i === currentBroadcastIndex, status = broadcastStatus[i];
            let statusIcon = '⭕', statusClass = '';
            if (status === 'success') { statusIcon = '✅'; statusClass = 'success'; }
            else if (status === 'failed') { statusIcon = '❌'; statusClass = 'failed'; }
            else if (i < currentBroadcastIndex) { statusIcon = '✅'; statusClass = 'success'; }
            html += `<div class="panel-progress-item ${statusClass} ${isCurrent ? 'current' : ''}"><span class="panel-status">${statusIcon}</span><span class="panel-number">${escapeHtml(displayName)}</span></div>`;
        }
        progressList.innerHTML = html;
        const currentElement = progressList.querySelector('.panel-progress-item.current');
        if (currentElement) currentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function finishBroadcast() {
    let successCount = 0, failedCount = 0;
    for (let i = 0; i < broadcastNumbers.length; i++) {
        if (broadcastStatus[i] === 'success') successCount++;
        else if (broadcastStatus[i] === 'failed') failedCount++;
        else if (i < currentBroadcastIndex) successCount++;
    }
    showNotif(`✅ Broadcast selesai! Terkirim: ${successCount}, Gagal: ${failedCount}, Total: ${broadcastNumbers.length}`);
    isBroadcasting = false; document.getElementById('broadcastPanel').style.display = 'none'; broadcastStatus = [];
}

// ========== FULL PAGE KANBAN (DISEDERHANAKAN KARENA PANJANG) ==========
function renderFullFollowupKanban() {
    const today = getTodayDate();
    const lists = { baru: [], followup: [], pending: [], closing: [] };
    customersData.forEach(item => {
        const status = item.status || 'baru';
        if (status === 'closing') lists.closing.push(item);
        else if (status === 'pending') lists.pending.push(item);
        else if (status === 'followup') lists.followup.push(item);
        else lists.baru.push(item);
    });
    lists.baru.sort((a,b) => (a.tanggal || '9999-12-31').localeCompare(b.tanggal || '9999-12-31'));
    lists.followup.sort((a,b) => (a.tanggal || '9999-12-31').localeCompare(b.tanggal || '9999-12-31'));
    lists.pending.sort((a,b) => (a.tanggal || '9999-12-31').localeCompare(b.tanggal || '9999-12-31'));
    lists.closing.sort((a,b) => (a.tanggal || '9999-12-31').localeCompare(b.tanggal || '9999-12-31'));
    document.getElementById('fullCountBaru').innerText = lists.baru.length;
    document.getElementById('fullCountFollowup').innerText = lists.followup.length;
    document.getElementById('fullCountPending').innerText = lists.pending.length;
    document.getElementById('fullCountClosing').innerText = lists.closing.length;
    
    const baruContainer = document.getElementById('fullBaruList');
    if (baruContainer) {
        baruContainer.innerHTML = lists.baru.map(item => {
            const isOverdue = item.tanggal && item.tanggal < today;
            const isToday = item.tanggal === today;
            let deadlineClass = '';
            if (isOverdue) deadlineClass = 'deadline-overdue';
            else if (isToday) deadlineClass = 'deadline-today';
            return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="baru"><div class="card-id">🆔 ${escapeHtml(item.agent_id || '-')}</div><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.tanggal || '-'}</div></div>`;
        }).join('');
        baruContainer.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailCustomer(card.dataset.id); }); });
    }
    const followupContainer = document.getElementById('fullFollowupList');
    if (followupContainer) {
        followupContainer.innerHTML = lists.followup.map(item => {
            const isOverdue = item.tanggal && item.tanggal < today;
            const isToday = item.tanggal === today;
            let deadlineClass = '';
            if (isOverdue) deadlineClass = 'deadline-overdue';
            else if (isToday) deadlineClass = 'deadline-today';
            return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="followup"><div class="card-id">🆔 ${escapeHtml(item.agent_id || '-')}</div><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.tanggal || '-'}</div></div>`;
        }).join('');
        followupContainer.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailCustomer(card.dataset.id); }); });
    }
    const pendingContainer = document.getElementById('fullPendingList');
    if (pendingContainer) {
        pendingContainer.innerHTML = lists.pending.map(item => {
            const isOverdue = item.tanggal && item.tanggal < today;
            const isToday = item.tanggal === today;
            let deadlineClass = '';
            if (isOverdue) deadlineClass = 'deadline-overdue';
            else if (isToday) deadlineClass = 'deadline-today';
            return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="pending"><div class="card-id">🆔 ${escapeHtml(item.agent_id || '-')}</div><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.tanggal || '-'}</div></div>`;
        }).join('');
        pendingContainer.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailCustomer(card.dataset.id); }); });
    }
    const closingContainer = document.getElementById('fullClosingList');
    if (closingContainer) {
        closingContainer.innerHTML = lists.closing.map(item => {
            const isOverdue = item.tanggal && item.tanggal < today;
            const isToday = item.tanggal === today;
            let deadlineClass = '';
            if (isOverdue) deadlineClass = 'deadline-overdue';
            else if (isToday) deadlineClass = 'deadline-today';
            return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="closing"><div class="card-id">🆔 ${escapeHtml(item.agent_id || '-')}</div><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.tanggal || '-'}</div></div>`;
        }).join('');
        closingContainer.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailCustomer(card.dataset.id); }); });
    }
}

function renderFullProspekKanban() {
    const today = getTodayDate();
    const lists = { prospekBaru: [], prospekDihubungi: [], prospekNegosiasi: [], prospekTertarik: [] };
    prospekData.forEach(item => {
        const status = item.status || 'Baru';
        if (status === 'Baru') lists.prospekBaru.push(item);
        else if (status === 'Dihubungi') lists.prospekDihubungi.push(item);
        else if (status === 'Negosiasi') lists.prospekNegosiasi.push(item);
        else if (status === 'Tertarik') lists.prospekTertarik.push(item);
        else lists.prospekTertarik.push(item);
    });
    lists.prospekBaru.sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'));
    lists.prospekDihubungi.sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'));
    lists.prospekNegosiasi.sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'));
    lists.prospekTertarik.sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'));
    document.getElementById('fullCountProspekBaru').innerText = lists.prospekBaru.length;
    document.getElementById('fullCountDihubungi').innerText = lists.prospekDihubungi.length;
    document.getElementById('fullCountNegosiasi').innerText = lists.prospekNegosiasi.length;
    document.getElementById('fullCountTertarik').innerText = lists.prospekTertarik.length;
    
    const baruContainer = document.getElementById('fullProspekBaruList');
    if (baruContainer) {
        baruContainer.innerHTML = lists.prospekBaru.map(item => {
            const isOverdue = item.deadline && item.deadline < today;
            const isToday = item.deadline === today;
            let deadlineClass = '';
            if (isOverdue) deadlineClass = 'deadline-overdue';
            else if (isToday) deadlineClass = 'deadline-today';
            return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="Baru"><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.deadline || '-'}</div></div>`;
        }).join('');
        baruContainer.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailProspek(card.dataset.id); }); });
    }
    const dihubungiContainer = document.getElementById('fullProspekDihubungiList');
    if (dihubungiContainer) {
        dihubungiContainer.innerHTML = lists.prospekDihubungi.map(item => {
            const isOverdue = item.deadline && item.deadline < today;
            const isToday = item.deadline === today;
            let deadlineClass = '';
            if (isOverdue) deadlineClass = 'deadline-overdue';
            else if (isToday) deadlineClass = 'deadline-today';
            return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="Dihubungi"><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.deadline || '-'}</div></div>`;
        }).join('');
        dihubungiContainer.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailProspek(card.dataset.id); }); });
    }
    const negosiasiContainer = document.getElementById('fullProspekNegosiasiList');
    if (negosiasiContainer) {
        negosiasiContainer.innerHTML = lists.prospekNegosiasi.map(item => {
            const isOverdue = item.deadline && item.deadline < today;
            const isToday = item.deadline === today;
            let deadlineClass = '';
            if (isOverdue) deadlineClass = 'deadline-overdue';
            else if (isToday) deadlineClass = 'deadline-today';
            return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="Negosiasi"><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.deadline || '-'}</div></div>`;
        }).join('');
        negosiasiContainer.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailProspek(card.dataset.id); }); });
    }
    const tertarikContainer = document.getElementById('fullProspekTertarikList');
    if (tertarikContainer) {
        tertarikContainer.innerHTML = lists.prospekTertarik.map(item => {
            const isOverdue = item.deadline && item.deadline < today;
            const isToday = item.deadline === today;
            let deadlineClass = '';
            if (isOverdue) deadlineClass = 'deadline-overdue';
            else if (isToday) deadlineClass = 'deadline-today';
            return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="Tertarik"><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.deadline || '-'}</div></div>`;
        }).join('');
        tertarikContainer.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailProspek(card.dataset.id); }); });
    }
}

document.getElementById('addCustomerFullBtn')?.addEventListener('click', () => {
    const today = getTodayDate();
    document.getElementById('customerDate').value = today;
    document.getElementById('customerModal').style.display = 'flex';
});
document.getElementById('addProspekFullBtn')?.addEventListener('click', () => {
    const today = getTodayDate();
    document.getElementById('prospekDeadline').value = today;
    document.getElementById('prospekModal').style.display = 'flex';
});

function initDragAndDrop() {
    console.log("Drag and drop disabled");
}

// ========== DATABASE ARCHIVES ==========
let selectedClosingIds = new Map(), selectedTidakIds = new Map(), selectedNomorSalahIds = new Map(), selectedCommitmentIds = new Map();

function loadDBClosing() {
    if (!currentUser) return;
    db.collection('db_closing').where('user_id', '==', currentUser.uid).onSnapshot(snap => {
        let items = [];
        snap.forEach(doc => { const d = doc.data(); items.push({ id: doc.id, nama: d.nama, hp: d.hp, closing_date: d.closing_date, checked: selectedClosingIds.get(doc.id) || false }); });
        items.sort((a,b) => new Date(b.closing_date) - new Date(a.closing_date));
        const html = items.map(item => `<div class="db-item"><input type="checkbox" class="db-item-checkbox" data-id="${item.id}" ${item.checked ? 'checked' : ''}><div class="db-item-info"><h4>${escapeHtml(item.nama)}</h4><p>${item.hp}</p><small>Closing: ${new Date(item.closing_date).toLocaleDateString('id-ID')}</small></div><div class="db-item-actions"><button class="db-item-wa" onclick="openWA('${item.hp}')">💬 WA</button><button class="db-item-delete" onclick="deleteDBItem('closing', '${item.id}')">🗑️ Hapus</button></div></div>`).join('');
        const container = document.getElementById('dbClosingList');
        if (container) container.innerHTML = html || '<p style="text-align:center;padding:40px;">📭 Belum ada data closing</p>';
        attachCheckboxEvents('#dbClosingList', selectedClosingIds, 'selectAllClosing');
    });
}

function loadDBTidak() {
    if (!currentUser) return;
    db.collection('db_tidak_tertarik').where('user_id', '==', currentUser.uid).onSnapshot(snap => {
        let items = [];
        snap.forEach(doc => { const d = doc.data(); items.push({ id: doc.id, nama: d.nama, hp: d.hp, tanggal: d.tanggal, checked: selectedTidakIds.get(doc.id) || false }); });
        items.sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal));
        const html = items.map(item => `<div class="db-item"><input type="checkbox" class="db-item-checkbox" data-id="${item.id}" ${item.checked ? 'checked' : ''}><div class="db-item-info"><h4>${escapeHtml(item.nama)}</h4><p>${item.hp}</p><small>Tanggal: ${new Date(item.tanggal).toLocaleDateString('id-ID')}</small></div><div class="db-item-actions"><button class="db-item-wa" onclick="openWA('${item.hp}')">💬 WA</button><button class="db-item-delete" onclick="deleteDBItem('tidak', '${item.id}')">🗑️ Hapus</button></div></div>`).join('');
        const container = document.getElementById('dbTidakList');
        if (container) container.innerHTML = html || '<p style="text-align:center;padding:40px;">📭 Belum ada data tidak tertarik</p>';
        attachCheckboxEvents('#dbTidakList', selectedTidakIds, 'selectAllTidak');
    });
}

function loadDBNomorSalah() {
    if (!currentUser) return;
    db.collection('nomor_salah').where('user_id', '==', currentUser.uid).onSnapshot(snap => {
        let items = [];
        snap.forEach(doc => { const d = doc.data(); items.push({ id: doc.id, nama: d.nama, hp: d.hp, alasan: d.alasan, deleted_at: d.deleted_at, checked: selectedNomorSalahIds.get(doc.id) || false }); });
        items.sort((a,b) => new Date(b.deleted_at) - new Date(a.deleted_at));
        const html = items.map(item => `<div class="db-item"><input type="checkbox" class="db-item-checkbox" data-id="${item.id}" ${item.checked ? 'checked' : ''}><div class="db-item-info"><h4>${escapeHtml(item.nama)}</h4><p>${item.hp}</p><small>Alasan: ${item.alasan}<br>Tanggal: ${new Date(item.deleted_at).toLocaleDateString('id-ID')}</small></div><div class="db-item-actions"><button class="db-item-wa" onclick="openWA('${item.hp}')">💬 WA</button><button class="db-item-delete" onclick="deleteDBItem('nomor_salah', '${item.id}')">🗑️ Hapus</button></div></div>`).join('');
        const container = document.getElementById('dbNomorSalahList');
        if (container) container.innerHTML = html || '<p style="text-align:center;padding:40px;">📭 Belum ada data nomor salah</p>';
        attachCheckboxEvents('#dbNomorSalahList', selectedNomorSalahIds, 'selectAllNomorSalah');
    });
}

function loadDBCommitment() {
    if (!currentUser) return;
    db.collection('db_commitment').where('user_id', '==', currentUser.uid).onSnapshot(snap => {
        let items = [];
        snap.forEach(doc => { const d = doc.data(); items.push({ id: doc.id, nama: d.nama, hp: d.hp, committed_at: d.committed_at, negosiasi_data: d.negosiasi_data, agent_id: d.agent_id, aplikasi: d.aplikasi, followup_date: d.followup_date, checked: selectedCommitmentIds.get(doc.id) || false }); });
        items.sort((a,b) => new Date(b.committed_at) - new Date(a.committed_at));
        const html = items.map(item => `<div class="db-item"><input type="checkbox" class="db-item-checkbox" data-id="${item.id}" ${item.checked ? 'checked' : ''}><div class="db-item-info"><h4>${escapeHtml(item.nama)}</h4><p>${item.hp}</p><small>Komitmen: ${new Date(item.committed_at).toLocaleDateString('id-ID')}<br>Followup: ${item.followup_date || '-'}<br>Agent: ${item.agent_id || '-'}<br>Aplikasi: ${item.aplikasi || item.negosiasi_data?.aplikasi || '-'}</small></div><div class="db-item-actions"><button class="db-item-wa" onclick="openWA('${item.hp}')">💬 WA</button><button class="db-item-delete" onclick="deleteDBItem('db_commitment', '${item.id}')">🗑️ Hapus</button></div></div>`).join('');
        const container = document.getElementById('dbCommitmentList');
        if (container) container.innerHTML = html || '<p style="text-align:center;padding:40px;">📭 Belum ada data komitmen</p>';
        attachCheckboxEvents('#dbCommitmentList', selectedCommitmentIds, 'selectAllCommitment');
    });
}

function attachCheckboxEvents(selector, map, selectAllId) {
    const checkboxes = document.querySelectorAll(`${selector} .db-item-checkbox`);
    checkboxes.forEach(cb => {
        cb.removeEventListener('change', handleCheckboxChange);
        cb.addEventListener('change', handleCheckboxChange);
        function handleCheckboxChange(e) {
            const id = cb.dataset.id;
            cb.checked ? map.set(id, true) : map.delete(id);
            const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(c => c.checked);
            const btn = document.getElementById(selectAllId);
            if (btn) btn.textContent = allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua';
        }
    });
    const btn = document.getElementById(selectAllId);
    if (btn) {
        btn.onclick = () => {
            const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
            checkboxes.forEach(cb => { cb.checked = !allChecked; const id = cb.dataset.id; !allChecked ? map.set(id, true) : map.delete(id); });
            btn.textContent = !allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua';
        };
    }
}

window.deleteDBItem = async function(type, id) {
    if (!confirm('Yakin hapus data ini?')) return;
    try {
        if (type === 'closing') await db.collection('db_closing').doc(id).delete();
        else if (type === 'tidak') await db.collection('db_tidak_tertarik').doc(id).delete();
        else if (type === 'nomor_salah') await db.collection('nomor_salah').doc(id).delete();
        else if (type === 'db_commitment') await db.collection('db_commitment').doc(id).delete();
        showNotif('Data berhasil dihapus');
    } catch(e) { showNotif('Gagal hapus: ' + e.message, true); }
};

window.deleteSelectedClosing = async function() {
    const selectedIds = Array.from(selectedClosingIds.keys());
    if (selectedIds.length === 0) { showNotif('Tidak ada data yang dipilih', true); return; }
    if (confirm(`Hapus ${selectedIds.length} data closing yang dipilih?`)) {
        try { const batch = db.batch(); selectedIds.forEach(id => batch.delete(db.collection('db_closing').doc(id))); await batch.commit(); selectedClosingIds.clear(); showNotif(`${selectedIds.length} data closing berhasil dihapus`); } catch(e) { showNotif('Gagal hapus: ' + e.message, true); }
    }
};
window.deleteSelectedTidak = async function() {
    const selectedIds = Array.from(selectedTidakIds.keys());
    if (selectedIds.length === 0) { showNotif('Tidak ada data yang dipilih', true); return; }
    if (confirm(`Hapus ${selectedIds.length} data tidak tertarik yang dipilih?`)) {
        try { const batch = db.batch(); selectedIds.forEach(id => batch.delete(db.collection('db_tidak_tertarik').doc(id))); await batch.commit(); selectedTidakIds.clear(); showNotif(`${selectedIds.length} data tidak tertarik berhasil dihapus`); } catch(e) { showNotif('Gagal hapus: ' + e.message, true); }
    }
};
window.deleteSelectedNomorSalah = async function() {
    const selectedIds = Array.from(selectedNomorSalahIds.keys());
    if (selectedIds.length === 0) { showNotif('Tidak ada data yang dipilih', true); return; }
    if (confirm(`Hapus ${selectedIds.length} data nomor salah yang dipilih?`)) {
        try { const batch = db.batch(); selectedIds.forEach(id => batch.delete(db.collection('nomor_salah').doc(id))); await batch.commit(); selectedNomorSalahIds.clear(); showNotif(`${selectedIds.length} data berhasil dihapus`); } catch(e) { showNotif('Gagal hapus: ' + e.message, true); }
    }
};
window.deleteSelectedCommitment = async function() {
    const selectedIds = Array.from(selectedCommitmentIds.keys());
    if (selectedIds.length === 0) { showNotif('Tidak ada data yang dipilih', true); return; }
    if (confirm(`Hapus ${selectedIds.length} data komitmen yang dipilih?`)) {
        try { const batch = db.batch(); selectedIds.forEach(id => batch.delete(db.collection('db_commitment').doc(id))); await batch.commit(); selectedCommitmentIds.clear(); showNotif(`${selectedIds.length} data berhasil dihapus`); } catch(e) { showNotif('Gagal hapus: ' + e.message, true); }
    }
};

document.getElementById('selectAllClosing')?.addEventListener('click', () => {});
document.getElementById('deleteSelectedClosing')?.addEventListener('click', deleteSelectedClosing);
document.getElementById('selectAllTidak')?.addEventListener('click', () => {});
document.getElementById('deleteSelectedTidak')?.addEventListener('click', deleteSelectedTidak);
document.getElementById('selectAllNomorSalah')?.addEventListener('click', () => {});
document.getElementById('deleteSelectedNomorSalah')?.addEventListener('click', deleteSelectedNomorSalah);
document.getElementById('selectAllCommitment')?.addEventListener('click', () => {});
document.getElementById('deleteSelectedCommitment')?.addEventListener('click', deleteSelectedCommitment);

// ========== CHARTS ==========
function updateChartCustomer(total, closing, pending, followup) {
    const ctx = document.getElementById('chartCustomer');
    if (!ctx) return;
    if (chartCustomer) chartCustomer.destroy();
    const baru = total - (closing + pending + followup);
    chartCustomer = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Closing', 'Pending', 'Follow Up', 'Baru'],
            datasets: [{
                data: [closing, pending, followup, baru],
                backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'],
                borderWidth: 0,
                hoverOffset: 15,
                cutout: '65%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'right', labels: { usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11 } } },
                tooltip: { callbacks: { label: function(context) { const label = context.label || '', value = context.raw || 0, total = context.dataset.data.reduce((a,b)=>a+b,0); return `${label}: ${value} (${total ? ((value/total)*100).toFixed(1) : 0}%)`; } } }
            }
        }
    });
}

function updateChartProspek(baru, dihubungi, negosiasi, tertarik) {
    const ctx = document.getElementById('chartProspek');
    if (!ctx) return;
    if (chartProspek) chartProspek.destroy();
    let dataArr = [baru, dihubungi, negosiasi, tertarik];
    if (dataArr.every(v => v === 0)) dataArr = [1, 0, 0, 0];
    chartProspek = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Baru', 'Dihubungi', 'Negosiasi', 'Tertarik'],
            datasets: [{
                data: dataArr,
                backgroundColor: ['#8b5cf6', '#3b82f6', '#f59e0b', '#10b981'],
                borderWidth: 0,
                hoverOffset: 15,
                cutout: '65%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'right', labels: { usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11 } } },
                tooltip: { callbacks: { label: function(context) { const label = context.label || '', value = context.raw || 0, total = context.dataset.data.reduce((a,b)=>a+b,0); return `${label}: ${value} (${total ? ((value/total)*100).toFixed(1) : 0}%)`; } } }
            }
        }
    });
}

// ========== LOAD ALL DATA ==========
function loadAllData() {
    if (!currentUser) return;
    const today = getTodayDate();
    
    db.collection('customers').where('user_id', '==', currentUser.uid).onSnapshot(snap => {
        let total = 0, closing = 0, pending = 0, followup = 0;
        const lists = { baru: [], followup: [], pending: [], closing: [] };
        customersData = [];
        snap.forEach(doc => {
            const d = doc.data();
            customersData.push({ id: doc.id, ...d });
            total++;
            if (d.status === 'closing') closing++;
            else if (d.status === 'pending') pending++;
            else if (d.status === 'followup') followup++;
            else lists.baru.push({ id: doc.id, agent_id: d.agent_id, nama: d.nama, hp: d.hp, tanggal: d.tanggal, status: d.status });
            if (d.status === 'followup') lists.followup.push({ id: doc.id, agent_id: d.agent_id, nama: d.nama, hp: d.hp, tanggal: d.tanggal, status: d.status });
            if (d.status === 'pending') lists.pending.push({ id: doc.id, agent_id: d.agent_id, nama: d.nama, hp: d.hp, tanggal: d.tanggal, status: d.status });
            if (d.status === 'closing') lists.closing.push({ id: doc.id, agent_id: d.agent_id, nama: d.nama, hp: d.hp, tanggal: d.tanggal, status: d.status });
        });
        for (let status in lists) {
            lists[status].sort((a,b) => (a.tanggal || '9999-12-31').localeCompare(b.tanggal || '9999-12-31'));
        }
        document.getElementById('countBaru').innerText = total - (closing + pending + followup);
        document.getElementById('countFollowup').innerText = followup;
        document.getElementById('countPending').innerText = pending;
        document.getElementById('countClosing').innerText = closing;
        document.getElementById('totalData').innerText = total;
        document.getElementById('closingTotal').innerText = closing;
        document.getElementById('activeProspek').innerText = total - closing;
        document.getElementById('rateClosing').innerText = total ? Math.round((closing/total)*100)+'%' : '0%';
        
        for (let status in lists) {
            const container = document.getElementById(status + 'List');
            if (container) {
                container.innerHTML = lists[status].map(item => {
                    const isOverdue = item.tanggal && item.tanggal < today;
                    const isToday = item.tanggal === today;
                    let deadlineClass = '';
                    if (isOverdue) deadlineClass = 'deadline-overdue';
                    else if (isToday) deadlineClass = 'deadline-today';
                    return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="${status}" data-deadline="${item.tanggal || ''}"><div class="card-id">🆔 ${escapeHtml(item.agent_id || '-')}</div><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.tanggal || '-'}</div></div>`;
                }).join('');
                container.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailCustomer(card.dataset.id); }); });
            }
        }
        updateChartCustomer(total, closing, pending, followup);
        updateAllBadges();
        renderFullFollowupKanban();
    });
    
    db.collection('prospek').where('user_id', '==', currentUser.uid).onSnapshot(snap => {
        let baru = 0, dihubungi = 0, negosiasi = 0, tertarik = 0;
        const lists = { prospekBaru: [], prospekDihubungi: [], prospekNegosiasi: [], prospekTertarik: [] };
        prospekData = [];
        snap.forEach(doc => {
            const d = doc.data();
            prospekData.push({ id: doc.id, ...d });
            const st = d.status || 'Baru';
            const deadline = d.deadline || '';
            if (st === 'Baru') { baru++; lists.prospekBaru.push({ id: doc.id, nama: d.nama, hp: d.hp, status: st, deadline }); }
            else if (st === 'Dihubungi') { dihubungi++; lists.prospekDihubungi.push({ id: doc.id, nama: d.nama, hp: d.hp, status: st, deadline }); }
            else if (st === 'Negosiasi') { negosiasi++; lists.prospekNegosiasi.push({ id: doc.id, nama: d.nama, hp: d.hp, status: st, deadline }); }
            else if (st === 'Tertarik') { tertarik++; lists.prospekTertarik.push({ id: doc.id, nama: d.nama, hp: d.hp, status: st, deadline }); }
            else { tertarik++; lists.prospekTertarik.push({ id: doc.id, nama: d.nama, hp: d.hp, status: st, deadline }); }
        });
        for (let col in lists) {
            lists[col].sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'));
        }
        document.getElementById('countProspekBaru').innerText = baru;
        document.getElementById('countDihubungi').innerText = dihubungi;
        document.getElementById('countNegosiasi').innerText = negosiasi;
        document.getElementById('countTertarik').innerText = tertarik;
        for (let col in lists) {
            const container = document.getElementById(col + 'List');
            if (container) {
                container.innerHTML = lists[col].map(item => {
                    const isOverdue = item.deadline && item.deadline < today;
                    const isToday = item.deadline === today;
                    let deadlineClass = '';
                    if (isOverdue) deadlineClass = 'deadline-overdue';
                    else if (isToday) deadlineClass = 'deadline-today';
                    return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="${item.status}" data-deadline="${item.deadline || ''}"><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.deadline || '-'}</div></div>`;
                }).join('');
                container.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailProspek(card.dataset.id); }); });
            }
        }
        updateChartProspek(baru, dihubungi, negosiasi, tertarik);
        updateAllBadges();
        renderFullProspekKanban();
    });
}

async function loadReminders() { 
    try { 
        const snapshot = await db.collection('reminders').where('user_id', '==', currentUser.uid).get(); 
        const reminderList = document.getElementById('reminderList'); 
        if (!reminderList) return; 
        if (snapshot.empty) { 
            reminderList.innerHTML = '<p style="text-align:center;padding:40px;">⏰ Belum ada pengingat</p>'; 
            return; 
        } 
        const items = []; 
        snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() })); 
        items.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)); 
        reminderList.innerHTML = items.map(item => `<div class="db-item"><div class="db-item-info"><h4>📝 ${escapeHtml(item.title)}</h4><p>${escapeHtml(item.description || '-')}</p><small>⏰ ${item.datetime ? new Date(item.datetime).toLocaleString('id-ID') : '-'}</small></div><div class="db-item-actions"><button class="db-item-delete" onclick="deleteReminder('${item.id}')">🗑️ Hapus</button></div></div>`).join(''); 
    } catch(e) { console.error(e); } 
}

window.deleteReminder = async function(id) { 
    if (confirm('Hapus pengingat ini?')) { 
        await db.collection('reminders').doc(id).delete(); 
        showNotif('Pengingat dihapus'); 
        loadReminders(); 
    } 
};

document.getElementById('addReminderBtn')?.addEventListener('click', () => document.getElementById('reminderModal').style.display = 'flex');
document.getElementById('saveReminderBtn')?.addEventListener('click', async () => { 
    const title = document.getElementById('reminderTitle').value; 
    const description = document.getElementById('reminderDesc').value; 
    const datetime = document.getElementById('reminderDateTime').value; 
    if (!title) { showNotif('Judul wajib diisi', true); return; } 
    await db.collection('reminders').add({ title, description: description || '', datetime: datetime || null, user_id: currentUser.uid, created_at: new Date().toISOString() }); 
    closeModal('reminderModal'); 
    document.getElementById('reminderTitle').value = ''; 
    document.getElementById('reminderDesc').value = ''; 
    document.getElementById('reminderDateTime').value = ''; 
    showNotif('✅ Pengingat ditambahkan'); 
    loadReminders(); 
});

async function loadUsersForSelect() { 
    const snapshot = await db.collection('users').get(); 
    const select = document.getElementById('pesanTo'); 
    if (!select) return; 
    select.innerHTML = '<option value="">Pilih CS Tujuan</option>'; 
    snapshot.forEach(doc => { 
        const data = doc.data(); 
        if (doc.id !== currentUser.uid) select.innerHTML += `<option value="${doc.id}">${escapeHtml(data.nama || data.email || 'CS Agent')}</option>`; 
    }); 
}

async function loadPesan() { 
    if (!currentUser) return; 
    try { 
        const snapshot = await db.collection('messages').where('to_id', '==', currentUser.uid).get(); 
        const pesanList = document.getElementById('pesanList'); 
        if (!pesanList) return; 
        if (snapshot.empty) { 
            pesanList.innerHTML = '<p style="text-align:center;padding:40px;">💬 Belum ada pesan</p>'; 
            return; 
        } 
        const items = []; 
        for (const doc of snapshot.docs) items.push({ id: doc.id, ...doc.data() }); 
        items.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)); 
        let html = ''; 
        for (const item of items) { 
            let fromName = 'Unknown'; 
            const fromUser = await db.collection('users').doc(item.from_id).get(); 
            if (fromUser.exists) fromName = fromUser.data().nama || fromUser.data().email || 'CS Agent'; 
            html += `<div class="db-item ${!item.is_read ? 'unread' : ''}" style="${!item.is_read ? 'background:#eef2ff;' : ''}"><div class="db-item-info"><h4>📨 Dari: ${escapeHtml(fromName)}</h4><p>${escapeHtml(item.message)}</p><small>📅 ${new Date(item.created_at).toLocaleString('id-ID')} | ${item.is_read ? '✅ Dibaca' : '🆕 Baru'}</small></div><div class="db-item-actions"><button class="db-item-wa" onclick="markAsRead('${item.id}')">✅ Tandai Dibaca</button><button class="db-item-delete" onclick="deletePesan('${item.id}')">🗑️ Hapus</button></div></div>`; 
        } 
        pesanList.innerHTML = html; 
    } catch(e) { console.error(e); } 
}

window.markAsRead = async function(id) { 
    await db.collection('messages').doc(id).update({ is_read: true }); 
    showNotif('Pesan ditandai dibaca'); 
    loadPesan(); 
    updateAllBadges(); 
};

window.deletePesan = async function(id) { 
    if (confirm('Hapus pesan ini?')) { 
        await db.collection('messages').doc(id).delete(); 
        showNotif('Pesan dihapus'); 
        loadPesan(); 
        updateAllBadges(); 
    } 
};

document.getElementById('addPesanBtn')?.addEventListener('click', async () => { await loadUsersForSelect(); document.getElementById('pesanModal').style.display = 'flex'; });
document.getElementById('savePesanBtn')?.addEventListener('click', async () => { 
    const toId = document.getElementById('pesanTo').value; 
    const message = document.getElementById('pesanMessage').value; 
    if (!toId || !message) { showNotif('Lengkapi data!', true); return; } 
    await db.collection('messages').add({ from_id: currentUser.uid, to_id: toId, message, is_read: false, created_at: new Date().toISOString() }); 
    closeModal('pesanModal'); 
    document.getElementById('pesanTo').value = ''; 
    document.getElementById('pesanMessage').value = ''; 
    showNotif('✅ Pesan terkirim'); 
    updateAllBadges(); 
});

const deadlineNotifBtn = document.getElementById('deadlineNotifBtn');
if (deadlineNotifBtn) {
    deadlineNotifBtn.addEventListener('click', async () => {
        const today = getTodayDate();
        try {
            const overdueCustomers = await db.collection('customers').where('user_id', '==', currentUser.uid).where('tanggal', '<', today).get();
            const overdueProspek = await db.collection('prospek').where('user_id', '==', currentUser.uid).where('deadline', '<', today).get();
            if (overdueCustomers.size + overdueProspek.size > 0) {
                let message = `📅 DEADLINE TERLEWAT (${overdueCustomers.size + overdueProspek.size}):\n`;
                overdueCustomers.forEach(doc => { message += `\n• ${doc.data().nama} (Customer) - ${doc.data().tanggal}`; });
                overdueProspek.forEach(doc => { message += `\n• ${doc.data().nama} (Prospek) - ${doc.data().deadline}`; });
                alert(message);
            } else {
                showNotif('✅ Semua deadline terpenuhi!');
            }
        } catch(e) { console.error(e); }
    });
}
const pesanNotifBtn = document.getElementById('pesanNotifBtn');
if (pesanNotifBtn) {
    pesanNotifBtn.addEventListener('click', () => {
        const pesanMenu = document.querySelector('.menu-item[data-page="pesan"]');
        if (pesanMenu) pesanMenu.click();
    });
}

// ========== IMPORT EXCEL (SEDERHANAKAN KARENA PANJANG) ==========
const dropZone = document.getElementById('dropZone');
const excelFileInput = document.getElementById('excelFile');
if (dropZone) dropZone.addEventListener('click', () => excelFileInput?.click());
if (excelFileInput) excelFileInput.addEventListener('change', function(e) { 
    if (e.target.files[0]) document.getElementById('fileInfo').innerHTML = '📄 ' + e.target.files[0].name; 
});

document.querySelectorAll('.radio-option').forEach(opt => opt.addEventListener('click', function() { 
    importType = this.dataset.import; 
    document.querySelectorAll('.radio-option').forEach(o => o.classList.remove('active')); 
    this.classList.add('active'); 
}));

document.getElementById('importBtn')?.addEventListener('click', async () => {
    const file = excelFileInput?.files[0];
    if (!file) { 
        showNotif('Pilih file dulu!', true); 
        return; 
    }
    
    const importBtn = document.getElementById('importBtn');
    const originalText = importBtn.textContent;
    importBtn.textContent = '⏳ Memproses...';
    importBtn.disabled = true;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
            
            if (!json || json.length === 0) {
                showNotif('File Excel kosong!', true);
                importBtn.textContent = originalText;
                importBtn.disabled = false;
                return;
            }
            
            let success = 0;
            let failed = 0;
            const errors = [];
            
            const firstRow = json[0];
            const columnMap = {};
            
            if (importType === 'customer') {
                const possibleAgentId = ['agent_id', 'Agent_ID', 'agentid', 'AgentId', 'id', 'ID'];
                const possibleNama = ['nama', 'Nama', 'name', 'Name', 'customer_name', 'CustomerName'];
                const possibleHp = ['hp', 'HP', 'phone', 'Phone', 'no_hp', 'NoHP', 'whatsapp', 'WhatsApp'];
                const possibleApk = ['apk', 'APK', 'aplikasi', 'Aplikasi', 'app'];
                const possibleDeadline = ['deadline', 'Deadline', 'tanggal', 'Tanggal', 'date'];
                
                for (let key in firstRow) {
                    const lowerKey = key.toLowerCase();
                    if (possibleAgentId.some(p => p.toLowerCase() === lowerKey)) columnMap.agentId = key;
                    if (possibleNama.some(p => p.toLowerCase() === lowerKey)) columnMap.nama = key;
                    if (possibleHp.some(p => p.toLowerCase() === lowerKey)) columnMap.hp = key;
                    if (possibleApk.some(p => p.toLowerCase() === lowerKey)) columnMap.apk = key;
                    if (possibleDeadline.some(p => p.toLowerCase() === lowerKey)) columnMap.deadline = key;
                }
            } else {
                const possibleNama = ['nama', 'Nama', 'name', 'Name', 'prospek_name', 'ProspekName'];
                const possibleHp = ['hp', 'HP', 'phone', 'Phone', 'no_hp', 'NoHP', 'whatsapp', 'WhatsApp'];
                const possibleDeadline = ['deadline', 'Deadline', 'tanggal', 'Tanggal', 'date'];
                
                for (let key in firstRow) {
                    const lowerKey = key.toLowerCase();
                    if (possibleNama.some(p => p.toLowerCase() === lowerKey)) columnMap.nama = key;
                    if (possibleHp.some(p => p.toLowerCase() === lowerKey)) columnMap.hp = key;
                    if (possibleDeadline.some(p => p.toLowerCase() === lowerKey)) columnMap.deadline = key;
                }
            }
            
            if (importType === 'customer') {
                if (!columnMap.agentId || !columnMap.nama || !columnMap.hp || !columnMap.apk) {
                    showNotif('❌ Format Excel tidak sesuai! Gunakan kolom: agent_id, nama, hp, apk, deadline (opsional)', true);
                    importBtn.textContent = originalText;
                    importBtn.disabled = false;
                    return;
                }
            } else {
                if (!columnMap.nama || !columnMap.hp) {
                    showNotif('❌ Format Excel tidak sesuai! Gunakan kolom: nama, hp, deadline (opsional)', true);
                    importBtn.textContent = originalText;
                    importBtn.disabled = false;
                    return;
                }
            }
            
            for (let row of json) {
                try {
                    let agentId = columnMap.agentId ? row[columnMap.agentId] : null;
                    let nama = row[columnMap.nama];
                    let hp = row[columnMap.hp];
                    let apk = columnMap.apk ? row[columnMap.apk] : null;
                    let deadline = columnMap.deadline ? row[columnMap.deadline] : null;
                    
                    if (!nama || !hp) {
                        failed++;
                        errors.push(`Baris ke-${json.indexOf(row)+2}: Nama atau HP kosong`);
                        continue;
                    }
                    
                    if (importType === 'customer') {
                        if (!agentId || !apk) {
                            failed++;
                            errors.push(`Baris ke-${json.indexOf(row)+2}: ID Agent atau Aplikasi kosong`);
                            continue;
                        }
                    }
                    
                    let cleanHp = hp.toString().trim();
                    cleanHp = cleanHp.replace(/[^\d+]/g, '');
                    if (!cleanHp.startsWith('+')) {
                        cleanHp = cleanHp.replace(/^0+/, '');
                        if (cleanHp.startsWith('62')) {
                            cleanHp = '+' + cleanHp;
                        } else if (cleanHp.match(/^\d+$/)) {
                            cleanHp = '+62' + cleanHp;
                        } else {
                            cleanHp = '+' + cleanHp.replace(/^\+/, '');
                        }
                    }
                    
                    let formattedDeadline = deadline;
                    if (deadline) {
                        let dateObj = new Date(deadline);
                        if (isNaN(dateObj.getTime())) {
                            if (typeof deadline === 'number') {
                                const excelEpoch = new Date(1900, 0, 1);
                                dateObj = new Date(excelEpoch.getTime() + (deadline - 2) * 86400000);
                            } else {
                                const parts = deadline.toString().split(/[-/]/);
                                if (parts.length === 3) {
                                    dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
                                }
                            }
                        }
                        if (!isNaN(dateObj.getTime())) {
                            formattedDeadline = dateObj.toISOString().split('T')[0];
                        } else {
                            formattedDeadline = getTodayDate();
                        }
                    } else {
                        formattedDeadline = getTodayDate();
                    }
                    
                    if (importType === 'customer') {
                        await db.collection('customers').add({
                            agent_id: agentId.toString().trim().toUpperCase(),
                            nama: nama.toString().trim(),
                            hp: cleanHp,
                            apk: apk.toString().trim(),
                            tanggal: formattedDeadline,
                            status: 'baru',
                            user_id: currentUser.uid,
                            created_at: new Date().toISOString(),
                            followup_data: null,
                            pending_data: []
                        });
                    } else {
                        await db.collection('prospek').add({
                            nama: nama.toString().trim(),
                            hp: cleanHp,
                            status: 'Baru',
                            deadline: formattedDeadline,
                            user_id: currentUser.uid,
                            created_at: new Date().toISOString(),
                            dihubungi_data: null,
                            negosiasi_data: null
                        });
                    }
                    success++;
                } catch(rowError) {
                    failed++;
                    errors.push(`Baris ke-${json.indexOf(row)+2}: ${rowError.message}`);
                }
            }
            
            let resultMsg = `✅ Selesai!\nBerhasil: ${success}\nGagal: ${failed}`;
            if (errors.length > 0 && errors.length <= 5) {
                resultMsg += `\n\nDetail error:\n${errors.join('\n')}`;
            } else if (errors.length > 5) {
                resultMsg += `\n\n${errors.length} error terjadi. Periksa format data Anda.`;
            }
            alert(resultMsg);
            
            excelFileInput.value = '';
            document.getElementById('fileInfo').innerHTML = '';
            updateAllBadges();
            loadAllData();
            
        } catch(error) {
            console.error('Import error:', error);
            showNotif('❌ Gagal memproses file: ' + error.message, true);
        } finally {
            importBtn.textContent = originalText;
            importBtn.disabled = false;
        }
    };
    
    reader.onerror = function() {
        showNotif('❌ Gagal membaca file', true);
        importBtn.textContent = originalText;
        importBtn.disabled = false;
    };
    
    reader.readAsArrayBuffer(file);
});

// ========== DOWNLOAD CONTOH FILE ==========
document.getElementById('downloadCustomerExample')?.addEventListener('click', () => {
    const data = [{ 
        agent_id: 'AG-001', 
        nama: 'Budi Santoso', 
        hp: '6281234567890', 
        apk: 'GNP', 
        deadline: getTodayDate()
    }];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customer');
    XLSX.writeFile(wb, 'contoh_customer.xlsx');
});

document.getElementById('downloadProspekExample')?.addEventListener('click', () => {
    const data = [{ 
        nama: 'Rina Marlina', 
        hp: '6281234567893', 
        deadline: getTodayDate()
    }];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prospek');
    XLSX.writeFile(wb, 'contoh_prospek.xlsx');
});
