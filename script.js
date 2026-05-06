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

// Helper functions
function showNotif(msg, isError = false) {
    const notif = document.createElement('div');
    notif.textContent = msg;
    notif.className = `notif-toast ${isError ? 'notif-error' : 'notif-success'}`;
    document.getElementById('notifBox').appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
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

// ========== SIDEBAR ==========
function isMobile() { return window.innerWidth <= 768; }
function updateSidebarBodyClass() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('active')) document.body.classList.add('sidebar-open');
    else document.body.classList.remove('sidebar-open');
}

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

// ========== LOGIN ==========
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

// ========== LOGOUT ==========
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', () => auth.signOut());

// ========== AUTH STATE ==========
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
        loadAllData();
        loadReminders();
        loadPesan();
        await updateNotifBadge();
    } else {
        loginPage.style.display = 'flex';
        app.style.display = 'none';
        currentUser = null;
    }
});

// ========== NAVIGATION ==========
document.querySelectorAll('.menu-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;
        const pages = ['dashboardPage', 'importPage', 'dbClosingPage', 'dbTidakPage', 'reminderPage', 'pesanPage', 'broadcastPage'];
        pages.forEach(p => { const el = document.getElementById(p); if (el) el.style.display = 'none'; });
        if (page === 'dashboard') document.getElementById('dashboardPage').style.display = 'block';
        else if (page === 'import') document.getElementById('importPage').style.display = 'block';
        else if (page === 'dbClosing') { document.getElementById('dbClosingPage').style.display = 'block'; loadDBClosing(); }
        else if (page === 'dbTidak') { document.getElementById('dbTidakPage').style.display = 'block'; loadDBTidak(); }
        else if (page === 'reminder') { document.getElementById('reminderPage').style.display = 'block'; loadReminders(); }
        else if (page === 'pesan') { document.getElementById('pesanPage').style.display = 'block'; loadPesan(); loadUsersForSelect(); }
        else if (page === 'broadcast') { document.getElementById('broadcastPage').style.display = 'block'; initBroadcast(); }
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        item.classList.add('active');
        if (window.innerWidth <= 768) document.getElementById('sidebar')?.classList.remove('active');
        updateSidebarBodyClass();
    });
});

// ========== CLOSE MODALS ==========
document.querySelectorAll('.closeModalBtn').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.modal)));
document.querySelectorAll('.modal').forEach(modal => modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal.id); }));

// ========== PROFILE ==========
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
function showPhotoPreview(imageUrl) { /* sama seperti sebelumnya */ }
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

// ========== CUSTOMER CRUD ==========
document.getElementById('addCustomerBtn')?.addEventListener('click', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('customerDate').value = today;
    document.getElementById('customerModal').style.display = 'flex';
});
document.getElementById('saveCustomerBtn')?.addEventListener('click', () => {
    const agentId = document.getElementById('customerId').value;
    const nama = document.getElementById('customerName').value;
    let hp = document.getElementById('customerPhone').value;
    const apk = document.getElementById('customerApk').value;
    let tanggal = document.getElementById('customerDate').value;
    if (!agentId || !nama || !hp || !apk) { showNotif('Lengkapi data! (ID Agent, Nama, No WhatsApp, Aplikasi wajib diisi)', true); return; }
    if (!tanggal) tanggal = new Date().toISOString().split('T')[0];
    hp = '+62' + hp.replace(/\D/g, '');
    db.collection('customers').add({ agent_id: agentId, nama, hp, apk, tanggal, status: 'baru', user_id: currentUser.uid, created_at: new Date().toISOString() })
        .then(() => { closeModal('customerModal'); document.getElementById('customerId').value = ''; document.getElementById('customerName').value = ''; document.getElementById('customerPhone').value = ''; document.getElementById('customerApk').value = ''; document.getElementById('customerDate').value = ''; showNotif('Customer berhasil ditambahkan'); updateNotifBadge(); })
        .catch(e => showNotif('Error: ' + e.message, true));
});

