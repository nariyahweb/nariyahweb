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

// ========== SIDEBAR FUNGSI ==========
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const hoverZone = document.getElementById('hoverZone');
    const toggleBtn = document.getElementById('toggleSidebarBtn');
    
    function isMobile() {
        return window.innerWidth <= 768;
    }
    
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
        
        sidebar.addEventListener('mouseenter', function() {
            clearTimeout(sidebarTimeout);
        });
    }
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (sidebar) {
                sidebar.classList.toggle('active');
            }
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
        if (!isMobile() && sidebar) {
            sidebar.classList.add('active');
        } else if (isMobile() && sidebar) {
            sidebar.classList.remove('active');
        }
    });
}

initSidebar();

// ========== HELPER FUNCTIONS ==========
function showNotif(msg, isError = false) {
    const notif = document.createElement('div');
    notif.textContent = msg;
    notif.className = `notif-toast ${isError ? 'notif-error' : 'notif-success'}`;
    const notifBox = document.getElementById('notifBox');
    if (notifBox) {
        notifBox.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
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

// ========== FUNGSI CLOSING & TIDAK TERTARIK ==========
// Fungsi untuk menyimpan ke database closing
async function saveToClosingDB(id, data) {
    try {
        await db.collection('db_closing').add({
            nama: data.nama,
            hp: data.hp,
            tanggal: data.tanggal || new Date().toISOString().split('T')[0],
            closing_date: new Date().toISOString(),
            user_id: currentUser.uid
        });
        
        // Hapus dari customers
        await db.collection('customers').doc(id).delete();
        
        showNotif('✅ Data berhasil masuk Database Closing!');
        return true;
    } catch (error) {
        showNotif('❌ Gagal menyimpan ke DB Closing: ' + error.message, true);
        return false;
    }
}

// Fungsi untuk menyimpan ke database tidak tertarik
async function saveToTidakTertarikDB(id, data) {
    try {
        await db.collection('db_tidak_tertarik').add({
            nama: data.nama,
            hp: data.hp,
            tanggal: new Date().toISOString(),
            user_id: currentUser.uid
        });
        
        // Hapus dari prospek
        await db.collection('prospek').doc(id).delete();
        
        showNotif('✅ Data berhasil masuk Database Tidak Tertarik!');
        return true;
    } catch (error) {
        showNotif('❌ Gagal menyimpan ke DB Tidak Tertarik: ' + error.message, true);
        return false;
    }
}

// Fungsi konfirmasi untuk closing
async function confirmClosing(id, data) {
    const result = confirm(
        "⚠️ PERHATIAN!\n\n" +
        "Anda akan memindahkan data ini ke DATABASE CLOSING.\n\n" +
        "✅ OK = Pindahkan ke DB Closing (data akan diarsipkan)\n" +
        "❌ CANCEL = Tetap di kolom Closing (tidak diarsipkan)\n\n" +
        "Apakah Anda yakin?"
    );
    
    if (result) {
        await saveToClosingDB(id, data);
    } else {
        // Hanya update status ke closing tanpa mengarsip
        await db.collection('customers').doc(id).update({ status: 'closing' });
        showNotif('📌 Data tetap di kolom Closing (tidak diarsipkan)');
    }
}

// Fungsi konfirmasi untuk tidak tertarik
async function confirmTidakTertarik(id, data) {
    const result = confirm(
        "⚠️ PERHATIAN!\n\n" +
        "Anda akan memindahkan data ini ke DATABASE TIDAK TERTARIK.\n\n" +
        "✅ OK = Pindahkan ke DB Tidak Tertarik (data akan diarsipkan)\n" +
        "❌ CANCEL = Tetap di kolom Tidak Tertarik (tidak diarsipkan)\n\n" +
        "Apakah Anda yakin?"
    );
    
    if (result) {
        await saveToTidakTertarikDB(id, data);
    } else {
        // Hanya update status ke tidak tertarik tanpa mengarsip
        await db.collection('prospek').doc(id).update({ status: 'Tidak Tertarik' });
        showNotif('📌 Data tetap di kolom Tidak Tertarik (tidak diarsipkan)');
    }
}

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
        if (loginPage) loginPage.style.display = 'none';
        if (app) app.style.display = 'block';
        
        db.collection('users').doc(user.uid).get().then(doc => {
            let nama = 'CS Agent';
            let foto = 'https://i.pravatar.cc/40';
            if (doc.exists) {
                const data = doc.data();
                if (data.nama) nama = data.nama;
                if (data.foto) foto = data.foto;
            }
            const topUserName = document.getElementById('topUserName');
            const profileName = document.getElementById('profileName');
            const topProfileImg = document.getElementById('topProfileImg');
            const previewFoto = document.getElementById('previewFoto');
            if (topUserName) topUserName.innerText = nama;
            if (profileName) profileName.value = nama;
            if (topProfileImg) topProfileImg.src = foto;
            if (previewFoto) previewFoto.src = foto;
        });
        
        const profileEmail = document.getElementById('profileEmail');
        if (profileEmail) profileEmail.value = user.email;
        loadAllData();
    } else {
        if (loginPage) loginPage.style.display = 'flex';
        if (app) app.style.display = 'none';
        currentUser = null;
    }
});

