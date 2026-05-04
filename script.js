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

// ========== HELPER FUNCTIONS ==========
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
    return text.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== SIDEBAR FUNCTIONS ==========
function isMobile() {
    return window.innerWidth <= 768;
}

document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const hoverZone = document.getElementById('hoverZone');
    const toggleBtn = document.getElementById('toggleSidebarBtn');
    
    if (hoverZone) {
        hoverZone.addEventListener('mouseenter', function() {
            if (!isMobile() && sidebar) {
                clearTimeout(sidebarTimeout);
                sidebar.classList.add('active');
            }
        });
    }
    
    if (sidebar) {
        sidebar.addEventListener('mouseleave', function() {
            if (!isMobile()) {
                sidebarTimeout = setTimeout(function() {
                    sidebar.classList.remove('active');
                }, 200);
            }
        });
        sidebar.addEventListener('mouseenter', function() { clearTimeout(sidebarTimeout); });
    }
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (sidebar) sidebar.classList.toggle('active');
        });
    }
    
    document.addEventListener('click', function(e) {
        if (isMobile() && sidebar && toggleBtn) {
            if (!sidebar.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
    
    window.addEventListener('resize', function() {
        if (!isMobile() && sidebar) sidebar.classList.remove('active');
        else if (isMobile() && sidebar) sidebar.classList.remove('active');
    });
});

// ========== TOGGLE PASSWORD ==========
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const loginPassword = document.getElementById('loginPassword');
if (togglePasswordBtn && loginPassword) {
    togglePasswordBtn.addEventListener('click', function() {
        if (loginPassword.type === 'password') {
            loginPassword.type = 'text';
            this.textContent = '🙈';
        } else {
            loginPassword.type = 'password';
            this.textContent = '👁️';
        }
    });
}

// ========== LOGIN ==========
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
    loginBtn.addEventListener('click', function() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');
        
        if (!email || !password) {
            errorDiv.textContent = 'Email dan password harus diisi!';
            return;
        }
        
        errorDiv.textContent = '';
        this.textContent = 'Loading...';
        this.disabled = true;
        
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                this.textContent = 'Masuk';
                this.disabled = false;
            })
            .catch(err => {
                errorDiv.textContent = 'Login gagal: ' + err.message;
                this.textContent = 'Masuk';
                this.disabled = false;
            });
    });
}

// ========== LOGOUT ==========
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => auth.signOut());
}

// ========== AUTH STATE ==========
auth.onAuthStateChanged(user => {
    const loginPage = document.getElementById('loginPage');
    const app = document.getElementById('app');
    
    if (user) {
        currentUser = user;
        loginPage.style.display = 'none';
        app.style.display = 'block';
        
        db.collection('users').doc(user.uid).get().then(doc => {
            let nama = 'CS Agent';
            let foto = 'https://i.pravatar.cc/40';
            
            if (doc.exists && doc.data().nama) nama = doc.data().nama;
            if (doc.exists && doc.data().foto) foto = doc.data().foto;
            
            const topUserName = document.getElementById('topUserName');
            const profileName = document.getElementById('profileName');
            const topProfileImg = document.getElementById('profileImg');
            const previewFoto = document.getElementById('previewFoto');
            
            if (topUserName) topUserName.innerText = nama;
            if (profileName) profileName.value = nama;
            if (topProfileImg) topProfileImg.src = foto;
            if (previewFoto) previewFoto.src = foto;
        });
        
        const profileEmail = document.getElementById('profileEmail');
        if (profileEmail) profileEmail.value = user.email;
        loadAllData();
        loadReminders();
        loadPesan();
        updateNotifBadge();
    } else {
        loginPage.style.display = 'flex';
        app.style.display = 'none';
        currentUser = null;
    }
});

// ========== PAGE NAVIGATION ==========
document.querySelectorAll('.menu-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;
        const pages = ['dashboardPage', 'importPage', 'dbClosingPage', 'dbTidakPage', 'reminderPage', 'pesanPage', 'broadcastPage'];
        pages.forEach(p => {
            const el = document.getElementById(p);
            if (el) el.style.display = 'none';
        });
        
        if (page === 'dashboard') {
            document.getElementById('dashboardPage').style.display = 'block';
        } else if (page === 'import') {
            document.getElementById('importPage').style.display = 'block';
        } else if (page === 'dbClosing') {
            document.getElementById('dbClosingPage').style.display = 'block';
            loadDBClosing();
        } else if (page === 'dbTidak') {
            document.getElementById('dbTidakPage').style.display = 'block';
            loadDBTidak();
        } else if (page === 'reminder') {
            document.getElementById('reminderPage').style.display = 'block';
            loadReminders();
        } else if (page === 'pesan') {
            document.getElementById('pesanPage').style.display = 'block';
            loadPesan();
            loadUsersForSelect();
        } else if (page === 'broadcast') {
            document.getElementById('broadcastPage').style.display = 'block';
            initBroadcast();
        }
        
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        item.classList.add('active');
        
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar')?.classList.remove('active');
        }
    });
});

// ========== CLOSE MODALS ==========
document.querySelectorAll('.closeModalBtn').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal.id);
    });
});