// ========== PROSPEK CRUD (dengan deadline) ==========
document.getElementById('addProspekBtn')?.addEventListener('click', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('prospekDeadline').value = today;
    document.getElementById('prospekModal').style.display = 'flex';
});
document.getElementById('saveProspekBtn')?.addEventListener('click', () => {
    const nama = document.getElementById('prospekName').value;
    let hp = document.getElementById('prospekPhone').value;
    const status = document.getElementById('prospekStatusSelect').value;
    let deadline = document.getElementById('prospekDeadline').value;
    if (!nama || !hp) { showNotif('Lengkapi data!', true); return; }
    if (!deadline) deadline = new Date().toISOString().split('T')[0];
    hp = '+62' + hp.replace(/\D/g, '');
    db.collection('prospek').add({ nama, hp, status, deadline, user_id: currentUser.uid, created_at: new Date().toISOString() })
        .then(() => { closeModal('prospekModal'); document.getElementById('prospekName').value = ''; document.getElementById('prospekPhone').value = ''; document.getElementById('prospekDeadline').value = ''; showNotif('Prospek berhasil ditambahkan'); })
        .catch(e => showNotif('Error: ' + e.message, true));
});

// ========== DETAIL MODAL ==========
function showModal(modalId) { const modal = document.getElementById(modalId); if (modal) { modal.style.display = 'flex'; document.body.classList.add('modal-open'); } }
function getStatusBadge(status) {
    const statusMap = { 'baru':'status-baru', 'followup':'status-followup', 'pending':'status-pending', 'closing':'status-closing', 'Baru':'status-baru', 'Sudah Dihubungi':'status-dihubungi', 'Tertarik':'status-tertarik', 'Tidak Tertarik':'status-tidak' };
    const className = statusMap[status] || 'status-baru';
    let displayName = status;
    if (status === 'followup') displayName = 'Follow Up';
    else if (status === 'Sudah Dihubungi') displayName = 'Dihubungi';
    else if (status === 'Tidak Tertarik') displayName = 'Tidak Tertarik';
    return `<span class="status-badge ${className}">${displayName}</span>`;
}
function openDetailCustomer(id) {
    db.collection('customers').doc(id).get().then(doc => {
        const d = doc.data();
        const statusIcon = d.status === 'closing' ? '🎉' : d.status === 'pending' ? '⏳' : d.status === 'followup' ? '📞' : '🆕';
        let actionButtons = '';
        if (d.status === 'baru') actionButtons = `<button class="btn-primary" onclick="updateCustomerStatus('${id}','followup')">📞 Lanjut ke Follow Up</button>`;
        else if (d.status === 'followup') actionButtons = `<button class="btn-warning" onclick="updateCustomerStatus('${id}','pending')">⏳ Lanjut ke Pending</button>`;
        else if (d.status === 'pending') actionButtons = `<button class="btn-success" onclick="confirmClosing('${id}')">🎉 Closing</button>`;
        else if (d.status === 'closing') actionButtons = `<button class="btn-outline" disabled style="opacity:0.5; cursor:not-allowed;">✅ Selesai (Closing)</button>`;
        document.getElementById('detailContent').innerHTML = `
            <div class="detail-header"><div class="detail-avatar">${statusIcon}</div><h3>${escapeHtml(d.nama)}</h3><div class="detail-status">${getStatusBadge(d.status)}</div></div>
            <div class="detail-body"><div class="detail-info">
                <div class="detail-info-item"><div class="detail-info-icon">🆔</div><div class="detail-info-content"><label>ID Agent</label><div class="value">${escapeHtml(d.agent_id || '-')}</div></div></div>
                <div class="detail-info-item"><div class="detail-info-icon">📱</div><div class="detail-info-content"><label>Aplikasi</label><div class="value">${escapeHtml(d.apk || '-')}</div></div></div>
                <div class="detail-info-item"><div class="detail-info-icon">📱</div><div class="detail-info-content"><label>Nomor WhatsApp</label><div class="value">${escapeHtml(d.hp)}</div></div></div>
                <div class="detail-info-item"><div class="detail-info-icon">📅</div><div class="detail-info-content"><label>Deadline</label><div class="value">${d.tanggal || '-'}</div></div></div>
                <div class="detail-info-item"><div class="detail-info-icon">📌</div><div class="detail-info-content"><label>Status Saat Ini</label><div class="value">${d.status === 'followup' ? 'Follow Up' : d.status === 'baru' ? 'Baru' : d.status}</div></div></div>
            </div><div class="detail-actions"><button class="btn-success" onclick="openWA('${d.hp}')">💬 WhatsApp</button>${actionButtons}</div></div>
            <div class="detail-footer"><button class="btn-outline" onclick="closeModal('detailModal')">❌ Tutup</button><button class="btn-danger" onclick="deleteCustomer('${id}')">🗑️ Hapus</button></div>`;
        showModal('detailModal');
    });
}
window.updateCustomerStatus = function(id, newStatus) {
    if (confirm(`⚠️ Konfirmasi perubahan status\n\nAnda akan memindahkan customer ke status ${newStatus === 'followup' ? 'Follow Up' : newStatus}.\n\n✅ OK = Lanjutkan\n❌ CANCEL = Batalkan`)) {
        db.collection('customers').doc(id).update({ status: newStatus });
        closeModal('detailModal');
        showNotif(`Status berhasil diupdate ke ${newStatus === 'followup' ? 'Follow Up' : newStatus}`);
    }
};
function openDetailProspek(id) {
    db.collection('prospek').doc(id).get().then(doc => {
        const d = doc.data();
        let statusIcon = d.status === 'Sudah Dihubungi' ? '📞' : d.status === 'Tertarik' ? '⭐' : d.status === 'Tidak Tertarik' ? '❌' : '🆕';
        let actionButtons = '';
        if (d.status === 'Baru') actionButtons = `<button class="btn-primary" onclick="updateProspekStatus('${id}','Sudah Dihubungi')">📞 Lanjut ke Dihubungi</button>`;
        else if (d.status === 'Sudah Dihubungi') actionButtons = `<button class="btn-success" onclick="updateProspekStatus('${id}','Tertarik')">⭐ Tertarik</button><button class="btn-danger" onclick="confirmTidakTertarik('${id}')">❌ Tidak Tertarik</button>`;
        else if (d.status === 'Tertarik') actionButtons = `<button class="btn-primary" onclick="showConvertToCustomerModal('${id}')">🔄 Jadikan Customer (Followup Agen)</button>`;
        else actionButtons = `<button class="btn-outline" disabled style="opacity:0.5; cursor:not-allowed;">❌ Sudah Tidak Tertarik</button>`;
        document.getElementById('detailContent').innerHTML = `
            <div class="detail-header"><div class="detail-avatar">${statusIcon}</div><h3>${escapeHtml(d.nama)}</h3><div class="detail-status">${getStatusBadge(d.status)}</div></div>
            <div class="detail-body"><div class="detail-info">
                <div class="detail-info-item"><div class="detail-info-icon">📱</div><div class="detail-info-content"><label>Nomor WhatsApp</label><div class="value">${escapeHtml(d.hp)}</div></div></div>
                <div class="detail-info-item"><div class="detail-info-icon">📅</div><div class="detail-info-content"><label>Deadline</label><div class="value">${d.deadline || '-'}</div></div></div>
                <div class="detail-info-item"><div class="detail-info-icon">📌</div><div class="detail-info-content"><label>Status Saat Ini</label><div class="value">${d.status}</div></div></div>
            </div><div class="detail-actions"><button class="btn-success" onclick="openWA('${d.hp}')">💬 WhatsApp</button>${actionButtons}</div></div>
            <div class="detail-footer"><button class="btn-outline" onclick="closeModal('detailModal')">❌ Tutup</button><button class="btn-danger" onclick="deleteProspek('${id}')">🗑️ Hapus</button></div>`;
        showModal('detailModal');
    });
}
window.updateProspekStatus = function(id, status) {
    if (confirm(`⚠️ Konfirmasi perubahan status\n\nAnda akan memindahkan prospek ke status ${status}.\n\n✅ OK = Lanjutkan\n❌ CANCEL = Batalkan`)) {
        db.collection('prospek').doc(id).update({ status });
        closeModal('detailModal');
        showNotif(`Status berhasil diupdate ke ${status}`);
    }
};
window.deleteCustomer = function(id) { if (confirm('Yakin hapus customer ini?')) { db.collection('customers').doc(id).delete(); closeModal('detailModal'); showNotif('Data dihapus'); updateNotifBadge(); } };
window.deleteProspek = function(id) { if (confirm('Yakin hapus prospek ini?')) { db.collection('prospek').doc(id).delete(); closeModal('detailModal'); showNotif('Data dihapus'); } };

