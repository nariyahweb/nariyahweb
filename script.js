// ==================== FIREBASE KONFIGURASI ====================
const firebaseConfig = {
    apiKey: "AIzaSyCfj2Xdj6et3fThyA2gg-GWG8yZOhoqREA",
    authDomain: "floupyud.firebaseapp.com",
    projectId: "floupyud"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==================== VARIABEL GLOBAL ====================
db.settings({ persistence: false });

let currentUser = null;
let currentUserRole = 'cs';
let currentUserName = '';
let importType = "prospek";
let chartCustomer = null;
let chartProspek = null;
let sidebarTimeout = null;
let currentConvertProspekId = null;
let currentPendingId = null;
let pendingItems = [];
let currentProspekId = null;
let tarifAdminData = [];
let currentEditTarifId = null;
let customersData = [];
let prospekData = [];
let selectedAgentIds = new Map();
let selectedProdukIds = new Map();
let agentsData = [];
let agentsFilteredData = [];
let produkData = [];
let currentEditProdukId = null;
let currentAgentIdForProduct = null;
let currentAgentProducts = [];
let trendChart = null;
let currentTransaksiId = null;
let transaksiList = [];
let targetData = {
    agent: 0,
    ca: 0,
    koordinator: 0,
    transaksi: 0,
    monthlyTargets: []
};
let targetChart = null;
let activeProgress = null;
let currentEditItem = null;
let currentEditType = null;
let selectedClosingIds = new Map();
let selectedTidakIds = new Map();
let selectedNomorSalahIds = new Map();
let selectedCommitmentIds = new Map();
let savedTemplates = [];
let currentNumbers = [];
let currentBroadcastIndex = 0;
let broadcastNumbers = [];
let broadcastMessageTemplate = '';
let isBroadcasting = false;
let broadcastStatus = [];
let currentTarifData = [];
let produkMapCache = null;
let deleteProgressContainer = null;

// ==================== FLOATING PROGRESS UNIVERSAL ====================
function showFloatingProgress(title, total = 0) {
    if (activeProgress) {
        activeProgress.remove();
        activeProgress = null;
    }
    
    const container = document.createElement('div');
    container.className = 'floating-progress';
    container.innerHTML = `
        <button class="progress-close" id="progressCloseBtn">✕</button>
        <div class="progress-status" id="progressStatus">
            <span class="spinner"></span>
            <span id="progressStatusText">${title}</span>
        </div>
        <div class="progress-bar-wrapper">
            <div class="progress-bar-track">
                <div class="progress-bar-fill-custom" id="floatingProgressFill"></div>
            </div>
            <div class="progress-text" id="floatingProgressText">0%</div>
        </div>
        <div class="progress-detail">
            <span id="floatingProgressDetail">Memulai proses...</span>
            <span class="progress-count" id="floatingProgressCount">${total > 0 ? `0 / ${total}` : ''}</span>
        </div>
    `;
    
    document.body.appendChild(container);
    activeProgress = container;
    
    const closeBtn = container.querySelector('#progressCloseBtn');
    if (closeBtn) closeBtn.onclick = () => { if (activeProgress) { activeProgress.remove(); activeProgress = null; } };
    
    return {
        update: (percent, status, detail, current = 0, totalCount = 0) => {
            const fillEl = document.getElementById('floatingProgressFill');
            const textEl = document.getElementById('floatingProgressText');
            const statusEl = document.getElementById('progressStatusText');
            const detailEl = document.getElementById('floatingProgressDetail');
            const countEl = document.getElementById('floatingProgressCount');
            if (fillEl) fillEl.style.width = `${Math.min(100, Math.max(0, percent))}%`;
            if (textEl) textEl.innerHTML = `${Math.floor(percent)}%`;
            if (statusEl && status) statusEl.innerHTML = status;
            if (detailEl && detail) detailEl.innerHTML = detail;
            if (countEl && totalCount > 0) countEl.innerHTML = `${current} / ${totalCount}`;
        },
        hide: () => {
            if (activeProgress) {
                activeProgress.style.animation = 'slideOutRight 0.3s ease-in forwards';
                setTimeout(() => { if (activeProgress) { activeProgress.remove(); activeProgress = null; } }, 300);
            }
        },
        setTotal: (newTotal) => { const countEl = document.getElementById('floatingProgressCount'); if (countEl) countEl.innerHTML = `0 / ${newTotal}`; }
    };
}

// Animasi keluar
const style = document.createElement('style');
style.textContent = `@keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }`;
document.head.appendChild(style);

// ==================== HELPER FUNCTIONS ====================
function showNotif(msg, isError = false) {
    const notif = document.createElement('div');
    notif.textContent = msg;
    notif.className = `notif-toast ${isError ? 'notif-error' : 'notif-success'}`;
    document.getElementById('notifBox').appendChild(notif);
    setTimeout(() => notif.remove(), 5000);
}

function showNotifTop(msg, isError = false) {
    console.log('showNotifTop dipanggil:', msg);
    const notif = document.createElement('div');
    notif.textContent = msg;
    notif.className = `notif-toast ${isError ? 'notif-error' : 'notif-success'}`;
    notif.style.cssText = 'z-index: 999999999; position: fixed; top: 20px; right: 20px; max-width: 350px; background: ' + (isError ? '#ef4444' : '#4f46e5') + '; color: white; padding: 10px 16px; border-radius: 12px; margin-bottom: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);';
    document.getElementById('notifBox').appendChild(notif);
    setTimeout(() => notif.remove(), 5000);
}

function openWA(hp) {
    if (!hp) return;
    let nomor = hp.toString().replace('+', '').replace(/^0/, '62');
    window.open('https://wa.me/' + nomor, '_blank');
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const str = String(text);
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
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

function addDaysToDate(dateStr, days) {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

function getTodayDate() { return new Date().toISOString().split('T')[0]; }

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
    if (value.length > 0 && !value.startsWith('8')) value = '8' + value;
    input.value = value;
}

function formatPhoneNumber(value) {
    if (!value) return '';
    let cleanHp = value.toString().trim();
    cleanHp = cleanHp.replace(/[^\d+]/g, '');
    if (!cleanHp.startsWith('+')) {
        cleanHp = cleanHp.replace(/^0+/, '');
        if (cleanHp.startsWith('62')) cleanHp = '+' + cleanHp;
        else if (cleanHp.match(/^\d+$/)) cleanHp = '+62' + cleanHp;
        else cleanHp = '+' + cleanHp.replace(/^\+/, '');
    }
    return cleanHp;
}

function formatRupiah(angka) {
    if (!angka) return 'Rp 0';
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
}

function setupModalClickOutside(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.removeEventListener('click', modal._clickOutsideHandler);
    modal._clickOutsideHandler = function(e) { if (e.target === modal) closeModal(modalId); };
    modal.addEventListener('click', modal._clickOutsideHandler);
}

// ==================== TARGET & KPI FUNCTIONS ====================
async function loadTargetData() {
    if (!currentUser) { console.log('loadTargetData: No user logged in'); return; }
    try {
        console.log('loadTargetData: Fetching target data...');
        const targetDoc = await db.collection('settings').doc('targetKPI').get();
        if (targetDoc.exists) {
            targetData = targetDoc.data();
            console.log('loadTargetData: Data ditemukan', targetData);
        } else {
            targetData = { agent: 10, ca: 20, koordinator: 5, transaksi: 100, monthlyTargets: [], updated_at: new Date().toISOString() };
            console.log('loadTargetData: Data default digunakan', targetData);
        }
        await updateTargetDisplay();
    } catch(e) { console.error('Error load target:', e); showNotifTop('❌ Gagal memuat target: ' + e.message, true); }
}

async function updateTargetDisplay() {
    console.log('updateTargetDisplay dipanggil, targetData:', targetData);
    const currentAgent = agentsData.filter(a => a.agent_type === 'AGENT').length;
    const currentKoor = agentsData.filter(a => a.agent_type === 'Koordinator Wilayah (KORWIL)' || a.agent_type === 'SUB KORWIL').length;
    const currentCA = agentsData.filter(a => a.agent_type === 'CollectingAgent (CA)' || a.agent_type === 'SUB CA').length;
    let currentTransaksi = window.totalTransaksiGlobal || 0;
    console.log('Pencapaian:', { currentAgent, currentKoor, currentCA, currentTransaksi });
    
    const targetAgentEl = document.getElementById('targetAgentValue');
    const targetKoorEl = document.getElementById('targetKoorValue');
    const targetCAEl = document.getElementById('targetCAValue');
    const targetTransaksiEl = document.getElementById('targetTransaksiValue');
    if (targetAgentEl) targetAgentEl.innerText = targetData.agent || 0;
    if (targetKoorEl) targetKoorEl.innerText = targetData.koordinator || 0;
    if (targetCAEl) targetCAEl.innerText = targetData.ca || 0;
    if (targetTransaksiEl) targetTransaksiEl.innerText = (targetData.transaksi || 0).toLocaleString('id-ID');
    
    const reachedAgentEl = document.getElementById('targetAgentReached');
    const reachedKoorEl = document.getElementById('targetKoorReached');
    const reachedCAEl = document.getElementById('targetCAReached');
    const reachedTransaksiEl = document.getElementById('targetTransaksiReached');
    if (reachedAgentEl) reachedAgentEl.innerText = currentAgent;
    if (reachedKoorEl) reachedKoorEl.innerText = currentKoor;
    if (reachedCAEl) reachedCAEl.innerText = currentCA;
    if (reachedTransaksiEl) reachedTransaksiEl.innerText = currentTransaksi.toLocaleString('id-ID');
    
    const agentPercent = targetData.agent ? Math.min((currentAgent / targetData.agent) * 100, 100) : 0;
    const koorPercent = targetData.koordinator ? Math.min((currentKoor / targetData.koordinator) * 100, 100) : 0;
    const caPercent = targetData.ca ? Math.min((currentCA / targetData.ca) * 100, 100) : 0;
    const transaksiPercent = targetData.transaksi ? Math.min((currentTransaksi / targetData.transaksi) * 100, 100) : 0;
    
    const progressAgent = document.getElementById('targetAgentProgress');
    const progressKoor = document.getElementById('targetKoorProgress');
    const progressCA = document.getElementById('targetCAProgress');
    const progressTransaksi = document.getElementById('targetTransaksiProgress');
    if (progressAgent) progressAgent.style.width = agentPercent + '%';
    if (progressKoor) progressKoor.style.width = koorPercent + '%';
    if (progressCA) progressCA.style.width = caPercent + '%';
    if (progressTransaksi) progressTransaksi.style.width = transaksiPercent + '%';
    
    updateTargetChart([agentPercent, koorPercent, caPercent, transaksiPercent]);
    updateTrendChart();
    console.log('updateTargetDisplay selesai');
}

async function hitungTotalTransaksiBulanIni() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    let query = db.collection('db_closing');
    if (currentUserRole !== 'owner') query = query.where('user_id', '==', currentUser.uid);
    const snapshot = await query.get();
    let totalTransaksi = 0;
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.closing_date) {
            const closingDate = new Date(data.closing_date);
            if (closingDate >= startOfMonth && closingDate <= endOfMonth) totalTransaksi++;
        }
    });
    return totalTransaksi;
}

function updateTargetChart(percentages) {
    const ctx = document.getElementById('targetChart');
    if (!ctx) return;
    if (targetChart) targetChart.destroy();
    targetChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: ['Agent', 'Koordinator', 'CA', 'Transaksi'], datasets: [{ label: 'Pencapaian Target (%)', data: percentages, backgroundColor: ['#667eea', '#4facfe', '#f093fb', '#fa709a'], borderRadius: 8, barPercentage: 0.6 }] },
        options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'Persentase (%)' } } }, plugins: { tooltip: { callbacks: { label: (context) => `${context.raw.toFixed(1)}%` } } } }
    });
}

async function updateTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    if (trendChart) trendChart.destroy();
    const months = []; const agentData = []; const caData = []; const koorData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = month.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        months.push(monthName);
        const monthlyTarget = targetData.monthlyTargets?.find(m => m.month === month.toISOString().slice(0,7));
        agentData.push(monthlyTarget?.target_agent || Math.floor(Math.random() * 10));
        caData.push(monthlyTarget?.target_ca || Math.floor(Math.random() * 20));
        koorData.push(monthlyTarget?.target_koor || Math.floor(Math.random() * 5));
    }
    trendChart = new Chart(ctx, {
        type: 'line',
        data: { labels: months, datasets: [{ label: 'Agent', data: agentData, borderColor: '#667eea', backgroundColor: 'transparent', tension: 0.4 }, { label: 'CA', data: caData, borderColor: '#f093fb', backgroundColor: 'transparent', tension: 0.4 }, { label: 'Koordinator', data: koorData, borderColor: '#4facfe', backgroundColor: 'transparent', tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' } } }
    });
}

async function saveTargetData() {
    console.log('saveTargetData: Menyimpan target...');
    const agentVal = parseInt(document.getElementById('targetAgentInput')?.value) || 0;
    const koorVal = parseInt(document.getElementById('targetKoorInput')?.value) || 0;
    const caVal = parseInt(document.getElementById('targetCAInput')?.value) || 0;
    const transaksiVal = parseInt(document.getElementById('targetTransaksiInput')?.value) || 0;
    console.log('Nilai yang disimpan:', { agent: agentVal, koordinator: koorVal, ca: caVal, transaksi: transaksiVal });
    const newTarget = { agent: agentVal, koordinator: koorVal, ca: caVal, transaksi: transaksiVal, monthlyTargets: targetData.monthlyTargets || [], updated_at: new Date().toISOString(), updated_by: currentUser?.uid || 'unknown' };
    try {
        await db.collection('settings').doc('targetKPI').set(newTarget, { merge: true });
        targetData = newTarget;
        console.log('saveTargetData: Berhasil disimpan');
        showNotifTop('✅ Target berhasil disimpan!');
        closeModal('manageTargetModal');
        await updateTargetDisplay();
    } catch(error) { console.error('Error saving target:', error); showNotifTop('❌ Gagal menyimpan target: ' + error.message, true); }
}

function renderMonthlyTargetList() {
    const container = document.getElementById('monthlyTargetList');
    if (!container) return;
    if (!targetData.monthlyTargets || targetData.monthlyTargets.length === 0) { container.innerHTML = '<p style="color:#9ca3af; text-align:center; padding:20px;">Belum ada target bulanan</p>'; return; }
    container.innerHTML = targetData.monthlyTargets.map((item, idx) => `<div style="display: flex; gap: 8px; margin-bottom: 10px; align-items: center; flex-wrap: wrap;"><input type="month" value="${item.month}" data-idx="${idx}" class="month-input" style="flex:2; min-width:120px; padding: 8px; border-radius: 8px; border: 1px solid #e5e7eb;"><input type="number" value="${item.target_agent || 0}" placeholder="Agent" data-idx="${idx}" class="month-agent" style="flex:1; min-width:70px; padding: 8px; border-radius: 8px; border: 1px solid #e5e7eb;"><input type="number" value="${item.target_ca || 0}" placeholder="CA" data-idx="${idx}" class="month-ca" style="flex:1; min-width:70px; padding: 8px; border-radius: 8px; border: 1px solid #e5e7eb;"><input type="number" value="${item.target_koor || 0}" placeholder="Koor" data-idx="${idx}" class="month-koor" style="flex:1; min-width:70px; padding: 8px; border-radius: 8px; border: 1px solid #e5e7eb;"><button class="delete-monthly-btn" data-idx="${idx}" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer;">🗑️</button></div>`).join('');
    
    document.querySelectorAll('.month-input').forEach(input => { const newInput = input.cloneNode(true); input.parentNode.replaceChild(newInput, input); newInput.addEventListener('change', (e) => { const idx = parseInt(e.target.dataset.idx); targetData.monthlyTargets[idx].month = e.target.value; }); });
    document.querySelectorAll('.month-agent').forEach(input => { const newInput = input.cloneNode(true); input.parentNode.replaceChild(newInput, input); newInput.addEventListener('change', (e) => { const idx = parseInt(e.target.dataset.idx); targetData.monthlyTargets[idx].target_agent = parseInt(e.target.value) || 0; }); });
    document.querySelectorAll('.month-ca').forEach(input => { const newInput = input.cloneNode(true); input.parentNode.replaceChild(newInput, input); newInput.addEventListener('change', (e) => { const idx = parseInt(e.target.dataset.idx); targetData.monthlyTargets[idx].target_ca = parseInt(e.target.value) || 0; }); });
    document.querySelectorAll('.month-koor').forEach(input => { const newInput = input.cloneNode(true); input.parentNode.replaceChild(newInput, input); newInput.addEventListener('change', (e) => { const idx = parseInt(e.target.dataset.idx); targetData.monthlyTargets[idx].target_koor = parseInt(e.target.value) || 0; }); });
    document.querySelectorAll('.delete-monthly-btn').forEach(btn => { const newBtn = btn.cloneNode(true); btn.parentNode.replaceChild(newBtn, btn); newBtn.addEventListener('click', (e) => { const idx = parseInt(e.target.dataset.idx); targetData.monthlyTargets.splice(idx, 1); renderMonthlyTargetList(); }); });
}

// ==================== TRANSAKSI GLOBAL FUNCTIONS ====================
async function loadTransaksiGlobal() {
    if (!currentUser) return;
    try {
        const snapshot = await db.collection('transaksi_global').orderBy('tanggal', 'desc').get();
        transaksiList = [];
        let totalTransaksiBulanIni = 0;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        snapshot.forEach(doc => {
            const data = doc.data();
            transaksiList.push({ id: doc.id, ...data });
            const tglTransaksi = new Date(data.tanggal);
            if (tglTransaksi >= startOfMonth && tglTransaksi <= endOfMonth) totalTransaksiBulanIni += data.nominal || 0;
        });
        window.totalTransaksiGlobal = totalTransaksiBulanIni;
        if (typeof updateTargetDisplay === 'function') await updateTargetDisplay();
        return totalTransaksiBulanIni;
    } catch(e) { console.error('Error load transaksi global:', e); return 0; }
}

async function saveTransaksiGlobal(nominal, keterangan, tanggal, transaksiId = null) {
    if (!currentUser) { showNotifTop('⚠️ Anda harus login terlebih dahulu!', true); return false; }
    if (!nominal || nominal <= 0) { showNotifTop('⚠️ Jumlah transaksi harus diisi dan lebih dari 0!', true); return false; }
    try {
        const transaksiRef = db.collection('transaksi_global');
        const data = { nominal: parseInt(nominal), keterangan: keterangan || '', tanggal: tanggal || new Date().toISOString().split('T')[0], created_at: new Date().toISOString(), created_by: currentUser.uid, created_by_name: currentUserName, updated_at: new Date().toISOString() };
        if (transaksiId) { await transaksiRef.doc(transaksiId).update(data); showNotifTop('✅ Transaksi berhasil diupdate!'); }
        else { await transaksiRef.add(data); showNotifTop('✅ Transaksi berhasil ditambahkan!'); }
        await loadTransaksiGlobal();
        return true;
    } catch(e) { console.error('Error save transaksi global:', e); showNotifTop('❌ Gagal menyimpan transaksi: ' + e.message, true); return false; }
}

async function deleteTransaksiGlobal(transaksiId) {
    if (!confirm('Yakin ingin menghapus transaksi ini?')) return;
    try { await db.collection('transaksi_global').doc(transaksiId).delete(); showNotifTop('🗑️ Transaksi dihapus'); await loadTransaksiGlobal(); renderTransaksiListGlobal(); }
    catch(e) { showNotifTop('❌ Gagal hapus: ' + e.message, true); }
}

function renderTransaksiListGlobal() {
    const container = document.getElementById('transaksiList');
    if (!container) return;
    if (transaksiList.length === 0) { container.innerHTML = '<p style="text-align:center; padding:40px; color:#9ca3af;">📭 Belum ada catatan transaksi</p>'; return; }
    container.innerHTML = transaksiList.map(item => `<div class="db-item" style="border-left: 3px solid #4f46e5; margin-bottom: 8px;"><div class="db-item-info"><h4>💰 ${formatRupiah(item.nominal)}</h4><p>${escapeHtml(item.keterangan || '-')}</p><small>📅 ${new Date(item.tanggal).toLocaleDateString('id-ID')} | 👤 oleh: ${escapeHtml(item.created_by_name || 'CS')}</small></div><div class="db-item-actions">${currentUserRole === 'owner' || item.created_by === currentUser.uid ? `<button class="db-item-edit" onclick="editTransaksiGlobal('${item.id}')">✏️ Edit</button><button class="db-item-delete" onclick="deleteTransaksiGlobal('${item.id}')">🗑️ Hapus</button>` : `<small style="color:#9ca3af;">Hanya pembuat yang bisa edit/hapus</small>`}</div></div>`).join('');
}

window.editTransaksiGlobal = function(id) {
    const transaksi = transaksiList.find(t => t.id === id);
    if (!transaksi) return;
    if (currentUserRole !== 'owner' && transaksi.created_by !== currentUser.uid) { showNotifTop('⚠️ Anda hanya bisa mengedit transaksi yang Anda buat sendiri!', true); return; }
    currentTransaksiId = id;
    document.getElementById('transaksiNominal').value = transaksi.nominal;
    document.getElementById('transaksiKeterangan').value = transaksi.keterangan || '';
    document.getElementById('transaksiTanggal').value = transaksi.tanggal;
    document.getElementById('inputTransaksiModal').style.display = 'flex';
};

function showInputTransaksiModal() {
    currentTransaksiId = null;
    document.getElementById('transaksiNominal').value = '';
    document.getElementById('transaksiKeterangan').value = '';
    document.getElementById('transaksiTanggal').value = new Date().toISOString().split('T')[0];
    document.getElementById('inputTransaksiModal').style.display = 'flex';
}

function showTransaksiListModal() { renderTransaksiListGlobal(); document.getElementById('transaksiListModal').style.display = 'flex'; }

// ==================== VALIDASI DUPLIKAT ====================
async function checkDuplicateCustomer(agentId, hp, excludeId = null) {
    let query = db.collection('customers').where('user_id', '==', currentUser.uid);
    const snapshot = await query.get();
    let duplicateAgent = null, duplicateHp = null;
    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (excludeId && doc.id === excludeId) continue;
        if (data.agent_id === agentId) duplicateAgent = { id: doc.id, nama: data.nama, owner: currentUserName };
        if (data.hp === hp) duplicateHp = { id: doc.id, nama: data.nama, owner: currentUserName };
    }
    if (currentUserRole === 'owner') {
        const allCustomers = await db.collection('customers').get();
        for (const doc of allCustomers.docs) {
            const data = doc.data();
            if (excludeId && doc.id === excludeId) continue;
            if (data.agent_id === agentId) { const userDoc = await db.collection('users').doc(data.user_id).get(); const userName = userDoc.exists ? userDoc.data().nama || 'CS Agent' : 'CS Agent'; duplicateAgent = { id: doc.id, nama: data.nama, owner: userName }; }
            if (data.hp === hp) { const userDoc = await db.collection('users').doc(data.user_id).get(); const userName = userDoc.exists ? userDoc.data().nama || 'CS Agent' : 'CS Agent'; duplicateHp = { id: doc.id, nama: data.nama, owner: userName }; }
        }
    }
    return { duplicateAgent, duplicateHp };
}

async function checkDuplicateProspek(hp, excludeId = null) {
    let query = db.collection('prospek').where('user_id', '==', currentUser.uid);
    const snapshot = await query.get();
    let duplicateHp = null;
    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (excludeId && doc.id === excludeId) continue;
        if (data.hp === hp) duplicateHp = { id: doc.id, nama: data.nama, owner: currentUserName };
    }
    if (currentUserRole === 'owner') {
        const allProspek = await db.collection('prospek').get();
        for (const doc of allProspek.docs) {
            const data = doc.data();
            if (excludeId && doc.id === excludeId) continue;
            if (data.hp === hp) { const userDoc = await db.collection('users').doc(data.user_id).get(); const userName = userDoc.exists ? userDoc.data().nama || 'CS Agent' : 'CS Agent'; duplicateHp = { id: doc.id, nama: data.nama, owner: userName }; }
        }
    }
    return duplicateHp;
}

// ==================== DIALOG FUNCTIONS ====================
function showConfirmDialog(title, message, onConfirm, onCancel) {
    const negosiasiModal = document.getElementById('prospekNegosiasiModal');
    let negosiasiWasOpen = false;
    if (negosiasiModal && negosiasiModal.style.display === 'flex') { negosiasiWasOpen = true; negosiasiModal.style.display = 'none'; }
    const existingConfirm = document.querySelector('.confirm-dialog-overlay');
    if (existingConfirm) existingConfirm.remove();
    const isDarkMode = document.body.classList.contains('dark-mode');
    const overlay = document.createElement('div');
    overlay.className = 'confirm-dialog-overlay';
    overlay.style.cssText = `position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; background: rgba(0, 0, 0, 0.5) !important; display: flex !important; justify-content: center !important; align-items: center !important; z-index: 99999999 !important; backdrop-filter: blur(4px);`;
    const dialogBgColor = isDarkMode ? '#1e293b' : 'white';
    const dialogTextColor = isDarkMode ? '#f1f5f9' : '#1f2937';
    const dialogSubtitleColor = isDarkMode ? '#94a3b8' : '#6b7280';
    const borderColor = isDarkMode ? '#334155' : '#f0f0f0';
    const warningColor = isDarkMode ? '#fca5a5' : '#ef4444';
    const btnCancelBg = isDarkMode ? '#334155' : '#f3f4f6';
    const btnCancelColor = isDarkMode ? '#f1f5f9' : '#374151';
    overlay.innerHTML = `<div class="confirm-dialog-content" style="background: ${dialogBgColor} !important; border-radius: 24px !important; max-width: 400px !important; width: 90% !important; z-index: 100000000 !important; position: relative !important; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important; border: 1px solid ${borderColor} !important;"><h3 style="color: ${dialogTextColor}; font-size: 20px; font-weight: 700; padding: 20px 20px 0; margin-bottom: 4px;">⚠️ ${title}</h3><div class="modal-subtitle" style="color: ${dialogSubtitleColor}; white-space: pre-line; padding: 0 20px 12px; border-bottom: 1px solid ${borderColor}; font-size: 12px;">${message}</div><div style="padding: 0 20px 20px 20px;"><p style="font-size: 12px; color: ${warningColor}; margin-bottom: 16px;">⚠️ Peringatan: Data yang sudah dipindahkan TIDAK BISA dikembalikan!</p><div class="modal-buttons" style="display: flex; gap: 12px; margin-top: 8px;"><button id="confirmYesBtn" style="flex: 1; padding: 12px; border: 0; border-radius: 14px; cursor: pointer; font-weight: 600; font-size: 13px; background: #dc2626; color: #fff;">✅ Ya, Lanjutkan</button><button id="confirmNoBtn" style="flex: 1; padding: 12px; border: 0; border-radius: 14px; cursor: pointer; font-weight: 600; font-size: 13px; background: ${btnCancelBg}; color: ${btnCancelColor};">❌ Batal</button></div></div></div>`;
    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    const cleanup = () => { overlay.remove(); document.body.classList.remove('modal-open'); document.body.style.overflow = ''; if (negosiasiWasOpen && negosiasiModal) negosiasiModal.style.display = 'flex'; };
    const yesBtn = overlay.querySelector('#confirmYesBtn');
    const noBtn = overlay.querySelector('#confirmNoBtn');
    yesBtn.onclick = () => { cleanup(); if (onConfirm) onConfirm(); };
    noBtn.onclick = () => { cleanup(); if (onCancel) onCancel(); };
    overlay.onclick = (e) => { if (e.target === overlay) { cleanup(); if (onCancel) onCancel(); } };
}

function showInputDialog(title, message, fields, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    let fieldsHtml = '';
    fields.forEach(field => {
        if (field.type === 'select') {
            let optionsHtml = '';
            field.options.forEach(opt => { optionsHtml += `<option value="${opt}">${opt}</option>`; });
            fieldsHtml += `<div class="form-group"><label>${field.label} ${field.required ? '<span class="required">*</span>' : ''}</label><select id="${field.id}" style="width:100%; padding:12px; border-radius:14px; border:1.5px solid #e5e7eb;"><option value="">Pilih ${field.label}</option>${optionsHtml}</select></div>`;
        } else {
            fieldsHtml += `<div class="form-group"><label>${field.label} ${field.required ? '<span class="required">*</span>' : ''}</label><input type="${field.type}" id="${field.id}" placeholder="${field.placeholder}" style="width:100%; padding:12px; border-radius:14px; border:1.5px solid #e5e7eb;"></div>`;
        }
    });
    modal.innerHTML = `<div class="modal-content" style="max-width: 450px;"><h3>${title}</h3><div class="modal-subtitle" style="white-space: pre-line;">${message}</div><div style="padding: 0 20px;">${fieldsHtml}</div><div class="modal-buttons"><button id="inputConfirmBtn" class="btn-primary">✅ Lanjutkan</button><button id="inputCancelBtn" class="btn-outline">❌ Batal</button></div></div>`;
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    const confirmBtn = modal.querySelector('#inputConfirmBtn');
    const cancelBtn = modal.querySelector('#inputCancelBtn');
    confirmBtn.onclick = () => {
        const values = {};
        let allFilled = true;
        fields.forEach(field => {
            const input = document.getElementById(field.id);
            if (input) { values[field.id] = input.value; if (field.required && !input.value) allFilled = false; }
        });
        if (!allFilled) { showNotif('⚠️ Semua field wajib diisi!', true); return; }
        modal.remove();
        document.body.classList.remove('modal-open');
        if (onConfirm) onConfirm(values);
    };
    cancelBtn.onclick = () => { modal.remove(); document.body.classList.remove('modal-open'); };
    modal.onclick = (e) => { if (e.target === modal) { modal.remove(); document.body.classList.remove('modal-open'); } };
}

// ==================== EDIT DEADLINE ====================
function openEditDeadlineModal(id, type, currentDeadline) {
    currentEditItem = id;
    currentEditType = type;
    const modal = document.getElementById('editDeadlineModal');
    if (!modal) return;
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '9999999';
    modal.style.backdropFilter = 'blur(4px)';
    document.getElementById('editDeadlineDate').value = currentDeadline || getTodayDate();
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
}

