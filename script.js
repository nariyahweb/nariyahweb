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
        'Baru': 'status-baru', 'Sudah Dihubungi': 'status-dihubungi',
        'Tertarik': 'status-tertarik', 'Tidak Tertarik': 'status-tidak'
    };
    const className = statusMap[status] || 'status-baru';
    let displayName = status;
    if (status === 'followup') displayName = 'Follow Up';
    else if (status === 'Sudah Dihubungi') displayName = 'Dihubungi';
    else if (status === 'Tidak Tertarik') displayName = 'Tidak Tertarik';
    return `<span class="status-badge ${className}">${displayName}</span>`;
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
        const today = new Date().toISOString().split('T')[0];
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
    db.collection('customers').add({ agent_id: agentId, nama, hp, apk, tanggal, status: 'baru', user_id: currentUser.uid, created_at: new Date().toISOString(), followup_data: null, pending_data: [] })
        .then(() => { closeModal('customerModal'); document.getElementById('customerId').value = ''; document.getElementById('customerName').value = ''; document.getElementById('customerPhone').value = ''; document.getElementById('customerApk').value = ''; document.getElementById('customerDate').value = ''; showNotif('Customer berhasil ditambahkan'); updateAllBadges(); })
        .catch(e => showNotif('Error: ' + e.message, true));
});

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
    db.collection('prospek').add({ nama, hp, status, deadline, user_id: currentUser.uid, created_at: new Date().toISOString(), dihubungi_data: null })
        .then(() => { closeModal('prospekModal'); document.getElementById('prospekName').value = ''; document.getElementById('prospekPhone').value = ''; document.getElementById('prospekDeadline').value = ''; showNotif('Prospek berhasil ditambahkan'); updateAllBadges(); })
        .catch(e => showNotif('Error: ' + e.message, true));
});

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
        document.getElementById('detailContent').innerHTML = `
            <div class="detail-header"><div class="detail-avatar">${statusIcon}</div><h3>${escapeHtml(d.nama)}</h3><div class="detail-status">${getStatusBadge(d.status)}</div></div>
            <div class="detail-body">
                <div class="detail-info">
                    <div class="detail-info-item"><div class="detail-info-icon">🆔</div><div class="detail-info-content"><label>ID Agent</label><div class="value">${escapeHtml(d.agent_id || '-')}</div></div></div>
                    <div class="detail-info-item"><div class="detail-info-icon">📱</div><div class="detail-info-content"><label>Aplikasi</label><div class="value">${escapeHtml(d.apk || '-')}</div></div></div>
                    <div class="detail-info-item"><div class="detail-info-icon">📱</div><div class="detail-info-content"><label>Nomor WhatsApp</label><div class="value">${escapeHtml(d.hp)}</div></div></div>
                    <div class="detail-info-item"><div class="detail-info-icon">📅</div><div class="detail-info-content"><label>Deadline</label><div class="value">${d.tanggal || '-'}</div></div></div>
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

function openDetailProspek(id) {
    db.collection('prospek').doc(id).get().then(doc => {
        const d = doc.data();
        let statusIcon = d.status === 'Sudah Dihubungi' ? '📞' : d.status === 'Tertarik' ? '⭐' : d.status === 'Tidak Tertarik' ? '❌' : '🆕';
        let actionButtons = '';
        if (d.status === 'Baru') {
            actionButtons = `<button class="btn-primary" onclick="updateProspekStatus('${id}','Sudah Dihubungi')">📞 Lanjut ke Dihubungi</button>`;
        } else if (d.status === 'Sudah Dihubungi') {
            actionButtons = `<button class="btn-primary" onclick="openProspekDihubungiModal('${id}')">📝 Isi Kuesioner</button>
                            <button class="btn-success" onclick="updateProspekStatus('${id}','Tertarik')">⭐ Tertarik</button>
                            <button class="btn-danger" onclick="updateProspekStatus('${id}','Tidak Tertarik')">❌ Tidak Tertarik</button>`;
        } else if (d.status === 'Tertarik') {
            actionButtons = `<button class="btn-primary" onclick="showConvertToCustomerModal('${id}')">🔄 Jadikan Customer</button>`;
        } else {
            actionButtons = `<button class="btn-outline" disabled>❌ Tidak Tertarik</button>`;
        }
        document.getElementById('detailContent').innerHTML = `
            <div class="detail-header"><div class="detail-avatar">${statusIcon}</div><h3>${escapeHtml(d.nama)}</h3><div class="detail-status">${getStatusBadge(d.status)}</div></div>
            <div class="detail-body">
                <div class="detail-info">
                    <div class="detail-info-item"><div class="detail-info-icon">📱</div><div class="detail-info-content"><label>Nomor WhatsApp</label><div class="value">${escapeHtml(d.hp)}</div></div></div>
                    <div class="detail-info-item"><div class="detail-info-icon">📅</div><div class="detail-info-content"><label>Deadline</label><div class="value">${d.deadline || '-'}</div></div></div>
                    ${d.dihubungi_data ? `<div class="detail-info-item"><div class="detail-info-icon">📋</div><div class="detail-info-content"><label>Kuesioner</label><div class="value">Aplikasi: ${d.dihubungi_data.aplikasi}<br>Domisili: ${d.dihubungi_data.domisili}<br>Transaksi: ${d.dihubungi_data.transaksi}<br>Deposit: ${d.dihubungi_data.deposit}<br>Tertarik: ${d.dihubungi_data.tertarik}<br>Penawaran: ${d.dihubungi_data.penawaran}</div></div></div>` : ''}
                    <div class="detail-info-item"><div class="detail-info-icon">📌</div><div class="detail-info-content"><label>Status</label><div class="value">${d.status}</div></div></div>
                </div>
                <div class="detail-actions"><button class="btn-success" onclick="openWA('${d.hp}')">💬 WhatsApp</button>${actionButtons}</div>
            </div>
            <div class="detail-footer"><button class="btn-outline" onclick="closeModal('detailModal')">❌ Tutup</button><button class="btn-danger" onclick="deleteProspek('${id}')">🗑️ Hapus</button></div>
        `;
        showModal('detailModal');
    });
}

window.updateCustomerStatus = function(id, newStatus) {
    if (newStatus === 'followup') {
        db.collection('customers').doc(id).update({ status: 'followup' });
        closeModal('detailModal');
        showNotif('Status berhasil diupdate ke Follow Up');
        loadAllData();
    }
};

window.updateProspekStatus = async function(id, newStatus) {
    if (newStatus === 'Tertarik' || newStatus === 'Tidak Tertarik') {
        const doc = await db.collection('prospek').doc(id).get();
        const data = doc.data();
        if (!data.dihubungi_data) {
            showNotif('⚠️ Harap isi kuesioner terlebih dahulu!', true);
            openProspekDihubungiModal(id);
            return;
        }
        if (newStatus === 'Tidak Tertarik') {
            await saveToTidakTertarikDB(id, data);
            closeModal('detailModal');
            loadAllData();
            return;
        }
        await db.collection('prospek').doc(id).update({ status: newStatus });
        closeModal('detailModal');
        showNotif(`Status berhasil diupdate ke ${newStatus}`);
        loadAllData();
    } else {
        await db.collection('prospek').doc(id).update({ status: newStatus });
        closeModal('detailModal');
        showNotif(`Status berhasil diupdate ke ${newStatus}`);
        loadAllData();
    }
};

window.deleteCustomer = function(id) { if (confirm('Yakin hapus customer ini?')) { db.collection('customers').doc(id).delete(); closeModal('detailModal'); showNotif('Data dihapus'); updateAllBadges(); } };
window.deleteProspek = function(id) { if (confirm('Yakin hapus prospek ini?')) { db.collection('prospek').doc(id).delete(); closeModal('detailModal'); showNotif('Data dihapus'); updateAllBadges(); } };

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
        await db.collection('customers').doc(id).update({ followup_data: { terkirim: true, dibalas: true, timestamp: new Date().toISOString() }, status: 'pending' });
        closeModal('followupConfirmModal');
        showNotif('✅ Customer dipindahkan ke Pending');
        loadAllData();
        closeModal('detailModal');
    };
    noBtn.onclick = async () => {
        const doc = await db.collection('customers').doc(id).get();
        if (doc.exists) {
            await db.collection('nomor_salah').add({ ...doc.data(), alasan: 'Nomor tidak bisa dihubungi / tidak aktif', deleted_at: new Date().toISOString(), user_id: currentUser.uid });
            await db.collection('customers').doc(id).delete();
            showNotif('📵 Data dipindahkan ke Database Nomor Salah');
            closeModal('followupConfirmModal');
            closeModal('detailModal');
            loadAllData();
        }
    };
}

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
    pendingItems.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'pending-item';
        div.innerHTML = `
            <input type="text" value="${escapeHtml(item.text)}" placeholder="Balasan/respon..." style="flex:1; padding: 6px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <input type="checkbox" ${item.checked ? 'checked' : ''} style="width: 20px; height: 20px;">
            <button class="delete-pending-item" data-idx="${idx}" style="background: none; border: none; cursor: pointer;">🗑️</button>
        `;
        const textInput = div.querySelector('input[type="text"]');
        const checkBox = div.querySelector('input[type="checkbox"]');
        const delBtn = div.querySelector('.delete-pending-item');
        textInput.addEventListener('change', (e) => { pendingItems[idx].text = e.target.value; updatePendingCloseButton(); });
        checkBox.addEventListener('change', (e) => { pendingItems[idx].checked = e.target.checked; updatePendingCloseButton(); });
        delBtn.addEventListener('click', () => { pendingItems.splice(idx, 1); renderPendingModal(); updatePendingCloseButton(); });
        container.appendChild(div);
    });
    const addBtn = document.getElementById('addPendingItemBtn');
    if (addBtn) addBtn.onclick = () => { pendingItems.push({ text: '', checked: false }); renderPendingModal(); updatePendingCloseButton(); };
    updatePendingCloseButton();
}

function updatePendingCloseButton() {
    const closeBtn = document.getElementById('pendingCloseBtn');
    if (!closeBtn) return;
    const allChecked = pendingItems.length > 0 && pendingItems.every(item => item.checked === true && item.text.trim() !== '');
    closeBtn.disabled = !allChecked;
    if (allChecked) {
        closeBtn.onclick = async () => {
            await db.collection('customers').doc(currentPendingId).update({ pending_data: pendingItems });
            await window.confirmClosing(currentPendingId);
            closeModal('pendingModal');
        };
    }
}

function openProspekDihubungiModal(id) {
    currentProspekId = id;
    const fields = ['prospek_aplikasi', 'prospek_domisili', 'prospek_transaksi', 'prospek_deposit', 'prospek_tertarik', 'prospek_penawaran'];
    fields.forEach(f => document.getElementById(f).value = '');
    db.collection('prospek').doc(id).get().then(doc => {
        const data = doc.data();
        if (data.dihubungi_data) {
            document.getElementById('prospek_aplikasi').value = data.dihubungi_data.aplikasi || '';
            document.getElementById('prospek_domisili').value = data.dihubungi_data.domisili || '';
            document.getElementById('prospek_transaksi').value = data.dihubungi_data.transaksi || '';
            document.getElementById('prospek_deposit').value = data.dihubungi_data.deposit || '';
            document.getElementById('prospek_tertarik').value = data.dihubungi_data.tertarik || '';
            document.getElementById('prospek_penawaran').value = data.dihubungi_data.penawaran || '';
        }
    });
    document.getElementById('prospekDihubungiModal').style.display = 'flex';
}

document.getElementById('prospekDihubungiSave')?.addEventListener('click', async () => {
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
    const dihubungi_data = { aplikasi, domisili, transaksi, deposit, tertarik, penawaran };
    await db.collection('prospek').doc(currentProspekId).update({ dihubungi_data });
    showNotif('✅ Data berhasil disimpan');
    closeModal('prospekDihubungiModal');
});

async function saveToClosingDB(id, data) { 
    try { 
        await db.collection('db_closing').add({ 
            nama: data.nama, hp: data.hp, tanggal: data.tanggal || new Date().toISOString().split('T')[0], 
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
            dihubungi_data: data.dihubungi_data || null
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
    if (confirm("⚠️ PERHATIAN!\n\nAnda akan memindahkan data ini ke DATABASE CLOSING.\n\n✅ OK = Pindahkan ke DB Closing\n❌ CANCEL = Tetap di kolom Closing")) { 
        const doc = await db.collection('customers').doc(id).get(); 
        if (doc.exists) await saveToClosingDB(id, doc.data()); 
    } else { 
        await db.collection('customers').doc(id).update({ status: 'closing' }); 
        showNotif('📌 Data tetap di kolom Closing'); 
    } 
    loadAllData();
    updateAllBadges();
};
window.confirmTidakTertarik = async function(id) { 
    if (confirm("⚠️ PERHATIAN!\n\nAnda akan memindahkan data ini ke DATABASE TIDAK TERTARIK.\n\n✅ OK = Pindahkan ke DB Tidak Tertarik\n❌ CANCEL = Tetap di kolom Tidak Tertarik")) { 
        const doc = await db.collection('prospek').doc(id).get(); 
        if (doc.exists) await saveToTidakTertarikDB(id, doc.data()); 
    } else { 
        await db.collection('prospek').doc(id).update({ status: 'Tidak Tertarik' }); 
        showNotif('📌 Data tetap di kolom Tidak Tertarik'); 
    } 
    loadAllData();
    updateAllBadges();
};

window.saveToClosingNow = async function(id) {
    if (confirm('⚠️ Pindahkan customer ini ke Database Closing?\n\nData akan dihapus dari Followup Agen.\n\n✅ OK = Pindahkan\n❌ CANCEL = Batalkan')) {
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
};

window.showConvertToCustomerModal = async function(prospekId) {
    const doc = await db.collection('prospek').doc(prospekId).get();
    const data = doc.data();
    if (!data.dihubungi_data) {
        showNotif('⚠️ Data prospek belum lengkap, isi kuesioner dulu!', true);
        openProspekDihubungiModal(prospekId);
        return;
    }
    await db.collection('db_commitment').add({
        nama: data.nama,
        hp: data.hp,
        dihubungi_data: data.dihubungi_data,
        committed_at: new Date().toISOString(),
        user_id: currentUser.uid,
        original_prospek_id: prospekId
    });
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    const followupDate = nextMonth.toISOString().split('T')[0];
    await db.collection('customers').add({
        nama: data.nama,
        hp: data.hp,
        tanggal: followupDate,
        status: 'baru',
        user_id: currentUser.uid,
        created_at: new Date().toISOString(),
        converted_from: 'prospek_commitment',
        apk: '', agent_id: '', followup_data: null, pending_data: []
    });
    await db.collection('prospek').doc(prospekId).delete();
    showNotif('✅ Prospek telah dijadikan customer dan disimpan ke DB Commitment');
    closeModal('detailModal');
    closeModal('convertModal');
    loadAllData();
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
            if (!confirm(`⚠️ KONFIRMASI PEMINDAHAN\n\nID Agent: ${agentId}\nTanggal Followup: ${followupDate}\n\n✅ OK = Lanjutkan`)) return;
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
        };
    }
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.onclick = function(e) { e.preventDefault(); e.stopPropagation(); modal.style.display = 'none'; document.body.classList.remove('modal-open'); };
    }
    modal.onclick = function(e) { if (e.target === modal) { modal.style.display = 'none'; document.body.classList.remove('modal-open'); } };
}

function renderFullFollowupKanban() {
    const today = new Date().toISOString().split('T')[0];
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
    const today = new Date().toISOString().split('T')[0];
    const lists = { prospekBaru: [], prospekDihubungi: [], prospekTertarik: [], prospekTidak: [] };
    prospekData.forEach(item => {
        const status = item.status || 'Baru';
        if (status === 'Baru') lists.prospekBaru.push(item);
        else if (status === 'Sudah Dihubungi') lists.prospekDihubungi.push(item);
        else if (status === 'Tertarik') lists.prospekTertarik.push(item);
        else lists.prospekTidak.push(item);
    });
    lists.prospekBaru.sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'));
    lists.prospekDihubungi.sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'));
    lists.prospekTertarik.sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'));
    lists.prospekTidak.sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'));
    document.getElementById('fullCountProspekBaru').innerText = lists.prospekBaru.length;
    document.getElementById('fullCountDihubungi').innerText = lists.prospekDihubungi.length;
    document.getElementById('fullCountTertarik').innerText = lists.prospekTertarik.length;
    document.getElementById('fullCountTidakTertarik').innerText = lists.prospekTidak.length;
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
            return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="Sudah Dihubungi"><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.deadline || '-'}</div></div>`;
        }).join('');
        dihubungiContainer.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailProspek(card.dataset.id); }); });
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
    const tidakContainer = document.getElementById('fullProspekTidakList');
    if (tidakContainer) {
        tidakContainer.innerHTML = lists.prospekTidak.map(item => {
            const isOverdue = item.deadline && item.deadline < today;
            const isToday = item.deadline === today;
            let deadlineClass = '';
            if (isOverdue) deadlineClass = 'deadline-overdue';
            else if (isToday) deadlineClass = 'deadline-today';
            return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="Tidak Tertarik"><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.deadline || '-'}</div></div>`;
        }).join('');
        tidakContainer.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailProspek(card.dataset.id); }); });
    }
}

document.getElementById('addCustomerFullBtn')?.addEventListener('click', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('customerDate').value = today;
    document.getElementById('customerModal').style.display = 'flex';
});
document.getElementById('addProspekFullBtn')?.addEventListener('click', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('prospekDeadline').value = today;
    document.getElementById('prospekModal').style.display = 'flex';
});

function initDragAndDrop() {
    console.log("Drag and drop disabled");
}

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
        snap.forEach(doc => { const d = doc.data(); items.push({ id: doc.id, nama: d.nama, hp: d.hp, committed_at: d.committed_at, dihubungi_data: d.dihubungi_data, checked: selectedCommitmentIds.get(doc.id) || false }); });
        items.sort((a,b) => new Date(b.committed_at) - new Date(a.committed_at));
        const html = items.map(item => `<div class="db-item"><input type="checkbox" class="db-item-checkbox" data-id="${item.id}" ${item.checked ? 'checked' : ''}><div class="db-item-info"><h4>${escapeHtml(item.nama)}</h4><p>${item.hp}</p><small>Komitmen: ${new Date(item.committed_at).toLocaleDateString('id-ID')}<br>Aplikasi: ${item.dihubungi_data?.aplikasi || '-'}</small></div><div class="db-item-actions"><button class="db-item-wa" onclick="openWA('${item.hp}')">💬 WA</button><button class="db-item-delete" onclick="deleteDBItem('db_commitment', '${item.id}')">🗑️ Hapus</button></div></div>`).join('');
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

function updateChartCustomer(total, closing, pending, followup) {
    const ctx = document.getElementById('chartCustomer');
    if (!ctx) return;
    if (chartCustomer) chartCustomer.destroy();
    const baru = total - (closing + pending + followup);
    chartCustomer = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: ['Closing', 'Pending', 'Follow Up', 'Baru'], datasets: [{ data: [closing, pending, followup, baru], backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'], borderWidth: 0, hoverOffset: 15, cutout: '65%' }] },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'right', labels: { usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11 }, generateLabels: function(chart) { const data = chart.data, dataset = data.datasets[0], total = dataset.data.reduce((a,b)=>a+b,0); return data.labels.map((label,i) => ({ text: `${label}: ${dataset.data[i]} (${total ? ((dataset.data[i]/total)*100).toFixed(1) : 0}%)`, fillStyle: dataset.backgroundColor[i], strokeStyle: dataset.backgroundColor[i], lineWidth: 0, hidden: false, index: i })); } } }, tooltip: { callbacks: { label: function(context) { const label = context.label || '', value = context.raw || 0, total = context.dataset.data.reduce((a,b)=>a+b,0); return `${label}: ${value} (${total ? ((value/total)*100).toFixed(1) : 0}%)`; } } } }
    });
}

function updateChartProspek(baru, dihubungi, tertarik, tidak) {
    const ctx = document.getElementById('chartProspek');
    if (!ctx) return;
    if (chartProspek) chartProspek.destroy();
    let dataArr = [baru, dihubungi, tertarik, tidak];
    if (dataArr.every(v => v === 0)) dataArr = [1, 0, 0, 0];
    chartProspek = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: ['Baru', 'Dihubungi', 'Tertarik', 'Tidak Tertarik'], datasets: [{ data: dataArr, backgroundColor: ['#8b5cf6', '#3b82f6', '#10b981', '#ef4444'], borderWidth: 0, hoverOffset: 15, cutout: '65%' }] },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'right', labels: { usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11 }, generateLabels: function(chart) { const data = chart.data, dataset = data.datasets[0], total = dataset.data.reduce((a,b)=>a+b,0); return data.labels.map((label,i) => ({ text: `${label}: ${dataset.data[i]} (${total ? ((dataset.data[i]/total)*100).toFixed(1) : 0}%)`, fillStyle: dataset.backgroundColor[i], strokeStyle: dataset.backgroundColor[i], lineWidth: 0, hidden: false, index: i })); } } }, tooltip: { callbacks: { label: function(context) { const label = context.label || '', value = context.raw || 0, total = context.dataset.data.reduce((a,b)=>a+b,0); return `${label}: ${value} (${total ? ((value/total)*100).toFixed(1) : 0}%)`; } } } }
    });
}

function loadAllData() {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
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
        let baru = 0, dihubungi = 0, tertarik = 0, tidak = 0;
        const lists = { prospekBaru: [], prospekDihubungi: [], prospekTertarik: [], prospekTidak: [] };
        prospekData = [];
        snap.forEach(doc => {
            const d = doc.data();
            prospekData.push({ id: doc.id, ...d });
            const st = d.status || 'Baru';
            const deadline = d.deadline || '';
            if (st === 'Baru') { baru++; lists.prospekBaru.push({ id: doc.id, nama: d.nama, hp: d.hp, status: st, deadline }); }
            else if (st === 'Sudah Dihubungi') { dihubungi++; lists.prospekDihubungi.push({ id: doc.id, nama: d.nama, hp: d.hp, status: st, deadline }); }
            else if (st === 'Tertarik') { tertarik++; lists.prospekTertarik.push({ id: doc.id, nama: d.nama, hp: d.hp, status: st, deadline }); }
            else { tidak++; lists.prospekTidak.push({ id: doc.id, nama: d.nama, hp: d.hp, status: st, deadline }); }
        });
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
                    return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="${item.status}" data-deadline="${item.deadline || ''}"><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.deadline || '-'}</div></div>`;
                }).join('');
                container.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailProspek(card.dataset.id); }); });
            }
        }
        updateChartProspek(baru, dihubungi, tertarik, tidak);
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