// ========== CLOSING & TIDAK TERTARIK ==========
async function saveToClosingDB(id, data) { try { await db.collection('db_closing').add({ nama: data.nama, hp: data.hp, tanggal: data.tanggal || new Date().toISOString().split('T')[0], closing_date: new Date().toISOString(), user_id: currentUser.uid }); await db.collection('customers').doc(id).delete(); showNotif('✅ Data berhasil masuk Database Closing!'); updateNotifBadge(); return true; } catch(e) { showNotif('❌ Gagal: ' + e.message, true); return false; } }
async function saveToTidakTertarikDB(id, data) { try { await db.collection('db_tidak_tertarik').add({ nama: data.nama, hp: data.hp, tanggal: new Date().toISOString(), user_id: currentUser.uid }); await db.collection('prospek').doc(id).delete(); showNotif('✅ Data berhasil masuk Database Tidak Tertarik!'); return true; } catch(e) { showNotif('❌ Gagal: ' + e.message, true); return false; } }
window.confirmClosing = async function(id) { if (confirm("⚠️ PERHATIAN!\n\nAnda akan memindahkan data ini ke DATABASE CLOSING.\n\n✅ OK = Pindahkan ke DB Closing\n❌ CANCEL = Tetap di kolom Closing")) { const doc = await db.collection('customers').doc(id).get(); if (doc.exists) await saveToClosingDB(id, doc.data()); } else { await db.collection('customers').doc(id).update({ status: 'closing' }); showNotif('📌 Data tetap di kolom Closing'); } };
window.confirmTidakTertarik = async function(id) { if (confirm("⚠️ PERHATIAN!\n\nAnda akan memindahkan data ini ke DATABASE TIDAK TERTARIK.\n\n✅ OK = Pindahkan ke DB Tidak Tertarik\n❌ CANCEL = Tetap di kolom Tidak Tertarik")) { const doc = await db.collection('prospek').doc(id).get(); if (doc.exists) await saveToTidakTertarikDB(id, doc.data()); } else { await db.collection('prospek').doc(id).update({ status: 'Tidak Tertarik' }); showNotif('📌 Data tetap di kolom Tidak Tertarik'); } };

