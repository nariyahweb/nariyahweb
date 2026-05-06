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

// Helper functions
function showNotif(msg, isError) { /* sama seperti sebelumnya */ }
function closeModal(modalId) { /* sama */ }
function openWA(hp) { /* sama */ }
function escapeHtml(text) { /* sama */ }
function isMobile() { return window.innerWidth <= 768; }
function updateSidebarBodyClass() { /* sama */ }

// Inisialisasi sidebar dan lainnya (sama seperti kode lama)
document.addEventListener('DOMContentLoaded', function() { /* ... */ });

// ========== PROFILE, LOGIN, LOGOUT, NAVIGATION (sama seperti sebelumnya) ==========
// ... (salin dari kode lama Anda, pastikan tidak terlewat)

// ========== DATABASE ARCHIVES untuk Closing, Tidak Tertarik, Nomor Salah, Commitment ==========
let selectedClosingIds = new Map(), selectedTidakIds = new Map(), selectedNomorSalahIds = new Map(), selectedCommitmentIds = new Map();

function loadDBClosing() { /* sama */ }
function loadDBTidak() { /* sama */ }
function loadDBNomorSalah() {
    if (!currentUser) return;
    db.collection('nomor_salah').where('user_id', '==', currentUser.uid).onSnapshot(snap => {
        let items = [];
        snap.forEach(doc => { const d = doc.data(); items.push({ id: doc.id, nama: d.nama, hp: d.hp, alasan: d.alasan, tanggal: d.deleted_at || d.created_at, checked: selectedNomorSalahIds.get(doc.id) || false }); });
        items.sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal));
        const html = items.map(item => `<div class="db-item"><input type="checkbox" class="db-item-checkbox" data-id="${item.id}" ${item.checked ? 'checked' : ''}><div class="db-item-info"><h4>${escapeHtml(item.nama)}</h4><p>${item.hp}</p><small>Alasan: ${item.alasan}<br>Tanggal: ${new Date(item.tanggal).toLocaleDateString('id-ID')}</small></div><div class="db-item-actions"><button class="db-item-wa" onclick="openWA('${item.hp}')">💬 WA</button><button class="db-item-delete" onclick="deleteDBItem('nomor_salah', '${item.id}')">🗑️ Hapus</button></div></div>`).join('');
        const container = document.getElementById('dbNomorSalahList');
        if (container) container.innerHTML = html || '<p style="text-align:center;padding:40px;">📭 Belum ada data nomor salah</p>';
        // checkbox handler
        document.querySelectorAll('#dbNomorSalahList .db-item-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = cb.dataset.id;
                cb.checked ? selectedNomorSalahIds.set(id, true) : selectedNomorSalahIds.delete(id);
                const checkboxes = document.querySelectorAll('#dbNomorSalahList .db-item-checkbox');
                const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(c => c.checked);
                const btn = document.getElementById('selectAllNomorSalah');
                if (btn) btn.textContent = allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua';
            });
        });
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
        document.querySelectorAll('#dbCommitmentList .db-item-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = cb.dataset.id;
                cb.checked ? selectedCommitmentIds.set(id, true) : selectedCommitmentIds.delete(id);
                const checkboxes = document.querySelectorAll('#dbCommitmentList .db-item-checkbox');
                const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(c => c.checked);
                const btn = document.getElementById('selectAllCommitment');
                if (btn) btn.textContent = allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua';
            });
        });
    });
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

window.deleteSelectedClosing = async function() { /* sama */ };
window.deleteSelectedTidak = async function() { /* sama */ };
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

// Ubah page navigation untuk menampilkan halaman database baru
document.querySelectorAll('.menu-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;
        const pages = ['dashboardPage', 'importPage', 'dbClosingPage', 'dbTidakPage', 'dbNomorSalahPage', 'dbCommitmentPage', 'reminderPage', 'pesanPage', 'broadcastPage'];
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
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        item.classList.add('active');
        if (window.innerWidth <= 768) document.getElementById('sidebar')?.classList.remove('active');
        updateSidebarBodyClass();
    });
});

// ========== CUSTOMER CRUD (dengan tambahan field followup_data, pending_data) ==========
document.getElementById('saveCustomerBtn')?.addEventListener('click', () => { /* sama tapi tambahkan followup_data: null, pending_data: [] */ });
// (gunakan kode saveCustomer yang sudah ada, hanya tambahkan field default)