const deadlineNotifBtn = document.getElementById('deadlineNotifBtn');
if (deadlineNotifBtn) {
    deadlineNotifBtn.addEventListener('click', async () => {
        const today = new Date().toISOString().split('T')[0];
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
                await db.collection('customers').add({ agent_id: agentId, nama, hp, apk, tanggal: deadline, status: 'baru', user_id: currentUser.uid, created_at: new Date().toISOString(), followup_data: null, pending_data: [] });
            } else {
                if (!nama || !hp) { failed++; continue; }
                if (!deadline) deadline = new Date().toISOString().split('T')[0];
                hp = hp.toString(); if (!hp.startsWith('+62')) hp = '+' + hp.replace(/^0/, '62');
                await db.collection('prospek').add({ nama, hp, status: 'Baru', deadline, user_id: currentUser.uid, created_at: new Date().toISOString(), dihubungi_data: null });
            }
            success++;
        }
        alert(`Selesai!\nBerhasil: ${success}\nGagal: ${failed}`);
        excelFileInput.value = ''; document.getElementById('fileInfo').innerHTML = '';
        importBtn.textContent = '🚀 Import Data Sekarang';
        importBtn.disabled = false;
        updateAllBadges();
    };
    reader.readAsArrayBuffer(file);
});

document.getElementById('downloadCustomerExample')?.addEventListener('click', () => {
    const data = [{ agent_id: 'AG-001', nama: 'Budi Santoso', hp: '6281234567890', apk: 'GNP', deadline: new Date().toISOString().split('T')[0] }];
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Customer'); XLSX.writeFile(wb, 'contoh_customer.xlsx');
});
document.getElementById('downloadProspekExample')?.addEventListener('click', () => {
    const data = [{ nama: 'Rina Marlina', hp: '6281234567893', deadline: new Date().toISOString().split('T')[0] }];
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Prospek'); XLSX.writeFile(wb, 'contoh_prospek.xlsx');
});