// ========== NOTIFIKASI & DEADLINE ==========
async function getDeadlineCount() {
    if (!currentUser) return 0;
    const today = new Date().toISOString().split('T')[0];
    const customerSnapshot = await db.collection('customers').where('user_id', '==', currentUser.uid).where('tanggal', '<', today).get();
    const prospekSnapshot = await db.collection('prospek').where('user_id', '==', currentUser.uid).where('deadline', '<', today).get();
    return customerSnapshot.size + prospekSnapshot.size;
}
async function updateNotifBadge() {
    if (!currentUser) return;
    const pesanSnapshot = await db.collection('messages').where('to_id', '==', currentUser.uid).where('is_read', '==', false).get();
    const deadlineCount = await getDeadlineCount();
    document.getElementById('notifCount').innerText = pesanSnapshot.size + deadlineCount;
}
document.getElementById('notifBtn')?.addEventListener('click', async () => {
    document.querySelector('.menu-item[data-page="pesan"]')?.click();
    const today = new Date().toISOString().split('T')[0];
    const overdueCustomers = await db.collection('customers').where('user_id', '==', currentUser.uid).where('tanggal', '<', today).get();
    const overdueProspek = await db.collection('prospek').where('user_id', '==', currentUser.uid).where('deadline', '<', today).get();
    if (overdueCustomers.size + overdueProspek.size > 0) {
        let names = [];
        overdueCustomers.forEach(doc => names.push(doc.data().nama));
        overdueProspek.forEach(doc => names.push(doc.data().nama));
        showNotif(`📅 Ada ${overdueCustomers.size + overdueProspek.size} deadline terlewat: ${names.slice(0,5).join(', ')}${names.length>5 ? '...' : ''}`);
    } else showNotif('Tidak ada deadline terlewat.');
});