// ========== PROFILE ==========
const profileImg = document.getElementById('profileImg');
if (profileImg) {
    profileImg.addEventListener('click', () => {
        document.getElementById('profileModal').style.display = 'flex';
        db.collection('users').doc(currentUser.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                document.getElementById('profileName').value = data.nama || '';
                document.getElementById('profilePhone').value = data.hp ? data.hp.replace('+62', '') : '';
                if (data.foto) document.getElementById('previewFoto').src = data.foto;
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
if (previewFoto) {
    previewFoto.addEventListener('click', (e) => {
        e.stopPropagation();
        showPhotoPreview(document.getElementById('previewFoto').src);
    });
}

const cameraIcon = document.getElementById('cameraIcon');
if (cameraIcon) {
    cameraIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('profileFoto').click();
    });
}

const profileFotoInput = document.getElementById('profileFoto');
if (profileFotoInput) {
    profileFotoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            if (file.size > 1024 * 1024) {
                showNotif('Ukuran foto maksimal 1MB', true);
                return;
            }
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
        
        if (!nama) {
            showNotif('Nama wajib diisi', true);
            return;
        }
        
        if (hp) {
            hp = hp.replace(/\D/g, '');
            if (hp.startsWith('0')) hp = hp.substring(1);
            hp = '+62' + hp;
        } else {
            hp = '+62';
        }
        
        try {
            await db.collection('users').doc(currentUser.uid).set({
                nama: nama, hp: hp, foto: foto, email: currentUser.email, updated_at: new Date().toISOString()
            }, { merge: true });
            
            document.getElementById('topUserName').innerText = nama;
            document.getElementById('profileImg').src = foto;
            closeModal('profileModal');
            showNotif('Profile tersimpan');
        } catch (e) {
            showNotif('Gagal: ' + e.message, true);
        }
    });
}

function formatPhoneInput(input) {
    if (input) {
        input.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.startsWith('0')) value = value.substring(1);
            this.value = value;
        });
    }
}

formatPhoneInput(document.getElementById('customerPhone'));
formatPhoneInput(document.getElementById('prospekPhone'));
formatPhoneInput(document.getElementById('profilePhone'));

document.getElementById('previewPhotoModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('previewPhotoModal')) closeModal('previewPhotoModal');
});

// ========== CUSTOMER CRUD ==========
document.getElementById('addCustomerBtn')?.addEventListener('click', () => {
    document.getElementById('customerModal').style.display = 'flex';
});

document.getElementById('saveCustomerBtn')?.addEventListener('click', () => {
    const nama = document.getElementById('customerName').value;
    let hp = document.getElementById('customerPhone').value;
    const tanggal = document.getElementById('customerDate').value;
    
    if (!nama || !hp) {
        showNotif('Lengkapi data!', true);
        return;
    }
    
    hp = '+62' + hp.replace(/\D/g, '');
    
    db.collection('customers').add({
        nama: nama, hp: hp, tanggal: tanggal || new Date().toISOString().split('T')[0],
        status: 'baru', user_id: currentUser.uid, created_at: new Date().toISOString()
    }).then(() => {
        closeModal('customerModal');
        document.getElementById('customerName').value = '';
        document.getElementById('customerPhone').value = '';
        document.getElementById('customerDate').value = '';
        showNotif('Customer berhasil ditambahkan');
    }).catch(e => showNotif('Error: ' + e.message, true));
});

// ========== PROSPEK CRUD ==========
document.getElementById('addProspekBtn')?.addEventListener('click', () => {
    document.getElementById('prospekModal').style.display = 'flex';
});

document.getElementById('saveProspekBtn')?.addEventListener('click', () => {
    const nama = document.getElementById('prospekName').value;
    let hp = document.getElementById('prospekPhone').value;
    const status = document.getElementById('prospekStatusSelect').value;
    
    if (!nama || !hp) {
        showNotif('Lengkapi data!', true);
        return;
    }
    
    hp = '+62' + hp.replace(/\D/g, '');
    
    db.collection('prospek').add({
        nama: nama, hp: hp, status: status, user_id: currentUser.uid, created_at: new Date().toISOString()
    }).then(() => {
        closeModal('prospekModal');
        document.getElementById('prospekName').value = '';
        document.getElementById('prospekPhone').value = '';
        showNotif('Prospek berhasil ditambahkan');
    }).catch(e => showNotif('Error: ' + e.message, true));
});

// ========== DETAIL MODAL ==========
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
    }
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

function openDetailCustomer(id) {
    db.collection('customers').doc(id).get().then(doc => {
        const d = doc.data();
        const statusIcon = d.status === 'closing' ? '🎉' : d.status === 'pending' ? '⏳' : d.status === 'followup' ? '📞' : '🆕';
        
        document.getElementById('detailContent').innerHTML = `
            <div class="detail-header">
                <div class="detail-avatar">${statusIcon}</div>
                <h3>${escapeHtml(d.nama)}</h3>
                <div class="detail-status">${getStatusBadge(d.status)}</div>
            </div>
            <div class="detail-body">
                <div class="detail-info">
                    <div class="detail-info-item">
                        <div class="detail-info-icon">📱</div>
                        <div class="detail-info-content">
                            <label>Nomor WhatsApp</label>
                            <div class="value">${escapeHtml(d.hp)}</div>
                        </div>
                    </div>
                    <div class="detail-info-item">
                        <div class="detail-info-icon">📅</div>
                        <div class="detail-info-content">
                            <label>Tanggal Input</label>
                            <div class="value">${d.tanggal || '-'}</div>
                        </div>
                    </div>
                    <div class="detail-info-item">
                        <div class="detail-info-icon">📌</div>
                        <div class="detail-info-content">
                            <label>Status Saat Ini</label>
                            <div class="value">${d.status === 'followup' ? 'Follow Up' : d.status}</div>
                        </div>
                    </div>
                </div>
                <div class="detail-actions">
                    <button class="btn-success" onclick="openWA('${d.hp}')">💬 WhatsApp</button>
                    <button class="btn-primary" onclick="updateStatus('${id}','followup')">📞 Follow Up</button>
                    <button class="btn-warning" onclick="updateStatus('${id}','pending')">⏳ Pending</button>
                    <button class="btn-success" onclick="confirmClosing('${id}')">🎉 Closing</button>
                </div>
            </div>
            <div class="detail-footer">
                <button class="btn-outline" onclick="closeModal('detailModal')">❌ Tutup</button>
                <button class="btn-danger" onclick="deleteCustomer('${id}')">🗑️ Hapus</button>
            </div>
        `;
        showModal('detailModal');
    });
}