document.getElementById('saveDeadlineBtn')?.addEventListener('click', async () => {
    const newDeadline = document.getElementById('editDeadlineDate').value;
    if (!newDeadline) { showNotif('⚠️ Tanggal deadline harus diisi!', true); return; }
    try {
        if (currentEditType === 'customer') { await db.collection('customers').doc(currentEditItem).update({ tanggal: newDeadline }); showNotif('✅ Deadline customer berhasil diubah menjadi ' + newDeadline); }
        else if (currentEditType === 'prospek') { await db.collection('prospek').doc(currentEditItem).update({ deadline: newDeadline }); showNotif('✅ Deadline prospek berhasil diubah menjadi ' + newDeadline); }
        closeModal('editDeadlineModal');
        loadAllData();
    } catch(e) { showNotif('❌ Gagal: ' + e.message, true); }
});

document.getElementById('cancelDeadlineBtn')?.addEventListener('click', () => { closeModal('editDeadlineModal'); });

// ==================== TARIF ADMIN ====================
function setupTarifImport() {
    const importBtn = document.getElementById('importTarifExcelBtn');
    const fileInput = document.getElementById('tarifExcelFile');
    if (!importBtn || !fileInput) return;
    importBtn.removeEventListener('click', importBtn._handler);
    fileInput.removeEventListener('change', fileInput._handler);
    importBtn._handler = () => fileInput.click();
    importBtn.addEventListener('click', importBtn._handler);
    fileInput._handler = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        importBtn.textContent = '⏳ Memproses...';
        importBtn.disabled = true;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
                if (!json || json.length === 0) { showNotifTop('File Excel kosong!', true); return; }
                let success = 0, failed = 0;
                const errors = [];
                for (const row of json) {
                    try {
                        let cid = row.cid || row.CID || row.Cid || '';
                        let pospaid = row.pospaid || row.Pospaid || row.PLN_Pospaid || row.admin_pospaid || 0;
                        let prepaid = row.prepaid || row.Prepaid || row.PLN_Prepaid || row.admin_prepaid || 0;
                        let nontaglis = row.nontaglis || row.Nontaglis || row.PLN_Nontaglis || row.admin_nontaglis || 0;
                        if (!cid) { failed++; errors.push(`Baris ke-${json.indexOf(row)+2}: CID kosong`); continue; }
                        cid = cid.toString().trim();
                        const existing = tarifAdminData.find(t => t.cid === cid);
                        if (existing) { await db.collection('tarif_admin').doc(existing.id).update({ admin_pospaid: parseInt(pospaid) || 0, admin_prepaid: parseInt(prepaid) || 0, admin_nontaglis: parseInt(nontaglis) || 0, updated_at: new Date().toISOString() }); }
                        else { await db.collection('tarif_admin').add({ cid: cid, admin_pospaid: parseInt(pospaid) || 0, admin_prepaid: parseInt(prepaid) || 0, admin_nontaglis: parseInt(nontaglis) || 0, user_id: currentUser.uid, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }); }
                        success++;
                    } catch(err) { failed++; errors.push(`Baris ke-${json.indexOf(row)+2}: ${err.message}`); }
                }
                let resultMsg = `✅ Import selesai! Berhasil: ${success}, Gagal: ${failed}`;
                if (errors.length > 0 && errors.length <= 3) resultMsg += `\n\nError:\n${errors.join('\n')}`;
                else if (errors.length > 3) resultMsg += `\n\n${errors.length} error terjadi.`;
                showNotifTop(resultMsg, failed > 0);
                await loadTarifAdmin();
                fileInput.value = '';
            } catch(err) { showNotifTop('❌ Gagal import: ' + err.message, true); }
            finally { importBtn.textContent = '📥 Import Excel'; importBtn.disabled = false; }
        };
        reader.readAsArrayBuffer(file);
    };
    fileInput.addEventListener('change', fileInput._handler);
}

async function exportTarifToExcel() {
    if (tarifAdminData.length === 0) { showNotifTop('Tidak ada data untuk diexport', true); return; }
    const exportData = tarifAdminData.map(item => ({ 'CID': item.cid, 'PLN Pospaid (Admin)': item.admin_pospaid || 0, 'PLN Prepaid (Admin)': item.admin_prepaid || 0, 'PLN Nontaglis (Admin)': item.admin_nontaglis || 0, 'Terakhir Update': item.updated_at ? new Date(item.updated_at).toLocaleDateString('id-ID') : '-' }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Admin per CID');
    XLSX.writeFile(wb, `tarif_admin_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotifTop('✅ Export data berhasil!');
}

function downloadTarifExample() {
    const data = [{ cid: '5213247', pospaid: 7200, prepaid: 7200, nontaglis: 7200 }, { cid: '5213248', pospaid: 7500, prepaid: 7500, nontaglis: 7500 }, { cid: '5213249', pospaid: 7000, prepaid: 7000, nontaglis: 7000 }];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Admin per CID');
    XLSX.writeFile(wb, 'contoh_tarif_admin.xlsx');
    showNotifTop('📋 Contoh file Excel berhasil diunduh');
}

async function loadTarifAdmin() {
    if (!currentUser) return;
    const isOwner = currentUserRole === 'owner';
    let query = db.collection('tarif_admin');
    if (!isOwner) query = query.where('user_id', '==', currentUser.uid);
    const snapshot = await query.get();
    tarifAdminData = [];
    snapshot.forEach(doc => { tarifAdminData.push({ id: doc.id, ...doc.data() }); });
    renderTarifAdminList();
}

function renderTarifAdminList() {
    const container = document.getElementById('tarifAdminList');
    if (!container) return;
    const searchKeyword = document.getElementById('searchTarifInput')?.value.toLowerCase() || '';
    let filteredData = tarifAdminData;
    if (searchKeyword) filteredData = tarifAdminData.filter(item => item.cid.toLowerCase().includes(searchKeyword));
    if (filteredData.length === 0) { container.innerHTML = '<p style="text-align:center;padding:40px;">🏷️ Tidak ada data admin per CID</p>'; return; }
    container.innerHTML = filteredData.map(item => `<div class="db-item" data-id="${item.id}"><div class="db-item-info"><h4>🆔 CID: ${escapeHtml(item.cid)}</h4><p>⚡ PLN Pospaid: ${formatRupiah(item.admin_pospaid || 0)}<br>⚡ PLN Prepaid: ${formatRupiah(item.admin_prepaid || 0)}<br>⚡ PLN Nontaglis: ${formatRupiah(item.admin_nontaglis || 0)}</p><small>Terakhir update: ${item.updated_at ? new Date(item.updated_at).toLocaleString('id-ID') : '-'}</small></div><div class="db-item-actions"><button class="db-item-edit" onclick="editTarifAdmin('${item.id}')">✏️ Edit</button><button class="db-item-delete" onclick="deleteTarifAdmin('${item.id}')">🗑️ Hapus</button></div></div>`).join('');
}

document.getElementById('searchTarifInput')?.addEventListener('input', () => { renderTarifAdminList(); });

async function saveTarifAdmin(cid, pospaid, prepaid, nontaglis, id = null) {
    if (!cid) { showNotifTop('⚠️ CID wajib diisi!', true); return false; }
    const data = { cid: cid, admin_pospaid: parseInt(pospaid) || 0, admin_prepaid: parseInt(prepaid) || 0, admin_nontaglis: parseInt(nontaglis) || 0, user_id: currentUser.uid, updated_at: new Date().toISOString() };
    try {
        if (id) { await db.collection('tarif_admin').doc(id).update(data); showNotifTop('✅ Data admin per CID berhasil diupdate'); }
        else {
            const existing = tarifAdminData.find(t => t.cid === cid);
            if (existing) { showNotifTop(`⚠️ CID ${cid} sudah ada! Silakan edit data yang sudah ada.`, true); return false; }
            data.created_at = new Date().toISOString();
            await db.collection('tarif_admin').add(data);
            showNotifTop('✅ Data admin per CID berhasil ditambahkan');
        }
        await loadTarifAdmin();
        return true;
    } catch(e) { showNotifTop('❌ Gagal: ' + e.message, true); return false; }
}

async function deleteTarifAdmin(id) {
    if (!confirm('Yakin hapus data admin per CID ini?')) return;
    await db.collection('tarif_admin').doc(id).delete();
    showNotifTop('🗑️ Data dihapus');
    await loadTarifAdmin();
}

function editTarifAdmin(id) {
    const item = tarifAdminData.find(t => t.id === id);
    if (!item) return;
    currentEditTarifId = id;
    document.getElementById('tarifCid').value = item.cid || '';
    document.getElementById('tarifPospaid').value = item.admin_pospaid || '';
    document.getElementById('tarifPrepaid').value = item.admin_prepaid || '';
    document.getElementById('tarifNontaglis').value = item.admin_nontaglis || '';
    showNotifTop('✏️ Edit data, lalu klik Simpan');
}

function clearTarifForm() {
    currentEditTarifId = null;
    document.getElementById('tarifCid').value = '';
    document.getElementById('tarifPospaid').value = '';
    document.getElementById('tarifPrepaid').value = '';
    document.getElementById('tarifNontaglis').value = '';
}

document.getElementById('saveTarifAdminBtn')?.addEventListener('click', async () => {
    const cid = document.getElementById('tarifCid').value;
    const pospaid = document.getElementById('tarifPospaid').value;
    const prepaid = document.getElementById('tarifPrepaid').value;
    const nontaglis = document.getElementById('tarifNontaglis').value;
    await saveTarifAdmin(cid, pospaid, prepaid, nontaglis, currentEditTarifId);
    clearTarifForm();
});
document.getElementById('clearTarifFormBtn')?.addEventListener('click', clearTarifForm);

// ==================== BADGE FUNCTIONS ====================
async function updateDeadlineBadge() {
    if (!currentUser) return;
    const badge = document.getElementById('deadlineCount');
    if (!badge) return;
    try {
        const today = getTodayDate();
        let customerQuery = db.collection('customers').where('user_id', '==', currentUser.uid).where('tanggal', '<', today);
        let prospekQuery = db.collection('prospek').where('user_id', '==', currentUser.uid).where('deadline', '<', today);
        if (currentUserRole === 'owner') {
            customerQuery = db.collection('customers').where('tanggal', '<', today);
            prospekQuery = db.collection('prospek').where('deadline', '<', today);
        }
        const customerOverdue = await customerQuery.get();
        const prospekOverdue = await prospekQuery.get();
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

async function updateAllBadges() { await updateDeadlineBadge(); await updatePesanBadge(); }

// ==================== PRODUK FUNCTIONS ====================
async function loadProduk() {
    if (!currentUser) return;
    const snapshot = await db.collection('produk').get();
    produkData = [];
    snapshot.forEach(doc => { produkData.push({ id: doc.id, ...doc.data() }); });
    renderProdukList();
    updateProductSelect();
}

function renderProdukList() {
    const container = document.getElementById('produkList');
    if (!container) return;
    const searchKeyword = document.getElementById('searchProdukInput')?.value.toLowerCase() || '';
    let filteredProduk = produkData;
    if (searchKeyword) filteredProduk = produkData.filter(p => p.nama.toLowerCase().includes(searchKeyword) || (p.jenis_produk === 'beradmin' ? 'beradmin' : 'tanpa_admin').includes(searchKeyword));
    if (filteredProduk.length === 0) { container.innerHTML = '<p style="text-align:center;padding:40px;">🏷️ Tidak ada produk ditemukan</p>'; return; }
    container.innerHTML = filteredProduk.map(item => { const isAdminBased = item.jenis_produk === 'beradmin'; const isChecked = selectedProdukIds.get(item.id) === true; return `<div class="db-item produk-item" data-id="${item.id}" style="cursor: pointer;"><input type="checkbox" class="db-item-checkbox-produk" data-id="${item.id}" style="margin-right: 12px; width: 18px; height: 18px; cursor: pointer;" ${isChecked ? 'checked' : ''}><div class="db-item-info"><h4>📦 ${escapeHtml(item.nama)}</h4><p>${isAdminBased ? `🏷️ Beradmin | Admin Default: ${formatRupiah(item.admin_default || 0)} | ${item.cid_based ? 'CID Based ✅' : 'Admin Tetap'}` : `💰 Tanpa Admin | HPP: ${formatRupiah(item.hpp)} | Harga Jual: ${formatRupiah(item.harga_jual || 0)}`}</p><small>${escapeHtml(item.keterangan || '')}</small></div><div class="db-item-actions"><button class="db-item-edit" onclick="event.stopPropagation(); editProduk('${item.id}')">✏️ Edit</button><button class="db-item-delete" onclick="event.stopPropagation(); deleteProduk('${item.id}')">🗑️ Hapus</button></div></div>`; }).join('');
    
    document.querySelectorAll('#produkList .db-item-checkbox-produk').forEach(cb => {
        cb.removeEventListener('change', handleProdukCheckboxChange);
        cb.addEventListener('change', handleProdukCheckboxChange);
        function handleProdukCheckboxChange(e) { e.stopPropagation(); const id = cb.dataset.id; if (cb.checked) selectedProdukIds.set(id, true); else selectedProdukIds.delete(id); updateSelectAllProdukButton(); }
    });
    document.querySelectorAll('#produkList .produk-item').forEach(el => {
        el.removeEventListener('click', handleProdukClick);
        el.addEventListener('click', handleProdukClick);
        function handleProdukClick(e) { if (e.target.type === 'checkbox') return; if (e.target.classList.contains('db-item-edit')) return; if (e.target.classList.contains('db-item-delete')) return; editProduk(el.dataset.id); }
    });
    updateSelectAllProdukButton();
}

function updateSelectAllProdukButton() {
    const btn = document.getElementById('selectAllProduk');
    if (!btn) return;
    const searchKeyword = document.getElementById('searchProdukInput')?.value.toLowerCase() || '';
    let filteredProduk = produkData;
    if (searchKeyword) filteredProduk = produkData.filter(p => p.nama.toLowerCase().includes(searchKeyword) || (p.jenis_produk === 'beradmin' ? 'beradmin' : 'tanpa_admin').includes(searchKeyword));
    if (filteredProduk.length === 0) { btn.textContent = '✅ Pilih Semua'; return; }
    const allChecked = filteredProduk.every(item => selectedProdukIds.get(item.id) === true);
    btn.textContent = allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua';
}

window.deleteSelectedProduk = async function() {
    const selectedIds = Array.from(selectedProdukIds.keys());
    if (selectedIds.length === 0) { showNotifTop('⚠️ Tidak ada produk yang dipilih', true); return; }
    if (!confirm(`Hapus ${selectedIds.length} produk yang dipilih? Produk yang sudah terpakai di agent akan kehilangan referensi!`)) return;
    const progress = showFloatingProgress('🗑️ Menghapus Produk', selectedIds.length);
    progress.update(0, '🗑️ Menghapus', 'Memulai proses hapus produk...');
    try {
        let deleted = 0;
        const BATCH_SIZE = 100;
        for (let i = 0; i < selectedIds.length; i += BATCH_SIZE) {
            const batch = db.batch();
            const chunk = selectedIds.slice(i, i + BATCH_SIZE);
            for (const id of chunk) batch.delete(db.collection('produk').doc(id));
            await batch.commit();
            deleted += chunk.length;
            for (const id of chunk) { selectedProdukIds.delete(id); const index = produkData.findIndex(p => p.id === id); if (index !== -1) produkData.splice(index, 1); }
            const percent = Math.floor((deleted / selectedIds.length) * 100);
            progress.update(percent, '🗑️ Menghapus', `Menghapus produk...`, deleted, selectedIds.length);
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        renderProdukList();
        progress.update(100, '✅ Selesai', `Berhasil menghapus ${selectedIds.length} produk`, selectedIds.length, selectedIds.length);
        showNotifTop(`✅ ${selectedIds.length} produk berhasil dihapus`);
        setTimeout(() => progress.hide(), 2000);
    } catch(e) { console.error('Error delete selected:', e); showNotifTop('❌ Gagal menghapus: ' + e.message, true); progress.hide(); }
};

window.deleteProduk = async function(id) {
    if (!confirm('Yakin hapus produk ini? Produk yang sudah terpakai di agent akan kehilangan referensi!')) return;
    const progress = showFloatingProgress('🗑️ Menghapus Produk', 1);
    progress.update(50, '🗑️ Menghapus', 'Menghapus produk...', 0, 1);
    try {
        await db.collection('produk').doc(id).delete();
        const index = produkData.findIndex(p => p.id === id);
        if (index !== -1) produkData.splice(index, 1);
        selectedProdukIds.delete(id);
        renderProdukList();
        progress.update(100, '✅ Selesai', 'Produk berhasil dihapus', 1, 1);
        showNotifTop('🗑️ Produk berhasil dihapus');
        setTimeout(() => progress.hide(), 2000);
    } catch(e) { showNotifTop('❌ Gagal hapus: ' + e.message, true); progress.hide(); }
};

document.getElementById('searchProdukInput')?.addEventListener('input', () => { renderProdukList(); });

async function saveProduk(nama, hpp, hargaJual, keterangan, adminDefault, jenisProduk, cidBased, id = null) {
    if (!nama || !hpp) { showNotifTop('⚠️ Nama produk dan HPP wajib diisi!', true); return false; }
    const data = { nama: nama, hpp: parseInt(hpp), jenis_produk: jenisProduk || 'tanpa_admin', keterangan: keterangan || '', updated_at: new Date().toISOString() };
    if (jenisProduk === 'tanpa_admin') { data.harga_jual = parseInt(hargaJual) || 0; data.admin_default = 0; data.cid_based = false; }
    else { data.harga_jual = 0; data.admin_default = parseInt(adminDefault) || 0; data.cid_based = cidBased === 'yes'; }
    if (id) { await db.collection('produk').doc(id).update(data); showNotifTop('✅ Produk berhasil diupdate'); }
    else { data.created_at = new Date().toISOString(); await db.collection('produk').add(data); showNotifTop('✅ Produk berhasil ditambahkan'); }
    await loadProduk();
    return true;
}

function editProduk(id) {
    const produk = produkData.find(p => p.id === id);
    if (!produk) return;
    currentEditProdukId = id;
    document.getElementById('produkMasterNama').value = produk.nama || '';
    document.getElementById('produkMasterHpp').value = produk.hpp || '';
    document.getElementById('produkMasterKeterangan').value = produk.keterangan || '';
    document.getElementById('produkMasterJenis').value = produk.jenis_produk || 'tanpa_admin';
    toggleProdukJenisFields(produk.jenis_produk || 'tanpa_admin');
    if (produk.jenis_produk === 'tanpa_admin') {
        document.getElementById('produkMasterHargaJual').value = produk.harga_jual || '';
        document.getElementById('tanpaAdminFields').style.display = 'block';
        document.getElementById('beradminFields').style.display = 'none';
    } else {
        document.getElementById('produkMasterAdminDefault').value = produk.admin_default || '';
        document.getElementById('produkMasterCidBased').value = produk.cid_based ? 'yes' : 'no';
        document.getElementById('tanpaAdminFields').style.display = 'none';
        document.getElementById('beradminFields').style.display = 'block';
    }
    document.getElementById('produkMasterTitle').innerText = '✏️ Edit Produk';
    document.getElementById('produkMasterModal').style.display = 'flex';
}

function toggleProdukJenisFields(jenis) {
    const tanpaAdminFields = document.getElementById('tanpaAdminFields');
    const beradminFields = document.getElementById('beradminFields');
    if (jenis === 'tanpa_admin') { tanpaAdminFields.style.display = 'block'; beradminFields.style.display = 'none'; }
    else { tanpaAdminFields.style.display = 'none'; beradminFields.style.display = 'block'; }
}

document.getElementById('produkMasterJenis')?.addEventListener('change', function() { toggleProdukJenisFields(this.value); });

// ==================== PRODUK AGENT FUNCTIONS ====================
function updateProductSelect() {
    const select = document.getElementById('productSelect');
    if (!select) return;
    select.innerHTML = '<option value="">Pilih Produk</option>';
    produkData.forEach(produk => { select.innerHTML += `<option value="${produk.id}" data-harga="${produk.harga_jual || 0}">${escapeHtml(produk.nama)} - ${formatRupiah(produk.harga_jual)}</option>`; });
}

window.openAddProductModal = function() {
    if (!currentAgentIdForProduct) { showNotifTop('⚠️ Pilih agent terlebih dahulu!', true); return; }
    document.getElementById('productModalTitle').innerText = '📦 Tambah Produk';
    document.getElementById('productSelect').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productQty').value = '1';
    document.getElementById('productModal').style.display = 'flex';
};

window.removeAgentProduct = function(index) {
    if (!currentAgentProducts) return;
    currentAgentProducts.splice(index, 1);
    renderAgentProducts();
};

window.saveAgentProduct = async function() {
    const produkId = document.getElementById('productSelect').value;
    const price = parseInt(document.getElementById('productPrice').value);
    const qty = parseInt(document.getElementById('productQty').value) || 1;
    if (!produkId || !price) { showNotifTop('⚠️ Pilih produk dan isi harga!', true); return; }
    const produk = produkData.find(p => p.id === produkId);
    if (!produk) return;
    if (!currentAgentProducts) currentAgentProducts = [];
    currentAgentProducts.push({ produk_id: produkId, nama_produk: produk.nama, harga: price, qty: qty, added_at: new Date().toISOString() });
    renderAgentProducts();
    closeModal('productModal');
};

document.getElementById('productSelect')?.addEventListener('change', function() {
    const selectedOption = this.options[this.selectedIndex];
    const harga = selectedOption.getAttribute('data-harga');
    if (harga && harga !== '0' && document.getElementById('productPrice').value === '') document.getElementById('productPrice').value = harga;
});

// ==================== AGENT DETAIL FUNCTIONS ====================
async function saveAgentDetail() {
    if (!currentAgentIdForProduct) { showNotifTop('⚠️ Data agent tidak ditemukan!', true); return; }
    const agentId = document.getElementById('agentDetailId').value;
    const nama = document.getElementById('agentDetailNama').value;
    const agentType = document.getElementById('agentDetailType').value;
    const pemilik = document.getElementById('agentDetailPemilik').value;
    const alamat = document.getElementById('agentDetailAlamat').value;
    const email = document.getElementById('agentDetailEmail').value;
    const tlp = document.getElementById('agentDetailTlp').value;
    const upline = document.getElementById('agentDetailUpline').value;
    const noRekening = document.getElementById('agentDetailNoRekening').value;
    const atasNama = document.getElementById('agentDetailAtasNama').value;
    const jenisBank = document.getElementById('agentDetailBank').value;
    const noKtp = document.getElementById('agentDetailNoKtp').value;
    const cid = document.getElementById('agentDetailCid').value;
    if (!nama) { showNotifTop('⚠️ Nama agent wajib diisi!', true); return; }
    if (!agentType) { showNotifTop('⚠️ Type/Class wajib dipilih!', true); return; }
    try {
        await db.collection('db_agent').doc(currentAgentIdForProduct).update({ agent_id: agentId, nama: nama, agent_type: agentType, pemilik: pemilik, alamat: alamat, email: email, tlp: tlp, upline: upline, no_rekening: noRekening, atas_nama: atasNama, jenis_bank: jenisBank, no_ktp: noKtp, cid: cid, produk: currentAgentProducts || [], updated_at: new Date().toISOString() });
        showNotifTop('✅ Data agent berhasil disimpan!');
        closeModal('agentDetailModal');
        loadDatabaseAgent();
    } catch (error) { showNotifTop('❌ Gagal menyimpan: ' + error.message, true); console.error(error); }
}

async function openAgentDetail(id) {
    try {
        const doc = await db.collection('db_agent').doc(id).get();
        if (!doc.exists) { showNotifTop('❌ Data agent tidak ditemukan!', true); return; }
        const d = doc.data();
        currentAgentIdForProduct = id;
        currentAgentProducts = d.produk || [];
        document.getElementById('agentDetailId').value = d.agent_id || '';
        document.getElementById('agentDetailNama').value = d.nama || '';
        document.getElementById('agentDetailType').value = d.agent_type || '';
        document.getElementById('agentDetailPemilik').value = d.pemilik || '';
        document.getElementById('agentDetailAlamat').value = d.alamat || '';
        document.getElementById('agentDetailEmail').value = d.email || '';
        document.getElementById('agentDetailTlp').value = d.tlp || '';
        document.getElementById('agentDetailNoRekening').value = d.no_rekening || '';
        document.getElementById('agentDetailAtasNama').value = d.atas_nama || '';
        document.getElementById('agentDetailBank').value = d.jenis_bank || '';
        document.getElementById('agentDetailNoKtp').value = d.no_ktp || '';
        document.getElementById('agentDetailCid').value = d.cid || '';
        document.getElementById('agentDetailUpline').value = d.upline || '';
        if (d.cid) await loadTarifAdminByCid(d.cid);
        else tarifAdminData = [];
        renderAgentProducts();
        document.getElementById('agentDetailModal').style.display = 'flex';
        document.body.classList.add('modal-open');
    } catch (error) { console.error('Error:', error); showNotifTop('❌ Gagal membuka detail: ' + error.message, true); }
}

async function loadTarifAdminByCid(cid) {
    if (!cid) { currentTarifData = []; return; }
    const snapshot = await db.collection('tarif_admin').where('cid', '==', cid).get();
    currentTarifData = [];
    snapshot.forEach(doc => { currentTarifData.push({ id: doc.id, ...doc.data() }); });
}

async function renderAgentProducts() {
    const container = document.getElementById('agentProductsContainer');
    if (!container) return;
    let searchInput = document.getElementById('searchProdukAgent');
    if (!searchInput) {
        const searchWrapper = document.createElement('div');
        searchWrapper.style.marginBottom = '12px';
        searchWrapper.innerHTML = '<input type="text" id="searchProdukAgent" placeholder="🔍 Cari produk..." style="width:100%; padding: 10px; border-radius: 10px; border: 1px solid #e5e7eb;">';
        container.parentNode.insertBefore(searchWrapper, container);
        searchInput = document.getElementById('searchProdukAgent');
        searchInput.addEventListener('input', function() { renderAgentProducts(); });
    }
    const searchKeyword = searchInput.value.toLowerCase();
    let filteredProduk = produkData.filter(p => p.nama.toLowerCase().includes(searchKeyword));
    if (filteredProduk.length === 0) { container.innerHTML = '<p style="text-align:center; color:#9ca3af; padding:20px;">🔍 Tidak ada produk yang ditemukan</p>'; return; }
    const cid = document.getElementById('agentDetailCid')?.value || '';
    let tarifData = null;
    if (cid) {
        const tarifSnapshot = await db.collection('tarif_admin').where('cid', '==', cid).get();
        if (!tarifSnapshot.empty) tarifData = tarifSnapshot.docs[0].data();
    }
    const existingMap = new Map();
    if (currentAgentProducts) currentAgentProducts.forEach(p => existingMap.set(p.produk_id, p));
    let html = '<table style="width:100%; border-collapse: collapse;"><thead><tr style="background: #f8fafc; border-bottom: 2px solid #e5e7eb;"><th style="text-align:left; padding:10px;">Produk</th><th style="text-align:left; padding:10px;">Admin (Otomatis dari CID)</th><th style="text-align:left; padding:10px;">HPP</th><th style="text-align:left; padding:10px;">Profit</th><th style="text-align:left; padding:10px;">Fee Upline</th><th style="text-align:left; padding:10px;">Fee Agent</th></tr></thead><tbody>';
    for (const produk of filteredProduk) {
        const isAdminBased = produk.jenis_produk === 'beradmin';
        const existing = existingMap.get(produk.id);
        let adminValue = 0, profit = 0, feeUpline = 0, feeAgent = 0;
        if (isAdminBased) {
            const produkNamaLower = produk.nama.toLowerCase();
            if (produk.cid_based && cid && tarifData) {
                if (produkNamaLower.includes('prepaid') || produkNamaLower.includes('prep')) adminValue = tarifData.admin_prepaid || 0;
                else if (produkNamaLower.includes('postpaid') || produkNamaLower.includes('posp')) adminValue = tarifData.admin_pospaid || 0;
                else if (produkNamaLower.includes('nontaglis') || produkNamaLower.includes('nont')) adminValue = tarifData.admin_nontaglis || 0;
                else adminValue = existing?.admin || produk.admin_default || 0;
            } else adminValue = existing?.admin || produk.admin_default || 0;
            profit = existing?.profit || 0;
            feeUpline = existing?.fee_upline || 0;
            let calculatedFeeAgent = adminValue - profit - feeUpline;
            if (calculatedFeeAgent < 0) { profit = adminValue - feeUpline; if (profit < 0) profit = 0; calculatedFeeAgent = adminValue - profit - feeUpline; if (calculatedFeeAgent < 0) calculatedFeeAgent = 0; }
            feeAgent = calculatedFeeAgent;
        }
        const adminWarning = (isAdminBased && adminValue === 0 && cid) ? '<span style="color: #f59e0b; font-size: 10px; margin-left: 5px;">⚠️ CID tidak ditemukan di Tarif Admin</span>' : '';
        const adminDisplay = isAdminBased ? `<span class="admin-value" data-id="${produk.id}" style="font-weight: 600; color: ${adminValue === 0 ? '#f59e0b' : '#4f46e5'};">${formatRupiah(adminValue)}</span>${adminWarning}` : '-';
        const profitInput = isAdminBased ? `<input type="number" class="profit-input" data-id="${produk.id}" value="${profit}" step="100" style="width:100px; padding:6px; border-radius:8px; border:1px solid #e5e7eb;">` : '-';
        const feeUplineInput = isAdminBased ? `<input type="number" class="fee-upline-input" data-id="${produk.id}" value="${feeUpline}" step="100" style="width:100px; padding:6px; border-radius:8px; border:1px solid #e5e7eb;">` : '-';
        const feeAgentDisplay = isAdminBased ? `<span class="fee-agent-value" data-id="${produk.id}" style="font-weight: 600; color: ${feeAgent >= 0 ? '#10b981' : '#ef4444'};">${formatRupiah(feeAgent)}</span>` : '-';
        html += `<tr data-produk-id="${produk.id}" style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;"><strong>${escapeHtml(produk.nama)}</strong><br><small style="color:#9ca3af;">${isAdminBased ? '🏷️ Berdasarkan Admin' : '💰 Tanpa Admin'}</small></td><td style="padding:10px;">${adminDisplay}</td><td style="padding:10px;"><span class="hpp-value">${formatRupiah(produk.hpp)}</span></td><td style="padding:10px;">${profitInput}</td><td style="padding:10px;">${feeUplineInput}</td><td style="padding:10px;">${feeAgentDisplay}</td></tr>`;
    }
    html += '</tbody></table>';
    container.innerHTML = html;
    document.querySelectorAll('.profit-input').forEach(input => { input.removeEventListener('change', handleProfitChange); input.addEventListener('change', handleProfitChange); });
    document.querySelectorAll('.fee-upline-input').forEach(input => { input.removeEventListener('change', handleFeeUplineChange); input.addEventListener('change', handleFeeUplineChange); });
}

function handleProfitChange(e) {
    const produkId = e.target.dataset.id;
    let profit = parseInt(e.target.value) || 0;
    if (profit < 0) profit = 0;
    updateAgentProductField(produkId, 'profit', profit);
}

function handleFeeUplineChange(e) {
    const produkId = e.target.dataset.id;
    let feeUpline = parseInt(e.target.value) || 0;
    if (feeUpline < 0) feeUpline = 0;
    updateAgentProductField(produkId, 'fee_upline', feeUpline);
}

async function updateAgentProductField(produkId, field, value) {
    if (!currentAgentProducts) currentAgentProducts = [];
    const produk = produkData.find(p => p.id === produkId);
    if (!produk) return;
    const isAdminBased = produk.jenis_produk === 'beradmin';
    const index = currentAgentProducts.findIndex(p => p.produk_id === produkId);
    let admin = 0;
    if (isAdminBased) {
        const adminSpan = document.querySelector(`tr[data-produk-id="${produkId}"] .admin-value`);
        if (adminSpan) admin = parseInt(adminSpan.textContent.replace(/[^0-9]/g, '')) || 0;
    }
    let profit = field === 'profit' ? value : (currentAgentProducts[index]?.profit || 0);
    let feeUpline = field === 'fee_upline' ? value : (currentAgentProducts[index]?.fee_upline || 0);
    let feeAgent = admin - profit - feeUpline;
    if (feeAgent < 0) { profit = admin - feeUpline; if (profit < 0) profit = 0; feeAgent = admin - profit - feeUpline; if (feeAgent < 0) feeAgent = 0; if (field === 'fee_upline') { const profitInput = document.querySelector(`tr[data-produk-id="${produkId}"] .profit-input`); if (profitInput) profitInput.value = profit; } }
    const productData = { produk_id: produkId, nama_produk: produk.nama, admin: admin, profit: profit, fee_upline: feeUpline, fee_agent: feeAgent, updated_at: new Date().toISOString() };
    if (index >= 0) currentAgentProducts[index] = productData;
    else { productData.added_at = new Date().toISOString(); currentAgentProducts.push(productData); }
    const feeAgentSpan = document.querySelector(`tr[data-produk-id="${produkId}"] .fee-agent-value`);
    if (feeAgentSpan) { feeAgentSpan.innerHTML = formatRupiah(feeAgent); feeAgentSpan.style.color = feeAgent >= 0 ? '#10b981' : '#ef4444'; }
}

function addOrUpdateProductWithAdminAndFee(produkId, admin, feeUpline) {
    if (!currentAgentProducts) currentAgentProducts = [];
    const produk = produkData.find(p => p.id === produkId);
    if (!produk) return;
    const existingIndex = currentAgentProducts.findIndex(p => p.produk_id === produkId);
    const qty = existingIndex >= 0 ? currentAgentProducts[existingIndex].qty : 1;
    const productData = { produk_id: produkId, nama_produk: produk.nama, admin: admin, fee_upline: feeUpline, qty: qty, updated_at: new Date().toISOString() };
    if (existingIndex >= 0) currentAgentProducts[existingIndex] = productData;
    else { productData.added_at = new Date().toISOString(); currentAgentProducts.push(productData); }
}

// ==================== CUSTOMER CRUD ====================
document.getElementById('addCustomerBtn')?.addEventListener('click', () => { document.getElementById('customerDate').value = getTodayDate(); document.getElementById('customerModal').style.display = 'flex'; });

const saveCustomerBtn = document.getElementById('saveCustomerBtn');
if (saveCustomerBtn) {
    const newSaveCustomerBtn = saveCustomerBtn.cloneNode(true);
    saveCustomerBtn.parentNode.replaceChild(newSaveCustomerBtn, saveCustomerBtn);
    newSaveCustomerBtn.addEventListener('click', async () => {
        let agentId = document.getElementById('customerId').value;
        let nama = document.getElementById('customerName').value;
        let hp = document.getElementById('customerPhone').value;
        const apk = document.getElementById('customerApk').value;
        const agentType = document.getElementById('customerType').value;
        let tanggal = document.getElementById('customerDate').value;
        if (!agentId) { showNotif('ID Agent wajib diisi!', true); return; }
        if (!nama) { showNotif('Nama wajib diisi!', true); return; }
        if (!hp) { showNotif('Nomor WhatsApp wajib diisi!', true); return; }
        if (hp.length < 9) { showNotif('Nomor WhatsApp minimal 9 digit!', true); return; }
        if (hp.length > 12) { showNotif('Nomor WhatsApp maksimal 12 digit!', true); return; }
        if (!hp.startsWith('8')) { showNotif('Nomor WhatsApp harus diawali dengan 8!', true); return; }
        if (!apk) { showNotif('Aplikasi wajib dipilih!', true); return; }
        if (!agentType) { showNotif('Type/Class wajib dipilih!', true); return; }
        const cleanHpForCheck = '+62' + hp;
        const { duplicateAgent, duplicateHp } = await checkDuplicateCustomer(agentId, cleanHpForCheck);
        if (duplicateAgent) { showNotif(`⚠️ ID Agent "${agentId}" sudah terdaftar oleh ${duplicateAgent.owner} (${duplicateAgent.nama})!`, true); return; }
        if (duplicateHp) { showNotif(`⚠️ Nomor WhatsApp "${cleanHpForCheck}" sudah terdaftar oleh ${duplicateHp.owner} (${duplicateHp.nama})!`, true); return; }
        if (!tanggal) tanggal = getTodayDate();
        let cleanHp = '+62' + hp;
        db.collection('customers').add({ agent_id: agentId, nama: nama, hp: cleanHp, apk: apk, agent_type: agentType, tanggal: tanggal, status: 'baru', user_id: currentUser.uid, created_at: new Date().toISOString(), followup_data: null, pending_data: [] }).then(() => { closeModal('customerModal'); document.getElementById('customerId').value = ''; document.getElementById('customerName').value = ''; document.getElementById('customerPhone').value = ''; document.getElementById('customerApk').value = ''; document.getElementById('customerDate').value = ''; showNotif('Customer berhasil ditambahkan'); updateAllBadges(); loadAllData(); }).catch(e => showNotif('Error: ' + e.message, true));
    });
}

// ==================== PROSPEK CRUD ====================
document.getElementById('addProspekBtn')?.addEventListener('click', () => { document.getElementById('prospekDeadline').value = getTodayDate(); document.getElementById('prospekModal').style.display = 'flex'; });

const saveProspekBtn = document.getElementById('saveProspekBtn');
if (saveProspekBtn) {
    const newSaveProspekBtn = saveProspekBtn.cloneNode(true);
    saveProspekBtn.parentNode.replaceChild(newSaveProspekBtn, saveProspekBtn);
    newSaveProspekBtn.addEventListener('click', async () => {
        let nama = document.getElementById('prospekName').value;
        let hp = document.getElementById('prospekPhone').value;
        const status = document.getElementById('prospekStatusSelect').value;
        const agentType = document.getElementById('prospekType').value;
        let deadline = document.getElementById('prospekDeadline').value;
        if (!nama) { showNotif('Nama wajib diisi!', true); return; }
        if (!hp) { showNotif('Nomor WhatsApp wajib diisi!', true); return; }
        if (hp.length < 9) { showNotif('Nomor WhatsApp minimal 9 digit!', true); return; }
        if (hp.length > 12) { showNotif('Nomor WhatsApp maksimal 12 digit!', true); return; }
        if (!hp.startsWith('8')) { showNotif('Nomor WhatsApp harus diawali dengan 8!', true); return; }
        if (!agentType) { showNotif('Type/Class wajib dipilih!', true); return; }
        const cleanHpForCheck = '+62' + hp;
        const duplicateHp = await checkDuplicateProspek(cleanHpForCheck);
        if (duplicateHp) { showNotif(`⚠️ Nomor WhatsApp "${cleanHpForCheck}" sudah terdaftar sebagai prospek oleh ${duplicateHp.owner} (${duplicateHp.nama})!`, true); return; }
        if (!deadline) deadline = getTodayDate();
        let cleanHp = '+62' + hp;
        db.collection('prospek').add({ nama: nama, hp: cleanHp, status: status || 'Baru', agent_type: agentType, deadline: deadline, user_id: currentUser.uid, created_at: new Date().toISOString(), dihubungi_data: null, negosiasi_data: null }).then(() => { closeModal('prospekModal'); document.getElementById('prospekName').value = ''; document.getElementById('prospekPhone').value = ''; document.getElementById('prospekDeadline').value = ''; showNotif('Prospek berhasil ditambahkan'); updateAllBadges(); loadAllData(); }).catch(e => showNotif('Error: ' + e.message, true));
    });
}

// ==================== DETAIL CUSTOMER & PROSPEK ====================
function openDetailCustomer(id) {
    db.collection('customers').doc(id).get().then(async doc => {
        const d = doc.data();
        let ownerInfo = '';
        if (currentUserRole === 'owner' && d.user_id !== currentUser.uid) { const userDoc = await db.collection('users').doc(d.user_id).get(); const ownerName = userDoc.exists ? userDoc.data().nama || 'CS Agent' : 'CS Agent'; ownerInfo = `<div class="detail-info-item"><div class="detail-info-icon">👤</div><div class="detail-info-content"><label>Pemilik Data</label><div class="value">${escapeHtml(ownerName)}</div></div></div>`; }
        const statusIcon = d.status === 'closing' ? '🎉' : d.status === 'pending' ? '⏳' : d.status === 'followup' ? '📞' : '🆕';
        let actionButtons = '';
        if (d.status === 'baru') actionButtons = `<button class="btn-primary" onclick="updateCustomerStatus('${id}','followup')">📞 Lanjut ke Follow Up</button>`;
        else if (d.status === 'followup') actionButtons = `<button class="btn-primary" onclick="openFollowupConfirm('${id}')">📞 Konfirmasi Follow Up</button>`;
        else if (d.status === 'pending') actionButtons = `<button class="btn-warning" onclick="openPendingModal('${id}')">📝 Kelola Pending</button>`;
        else if (d.status === 'closing') actionButtons = `<button class="btn-success" onclick="saveToClosingNow('${id}')">💾 Simpan ke DB Closing</button>`;
        let followupInfo = '';
        if (d.followup_data) followupInfo = `<div class="detail-info-item"><div class="detail-info-icon">✅</div><div class="detail-info-content"><label>Follow Up</label><div class="value">Terkirim: ${d.followup_data.terkirim ? 'Ya' : 'Tidak'} | Dibalas: ${d.followup_data.dibalas ? 'Ya' : 'Tidak'}</div></div></div>`;
        let pendingInfo = '';
        if (d.pending_data && d.pending_data.length > 0) { const completedCount = d.pending_data.filter(item => item.checked === true && item.text?.trim() !== '').length; const totalCount = d.pending_data.length; pendingInfo = `<div class="detail-info-item"><div class="detail-info-icon">📝</div><div class="detail-info-content"><label>Pending Responses</label><div class="value">${completedCount} / ${totalCount} balasan tercatat</div></div></div>`; }
        const deadlineDisplay = d.tanggal || '-';
        const editBtn = `<button class="edit-deadline-btn" onclick="openEditDeadlineModal('${id}','customer','${d.tanggal || ''}')" title="Edit deadline">✏️</button>`;
        document.getElementById('detailContent').innerHTML = `<div class="detail-header"><div class="detail-avatar">${statusIcon}</div><h3>${escapeHtml(d.nama)}</h3><div class="detail-status">${getStatusBadge(d.status)}</div></div><div class="detail-body"><div class="detail-info">${ownerInfo}<div class="detail-info-item"><div class="detail-info-icon">🆔</div><div class="detail-info-content"><label>ID Agent</label><div class="value">${escapeHtml(d.agent_id || '-')}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">🏷️</div><div class="detail-info-content"><label>Type/Class</label><div class="value">${escapeHtml(d.agent_type || '-')}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">📱</div><div class="detail-info-content"><label>Aplikasi</label><div class="value">${escapeHtml(d.apk || '-')}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">📱</div><div class="detail-info-content"><label>Nomor WhatsApp</label><div class="value">${escapeHtml(d.hp)}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">📅</div><div class="detail-info-content"><label>Deadline</label><div class="value">${deadlineDisplay} ${editBtn}</div></div></div>${followupInfo}${pendingInfo}<div class="detail-info-item"><div class="detail-info-icon">📌</div><div class="detail-info-content"><label>Status</label><div class="value">${d.status === 'followup' ? 'Follow Up' : d.status === 'baru' ? 'Baru' : d.status}</div></div></div></div><div class="detail-actions"><button class="btn-success" onclick="openWA('${d.hp}')">💬 WhatsApp</button>${actionButtons}</div></div><div class="detail-footer"><button class="btn-outline" onclick="closeModal('detailModal')">❌ Tutup</button><button class="btn-danger" onclick="deleteCustomer('${id}')">🗑️ Hapus</button></div>`;
        showModal('detailModal');
    });
}

window.updateCustomerStatus = async function(id, newStatus) {
    if (newStatus === 'followup') {
        const doc = await db.collection('customers').doc(id).get();
        const currentDeadline = doc.data().tanggal || getTodayDate();
        const newDeadline = addDaysToDate(currentDeadline, 1);
        await db.collection('customers').doc(id).update({ status: 'followup', tanggal: newDeadline });
        showNotif(`✅ Status berhasil diupdate ke Follow Up. Deadline +1 hari menjadi ${newDeadline}`);
        closeModal('detailModal');
        loadAllData();
    }
};

window.deleteCustomer = async function(id) {
    if (!confirm('Yakin hapus customer ini? Data akan dihapus permanen!')) return;
    try { await db.collection('customers').doc(id).delete(); closeModal('detailModal'); showNotifTop('🗑️ Data customer berhasil dihapus'); setTimeout(() => { loadAllData(); updateAllBadges(); }, 300); }
    catch(e) { showNotifTop('❌ Gagal hapus: ' + e.message, true); }
};

window.deleteProspek = async function(id) {
    if (!confirm('Yakin hapus prospek ini? Data akan dihapus permanen!')) return;
    try { await db.collection('prospek').doc(id).delete(); closeModal('detailModal'); showNotifTop('🗑️ Data prospek berhasil dihapus'); setTimeout(() => { loadAllData(); updateAllBadges(); }, 300); }
    catch(e) { showNotifTop('❌ Gagal hapus: ' + e.message, true); }
};

function openDetailProspek(id) {
    db.collection('prospek').doc(id).get().then(async doc => {
        const d = doc.data();
        let ownerInfo = '';
        if (currentUserRole === 'owner' && d.user_id !== currentUser.uid) { const userDoc = await db.collection('users').doc(d.user_id).get(); const ownerName = userDoc.exists ? userDoc.data().nama || 'CS Agent' : 'CS Agent'; ownerInfo = `<div class="detail-info-item"><div class="detail-info-icon">👤</div><div class="detail-info-content"><label>Pemilik Data</label><div class="value">${escapeHtml(ownerName)}</div></div></div>`; }
        let statusIcon = d.status === 'Negosiasi' ? '📋' : d.status === 'Dihubungi' ? '📞' : d.status === 'Tertarik' ? '⭐' : '🆕';
        let actionButtons = '';
        if (d.status === 'Baru') actionButtons = `<button class="btn-primary" onclick="lanjutKeDihubungi('${id}')">📞 Lanjut ke Dihubungi</button>`;
        else if (d.status === 'Dihubungi') actionButtons = `<button class="btn-primary" onclick="openProspekDihubungiConfirm('${id}')">✅ Konfirmasi Dihubungi</button>`;
        else if (d.status === 'Negosiasi') actionButtons = `<button class="btn-primary" onclick="openProspekNegosiasiModal('${id}')">📝 Kelola Negosiasi</button>`;
        else if (d.status === 'Tertarik') actionButtons = `<button class="btn-primary" onclick="showConvertToCustomerModal('${id}')">🔄 Jadikan Customer</button>`;
        let negosiasiInfo = '';
        if (d.negosiasi_data) { const isComplete = d.negosiasi_data.is_complete || (d.negosiasi_data.aplikasi && d.negosiasi_data.domisili && d.negosiasi_data.transaksi); negosiasiInfo = `<div class="detail-info-item"><div class="detail-info-icon">📋</div><div class="detail-info-content"><label>Data Negosiasi ${isComplete ? '✅ Lengkap' : '📝 Draft'}</label><div class="value">Aplikasi: ${d.negosiasi_data.aplikasi || '-'}<br>Domisili: ${d.negosiasi_data.domisili || '-'}<br>Transaksi: ${d.negosiasi_data.transaksi || '-'}<br>Deposit: ${d.negosiasi_data.deposit || '-'}<br>Tertarik: ${d.negosiasi_data.tertarik || '-'}<br>Penawaran: ${d.negosiasi_data.penawaran || '-'}</div></div></div>`; }
        let dihubungiInfo = '';
        if (d.dihubungi_data) dihubungiInfo = `<div class="detail-info-item"><div class="detail-info-icon">✅</div><div class="detail-info-content"><label>Konfirmasi Dihubungi</label><div class="value">Terkirim: ${d.dihubungi_data.terkirim ? 'Ya' : 'Tidak'} | Dibalas: ${d.dihubungi_data.dibalas ? 'Ya' : 'Tidak'}</div></div></div>`;
        const deadlineDisplay = d.deadline || '-';
        const editBtn = `<button class="edit-deadline-btn" onclick="openEditDeadlineModal('${id}','prospek','${d.deadline || ''}')" title="Edit deadline">✏️</button>`;
        document.getElementById('detailContent').innerHTML = `<div class="detail-header"><div class="detail-avatar">${statusIcon}</div><h3>${escapeHtml(d.nama)}</h3><div class="detail-status">${getStatusBadge(d.status)}</div></div><div class="detail-body"><div class="detail-info">${ownerInfo}<div class="detail-info-item"><div class="detail-info-icon">🏷️</div><div class="detail-info-content"><label>Type/Class</label><div class="value">${escapeHtml(d.agent_type || '-')}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">📱</div><div class="detail-info-content"><label>Nomor WhatsApp</label><div class="value">${escapeHtml(d.hp)}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">📅</div><div class="detail-info-content"><label>Deadline</label><div class="value">${deadlineDisplay} ${editBtn}</div></div></div>${dihubungiInfo}${negosiasiInfo}<div class="detail-info-item"><div class="detail-info-icon">📌</div><div class="detail-info-content"><label>Status</label><div class="value">${d.status}</div></div></div></div><div class="detail-actions"><button class="btn-success" onclick="openWA('${d.hp}')">💬 WhatsApp</button>${actionButtons}</div></div><div class="detail-footer"><button class="btn-outline" onclick="closeModal('detailModal')">❌ Tutup</button><button class="btn-danger" onclick="deleteProspek('${id}')">🗑️ Hapus</button></div>`;
        showModal('detailModal');
    });
}

function lanjutKeDihubungi(id) {
    db.collection('prospek').doc(id).get().then(doc => {
        const currentDeadline = doc.data().deadline || getTodayDate();
        const newDeadline = addDaysToDate(currentDeadline, 1);
        db.collection('prospek').doc(id).update({ status: 'Dihubungi', deadline: newDeadline }).then(() => { showNotif(`✅ Status berubah menjadi Dihubungi. Deadline +1 hari menjadi ${newDeadline}`); loadAllData(); closeModal('detailModal'); }).catch(err => showNotif('❌ Gagal: ' + err.message, true));
    });
}

// ==================== FOLLOWUP & PENDING ====================
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
    const updateYesBtn = () => { yesBtn.disabled = !(cb1.checked && cb2.checked); };
    cb1.onchange = updateYesBtn;
    cb2.onchange = updateYesBtn;
    updateYesBtn();
    const newYesBtn = yesBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
    newYesBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); if (newYesBtn.disabled) { showNotifTop('⚠️ Harap centang "pesan terkirim" DAN "sudah dibalas" terlebih dahulu!', true); return; } (async () => { const doc = await db.collection('customers').doc(id).get(); const newDeadline = addDaysToDate(doc.data().tanggal || getTodayDate(), 1); await db.collection('customers').doc(id).update({ followup_data: { terkirim: true, dibalas: true, timestamp: new Date().toISOString() }, status: 'pending', tanggal: newDeadline }); closeModal('followupConfirmModal'); showNotifTop(`✅ Customer dipindahkan ke Pending. Deadline +1 hari menjadi ${newDeadline}`); loadAllData(); closeModal('detailModal'); })(); };
    noBtn.onclick = async () => { const doc = await db.collection('customers').doc(id).get(); if (doc.exists) { showConfirmDialog('Pindahkan ke Database Nomor Salah?', `Apakah Anda yakin nomor "${escapeHtml(doc.data().hp)}" milik "${escapeHtml(doc.data().nama)}" tidak dapat dihubungi?`, async () => { await db.collection('nomor_salah').add({ ...doc.data(), alasan: 'Nomor tidak bisa dihubungi / tidak aktif', deleted_at: new Date().toISOString(), user_id: doc.data().user_id }); await db.collection('customers').doc(id).delete(); showNotifTop('📵 Data dipindahkan ke Database Nomor Salah'); closeModal('followupConfirmModal'); closeModal('detailModal'); loadAllData(); }); } };
}