// ========== DETAIL MODAL dengan tombol baru untuk followup dan pending ==========
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
        // Tampilkan data followup_data dan pending_data jika ada
        let followupInfo = '';
        if (d.followup_data) {
            followupInfo = `<div class="detail-info-item"><div class="detail-info-icon">✅</div><div class="detail-info-content"><label>Follow Up</label><div class="value">Terkirim: ${d.followup_data.terkirim ? 'Ya' : 'Tidak'} | Dibalas: ${d.followup_data.dibalas ? 'Ya' : 'Tidak'}</div></div></div>`;
        }
        let pendingInfo = '';
        if (d.pending_data && d.pending_data.length) {
            pendingInfo = `<div class="detail-info-item"><div class="detail-info-icon">📝</div><div class="detail-info-content"><label>Pending Responses</label><div class="value">${d.pending_data.length} balasan tercatat</div></div></div>`;
        }
        document.getElementById('detailContent').innerHTML = `... (salin dari kode lama, dan tambahkan followupInfo dan pendingInfo di dalam detail-info) ...`;
        showModal('detailModal');
    });
}

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

// ========== PENDING MODAL DINAMIS ==========
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

// ========== PROSPEK DIHUBUNGI KUESIONER ==========
function openProspekDihubungiModal(id) {
    currentProspekId = id;
    // Reset form
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

// Ubah updateProspekStatus untuk memvalidasi kuesioner
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
            // Pindahkan ke db_tidak_tertarik
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

// Ubah showConvertToCustomerModal untuk menyimpan ke DB Commitment dan customers
window.showConvertToCustomerModal = async function(prospekId) {
    const doc = await db.collection('prospek').doc(prospekId).get();
    const data = doc.data();
    if (!data.dihubungi_data) {
        showNotif('⚠️ Data prospek belum lengkap, isi kuesioner dulu!', true);
        openProspekDihubungiModal(prospekId);
        return;
    }
    // Simpan ke DB Commitment
    await db.collection('db_commitment').add({
        nama: data.nama,
        hp: data.hp,
        dihubungi_data: data.dihubungi_data,
        committed_at: new Date().toISOString(),
        user_id: currentUser.uid,
        original_prospek_id: prospekId
    });
    // Tambah ke customers (Followup Agen) dengan deadline +1 bulan
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
        apk: '', agent_id: '', // kosong, bisa diisi nanti
    });
    await db.collection('prospek').doc(prospekId).delete();
    showNotif('✅ Prospek telah dijadikan customer dan disimpan ke DB Commitment');
    closeModal('detailModal');
    closeModal('convertModal');
    loadAllData();
};

// ========== UPDATE CUSTOMER STATUS (untuk 'baru' ke 'followup') ==========
window.updateCustomerStatus = function(id, newStatus) {
    if (newStatus === 'followup') {
        db.collection('customers').doc(id).update({ status: 'followup' });
        closeModal('detailModal');
        showNotif('Status berhasil diupdate ke Follow Up');
        loadAllData();
    }
};

// ========== LOAD ALL DATA (sama seperti sebelumnya, tapi pastikan menampilkan data followup_data dan pending_data di card? tidak perlu) ==========
// (gunakan kode loadAllData yang sudah ada, hanya pastikan ketika render card item tidak ada perubahan)
// Untuk pending, kita tidak perlu menampilkan apapun di card, cukup di modal.

// ========== NOTIFIKASI DEADLINE (sama) ==========
async function updateDeadlineBadge() { /* sama */ }
async function updatePesanBadge() { /* sama */ }
async function updateAllBadges() { /* sama */ }

// ========== IMPORT EXCEL, REMINDER, PESAN, BROADCAST (sama seperti sebelumnya) ==========
// ... salin dari kode lama

// ========== DOWNLOAD CONTOH FILE (sama) ==========
document.getElementById('downloadCustomerExample')?.addEventListener('click', () => { /* sama */ });
document.getElementById('downloadProspekExample')?.addEventListener('click', () => { /* sama */ });

// Pastikan Anda menambahkan event listener untuk tombol select all di database baru
document.getElementById('selectAllNomorSalah')?.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('#dbNomorSalahList .db-item-checkbox');
    const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => { cb.checked = !allChecked; const id = cb.dataset.id; !allChecked ? selectedNomorSalahIds.set(id, true) : selectedNomorSalahIds.delete(id); });
    const btn = document.getElementById('selectAllNomorSalah');
    if (btn) btn.textContent = !allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua';
});
document.getElementById('deleteSelectedNomorSalah')?.addEventListener('click', deleteSelectedNomorSalah);
document.getElementById('selectAllCommitment')?.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('#dbCommitmentList .db-item-checkbox');
    const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => { cb.checked = !allChecked; const id = cb.dataset.id; !allChecked ? selectedCommitmentIds.set(id, true) : selectedCommitmentIds.delete(id); });
    const btn = document.getElementById('selectAllCommitment');
    if (btn) btn.textContent = !allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua';
});
document.getElementById('deleteSelectedCommitment')?.addEventListener('click', deleteSelectedCommitment);

// Pastikan juga fungsi saveToClosingDB dan confirmClosing sudah ada (tidak berubah)