function openDetailProspek(id) {
    db.collection('prospek').doc(id).get().then(doc => {
        const d = doc.data();
        let statusIcon = '🆕';
        if (d.status === 'Sudah Dihubungi') statusIcon = '📞';
        else if (d.status === 'Tertarik') statusIcon = '⭐';
        else if (d.status === 'Tidak Tertarik') statusIcon = '❌';
        
        document.getElementById('detailContent').innerHTML = `
            <div class="detail-header">
                <div class="detail-avatar">${statusIcon}</div>
                <h3>${escapeHtml(d.nama)}</h3>
                <div class="detail-status">${getStatusBadge(d.status)}</div>
            </div>
            <div class="detail-body">
                <div class="detail-info">
                    <div class="detail-info-item">
                        <div class="detail-info-icon">📱</div>
                        <div class="detail-info-content">
                            <label>Nomor WhatsApp</label>
                            <div class="value">${escapeHtml(d.hp)}</div>
                        </div>
                    </div>
                    <div class="detail-info-item">
                        <div class="detail-info-icon">📅</div>
                        <div class="detail-info-content">
                            <label>Tanggal Input</label>
                            <div class="value">${d.created_at ? new Date(d.created_at).toLocaleDateString('id-ID') : '-'}</div>
                        </div>
                    </div>
                    <div class="detail-info-item">
                        <div class="detail-info-icon">📌</div>
                        <div class="detail-info-content">
                            <label>Status Saat Ini</label>
                            <div class="value">${d.status}</div>
                        </div>
                    </div>
                </div>
                <div class="detail-actions">
                    <button class="btn-success" onclick="openWA('${d.hp}')">💬 WhatsApp</button>
                    <button class="btn-primary" onclick="updateProspekStatus('${id}','Sudah Dihubungi')">📞 Dihubungi</button>
                    <button class="btn-success" onclick="updateProspekStatus('${id}','Tertarik')">⭐ Tertarik</button>
                    <button class="btn-danger" onclick="confirmTidakTertarik('${id}')">❌ Tidak Tertarik</button>
                </div>
                ${d.status === 'Tertarik' ? `<div style="margin-top:16px;"><button class="btn-primary" style="width:100%;" onclick="convertToCustomer('${id}')">🔄 Jadikan Customer</button></div>` : ''}
            </div>
            <div class="detail-footer">
                <button class="btn-outline" onclick="closeModal('detailModal')">❌ Tutup</button>
                <button class="btn-danger" onclick="deleteProspek('${id}')">🗑️ Hapus</button>
            </div>
        `;
        showModal('detailModal');
    });
}

window.updateStatus = function(id, status) {
    db.collection('customers').doc(id).update({ status: status });
    closeModal('detailModal');
    showNotif('Status berhasil diupdate');
};

window.updateProspekStatus = function(id, status) {
    db.collection('prospek').doc(id).update({ status: status });
    closeModal('detailModal');
    showNotif('Status berhasil diupdate');
};

window.deleteCustomer = function(id) {
    closeModal('detailModal');
    if (confirm('Yakin hapus customer ini?')) {
        db.collection('customers').doc(id).delete();
        showNotif('Data dihapus');
    }
};

window.deleteProspek = function(id) {
    closeModal('detailModal');
    if (confirm('Yakin hapus prospek ini?')) {
        db.collection('prospek').doc(id).delete();
        showNotif('Data dihapus');
    }
};

window.convertToCustomer = function(id) {
    closeModal('detailModal');
    if (confirm('Yakin jadikan customer?')) {
        db.collection('prospek').doc(id).get().then(doc => {
            const d = doc.data();
            db.collection('customers').add({
                nama: d.nama, hp: d.hp, tanggal: new Date().toISOString().split('T')[0],
                status: 'baru', user_id: currentUser.uid, created_at: new Date().toISOString()
            });
            db.collection('prospek').doc(id).delete();
            showNotif('Berhasil jadi customer!');
        });
    }
};

// ========== CLOSING & TIDAK TERTARIK ==========
async function saveToClosingDB(id, data) {
    try {
        await db.collection('db_closing').add({
            nama: data.nama, hp: data.hp, tanggal: data.tanggal || new Date().toISOString().split('T')[0],
            closing_date: new Date().toISOString(), user_id: currentUser.uid
        });
        await db.collection('customers').doc(id).delete();
        showNotif('✅ Data berhasil masuk Database Closing!');
        return true;
    } catch (error) {
        showNotif('❌ Gagal: ' + error.message, true);
        return false;
    }
}