// ========== PAGE NAVIGATION ==========
document.querySelectorAll('.menu-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;
        
        const pages = ['dashboardPage', 'importPage', 'dbClosingPage', 'dbTidakPage'];
        pages.forEach(p => {
            const el = document.getElementById(p);
            if (el) el.style.display = 'none';
        });
        
        if (page === 'dashboard') {
            const dashboardPage = document.getElementById('dashboardPage');
            if (dashboardPage) dashboardPage.style.display = 'block';
        } else if (page === 'import') {
            const importPage = document.getElementById('importPage');
            if (importPage) importPage.style.display = 'block';
        } else if (page === 'dbClosing') {
            const dbClosingPage = document.getElementById('dbClosingPage');
            if (dbClosingPage) dbClosingPage.style.display = 'block';
            loadDBClosing();
        } else if (page === 'dbTidak') {
            const dbTidakPage = document.getElementById('dbTidakPage');
            if (dbTidakPage) dbTidakPage.style.display = 'block';
            loadDBTidak();
        }
        
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        item.classList.add('active');
        
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.remove('active');
        }
    });
});

// ========== CLOSE MODALS ==========
document.querySelectorAll('.closeModalBtn').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
});

// ========== PROFILE ==========
const profileImg = document.getElementById('profileImg');
if (profileImg) {
    profileImg.addEventListener('click', () => {
        const profileModal = document.getElementById('profileModal');
        if (profileModal) profileModal.style.display = 'flex';
    });
}

const previewFoto = document.getElementById('previewFoto');
if (previewFoto) {
    previewFoto.addEventListener('click', () => {
        const profileFoto = document.getElementById('profileFoto');
        if (profileFoto) profileFoto.click();
    });
}

const profileFoto = document.getElementById('profileFoto');
if (profileFoto) {
    profileFoto.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('previewFoto');
                const topImg = document.getElementById('topProfileImg');
                if (preview) preview.src = e.target.result;
                if (topImg) topImg.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

const saveProfileBtn = document.getElementById('saveProfileBtn');
if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', async () => {
        const nama = document.getElementById('profileName').value;
        const hp = document.getElementById('profilePhone').value;
        const foto = document.getElementById('previewFoto').src;
        
        if (!nama) {
            showNotif('Nama wajib diisi', true);
            return;
        }
        
        try {
            await db.collection('users').doc(currentUser.uid).set({
                nama: nama,
                hp: hp,
                foto: foto,
                email: currentUser.email
            }, { merge: true });
            
            const topUserName = document.getElementById('topUserName');
            if (topUserName) topUserName.innerText = nama;
            closeModal('profileModal');
            showNotif('Profile tersimpan');
        } catch (e) {
            showNotif('Gagal: ' + e.message, true);
        }
    });
}