// ========== IMPORT EXCEL ==========
const dropZone = document.getElementById('dropZone');
const excelFileInput = document.getElementById('excelFile');
if (dropZone) dropZone.addEventListener('click', () => excelFileInput?.click());
if (excelFileInput) excelFileInput.addEventListener('change', function(e) { if (e.target.files[0]) document.getElementById('fileInfo').innerHTML = '📄 ' + e.target.files[0].name; });
document.querySelectorAll('.radio-option').forEach(opt => opt.addEventListener('click', function() { importType = this.dataset.import; document.querySelectorAll('.radio-option').forEach(o => o.classList.remove('active')); this.classList.add('active'); }));
document.getElementById('importBtn')?.addEventListener('click', async () => {
    const file = excelFileInput?.files[0];
    if (!file) { showNotif('Pilih file dulu!', true); return; }
    const importBtn = document.getElementById('importBtn');
    importBtn.textContent = 'Memproses...';
    importBtn.disabled = true;
    const reader = new FileReader();
    reader.onload = async function(e) {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        let success = 0, failed = 0;
        for (let row of json) {
            let agentId = row.agent_id || row.Agent_ID || row.id || row.ID;
            let nama = row.nama || row.Nama;
            let hp = row.hp || row.HP || row.phone || row.Phone;
            let apk = row.apk || row.APK || row.aplikasi || row.Aplikasi;
            let deadline = row.deadline || row.Deadline || row.tanggal || row.Tanggal;
            if (importType === 'customer') {
                if (!agentId || !nama || !hp || !apk) { failed++; continue; }
                if (!deadline) deadline = new Date().toISOString().split('T')[0];
                hp = hp.toString(); if (!hp.startsWith('+62')) hp = '+' + hp.replace(/^0/, '62');
                await db.collection('customers').add({ agent_id: agentId, nama, hp, apk, tanggal: deadline, status: 'baru', user_id: currentUser.uid, created_at: new Date().toISOString() });
            } else {
                if (!nama || !hp) { failed++; continue; }
                if (!deadline) deadline = new Date().toISOString().split('T')[0];
                hp = hp.toString(); if (!hp.startsWith('+62')) hp = '+' + hp.replace(/^0/, '62');
                await db.collection('prospek').add({ nama, hp, status: 'Baru', deadline, user_id: currentUser.uid, created_at: new Date().toISOString() });
            }
            success++;
        }
        alert(`Selesai!\nBerhasil: ${success}\nGagal: ${failed}`);
        excelFileInput.value = ''; document.getElementById('fileInfo').innerHTML = '';
        importBtn.textContent = '🚀 Import Data Sekarang';
        importBtn.disabled = false;
        updateNotifBadge();
    };
    reader.readAsArrayBuffer(file);
});