function openPendingModal(id) {
    currentPendingId = id;
    db.collection('customers').doc(id).get().then(doc => { pendingItems = doc.data().pending_data || []; renderPendingModal(); document.getElementById('pendingModal').style.display = 'flex'; });
}

function renderPendingModal() {
    const container = document.getElementById('pendingItemsContainer');
    if (!container) return;
    container.innerHTML = '';
    if (pendingItems.length === 0) { const emptyDiv = document.createElement('div'); emptyDiv.style.textAlign = 'center'; emptyDiv.style.padding = '20px'; emptyDiv.style.color = '#9ca3af'; emptyDiv.innerHTML = 'Belum ada catatan pending. Klik "+ Tambah Balasan" untuk menambahkan.'; container.appendChild(emptyDiv); }
    pendingItems.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'pending-item';
        div.innerHTML = `<input type="text" value="${escapeHtml(item.text)}" placeholder="Balasan/respon..." style="flex:1; padding: 6px; border-radius: 6px; border: 1px solid #e5e7eb;"><input type="checkbox" ${item.checked ? 'checked' : ''} style="width: 20px; height: 20px;"><button class="delete-pending-item" data-idx="${idx}" style="background: none; border: none; cursor: pointer; font-size: 16px;">🗑️</button>`;
        const textInput = div.querySelector('input[type="text"]');
        const checkBox = div.querySelector('input[type="checkbox"]');
        const delBtn = div.querySelector('.delete-pending-item');
        textInput.addEventListener('change', (e) => { pendingItems[idx].text = e.target.value; updatePendingButtons(); });
        checkBox.addEventListener('change', (e) => { pendingItems[idx].checked = e.target.checked; updatePendingButtons(); });
        delBtn.addEventListener('click', () => { pendingItems.splice(idx, 1); renderPendingModal(); updatePendingButtons(); });
        container.appendChild(div);
    });
    const addBtn = document.getElementById('addPendingItemBtn');
    if (addBtn) { const newAddBtn = addBtn.cloneNode(true); addBtn.parentNode.replaceChild(newAddBtn, addBtn); newAddBtn.onclick = () => { pendingItems.push({ text: '', checked: false }); renderPendingModal(); updatePendingButtons(); }; }
    updatePendingButtons();
}

function updatePendingButtons() {
    const allFilledAndChecked = pendingItems.length > 0 && pendingItems.every(item => item.checked === true && item.text.trim() !== '');
    const finishBtn = document.getElementById('pendingFinishBtn');
    if (finishBtn) {
        if (allFilledAndChecked) { finishBtn.disabled = false; const newFinishBtn = finishBtn.cloneNode(true); finishBtn.parentNode.replaceChild(newFinishBtn, finishBtn); newFinishBtn.onclick = async () => { await db.collection('customers').doc(currentPendingId).update({ pending_data: pendingItems }); await window.confirmClosing(currentPendingId); closeModal('pendingModal'); }; }
        else { finishBtn.disabled = true; finishBtn.onclick = () => { let pesan = pendingItems.length === 0 ? '⚠️ Tambahkan minimal satu balasan terlebih dahulu!' : '⚠️ Harap isi dan centang SEMUA balasan sebelum lanjut ke Closing!'; showNotifTop(pesan, true); }; }
    }
    const saveBtn = document.getElementById('pendingSaveBtn');
    if (saveBtn) { const newSaveBtn = saveBtn.cloneNode(true); saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn); newSaveBtn.onclick = async () => { const doc = await db.collection('customers').doc(currentPendingId).get(); const oldPendingData = doc.data().pending_data || []; let hasChanges = false; if (pendingItems.length !== oldPendingData.length) hasChanges = true; else { for (let i = 0; i < pendingItems.length; i++) { const newItem = pendingItems[i]; const oldItem = oldPendingData[i] || {}; if (newItem.text !== oldItem.text || newItem.checked !== oldItem.checked) { hasChanges = true; break; } } } const hasAnyData = pendingItems.some(item => item.text && item.text.trim() !== ''); if (!hasAnyData) { showNotifTop('⚠️ Minimal isi satu balasan sebelum menyimpan!', true); return; } if (!hasChanges) { showNotifTop('⚠️ Tidak ada perubahan data! Silakan ubah data terlebih dahulu sebelum menyimpan.', true); return; } const newDeadline = addDaysToDate(doc.data().tanggal || getTodayDate(), 3); await db.collection('customers').doc(currentPendingId).update({ pending_data: pendingItems, tanggal: newDeadline }); showNotifTop(`💾 Data pending berhasil disimpan. Deadline +3 hari menjadi ${newDeadline}`); closeModal('pendingModal'); loadAllData(); }; }
    const cancelBtn = document.getElementById('pendingCancelBtn');
    if (cancelBtn) { const newCancelBtn = cancelBtn.cloneNode(true); cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn); newCancelBtn.onclick = () => { closeModal('pendingModal'); }; }
}

function openProspekDihubungiConfirm(id) {
    currentProspekId = id;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '99999999';
    modal.innerHTML = `<div class="modal-content" style="max-width: 400px;"><h3>✅ Konfirmasi Dihubungi</h3><div class="modal-subtitle">Pastikan sudah melakukan komunikasi dengan prospek</div><div style="padding: 0 20px;"><div class="form-group"><label><input type="checkbox" id="prospek_terkirim" style="margin-right: 8px;"> Apakah pesan sudah terkirim dan terbaca?</label></div><div class="form-group"><label><input type="checkbox" id="prospek_dibalas" style="margin-right: 8px;"> Apakah sudah di balas?</label></div></div><div class="modal-buttons" style="display: flex; gap: 12px; flex-wrap: wrap;"><button id="prospekConfirmYes" class="btn-primary" disabled style="flex: 1;">✅ Lanjut ke Negosiasi</button><button id="prospekConfirmNo" class="btn-danger" style="flex: 1;">📵 Nomor Salah/Tidak bisa dihubungi</button><button id="prospekConfirmCancel" class="btn-outline" style="flex: 1;">❌ Batal</button></div></div>`;
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    const cb1 = modal.querySelector('#prospek_terkirim');
    const cb2 = modal.querySelector('#prospek_dibalas');
    const yesBtn = modal.querySelector('#prospekConfirmYes');
    const noBtn = modal.querySelector('#prospekConfirmNo');
    const cancelBtn = modal.querySelector('#prospekConfirmCancel');
    const checkBoth = () => { const isChecked = cb1.checked && cb2.checked; yesBtn.disabled = !isChecked; };
    cb1.onchange = checkBoth;
    cb2.onchange = checkBoth;
    checkBoth();
    yesBtn.onclick = async () => { if (yesBtn.disabled) { showNotifTop('⚠️ Harap centang "pesan terkirim" DAN "sudah dibalas" terlebih dahulu!', true); return; } const doc = await db.collection('prospek').doc(id).get(); const currentDeadline = doc.data().deadline || getTodayDate(); const newDeadline = addDaysToDate(currentDeadline, 1); await db.collection('prospek').doc(id).update({ status: 'Negosiasi', deadline: newDeadline, dihubungi_data: { terkirim: true, dibalas: true, timestamp: new Date().toISOString(), via_wa: true } }); modal.remove(); document.body.classList.remove('modal-open'); showNotifTop(`✅ Prospek dipindahkan ke Negosiasi. Deadline +1 hari menjadi ${newDeadline}`); loadAllData(); closeModal('detailModal'); };
    noBtn.onclick = async () => { const doc = await db.collection('prospek').doc(id).get(); const data = doc.data(); if (data) { showConfirmDialog('Pindahkan ke Database Nomor Salah?', `Apakah Anda yakin nomor "${escapeHtml(data.hp)}" milik "${escapeHtml(data.nama)}" tidak dapat dihubungi?\n\n⚠️ Data yang sudah dipindahkan TIDAK BISA dikembalikan!`, async () => { await db.collection('nomor_salah').add({ nama: data.nama, hp: data.hp, alasan: 'Nomor tidak bisa dihubungi / tidak aktif', deleted_at: new Date().toISOString(), user_id: data.user_id }); await db.collection('prospek').doc(id).delete(); showNotifTop('📵 Data dipindahkan ke Database Nomor Salah'); modal.remove(); document.body.classList.remove('modal-open'); loadAllData(); closeModal('detailModal'); }); } };
    cancelBtn.onclick = () => { modal.remove(); document.body.classList.remove('modal-open'); };
    modal.onclick = (e) => { if (e.target === modal) { modal.remove(); document.body.classList.remove('modal-open'); document.body.style.overflow = ''; } };
}