// ========== CUSTOMER CRUD ==========
const addCustomerBtn = document.getElementById('addCustomerBtn');
if (addCustomerBtn) {
    addCustomerBtn.addEventListener('click', () => {
        const customerModal = document.getElementById('customerModal');
        if (customerModal) customerModal.style.display = 'flex';
    });
}

const saveCustomerBtn = document.getElementById('saveCustomerBtn');
if (saveCustomerBtn) {
    saveCustomerBtn.addEventListener('click', () => {
        const nama = document.getElementById('customerName').value;
        const hp = document.getElementById('customerPhone').value;
        const tanggal = document.getElementById('customerDate').value;
        
        if (!nama || !hp) {
            showNotif('Lengkapi data!', true);
            return;
        }
        
        db.collection('customers').add({
            nama: nama,
            hp: hp,
            tanggal: tanggal || new Date().toISOString().split('T')[0],
            status: 'baru',
            user_id: currentUser.uid,
            created_at: new Date().toISOString()
        }).then(() => {
            closeModal('customerModal');
            document.getElementById('customerName').value = '';
            document.getElementById('customerPhone').value = '+62';
            document.getElementById('customerDate').value = '';
            showNotif('Customer berhasil ditambahkan');
        }).catch(e => showNotif('Error: ' + e.message, true));
    });
}

// ========== PROSPEK CRUD ==========
const addProspekBtn = document.getElementById('addProspekBtn');
if (addProspekBtn) {
    addProspekBtn.addEventListener('click', () => {
        const prospekModal = document.getElementById('prospekModal');
        if (prospekModal) prospekModal.style.display = 'flex';
    });
}

const saveProspekBtn = document.getElementById('saveProspekBtn');
if (saveProspekBtn) {
    saveProspekBtn.addEventListener('click', () => {
        const nama = document.getElementById('prospekName').value;
        const hp = document.getElementById('prospekPhone').value;
        const status = document.getElementById('prospekStatusSelect').value;
        
        if (!nama || !hp) {
            showNotif('Lengkapi data!', true);
            return;
        }
        
        db.collection('prospek').add({
            nama: nama,
            hp: hp,
            status: status,
            user_id: currentUser.uid,
            created_at: new Date().toISOString()
        }).then(() => {
            closeModal('prospekModal');
            document.getElementById('prospekName').value = '';
            document.getElementById('prospekPhone').value = '+62';
            showNotif('Prospek berhasil ditambahkan');
        }).catch(e => showNotif('Error: ' + e.message, true));
    });
}

// ========== DETAIL MODAL ==========
function openDetailCustomer(id) {
    db.collection('customers').doc(id).get().then(doc => {
        const d = doc.data();
        const modal = document.getElementById('detailModal');
        const content = document.getElementById('detailContent');
        
        if (!modal || !content) return;
        
        content.innerHTML = `
            <h3>${escapeHtml(d.nama)}</h3>
            <p><strong>No HP:</strong> ${d.hp}</p>
            <p><strong>Status:</strong> ${d.status}</p>
            <p><strong>Tanggal:</strong> ${d.tanggal || '-'}</p>
            <div class="modal-buttons" style="margin-top: 20px;">
                <button onclick="openWA('${d.hp}')">WhatsApp</button>
                <button onclick="updateStatus('${id}','followup')">Follow Up</button>
                <button onclick="updateStatus('${id}','pending')">Pending</button>
                <button onclick="confirmClosingFromDetail('${id}')" style="background:#10b981;color:white;">Closing</button>
                <button onclick="deleteCustomer('${id}')" style="background:#ef4444;color:white;">Hapus</button>
                <button onclick="closeModal('detailModal')">Tutup</button>
            </div>
        `;
        modal.style.display = 'flex';
    });
}