async function saveToTidakTertarikDB(id, data) {
    try {
        await db.collection('db_tidak_tertarik').add({
            nama: data.nama, hp: data.hp, tanggal: new Date().toISOString(), user_id: currentUser.uid
        });
        await db.collection('prospek').doc(id).delete();
        showNotif('✅ Data berhasil masuk Database Tidak Tertarik!');
        return true;
    } catch (error) {
        showNotif('❌ Gagal: ' + error.message, true);
        return false;
    }
}

window.confirmClosing = async function(id) {
    const result = confirm("⚠️ PERHATIAN!\n\nAnda akan memindahkan data ini ke DATABASE CLOSING.\n\n✅ OK = Pindahkan ke DB Closing\n❌ CANCEL = Tetap di kolom Closing\n\nApakah Anda yakin?");
    if (result) {
        const doc = await db.collection('customers').doc(id).get();
        if (doc.exists) await saveToClosingDB(id, doc.data());
    } else {
        await db.collection('customers').doc(id).update({ status: 'closing' });
        showNotif('📌 Data tetap di kolom Closing');
    }
};

window.confirmTidakTertarik = async function(id) {
    const result = confirm("⚠️ PERHATIAN!\n\nAnda akan memindahkan data ini ke DATABASE TIDAK TERTARIK.\n\n✅ OK = Pindahkan ke DB Tidak Tertarik\n❌ CANCEL = Tetap di kolom Tidak Tertarik\n\nApakah Anda yakin?");
    if (result) {
        const doc = await db.collection('prospek').doc(id).get();
        if (doc.exists) await saveToTidakTertarikDB(id, doc.data());
    } else {
        await db.collection('prospek').doc(id).update({ status: 'Tidak Tertarik' });
        showNotif('📌 Data tetap di kolom Tidak Tertarik');
    }
};

// ========== IMPORT EXCEL ==========
const dropZone = document.getElementById('dropZone');
const excelFileInput = document.getElementById('excelFile');
if (dropZone) {
    dropZone.addEventListener('click', () => excelFileInput?.click());
}
if (excelFileInput) {
    excelFileInput.addEventListener('change', function(e) {
        if (e.target.files[0]) {
            const fileInfo = document.getElementById('fileInfo');
            if (fileInfo) fileInfo.innerHTML = '📄 ' + e.target.files[0].name;
        }
    });
}

document.querySelectorAll('.radio-option').forEach(opt => {
    opt.addEventListener('click', function() {
        importType = this.dataset.import;
        document.querySelectorAll('.radio-option').forEach(o => o.classList.remove('active'));
        this.classList.add('active');
    });
});

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
            let nama = row.nama || row.Nama;
            let hp = row.hp || row.HP;
            if (!nama || !hp) { failed++; continue; }
            hp = hp.toString();
            if (!hp.startsWith('+62')) hp = '+' + hp.replace(/^0/, '62');
            if (importType === 'prospek') {
                await db.collection('prospek').add({ nama, hp, status: 'Baru', user_id: currentUser.uid, created_at: new Date().toISOString() });
            } else {
                await db.collection('customers').add({ nama, hp, tanggal: new Date().toISOString().split('T')[0], status: 'baru', user_id: currentUser.uid, created_at: new Date().toISOString() });
            }
            success++;
        }
        alert(`Selesai!\nBerhasil: ${success}\nGagal: ${failed}`);
        excelFileInput.value = '';
        document.getElementById('fileInfo').innerHTML = '';
        importBtn.textContent = '🚀 Import Data Sekarang';
        importBtn.disabled = false;
    };
    reader.readAsArrayBuffer(file);
});

// ========== DATABASE ARCHIVES ==========
let selectedClosingIds = new Map();
let selectedTidakIds = new Map();

function loadDBClosing() {
    if (!currentUser) return;
    db.collection('db_closing').where('user_id', '==', currentUser.uid).onSnapshot(snap => {
        let items = [];
        snap.forEach(doc => {
            const d = doc.data();
            items.push({ id: doc.id, nama: d.nama, hp: d.hp, closing_date: d.closing_date, checked: selectedClosingIds.get(doc.id) || false });
        });
        items.sort((a, b) => new Date(b.closing_date) - new Date(a.closing_date));
        
        const html = items.map(item => `
            <div class="db-item"><input type="checkbox" class="db-item-checkbox" data-id="${item.id}" ${item.checked ? 'checked' : ''}>
            <div class="db-item-info"><h4>${escapeHtml(item.nama)}</h4><p>${item.hp}</p><small>Closing: ${new Date(item.closing_date).toLocaleDateString('id-ID')}</small></div>
            <div class="db-item-actions"><button class="db-item-wa" onclick="openWA('${item.hp}')">💬 WA</button><button class="db-item-delete" onclick="deleteDBItem('closing', '${item.id}')">🗑️ Hapus</button></div></div>
        `).join('');
        
        const dbClosingList = document.getElementById('dbClosingList');
        if (dbClosingList) dbClosingList.innerHTML = html || '<p style="text-align:center;padding:40px;">📭 Belum ada data closing</p>';
        
        document.querySelectorAll('#dbClosingList .db-item-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = cb.dataset.id;
                cb.checked ? selectedClosingIds.set(id, true) : selectedClosingIds.delete(id);
                const checkboxes = document.querySelectorAll('#dbClosingList .db-item-checkbox');
                const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(c => c.checked);
                const btn = document.getElementById('selectAllClosing');
                if (btn) btn.textContent = allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua';
            });
        });
    });
}