function openProspekNegosiasiModal(id) {
    currentProspekId = id;
    const fields = ['prospek_aplikasi', 'prospek_domisili', 'prospek_transaksi', 'prospek_deposit', 'prospek_tertarik', 'prospek_penawaran'];
    fields.forEach(f => document.getElementById(f).value = '');
    db.collection('prospek').doc(id).get().then(doc => { const data = doc.data(); if (data.negosiasi_data) { document.getElementById('prospek_aplikasi').value = data.negosiasi_data.aplikasi || ''; document.getElementById('prospek_domisili').value = data.negosiasi_data.domisili || ''; document.getElementById('prospek_transaksi').value = data.negosiasi_data.transaksi || ''; document.getElementById('prospek_deposit').value = data.negosiasi_data.deposit || ''; document.getElementById('prospek_tertarik').value = data.negosiasi_data.tertarik || ''; document.getElementById('prospek_penawaran').value = data.negosiasi_data.penawaran || ''; } });
    const modal = document.getElementById('prospekNegosiasiModal');
    if (!modal) return;
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '9999999';
    modal.style.backdropFilter = 'blur(4px)';
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) { modalContent.style.zIndex = '10000000'; modalContent.style.position = 'relative'; modalContent.style.background = '#fff'; }
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    modal.onclick = (e) => { if (e.target === modal) closeModal('prospekNegosiasiModal'); };
    document.getElementById('negosiasiTertarikBtn').onclick = async () => { const aplikasi = document.getElementById('prospek_aplikasi').value; const domisili = document.getElementById('prospek_domisili').value; const transaksi = document.getElementById('prospek_transaksi').value; const deposit = document.getElementById('prospek_deposit').value; const tertarik = document.getElementById('prospek_tertarik').value; const penawaran = document.getElementById('prospek_penawaran').value; if (!aplikasi || !domisili || !transaksi || !deposit || !tertarik || !penawaran) { showNotifTop('⚠️ Semua field harus diisi!', true); return; } showConfirmDialog('Pindahkan ke Status Tertarik?', 'Apakah data kuesioner sudah lengkap dan prospek tertarik?\n\n⚠️ Setelah ini prospek akan masuk ke status TERTARIK.', async () => { const negosiasi_data = { aplikasi: aplikasi, domisili: domisili, transaksi: transaksi, deposit: deposit, tertarik: tertarik, penawaran: penawaran, timestamp: new Date().toISOString() }; await db.collection('prospek').doc(currentProspekId).update({ status: 'Tertarik', negosiasi_data: negosiasi_data }); showNotifTop('✅ Prospek dipindahkan ke Tertarik'); closeModal('prospekNegosiasiModal'); loadAllData(); closeModal('detailModal'); }); };
    document.getElementById('negosiasiTidakTertarikBtn').onclick = async () => { const aplikasi = document.getElementById('prospek_aplikasi').value; const domisili = document.getElementById('prospek_domisili').value; const transaksi = document.getElementById('prospek_transaksi').value; const deposit = document.getElementById('prospek_deposit').value; const tertarik = document.getElementById('prospek_tertarik').value; const penawaran = document.getElementById('prospek_penawaran').value; if (!aplikasi || !domisili || !transaksi || !deposit || !tertarik || !penawaran) { showNotifTop('⚠️ Data kuesioner harus diisi LENGKAP sebelum pindah ke Tidak Tertarik!', true); return; } const doc = await db.collection('prospek').doc(currentProspekId).get(); const data = doc.data(); if (data) { showConfirmDialog('Pindahkan ke Database Tidak Tertarik?', `Apakah Anda yakin ingin memindahkan "${escapeHtml(data.nama)}" ke DATABASE TIDAK TERTARIK?\n\n⚠️ Data yang sudah dipindahkan TIDAK BISA dikembalikan!`, async () => { await db.collection('db_tidak_tertarik').add({ nama: data.nama, hp: data.hp, tanggal: new Date().toISOString(), user_id: data.user_id, alasan: 'Tidak tertarik setelah negosiasi', status_sebelumnya: data.status, negosiasi_data: data.negosiasi_data || null }); await db.collection('prospek').doc(currentProspekId).delete(); showNotifTop('📵 Data dipindahkan ke Database Tidak Tertarik'); closeModal('prospekNegosiasiModal'); closeModal('detailModal'); updateAllBadges(); setTimeout(() => loadAllData(), 300); }); } };
    document.getElementById('negosiasiSimpanBtn').onclick = async () => { const aplikasi = document.getElementById('prospek_aplikasi').value; const domisili = document.getElementById('prospek_domisili').value; const transaksi = document.getElementById('prospek_transaksi').value; const deposit = document.getElementById('prospek_deposit').value; const tertarik = document.getElementById('prospek_tertarik').value; const penawaran = document.getElementById('prospek_penawaran').value; const doc = await db.collection('prospek').doc(currentProspekId).get(); const existingData = doc.data().negosiasi_data || {}; const hasChanges = aplikasi !== (existingData.aplikasi || '') || domisili !== (existingData.domisili || '') || transaksi !== (existingData.transaksi || '') || deposit !== (existingData.deposit || '') || tertarik !== (existingData.tertarik || '') || penawaran !== (existingData.penawaran || ''); const hasAnyData = aplikasi || domisili || transaksi || deposit || tertarik || penawaran; if (!hasAnyData) { showNotifTop('⚠️ Tidak ada data untuk disimpan!', true); return; } if (!hasChanges) { showNotifTop('⚠️ Tidak ada perubahan data! Silakan ubah data terlebih dahulu sebelum menyimpan.', true); return; } const negosiasi_data = { aplikasi: aplikasi || '', domisili: domisili || '', transaksi: transaksi || '', deposit: deposit || '', tertarik: tertarik || '', penawaran: penawaran || '', timestamp: new Date().toISOString(), is_complete: !!(aplikasi && domisili && transaksi && deposit && tertarik && penawaran) }; const currentDeadline = doc.data().deadline || getTodayDate(); const newDeadline = addDaysToDate(currentDeadline, 3); await db.collection('prospek').doc(currentProspekId).update({ negosiasi_data: negosiasi_data, deadline: newDeadline }); showNotifTop(`💾 Data kuesioner berhasil disimpan. Deadline +3 hari menjadi ${newDeadline}`); closeModal('prospekNegosiasiModal'); loadAllData(); closeModal('detailModal'); };
    const batalBtn = document.getElementById('negosiasiBatalBtn');
    if (batalBtn) { const newBatalBtn = batalBtn.cloneNode(true); batalBtn.parentNode.replaceChild(newBatalBtn, batalBtn); newBatalBtn.onclick = () => { closeModal('prospekNegosiasiModal'); }; }
}

// ==================== CLOSING & TIDAK TERTARIK ====================
async function saveToClosingDB(id, data) {
    try { await db.collection('db_closing').add({ nama: data.nama, hp: data.hp, tanggal: data.tanggal || getTodayDate(), closing_date: new Date().toISOString(), user_id: data.user_id, followup_data: data.followup_data || null, pending_data: data.pending_data || [] }); await db.collection('customers').doc(id).delete(); showNotif('✅ Data berhasil masuk Database Closing!'); updateAllBadges(); return true; }
    catch(e) { showNotif('❌ Gagal: ' + e.message, true); return false; }
}

async function saveToTidakTertarikDB(id, data) {
    try { await db.collection('db_tidak_tertarik').add({ nama: data.nama, hp: data.hp, tanggal: new Date().toISOString(), user_id: data.user_id, dihubungi_data: data.dihubungi_data || null, negosiasi_data: data.negosiasi_data || null }); await db.collection('prospek').doc(id).delete(); showNotif('✅ Data berhasil masuk Database Tidak Tertarik!'); updateAllBadges(); return true; }
    catch(e) { showNotif('❌ Gagal: ' + e.message, true); return false; }
}

window.confirmClosing = async function(id) { showConfirmDialog('Pindahkan ke Database Closing?', `Apakah Anda yakin ingin memindahkan data ini ke DATABASE CLOSING?\n\n⚠️ Data yang sudah dipindahkan TIDAK BISA dikembalikan ke Followup Agen!`, async () => { const doc = await db.collection('customers').doc(id).get(); if (doc.exists) await saveToClosingDB(id, doc.data()); loadAllData(); updateAllBadges(); }, async () => { await db.collection('customers').doc(id).update({ status: 'closing' }); showNotif('📌 Data tetap di kolom Closing'); loadAllData(); updateAllBadges(); }); };

window.saveToClosingNow = async function(id) { showConfirmDialog('Pindahkan ke Database Closing?', `Apakah Anda yakin ingin memindahkan customer ini ke DATABASE CLOSING?\n\n⚠️ Data yang sudah dipindahkan TIDAK BISA dikembalikan ke Followup Agen!`, async () => { try { const doc = await db.collection('customers').doc(id).get(); if (doc.exists) { await saveToClosingDB(id, doc.data()); closeModal('detailModal'); showNotif('✅ Data berhasil dipindahkan ke DB Closing'); updateAllBadges(); } } catch(err) { showNotif('❌ Gagal: ' + err.message, true); } }); };

window.showConvertToCustomerModal = async function(prospekId) {
    const doc = await db.collection('prospek').doc(prospekId).get();
    const data = doc.data();
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    const followupDate = nextMonth.toISOString().split('T')[0];
    showInputDialog('📋 Lengkapi Data Customer', `Data prospek "${escapeHtml(data.nama)}" akan dipindahkan ke Followup Agen.\n\nSilakan lengkapi data berikut:`, [{ id: 'inputAgentId', label: 'ID Agent', type: 'text', placeholder: 'Contoh: AG-001', required: true }, { id: 'inputAplikasi', label: 'Aplikasi', type: 'select', options: ['GNP', 'BSB', 'BTN'], required: true }], async (values) => {
        if (!values.inputAgentId || !values.inputAplikasi) { showNotifTop('⚠️ ID Agent dan Aplikasi wajib diisi!', true); return; }
        const cleanHp = data.hp;
        const { duplicateAgent: dupAgent, duplicateHp: dupHp } = await checkDuplicateCustomer(values.inputAgentId, cleanHp);
        if (dupAgent) { showNotifTop(`⚠️ ID Agent "${values.inputAgentId}" sudah terdaftar oleh ${dupAgent.owner}!`, true); return; }
        if (dupHp) { showNotifTop(`⚠️ Nomor WhatsApp "${cleanHp}" sudah terdaftar oleh ${dupHp.owner}!`, true); return; }
        showConfirmDialog('Jadikan Customer & Pindahkan ke DB Commitment?', `Apakah Anda yakin ingin menjadikan "${escapeHtml(data.nama)}" sebagai Customer?\n\n🆔 ID Agent: ${values.inputAgentId}\n📱 Aplikasi: ${values.inputAplikasi}\n📅 Tanggal Followup: ${followupDate}\n\n📋 Data akan DISIMPAN ke DATABASE COMMITMENT sebagai arsip.\n📞 Data akan DIPINDAHKAN ke FOLLOWUP AGEN dengan status "Baru".\n\n⚠️ Proses ini TIDAK BISA dibatalkan dan data akan DIHAPUS dari Prospek Agen!`, async () => {
            try { showNotifTop('⏳ Memproses pemindahan data...'); await db.collection('db_commitment').add({ nama: data.nama, hp: data.hp, negosiasi_data: data.negosiasi_data || null, agent_id: values.inputAgentId, aplikasi: values.inputAplikasi, committed_at: new Date().toISOString(), user_id: data.user_id, original_prospek_id: prospekId, followup_date: followupDate }); await db.collection('customers').add({ agent_id: values.inputAgentId, nama: data.nama, hp: data.hp, apk: values.inputAplikasi, tanggal: followupDate, status: 'baru', user_id: data.user_id, created_at: new Date().toISOString(), converted_from: 'prospek_commitment', followup_data: null, pending_data: [] }); await db.collection('prospek').doc(prospekId).delete(); showNotifTop('✅ Berhasil! Customer telah ditambahkan ke Followup Agen dan disimpan ke DB Commitment'); closeModal('detailModal'); closeModal('convertModal'); loadAllData(); updateAllBadges(); }
            catch(error) { showNotifTop('❌ Gagal: ' + error.message, true); console.error(error); }
        });
    });
};

function setupConvertModal() {
    const confirmBtn = document.getElementById('confirmConvertBtn');
    const cancelBtn = document.getElementById('cancelConvertBtn');
    const modal = document.getElementById('convertModal');
    if (!modal) return;
    if (confirmBtn) { const newConfirmBtn = confirmBtn.cloneNode(true); confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn); newConfirmBtn.onclick = async function(e) { e.preventDefault(); e.stopPropagation(); const agentId = document.getElementById('convertAgentId')?.value; const followupDate = document.getElementById('convertFollowupDate')?.value; if (!agentId) { alert('⚠️ ID Agent wajib diisi!'); return; } if (!followupDate) { alert('⚠️ Tanggal followup wajib diisi!'); return; } if (!currentConvertProspekId) { alert('⚠️ Error: Data prospek tidak ditemukan'); return; } showConfirmDialog('Pindahkan ke Followup Agen?', `Apakah Anda yakin ingin memindahkan prospek ini ke FOLLOWUP AGEN dengan ID Agent: ${agentId}?\n\n⚠️ Data yang sudah dipindahkan TIDAK BISA dikembalikan ke Prospek Agen!`, async () => { try { showNotif('⏳ Memproses pemindahan...'); const prospekDoc = await db.collection('prospek').doc(currentConvertProspekId).get(); const prospekData = prospekDoc.data(); if (!prospekData) { showNotif('❌ Data prospek tidak ditemukan', true); return; } const cleanHp = prospekData.hp; const { duplicateAgent, duplicateHp } = await checkDuplicateCustomer(agentId, cleanHp); if (duplicateAgent) { showNotif(`⚠️ ID Agent "${agentId}" sudah terdaftar oleh ${duplicateAgent.owner}!`, true); return; } if (duplicateHp) { showNotif(`⚠️ Nomor WhatsApp "${cleanHp}" sudah terdaftar oleh ${duplicateHp.owner}!`, true); return; } await db.collection('customers').add({ agent_id: agentId, nama: prospekData.nama, hp: prospekData.hp, tanggal: followupDate, status: 'baru', apk: '', user_id: prospekData.user_id, created_at: new Date().toISOString(), followup_data: null, pending_data: [] }); await db.collection('prospek').doc(currentConvertProspekId).delete(); modal.style.display = 'none'; document.body.classList.remove('modal-open'); closeModal('detailModal'); showNotif('✅ Berhasil dipindahkan ke Followup Agen!'); loadAllData(); } catch(error) { showNotif('❌ Gagal: ' + error.message, true); } }); }; }
    if (cancelBtn) { const newCancelBtn = cancelBtn.cloneNode(true); cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn); newCancelBtn.onclick = function(e) { e.preventDefault(); e.stopPropagation(); modal.style.display = 'none'; document.body.classList.remove('modal-open'); }; }
    modal.onclick = function(e) { if (e.target === modal) { modal.style.display = 'none'; document.body.classList.remove('modal-open'); } };
}

// ==================== DATABASE AGENT ====================
async function loadDatabaseAgent() {
    if (!currentUser) return;
    const isOwner = currentUserRole === 'owner';
    let query = db.collection('db_agent');
    if (!isOwner) query = query.where('user_id', '==', currentUser.uid);
    const snapshot = await query.get();
    const items = [];
    for (const doc of snapshot.docs) {
        const d = doc.data();
        let ownerName = '';
        if (isOwner && d.user_id !== currentUser.uid) { const userDoc = await db.collection('users').doc(d.user_id).get(); ownerName = userDoc.exists ? ` (${userDoc.data().nama || 'CS'})` : ''; }
        items.push({ id: doc.id, nama: d.nama + ownerName, hp: d.hp || '', agent_id: d.agent_id || '-', agent_type: d.agent_type || '-', apk: d.apk || '', createdAt: d.created_at, checked: selectedAgentIds.get(doc.id) || false, upline: d.upline || '', cid: d.cid || '', jenis_bank: d.jenis_bank || '' });
    }
    agentsData = items;
    renderAgentList(items);
}

function renderAgentList(items) {
    const container = document.getElementById('dbAgentList');
    if (!container) return;
    const totalCountSpan = document.getElementById('agentTotalCount');
    if (totalCountSpan) totalCountSpan.innerText = items.length;
    const searchTerm = document.getElementById('searchAgentInput')?.value.toLowerCase() || '';
    const filterUpline = document.getElementById('filterUplineAgent')?.value.toLowerCase() || '';
    const filterCid = document.getElementById('filterCidAgent')?.value.toLowerCase() || '';
    const filterBank = document.getElementById('filterBankAgent')?.value || '';
    const filterDate = document.getElementById('filterDateAgent')?.value || '';
    const filterHasHp = document.getElementById('filterHasHpAgent')?.checked || false;
    const filterHasApk = document.getElementById('filterHasApkAgent')?.checked || false;
    let filtered = [...items];
    if (searchTerm) filtered = filtered.filter(item => (item.nama && String(item.nama).toLowerCase().includes(searchTerm)) || (item.agent_id && String(item.agent_id).toLowerCase().includes(searchTerm)) || (item.hp && String(item.hp).includes(searchTerm)));
    if (filterUpline) filtered = filtered.filter(item => item.upline && String(item.upline).toLowerCase().includes(filterUpline));
    if (filterCid) filtered = filtered.filter(item => item.cid && String(item.cid).toLowerCase().includes(filterCid));
    if (filterBank) filtered = filtered.filter(item => item.jenis_bank === filterBank);
    if (filterDate) { const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); if (filterDate === 'today') filtered = filtered.filter(item => { const itemDate = item.createdAt ? new Date(item.createdAt) : new Date(0); return itemDate >= today; }); else if (filterDate === 'week') { const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7); filtered = filtered.filter(item => { const itemDate = item.createdAt ? new Date(item.createdAt) : new Date(0); return itemDate >= weekAgo; }); } else if (filterDate === 'month') { const monthAgo = new Date(today); monthAgo.setDate(today.getDate() - 30); filtered = filtered.filter(item => { const itemDate = item.createdAt ? new Date(item.createdAt) : new Date(0); return itemDate >= monthAgo; }); } }
    if (filterHasHp) filtered = filtered.filter(item => item.hp && String(item.hp).length > 5);
    if (filterHasApk) filtered = filtered.filter(item => item.apk && item.apk !== '-');
    agentsFilteredData = filtered;
    const filteredCountSpan = document.getElementById('agentFilteredCount');
    if (filteredCountSpan) filteredCountSpan.innerText = filtered.length;
    if (filtered.length === 0) { container.innerHTML = '<p style="text-align:center;padding:40px;color:#9ca3af;">📭 Tidak ada data yang sesuai filter</p>'; return; }
    const MAX_RENDER = 200;
    let renderData = filtered;
    let truncated = false;
    if (filtered.length > MAX_RENDER) { renderData = filtered.slice(0, MAX_RENDER); truncated = true; console.warn(`⚠️ Menampilkan ${MAX_RENDER} dari ${filtered.length} data. Gunakan filter untuk menyaring.`); }
    let html = '';
    if (truncated) html += `<div style="background: #fef3c7; padding: 8px 12px; border-radius: 8px; margin-bottom: 16px; color: #d97706; font-size: 12px; text-align: center;">⚠️ Menampilkan ${MAX_RENDER} dari ${filtered.length} data. Gunakan filter untuk menyaring data.</div>`;
    for (const item of renderData) { const isChecked = selectedAgentIds.get(item.id) === true; html += `<div class="db-item-agent" data-id="${item.id}"><input type="checkbox" class="db-item-checkbox-agent" data-id="${item.id}" ${isChecked ? 'checked' : ''}><div class="db-item-agent-info"><h4>${escapeHtml(String(item.nama || '-'))}</h4><p>📱 ${escapeHtml(String(item.hp || '-'))} | 🆔 ${escapeHtml(String(item.agent_id || '-'))} | 🏷️ ${escapeHtml(String(item.agent_type || '-'))}</p><p>👤 Upline: ${escapeHtml(String(item.upline || '-'))} | 🆔 CID: ${escapeHtml(String(item.cid || '-'))} | 🏦 Bank: ${escapeHtml(String(item.jenis_bank || '-'))}</p><small>📅 ${item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : '-'}</small></div><div class="db-item-agent-actions"><button class="db-item-wa" onclick="event.stopPropagation(); openWA('${escapeHtml(String(item.hp || ''))}')">💬 WA</button><button class="db-item-move-followup" onclick="event.stopPropagation(); moveAgentToFollowup('${item.id}')">📞 Pindah ke Followup</button><button class="db-item-delete" onclick="event.stopPropagation(); deleteAgentItem('${item.id}')">🗑️ Hapus</button></div></div>`; }
    container.innerHTML = html;
    document.querySelectorAll('#dbAgentList .db-item-checkbox-agent').forEach(cb => { cb.removeEventListener('change', handleCheckboxChange); cb.addEventListener('change', handleCheckboxChange); function handleCheckboxChange(e) { e.stopPropagation(); const id = cb.dataset.id; if (cb.checked) selectedAgentIds.set(id, true); else selectedAgentIds.delete(id); updateSelectAllAgentButton(); } });
    document.querySelectorAll('#dbAgentList .db-item-agent').forEach(el => { el.removeEventListener('click', handleItemClick); el.addEventListener('click', handleItemClick); function handleItemClick(e) { if (e.target.type !== 'checkbox' && !e.target.classList.contains('db-item-wa') && !e.target.classList.contains('db-item-move-followup') && !e.target.classList.contains('db-item-delete')) openAgentDetail(el.dataset.id); } });
    updateSelectAllAgentButton();
}

function updateSelectAllAgentButton() {
    const btn = document.getElementById('selectAllAgent');
    if (!btn) return;
    if (!agentsFilteredData || agentsFilteredData.length === 0) { btn.textContent = '✅ Pilih Semua'; return; }
    const allChecked = agentsFilteredData.every(item => selectedAgentIds.get(item.id) === true);
    btn.textContent = allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua';
    console.log('Update tombol:', btn.textContent);
}

async function moveAgentToFollowup(agentId) {
    const doc = await db.collection('db_agent').doc(agentId).get();
    if (!doc.exists) return;
    const data = doc.data();
    const { duplicateAgent, duplicateHp } = await checkDuplicateCustomer(data.agent_id, data.hp);
    if (duplicateAgent) { showNotifTop(`⚠️ ID Agent "${data.agent_id}" sudah terdaftar!`, true); return; }
    if (duplicateHp) { showNotifTop(`⚠️ Nomor WhatsApp "${data.hp}" sudah terdaftar!`, true); return; }
    showConfirmDialog('Pindahkan ke Followup Agen?', `Apakah Anda yakin ingin memindahkan agent "${escapeHtml(data.nama)}" ke FOLLOWUP AGEN?\n\nData akan dipindahkan dengan status "Baru".`, async () => { await db.collection('customers').add({ agent_id: data.agent_id, nama: data.nama, hp: data.hp, apk: data.apk || '', agent_type: data.agent_type || '', tanggal: getTodayDate(), status: 'baru', user_id: data.user_id, created_at: new Date().toISOString(), followup_data: null, pending_data: [] }); await db.collection('db_agent').doc(agentId).delete(); showNotifTop('✅ Agent berhasil dipindahkan ke Followup Agen!'); loadDatabaseAgent(); loadAllData(); });
}