function openDetailProspek(id) {
    db.collection('prospek').doc(id).get().then(doc => {
        const d = doc.data();
        const modal = document.getElementById('detailModal');
        const content = document.getElementById('detailContent');
        
        if (!modal || !content) return;
        
        content.innerHTML = `
            <h3>${escapeHtml(d.nama)}</h3>
            <p><strong>No HP:</strong> ${d.hp}</p>
            <p><strong>Status:</strong> ${d.status}</p>
            <div class="modal-buttons" style="margin-top: 20px;">
                <button onclick="openWA('${d.hp}')">WhatsApp</button>
                <button onclick="updateProspekStatus('${id}','Sudah Dihubungi')">Dihubungi</button>
                <button onclick="updateProspekStatus('${id}','Tertarik')">Tertarik</button>
                <button onclick="confirmTidakTertarikFromDetail('${id}')" style="background:#ef4444;color:white;">Tidak Tertarik</button>
                ${d.status === 'Tertarik' ? `<button onclick="convertToCustomer('${id}')">Jadikan Customer</button>` : ''}
                <button onclick="deleteProspek('${id}')" style="background:#ef4444;color:white;">Hapus</button>
                <button onclick="closeModal('detailModal')">Tutup</button>
            </div>
        `;
        modal.style.display = 'flex';
    });
}

// Fungsi konfirmasi dari detail modal
window.confirmClosingFromDetail = async function(id) {
    closeModal('detailModal');
    const doc = await db.collection('customers').doc(id).get();
    if (doc.exists) {
        await confirmClosing(id, doc.data());
    }
};

window.confirmTidakTertarikFromDetail = async function(id) {
    closeModal('detailModal');
    const doc = await db.collection('prospek').doc(id).get();
    if (doc.exists) {
        await confirmTidakTertarik(id, doc.data());
    }
};

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
    if (confirm('Yakin hapus customer ini?')) {
        db.collection('customers').doc(id).delete();
        closeModal('detailModal');
        showNotif('Data dihapus');
    }
};

window.deleteProspek = function(id) {
    if (confirm('Yakin hapus prospek ini?')) {
        db.collection('prospek').doc(id).delete();
        closeModal('detailModal');
        showNotif('Data dihapus');
    }
};

window.convertToCustomer = function(id) {
    if (confirm('Yakin jadikan customer?')) {
        db.collection('prospek').doc(id).get().then(doc => {
            const d = doc.data();
            db.collection('customers').add({
                nama: d.nama,
                hp: d.hp,
                tanggal: new Date().toISOString().split('T')[0],
                status: 'baru',
                user_id: currentUser.uid,
                created_at: new Date().toISOString()
            });
            db.collection('prospek').doc(id).delete();
            closeModal('detailModal');
            showNotif('Berhasil jadi customer!');
        });
    }
};

// ========== IMPORT EXCEL ==========
const dropZone = document.getElementById('dropZone');
const excelFile = document.getElementById('excelFile');
if (dropZone) {
    dropZone.addEventListener('click', () => {
        if (excelFile) excelFile.click();
    });
}