function loadDBTidak() {
    if (!currentUser) return;
    db.collection('db_tidak_tertarik').where('user_id', '==', currentUser.uid).onSnapshot(snap => {
        let items = [];
        snap.forEach(doc => {
            const d = doc.data();
            items.push({ id: doc.id, nama: d.nama, hp: d.hp, tanggal: d.tanggal, checked: selectedTidakIds.get(doc.id) || false });
        });
        items.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        
        const html = items.map(item => `
            <div class="db-item"><input type="checkbox" class="db-item-checkbox" data-id="${item.id}" ${item.checked ? 'checked' : ''}>
            <div class="db-item-info"><h4>${escapeHtml(item.nama)}</h4><p>${item.hp}</p><small>Tanggal: ${new Date(item.tanggal).toLocaleDateString('id-ID')}</small></div>
            <div class="db-item-actions"><button class="db-item-wa" onclick="openWA('${item.hp}')">💬 WA</button><button class="db-item-delete" onclick="deleteDBItem('tidak', '${item.id}')">🗑️ Hapus</button></div></div>
        `).join('');
        
        const dbTidakList = document.getElementById('dbTidakList');
        if (dbTidakList) dbTidakList.innerHTML = html || '<p style="text-align:center;padding:40px;">📭 Belum ada data tidak tertarik</p>';
        
        document.querySelectorAll('#dbTidakList .db-item-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = cb.dataset.id;
                cb.checked ? selectedTidakIds.set(id, true) : selectedTidakIds.delete(id);
                const checkboxes = document.querySelectorAll('#dbTidakList .db-item-checkbox');
                const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(c => c.checked);
                const btn = document.getElementById('selectAllTidak');
                if (btn) btn.textContent = allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua';
            });
        });
    });
}

window.selectAllClosing = function() {
    const checkboxes = document.querySelectorAll('#dbClosingList .db-item-checkbox');
    const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
        const id = cb.dataset.id;
        !allChecked ? selectedClosingIds.set(id, true) : selectedClosingIds.delete(id);
    });
    const btn = document.getElementById('selectAllClosing');
    if (btn) btn.textContent = !allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua';
};

window.selectAllTidak = function() {
    const checkboxes = document.querySelectorAll('#dbTidakList .db-item-checkbox');
    const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
        const id = cb.dataset.id;
        !allChecked ? selectedTidakIds.set(id, true) : selectedTidakIds.delete(id);
    });
    const btn = document.getElementById('selectAllTidak');
    if (btn) btn.textContent = !allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua';
};

window.deleteDBItem = async function(type, id) {
    if (!confirm('Yakin hapus data ini?')) return;
    try {
        if (type === 'closing') {
            await db.collection('db_closing').doc(id).delete();
            selectedClosingIds.delete(id);
        } else {
            await db.collection('db_tidak_tertarik').doc(id).delete();
            selectedTidakIds.delete(id);
        }
        showNotif('Data berhasil dihapus');
    } catch (error) {
        showNotif('Gagal hapus: ' + error.message, true);
    }
};

window.deleteSelectedClosing = async function() {
    const selectedIds = Array.from(selectedClosingIds.keys());
    if (selectedIds.length === 0) { showNotif('Tidak ada data yang dipilih', true); return; }
    if (!confirm(`Hapus ${selectedIds.length} data closing yang dipilih?`)) return;
    try {
        const batch = db.batch();
        selectedIds.forEach(id => batch.delete(db.collection('db_closing').doc(id)));
        await batch.commit();
        selectedClosingIds.clear();
        showNotif(`${selectedIds.length} data closing berhasil dihapus`);
    } catch (error) { showNotif('Gagal hapus: ' + error.message, true); }
};

window.deleteSelectedTidak = async function() {
    const selectedIds = Array.from(selectedTidakIds.keys());
    if (selectedIds.length === 0) { showNotif('Tidak ada data yang dipilih', true); return; }
    if (!confirm(`Hapus ${selectedIds.length} data tidak tertarik yang dipilih?`)) return;
    try {
        const batch = db.batch();
        selectedIds.forEach(id => batch.delete(db.collection('db_tidak_tertarik').doc(id)));
        await batch.commit();
        selectedTidakIds.clear();
        showNotif(`${selectedIds.length} data tidak tertarik berhasil dihapus`);
    } catch (error) { showNotif('Gagal hapus: ' + error.message, true); }
};

document.getElementById('selectAllClosing')?.addEventListener('click', selectAllClosing);
document.getElementById('deleteSelectedClosing')?.addEventListener('click', deleteSelectedClosing);
document.getElementById('selectAllTidak')?.addEventListener('click', selectAllTidak);
document.getElementById('deleteSelectedTidak')?.addEventListener('click', deleteSelectedTidak);

// ========== CHARTS ==========
function updateChartCustomer(total, closing, pending, followup) {
    const ctx = document.getElementById('chartCustomer');
    if (!ctx) return;
    if (chartCustomer) chartCustomer.destroy();
    const baru = total - (closing + pending + followup);
    chartCustomer = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: ['Closing', 'Pending', 'Follow Up', 'Baru'], datasets: [{ data: [closing, pending, followup, baru], backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'], borderWidth: 0, hoverOffset: 15, cutout: '65%' }] },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'right', labels: { usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11 } } } } }
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
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'right', labels: { usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11 } } } } }
    });
}