window.deleteSelectedAgent = async function() {
    const selectedIds = Array.from(selectedAgentIds.keys());
    if (selectedIds.length === 0) { showNotifTop('⚠️ Tidak ada data yang dipilih', true); return; }
    if (!confirm(`Hapus ${selectedIds.length} data agent yang dipilih?\n\nProses akan berjalan di background.`)) return;
    const progress = showFloatingProgress('🗑️ Menghapus Data Agent', selectedIds.length);
    progress.update(0, '🗑️ Menghapus', 'Memulai proses hapus data...');
    let deleted = 0, failed = 0;
    const failedIds = [];
    const BATCH_SIZE = 10;
    for (let i = 0; i < selectedIds.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = selectedIds.slice(i, i + BATCH_SIZE);
        for (const id of chunk) batch.delete(db.collection('db_agent').doc(id));
        try { await batch.commit(); deleted += chunk.length; for (const id of chunk) { selectedAgentIds.delete(id); const index = agentsData.findIndex(item => item.id === id); if (index !== -1) agentsData.splice(index, 1); } }
        catch(e) { console.error(`Batch ${i/BATCH_SIZE + 1} gagal:`, e); failed += chunk.length; failedIds.push(...chunk); }
        const percent = Math.floor(((deleted + failed) / selectedIds.length) * 100);
        progress.update(percent, '🗑️ Menghapus', `Memproses... (${deleted + failed}/${selectedIds.length})`, deleted + failed, selectedIds.length);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (failedIds.length > 0) { progress.update(95, '🗑️ Menghapus', `Mencoba ulang ${failedIds.length} data yang gagal...`); for (const id of failedIds) { try { await db.collection('db_agent').doc(id).delete(); deleted++; failed--; selectedAgentIds.delete(id); const index = agentsData.findIndex(item => item.id === id); if (index !== -1) agentsData.splice(index, 1); await new Promise(resolve => setTimeout(resolve, 200)); } catch(e) { console.error(`Gagal hapus ${id}:`, e); } } }
    renderAgentList(agentsData);
    progress.update(100, '✅ Selesai', `Berhasil: ${deleted}, Gagal: ${failed}`, selectedIds.length, selectedIds.length);
    showNotifTop(`✅ ${deleted} data agent berhasil dihapus${failed > 0 ? `, ${failed} gagal` : ''}`);
    setTimeout(() => { if (progress && progress.hide) progress.hide(); }, 3000);
};

window.deleteAgentItem = async function(id) {
    if (!confirm('Yakin hapus data agent ini? Data akan dihapus permanen!')) return;
    const progress = showFloatingProgress('🗑️ Menghapus Data Agent', 1);
    progress.update(50, '🗑️ Menghapus', 'Menghapus data agent...', 0, 1);
    try { await db.collection('db_agent').doc(id).delete(); selectedAgentIds.delete(id); const index = agentsData.findIndex(item => item.id === id); if (index !== -1) agentsData.splice(index, 1); const filteredIndex = agentsFilteredData.findIndex(item => item.id === id); if (filteredIndex !== -1) agentsFilteredData.splice(filteredIndex, 1); renderAgentList(agentsData); progress.update(100, '✅ Selesai', 'Data agent berhasil dihapus', 1, 1); showNotifTop('🗑️ Data agent berhasil dihapus'); await new Promise(resolve => setTimeout(resolve, 500)); setTimeout(() => { if (progress && progress.hide) progress.hide(); }, 1500); }
    catch(e) { console.error('Error delete single:', e); showNotifTop('❌ Gagal hapus: ' + e.message, true); if (progress && progress.hide) progress.hide(); }
};

window.deleteSelectedAgentBatch = async function() {
    const selectedIds = Array.from(selectedAgentIds.keys());
    if (selectedIds.length === 0) { showNotifTop('⚠️ Tidak ada data yang dipilih', true); return; }
    if (!confirm(`Hapus ${selectedIds.length} data agent yang dipilih? Data akan dihapus permanen!`)) return;
    showNotifTop(`⏳ Menghapus ${selectedIds.length} data agent...`);
    try { const BATCH_SIZE = 450; const batches = []; for (let i = 0; i < selectedIds.length; i += BATCH_SIZE) { const batch = db.batch(); const chunk = selectedIds.slice(i, i + BATCH_SIZE); for (const id of chunk) batch.delete(db.collection('db_agent').doc(id)); batches.push(batch.commit()); } await Promise.all(batches); for (const id of selectedIds) { selectedAgentIds.delete(id); const index = agentsData.findIndex(item => item.id === id); if (index !== -1) agentsData.splice(index, 1); const filteredIndex = agentsFilteredData.findIndex(item => item.id === id); if (filteredIndex !== -1) agentsFilteredData.splice(filteredIndex, 1); } renderAgentList(agentsData); showNotifTop(`✅ ${selectedIds.length} data agent berhasil dihapus`); }
    catch(e) { console.error('Error delete selected batch:', e); showNotifTop('❌ Gagal menghapus: ' + e.message, true); }
};

window.deleteSelectedAgentSafe = async function() {
    const selectedIds = Array.from(selectedAgentIds.keys());
    if (selectedIds.length === 0) { showNotifTop('⚠️ Tidak ada data yang dipilih', true); return; }
    if (!confirm(`Hapus ${selectedIds.length} data agent satu per satu?\n\nProses akan lebih lambat tapi pasti berhasil.\n\nKlik OK untuk melanjutkan.`)) return;
    const progress = showFloatingProgress('🗑️ Menghapus Data Agent (Mode Aman)', selectedIds.length);
    progress.update(0, '🗑️ Menghapus', 'Memulai proses hapus data...');
    let deleted = 0, failed = 0;
    for (let i = 0; i < selectedIds.length; i++) { const id = selectedIds[i]; try { await db.collection('db_agent').doc(id).delete(); deleted++; selectedAgentIds.delete(id); const index = agentsData.findIndex(item => item.id === id); if (index !== -1) agentsData.splice(index, 1); } catch(e) { failed++; console.error(`Gagal hapus ${id}:`, e); } const percent = Math.floor(((deleted + failed) / selectedIds.length) * 100); progress.update(percent, '🗑️ Menghapus', `Memproses... (${deleted + failed}/${selectedIds.length})`, deleted + failed, selectedIds.length); if ((i + 1) % 10 === 0) renderAgentList(agentsData); await new Promise(resolve => setTimeout(resolve, 200)); }
    renderAgentList(agentsData);
    progress.update(100, '✅ Selesai', `Berhasil: ${deleted}, Gagal: ${failed}`, selectedIds.length, selectedIds.length);
    showNotifTop(`✅ ${deleted} data agent berhasil dihapus${failed > 0 ? `, ${failed} gagal` : ''}`);
    setTimeout(() => { if (progress && progress.hide) progress.hide(); }, 3000);
};

// ==================== IMPORT AGENT EXCEL ====================
async function getProdukMapCached() {
    if (produkMapCache) return produkMapCache;
    const produkSnapshot = await db.collection('produk').get();
    produkMapCache = new Map();
    produkSnapshot.forEach(doc => { const data = doc.data(); const namaLower = data.nama.toLowerCase().trim(); const namaClean = data.nama.toLowerCase().replace(/[^a-z]/g, ''); produkMapCache.set(namaLower, { id: doc.id, nama: data.nama, jenis_produk: data.jenis_produk || 'tanpa_admin', admin_default: data.admin_default || 0, cid_based: data.cid_based || false }); produkMapCache.set(namaClean, { id: doc.id, nama: data.nama, jenis_produk: data.jenis_produk || 'tanpa_admin', admin_default: data.admin_default || 0, cid_based: data.cid_based || false }); });
    return produkMapCache;
}

async function setupAgentImport() {
    const importBtn = document.getElementById('importAgentExcelBtn');
    const fileInput = document.getElementById('agentExcelFile');
    if (!importBtn || !fileInput) return;
    const newImportBtn = importBtn.cloneNode(true);
    importBtn.parentNode.replaceChild(newImportBtn, importBtn);
    newImportBtn.onclick = () => fileInput.click();
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const btn = newImportBtn;
        const originalText = btn.textContent;
        btn.textContent = '⏳ Memproses...';
        btn.disabled = true;
        const progress = showFloatingProgress('📥 Import Data Agent', 0);
        progress.update(0, '📥 Import Data', 'Membaca file Excel...');
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                progress.update(5, '📥 Import Data', 'Memproses file Excel...');
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rawJson = XLSX.utils.sheet_to_json(sheet, { defval: "", header: 1 });
                if (!rawJson || rawJson.length < 4) { showNotifTop('❌ File Excel kosong atau format tidak sesuai!', true); progress.hide(); return; }
                progress.update(10, '📥 Import Data', 'Memuat data produk...');
                const produkSnapshot = await db.collection('produk').get();
                const produkMap = new Map();
                const produkList = [];
                produkSnapshot.forEach(doc => { const data = doc.data(); produkList.push({ id: doc.id, nama: data.nama, jenis: data.jenis_produk }); const namaLower = data.nama.toLowerCase().trim(); const namaClean = namaLower.replace(/[^a-z0-9]/g, ''); produkMap.set(namaLower, data); produkMap.set(namaClean, data); });
                const headerRow1 = rawJson[0] || [];
                const headerRow2 = rawJson[1] || [];
                const headerRow3 = rawJson[2] || [];
                let agentIdCol = -1, namaCol = -1, hpCol = -1, apkCol = -1, agentTypeCol = -1, pemilikCol = -1, alamatCol = -1, emailCol = -1, tlpCol = -1, noRekeningCol = -1, atasNamaCol = -1, jenisBankCol = -1, noKtpCol = -1, cidCol = -1, uplineCol = -1;
                for (let i = 0; i < headerRow1.length; i++) { const val1 = String(headerRow1[i] || '').toUpperCase(); const val2 = String(headerRow2[i] || '').toUpperCase(); const val3 = String(headerRow3[i] || '').toUpperCase(); if (val1 === 'AGENT_ID' || val2 === 'AGENT_ID' || val3 === 'AGENT_ID') agentIdCol = i; if (val1 === 'NAMA' || val2 === 'NAMA' || val3 === 'NAMA') namaCol = i; if (val1 === 'HP' || val2 === 'HP' || val3 === 'HP') hpCol = i; if (val1 === 'APK' || val2 === 'APK' || val3 === 'APK') apkCol = i; if (val1 === 'AGENT_TYPE' || val2 === 'AGENT_TYPE') agentTypeCol = i; if (val1 === 'PEMILIK' || val2 === 'PEMILIK') pemilikCol = i; if (val1 === 'ALAMAT' || val2 === 'ALAMAT') alamatCol = i; if (val1 === 'EMAIL' || val2 === 'EMAIL') emailCol = i; if (val1 === 'TLP' || val2 === 'TLP') tlpCol = i; if (val1 === 'NO_REKENING' || val2 === 'NO_REKENING') noRekeningCol = i; if (val1 === 'ATAS_NAMA' || val2 === 'ATAS_NAMA') atasNamaCol = i; if (val1 === 'JENIS_BANK' || val2 === 'JENIS_BANK') jenisBankCol = i; if (val1 === 'NO_KTP' || val2 === 'NO_KTP') noKtpCol = i; if (val1 === 'CID' || val2 === 'CID') cidCol = i; if (val1 === 'UPLINE' || val2 === 'UPLINE') uplineCol = i; }
                if (agentIdCol === -1) { showNotifTop('❌ Kolom "AGENT_ID" tidak ditemukan!', true); progress.hide(); return; }
                progress.update(15, '📥 Import Data', 'Memeriksa duplikat data...');
                const allExistingAgents = await db.collection('db_agent').get();
                const existingAgentIds = new Set();
                allExistingAgents.forEach(doc => { const data = doc.data(); if (data.agent_id) existingAgentIds.add(data.agent_id); });
                const dataRows = rawJson.slice(3);
                const totalRows = dataRows.length;
                progress.setTotal(totalRows);
                progress.update(20, '📥 Import Data', `Memproses ${totalRows} baris data...`);
                const produkColumnMap = new Map();
                for (let i = 0; i < headerRow1.length; i++) { const colName = String(headerRow1[i] || '').trim().toLowerCase(); if (i === agentIdCol || i === namaCol || i === hpCol || i === apkCol || i === agentTypeCol || i === pemilikCol || i === alamatCol || i === emailCol || i === tlpCol || i === noRekeningCol || i === atasNamaCol || i === jenisBankCol || i === noKtpCol || i === cidCol || i === uplineCol) continue; if (colName.startsWith('profit_')) { const produkNama = colName.replace('profit_', '').replace(/_/g, ' '); if (!produkColumnMap.has(produkNama)) produkColumnMap.set(produkNama, { profitCol: i, feeCol: -1 }); else { const existing = produkColumnMap.get(produkNama); existing.profitCol = i; produkColumnMap.set(produkNama, existing); } } else if (colName.startsWith('fee_upline_')) { const produkNama = colName.replace('fee_upline_', '').replace(/_/g, ' '); if (!produkColumnMap.has(produkNama)) produkColumnMap.set(produkNama, { profitCol: -1, feeCol: i }); else { const existing = produkColumnMap.get(produkNama); existing.feeCol = i; produkColumnMap.set(produkNama, existing); } } }
                console.log('Produk column map:', Array.from(produkColumnMap.keys()));
                const BATCH_SIZE = 10;
                let batches = [];
                let currentBatch = db.batch();
                let operationCount = 0;
                let success = 0, failed = 0, duplicate = 0;
                const errors = [];
                for (let i = 0; i < dataRows.length; i++) { const row = dataRows[i]; if (!row || row.length === 0) continue; if (i % 50 === 0 || i === dataRows.length - 1) { const percent = 20 + Math.floor((i / totalRows) * 70); progress.update(percent, '📥 Import Data', `Memproses data... (${i + 1}/${totalRows})`, i + 1, totalRows); await new Promise(resolve => setTimeout(resolve, 5)); } try { let agentId = agentIdCol !== -1 ? (row[agentIdCol] || '') : ''; if (!agentId) { failed++; errors.push(`Baris ${i + 4}: ID Agent kosong`); continue; } agentId = String(agentId).trim().toUpperCase(); if (existingAgentIds.has(agentId)) { duplicate++; continue; } existingAgentIds.add(agentId); const agentRef = db.collection('db_agent').doc(); const agentData = { agent_id: agentId, nama: namaCol !== -1 ? (String(row[namaCol] || '').trim() || agentId) : agentId, hp: hpCol !== -1 ? formatPhoneNumber(row[hpCol] || '') : '', apk: apkCol !== -1 ? String(row[apkCol] || '').trim() : '', agent_type: agentTypeCol !== -1 ? String(row[agentTypeCol] || '').trim() : '', pemilik: pemilikCol !== -1 ? String(row[pemilikCol] || '').trim() : '', alamat: alamatCol !== -1 ? String(row[alamatCol] || '').trim() : '', email: emailCol !== -1 ? String(row[emailCol] || '').trim() : '', tlp: tlpCol !== -1 ? String(row[tlpCol] || '').trim() : '', no_rekening: noRekeningCol !== -1 ? String(row[noRekeningCol] || '').trim() : '', atas_nama: atasNamaCol !== -1 ? String(row[atasNamaCol] || '').trim() : '', jenis_bank: jenisBankCol !== -1 ? String(row[jenisBankCol] || '').trim() : '', no_ktp: noKtpCol !== -1 ? String(row[noKtpCol] || '').trim() : '', cid: cidCol !== -1 ? String(row[cidCol] || '').trim() : '', upline: uplineCol !== -1 ? String(row[uplineCol] || '').trim() : '', user_id: currentUser.uid, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), produk: [] }; const produkListData = []; for (const [produkNama, cols] of produkColumnMap.entries()) { let foundProduk = null; const searchNama = produkNama.toLowerCase().trim(); for (const p of produkList) { const pNamaLower = p.nama.toLowerCase(); const pNamaClean = pNamaLower.replace(/[^a-z0-9]/g, ''); const searchClean = searchNama.replace(/[^a-z0-9]/g, ''); if (pNamaLower === searchNama || pNamaClean === searchClean || pNamaLower.includes(searchNama) || searchNama.includes(pNamaLower)) { foundProduk = p; break; } } if (!foundProduk) { console.log(`Produk tidak ditemukan: ${produkNama}`); continue; } let profit = 0, feeUpline = 0; if (cols.profitCol !== -1 && cols.profitCol < row.length) { let val = row[cols.profitCol]; if (val !== undefined && val !== null && val !== '') profit = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]/g, '')) || 0; } if (cols.feeCol !== -1 && cols.feeCol < row.length) { let val = row[cols.feeCol]; if (val !== undefined && val !== null && val !== '') feeUpline = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]/g, '')) || 0; } console.log(`Produk: ${produkNama}, Profit: ${profit}, Fee Upline: ${feeUpline}`); let admin = 0, feeAgent = 0; if (foundProduk.jenis === 'beradmin') feeAgent = profit + feeUpline; produkListData.push({ produk_id: foundProduk.id, nama_produk: foundProduk.nama, profit: profit, fee_upline: feeUpline, fee_agent: feeAgent, admin: admin, qty: 1, added_at: new Date().toISOString() }); } agentData.produk = produkListData; console.log(`Agent ${agentId} memiliki ${produkListData.length} produk`); currentBatch.set(agentRef, agentData); operationCount++; success++; if (operationCount >= BATCH_SIZE) { await currentBatch.commit(); batches.push(currentBatch); currentBatch = db.batch(); operationCount = 0; await new Promise(resolve => setTimeout(resolve, 300)); } } catch (rowError) { failed++; errors.push(`Baris ${i + 4}: ${rowError.message}`); } }
                if (operationCount > 0) { await currentBatch.commit(); batches.push(currentBatch); }
                await new Promise(resolve => setTimeout(resolve, 1000));
                progress.update(92, '📥 Import Data', 'Menyimpan data ke database...', success, totalRows);
                let batchIndex = 0;
                for (const batch of batches) { batchIndex++; progress.update(92 + Math.floor((batchIndex / batches.length) * 8), '📥 Import Data', `Menyimpan batch ${batchIndex}/${batches.length}...`, success, totalRows); await batch.commit(); await new Promise(resolve => setTimeout(resolve, 50)); }
                progress.update(100, '✅ Import Selesai', `Berhasil: ${success}, Duplikat: ${duplicate}, Gagal: ${failed}`, success, totalRows);
                setTimeout(() => { if (progress && progress.hide) progress.hide(); }, 2000);
                let resultMsg = `✅ Import selesai!\n📊 Total data: ${totalRows}\n✅ Berhasil: ${success}\n⏭ Duplikat: ${duplicate}\n❌ Gagal: ${failed}`;
                if (errors.length > 0 && errors.length <= 5) resultMsg += `\n\n❌ Error:\n${errors.join('\n')}`;
                else if (errors.length > 5) resultMsg += `\n\n❌ ${errors.length} error terjadi.`;
                alert(resultMsg);
                await loadDatabaseAgent();
                fileInput.value = '';
            } catch (err) { console.error('Import error:', err); showNotifTop('❌ Gagal memproses file: ' + err.message, true); if (progress) progress.hide(); }
            finally { btn.textContent = originalText; btn.disabled = false; }
        };
        reader.onerror = () => { showNotifTop('❌ Gagal membaca file', true); btn.textContent = originalText; btn.disabled = false; if (progress) progress.hide(); };
        reader.readAsArrayBuffer(file);
    };
}

async function downloadAgentExample() {
    try { showNotifTop('⏳ Memuat data produk...'); const produkSnapshot = await db.collection('produk').get(); const produkList = []; produkSnapshot.forEach(doc => { produkList.push({ id: doc.id, nama: doc.data().nama }); }); if (produkList.length === 0) { showNotifTop('⚠️ Belum ada data produk. Silakan tambahkan produk terlebih dahulu!', true); return; } const baseData = { 'agent_id': 'AG-001', 'nama': 'Budi Santoso', 'agent_type': 'CollectingAgent (CA)', 'pemilik': 'PT. Contoh', 'alamat': 'Jl. Raya No. 123, Jakarta', 'email': 'budi@example.com', 'hp': '6281234567890', 'upline': 'KORWIL Jakarta', 'no_rekening': '1234567890', 'atas_nama': 'Budi Santoso', 'jenis_bank': 'BCA', 'no_ktp': '3172010101950001', 'cid': '5213247', 'apk': 'GNP' }; const produkColumns = {}; for (const produk of produkList) { let cleanNama = produk.nama.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').toLowerCase(); produkColumns[`profit_${cleanNama}`] = 0; produkColumns[`fee_upline_${cleanNama}`] = 0; } if (produkList.length > 0) { const firstProductClean = produkList[0].nama.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').toLowerCase(); produkColumns[`profit_${firstProductClean}`] = 5000; produkColumns[`fee_upline_${firstProductClean}`] = 1000; } if (produkList.length > 1) { const secondProductClean = produkList[1].nama.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').toLowerCase(); produkColumns[`profit_${secondProductClean}`] = 3000; produkColumns[`fee_upline_${secondProductClean}`] = 500; } const exampleData = [{ ...baseData, ...produkColumns }]; const ws = XLSX.utils.json_to_sheet(exampleData); ws['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 10 }]; for (const produk of produkList) { ws['!cols'].push({ wch: 15 }); ws['!cols'].push({ wch: 15 }); } const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Database Agent'); XLSX.writeFile(wb, `contoh_database_agent_${new Date().toISOString().split('T')[0]}.xlsx`); showNotifTop('📋 Contoh file Excel berhasil diunduh (Fee Agent akan dihitung otomatis)'); }
    catch (error) { console.error('Error download contoh:', error); showNotifTop('❌ Gagal mengunduh contoh: ' + error.message, true); }
}

async function exportAgentToExcel() {
    if (agentsData.length === 0) { showNotifTop('Tidak ada data untuk diexport', true); return; }
    const produkSnapshot = await db.collection('produk').get(); const produkList = []; produkSnapshot.forEach(doc => { produkList.push({ id: doc.id, nama: doc.data().nama }); }); const exportData = [];
    for (const agent of agentsData) { const row = { 'agent_id': agent.agent_id, 'nama': agent.nama.replace(/ \(.*\)/, ''), 'agent_type': agent.agent_type, 'pemilik': agent.pemilik || '', 'alamat': agent.alamat || '', 'email': agent.email || '', 'hp': agent.hp || '', 'upline': agent.upline || '', 'no_rekening': agent.no_rekening || '', 'atas_nama': agent.atas_nama || '', 'jenis_bank': agent.jenis_bank || '', 'no_ktp': agent.no_ktp || '', 'cid': agent.cid || '', 'apk': agent.apk || '' }; for (const produk of produkList) { const cleanNama = produk.nama.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').toLowerCase(); const agentProduk = agent.produk?.find(p => p.produk_id === produk.id); row[`profit_${cleanNama}`] = agentProduk?.profit || 0; row[`fee_upline_${cleanNama}`] = agentProduk?.fee_upline || 0; row[`fee_agent_${cleanNama}`] = agentProduk?.fee_agent || 0; } exportData.push(row); }
    const ws = XLSX.utils.json_to_sheet(exportData); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Database Agent'); XLSX.writeFile(wb, `database_agent_${new Date().toISOString().split('T')[0]}.xlsx`); showNotifTop('✅ Export data berhasil!');
}

function setupAgentFilters() {
    const searchInput = document.getElementById('searchAgentInput'), filterUpline = document.getElementById('filterUplineAgent'), filterCid = document.getElementById('filterCidAgent'), filterBank = document.getElementById('filterBankAgent'), filterDate = document.getElementById('filterDateAgent'), filterHasHp = document.getElementById('filterHasHpAgent'), filterHasApk = document.getElementById('filterHasApkAgent'), resetBtn = document.getElementById('resetAgentFilterBtn');
    const applyFilters = () => { renderAgentList(agentsData); };
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (filterUpline) filterUpline.addEventListener('input', applyFilters);
    if (filterCid) filterCid.addEventListener('input', applyFilters);
    if (filterBank) filterBank.addEventListener('change', applyFilters);
    if (filterDate) filterDate.addEventListener('change', applyFilters);
    if (filterHasHp) filterHasHp.addEventListener('change', applyFilters);
    if (filterHasApk) filterHasApk.addEventListener('change', applyFilters);
    if (resetBtn) resetBtn.onclick = () => { if (searchInput) searchInput.value = ''; if (filterUpline) filterUpline.value = ''; if (filterCid) filterCid.value = ''; if (filterBank) filterBank.value = ''; if (filterDate) filterDate.value = ''; if (filterHasHp) filterHasHp.checked = false; if (filterHasApk) filterHasApk.checked = false; applyFilters(); };
}

// ==================== SEARCH FUNCTIONS ====================
async function performSearch() {
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!keyword) { showNotif('⚠️ Masukkan kata kunci pencarian!', true); return; }
    const searchCustomer = document.getElementById('searchCustomer').checked, searchProspek = document.getElementById('searchProspek').checked, searchClosing = document.getElementById('searchClosing').checked, searchTidak = document.getElementById('searchTidak').checked, searchNomorSalah = document.getElementById('searchNomorSalah').checked, searchCommitment = document.getElementById('searchCommitment').checked;
    const results = [], today = getTodayDate();
    let customersQuery, prospekQuery, closingQuery, tidakQuery, nomorSalahQuery, commitmentQuery;
    if (currentUserRole === 'owner') { customersQuery = db.collection('customers'); prospekQuery = db.collection('prospek'); closingQuery = db.collection('db_closing'); tidakQuery = db.collection('db_tidak_tertarik'); nomorSalahQuery = db.collection('nomor_salah'); commitmentQuery = db.collection('db_commitment'); }
    else { customersQuery = db.collection('customers').where('user_id', '==', currentUser.uid); prospekQuery = db.collection('prospek').where('user_id', '==', currentUser.uid); closingQuery = db.collection('db_closing').where('user_id', '==', currentUser.uid); tidakQuery = db.collection('db_tidak_tertarik').where('user_id', '==', currentUser.uid); nomorSalahQuery = db.collection('nomor_salah').where('user_id', '==', currentUser.uid); commitmentQuery = db.collection('db_commitment').where('user_id', '==', currentUser.uid); }
    if (searchCustomer) { const snapshot = await customersQuery.get(); for (const doc of snapshot.docs) { const data = doc.data(); const searchText = `${data.agent_id || ''} ${data.nama || ''} ${data.hp || ''}`.toLowerCase(); if (searchText.includes(keyword)) { let ownerName = ''; if (currentUserRole === 'owner' && data.user_id !== currentUser.uid) { const userDoc = await db.collection('users').doc(data.user_id).get(); ownerName = userDoc.exists ? ` (${userDoc.data().nama || 'CS'})` : ''; } const isOverdue = data.tanggal && data.tanggal < today; results.push({ id: doc.id, type: 'customer', title: data.nama + ownerName, subtitle: `ID: ${data.agent_id || '-'} | ${data.hp}`, detail: `Status: ${data.status === 'followup' ? 'Follow Up' : data.status === 'baru' ? 'Baru' : data.status} | Deadline: ${data.tanggal || '-'}`, deadline: data.tanggal, isOverdue: isOverdue, badge: 'Followup Agen', badgeClass: 'badge-customer' }); } } }
    if (searchProspek) { const snapshot = await prospekQuery.get(); for (const doc of snapshot.docs) { const data = doc.data(); const searchText = `${data.nama || ''} ${data.hp || ''}`.toLowerCase(); if (searchText.includes(keyword)) { let ownerName = ''; if (currentUserRole === 'owner' && data.user_id !== currentUser.uid) { const userDoc = await db.collection('users').doc(data.user_id).get(); ownerName = userDoc.exists ? ` (${userDoc.data().nama || 'CS'})` : ''; } const isOverdue = data.deadline && data.deadline < today; results.push({ id: doc.id, type: 'prospek', title: data.nama + ownerName, subtitle: data.hp, detail: `Status: ${data.status || 'Baru'} | Deadline: ${data.deadline || '-'}`, deadline: data.deadline, isOverdue: isOverdue, badge: 'Prospek Agen', badgeClass: 'badge-prospek' }); } } }
    if (searchClosing) { const snapshot = await closingQuery.get(); for (const doc of snapshot.docs) { const data = doc.data(); const searchText = `${data.nama || ''} ${data.hp || ''}`.toLowerCase(); if (searchText.includes(keyword)) results.push({ id: doc.id, type: 'closing', title: data.nama, subtitle: data.hp, detail: `Closing: ${new Date(data.closing_date).toLocaleDateString('id-ID')}`, badge: 'DB Closing', badgeClass: 'badge-closing' }); } }
    if (searchTidak) { const snapshot = await tidakQuery.get(); for (const doc of snapshot.docs) { const data = doc.data(); const searchText = `${data.nama || ''} ${data.hp || ''}`.toLowerCase(); if (searchText.includes(keyword)) results.push({ id: doc.id, type: 'tidak', title: data.nama, subtitle: data.hp, detail: `Tanggal: ${new Date(data.tanggal).toLocaleDateString('id-ID')} | Alasan: ${data.alasan || 'Tidak tertarik'}`, badge: 'DB Tidak Tertarik', badgeClass: 'badge-tidak' }); } }
    if (searchNomorSalah) { const snapshot = await nomorSalahQuery.get(); for (const doc of snapshot.docs) { const data = doc.data(); const searchText = `${data.nama || ''} ${data.hp || ''}`.toLowerCase(); if (searchText.includes(keyword)) results.push({ id: doc.id, type: 'nomor_salah', title: data.nama, subtitle: data.hp, detail: `Tanggal: ${new Date(data.deleted_at).toLocaleDateString('id-ID')} | Alasan: ${data.alasan || 'Nomor salah'}`, badge: 'DB Nomor Salah', badgeClass: 'badge-nomor-salah' }); } }
    if (searchCommitment) { const snapshot = await commitmentQuery.get(); for (const doc of snapshot.docs) { const data = doc.data(); const searchText = `${data.nama || ''} ${data.hp || ''}`.toLowerCase(); if (searchText.includes(keyword)) results.push({ id: doc.id, type: 'commitment', title: data.nama, subtitle: data.hp, detail: `Komitmen: ${new Date(data.committed_at).toLocaleDateString('id-ID')} | Agent: ${data.agent_id || '-'}`, badge: 'DB Commitment', badgeClass: 'badge-commitment' }); } }
    const resultsContainer = document.getElementById('searchResults');
    if (results.length === 0) { resultsContainer.innerHTML = '<p style="text-align:center;padding:40px;color:#9ca3af;">🔍 Tidak ada data yang ditemukan</p>'; return; }
    results.sort((a, b) => { if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline); if (a.deadline) return -1; if (b.deadline) return 1; return 0; });
    resultsContainer.innerHTML = results.map(result => { const deadlineClass = result.isOverdue ? 'deadline-overdue' : (result.deadline === today ? 'deadline-today' : ''); return `<div class="search-result-item ${deadlineClass}" data-id="${result.id}" data-type="${result.type}"><div class="search-result-info"><h4>${escapeHtml(result.title)}</h4><p>${escapeHtml(result.subtitle)}</p><small>${escapeHtml(result.detail)}</small></div><span class="search-result-badge ${result.badgeClass}">${result.badge}</span></div>`; }).join('');
    document.querySelectorAll('.search-result-item').forEach(el => { el.addEventListener('click', () => { const id = el.dataset.id; const type = el.dataset.type; openSearchResultDetail(id, type); }); });
}

function openSearchResultDetail(id, type) { if (type === 'customer') openDetailCustomer(id); else if (type === 'prospek') openDetailProspek(id); else openDBDetailModal(id, type); }

function clearSearch() { document.getElementById('searchInput').value = ''; document.getElementById('searchResults').innerHTML = '<p style="text-align:center;padding:40px;color:#9ca3af;">🔍 Masukkan kata kunci untuk mencari data</p>'; }

document.getElementById('searchBtn')?.addEventListener('click', performSearch);
document.getElementById('clearSearchBtn')?.addEventListener('click', clearSearch);
document.getElementById('searchInput')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });

// ==================== DB ARCHIVES ====================
function getBaseQuery(collection, isOwner = false) { return isOwner ? db.collection(collection) : db.collection(collection).where('user_id', '==', currentUser.uid); }

function loadDBClosing() {
    if (!currentUser) return;
    const isOwner = currentUserRole === 'owner';
    const query = isOwner ? db.collection('db_closing') : db.collection('db_closing').where('user_id', '==', currentUser.uid);
    query.onSnapshot(async snap => { let items = []; for (const doc of snap.docs) { const d = doc.data(); let ownerName = ''; if (isOwner && d.user_id !== currentUser.uid) { const userDoc = await db.collection('users').doc(d.user_id).get(); ownerName = userDoc.exists ? ` (${userDoc.data().nama || 'CS'})` : ''; } items.push({ id: doc.id, nama: d.nama + ownerName, hp: d.hp, closing_date: d.closing_date, checked: selectedClosingIds.get(doc.id) || false }); } items.sort((a,b) => new Date(b.closing_date) - new Date(a.closing_date)); const html = items.map(item => `<div class="db-item" data-id="${item.id}" data-type="closing" style="cursor: pointer;"><input type="checkbox" class="db-item-checkbox" data-id="${item.id}" ${item.checked ? 'checked' : ''}><div class="db-item-info"><h4>${escapeHtml(item.nama)}</h4><p>${item.hp}</p><small>Closing: ${new Date(item.closing_date).toLocaleDateString('id-ID')}</small></div><div class="db-item-actions"><button class="db-item-wa" onclick="event.stopPropagation(); openWA('${item.hp}')">💬 WA</button><button class="db-item-delete" onclick="event.stopPropagation(); deleteDBItem('closing', '${item.id}')">🗑️ Hapus</button></div></div>`).join(''); const container = document.getElementById('dbClosingList'); if (container) { container.innerHTML = html || '<p style="text-align:center;padding:40px;">📭 Belum ada data closing</p>'; document.querySelectorAll('#dbClosingList .db-item').forEach(el => { el.addEventListener('click', (e) => { if (e.target.type !== 'checkbox' && !e.target.classList.contains('db-item-wa') && !e.target.classList.contains('db-item-delete')) openDBDetailModal(el.dataset.id, 'closing'); }); }); } attachCheckboxEvents('#dbClosingList', selectedClosingIds, 'selectAllClosing'); });
}

function loadDBTidak() {
    if (!currentUser) return;
    const isOwner = currentUserRole === 'owner';
    const query = isOwner ? db.collection('db_tidak_tertarik') : db.collection('db_tidak_tertarik').where('user_id', '==', currentUser.uid);
    query.onSnapshot(async snap => { let items = []; for (const doc of snap.docs) { const d = doc.data(); let ownerName = ''; if (isOwner && d.user_id !== currentUser.uid) { const userDoc = await db.collection('users').doc(d.user_id).get(); ownerName = userDoc.exists ? ` (${userDoc.data().nama || 'CS'})` : ''; } items.push({ id: doc.id, nama: d.nama + ownerName, hp: d.hp, tanggal: d.tanggal, checked: selectedTidakIds.get(doc.id) || false }); } items.sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal)); const html = items.map(item => `<div class="db-item" data-id="${item.id}" data-type="tidak" style="cursor: pointer;"><input type="checkbox" class="db-item-checkbox" data-id="${item.id}" ${item.checked ? 'checked' : ''}><div class="db-item-info"><h4>${escapeHtml(item.nama)}</h4><p>${item.hp}</p><small>Tanggal: ${new Date(item.tanggal).toLocaleDateString('id-ID')}</small></div><div class="db-item-actions"><button class="db-item-wa" onclick="event.stopPropagation(); openWA('${item.hp}')">💬 WA</button><button class="db-item-delete" onclick="event.stopPropagation(); deleteDBItem('tidak', '${item.id}')">🗑️ Hapus</button></div></div>`).join(''); const container = document.getElementById('dbTidakList'); if (container) { container.innerHTML = html || '<p style="text-align:center;padding:40px;">📭 Belum ada data tidak tertarik</p>'; document.querySelectorAll('#dbTidakList .db-item').forEach(el => { el.addEventListener('click', (e) => { if (e.target.type !== 'checkbox' && !e.target.classList.contains('db-item-wa') && !e.target.classList.contains('db-item-delete')) openDBDetailModal(el.dataset.id, 'tidak'); }); }); } attachCheckboxEvents('#dbTidakList', selectedTidakIds, 'selectAllTidak'); });
}

function loadDBNomorSalah() {
    if (!currentUser) return;
    const isOwner = currentUserRole === 'owner';
    const query = isOwner ? db.collection('nomor_salah') : db.collection('nomor_salah').where('user_id', '==', currentUser.uid);
    query.onSnapshot(async snap => { let items = []; for (const doc of snap.docs) { const d = doc.data(); let ownerName = ''; if (isOwner && d.user_id !== currentUser.uid) { const userDoc = await db.collection('users').doc(d.user_id).get(); ownerName = userDoc.exists ? ` (${userDoc.data().nama || 'CS'})` : ''; } items.push({ id: doc.id, nama: d.nama + ownerName, hp: d.hp, alasan: d.alasan, deleted_at: d.deleted_at, checked: selectedNomorSalahIds.get(doc.id) || false }); } items.sort((a,b) => new Date(b.deleted_at) - new Date(a.deleted_at)); const html = items.map(item => `<div class="db-item" data-id="${item.id}" data-type="nomor_salah" style="cursor: pointer;"><input type="checkbox" class="db-item-checkbox" data-id="${item.id}" ${item.checked ? 'checked' : ''}><div class="db-item-info"><h4>${escapeHtml(item.nama)}</h4><p>${item.hp}</p><small>Alasan: ${item.alasan}<br>Tanggal: ${new Date(item.deleted_at).toLocaleDateString('id-ID')}</small></div><div class="db-item-actions"><button class="db-item-wa" onclick="event.stopPropagation(); openWA('${item.hp}')">💬 WA</button><button class="db-item-delete" onclick="event.stopPropagation(); deleteDBItem('nomor_salah', '${item.id}')">🗑️ Hapus</button></div></div>`).join(''); const container = document.getElementById('dbNomorSalahList'); if (container) { container.innerHTML = html || '<p style="text-align:center;padding:40px;">📭 Belum ada data nomor salah</p>'; document.querySelectorAll('#dbNomorSalahList .db-item').forEach(el => { el.addEventListener('click', (e) => { if (e.target.type !== 'checkbox' && !e.target.classList.contains('db-item-wa') && !e.target.classList.contains('db-item-delete')) openDBDetailModal(el.dataset.id, 'nomor_salah'); }); }); } attachCheckboxEvents('#dbNomorSalahList', selectedNomorSalahIds, 'selectAllNomorSalah'); });
}