// ========== DATABASE ARCHIVES (sama seperti sebelumnya, tidak diubah) ==========
let selectedClosingIds = new Map(), selectedTidakIds = new Map();
function loadDBClosing() { /* ... */ }
function loadDBTidak() { /* ... */ }
window.selectAllClosing = function() { /* ... */ };
window.selectAllTidak = function() { /* ... */ };
window.deleteDBItem = async function(type, id) { /* ... */ };
window.deleteSelectedClosing = async function() { /* ... */ };
window.deleteSelectedTidak = async function() { /* ... */ };
document.getElementById('selectAllClosing')?.addEventListener('click', selectAllClosing);
document.getElementById('deleteSelectedClosing')?.addEventListener('click', deleteSelectedClosing);
document.getElementById('selectAllTidak')?.addEventListener('click', selectAllTidak);
document.getElementById('deleteSelectedTidak')?.addEventListener('click', deleteSelectedTidak);

// ========== CHARTS (sama) ==========
function updateChartCustomer(total, closing, pending, followup) { /* sama */ }
function updateChartProspek(baru, dihubungi, tertarik, tidak) { /* sama */ }

// ========== DRAG AND DROP (sama, hanya perlu menambahkan data-status) ==========
function initDragAndDrop() { /* sama seperti sebelumnya, pastikan drag item memiliki dataset.status */ }

// ========== LOAD ALL DATA (dengan sorting berdasarkan deadline) ==========
function loadAllData() {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    // Customers
    db.collection('customers').where('user_id', '==', currentUser.uid).onSnapshot(snap => {
        let total = 0, closing = 0, pending = 0, followup = 0;
        const lists = { baru: [], followup: [], pending: [], closing: [] };
        snap.forEach(doc => {
            const d = doc.data();
            total++;
            if (d.status === 'closing') closing++;
            else if (d.status === 'pending') pending++;
            else if (d.status === 'followup') followup++;
            else lists.baru.push({ id: doc.id, agent_id: d.agent_id, nama: d.nama, hp: d.hp, tanggal: d.tanggal });
            if (d.status === 'followup') lists.followup.push({ id: doc.id, agent_id: d.agent_id, nama: d.nama, hp: d.hp, tanggal: d.tanggal });
            if (d.status === 'pending') lists.pending.push({ id: doc.id, agent_id: d.agent_id, nama: d.nama, hp: d.hp, tanggal: d.tanggal });
            if (d.status === 'closing') lists.closing.push({ id: doc.id, agent_id: d.agent_id, nama: d.nama, hp: d.hp, tanggal: d.tanggal });
        });
        // Sort each list by deadline (oldest first, but overdue before future)
        for (let status in lists) {
            lists[status].sort((a,b) => {
                const dateA = a.tanggal ? new Date(a.tanggal) : new Date(0);
                const dateB = b.tanggal ? new Date(b.tanggal) : new Date(0);
                return dateA - dateB;
            });
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
                    return `
                        <div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="${status}" data-deadline="${item.tanggal || ''}">
                            <div class="card-id">🆔 ${escapeHtml(item.agent_id || '-')}</div>
                            <div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div>
                            <div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div>
                            <div class="card-deadline">📅 ${item.tanggal || '-'}</div>
                        </div>
                    `;
                }).join('');
                container.querySelectorAll('.card-item').forEach(card => {
                    card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailCustomer(card.dataset.id); });
                });
            }
        }
        updateChartCustomer(total, closing, pending, followup);
        initDragAndDrop();
        updateNotifBadge();
    });
    // Prospek with deadline
    db.collection('prospek').where('user_id', '==', currentUser.uid).onSnapshot(snap => {
        let baru = 0, dihubungi = 0, tertarik = 0, tidak = 0;
        const lists = { prospekBaru: [], prospekDihubungi: [], prospekTertarik: [], prospekTidak: [] };
        snap.forEach(doc => {
            const d = doc.data();
            const st = d.status || 'Baru';
            const deadline = d.deadline || '';
            if (st === 'Baru') { baru++; lists.prospekBaru.push({ id: doc.id, nama: d.nama, hp: d.hp, status: st, deadline }); }
            else if (st === 'Sudah Dihubungi') { dihubungi++; lists.prospekDihubungi.push({ id: doc.id, nama: d.nama, hp: d.hp, status: st, deadline }); }
            else if (st === 'Tertarik') { tertarik++; lists.prospekTertarik.push({ id: doc.id, nama: d.nama, hp: d.hp, status: st, deadline }); }
            else { tidak++; lists.prospekTidak.push({ id: doc.id, nama: d.nama, hp: d.hp, status: st, deadline }); }
        });
        // Sort by deadline
        for (let col in lists) {
            lists[col].sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'));
        }
        document.getElementById('countProspekBaru').innerText = baru;
        document.getElementById('countDihubungi').innerText = dihubungi;
        document.getElementById('countTertarik').innerText = tertarik;
        document.getElementById('countTidakTertarik').innerText = tidak;
        for (let col in lists) {
            const container = document.getElementById(col + 'List');
            if (container) {
                container.innerHTML = lists[col].map(item => {
                    const isOverdue = item.deadline && item.deadline < today;
                    const isToday = item.deadline === today;
                    let deadlineClass = '';
                    if (isOverdue) deadlineClass = 'deadline-overdue';
                    else if (isToday) deadlineClass = 'deadline-today';
                    return `
                        <div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="${item.status}" data-deadline="${item.deadline || ''}">
                            <div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div>
                            <div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div>
                            <div class="card-deadline">📅 ${item.deadline || '-'}</div>
                        </div>
                    `;
                }).join('');
                container.querySelectorAll('.card-item').forEach(card => {
                    card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailProspek(card.dataset.id); });
                });
            }
        }
        updateChartProspek(baru, dihubungi, tertarik, tidak);
        initDragAndDrop();
    });
}

