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
    document.getElementById(modalId).style.display = 'none';
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
            sidebar.classList.remove('active');
        } else if (isMobile() && sidebar) {
            sidebar.classList.remove('active');
        }
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
            
            if (doc.exists) {
                const data = doc.data();
                if (data.nama) nama = data.nama;
                if (data.foto) foto = data.foto;
            }
            
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
            const sidebarEl = document.getElementById('sidebar');
            if (sidebarEl) sidebarEl.classList.remove('active');
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
        
        db.collection('users').doc(currentUser.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                document.getElementById('profileName').value = data.nama || '';
                document.getElementById('profilePhone').value = data.hp || '+62';
                if (data.foto) {
                    document.getElementById('previewFoto').src = data.foto;
                    document.getElementById('profileImg').src = data.foto;
                }
            }
        });
    });
}

const previewFoto = document.getElementById('previewFoto');
if (previewFoto) {
    previewFoto.addEventListener('click', () => {
        const profileFotoInput = document.getElementById('profileFoto');
        if (profileFotoInput) profileFotoInput.click();
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
                const preview = document.getElementById('previewFoto');
                if (preview) preview.src = e.target.result;
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
                email: currentUser.email,
                updated_at: new Date().toISOString()
            }, { merge: true });
            
            const topUserName = document.getElementById('topUserName');
            if (topUserName) topUserName.innerText = nama;
            
            const topProfileImg = document.getElementById('profileImg');
            if (topProfileImg) topProfileImg.src = foto;
            
            closeModal('profileModal');
            showNotif('Profile tersimpan');
            
        } catch (e) {
            console.error('Error:', e);
            showNotif('Gagal: ' + e.message, true);
        }
    });
}

// ========== CUSTOMER CRUD ==========
const addCustomerBtn = document.getElementById('addCustomerBtn');
if (addCustomerBtn) {
    addCustomerBtn.addEventListener('click', () => {
        document.getElementById('customerModal').style.display = 'flex';
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
        document.getElementById('prospekModal').style.display = 'flex';
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
        const content = document.getElementById('detailContent');
        if (!content) return;
        
        content.innerHTML = `
            <h3>${escapeHtml(d.nama)}</h3>
            <p><strong>No HP:</strong> ${d.hp}</p>
            <p><strong>Status:</strong> ${d.status}</p>
            <p><strong>Tanggal:</strong> ${d.tanggal || '-'}</p>
            <div class="modal-buttons" style="margin-top: 20px;">
                <button onclick="openWA('${d.hp}')">WhatsApp</button>
                <button onclick="updateStatus('${id}','followup')">Follow Up</button>
                <button onclick="updateStatus('${id}','pending')">Pending</button>
                <button onclick="confirmClosing('${id}')" style="background:#10b981;color:white;">Closing</button>
                <button onclick="deleteCustomer('${id}')" style="background:#ef4444;color:white;">Hapus</button>
                <button onclick="closeModal('detailModal')">Tutup</button>
            </div>
        `;
        document.getElementById('detailModal').style.display = 'flex';
    });
}