function loadDBCommitment() {
    if (!currentUser) return;
    const isOwner = currentUserRole === 'owner';
    const query = isOwner ? db.collection('db_commitment') : db.collection('db_commitment').where('user_id', '==', currentUser.uid);
    query.onSnapshot(async snap => { let items = []; for (const doc of snap.docs) { const d = doc.data(); let ownerName = ''; if (isOwner && d.user_id !== currentUser.uid) { const userDoc = await db.collection('users').doc(d.user_id).get(); ownerName = userDoc.exists ? ` (${userDoc.data().nama || 'CS'})` : ''; } items.push({ id: doc.id, nama: d.nama + ownerName, hp: d.hp, committed_at: d.committed_at, agent_id: d.agent_id, aplikasi: d.aplikasi, followup_date: d.followup_date, checked: selectedCommitmentIds.get(doc.id) || false }); } items.sort((a,b) => new Date(b.committed_at) - new Date(a.committed_at)); const html = items.map(item => `<div class="db-item" data-id="${item.id}" data-type="commitment" style="cursor: pointer;"><input type="checkbox" class="db-item-checkbox" data-id="${item.id}" ${item.checked ? 'checked' : ''}><div class="db-item-info"><h4>${escapeHtml(item.nama)}</h4><p>${item.hp}</p><small>Komitmen: ${new Date(item.committed_at).toLocaleDateString('id-ID')}<br>Followup: ${item.followup_date || '-'}<br>Agent: ${item.agent_id || '-'}<br>Aplikasi: ${item.aplikasi || '-'}</small></div><div class="db-item-actions"><button class="db-item-wa" onclick="event.stopPropagation(); openWA('${item.hp}')">💬 WA</button><button class="db-item-delete" onclick="event.stopPropagation(); deleteDBItem('db_commitment', '${item.id}')">🗑️ Hapus</button></div></div>`).join(''); const container = document.getElementById('dbCommitmentList'); if (container) { container.innerHTML = html || '<p style="text-align:center;padding:40px;">📭 Belum ada data komitmen</p>'; document.querySelectorAll('#dbCommitmentList .db-item').forEach(el => { el.addEventListener('click', (e) => { if (e.target.type !== 'checkbox' && !e.target.classList.contains('db-item-wa') && !e.target.classList.contains('db-item-delete')) openDBDetailModal(el.dataset.id, 'commitment'); }); }); } attachCheckboxEvents('#dbCommitmentList', selectedCommitmentIds, 'selectAllCommitment'); });
}

function attachCheckboxEvents(selector, map, selectAllId) {
    const checkboxes = document.querySelectorAll(`${selector} .db-item-checkbox`);
    checkboxes.forEach(cb => { cb.removeEventListener('change', handleCheckboxChange); cb.addEventListener('change', handleCheckboxChange); function handleCheckboxChange(e) { const id = cb.dataset.id; cb.checked ? map.set(id, true) : map.delete(id); const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(c => c.checked); const btn = document.getElementById(selectAllId); if (btn) btn.textContent = allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua'; } });
    const btn = document.getElementById(selectAllId);
    if (btn) { btn.onclick = () => { const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked); checkboxes.forEach(cb => { cb.checked = !allChecked; const id = cb.dataset.id; !allChecked ? map.set(id, true) : map.delete(id); }); btn.textContent = !allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua'; }; }
}

window.deleteDBItem = async function(type, id) {
    if (!confirm('Yakin hapus data ini? Data akan dihapus permanen!')) return;
    let collectionName = '', mapRef = null;
    switch(type) { case 'closing': collectionName = 'db_closing'; mapRef = selectedClosingIds; break; case 'tidak': collectionName = 'db_tidak_tertarik'; mapRef = selectedTidakIds; break; case 'nomor_salah': collectionName = 'nomor_salah'; mapRef = selectedNomorSalahIds; break; case 'db_commitment': collectionName = 'db_commitment'; mapRef = selectedCommitmentIds; break; default: showNotifTop('❌ Tipe tidak dikenal', true); return; }
    try { await db.collection(collectionName).doc(id).delete(); if (mapRef) mapRef.delete(id); showNotifTop('🗑️ Data berhasil dihapus'); if (type === 'closing') loadDBClosing(); else if (type === 'tidak') loadDBTidak(); else if (type === 'nomor_salah') loadDBNomorSalah(); else if (type === 'db_commitment') loadDBCommitment(); }
    catch(e) { showNotifTop('❌ Gagal hapus: ' + e.message, true); }
};

window.deleteSelectedClosing = async function() { const selectedIds = Array.from(selectedClosingIds.keys()); if (selectedIds.length === 0) { showNotifTop('⚠️ Tidak ada data yang dipilih', true); return; } if (!confirm(`Hapus ${selectedIds.length} data closing yang dipilih? Data akan dihapus permanen!`)) return; showNotifTop(`⏳ Menghapus ${selectedIds.length} data closing...`); try { const deletePromises = selectedIds.map(id => db.collection('db_closing').doc(id).delete()); await Promise.all(deletePromises); for (const id of selectedIds) selectedClosingIds.delete(id); showNotifTop(`✅ ${selectedIds.length} data closing berhasil dihapus`); loadDBClosing(); } catch(e) { showNotifTop('❌ Gagal hapus: ' + e.message, true); } };
window.deleteSelectedTidak = async function() { const selectedIds = Array.from(selectedTidakIds.keys()); if (selectedIds.length === 0) { showNotifTop('⚠️ Tidak ada data yang dipilih', true); return; } if (!confirm(`Hapus ${selectedIds.length} data tidak tertarik yang dipilih? Data akan dihapus permanen!`)) return; showNotifTop(`⏳ Menghapus ${selectedIds.length} data tidak tertarik...`); try { const deletePromises = selectedIds.map(id => db.collection('db_tidak_tertarik').doc(id).delete()); await Promise.all(deletePromises); for (const id of selectedIds) selectedTidakIds.delete(id); showNotifTop(`✅ ${selectedIds.length} data tidak tertarik berhasil dihapus`); loadDBTidak(); } catch(e) { showNotifTop('❌ Gagal hapus: ' + e.message, true); } };
window.deleteSelectedNomorSalah = async function() { const selectedIds = Array.from(selectedNomorSalahIds.keys()); if (selectedIds.length === 0) { showNotifTop('⚠️ Tidak ada data yang dipilih', true); return; } if (!confirm(`Hapus ${selectedIds.length} data nomor salah yang dipilih? Data akan dihapus permanen!`)) return; showNotifTop(`⏳ Menghapus ${selectedIds.length} data nomor salah...`); try { const deletePromises = selectedIds.map(id => db.collection('nomor_salah').doc(id).delete()); await Promise.all(deletePromises); for (const id of selectedIds) selectedNomorSalahIds.delete(id); showNotifTop(`✅ ${selectedIds.length} data nomor salah berhasil dihapus`); loadDBNomorSalah(); } catch(e) { showNotifTop('❌ Gagal hapus: ' + e.message, true); } };
window.deleteSelectedCommitment = async function() { const selectedIds = Array.from(selectedCommitmentIds.keys()); if (selectedIds.length === 0) { showNotifTop('⚠️ Tidak ada data yang dipilih', true); return; } if (!confirm(`Hapus ${selectedIds.length} data komitmen yang dipilih? Data akan dihapus permanen!`)) return; showNotifTop(`⏳ Menghapus ${selectedIds.length} data komitmen...`); try { const deletePromises = selectedIds.map(id => db.collection('db_commitment').doc(id).delete()); await Promise.all(deletePromises); for (const id of selectedIds) selectedCommitmentIds.delete(id); showNotifTop(`✅ ${selectedIds.length} data komitmen berhasil dihapus`); loadDBCommitment(); } catch(e) { showNotifTop('❌ Gagal hapus: ' + e.message, true); } };

function openDBDetailModal(id, type) {
    let collectionName = '', title = '';
    switch(type) { case 'closing': collectionName = 'db_closing'; title = 'Detail Database Closing'; break; case 'tidak': collectionName = 'db_tidak_tertarik'; title = 'Detail Database Tidak Tertarik'; break; case 'nomor_salah': collectionName = 'nomor_salah'; title = 'Detail Database Nomor Salah'; break; case 'commitment': collectionName = 'db_commitment'; title = 'Detail Database Commitment'; break; default: return; }
    db.collection(collectionName).doc(id).get().then(async doc => { if (!doc.exists) return; const d = doc.data(); let ownerInfo = ''; if (currentUserRole === 'owner' && d.user_id !== currentUser.uid) { const userDoc = await db.collection('users').doc(d.user_id).get(); const ownerName = userDoc.exists ? userDoc.data().nama || 'CS Agent' : 'CS Agent'; ownerInfo = `<div class="detail-info-item"><div class="detail-info-icon">👤</div><div class="detail-info-content"><label>Pemilik Data</label><div class="value">${escapeHtml(ownerName)}</div></div></div>`; } let detailHtml = ''; if (type === 'closing') { const pendingItems = d.pending_data || []; const completedCount = pendingItems.filter(item => item.checked === true && item.text?.trim() !== '').length; detailHtml = `${ownerInfo}<div class="detail-info-item"><div class="detail-info-icon">👤</div><div class="detail-info-content"><label>Nama</label><div class="value">${escapeHtml(d.nama)}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">📱</div><div class="detail-info-content"><label>Nomor WhatsApp</label><div class="value">${escapeHtml(d.hp)}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">📅</div><div class="detail-info-content"><label>Tanggal Closing</label><div class="value">${new Date(d.closing_date).toLocaleDateString('id-ID')}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">📅</div><div class="detail-info-content"><label>Deadline Terakhir</label><div class="value">${d.tanggal || '-'}</div></div></div>${d.followup_data ? `<div class="detail-info-item"><div class="detail-info-icon">✅</div><div class="detail-info-content"><label>Follow Up</label><div class="value">Terkirim: ${d.followup_data.terkirim ? 'Ya' : 'Tidak'} | Dibalas: ${d.followup_data.dibalas ? 'Ya' : 'Tidak'}</div></div></div>` : ''}${pendingItems.length > 0 ? `<div class="detail-info-item"><div class="detail-info-icon">📝</div><div class="detail-info-content"><label>Pending Responses</label><div class="value">${completedCount} / ${pendingItems.length} balasan tercatat</div></div></div>` : ''}`; } else if (type === 'tidak') { detailHtml = `${ownerInfo}<div class="detail-info-item"><div class="detail-info-icon">👤</div><div class="detail-info-content"><label>Nama</label><div class="value">${escapeHtml(d.nama)}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">📱</div><div class="detail-info-content"><label>Nomor WhatsApp</label><div class="value">${escapeHtml(d.hp)}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">📅</div><div class="detail-info-content"><label>Tanggal</label><div class="value">${new Date(d.tanggal).toLocaleDateString('id-ID')}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">❌</div><div class="detail-info-content"><label>Alasan</label><div class="value">${d.alasan || 'Tidak tertarik'}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">📌</div><div class="detail-info-content"><label>Status Sebelumnya</label><div class="value">${d.status_sebelumnya || '-'}</div></div></div>${d.negosiasi_data ? `<div class="detail-info-item"><div class="detail-info-icon">📋</div><div class="detail-info-content"><label>Data Negosiasi</label><div class="value">Aplikasi: ${d.negosiasi_data.aplikasi || '-'}<br>Domisili: ${d.negosiasi_data.domisili || '-'}<br>Transaksi: ${d.negosiasi_data.transaksi || '-'}<br>Deposit: ${d.negosiasi_data.deposit || '-'}<br>Tertarik: ${d.negosiasi_data.tertarik || '-'}<br>Penawaran: ${d.negosiasi_data.penawaran || '-'}</div></div></div>` : ''}`; } else if (type === 'nomor_salah') { detailHtml = `${ownerInfo}<div class="detail-info-item"><div class="detail-info-icon">👤</div><div class="detail-info-content"><label>Nama</label><div class="value">${escapeHtml(d.nama)}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">📱</div><div class="detail-info-content"><label>Nomor WhatsApp</label><div class="value">${escapeHtml(d.hp)}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">📅</div><div class="detail-info-content"><label>Tanggal Dihapus</label><div class="value">${new Date(d.deleted_at).toLocaleDateString('id-ID')}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">📵</div><div class="detail-info-content"><label>Alasan</label><div class="value">${d.alasan || 'Nomor tidak bisa dihubungi'}</div></div></div>`; } else if (type === 'commitment') { detailHtml = `${ownerInfo}<div class="detail-info-item"><div class="detail-info-icon">👤</div><div class="detail-info-content"><label>Nama</label><div class="value">${escapeHtml(d.nama)}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">📱</div><div class="detail-info-content"><label>Nomor WhatsApp</label><div class="value">${escapeHtml(d.hp)}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">📅</div><div class="detail-info-content"><label>Tanggal Komitmen</label><div class="value">${new Date(d.committed_at).toLocaleDateString('id-ID')}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">📅</div><div class="detail-info-content"><label>Tanggal Followup</label><div class="value">${d.followup_date || '-'}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">🆔</div><div class="detail-info-content"><label>ID Agent</label><div class="value">${d.agent_id || '-'}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">🏷️</div><div class="detail-info-content"><label>Type/Class</label><div class="value">${escapeHtml(d.agent_type || '-')}</div></div></div><div class="detail-info-item"><div class="detail-info-icon">📱</div><div class="detail-info-content"><label>Aplikasi</label><div class="value">${d.aplikasi || d.negosiasi_data?.aplikasi || '-'}</div></div></div>${d.negosiasi_data ? `<div class="detail-info-item"><div class="detail-info-icon">📋</div><div class="detail-info-content"><label>Data Negosiasi</label><div class="value">Domisili: ${d.negosiasi_data.domisili || '-'}<br>Transaksi: ${d.negosiasi_data.transaksi || '-'}<br>Deposit: ${d.negosiasi_data.deposit || '-'}<br>Tertarik: ${d.negosiasi_data.tertarik || '-'}<br>Penawaran: ${d.negosiasi_data.penawaran || '-'}</div></div></div>` : ''}`; } document.getElementById('detailContent').innerHTML = `<div class="detail-header"><div class="detail-avatar">📁</div><h3>${title}</h3><div class="detail-status">Arsip</div></div><div class="detail-body"><div class="detail-info">${detailHtml}</div><div class="detail-actions"><button class="btn-success" onclick="openWA('${d.hp}')">💬 WhatsApp</button></div></div><div class="detail-footer"><button class="btn-outline" onclick="closeModal('detailModal')">❌ Tutup</button><button class="btn-danger" onclick="deleteDBItem('${type}', '${id}'); closeModal('detailModal');">🗑️ Hapus</button></div>`; showModal('detailModal'); });
}

// ==================== CHART FUNCTIONS ====================
function updateChartCustomer(total, closing, pending, followup) {
    const ctx = document.getElementById('chartCustomer');
    if (!ctx) return;
    if (chartCustomer) chartCustomer.destroy();
    const baru = total - (closing + pending + followup);
    chartCustomer = new Chart(ctx, { type: 'doughnut', data: { labels: ['Closing', 'Pending', 'Follow Up', 'Baru'], datasets: [{ data: [closing, pending, followup, baru], backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'], borderWidth: 0, hoverOffset: 15, cutout: '65%' }] }, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'right', labels: { usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11 }, generateLabels: function(chart) { const data = chart.data; const dataset = data.datasets[0]; const total = dataset.data.reduce((a, b) => a + b, 0); return data.labels.map((label, i) => ({ text: `${label}: ${dataset.data[i]} (${total ? ((dataset.data[i] / total) * 100).toFixed(1) : 0}%)`, fillStyle: dataset.backgroundColor[i], strokeStyle: dataset.backgroundColor[i], lineWidth: 0, hidden: false, index: i })); } } }, tooltip: { callbacks: { label: function(context) { const label = context.label || ''; const value = context.raw || 0; const total = context.dataset.data.reduce((a, b) => a + b, 0); return `${label}: ${value} (${total ? ((value / total) * 100).toFixed(1) : 0}%)`; } } } } } });
}

function updateChartProspek(baru, dihubungi, negosiasi, tertarik) {
    const ctx = document.getElementById('chartProspek');
    if (!ctx) return;
    if (chartProspek) chartProspek.destroy();
    let dataArr = [baru, dihubungi, negosiasi, tertarik];
    chartProspek = new Chart(ctx, { type: 'doughnut', data: { labels: ['Baru', 'Dihubungi', 'Negosiasi', 'Tertarik'], datasets: [{ data: dataArr, backgroundColor: ['#8b5cf6', '#3b82f6', '#f59e0b', '#10b981'], borderWidth: 0, hoverOffset: 15, cutout: '65%' }] }, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'right', labels: { usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11 }, generateLabels: function(chart) { const data = chart.data; const dataset = data.datasets[0]; const total = dataset.data.reduce((a, b) => a + b, 0); return data.labels.map((label, i) => ({ text: `${label}: ${dataset.data[i]} (${total > 0 ? ((dataset.data[i] / total) * 100).toFixed(1) : 0}%)`, fillStyle: dataset.backgroundColor[i], strokeStyle: dataset.backgroundColor[i], lineWidth: 0, hidden: false, index: i })); } } }, tooltip: { callbacks: { label: function(context) { const label = context.label || ''; const value = context.raw || 0; const total = context.dataset.data.reduce((a, b) => a + b, 0); return `${label}: ${value} (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`; } } } } } });
}

// ==================== LOAD ALL DATA ====================
function loadAllData() {
    if (!currentUser) return;
    const today = getTodayDate();
    const isOwner = currentUserRole === 'owner';
    let customersQuery = db.collection('customers');
    let prospekQuery = db.collection('prospek');
    if (!isOwner) { customersQuery = db.collection('customers').where('user_id', '==', currentUser.uid); prospekQuery = db.collection('prospek').where('user_id', '==', currentUser.uid); }
    customersQuery.onSnapshot(async snap => { let total = 0, closing = 0, pending = 0, followup = 0; const lists = { baru: [], followup: [], pending: [], closing: [] }; customersData = []; for (const doc of snap.docs) { const d = doc.data(); let ownerName = ''; if (isOwner && d.user_id !== currentUser.uid) { const userDoc = await db.collection('users').doc(d.user_id).get(); ownerName = userDoc.exists ? ` (${userDoc.data().nama || 'CS'})` : ''; } const itemData = { id: doc.id, agent_id: d.agent_id, nama: d.nama + ownerName, hp: d.hp, tanggal: d.tanggal, status: d.status, ownerId: d.user_id }; customersData.push({ id: doc.id, ...d, displayName: d.nama + ownerName }); total++; if (d.status === 'closing') closing++; else if (d.status === 'pending') pending++; else if (d.status === 'followup') followup++; else lists.baru.push(itemData); if (d.status === 'followup') lists.followup.push(itemData); if (d.status === 'pending') lists.pending.push(itemData); if (d.status === 'closing') lists.closing.push(itemData); } for (let status in lists) lists[status].sort((a,b) => (a.tanggal || '9999-12-31').localeCompare(b.tanggal || '9999-12-31')); document.getElementById('countBaru').innerText = total - (closing + pending + followup); document.getElementById('countFollowup').innerText = followup; document.getElementById('countPending').innerText = pending; document.getElementById('countClosing').innerText = closing; document.getElementById('totalData').innerText = total; document.getElementById('closingTotal').innerText = closing; document.getElementById('activeProspek').innerText = total - closing; document.getElementById('rateClosing').innerText = total ? Math.round((closing/total)*100)+'%' : '0%'; for (let status in lists) { const container = document.getElementById(status + 'List'); if (container) { container.innerHTML = lists[status].map(item => { const isOverdue = item.tanggal && item.tanggal < today; const isToday = item.tanggal === today; let deadlineClass = ''; if (isOverdue) deadlineClass = 'deadline-overdue'; else if (isToday) deadlineClass = 'deadline-today'; return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="${status}" data-deadline="${item.tanggal || ''}"><div class="card-id">🆔 ${escapeHtml(item.agent_id || '-')}</div><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.tanggal || '-'}</div></div>`; }).join(''); container.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailCustomer(card.dataset.id); }); }); } } updateChartCustomer(total, closing, pending, followup); updateAllBadges(); renderFullFollowupKanban(); });
    prospekQuery.onSnapshot(async snap => { let baru = 0, dihubungi = 0, negosiasi = 0, tertarik = 0; const lists = { prospekBaru: [], prospekDihubungi: [], prospekNegosiasi: [], prospekTertarik: [] }; prospekData = []; for (const doc of snap.docs) { const d = doc.data(); let ownerName = ''; if (isOwner && d.user_id !== currentUser.uid) { const userDoc = await db.collection('users').doc(d.user_id).get(); ownerName = userDoc.exists ? ` (${userDoc.data().nama || 'CS'})` : ''; } const st = d.status || 'Baru'; const deadline = d.deadline || ''; const itemData = { id: doc.id, nama: d.nama + ownerName, hp: d.hp, status: st, deadline: deadline, ownerId: d.user_id }; prospekData.push({ id: doc.id, ...d, displayName: d.nama + ownerName }); if (st === 'Baru') { baru++; lists.prospekBaru.push(itemData); } else if (st === 'Dihubungi') { dihubungi++; lists.prospekDihubungi.push(itemData); } else if (st === 'Negosiasi') { negosiasi++; lists.prospekNegosiasi.push(itemData); } else if (st === 'Tertarik') { tertarik++; lists.prospekTertarik.push(itemData); } else { tertarik++; lists.prospekTertarik.push(itemData); } } for (let col in lists) lists[col].sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31')); document.getElementById('countProspekBaru').innerText = baru; document.getElementById('countDihubungi').innerText = dihubungi; document.getElementById('countNegosiasi').innerText = negosiasi; document.getElementById('countTertarik').innerText = tertarik; for (let col in lists) { const container = document.getElementById(col + 'List'); if (container) { container.innerHTML = lists[col].map(item => { const isOverdue = item.deadline && item.deadline < today; const isToday = item.deadline === today; let deadlineClass = ''; if (isOverdue) deadlineClass = 'deadline-overdue'; else if (isToday) deadlineClass = 'deadline-today'; return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="${item.status}" data-deadline="${item.deadline || ''}"><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.deadline || '-'}</div></div>`; }).join(''); container.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailProspek(card.dataset.id); }); }); } } updateChartProspek(baru, dihubungi, negosiasi, tertarik); updateAllBadges(); renderFullProspekKanban(); });
}

// ==================== REMINDER, PESAN, BROADCAST ====================
async function loadReminders() {
    try { let query = db.collection('reminders'); if (currentUserRole !== 'owner') query = query.where('user_id', '==', currentUser.uid); const snapshot = await query.get(); const reminderList = document.getElementById('reminderList'); if (!reminderList) return; if (snapshot.empty) { reminderList.innerHTML = '<p style="text-align:center;padding:40px;">⏰ Belum ada pengingat</p>'; return; } const items = []; snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() })); items.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)); reminderList.innerHTML = items.map(item => { let ownerInfo = ''; if (currentUserRole === 'owner' && item.user_id !== currentUser.uid) ownerInfo = `<small style="color:#4f46e5;">(Milik: ${escapeHtml(item.user_name || 'CS Lain')})</small>`; return `<div class="db-item"><div class="db-item-info"><h4>📝 ${escapeHtml(item.title)}</h4><p>${escapeHtml(item.description || '-')}</p><small>⏰ ${item.datetime ? new Date(item.datetime).toLocaleString('id-ID') : '-'} ${ownerInfo}</small></div><div class="db-item-actions"><button class="db-item-delete" onclick="deleteReminder('${item.id}')">🗑️ Hapus</button></div></div>`; }).join(''); }
    catch(e) { console.error('Error loadReminders:', e); document.getElementById('reminderList').innerHTML = '<p style="text-align:center;padding:40px;color:red;">❌ Gagal memuat pengingat</p>'; }
}

async function loadUsersForSelect() { const snapshot = await db.collection('users').get(); const select = document.getElementById('pesanTo'); if (!select) return; select.innerHTML = '<option value="">Pilih CS Tujuan</option>'; snapshot.forEach(doc => { const data = doc.data(); if (doc.id !== currentUser.uid) select.innerHTML += `<option value="${doc.id}">${escapeHtml(data.nama || data.email || 'CS Agent')}</option>`; }); }

async function loadPesan() {
    if (!currentUser) return;
    try { let query = db.collection('messages').where('to_id', '==', currentUser.uid); const snapshot = await query.get(); const pesanList = document.getElementById('pesanList'); if (!pesanList) return; if (snapshot.empty) { pesanList.innerHTML = '<p style="text-align:center;padding:40px;">💬 Belum ada pesan</p>'; return; } const items = []; for (const doc of snapshot.docs) { const data = doc.data(); let fromName = 'Unknown'; try { const fromUser = await db.collection('users').doc(data.from_id).get(); if (fromUser.exists) fromName = fromUser.data().nama || fromUser.data().email || 'CS Agent'; } catch(e) { console.warn(e); } items.push({ id: doc.id, ...data, fromName }); } items.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)); pesanList.innerHTML = items.map(item => `<div class="db-item ${!item.is_read ? 'unread' : ''}"><div class="db-item-info"><h4>📨 Dari: ${escapeHtml(item.fromName)}</h4><p>${escapeHtml(item.message)}</p><small>📅 ${new Date(item.created_at).toLocaleString('id-ID')} | ${item.is_read ? '✅ Dibaca' : '🆕 Baru'}</small></div><div class="db-item-actions"><button class="db-item-wa" onclick="markAsRead('${item.id}')">✅ Tandai Dibaca</button><button class="db-item-delete" onclick="deletePesan('${item.id}')">🗑️ Hapus</button></div></div>`).join(''); updateAllBadges(); }
    catch(e) { console.error(e); document.getElementById('pesanList').innerHTML = '<p style="text-align:center;padding:40px;color:red;">❌ Gagal memuat pesan</p>'; }
}

window.markAsRead = async function(id) { await db.collection('messages').doc(id).update({ is_read: true }); showNotif('Pesan ditandai dibaca'); loadPesan(); updateAllBadges(); };
window.deletePesan = async function(id) { if (confirm('Hapus pesan ini?')) { await db.collection('messages').doc(id).delete(); showNotif('Pesan dihapus'); loadPesan(); updateAllBadges(); } };
document.getElementById('addPesanBtn')?.addEventListener('click', async () => { await loadUsersForSelect(); document.getElementById('pesanModal').style.display = 'flex'; });
document.getElementById('savePesanBtn')?.addEventListener('click', async () => { const toId = document.getElementById('pesanTo').value; const message = document.getElementById('pesanMessage').value; if (!toId || !message) { showNotif('Lengkapi data!', true); return; } await db.collection('messages').add({ from_id: currentUser.uid, to_id: toId, message, is_read: false, created_at: new Date().toISOString() }); closeModal('pesanModal'); document.getElementById('pesanTo').value = ''; document.getElementById('pesanMessage').value = ''; showNotif('✅ Pesan terkirim'); updateAllBadges(); });

function loadTemplates() { const saved = localStorage.getItem('broadcast_templates'); if (saved) savedTemplates = JSON.parse(saved); renderTemplateList(); }
function saveTemplate(name, message) { if (!name || !message) { showNotif('⚠️ Nama template dan pesan harus diisi!', true); return; } savedTemplates.unshift({ name, message, created_at: new Date().toISOString() }); if (savedTemplates.length > 10) savedTemplates = savedTemplates.slice(0, 10); localStorage.setItem('broadcast_templates', JSON.stringify(savedTemplates)); renderTemplateList(); showNotif('✅ Template berhasil disimpan'); }
function deleteTemplate(index) { savedTemplates.splice(index, 1); localStorage.setItem('broadcast_templates', JSON.stringify(savedTemplates)); renderTemplateList(); showNotif('🗑️ Template dihapus'); }
function renderTemplateList() { const container = document.getElementById('templateList'); if (!container) return; if (savedTemplates.length === 0) { container.innerHTML = '<p style="color:#9ca3af; text-align:center; padding:20px;">Belum ada template tersimpan</p>'; return; } container.innerHTML = savedTemplates.map((template, idx) => `<div class="template-item"><div style="display:flex;justify-content:space-between;align-items:center"><strong style="font-size:13px;">📝 ${escapeHtml(template.name)}</strong><div><button class="template-use-btn" data-idx="${idx}" style="background:#4f46e5;color:#fff;border:0;border-radius:6px;padding:4px 10px;font-size:11px;margin-right:5px;cursor:pointer">Gunakan</button><button class="template-delete-btn" data-idx="${idx}" style="background:#ef4444;color:#fff;border:0;border-radius:6px;padding:4px 10px;font-size:11px;cursor:pointer">Hapus</button></div></div><div style="font-size:11px;color:#6b7280;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(template.message.substring(0,100))}${template.message.length>100?'...':''}</div></div>`).join(''); document.querySelectorAll('.template-use-btn').forEach(btn => { btn.addEventListener('click', (e) => { e.stopPropagation(); const idx = parseInt(btn.dataset.idx); const template = savedTemplates[idx]; if (template) { document.getElementById('broadcastMessage').value = template.message; showNotif(`✅ Template "${template.name}" diterapkan`); } }); }); document.querySelectorAll('.template-delete-btn').forEach(btn => { btn.addEventListener('click', (e) => { e.stopPropagation(); const idx = parseInt(btn.dataset.idx); if (confirm('Hapus template ini?')) deleteTemplate(idx); }); }); }
function initTemplateFeature() { loadTemplates(); const saveTemplateBtn = document.getElementById('saveTemplateBtn'); if (saveTemplateBtn) { saveTemplateBtn.onclick = () => { const name = document.getElementById('templateName').value; const message = document.getElementById('broadcastMessage').value; if (!name) { showNotif('⚠️ Masukkan nama template!', true); return; } if (!message) { showNotif('⚠️ Pesan tidak boleh kosong!', true); return; } saveTemplate(name, message); document.getElementById('templateName').value = ''; }; } }