// ========== REMINDER (sama) ==========
async function loadReminders() { /* ... */ }
window.deleteReminder = async function(id) { /* ... */ };
document.getElementById('addReminderBtn')?.addEventListener('click', () => document.getElementById('reminderModal').style.display = 'flex');
document.getElementById('saveReminderBtn')?.addEventListener('click', async () => { /* ... */ });

// ========== PESAN (sama) ==========
async function loadUsersForSelect() { /* ... */ }
async function loadPesan() { /* ... */ }
window.markAsRead = async function(id) { /* ... */ };
window.deletePesan = async function(id) { /* ... */ };
document.getElementById('addPesanBtn')?.addEventListener('click', async () => { /* ... */ });
document.getElementById('savePesanBtn')?.addEventListener('click', async () => { /* ... */ });

// ========== BROADCAST (sama) ==========
let currentNumbers = [], currentBroadcastIndex = 0, broadcastNumbers = [], broadcastMessageTemplate = '', isBroadcasting = false, broadcastStatus = [];
function initBroadcast() { /* ... */ }
async function loadNumbers() { /* ... */ }
async function sendBroadcast() { /* ... */ }
function showBroadcastPanel() { /* ... */ }
function displayCurrentBroadcast() { /* ... */ }
function updateBroadcastPanel() { /* ... */ }
function finishBroadcast() { /* ... */ }

// ========== KONVERSI MODAL ==========
function showConvertToCustomerModal(prospekId) { /* ... */ }
function setupConvertModal() { /* ... */ }

// ========== DOWNLOAD CONTOH ==========
document.getElementById('downloadCustomerExample')?.addEventListener('click', () => { const data = [{ agent_id: 'AG-001', nama: 'Budi Santoso', hp: '6281234567890', apk: 'GNP', deadline: new Date().toISOString().split('T')[0] }]; const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Customer'); XLSX.writeFile(wb, 'contoh_customer.xlsx'); });
document.getElementById('downloadProspekExample')?.addEventListener('click', () => { const data = [{ nama: 'Rina Marlina', hp: '6281234567893', deadline: new Date().toISOString().split('T')[0] }]; const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Prospek'); XLSX.writeFile(wb, 'contoh_prospek.xlsx'); });