if (excelFile) {
    excelFile.addEventListener('change', function(e) {
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

const importBtn = document.getElementById('importBtn');
if (importBtn) {
    importBtn.addEventListener('click', async () => {
        const file = excelFile ? excelFile.files[0] : null;
        if (!file) {
            showNotif('Pilih file dulu!', true);
            return;
        }
        
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
                if (!nama || !hp) {
                    failed++;
                    continue;
                }
                
                hp = hp.toString();
                if (!hp.startsWith('+62')) hp = '+' + hp.replace(/^0/, '62');
                
                if (importType === 'prospek') {
                    await db.collection('prospek').add({
                        nama: nama,
                        hp: hp,
                        status: 'Baru',
                        user_id: currentUser.uid,
                        created_at: new Date().toISOString()
                    });
                } else {
                    await db.collection('customers').add({
                        nama: nama,
                        hp: hp,
                        tanggal: new Date().toISOString().split('T')[0],
                        status: 'baru',
                        user_id: currentUser.uid,
                        created_at: new Date().toISOString()
                    });
                }
                success++;
            }
            
            alert(`Selesai!\nBerhasil: ${success}\nGagal: ${failed}`);
            if (excelFile) excelFile.value = '';
            const fileInfo = document.getElementById('fileInfo');
            if (fileInfo) fileInfo.innerHTML = '';
            importBtn.textContent = '🚀 Import Data Sekarang';
            importBtn.disabled = false;
        };
        reader.readAsArrayBuffer(file);
    });
}

// ========== DATABASE ARCHIVES ==========
function loadDBClosing() {
    if (!currentUser) return;
    db.collection('db_closing').where('user_id', '==', currentUser.uid).get().then(snap => {
        let html = '';
        snap.forEach(doc => {
            const d = doc.data();
            html += `
                <div class="db-item">
                    <div class="db-item-info">
                        <h4>${escapeHtml(d.nama)}</h4>
                        <p>${d.hp}</p>
                        <small>Closing: ${new Date(d.closing_date).toLocaleDateString('id-ID')}</small>
                    </div>
                    <button onclick="openWA('${d.hp}')">WhatsApp</button>
                </div>
            `;
        });
        const dbClosingList = document.getElementById('dbClosingList');
        if (dbClosingList) dbClosingList.innerHTML = html || '<p style="text-align:center;padding:40px;">Tidak ada data</p>';
    });
}

function loadDBTidak() {
    if (!currentUser) return;
    db.collection('db_tidak_tertarik').where('user_id', '==', currentUser.uid).get().then(snap => {
        let html = '';
        snap.forEach(doc => {
            const d = doc.data();
            html += `
                <div class="db-item">
                    <div class="db-item-info">
                        <h4>${escapeHtml(d.nama)}</h4>
                        <p>${d.hp}</p>
                        <small>Tanggal: ${new Date(d.tanggal).toLocaleDateString('id-ID')}</small>
                    </div>
                    <button onclick="openWA('${d.hp}')">WhatsApp</button>
                </div>
            `;
        });
        const dbTidakList = document.getElementById('dbTidakList');
        if (dbTidakList) dbTidakList.innerHTML = html || '<p style="text-align:center;padding:40px;">Tidak ada data</p>';
    });
}

// ========== CHARTS ==========
function updateChartCustomer(total, closing, pending, followup) {
    const ctx = document.getElementById('chartCustomer');
    if (!ctx) return;
    
    if (chartCustomer) chartCustomer.destroy();
    
    const dataArr = [closing, pending, followup, total - (closing + pending + followup)];
    
    chartCustomer = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Closing', 'Pending', 'Follow Up', 'Baru'],
            datasets: [{
                data: dataArr,
                backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'],
                borderWidth: 0,
                hoverOffset: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true, pointStyle: 'circle' }
                }
            }
        }
    });
}

function updateChartProspek(baru, dihubungi, tertarik, tidak) {
    const ctx = document.getElementById('chartProspek');
    if (!ctx) return;
    
    if (chartProspek) chartProspek.destroy();
    
    const dataArr = [baru, dihubungi, tertarik, tidak];
    if (dataArr.every(v => v === 0)) dataArr[0] = 1;
    
    chartProspek = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Baru', 'Dihubungi', 'Tertarik', 'Tidak'],
            datasets: [{
                data: dataArr,
                backgroundColor: ['#8b5cf6', '#3b82f6', '#10b981', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true, pointStyle: 'circle' }
                }
            }
        }
    });
}