function openDetailProspek(id) {
    db.collection('prospek').doc(id).get().then(doc => {
        const d = doc.data();
        const content = document.getElementById('detailContent');
        if (!content) return;
        
        content.innerHTML = `
            <h3>${escapeHtml(d.nama)}</h3>
            <p><strong>No HP:</strong> ${d.hp}</p>
            <p><strong>Status:</strong> ${d.status}</p>
            <div class="modal-buttons" style="margin-top: 20px;">
                <button onclick="openWA('${d.hp}')">WhatsApp</button>
                <button onclick="updateProspekStatus('${id}','Sudah Dihubungi')">Dihubungi</button>
                <button onclick="updateProspekStatus('${id}','Tertarik')">Tertarik</button>
                <button onclick="confirmTidakTertarik('${id}')" style="background:#ef4444;color:white;">Tidak Tertarik</button>
                ${d.status === 'Tertarik' ? `<button onclick="convertToCustomer('${id}')">Jadikan Customer</button>` : ''}
                <button onclick="deleteProspek('${id}')" style="background:#ef4444;color:white;">Hapus</button>
                <button onclick="closeModal('detailModal')">Tutup</button>
            </div>
        `;
        document.getElementById('detailModal').style.display = 'flex';
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

// ========== CLOSING & TIDAK TERTARIK ==========
async function saveToClosingDB(id, data) {
    try {
        await db.collection('db_closing').add({
            nama: data.nama,
            hp: data.hp,
            tanggal: data.tanggal || new Date().toISOString().split('T')[0],
            closing_date: new Date().toISOString(),
            user_id: currentUser.uid
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
            nama: data.nama,
            hp: data.hp,
            tanggal: new Date().toISOString(),
            user_id: currentUser.uid
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
const fileInfo = document.getElementById('fileInfo');

if (dropZone) {
    dropZone.addEventListener('click', () => {
        if (excelFileInput) excelFileInput.click();
    });
}

if (excelFileInput) {
    excelFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            console.log('File selected:', file.name);
            if (fileInfo) {
                fileInfo.innerHTML = `📄 ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
                fileInfo.style.color = '#10b981';
            }
        } else {
            if (fileInfo) fileInfo.innerHTML = '';
        }
    });
}

// Radio option untuk pilih tujuan import
document.querySelectorAll('.radio-option').forEach(opt => {
    opt.addEventListener('click', function() {
        importType = this.dataset.import;
        document.querySelectorAll('.radio-option').forEach(o => o.classList.remove('active'));
        this.classList.add('active');
        console.log('Import type changed to:', importType);
    });
});

// Tombol import
const importBtn = document.getElementById('importBtn');
if (importBtn) {
    importBtn.addEventListener('click', async () => {
        const file = excelFileInput ? excelFileInput.files[0] : null;
        
        console.log('Import button clicked, file:', file ? file.name : 'no file');
        
        if (!file) {
            showNotif('Pilih file Excel dulu!', true);
            return;
        }
        
        // Cek ekstensi file
        const fileExt = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(fileExt)) {
            showNotif('Format file harus .xlsx, .xls, atau .csv', true);
            return;
        }
        
        importBtn.textContent = '📥 Memproses...';
        importBtn.disabled = true;
        
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet);
                
                console.log('Data dari Excel:', json);
                console.log('Jumlah data:', json.length);
                console.log('Tipe import:', importType);
                
                if (json.length === 0) {
                    showNotif('File Excel kosong!', true);
                    importBtn.textContent = '🚀 Import Data Sekarang';
                    importBtn.disabled = false;
                    return;
                }
                
                let success = 0;
                let failed = 0;
                let errors = [];
                
                for (let i = 0; i < json.length; i++) {
                    const row = json[i];
                    let nama = row.nama || row.Nama || row.NAMA || row.name || row.Name;
                    let hp = row.hp || row.HP || row.no_hp || row.phone || row.telp;
                    
                    console.log(`Row ${i + 1}:`, { nama, hp });
                    
                    if (!nama || !hp) {
                        failed++;
                        errors.push(`Baris ${i + 1}: Nama atau HP kosong`);
                        continue;
                    }
                    
                    // Format nomor HP
                    hp = hp.toString().trim();
                    // Hapus semua karakter non-digit
                    let cleanHp = hp.replace(/\D/g, '');
                    
                    // Format ke +62
                    if (cleanHp.startsWith('0')) {
                        cleanHp = '62' + cleanHp.substring(1);
                    } else if (cleanHp.startsWith('62')) {
                        cleanHp = cleanHp;
                    } else if (cleanHp.startsWith('8')) {
                        cleanHp = '62' + cleanHp;
                    }
                    
                    // Pastikan ada +62 di depan
                    const formattedHp = '+' + cleanHp;
                    
                    console.log(`Formatted HP: ${formattedHp}`);
                    
                    if (importType === 'prospek') {
                        await db.collection('prospek').add({
                            nama: nama,
                            hp: formattedHp,
                            status: 'Baru',
                            user_id: currentUser.uid,
                            created_at: new Date().toISOString()
                        });
                    } else {
                        await db.collection('customers').add({
                            nama: nama,
                            hp: formattedHp,
                            tanggal: new Date().toISOString().split('T')[0],
                            status: 'baru',
                            user_id: currentUser.uid,
                            created_at: new Date().toISOString()
                        });
                    }
                    success++;
                }
                
                let message = `✅ Import selesai!\n📊 Berhasil: ${success}\n❌ Gagal: ${failed}`;
                if (errors.length > 0 && errors.length <= 5) {
                    message += '\n\nDetail error:\n' + errors.join('\n');
                } else if (errors.length > 5) {
                    message += `\n\n${errors.length} data gagal diimport (format tidak valid)`;
                }
                alert(message);
                
                // Reset file input
                excelFileInput.value = '';
                if (fileInfo) fileInfo.innerHTML = '';
                
            } catch (error) {
                console.error('Error processing Excel:', error);
                showNotif('Gagal memproses file: ' + error.message, true);
            } finally {
                importBtn.textContent = '🚀 Import Data Sekarang';
                importBtn.disabled = false;
            }
        };
        
        reader.onerror = function(error) {
            console.error('FileReader error:', error);
            showNotif('Gagal membaca file', true);
            importBtn.textContent = '🚀 Import Data Sekarang';
            importBtn.disabled = false;
        };
        
        reader.readAsArrayBuffer(file);
    });
}

// ========== DATABASE ARCHIVES ==========
function loadDBClosing() {
    if (!currentUser) {
        console.log('No user, skipping loadDBClosing');
        return;
    }
    
    console.log('Loading DB Closing...');
    const dbClosingList = document.getElementById('dbClosingList');
    if (!dbClosingList) {
        console.error('dbClosingList element not found!');
        return;
    }
    
    db.collection('db_closing').where('user_id', '==', currentUser.uid).onSnapshot(snap => {
        console.log('DB Closing snapshot size:', snap.size);
        
        let html = '';
        if (snap.empty) {
            html = `
                <div style="text-align:center;padding:40px;">
                    <p style="font-size:48px; margin-bottom:10px;">📭</p>
                    <p style="color:#9ca3af;">Belum ada data closing</p>
                    <p style="font-size:12px; color:#cbd5e1; margin-top:8px;">Drag card ke kolom Closing dan pilih OK</p>
                </div>
            `;
        } else {
            snap.forEach(doc => {
                const d = doc.data();
                html += `
                    <div class="db-item">
                        <div class="db-item-info">
                            <h4>${escapeHtml(d.nama)}</h4>
                            <p>${escapeHtml(d.hp)}</p>
                            <small style="font-size: 11px; color: #9ca3af;">Closing: ${d.closing_date ? new Date(d.closing_date).toLocaleDateString('id-ID') : '-'}</small>
                        </div>
                        <button onclick="openWA('${escapeHtml(d.hp)}')" style="background:#25D366;color:white;border:none;border-radius:8px;padding:6px 12px;cursor:pointer;">💬 WA</button>
                    </div>
                `;
            });
        }
        dbClosingList.innerHTML = html;
        console.log('DB Closing HTML updated, length:', html.length);
    }, error => {
        console.error('Error loading DB Closing:', error);
        dbClosingList.innerHTML = '<p style="text-align:center;padding:40px;color:red;">Error loading data</p>';
    });
}

function loadDBTidak() {
    if (!currentUser) {
        console.log('No user, skipping loadDBTidak');
        return;
    }
    
    console.log('Loading DB Tidak Tertarik...');
    const dbTidakList = document.getElementById('dbTidakList');
    if (!dbTidakList) {
        console.error('dbTidakList element not found!');
        return;
    }
    
    db.collection('db_tidak_tertarik').where('user_id', '==', currentUser.uid).onSnapshot(snap => {
        console.log('DB Tidak Tertarik snapshot size:', snap.size);
        
        let html = '';
        if (snap.empty) {
            html = `
                <div style="text-align:center;padding:40px;">
                    <p style="font-size:48px; margin-bottom:10px;">📭</p>
                    <p style="color:#9ca3af;">Belum ada data tidak tertarik</p>
                    <p style="font-size:12px; color:#cbd5e1; margin-top:8px;">Drag card ke kolom Tidak Tertarik dan pilih OK</p>
                </div>
            `;
        } else {
            snap.forEach(doc => {
                const d = doc.data();
                html += `
                    <div class="db-item">
                        <div class="db-item-info">
                            <h4>${escapeHtml(d.nama)}</h4>
                            <p>${escapeHtml(d.hp)}</p>
                            <small style="font-size: 11px; color: #9ca3af;">Tanggal: ${d.tanggal ? new Date(d.tanggal).toLocaleDateString('id-ID') : '-'}</small>
                        </div>
                        <button onclick="openWA('${escapeHtml(d.hp)}')" style="background:#25D366;color:white;border:none;border-radius:8px;padding:6px 12px;cursor:pointer;">💬 WA</button>
                    </div>
                `;
            });
        }
        dbTidakList.innerHTML = html;
        console.log('DB Tidak HTML updated, length:', html.length);
    }, error => {
        console.error('Error loading DB Tidak Tertarik:', error);
        dbTidakList.innerHTML = '<p style="text-align:center;padding:40px;color:red;">Error loading data</p>';
    });
}

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
                legend: { position: 'right', labels: { usePointStyle: true, pointStyle: 'circle', font: { size: 11 } } }
            }
        }
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
        data: {
            labels: ['Baru', 'Dihubungi', 'Tertarik', 'Tidak Tertarik'],
            datasets: [{
                data: dataArr,
                backgroundColor: ['#8b5cf6', '#3b82f6', '#10b981', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 15,
                cutout: '65%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'right', labels: { usePointStyle: true, pointStyle: 'circle', font: { size: 11 } } }
            }
        }
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
                    card.addEventListener('click', (e) => { 
                        if (!e.target.classList.contains('whatsapp-icon')) {
                            openDetailProspek(card.dataset.id);
                        }
                    });
                });
            }
        }
        updateChartProspek(baru, dihubungi, tertarik, tidak);
        initDragAndDrop();
    });
}

// Notifikasi
const notifBtn = document.getElementById('notifBtn');
if (notifBtn) {
    notifBtn.addEventListener('click', () => {
        showNotif('Fitur notifikasi dalam pengembangan');
    });
}

// Detail Modal element (create if not exists)
if (!document.getElementById('detailModal')) {
    const detailModal = document.createElement('div');
    detailModal.id = 'detailModal';
    detailModal.className = 'modal';
    detailModal.innerHTML = '<div class="modal-content" id="detailContent"></div>';
    document.body.appendChild(detailModal);
}