function initBroadcast() {
    if (!document.querySelector('input[name="sourceType"]')) return;
    document.querySelectorAll('input[name="sourceType"]').forEach(radio => { radio.removeEventListener('change', handleSourceChange); radio.addEventListener('change', handleSourceChange); });
    function handleSourceChange(e) { const value = e.target.value; const filterCard = document.getElementById('filterStatusCard'); const customCard = document.getElementById('customNumbersCard'); const prospekFilter = document.getElementById('prospekFilter'); const customerFilter = document.getElementById('customerFilter'); if (filterCard) filterCard.style.display = value === 'custom' ? 'none' : 'block'; if (customCard) customCard.style.display = value === 'custom' ? 'block' : 'none'; if (prospekFilter) prospekFilter.style.display = value === 'prospek' ? 'flex' : 'none'; if (customerFilter) customerFilter.style.display = value === 'customer' ? 'flex' : 'none'; loadNumbers(); }
    document.querySelectorAll('#customerFilter input, #prospekFilter input').forEach(cb => { cb.removeEventListener('change', loadNumbers); cb.addEventListener('change', loadNumbers); });
    document.getElementById('customNumbers')?.addEventListener('input', loadNumbers);
    document.getElementById('refreshNumbersBtn')?.addEventListener('click', loadNumbers);
    document.getElementById('sendBroadcastBtn')?.addEventListener('click', sendBroadcast);
    loadNumbers().catch(e => console.error('loadNumbers error:', e));
    initTemplateFeature();
}

async function loadNumbers() {
    try { const sourceType = document.querySelector('input[name="sourceType"]:checked')?.value || 'customer'; let numbers = []; if (sourceType === 'custom') { const customText = document.getElementById('customNumbers')?.value || ''; numbers = customText.split(/[\n,]+/).map(n => n.trim()).filter(n => n && /^62\d+$/.test(n)); } else { let collection = 'customers', statusField = 'status', statusValues = []; if (sourceType === 'prospek') { collection = 'prospek'; statusValues = Array.from(document.querySelectorAll('#prospekFilter input:checked')).map(cb => cb.value); } else if (sourceType === 'customer') { collection = 'customers'; statusValues = Array.from(document.querySelectorAll('#customerFilter input:checked')).map(cb => cb.value); } else if (sourceType === 'closing') { collection = 'db_closing'; statusField = null; } else if (sourceType === 'dbTidak') { collection = 'db_tidak_tertarik'; statusField = null; } let query = db.collection(collection); if (currentUserRole !== 'owner') query = query.where('user_id', '==', currentUser.uid); if (statusValues && statusValues.length > 0 && statusField) query = query.where(statusField, 'in', statusValues); const snapshot = await query.get(); snapshot.forEach(doc => { const data = doc.data(); numbers.push({ hp: data.hp, nama: data.nama || data.name || 'Agent' }); }); } currentNumbers = numbers; const selectedCountSpan = document.getElementById('selectedCount'); if (selectedCountSpan) selectedCountSpan.innerText = numbers.length; const listDiv = document.getElementById('selectedNumbersList'); if (!listDiv) return; if (numbers.length === 0) { listDiv.innerHTML = '<p style="color:#9ca3af;">Tidak ada nomor yang dipilih</p>'; } else if (typeof numbers[0] === 'string') { listDiv.innerHTML = numbers.map(n => `<div class="number-item">${escapeHtml(n)}</div>`).join(''); } else { listDiv.innerHTML = numbers.map(n => `<div class="number-item">${escapeHtml(n.nama)} - ${escapeHtml(n.hp)}</div>`).join(''); } }
    catch(e) { console.error('Error loadNumbers:', e); showNotifTop('❌ Gagal memuat nomor: ' + e.message, true); }
}

async function sendBroadcast() { const messageTemplate = document.getElementById('broadcastMessage')?.value, sendOneByOne = document.getElementById('sendOneByOne')?.checked; if (!messageTemplate) { showNotif('Pesan tidak boleh kosong!', true); return; } if (currentNumbers.length === 0) { showNotif('Tidak ada nomor tujuan!', true); return; } if (!sendOneByOne) { for (const item of currentNumbers) { const hp = typeof item === 'string' ? item : item.hp, nama = typeof item === 'string' ? '' : item.nama, message = messageTemplate.replace(/{nama}/g, nama || 'Customer'), nomor = hp.toString().replace('+', '').replace(/^0/, '62'); window.open('https://wa.me/' + nomor + '?text=' + encodeURIComponent(message), '_blank'); } showNotif(`✅ Membuka ${currentNumbers.length} chat WhatsApp`); return; } if (isBroadcasting) { showNotif('⚠️ Broadcast sedang berjalan!', true); return; } broadcastNumbers = [...currentNumbers]; broadcastMessageTemplate = messageTemplate; currentBroadcastIndex = 0; broadcastStatus = []; isBroadcasting = true; showBroadcastPanel(); displayCurrentBroadcast(); }

function showBroadcastPanel() {
    let panelDiv = document.getElementById('broadcastPanel');
    if (!panelDiv) { const broadcastCard = document.querySelector('#broadcastPage .broadcast-card:last-child'); if (broadcastCard) { panelDiv = document.createElement('div'); panelDiv.id = 'broadcastPanel'; panelDiv.className = 'broadcast-panel'; panelDiv.innerHTML = `<div class="panel-header"><span>📢 Broadcast Manual</span><button id="closeBroadcastPanelBtn" class="close-panel-btn">✕</button></div><div class="panel-content"><div class="current-info"><div class="current-label">Sedang Diproses:</div><div class="current-name" id="currentName">-</div><div class="current-number" id="currentNumber">-</div></div><div class="message-preview" id="messagePreview"></div><div class="action-buttons"><button id="markSentBtn" class="mark-sent-btn">✅ Tandai Terkirim & Lanjut</button><button id="markFailedBtn" class="mark-failed-btn">❌ Tandai Gagal Kirim & Lanjut</button><button id="stopBroadcastPanelBtn" class="stop-btn">⏹️ Hentikan Broadcast</button></div><div class="whatsapp-link-container"><a href="#" id="whatsappLink" target="_blank" class="whatsapp-link-btn">💬 Buka WhatsApp</a></div></div><div class="progress-panel"><div class="progress-bar-container"><div class="progress-bar-fill" id="progressBarFillPanel"></div></div><div class="progress-text" id="progressTextPanel">0 / 0</div><div class="progress-list" id="progressListPanel"></div></div>`; broadcastCard.parentNode.insertBefore(panelDiv, broadcastCard.nextSibling); document.getElementById('closeBroadcastPanelBtn')?.addEventListener('click', () => { document.getElementById('broadcastPanel').style.display = 'none'; isBroadcasting = false; }); document.getElementById('markSentBtn')?.addEventListener('click', () => { if (isBroadcasting) { broadcastStatus[currentBroadcastIndex] = 'success'; currentBroadcastIndex++; updateBroadcastPanel(); if (currentBroadcastIndex >= broadcastNumbers.length) finishBroadcast(); else displayCurrentBroadcast(); } }); document.getElementById('markFailedBtn')?.addEventListener('click', () => { if (isBroadcasting) { broadcastStatus[currentBroadcastIndex] = 'failed'; currentBroadcastIndex++; updateBroadcastPanel(); if (currentBroadcastIndex >= broadcastNumbers.length) finishBroadcast(); else displayCurrentBroadcast(); } }); document.getElementById('stopBroadcastPanelBtn')?.addEventListener('click', () => { if (confirm('⏹️ Hentikan broadcast?')) { isBroadcasting = false; document.getElementById('broadcastPanel').style.display = 'none'; showNotif('⏹️ Broadcast dihentikan'); } }); } } else panelDiv.style.display = 'block';
}

function displayCurrentBroadcast() { if (!isBroadcasting) return; if (currentBroadcastIndex >= broadcastNumbers.length) { finishBroadcast(); return; } const item = broadcastNumbers[currentBroadcastIndex], hp = typeof item === 'string' ? item : item.hp, nama = typeof item === 'string' ? '' : item.nama, message = broadcastMessageTemplate.replace(/{nama}/g, nama || 'Customer'), nomor = hp.toString().replace('+', '').replace(/^0/, '62'); document.getElementById('currentName').innerHTML = escapeHtml(nama || '-'); document.getElementById('currentNumber').innerHTML = escapeHtml(hp); document.getElementById('messagePreview').innerHTML = `<strong>Pesan:</strong><br>${escapeHtml(message)}`; document.getElementById('whatsappLink').href = 'https://wa.me/' + nomor + '?text=' + encodeURIComponent(message); updateBroadcastPanel(); }

function updateBroadcastPanel() { const total = broadcastNumbers.length, processed = currentBroadcastIndex, percent = total > 0 ? (processed / total) * 100 : 0; document.getElementById('progressBarFillPanel').style.width = `${percent}%`; document.getElementById('progressTextPanel').innerText = `${processed} / ${total} terproses`; const progressList = document.getElementById('progressListPanel'); if (progressList && broadcastNumbers.length > 0) { let html = ''; for (let i = 0; i < broadcastNumbers.length; i++) { const item = broadcastNumbers[i], hp = typeof item === 'string' ? item : item.hp, nama = typeof item === 'string' ? '' : item.nama, displayName = nama ? `${nama} (${hp})` : hp, isCurrent = i === currentBroadcastIndex, status = broadcastStatus[i]; let statusIcon = '⭕', statusClass = ''; if (status === 'success') { statusIcon = '✅'; statusClass = 'success'; } else if (status === 'failed') { statusIcon = '❌'; statusClass = 'failed'; } else if (i < currentBroadcastIndex) { statusIcon = '✅'; statusClass = 'success'; } html += `<div class="panel-progress-item ${statusClass} ${isCurrent ? 'current' : ''}"><span class="panel-status">${statusIcon}</span><span class="panel-number">${escapeHtml(displayName)}</span></div>`; } progressList.innerHTML = html; const currentElement = progressList.querySelector('.panel-progress-item.current'); if (currentElement) currentElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }

function finishBroadcast() { let successCount = 0, failedCount = 0; for (let i = 0; i < broadcastNumbers.length; i++) { if (broadcastStatus[i] === 'success') successCount++; else if (broadcastStatus[i] === 'failed') failedCount++; else if (i < currentBroadcastIndex) successCount++; } showNotif(`✅ Broadcast selesai! Terkirim: ${successCount}, Gagal: ${failedCount}, Total: ${broadcastNumbers.length}`); isBroadcasting = false; document.getElementById('broadcastPanel').style.display = 'none'; broadcastStatus = []; }

// ==================== MANAGE USERS ====================
async function loadUsersList() {
    if (currentUserRole !== 'owner') return;
    const snapshot = await db.collection('users').get();
    const users = [];
    snapshot.forEach(doc => { if (doc.id !== currentUser.uid) users.push({ id: doc.id, ...doc.data() }); });
    const container = document.getElementById('usersList');
    if (users.length === 0) { container.innerHTML = '<p style="text-align:center;padding:40px;">👥 Belum ada CS Agent selain Anda</p>'; return; }
    container.innerHTML = users.map(user => `<div class="db-item"><div class="db-item-info"><h4>${escapeHtml(user.nama || 'CS Agent')}</h4><p>${user.email || '-'}</p><small>HP: ${user.hp || '-'} | Role: ${user.role || 'cs'}</small></div><div class="db-item-actions"><button class="db-item-delete" onclick="deleteUser('${user.id}')">🗑️ Hapus</button></div></div>`).join('');
}

window.deleteUser = async function(userId) { if (!confirm('Yakin ingin menghapus CS Agent ini? Data CS akan tetap ada tetapi tidak bisa login.')) return; try { await db.collection('users').doc(userId).delete(); showNotif('✅ CS Agent berhasil dihapus'); loadUsersList(); } catch(e) { showNotif('❌ Gagal: ' + e.message, true); } };
document.getElementById('addCsBtn')?.addEventListener('click', () => { document.getElementById('addCsModal').style.display = 'flex'; });
document.getElementById('saveCsBtn')?.addEventListener('click', async () => { const email = document.getElementById('csEmail').value; const password = document.getElementById('csPassword').value; const nama = document.getElementById('csName').value; let hp = document.getElementById('csPhone').value; if (!email || !password || !nama) { showNotif('⚠️ Email, Password, dan Nama wajib diisi!', true); return; } if (hp) { hp = hp.replace(/\D/g, ''); if (hp.startsWith('0')) hp = hp.substring(1); hp = '+62' + hp; } try { const userCredential = await auth.createUserWithEmailAndPassword(email, password); const newUser = userCredential.user; await db.collection('users').doc(newUser.uid).set({ nama: nama, email: email, hp: hp || '', role: 'cs', created_at: new Date().toISOString() }); showNotif('✅ CS Agent berhasil ditambahkan'); closeModal('addCsModal'); document.getElementById('csEmail').value = ''; document.getElementById('csPassword').value = ''; document.getElementById('csName').value = ''; document.getElementById('csPhone').value = ''; loadUsersList(); } catch(e) { showNotif('❌ Gagal: ' + e.message, true); } });

// ==================== FULL PAGE KANBAN ====================
function renderFullFollowupKanban() {
    const today = getTodayDate();
    const lists = { baru: [], followup: [], pending: [], closing: [] };
    customersData.forEach(item => { const status = item.status || 'baru'; if (status === 'closing') lists.closing.push(item); else if (status === 'pending') lists.pending.push(item); else if (status === 'followup') lists.followup.push(item); else lists.baru.push(item); });
    lists.baru.sort((a,b) => (a.tanggal || '9999-12-31').localeCompare(b.tanggal || '9999-12-31')); lists.followup.sort((a,b) => (a.tanggal || '9999-12-31').localeCompare(b.tanggal || '9999-12-31')); lists.pending.sort((a,b) => (a.tanggal || '9999-12-31').localeCompare(b.tanggal || '9999-12-31')); lists.closing.sort((a,b) => (a.tanggal || '9999-12-31').localeCompare(b.tanggal || '9999-12-31'));
    document.getElementById('fullCountBaru').innerText = lists.baru.length; document.getElementById('fullCountFollowup').innerText = lists.followup.length; document.getElementById('fullCountPending').innerText = lists.pending.length; document.getElementById('fullCountClosing').innerText = lists.closing.length;
    const baruContainer = document.getElementById('fullBaruList'); if (baruContainer) { baruContainer.innerHTML = lists.baru.map(item => { const isOverdue = item.tanggal && item.tanggal < today; const isToday = item.tanggal === today; let deadlineClass = ''; if (isOverdue) deadlineClass = 'deadline-overdue'; else if (isToday) deadlineClass = 'deadline-today'; return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="baru"><div class="card-id">🆔 ${escapeHtml(item.agent_id || '-')}</div><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.tanggal || '-'}</div></div>`; }).join(''); baruContainer.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailCustomer(card.dataset.id); }); }); }
    const followupContainer = document.getElementById('fullFollowupList'); if (followupContainer) { followupContainer.innerHTML = lists.followup.map(item => { const isOverdue = item.tanggal && item.tanggal < today; const isToday = item.tanggal === today; let deadlineClass = ''; if (isOverdue) deadlineClass = 'deadline-overdue'; else if (isToday) deadlineClass = 'deadline-today'; return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="followup"><div class="card-id">🆔 ${escapeHtml(item.agent_id || '-')}</div><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.tanggal || '-'}</div></div>`; }).join(''); followupContainer.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailCustomer(card.dataset.id); }); }); }
    const pendingContainer = document.getElementById('fullPendingList'); if (pendingContainer) { pendingContainer.innerHTML = lists.pending.map(item => { const isOverdue = item.tanggal && item.tanggal < today; const isToday = item.tanggal === today; let deadlineClass = ''; if (isOverdue) deadlineClass = 'deadline-overdue'; else if (isToday) deadlineClass = 'deadline-today'; return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="pending"><div class="card-id">🆔 ${escapeHtml(item.agent_id || '-')}</div><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.tanggal || '-'}</div></div>`; }).join(''); pendingContainer.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailCustomer(card.dataset.id); }); }); }
    const closingContainer = document.getElementById('fullClosingList'); if (closingContainer) { closingContainer.innerHTML = lists.closing.map(item => { const isOverdue = item.tanggal && item.tanggal < today; const isToday = item.tanggal === today; let deadlineClass = ''; if (isOverdue) deadlineClass = 'deadline-overdue'; else if (isToday) deadlineClass = 'deadline-today'; return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="closing"><div class="card-id">🆔 ${escapeHtml(item.agent_id || '-')}</div><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.tanggal || '-'}</div></div>`; }).join(''); closingContainer.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailCustomer(card.dataset.id); }); }); }
}