// ========== DRAG AND DROP DENGAN KONFIRMASI ==========
function initDragAndDrop() {
    // Customer drag and drop
    const customerGroups = ['baruList', 'followupList', 'pendingList', 'closingList'];
    const customerStatusMap = {
        baruList: 'baru',
        followupList: 'followup',
        pendingList: 'pending',
        closingList: 'closing'
    };
    
    customerGroups.forEach(groupId => {
        const el = document.getElementById(groupId);
        if (el && !el.hasAttribute('data-sortable')) {
            new Sortable(el, {
                group: 'customers',
                animation: 200,
                draggable: '.card-item',
                onEnd: async function(evt) {
                    const id = evt.item.dataset.id;
                    const newStatus = customerStatusMap[evt.to.id];
                    
                    if (id && newStatus && currentUser) {
                        // Jika dipindah ke column CLOSING
                        if (newStatus === 'closing') {
                            // Ambil data customer
                            const doc = await db.collection('customers').doc(id).get();
                            if (doc.exists) {
                                // Tampilkan konfirmasi
                                await confirmClosing(id, doc.data());
                            }
                        } else {
                            // Update status biasa
                            await db.collection('customers').doc(id).update({ status: newStatus });
                            showNotif(`Status diubah menjadi ${newStatus}`);
                        }
                    }
                }
            });
            el.setAttribute('data-sortable', 'true');
        }
    });
    
    // Prospek drag and drop
    const prospekGroups = ['prospekBaruList', 'prospekDihubungiList', 'prospekTertarikList', 'prospekTidakList'];
    const prospekStatusMap = {
        prospekBaruList: 'Baru',
        prospekDihubungiList: 'Sudah Dihubungi',
        prospekTertarikList: 'Tertarik',
        prospekTidakList: 'Tidak Tertarik'
    };
    
    prospekGroups.forEach(groupId => {
        const el = document.getElementById(groupId);
        if (el && !el.hasAttribute('data-sortable')) {
            new Sortable(el, {
                group: 'prospek',
                animation: 200,
                draggable: '.card-item',
                onEnd: async function(evt) {
                    const id = evt.item.dataset.id;
                    const newStatus = prospekStatusMap[evt.to.id];
                    
                    if (id && newStatus && currentUser) {
                        // Jika dipindah ke column TIDAK TERTARIK
                        if (newStatus === 'Tidak Tertarik') {
                            // Ambil data prospek
                            const doc = await db.collection('prospek').doc(id).get();
                            if (doc.exists) {
                                // Tampilkan konfirmasi
                                await confirmTidakTertarik(id, doc.data());
                            }
                        } else {
                            // Update status biasa
                            await db.collection('prospek').doc(id).update({ status: newStatus });
                            showNotif(`Status diubah menjadi ${newStatus}`);
                        }
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
    
    // Load customers
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
        
        // Update UI
        document.getElementById('countBaru').innerText = total - (closing + pending + followup);
        document.getElementById('countFollowup').innerText = followup;
        document.getElementById('countPending').innerText = pending;
        document.getElementById('countClosing').innerText = closing;
        document.getElementById('totalData').innerText = total;
        document.getElementById('closingTotal').innerText = closing;
        document.getElementById('activeProspek').innerText = total - closing;
        document.getElementById('rateClosing').innerText = total ? Math.round((closing / total) * 100) + '%' : '0%';
        
        // Render cards
        for (let status in lists) {
            const container = document.getElementById(status + 'List');
            if (container) {
                container.innerHTML = lists[status].map(item => `
                    <div class="card-item" data-id="${item.id}" data-status="${status}">
                        <div class="card-name">${escapeHtml(item.nama)}</div>
                        <div class="card-phone">
                            <span>${item.hp}</span>
                            <span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">🟢</span>
                        </div>
                    </div>
                `).join('');
                
                container.querySelectorAll('.card-item').forEach(card => {
                    card.addEventListener('click', (e) => {
                        if (!e.target.classList.contains('whatsapp-icon')) {
                            openDetailCustomer(card.dataset.id);
                        }
                    });
                });
            }
        }
        
        updateChartCustomer(total, closing, pending, followup);
        initDragAndDrop();
    });
    
    // Load prospek
    db.collection('prospek').where('user_id', '==', currentUser.uid).onSnapshot(snap => {
        let baru = 0, dihubungi = 0, tertarik = 0, tidak = 0;
        const lists = { prospekBaru: [], prospekDihubungi: [], prospekTertarik: [], prospekTidak: [] };
        
        snap.forEach(doc => {
            const d = doc.data();
            const st = d.status || 'Baru';
            if (st === 'Baru') {
                baru++;
                lists.prospekBar
