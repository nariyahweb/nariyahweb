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

// ========== TOGGLE PASSWORD ==========
document.getElementById('togglePasswordBtn')?.addEventListener('click', function() {
    const input = document.getElementById('loginPassword');
    if (input.type === 'password') {
        input.type = 'text';
        this.textContent = '🙈';
    } else {
        input.type = 'password';
        this.textContent = '👁️';
    }
});

// ========== LOGIN ==========
document.getElementById('loginBtn')?.addEventListener('click', function() {
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

// ========== LOGOUT ==========
document.getElementById('logoutBtn')?.addEventListener('click', () => auth.signOut());

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
                if (doc.data().nama) nama = doc.data().nama;
                if (doc.data().foto) foto = doc.data().foto;
            }
            document.getElementById('topUserName').innerText = nama;
            document.getElementById('profileName').value = nama;
            document.getElementById('topProfileImg').src = foto;
            document.getElementById('previewFoto').src = foto;
        });
        
        document.getElementById('profileEmail').value = user.email;
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
        
        if (page === 'dashboard') document.getElementById('dashboardPage').style.display = 'block';
        else if (page === 'import') document.getElementById('importPage').style.display = 'block';
        else if (page === 'dbClosing') {
            document.getElementById('dbClosingPage').style.display = 'block';
            loadDBClosing();
        } else if (page === 'dbTidak') {
            document.getElementById('dbTidakPage').style.display = 'block';
            loadDBTidak();
        }
        
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        item.classList.add('active');
        
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar')?.classList.remove('active');
        }
    });
});

// ========== SIDEBAR FUNCTIONS ==========
function isMobile() { return window.innerWidth <= 768; }

document.getElementById('hoverZone')?.addEventListener('mouseenter', function() {
    if (!isMobile()) document.getElementById('sidebar')?.classList.add('active');
});

const sidebar = document.getElementById('sidebar');
if (sidebar) {
    sidebar.addEventListener('mouseleave', function() {
        if (!isMobile()) {
            setTimeout(() => sidebar.classList.remove('active'), 200);
        }
    });
    sidebar.addEventListener('mouseenter', () => clearTimeout());
}

document.getElementById('toggleSidebarBtn')?.addEventListener('click', function(e) {
    e.stopPropagation();
    document.getElementById('sidebar')?.classList.toggle('active');
});

document.addEventListener('click', function(e) {
    if (isMobile() && sidebar && !sidebar.contains(e.target) && e.target !== document.getElementById('toggleSidebarBtn')) {
        sidebar.classList.remove('active');
    }
});

window.addEventListener('resize', function() {
    if (!isMobile() && sidebar) sidebar.classList.add('active');
    else if (isMobile() && sidebar) sidebar.classList.remove('active');
});

// ========== CLOSE MODALS ==========
document.querySelectorAll('.closeModalBtn').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
});

// ========== PROFILE ==========
document.getElementById('profileImg')?.addEventListener('click', () => {
    document.getElementById('profileModal').style.display = 'flex';
});

document.getElementById('previewFoto')?.addEventListener('click', () => {
    document.getElementById('profileFoto').click();
});

document.getElementById('profileFoto')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        if (file.size > 1024 * 1024) {
            showNotif('Ukuran foto maksimal 1MB', true);
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('previewFoto').src = e.target.result;
            document.getElementById('topProfileImg').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('saveProfileBtn')?.addEventListener('click', async () => {
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
        
        document.getElementById('topUserName').innerText = nama;
        closeModal('profileModal');
        showNotif('Profile tersimpan');
    } catch (e) {
        showNotif('Gagal: ' + e.message, true);
    }
});

// ========== CUSTOMER CRUD ==========
document.getElementById('addCustomerBtn')?.addEventListener('click', () => {
    document.getElementById('customerModal').style.display = 'flex';
});