// ========== DRAG AND DROP ==========
function initDragAndDrop() {
    const customerGroups = ['baruList', 'followupList', 'pendingList', 'closingList'];
    const customerStatusMap = { baruList: 'baru', followupList: 'followup', pendingList: 'pending', closingList: 'closing' };
    customerGroups.forEach(groupId => {
        const el = document.getElementById(groupId);
        if (el && !el.hasAttribute('data-sortable')) {
            new Sortable(el, {
                group: 'customers', animation: 200, draggable: '.card-item',
                onEnd: async function(evt) {
                    const id = evt.item.dataset.id;
                    const newStatus = customerStatusMap[evt.to.id];
                    if (id && newStatus && currentUser) {
                        if (newStatus === 'closing') await window.confirmClosing(id);
                        else await db.collection('customers').doc(id).update({ status: newStatus });
                    }
                }
            });
            el.setAttribute('data-sortable', 'true');
        }
    });
    
    const prospekGroups = ['prospekBaruList', 'prospekDihubungiList', 'prospekTertarikList', 'prospekTidakList'];
    const prospekStatusMap = { prospekBaruList: 'Baru', prospekDihubungiList: 'Sudah Dihubungi', prospekTertarikList: 'Tertarik', prospekTidakList: 'Tidak Tertarik' };
    prospekGroups.forEach(groupId => {
        const el = document.getElementById(groupId);
        if (el && !el.hasAttribute('data-sortable')) {
            new Sortable(el, {
                group: 'prospek', animation: 200, draggable: '.card-item',
                onEnd: async function(evt) {
                    const id = evt.item.dataset.id;
                    const newStatus = prospekStatusMap[evt.to.id];
                    if (id && newStatus && currentUser) {
                        if (newStatus === 'Tidak Tertarik') await window.confirmTidakTertarik(id);
                        else await db.collection('prospek').doc(id).update({ status: newStatus });
                    }
                }
            });
            el.setAttribute('data-sortable', 'true');
        }
    });
}

// ========== LOAD ALL DATA ==========
function loadAllData() {
    if (!currentUser) return;
    
    db.collection('customers').where('user_id', '==', currentUser.uid).onSnapshot(snap => {
        let total = 0, closing = 0, pending = 0, followup = 0;
        const lists = { baru: [], followup: [], pending: [], closing: [] };
        snap.forEach(doc => {
            const d = doc.data();
            total++;
            if (d.status === 'closing') closing++;
            else if (d.status === 'pending') pending++;
            else if (d.status === 'followup') followup++;
            else lists.baru.push({ id: doc.id, nama: d.nama, hp: d.hp });
            if (d.status === 'followup') lists.followup.push({ id: doc.id, nama: d.nama, hp: d.hp });
            if (d.status === 'pending') lists.pending.push({ id: doc.id, nama: d.nama, hp: d.hp });
            if (d.status === 'closing') lists.closing.push({ id: doc.id, nama: d.nama, hp: d.hp });
        });
        
        document.getElementById('countBaru').innerText = total - (closing + pending + followup);
        document.getElementById('countFollowup').innerText = followup;
        document.getElementById('countPending').innerText = pending;
        document.getElementById('countClosing').innerText = closing;
        document.getElementById('totalData').innerText = total;
        document.getElementById('closingTotal').innerText = closing;
        document.getElementById('activeProspek').innerText = total - closing;
        document.getElementById('rateClosing').innerText = total ? Math.round((closing / total) * 100) + '%' : '0%';
        
        for (let status in lists) {
            const container = document.getElementById(status + 'List');
            if (container) {
                container.innerHTML = lists[status].map(item => `
                    <div class="card-item" data-id="${item.id}">
                        <div class="card-name">${escapeHtml(item.nama)}</div>
                        <div class="card-phone">
                            <span>${item.hp}</span>
                            <span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💚</span>
                        </div>
                    </div>
                `).join('');
                container.querySelectorAll('.card-item').forEach(card => {
                    card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailCustomer(card.dataset.id); });
                });
            }
        }
        updateChartCustomer(total, closing, pending, followup);
        initDragAndDrop();
    });
    
    db.collection('prospek').where('user_id', '==', currentUser.uid).onSnapshot(snap => {
        let baru = 0, dihubungi = 0, tertarik = 0, tidak = 0;
        const lists = { prospekBaru: [], prospekDihubungi: [], prospekTertarik: [], prospekTidak: [] };
        snap.forEach(doc => {
            const d = doc.data();
            const st = d.status || 'Baru';
            if (st === 'Baru') { baru++; lists.prospekBaru.push({ id: doc.id, nama: d.nama, hp: d.hp }); }
            else if (st === 'Sudah Dihubungi') { dihubungi++; lists.prospekDihubungi.push({ id: doc.id, nama: d.nama, hp: d.hp }); }
            else if (st === 'Tertarik') { tertarik++; lists.prospekTertarik.push({ id: doc.id, nama: d.nama, hp: d.hp }); }
            else { tidak++; lists.prospekTidak.push({ id: doc.id, nama: d.nama, hp: d.hp }); }
        });
        
        document.getElementById('countProspekBaru').innerText = baru;
        document.getElementById('countDihubungi').innerText = dihubungi;
        document.getElementById('countTertarik').innerText = tertarik;
        document.getElementById('countTidakTertarik').innerText = tidak;
        
        for (let col in lists) {
            const container = document.getElementById(col + 'List');
            if (container) {
                container.innerHTML = lists[col].map(item => `
                    <div class="card-item" data-id="${item.id}">
                        <div class="card-name">${escapeHtml(item.nama)}</div>
                        <div class="card-phone">
                            <span>${item.hp}</span>
                            <span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💚</span>
                        </div>
                    </div>
                `).join('');
                container.querySelectorAll('.card-item').forEach(card => {
                    card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailProspek(card.dataset.id); });
                });
            }
        }
        updateChartProspek(baru, dihubungi, tertarik, tidak);
        initDragAndDrop();
    });
}