function renderFullProspekKanban() {
    const today = getTodayDate();
    const lists = { prospekBaru: [], prospekDihubungi: [], prospekNegosiasi: [], prospekTertarik: [] };
    prospekData.forEach(item => { const status = item.status || 'Baru'; if (status === 'Baru') lists.prospekBaru.push(item); else if (status === 'Dihubungi') lists.prospekDihubungi.push(item); else if (status === 'Negosiasi') lists.prospekNegosiasi.push(item); else if (status === 'Tertarik') lists.prospekTertarik.push(item); else lists.prospekTertarik.push(item); });
    lists.prospekBaru.sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31')); lists.prospekDihubungi.sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31')); lists.prospekNegosiasi.sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31')); lists.prospekTertarik.sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'));
    document.getElementById('fullCountProspekBaru').innerText = lists.prospekBaru.length; document.getElementById('fullCountDihubungi').innerText = lists.prospekDihubungi.length; document.getElementById('fullCountNegosiasi').innerText = lists.prospekNegosiasi.length; document.getElementById('fullCountTertarik').innerText = lists.prospekTertarik.length;
    const baruContainer = document.getElementById('fullProspekBaruList'); if (baruContainer) { baruContainer.innerHTML = lists.prospekBaru.map(item => { const isOverdue = item.deadline && item.deadline < today; const isToday = item.deadline === today; let deadlineClass = ''; if (isOverdue) deadlineClass = 'deadline-overdue'; else if (isToday) deadlineClass = 'deadline-today'; return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="Baru"><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.deadline || '-'}</div></div>`; }).join(''); baruContainer.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailProspek(card.dataset.id); }); }); }
    const dihubungiContainer = document.getElementById('fullProspekDihubungiList'); if (dihubungiContainer) { dihubungiContainer.innerHTML = lists.prospekDihubungi.map(item => { const isOverdue = item.deadline && item.deadline < today; const isToday = item.deadline === today; let deadlineClass = ''; if (isOverdue) deadlineClass = 'deadline-overdue'; else if (isToday) deadlineClass = 'deadline-today'; return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="Dihubungi"><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.deadline || '-'}</div></div>`; }).join(''); dihubungiContainer.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailProspek(card.dataset.id); }); }); }
    const negosiasiContainer = document.getElementById('fullProspekNegosiasiList'); if (negosiasiContainer) { negosiasiContainer.innerHTML = lists.prospekNegosiasi.map(item => { const isOverdue = item.deadline && item.deadline < today; const isToday = item.deadline === today; let deadlineClass = ''; if (isOverdue) deadlineClass = 'deadline-overdue'; else if (isToday) deadlineClass = 'deadline-today'; return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="Negosiasi"><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.deadline || '-'}</div></div>`; }).join(''); negosiasiContainer.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailProspek(card.dataset.id); }); }); }
    const tertarikContainer = document.getElementById('fullProspekTertarikList'); if (tertarikContainer) { tertarikContainer.innerHTML = lists.prospekTertarik.map(item => { const isOverdue = item.deadline && item.deadline < today; const isToday = item.deadline === today; let deadlineClass = ''; if (isOverdue) deadlineClass = 'deadline-overdue'; else if (isToday) deadlineClass = 'deadline-today'; return `<div class="card-item ${deadlineClass}" data-id="${item.id}" data-status="Tertarik"><div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div><div class="card-phone"><span title="${item.hp}">${item.hp}</span><span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span></div><div class="card-deadline">📅 ${item.deadline || '-'}</div></div>`; }).join(''); tertarikContainer.querySelectorAll('.card-item').forEach(card => { card.addEventListener('click', (e) => { if (!e.target.classList.contains('whatsapp-icon')) openDetailProspek(card.dataset.id); }); }); }
}

document.getElementById('addCustomerFullBtn')?.addEventListener('click', () => { document.getElementById('customerDate').value = getTodayDate(); document.getElementById('customerModal').style.display = 'flex'; });
document.getElementById('addProspekFullBtn')?.addEventListener('click', () => { document.getElementById('prospekDeadline').value = getTodayDate(); document.getElementById('prospekModal').style.display = 'flex'; });
function initDragAndDrop() { console.log("Drag and drop disabled"); }

// ==================== PROFILE FUNCTIONS ====================
function showPhotoPreview(imageUrl) { const previewModal = document.getElementById('previewPhotoModal'); const previewImage = document.getElementById('previewPhotoLarge'); if (previewImage && previewModal) { previewImage.src = imageUrl; previewModal.style.display = 'flex'; document.body.classList.add('modal-open'); document.body.style.overflow = 'hidden'; } }

document.getElementById('saveProfileBtn')?.addEventListener('click', async () => { const nama = document.getElementById('profileName').value; let hp = document.getElementById('profilePhone').value; const foto = document.getElementById('previewFoto').src; if (!nama) { showNotif('Nama wajib diisi', true); return; } if (hp) { hp = hp.replace(/\D/g, ''); if (hp.startsWith('0')) hp = hp.substring(1); hp = '+62' + hp; } else hp = '+62'; try { await db.collection('users').doc(currentUser.uid).set({ nama, hp, foto, email: currentUser.email, role: currentUserRole, updated_at: new Date().toISOString() }, { merge: true }); document.getElementById('topUserName').innerText = nama; document.getElementById('profileImg').src = foto; closeModal('profileModal'); showNotif('Profile tersimpan'); } catch(e) { showNotif('Gagal: ' + e.message, true); } });

function formatPhoneInput(input) { if (input) input.addEventListener('input', function() { let value = this.value.replace(/\D/g, ''); if (value.startsWith('0')) value = value.substring(1); this.value = value; }); }
formatPhoneInput(document.getElementById('customerPhone')); formatPhoneInput(document.getElementById('prospekPhone')); formatPhoneInput(document.getElementById('profilePhone'));
document.getElementById('previewPhotoModal')?.addEventListener('click', (e) => { if (e.target === document.getElementById('previewPhotoModal')) closeModal('previewPhotoModal'); });

// ==================== FORMAT INPUT MODAL ====================
const customerIdInput = document.getElementById('customerId'), customerNameInput = document.getElementById('customerName'), customerPhoneInput2 = document.getElementById('customerPhone'), prospekNameInput = document.getElementById('prospekName'), prospekPhoneInput2 = document.getElementById('prospekPhone');
if (customerIdInput) { customerIdInput.addEventListener('input', function() { formatAgentId(this); }); customerIdInput.addEventListener('blur', function() { formatAgentId(this); }); }
if (customerNameInput) { customerNameInput.addEventListener('input', function() { formatNama(this); }); customerNameInput.addEventListener('blur', function() { formatNama(this); }); }
if (customerPhoneInput2) { customerPhoneInput2.addEventListener('input', function() { formatPhone(this); }); customerPhoneInput2.addEventListener('blur', function() { formatPhone(this); }); }
if (prospekNameInput) { prospekNameInput.addEventListener('input', function() { formatNama(this); }); prospekNameInput.addEventListener('blur', function() { formatNama(this); }); }
if (prospekPhoneInput2) { prospekPhoneInput2.addEventListener('input', function() { formatPhone(this); }); prospekPhoneInput2.addEventListener('blur', function() { formatPhone(this); }); }

// ==================== DEADLINE NOTIFICATION ====================
const deadlineNotifBtn = document.getElementById('deadlineNotifBtn');
if (deadlineNotifBtn) { deadlineNotifBtn.addEventListener('click', async () => { const today = getTodayDate(); try { let customerQuery = db.collection('customers').where('tanggal', '<', today); let prospekQuery = db.collection('prospek').where('deadline', '<', today); if (currentUserRole !== 'owner') { customerQuery = customerQuery.where('user_id', '==', currentUser.uid); prospekQuery = prospekQuery.where('user_id', '==', currentUser.uid); } const overdueCustomers = await customerQuery.get(); const overdueProspek = await prospekQuery.get(); if (overdueCustomers.size + overdueProspek.size > 0) { let message = `📅 DEADLINE TERLEWAT (${overdueCustomers.size + overdueProspek.size}):\n`; overdueCustomers.forEach(doc => { message += `\n• ${doc.data().nama} (Customer) - ${doc.data().tanggal}`; }); overdueProspek.forEach(doc => { message += `\n• ${doc.data().nama} (Prospek) - ${doc.data().deadline}`; }); alert(message); } else { showNotif('✅ Semua deadline terpenuhi!'); } } catch(e) { console.error(e); } }); }

const pesanNotifBtn = document.getElementById('pesanNotifBtn');
if (pesanNotifBtn) { pesanNotifBtn.addEventListener('click', () => { const pesanMenu = document.querySelector('.menu-item[data-page="pesan"]'); if (pesanMenu) pesanMenu.click(); }); }

// ==================== IMPORT EXCEL ====================
const dropZone = document.getElementById('dropZone'); const excelFileInput = document.getElementById('excelFile');
if (dropZone) dropZone.addEventListener('click', () => excelFileInput?.click());
if (excelFileInput) excelFileInput.addEventListener('change', function(e) { if (e.target.files[0]) document.getElementById('fileInfo').innerHTML = '📄 ' + e.target.files[0].name; });
document.querySelectorAll('.radio-option').forEach(opt => opt.addEventListener('click', function() { importType = this.dataset.import; document.querySelectorAll('.radio-option').forEach(o => o.classList.remove('active')); this.classList.add('active'); }));
document.getElementById('importBtn')?.addEventListener('click', async () => { const file = excelFileInput?.files[0]; if (!file) { showNotif('Pilih file dulu!', true); return; } const importBtn = document.getElementById('importBtn'); const originalText = importBtn.textContent; importBtn.textContent = '⏳ Memproses...'; importBtn.disabled = true; const reader = new FileReader(); reader.onload = async function(e) { try { const data = new Uint8Array(e.target.result); const workbook = XLSX.read(data, { type: 'array' }); const sheetName = workbook.SheetNames[0]; const worksheet = workbook.Sheets[sheetName]; const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" }); if (!json || json.length === 0) { showNotif('File Excel kosong!', true); importBtn.textContent = originalText; importBtn.disabled = false; return; } let success = 0, failed = 0; const errors = []; const duplicates = []; const firstRow = json[0]; const columnMap = {}; if (importType === 'customer') { const possibleAgentId = ['agent_id', 'Agent_ID', 'agentid', 'AgentId', 'id', 'ID']; const possibleNama = ['nama', 'Nama', 'name', 'Name', 'customer_name', 'CustomerName']; const possibleHp = ['hp', 'HP', 'phone', 'Phone', 'no_hp', 'NoHP', 'whatsapp', 'WhatsApp']; const possibleApk = ['apk', 'APK', 'aplikasi', 'Aplikasi', 'app']; const possibleDeadline = ['deadline', 'Deadline', 'tanggal', 'Tanggal', 'date']; for (let key in firstRow) { const lowerKey = key.toLowerCase(); if (possibleAgentId.some(p => p.toLowerCase() === lowerKey)) columnMap.agentId = key; if (possibleNama.some(p => p.toLowerCase() === lowerKey)) columnMap.nama = key; if (possibleHp.some(p => p.toLowerCase() === lowerKey)) columnMap.hp = key; if (possibleApk.some(p => p.toLowerCase() === lowerKey)) columnMap.apk = key; if (possibleDeadline.some(p => p.toLowerCase() === lowerKey)) columnMap.deadline = key; } if (!columnMap.agentId || !columnMap.nama || !columnMap.hp || !columnMap.apk) { showNotif('❌ Format Excel tidak sesuai! Gunakan kolom: agent_id, nama, hp, apk, deadline (opsional)', true); importBtn.textContent = originalText; importBtn.disabled = false; return; } } else { const possibleNama = ['nama', 'Nama', 'name', 'Name', 'prospek_name', 'ProspekName']; const possibleHp = ['hp', 'HP', 'phone', 'Phone', 'no_hp', 'NoHP', 'whatsapp', 'WhatsApp']; const possibleDeadline = ['deadline', 'Deadline', 'tanggal', 'Tanggal', 'date']; for (let key in firstRow) { const lowerKey = key.toLowerCase(); if (possibleNama.some(p => p.toLowerCase() === lowerKey)) columnMap.nama = key; if (possibleHp.some(p => p.toLowerCase() === lowerKey)) columnMap.hp = key; if (possibleDeadline.some(p => p.toLowerCase() === lowerKey)) columnMap.deadline = key; } if (!columnMap.nama || !columnMap.hp) { showNotif('❌ Format Excel tidak sesuai! Gunakan kolom: nama, hp, deadline (opsional)', true); importBtn.textContent = originalText; importBtn.disabled = false; return; } } for (let row of json) { try { let agentId = columnMap.agentId ? row[columnMap.agentId] : null; let nama = row[columnMap.nama]; let hp = row[columnMap.hp]; let apk = columnMap.apk ? row[columnMap.apk] : null; let deadline = columnMap.deadline ? row[columnMap.deadline] : null; if (!nama || !hp) { failed++; errors.push(`Baris ke-${json.indexOf(row)+2}: Nama atau HP kosong`); continue; } if (importType === 'customer' && (!agentId || !apk)) { failed++; errors.push(`Baris ke-${json.indexOf(row)+2}: ID Agent atau Aplikasi kosong`); continue; } let cleanHp = hp.toString().trim(); cleanHp = cleanHp.replace(/[^\d+]/g, ''); if (!cleanHp.startsWith('+')) { cleanHp = cleanHp.replace(/^0+/, ''); if (cleanHp.startsWith('62')) cleanHp = '+' + cleanHp; else if (cleanHp.match(/^\d+$/)) cleanHp = '+62' + cleanHp; else cleanHp = '+' + cleanHp.replace(/^\+/, ''); } let isDuplicate = false; if (importType === 'customer') { const { duplicateAgent, duplicateHp } = await checkDuplicateCustomer(agentId, cleanHp); if (duplicateAgent) { duplicates.push(`ID Agent ${agentId} sudah terdaftar oleh ${duplicateAgent.owner}`); isDuplicate = true; } if (duplicateHp) { duplicates.push(`Nomor ${cleanHp} sudah terdaftar oleh ${duplicateHp.owner}`); isDuplicate = true; } } else { const duplicateHp = await checkDuplicateProspek(cleanHp); if (duplicateHp) { duplicates.push(`Nomor ${cleanHp} sudah terdaftar sebagai prospek oleh ${duplicateHp.owner}`); isDuplicate = true; } } if (isDuplicate) { failed++; continue; } let formattedDeadline = deadline ? new Date(deadline).toISOString().split('T')[0] : getTodayDate(); if (deadline && isNaN(new Date(deadline).getTime())) formattedDeadline = getTodayDate(); if (importType === 'customer') { await db.collection('customers').add({ agent_id: agentId.toString().trim().toUpperCase(), nama: nama.toString().trim(), hp: cleanHp, apk: apk.toString().trim(), tanggal: formattedDeadline, status: 'baru', user_id: currentUser.uid, created_at: new Date().toISOString(), followup_data: null, pending_data: [] }); } else { await db.collection('prospek').add({ nama: nama.toString().trim(), hp: cleanHp, status: 'Baru', deadline: formattedDeadline, user_id: currentUser.uid, created_at: new Date().toISOString(), dihubungi_data: null, negosiasi_data: null }); } success++; } catch(rowError) { failed++; errors.push(`Baris ke-${json.indexOf(row)+2}: ${rowError.message}`); } } let resultMsg = `✅ Selesai!\nBerhasil: ${success}\nGagal: ${failed}`; if (duplicates.length > 0) resultMsg += `\n\n⏭ Data duplikat dilewati:\n${duplicates.slice(0,5).join('\n')}${duplicates.length>5?`\n... dan ${duplicates.length-5} lainnya`:''}`; if (errors.length > 0 && errors.length <= 5) resultMsg += `\n\nDetail error:\n${errors.join('\n')}`; else if (errors.length > 5) resultMsg += `\n\n${errors.length} error terjadi. Periksa format data Anda.`; alert(resultMsg); excelFileInput.value = ''; document.getElementById('fileInfo').innerHTML = ''; updateAllBadges(); loadAllData(); } catch(error) { console.error('Import error:', error); showNotif('❌ Gagal memproses file: ' + error.message, true); } finally { importBtn.textContent = originalText; importBtn.disabled = false; } }; reader.onerror = function() { showNotif('❌ Gagal membaca file', true); importBtn.textContent = originalText; importBtn.disabled = false; }; reader.readAsArrayBuffer(file); });
document.getElementById('downloadCustomerExample')?.addEventListener('click', () => { const data = [{ agent_id: 'AG-001', nama: 'Budi Santoso', hp: '6281234567890', apk: 'GNP', deadline: getTodayDate() }]; const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Customer'); XLSX.writeFile(wb, 'contoh_customer.xlsx'); });
document.getElementById('downloadProspekExample')?.addEventListener('click', () => { const data = [{ nama: 'Rina Marlina', hp: '6281234567893', deadline: getTodayDate() }]; const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Prospek'); XLSX.writeFile(wb, 'contoh_prospek.xlsx'); });

// ==================== SETUP PRODUK IMPORT/EXPORT ====================
function setupProdukImport() {
    const importBtn = document.getElementById('importProdukExcelBtn'); const fileInput = document.getElementById('produkExcelFile'); if (!importBtn || !fileInput) return; importBtn.onclick = () => fileInput.click(); fileInput.onchange = async (e) => { const file = e.target.files[0]; if (!file) return; importBtn.textContent = '⏳ Memproses...'; importBtn.disabled = true; const reader = new FileReader(); reader.onload = async (event) => { try { const data = new Uint8Array(event.target.result); const workbook = XLSX.read(data, { type: 'array' }); const sheet = workbook.Sheets[workbook.SheetNames[0]]; const json = XLSX.utils.sheet_to_json(sheet, { defval: "" }); if (!json || json.length === 0) { showNotifTop('File Excel kosong!', true); return; } let success = 0, failed = 0; for (const row of json) { try { let nama = row.nama || row.Nama || row.name || row.Name || ''; let hpp = row.hpp || row.HPP || row.harga_modal || row.HargaModal || ''; let hargaJual = row.harga_jual || row.HargaJual || row.harga || row.Harga || ''; let keterangan = row.keterangan || row.Keterangan || ''; if (!nama || !hpp) { failed++; continue; } await db.collection('produk').add({ nama: nama.toString().trim(), hpp: parseInt(hpp) || 0, harga_jual: parseInt(hargaJual) || 0, keterangan: keterangan || '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }); success++; } catch(err) { failed++; } } showNotifTop(`✅ Import produk selesai! Berhasil: ${success}, Gagal: ${failed}`); await loadProduk(); fileInput.value = ''; } catch(err) { showNotifTop('❌ Gagal import: ' + err.message, true); } finally { importBtn.textContent = '📥 Import Excel'; importBtn.disabled = false; } }; reader.readAsArrayBuffer(file); }; }
async function exportProdukToExcel() { if (produkData.length === 0) { showNotifTop('Tidak ada data produk untuk diexport', true); return; } const exportData = produkData.map(item => ({ 'Nama Produk': item.nama, 'HPP (Modal)': item.hpp, 'Harga Jual': item.harga_jual, 'Keterangan': item.keterangan || '', 'Tanggal Dibuat': new Date(item.created_at).toLocaleDateString('id-ID') })); const ws = XLSX.utils.json_to_sheet(exportData); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Produk'); XLSX.writeFile(wb, `produk_${new Date().toISOString().split('T')[0]}.xlsx`); showNotifTop('✅ Export produk berhasil!'); }
function downloadProdukExample() { const data = [{ nama: 'Contoh Produk Beradmin', admin: 5000, hpp: 100000, harga_jual: '', jenis: 'beradmin', cid_based: 'yes' }, { nama: 'Contoh Produk Tanpa Admin', admin: '', hpp: 50000, harga_jual: 75000, jenis: 'tanpa_admin' }]; const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Produk'); XLSX.writeFile(wb, 'contoh_produk.xlsx'); }
document.getElementById('exportProdukExcelBtn')?.addEventListener('click', exportProdukToExcel); setupProdukImport();
const downloadProdukExampleBtn = document.createElement('button'); downloadProdukExampleBtn.textContent = '📋 Download Contoh Excel'; downloadProdukExampleBtn.className = 'db-import-excel'; downloadProdukExampleBtn.style.marginLeft = '10px'; downloadProdukExampleBtn.style.background = '#f59e0b'; downloadProdukExampleBtn.onclick = downloadProdukExample; const produkActionsDiv = document.querySelector('#produkPage .db-actions'); if (produkActionsDiv) produkActionsDiv.appendChild(downloadProdukExampleBtn);

// ==================== AUTH STATE ====================
auth.onAuthStateChanged(async user => { const loginPage = document.getElementById('loginPage'); const app = document.getElementById('app'); if (user) { currentUser = user; loginPage.style.display = 'none'; app.style.display = 'block'; const userDoc = await db.collection('users').doc(user.uid).get(); let nama = 'CS Agent', foto = 'https://i.pravatar.cc/40'; currentUserRole = 'cs'; currentUserName = nama; if (userDoc.exists) { nama = userDoc.data().nama || 'CS Agent'; foto = userDoc.data().foto || 'https://i.pravatar.cc/40'; currentUserRole = userDoc.data().role || 'cs'; currentUserName = nama; } document.getElementById('topUserName').innerText = nama; document.getElementById('profileName').value = nama; document.getElementById('profileImg').src = foto; document.getElementById('previewFoto').src = foto; document.getElementById('profileEmail').value = user.email; if (currentUserRole === 'owner') document.getElementById('ownerMenu').style.display = 'block'; else document.getElementById('ownerMenu').style.display = 'none'; await updateAllBadges(); loadAllData(); loadReminders(); loadPesan(); loadDBClosing(); loadDBTidak(); loadDBNomorSalah(); loadDBCommitment(); loadDatabaseAgent(); await loadTargetData(); await loadTransaksiGlobal(); loadProduk(); loadUsersList(); setTimeout(() => { const manageTargetBtn = document.getElementById('manageTargetBtn'); if (manageTargetBtn) { if (currentUserRole === 'owner') { manageTargetBtn.style.display = 'block'; const newManageBtn = manageTargetBtn.cloneNode(true); manageTargetBtn.parentNode.replaceChild(newManageBtn, manageTargetBtn); newManageBtn.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); const agentInput = document.getElementById('targetAgentInput'); const koorInput = document.getElementById('targetKoorInput'); const caInput = document.getElementById('targetCAInput'); const transaksiInput = document.getElementById('targetTransaksiInput'); if (agentInput) agentInput.value = targetData.agent || 0; if (koorInput) koorInput.value = targetData.koordinator || 0; if (caInput) caInput.value = targetData.ca || 0; if (transaksiInput) transaksiInput.value = targetData.transaksi || 0; renderMonthlyTargetList(); const modal = document.getElementById('manageTargetModal'); if (modal) modal.style.display = 'flex'; }); } else manageTargetBtn.style.display = 'none'; } }, 500); } else { loginPage.style.display = 'flex'; app.style.display = 'none'; currentUser = null; } });

// ==================== PAGE NAVIGATION ====================
document.querySelectorAll('.menu-item[data-page]').forEach(item => { item.addEventListener('click', () => { const page = item.dataset.page; const pages = ['dashboardPage', 'importPage', 'dbClosingPage', 'dbTidakPage', 'dbNomorSalahPage', 'dbCommitmentPage', 'dbAgentPage', 'produkPage', 'reminderPage', 'pesanPage', 'broadcastPage', 'followupFullPage', 'prospekFullPage', 'searchPage', 'manageUsersPage']; pages.forEach(p => { const el = document.getElementById(p); if (el) el.style.display = 'none'; }); if (page === 'dashboard') document.getElementById('dashboardPage').style.display = 'block'; else if (page === 'import') document.getElementById('importPage').style.display = 'block'; else if (page === 'dbClosing') { document.getElementById('dbClosingPage').style.display = 'block'; loadDBClosing(); } else if (page === 'dbTidak') { document.getElementById('dbTidakPage').style.display = 'block'; loadDBTidak(); } else if (page === 'dbNomorSalah') { document.getElementById('dbNomorSalahPage').style.display = 'block'; loadDBNomorSalah(); } else if (page === 'dbCommitment') { document.getElementById('dbCommitmentPage').style.display = 'block'; loadDBCommitment(); } else if (page === 'dbAgent') { document.getElementById('dbAgentPage').style.display = 'block'; loadDatabaseAgent(); } else if (page === 'produk') { document.getElementById('produkPage').style.display = 'block'; loadProduk(); } else if (page === 'reminder') { document.getElementById('reminderPage').style.display = 'block'; loadReminders(); } else if (page === 'pesan') { document.getElementById('pesanPage').style.display = 'block'; loadPesan(); loadUsersForSelect(); } else if (page === 'broadcast') { document.getElementById('broadcastPage').style.display = 'block'; initBroadcast(); } else if (page === 'followupFull') { document.getElementById('followupFullPage').style.display = 'block'; renderFullFollowupKanban(); } else if (page === 'prospekFull') { document.getElementById('prospekFullPage').style.display = 'block'; renderFullProspekKanban(); } else if (page === 'search') document.getElementById('searchPage').style.display = 'block'; else if (page === 'manageUsers' && currentUserRole === 'owner') { document.getElementById('manageUsersPage').style.display = 'block'; loadUsersList(); } document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active')); item.classList.add('active'); if (window.innerWidth <= 768) document.getElementById('sidebar')?.classList.remove('active'); updateSidebarBodyClass(); }); });

document.querySelectorAll('.closeModalBtn').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.modal)));
document.querySelectorAll('.modal').forEach(modal => modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal.id); }));

document.getElementById('infoBtn')?.addEventListener('click', () => { document.getElementById('infoModal').style.display = 'flex'; });
document.getElementById('infoModalClose')?.addEventListener('click', () => { closeModal('infoModal'); });

// ==================== EVENT LISTENER PROFILE ====================
const profileImg = document.getElementById('profileImg');
if (profileImg) { const newProfileImg = profileImg.cloneNode(true); profileImg.parentNode.replaceChild(newProfileImg, profileImg); newProfileImg.addEventListener('click', () => { document.getElementById('profileModal').style.display = 'flex'; db.collection('users').doc(currentUser.uid).get().then(doc => { if (doc.exists) { document.getElementById('profileName').value = doc.data().nama || ''; document.getElementById('profilePhone').value = doc.data().hp ? doc.data().hp.replace('+62', '') : ''; if (doc.data().foto) document.getElementById('previewFoto').src = doc.data().foto; } }); }); }

const previewFoto = document.getElementById('previewFoto');
if (previewFoto) { const newPreviewFoto = previewFoto.cloneNode(true); previewFoto.parentNode.replaceChild(newPreviewFoto, previewFoto); newPreviewFoto.addEventListener('click', (e) => { e.stopPropagation(); showPhotoPreview(document.getElementById('previewFoto').src); }); }

const cameraIconBtn = document.getElementById('cameraIconBtn');
if (cameraIconBtn) { const newCameraBtn = cameraIconBtn.cloneNode(true); cameraIconBtn.parentNode.replaceChild(newCameraBtn, cameraIconBtn); newCameraBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); document.getElementById('profileFoto').click(); }); }

const profileFotoInput = document.getElementById('profileFoto');
if (profileFotoInput) { const newProfileFotoInput = profileFotoInput.cloneNode(true); profileFotoInput.parentNode.replaceChild(newProfileFotoInput, profileFotoInput); newProfileFotoInput.addEventListener('change', function(e) { const file = e.target.files[0]; if (file && file.type.startsWith('image/')) { if (file.size > 1024*1024) { showNotif('Ukuran foto maksimal 1MB', true); return; } const reader = new FileReader(); reader.onload = function(e) { document.getElementById('previewFoto').src = e.target.result; document.getElementById('profileImg').src = e.target.result; showNotif('Foto baru dipilih, klik Simpan untuk menyimpan'); }; reader.readAsDataURL(file); } }); }

// ==================== EVENT LISTENER CARD TRANSAKSI ====================
const targetTransaksiCard = document.getElementById('targetTransaksiCard');
if (targetTransaksiCard) { const newCard = targetTransaksiCard.cloneNode(true); targetTransaksiCard.parentNode.replaceChild(newCard, targetTransaksiCard); newCard.style.cursor = 'pointer'; newCard.addEventListener('click', function(e) { if (e.target.closest('.progress-bar')) return; showInputTransaksiModal(); }); }

const saveTransaksiBtn = document.getElementById('saveTransaksiBtn');
if (saveTransaksiBtn) { const newSaveBtn = saveTransaksiBtn.cloneNode(true); saveTransaksiBtn.parentNode.replaceChild(newSaveBtn, saveTransaksiBtn); newSaveBtn.addEventListener('click', async function(e) { e.preventDefault(); e.stopPropagation(); const nominal = document.getElementById('transaksiNominal').value; const keterangan = document.getElementById('transaksiKeterangan').value; const tanggal = document.getElementById('transaksiTanggal').value; if (!nominal || parseInt(nominal) <= 0) { showNotifTop('⚠️ Masukkan jumlah transaksi yang valid!', true); return; } await saveTransaksiGlobal(nominal, keterangan, tanggal, currentTransaksiId); closeModal('inputTransaksiModal'); document.getElementById('transaksiNominal').value = ''; document.getElementById('transaksiKeterangan').value = ''; document.getElementById('transaksiTanggal').value = new Date().toISOString().split('T')[0]; currentTransaksiId = null; }); }

const cancelTransaksiBtn = document.getElementById('cancelTransaksiBtn');
if (cancelTransaksiBtn) { const newCancelBtn = cancelTransaksiBtn.cloneNode(true); cancelTransaksiBtn.parentNode.replaceChild(newCancelBtn, cancelTransaksiBtn); newCancelBtn.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); closeModal('inputTransaksiModal'); currentTransaksiId = null; }); }

const addTransaksiHistoryBtn = () => { const targetHeader = document.querySelector('.target-header'); if (targetHeader && !document.getElementById('viewTransaksiBtn')) { const viewBtn = document.createElement('button'); viewBtn.id = 'viewTransaksiBtn'; viewBtn.textContent = '📋 Riwayat Transaksi'; viewBtn.className = 'add-btn'; viewBtn.style.background = '#10b981'; viewBtn.style.marginLeft = '10px'; viewBtn.onclick = showTransaksiListModal; targetHeader.appendChild(viewBtn); } };
if (currentUser) addTransaksiHistoryBtn();

// ==================== SELECT ALL AGENT ====================
const selectAllAgentBtn = document.getElementById('selectAllAgent');
if (selectAllAgentBtn) { const newSelectAllBtn = selectAllAgentBtn.cloneNode(true); selectAllAgentBtn.parentNode.replaceChild(newSelectAllBtn, selectAllAgentBtn); newSelectAllBtn.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); if (!agentsFilteredData || agentsFilteredData.length === 0) { showNotifTop('⚠️ Tidak ada data yang ditampilkan', true); return; } const allChecked = agentsFilteredData.every(item => selectedAgentIds.get(item.id) === true); agentsFilteredData.forEach(item => { if (allChecked) selectedAgentIds.delete(item.id); else selectedAgentIds.set(item.id, true); }); renderAgentList(agentsData); const btn = document.getElementById('selectAllAgent'); if (btn) btn.textContent = allChecked ? '✅ Pilih Semua' : '⬜ Batal Semua'; }); }

// ==================== SELECT ALL PRODUK ====================
const selectAllProdukBtn = document.getElementById('selectAllProduk');
if (selectAllProdukBtn) { const newSelectAllBtn = selectAllProdukBtn.cloneNode(true); selectAllProdukBtn.parentNode.replaceChild(newSelectAllBtn, selectAllProdukBtn); newSelectAllBtn.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); const searchKeyword = document.getElementById('searchProdukInput')?.value.toLowerCase() || ''; let filteredProduk = produkData; if (searchKeyword) filteredProduk = produkData.filter(p => p.nama.toLowerCase().includes(searchKeyword) || (p.jenis_produk === 'beradmin' ? 'beradmin' : 'tanpa_admin').includes(searchKeyword)); if (filteredProduk.length === 0) { showNotifTop('⚠️ Tidak ada produk yang ditampilkan', true); return; } const allChecked = filteredProduk.every(item => selectedProdukIds.get(item.id) === true); filteredProduk.forEach(item => { if (allChecked) selectedProdukIds.delete(item.id); else selectedProdukIds.set(item.id, true); }); renderProdukList(); }); }

const deleteSelectedProdukBtn = document.getElementById('deleteSelectedProduk'); if (deleteSelectedProdukBtn) deleteSelectedProdukBtn.addEventListener('click', deleteSelectedProduk);
const deleteSelectedAgentBtn = document.getElementById('deleteSelectedAgent'); if (deleteSelectedAgentBtn) deleteSelectedAgentBtn.addEventListener('click', deleteSelectedAgent);
const deleteSelectedAgentSafeBtn = document.getElementById('deleteSelectedAgentSafe'); if (deleteSelectedAgentSafeBtn) deleteSelectedAgentSafeBtn.addEventListener('click', deleteSelectedAgentSafe);
const exportAgentExcelBtn = document.getElementById('exportAgentExcelBtn'); if (exportAgentExcelBtn) exportAgentExcelBtn.addEventListener('click', exportAgentToExcel);
setupAgentImport(); setupAgentFilters();

const downloadExampleBtn = document.createElement('button');
downloadExampleBtn.textContent = '📋 Download Contoh Excel';
downloadExampleBtn.className = 'db-import-excel';
downloadExampleBtn.style.marginLeft = '10px';
downloadExampleBtn.style.background = '#f59e0b';
downloadExampleBtn.onclick = () => downloadAgentExample();
const actionsDiv = document.querySelector('#dbAgentPage .db-actions');
if (actionsDiv) actionsDiv.appendChild(downloadExampleBtn);

// ==================== EVENT LISTENER PRODUK ====================
document.getElementById('addProdukBtn')?.addEventListener('click', () => { currentEditProdukId = null; document.getElementById('produkMasterNama').value = ''; document.getElementById('produkMasterHpp').value = ''; document.getElementById('produkMasterHargaJual').value = ''; document.getElementById('produkMasterKeterangan').value = ''; document.getElementById('produkMasterTitle').innerText = '🏷️ Tambah Produk'; document.getElementById('produkMasterModal').style.display = 'flex'; });
document.getElementById('saveProdukMasterBtn')?.addEventListener('click', async () => { const nama = document.getElementById('produkMasterNama').value; const hpp = document.getElementById('produkMasterHpp').value; const keterangan = document.getElementById('produkMasterKeterangan').value; const jenisProduk = document.getElementById('produkMasterJenis').value; let hargaJual = 0, adminDefault = 0, cidBased = 'no'; if (jenisProduk === 'tanpa_admin') hargaJual = document.getElementById('produkMasterHargaJual').value; else { adminDefault = document.getElementById('produkMasterAdminDefault').value; cidBased = document.getElementById('produkMasterCidBased').value; } await saveProduk(nama, hpp, hargaJual, keterangan, adminDefault, jenisProduk, cidBased, currentEditProdukId); closeModal('produkMasterModal'); });
document.getElementById('cancelProdukMasterBtn')?.addEventListener('click', () => { closeModal('produkMasterModal'); currentEditProdukId = null; document.getElementById('produkMasterNama').value = ''; document.getElementById('produkMasterHpp').value = ''; document.getElementById('produkMasterKeterangan').value = ''; document.getElementById('produkMasterJenis').value = 'tanpa_admin'; document.getElementById('produkMasterHargaJual').value = ''; document.getElementById('produkMasterAdminDefault').value = ''; document.getElementById('produkMasterCidBased').value = 'no'; toggleProdukJenisFields('tanpa_admin'); });
document.getElementById('addAgentProductBtn')?.addEventListener('click', openAddProductModal);
document.getElementById('saveAgentDetailBtn')?.addEventListener('click', saveAgentDetail);
document.getElementById('closeAgentDetailBtn')?.addEventListener('click', () => closeModal('agentDetailModal'));
document.getElementById('saveProductBtn')?.addEventListener('click', saveAgentProduct);
document.getElementById('cancelProductBtn')?.addEventListener('click', () => closeModal('productModal'));
document.getElementById('manageTarifAdminBtn')?.addEventListener('click', () => { loadTarifAdmin(); document.getElementById('tarifAdminModal').style.display = 'flex'; });
document.getElementById('closeTarifAdminModal')?.addEventListener('click', () => { setupModalClickOutside('tarifAdminModal'); closeModal('tarifAdminModal'); });
document.getElementById('refreshProdukBtn')?.addEventListener('click', () => { loadProduk(); if (currentAgentIdForProduct) renderAgentProducts(); showNotifTop('🔄 Daftar produk direfresh'); });

// ==================== TARGET KPI EVENT LISTENERS ====================
const saveTargetBtn = document.getElementById('saveTargetBtn');
if (saveTargetBtn) { const newSaveBtn = saveTargetBtn.cloneNode(true); saveTargetBtn.parentNode.replaceChild(newSaveBtn, saveTargetBtn); newSaveBtn.addEventListener('click', async function(e) { e.preventDefault(); e.stopPropagation(); await saveTargetData(); }); }
const cancelTargetBtn = document.getElementById('cancelTargetBtn');
if (cancelTargetBtn) { const newCancelBtn = cancelTargetBtn.cloneNode(true); cancelTargetBtn.parentNode.replaceChild(newCancelBtn, cancelTargetBtn); newCancelBtn.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); closeModal('manageTargetModal'); }); }
const addMonthlyTargetBtn = document.getElementById('addMonthlyTargetBtn');
if (addMonthlyTargetBtn) { const newAddBtn = addMonthlyTargetBtn.cloneNode(true); addMonthlyTargetBtn.parentNode.replaceChild(newAddBtn, addMonthlyTargetBtn); newAddBtn.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); if (!targetData.monthlyTargets) targetData.monthlyTargets = []; const now = new Date(); const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; targetData.monthlyTargets.push({ month: defaultMonth, target_agent: 0, target_ca: 0, target_koor: 0 }); renderMonthlyTargetList(); }); }

document.getElementById('loadAllAgentBtn')?.addEventListener('click', async () => { showNotifTop('⏳ Memuat semua data agent...'); await loadDatabaseAgent(); showNotifTop(`✅ ${agentsData.length} data agent dimuat`); });

// ==================== SELECT ALL CLOSING ETC ====================
document.getElementById('selectAllClosing')?.addEventListener('click', () => {});
document.getElementById('deleteSelectedClosing')?.addEventListener('click', deleteSelectedClosing);
document.getElementById('selectAllTidak')?.addEventListener('click', () => {});
document.getElementById('deleteSelectedTidak')?.addEventListener('click', deleteSelectedTidak);
document.getElementById('selectAllNomorSalah')?.addEventListener('click', () => {});
document.getElementById('deleteSelectedNomorSalah')?.addEventListener('click', deleteSelectedNomorSalah);
document.getElementById('selectAllCommitment')?.addEventListener('click', () => {});
document.getElementById('deleteSelectedCommitment')?.addEventListener('click', deleteSelectedCommitment);

// ==================== DARK MODE ====================
function initDarkMode() {
    const savedMode = localStorage.getItem('darkMode');
    const darkModeToggle = document.getElementById('darkModeToggle');
    function enableDarkMode() { document.body.classList.add('dark-mode'); localStorage.setItem('darkMode', 'enabled'); if (darkModeToggle) darkModeToggle.classList.add('active'); }
    function disableDarkMode() { document.body.classList.remove('dark-mode'); localStorage.setItem('darkMode', 'disabled'); if (darkModeToggle) darkModeToggle.classList.remove('active'); }
    if (savedMode === 'enabled') enableDarkMode(); else disableDarkMode();
    if (darkModeToggle) { darkModeToggle.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); if (document.body.classList.contains('dark-mode')) { disableDarkMode(); showNotifTop('🌞 Mode Terang diaktifkan'); } else { enableDarkMode(); showNotifTop('🌙 Mode Gelap diaktifkan'); } }); }
}
initDarkMode();

// ==================== TOGGLE PASSWORD ====================
const togglePasswordBtn = document.getElementById('togglePasswordBtn'); const loginPassword = document.getElementById('loginPassword');
if (togglePasswordBtn && loginPassword) { togglePasswordBtn.addEventListener('click', function() { if (loginPassword.type === 'password') { loginPassword.type = 'text'; this.textContent = '🙈'; } else { loginPassword.type = 'password'; this.textContent = '👁️'; } }); }

// ==================== LOGIN BUTTON ====================
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) { loginBtn.addEventListener('click', function() { const email = document.getElementById('loginEmail').value; const password = document.getElementById('loginPassword').value; const errorDiv = document.getElementById('loginError'); if (!email || !password) { errorDiv.textContent = 'Email dan password harus diisi!'; return; } errorDiv.textContent = ''; this.textContent = 'Loading...'; this.disabled = true; auth.signInWithEmailAndPassword(email, password).then(() => { this.textContent = 'Masuk'; this.disabled = false; }).catch(err => { errorDiv.textContent = 'Login gagal: ' + err.message; this.textContent = 'Masuk'; this.disabled = false; }); }); }

// ==================== LOGOUT BUTTON ====================
const logoutBtn = document.getElementById('logoutBtn'); if (logoutBtn) logoutBtn.addEventListener('click', () => auth.signOut());

// ==================== SETUP MODAL CLICK OUTSIDE ====================
const allModalIds = ['detailModal', 'customerModal', 'prospekModal', 'prospekNegosiasiModal', 'profileModal', 'previewPhotoModal', 'reminderModal', 'pesanModal', 'convertModal', 'followupConfirmModal', 'pendingModal', 'addCsModal', 'editDeadlineModal', 'infoModal', 'agentDetailModal', 'productModal', 'produkMasterModal'];
allModalIds.forEach(id => setupModalClickOutside(id));
setupModalClickOutside('detailModal'); setupModalClickOutside('customerModal'); setupModalClickOutside('prospekModal'); setupModalClickOutside('prospekNegosiasiModal'); setupModalClickOutside('profileModal'); setupModalClickOutside('previewPhotoModal'); setupModalClickOutside('reminderModal'); setupModalClickOutside('pesanModal'); setupModalClickOutside('convertModal'); setupModalClickOutside('followupConfirmModal'); setupModalClickOutside('pendingModal'); setupModalClickOutside('addCsModal'); setupModalClickOutside('editDeadlineModal'); setupModalClickOutside('infoModal'); setupModalClickOutside('agentDetailModal'); setupModalClickOutside('productModal'); setupModalClickOutside('produkMasterModal');

// ==================== SIDEBAR ====================
const sidebar = document.getElementById('sidebar'); const hoverZone = document.getElementById('hoverZone'); const toggleBtnSidebar = document.getElementById('toggleSidebarBtn');
function updateState() { updateSidebarBodyClass(); }
if (hoverZone) { hoverZone.addEventListener('mouseenter', function() { if (!isMobile() && sidebar) { clearTimeout(sidebarTimeout); sidebar.classList.add('active'); updateState(); } }); }
if (sidebar) { sidebar.addEventListener('mouseleave', function() { if (!isMobile()) { sidebarTimeout = setTimeout(() => { sidebar.classList.remove('active'); updateState(); }, 200); } }); sidebar.addEventListener('mouseenter', () => clearTimeout(sidebarTimeout)); }
if (toggleBtnSidebar) { toggleBtnSidebar.addEventListener('click', function(e) { e.stopPropagation(); if (sidebar) sidebar.classList.toggle('active'); updateState(); }); }
document.addEventListener('click', function(e) { if (isMobile() && sidebar && toggleBtnSidebar && !sidebar.contains(e.target) && e.target !== toggleBtnSidebar && !toggleBtnSidebar.contains(e.target)) { sidebar.classList.remove('active'); updateState(); } });
window.addEventListener('resize', function() { if (sidebar) sidebar.classList.remove('active'); updateState(); });
updateState(); setupConvertModal();

// ==================== MODAL AGENT DETAIL ====================
const agentDetailModal = document.getElementById('agentDetailModal');
if (agentDetailModal) agentDetailModal.onclick = (e) => { if (e.target === agentDetailModal) closeModal('agentDetailModal'); };
const productModal = document.getElementById('productModal');
if (productModal) productModal.onclick = (e) => { if (e.target === productModal) closeModal('productModal'); };
const produkMasterModal = document.getElementById('produkMasterModal');
if (produkMasterModal) produkMasterModal.onclick = (e) => { if (e.target === produkMasterModal) closeModal('produkMasterModal'); };

setupTarifImport();
const exportTarifBtn = document.getElementById('exportTarifExcelBtn');
if (exportTarifBtn) { exportTarifBtn.removeEventListener('click', exportTarifBtn._handler); exportTarifBtn._handler = () => exportTarifToExcel(); exportTarifBtn.addEventListener('click', exportTarifBtn._handler); }
const downloadTarifExampleBtn = document.getElementById('downloadTarifExampleBtn');
if (downloadTarifExampleBtn) { downloadTarifExampleBtn.removeEventListener('click', downloadTarifExampleBtn._handler); downloadTarifExampleBtn._handler = () => downloadTarifExample(); downloadTarifExampleBtn.addEventListener('click', downloadTarifExampleBtn._handler); }