document.getElementById('saveCustomerBtn')?.addEventListener('click', () => {
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

// ========== PROSPEK CRUD ==========
document.getElementById('addProspekBtn')?.addEventListener('click', () => {
    document.getElementById('prospekModal').style.display = 'flex';
});

document.getElementById('saveProspekBtn')?.addEventListener('click', () => {
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

// ========== DETAIL MODAL ==========
function openDetailCustomer(id) {
    db.collection('customers').doc(id).get().then(doc => {
        const d = doc.data();
        const content = document.getElementById('detailContent');
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
document.getElementById('dropZone')?.addEventListener('click', () => {
    document.getElementById('excelFile').click();
});

document.getElementById('excelFile')?.addEventListener('change', function(e) {
    if (e.target.files[0]) {
        document.getElementById('fileInfo').innerHTML = '📄 ' + e.target.files[0].name;
    }
});

document.querySelectorAll('.radio-option').forEach(opt => {
    opt.addEventListener('click', function() {
        importType = this.dataset.import;
        document.querySelectorAll('.radio-option').forEach(o => o.classList.remove('active'));
        this.classList.add('active');
    });
});

document.getElementById('importBtn')?.addEventListener('click', async () => {
    const file = document.getElementById('excelFile').files[0];
    if (!file) {
        showNotif('Pilih file dulu!', true);
        return;
    }
    
    const btn = document.getElementById('importBtn');
    btn.textContent = 'Memproses...';
    btn.disabled = true;
    
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
                await db.collection('prospek').add({
                    nama: nama, hp: hp, status: 'Baru',
                    user_id: currentUser.uid, created_at: new Date().toISOString()
                });
            } else {
                await db.collection('customers').add({
                    nama: nama, hp: hp,
                    tanggal: new Date().toISOString().split('T')[0],
                    status: 'baru', user_id: currentUser.uid, created_at: new Date().toISOString()
                });
            }
            success++;
        }
        
        alert(`Selesai!\nBerhasil: ${success}\nGagal: ${failed}`);
        document.getElementById('excelFile').value = '';
        document.getElementById('fileInfo').innerHTML = '';
        btn.textContent = '🚀 Import Data Sekarang';
        btn.disabled = false;
    };
    reader.readAsArrayBuffer(file);
});

// ========== DATABASE ARCHIVES ==========
function loadDBClosing() {
    if (!currentUser) return;
    db.collection('db_closing').where('user_id', '==', currentUser.uid).get().then(snap => {
        let html = '';
        snap.forEach(doc => {
            const d = doc.data();
            html += `<div class="db-item"><div class="db-item-info"><h4>${escapeHtml(d.nama)}</h4><p>${d.hp}</p><small>Closing: ${new Date(d.closing_date).toLocaleDateString('id-ID')}</small></div><button onclick="openWA('${d.hp}')">WhatsApp</button></div>`;
        });
        document.getElementById('dbClosingList').innerHTML = html || '<p style="text-align:center;padding:40px;">Tidak ada data</p>';
    });
}

function loadDBTidak() {
    if (!currentUser) return;
    db.collection('db_tidak_tertarik').where('user_id', '==', currentUser.uid).get().then(snap => {
        let html = '';
        snap.forEach(doc => {
            const d = doc.data();
            html += `<div class="db-item"><div class="db-item-info"><h4>${escapeHtml(d.nama)}</h4><p>${d.hp}</p><small>Tanggal: ${new Date(d.tanggal).toLocaleDateString('id-ID')}</small></div><button onclick="openWA('${d.hp}')">WhatsApp</button></div>`;
        });
        document.getElementById('dbTidakList').innerHTML = html || '<p style="text-align:center;padding:40px;">Tidak ada data</p>';
    });
}

// ========== CHARTS ==========
function updateChartCustomer(total, closing, pending, followup) {
    const ctx = document.getElementById('chartCustomer');
    if (!ctx) return;
    if (chartCustomer) chartCustomer.destroy();
    chartCustomer = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: ['Closing', 'Pending', 'Follow Up', 'Baru'], datasets: [{ data: [closing, pending, followup, total - (closing + pending + followup)], backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'], borderWidth: 0, hoverOffset: 12 }] },
        options: { responsive: true, maintainAspectRatio: true, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle' } } } }
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
        data: { labels: ['Baru', 'Dihubungi', 'Tertarik', 'Tidak'], datasets: [{ data: dataArr, backgroundColor: ['#8b5cf6', '#3b82f6', '#10b981', '#ef4444'], borderWidth: 0, hoverOffset: 12 }] },
        options: { responsive: true, maintainAspectRatio: true, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle' } } } }
    });
}

// ========== DRAG AND DROP ==========
function initDragAndDrop() {
    // Customer drag and drop
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
    
    // Prospek drag and drop
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
                container.innerHTML = lists[status].map(item => `<div class="card-item" data-id="${item.id}"><div class="card-name">${escapeHtml(item.nama)}</div><div class="card-phone"><span>${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">🟢</span></div></div>`).join('');
                container.querySelectorAll('.card-item').forEach(card => {
                    card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailCustomer(card.dataset.id); });
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
                container.innerHTML = lists[col].map(item => `<div class="card-item" data-id="${item.id}"><div class="card-name">${escapeHtml(item.nama)}</div><div class="card-phone"><span>${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">🟢</span></div></div>`).join('');
                container.querySelectorAll('.card-item').forEach(card => {
                    card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailProspek(card.dataset.id); });
                });
            }
        }
        updateChartProspek(baru, dihubungi, tertarik, tidak);
        initDragAndDrop();
    });
}

// Notifikasi
document.getElementById('notifBtn')?.addEventListener('click', () => {
    showNotif('Fitur notifikasi dalam pengembangan');
});