// ========== REMINDER FUNCTIONS ==========
async function loadReminders() {
    if (!currentUser) return;
    
    try {
        const snapshot = await db.collection('reminders')
            .where('user_id', '==', currentUser.uid)
            .get();
        
        const reminderList = document.getElementById('reminderList');
        if (!reminderList) return;
        
        if (snapshot.empty) {
            reminderList.innerHTML = '<p style="text-align:center;padding:40px;">⏰ Belum ada pengingat</p>';
            return;
        }
        
        const items = [];
        snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        reminderList.innerHTML = items.map(item => `
            <div class="db-item">
                <div class="db-item-info">
                    <h4>📝 ${escapeHtml(item.title)}</h4>
                    <p>${escapeHtml(item.description || '-')}</p>
                    <small>⏰ ${item.datetime ? new Date(item.datetime).toLocaleString('id-ID') : '-'}</small>
                </div>
                <div class="db-item-actions">
                    <button class="db-item-delete" onclick="deleteReminder('${item.id}')">🗑️ Hapus</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error load reminders:', error);
    }
}

window.deleteReminder = async function(id) {
    if (confirm('Hapus pengingat ini?')) {
        await db.collection('reminders').doc(id).delete();
        showNotif('Pengingat dihapus');
        loadReminders();
    }
};

document.getElementById('addReminderBtn')?.addEventListener('click', () => {
    document.getElementById('reminderModal').style.display = 'flex';
});

document.getElementById('saveReminderBtn')?.addEventListener('click', async () => {
    const title = document.getElementById('reminderTitle').value;
    const description = document.getElementById('reminderDesc').value;
    const datetime = document.getElementById('reminderDateTime').value;
    
    if (!title) {
        showNotif('Judul wajib diisi', true);
        return;
    }
    
    await db.collection('reminders').add({
        title: title, description: description || '', datetime: datetime || null,
        user_id: currentUser.uid, created_at: new Date().toISOString()
    });
    
    closeModal('reminderModal');
    document.getElementById('reminderTitle').value = '';
    document.getElementById('reminderDesc').value = '';
    document.getElementById('reminderDateTime').value = '';
    showNotif('✅ Pengingat ditambahkan');
    loadReminders();
});

// ========== PESAN FUNCTIONS ==========
async function loadUsersForSelect() {
    const snapshot = await db.collection('users').get();
    const select = document.getElementById('pesanTo');
    if (!select) return;
    
    select.innerHTML = '<option value="">Pilih CS Tujuan</option>';
    snapshot.forEach(doc => {
        const data = doc.data();
        if (doc.id !== currentUser.uid) {
            const name = data.nama || data.email || 'CS Agent';
            select.innerHTML += `<option value="${doc.id}">${escapeHtml(name)}</option>`;
        }
    });
}

async function loadPesan() {
    if (!currentUser) return;
    
    try {
        const snapshot = await db.collection('messages')
            .where('to_id', '==', currentUser.uid)
            .get();
        
        const pesanList = document.getElementById('pesanList');
        if (!pesanList) return;
        
        if (snapshot.empty) {
            pesanList.innerHTML = '<p style="text-align:center;padding:40px;">💬 Belum ada pesan</p>';
            return;
        }
        
        const items = [];
        for (const doc of snapshot.docs) {
            items.push({ id: doc.id, ...doc.data() });
        }
        items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        let html = '';
        for (const item of items) {
            let fromName = 'Unknown';
            const fromUser = await db.collection('users').doc(item.from_id).get();
            if (fromUser.exists) fromName = fromUser.data().nama || fromUser.data().email || 'CS Agent';
            
            html += `
                <div class="db-item ${!item.is_read ? 'unread' : ''}" style="${!item.is_read ? 'background:#eef2ff;' : ''}">
                    <div class="db-item-info">
                        <h4>📨 Dari: ${escapeHtml(fromName)}</h4>
                        <p>${escapeHtml(item.message)}</p>
                        <small>📅 ${new Date(item.created_at).toLocaleString('id-ID')} | ${item.is_read ? '✅ Dibaca' : '🆕 Baru'}</small>
                    </div>
                    <div class="db-item-actions">
                        <button class="db-item-wa" onclick="markAsRead('${item.id}')">✅ Tandai Dibaca</button>
                        <button class="db-item-delete" onclick="deletePesan('${item.id}')">🗑️ Hapus</button>
                    </div>
                </div>
            `;
        }
        pesanList.innerHTML = html;
    } catch (error) {
        console.error('Error load pesan:', error);
    }
}

window.markAsRead = async function(id) {
    await db.collection('messages').doc(id).update({ is_read: true });
    showNotif('Pesan ditandai dibaca');
    loadPesan();
    updateNotifBadge();
};

window.deletePesan = async function(id) {
    if (confirm('Hapus pesan ini?')) {
        await db.collection('messages').doc(id).delete();
        showNotif('Pesan dihapus');
        loadPesan();
        updateNotifBadge();
    }
};

document.getElementById('addPesanBtn')?.addEventListener('click', async () => {
    await loadUsersForSelect();
    document.getElementById('pesanModal').style.display = 'flex';
});

document.getElementById('savePesanBtn')?.addEventListener('click', async () => {
    const toId = document.getElementById('pesanTo').value;
    const message = document.getElementById('pesanMessage').value;
    
    if (!toId || !message) {
        showNotif('Lengkapi data!', true);
        return;
    }
    
    await db.collection('messages').add({
        from_id: currentUser.uid, to_id: toId, message: message,
        is_read: false, created_at: new Date().toISOString()
    });
    
    closeModal('pesanModal');
    document.getElementById('pesanTo').value = '';
    document.getElementById('pesanMessage').value = '';
    showNotif('✅ Pesan terkirim');
});

async function updateNotifBadge() {
    if (!currentUser) return;
    const snapshot = await db.collection('messages')
        .where('to_id', '==', currentUser.uid)
        .where('is_read', '==', false)
        .get();
    const badge = document.getElementById('notifCount');
    if (badge) badge.innerText = snapshot.size;
}

if (currentUser) {
    db.collection('messages').where('to_id', '==', currentUser.uid).onSnapshot(() => updateNotifBadge());
}

document.getElementById('notifBtn')?.addEventListener('click', () => {
    document.querySelector('.menu-item[data-page="pesan"]')?.click();
});

// ========== BROADCAST WHATSAPP FUNCTIONS ==========
let currentNumbers = [];

function initBroadcast() {
    // Radio change event
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
    
    // Filter checkboxes change
    document.querySelectorAll('#customerFilter input, #prospekFilter input').forEach(cb => {
        cb.addEventListener('change', () => loadNumbers());
    });
    
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
        let collection = 'customers';
        let statusField = 'status';
        let statusValues = [];
        
        if (sourceType === 'prospek') {
            collection = 'prospek';
            statusField = 'status';
            statusValues = Array.from(document.querySelectorAll('#prospekFilter input:checked')).map(cb => cb.value);
        } else if (sourceType === 'customer') {
            collection = 'customers';
            statusField = 'status';
            statusValues = Array.from(document.querySelectorAll('#customerFilter input:checked')).map(cb => cb.value);
        } else if (sourceType === 'closing') {
            collection = 'db_closing';
            statusField = null;
        } else if (sourceType === 'dbTidak') {
            collection = 'db_tidak_tertarik';
            statusField = null;
        }
        
        let query = db.collection(collection).where('user_id', '==', currentUser.uid);
        if (statusValues && statusValues.length > 0) {
            query = query.where(statusField, 'in', statusValues);
        }
        
        const snapshot = await query.get();
        snapshot.forEach(doc => {
            const data = doc.data();
            numbers.push({ hp: data.hp, nama: data.nama });
        });
    }
    
    currentNumbers = numbers;
    const countSpan = document.getElementById('selectedCount');
    const listDiv = document.getElementById('selectedNumbersList');
    
    if (countSpan) countSpan.innerText = numbers.length;
    
    if (numbers.length === 0) {
        listDiv.innerHTML = '<p style="color:#9ca3af;">Tidak ada nomor yang dipilih</p>';
    } else if (typeof numbers[0] === 'string') {
        listDiv.innerHTML = numbers.map(n => `<div class="number-item">${escapeHtml(n)}</div>`).join('');
    } else {
        listDiv.innerHTML = numbers.map(n => `<div class="number-item">${escapeHtml(n.nama)} - ${escapeHtml(n.hp)}</div>`).join('');
    }
}

async function sendBroadcast() {
    const messageTemplate = document.getElementById('broadcastMessage')?.value;
    const openAll = document.getElementById('openAllWA')?.checked;
    const sendOneByOne = document.getElementById('sendOneByOne')?.checked;
    
    if (!messageTemplate) {
        showNotif('Pesan tidak boleh kosong!', true);
        return;
    }
    
    if (currentNumbers.length === 0) {
        showNotif('Tidak ada nomor tujuan!', true);
        return;
    }
    
    if (sendOneByOne) {
        for (let i = 0; i < currentNumbers.length; i++) {
            const item = currentNumbers[i];
            const hp = typeof item === 'string' ? item : item.hp;
            const nama = typeof item === 'string' ? '' : item.nama;
            const message = messageTemplate.replace(/{nama}/g, nama || 'Customer');
            const nomor = hp.toString().replace('+', '').replace(/^0/, '62');
            const waUrl = 'https://wa.me/' + nomor + '?text=' + encodeURIComponent(message);
            window.open(waUrl, '_blank');
            
            if (i < currentNumbers.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        showNotif(`✅ Membuka ${currentNumbers.length} chat WhatsApp`);
    } else if (openAll) {
        for (const item of currentNumbers) {
            const hp = typeof item === 'string' ? item : item.hp;
            const nama = typeof item === 'string' ? '' : item.nama;
            const message = messageTemplate.replace(/{nama}/g, nama || 'Customer');
            const nomor = hp.toString().replace('+', '').replace(/^0/, '62');
            const waUrl = 'https://wa.me/' + nomor + '?text=' + encodeURIComponent(message);
            window.open(waUrl, '_blank');
        }
        showNotif(`✅ Membuka ${currentNumbers.length} chat WhatsApp`);
    } else {
        if (currentNumbers.length > 0) {
            const first = currentNumbers[0];
            const hp = typeof first === 'string' ? first : first.hp;
            const nama = typeof first === 'string' ? '' : first.nama;
            const message = messageTemplate.replace(/{nama}/g, nama || 'Customer');
            const nomor = hp.toString().replace('+', '').replace(/^0/, '62');
            window.open('https://wa.me/' + nomor + '?text=' + encodeURIComponent(message), '_blank');
            showNotif('✅ Membuka chat WhatsApp pertama');
        }
    }
}
