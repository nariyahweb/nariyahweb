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

// ========== SIDEBAR FUNCTION ==========
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const hoverZone = document.getElementById('hoverZone');
    const toggleBtn = document.getElementById('toggleSidebarBtn');
    
    function isMobile() {
        return window.innerWidth <= 768;
    }
    
    // Desktop: Hover to open sidebar
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
    
    // Mobile: Toggle button
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            if (sidebar) {
                sidebar.classList.toggle('active');
            }
        });
    }
    
    // Close sidebar when clicking outside (mobile only)
    document.addEventListener('click', function(e) {
        if (isMobile() && sidebar && toggleBtn) {
            if (!sidebar.contains(e.target) && e.target !== toggleBtn) {
                sidebar.classList.remove('active');
            }
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (!isMobile() && sidebar) {
            sidebar.classList.add('active');
        } else if (isMobile() && sidebar) {
            sidebar.classList.remove('active');
        }
    });
});

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
            if (doc.exists && doc.data().nama) nama = doc.data().nama;
            const topUserName = document.getElementById('topUserName');
            const profileName = document.getElementById('profileName');
            if (topUserName) topUserName.innerText = nama;
            if (profileName) profileName.value = nama;
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
        
        // Hide all pages
        const pages = ['dashboardPage', 'importPage', 'dbClosingPage', 'dbTidakPage'];
        pages.forEach(p => {
            const el = document.getElementById(p);
            if (el) el.style.display = 'none';
        });
        
        // Show selected page
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
        
        // Update active menu
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        item.classList.add('active');
        
        // Close sidebar on mobile after click
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

const saveProfileBtn = document.getElementById('saveProfileBtn');
if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', async () => {
        const nama = document.getElementById('profileName').value;
        if (!nama) {
            showNotif('Nama wajib diisi', true);
            return;
        }
        
        try {
            await db.collection('users').doc(currentUser.uid).set({
                nama: nama,
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
                <button onclick="updateStatus('${id}','closing')">Closing</button>
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
                <button onclick="updateProspekStatus('${id}','Tidak Tertarik')">Tidak Tertarik</button>
                ${d.status === 'Tertarik' ? `<button onclick="convertToCustomer('${id}')">Jadikan Customer</button>` : ''}
                <button onclick="deleteProspek('${id}')" style="background:#ef4444;color:white;">Hapus</button>
                <button onclick="closeModal('detailModal')">Tutup</button>
            </div>
        `;
        modal.style.display = 'flex';
    });
}

window
