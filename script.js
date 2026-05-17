// ========================================
// FIREBASE CONFIGURATION
// ========================================
const firebaseConfig = {
    apiKey: "AIzaSyCfj2Xdj6et3fThyA2gg-GWG8yZOhoqREA",
    authDomain: "floupyud.firebaseapp.com",
    projectId: "floupyud"
};

// Inisialisasi Firebase (hindari double initialization)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app();
}

const auth = firebase.auth();
const db = firebase.firestore();

// 🔥 PERBAIKAN - Gunakan merge: true atau hapus saja
try {
    db.settings({ persistence: false }, { merge: true });
} catch(e) {
    console.warn('Firestore settings error:', e);
}

// ========================================
// GLOBAL VARIABLES
// ========================================
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
let agentsData = [];
let agentsFilteredData = [];
let produkData = [];
let currentEditProdukId = null;
let currentAgentIdForProduct = null;
let currentAgentProducts = [];
let trendChart = null;
let currentTransaksiId = null;
let transaksiList = [];

// ========================================
// TARGET & KPI VARIABLES
// ========================================
let targetData = {
    agent: 0,
    ca: 0,
    koordinator: 0,
    transaksi: 0,
    monthlyTargets: []
};
let targetChart = null;

// ========================================
// HELPER FUNCTIONS
// ========================================
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
    if (sidebar && sidebar.classList.contains('active')) {
        document.body.classList.add('sidebar-open');
    } else {
        document.body.classList.remove('sidebar-open');
    }
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

// ========================================
// DATE & FORMAT FUNCTIONS
// ========================================
function addDaysToDate(dateStr, days) {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

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

function formatRupiah(angka) {
    if (!angka) return 'Rp 0';
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// ========================================
// DARK MODE FUNCTIONS
// ========================================
function initDarkMode() {
    const savedMode = localStorage.getItem('darkMode');
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    if (savedMode === 'enabled') {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
        updateDarkModeIcon(true);
    } else {
        document.body.classList.remove('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = false;
        updateDarkModeIcon(false);
    }
}

function updateDarkModeIcon(isDark) {
    const iconSpan = document.querySelector('#darkModeIcon');
    if (iconSpan) {
        iconSpan.textContent = isDark ? '🌙' : '☀️';
    }
}

function enableDarkMode() {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'enabled');
    updateDarkModeIcon(true);
    showNotifTop('🌙 Mode Gelap diaktifkan');
}

function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'disabled');
    updateDarkModeIcon(false);
    showNotifTop('☀️ Mode Terang diaktifkan');
}

function setupDarkModeToggle() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        const newToggle = darkModeToggle.cloneNode(true);
        darkModeToggle.parentNode.replaceChild(newToggle, darkModeToggle);
        
        newToggle.addEventListener('change', function(e) {
            if (this.checked) {
                enableDarkMode();
            } else {
                disableDarkMode();
            }
        });
    }
}

// ========================================
// TARGET KPI FUNCTIONS
// ========================================
async function loadTargetData() {
    if (!currentUser) {
        console.log('loadTargetData: No user logged in');
        return;
    }
    
    try {
        console.log('loadTargetData: Fetching target data...');
        const targetDoc = await db.collection('settings').doc('targetKPI').get();
        if (targetDoc.exists) {
            targetData = targetDoc.data();
            console.log('loadTargetData: Data ditemukan', targetData);
        } else {
            targetData = {
                agent: 10,
                ca: 20,
                koordinator: 5,
                transaksi: 100,
                monthlyTargets: [],
                updated_at: new Date().toISOString()
            };
            console.log('loadTargetData: Data default digunakan', targetData);
        }
        await updateTargetDisplay();
    } catch(e) {
        console.error('Error load target:', e);
        showNotifTop('❌ Gagal memuat target: ' + e.message, true);
    }
}

async function updateTargetDisplay() {
    console.log('updateTargetDisplay dipanggil, targetData:', targetData);
    
    const currentAgent = agentsData.filter(a => a.agent_type === 'AGENT').length;
    const currentKoor = agentsData.filter(a => a.agent_type === 'Koordinator Wilayah (KORWIL)' || a.agent_type === 'SUB KORWIL').length;
    const currentCA = agentsData.filter(a => a.agent_type === 'CollectingAgent (CA)' || a.agent_type === 'SUB CA').length;
    let currentTransaksi = window.totalTransaksiGlobal || 0;
    
    if (transaksiList.length === 0 && currentUser) {
        await loadTransaksiGlobal();
        currentTransaksi = window.totalTransaksiGlobal || 0;
    }
    
    // Update nilai di HTML
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
    
    // Update progress bar
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

function updateTargetChart(percentages) {
    const ctx = document.getElementById('targetChart');
    if (!ctx) return;
    if (targetChart) targetChart.destroy();
    
    targetChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Agent', 'Koordinator', 'CA', 'Transaksi'],
            datasets: [{
                label: 'Pencapaian Target (%)',
                data: percentages,
                backgroundColor: ['#667eea', '#4facfe', '#f093fb', '#fa709a'],
                borderRadius: 8,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Persentase (%)' }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.raw.toFixed(1)}%`
                    }
                }
            }
        }
    });
}

async function updateTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    if (trendChart) trendChart.destroy();
    
    const months = [];
    const agentData = [];
    const caData = [];
    const koorData = [];
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
        data: {
            labels: months,
            datasets: [
                { label: 'Agent', data: agentData, borderColor: '#667eea', backgroundColor: 'transparent', tension: 0.4 },
                { label: 'CA', data: caData, borderColor: '#f093fb', backgroundColor: 'transparent', tension: 0.4 },
                { label: 'Koordinator', data: koorData, borderColor: '#4facfe', backgroundColor: 'transparent', tension: 0.4 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'top' } }
        }
    });
}

async function saveTargetData() {
    console.log('saveTargetData: Menyimpan target...');
    
    const agentVal = parseInt(document.getElementById('targetAgentInput')?.value) || 0;
    const koorVal = parseInt(document.getElementById('targetKoorInput')?.value) || 0;
    const caVal = parseInt(document.getElementById('targetCAInput')?.value) || 0;
    const transaksiVal = parseInt(document.getElementById('targetTransaksiInput')?.value) || 0;
    
    const newTarget = {
        agent: agentVal,
        koordinator: koorVal,
        ca: caVal,
        transaksi: transaksiVal,
        monthlyTargets: targetData.monthlyTargets || [],
        updated_at: new Date().toISOString(),
        updated_by: currentUser?.uid || 'unknown'
    };
    
    try {
        await db.collection('settings').doc('targetKPI').set(newTarget, { merge: true });
        targetData = newTarget;
        console.log('saveTargetData: Berhasil disimpan');
        showNotifTop('✅ Target berhasil disimpan!');
        closeModal('manageTargetModal');
        await updateTargetDisplay();
    } catch(error) {
        console.error('Error saving target:', error);
        showNotifTop('❌ Gagal menyimpan target: ' + error.message, true);
    }
}

function renderMonthlyTargetList() {
    const container = document.getElementById('monthlyTargetList');
    if (!container) return;
    
    if (!targetData.monthlyTargets || targetData.monthlyTargets.length === 0) {
        container.innerHTML = '<p style="color:#9ca3af; text-align:center; padding:20px;">Belum ada target bulanan</p>';
        return;
    }
    
    container.innerHTML = targetData.monthlyTargets.map((item, idx) => `
        <div style="display: flex; gap: 8px; margin-bottom: 10px; align-items: center; flex-wrap: wrap;">
            <input type="month" value="${item.month}" data-idx="${idx}" class="month-input" style="flex:2; min-width:120px; padding: 8px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <input type="number" value="${item.target_agent || 0}" placeholder="Agent" data-idx="${idx}" class="month-agent" style="flex:1; min-width:70px; padding: 8px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <input type="number" value="${item.target_ca || 0}" placeholder="CA" data-idx="${idx}" class="month-ca" style="flex:1; min-width:70px; padding: 8px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <input type="number" value="${item.target_koor || 0}" placeholder="Koor" data-idx="${idx}" class="month-koor" style="flex:1; min-width:70px; padding: 8px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <button class="delete-monthly-btn" data-idx="${idx}" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer;">🗑️</button>
        </div>
    `).join('');
    
    // Event listeners untuk monthly target
    document.querySelectorAll('.month-input').forEach(input => {
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        newInput.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            targetData.monthlyTargets[idx].month = e.target.value;
        });
    });
    document.querySelectorAll('.month-agent').forEach(input => {
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        newInput.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            targetData.monthlyTargets[idx].target_agent = parseInt(e.target.value) || 0;
        });
    });
    document.querySelectorAll('.month-ca').forEach(input => {
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        newInput.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            targetData.monthlyTargets[idx].target_ca = parseInt(e.target.value) || 0;
        });
    });
    document.querySelectorAll('.month-koor').forEach(input => {
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        newInput.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            targetData.monthlyTargets[idx].target_koor = parseInt(e.target.value) || 0;
        });
    });
    document.querySelectorAll('.delete-monthly-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            targetData.monthlyTargets.splice(idx, 1);
            renderMonthlyTargetList();
        });
    });
}

// ========================================
// TRANSACTION FUNCTIONS (GLOBAL)
// ========================================
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
            if (tglTransaksi >= startOfMonth && tglTransaksi <= endOfMonth) {
                totalTransaksiBulanIni += data.nominal || 0;
            }
        });
        
        window.totalTransaksiGlobal = totalTransaksiBulanIni;
        if (typeof updateTargetDisplay === 'function') await updateTargetDisplay();
        return totalTransaksiBulanIni;
    } catch(e) {
        console.error('Error load transaksi global:', e);
        return 0;
    }
}

async function saveTransaksiGlobal(nominal, keterangan, tanggal, transaksiId = null) {
    if (!currentUser) {
        showNotifTop('⚠️ Anda harus login terlebih dahulu!', true);
        return false;
    }
    if (!nominal || nominal <= 0) {
        showNotifTop('⚠️ Jumlah transaksi harus diisi dan lebih dari 0!', true);
        return false;
    }
    
    try {
        const transaksiRef = db.collection('transaksi_global');
        const data = {
            nominal: parseInt(nominal),
            keterangan: keterangan || '',
            tanggal: tanggal || new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString(),
            created_by: currentUser.uid,
            created_by_name: currentUserName,
            updated_at: new Date().toISOString()
        };
        
        if (transaksiId) {
            await transaksiRef.doc(transaksiId).update(data);
            showNotifTop('✅ Transaksi berhasil diupdate!');
        } else {
            await transaksiRef.add(data);
            showNotifTop('✅ Transaksi berhasil ditambahkan!');
        }
        
        await loadTransaksiGlobal();
        return true;
    } catch(e) {
        console.error('Error save transaksi global:', e);
        showNotifTop('❌ Gagal menyimpan transaksi: ' + e.message, true);
        return false;
    }
}

async function deleteTransaksiGlobal(transaksiId) {
    if (!confirm('Yakin ingin menghapus transaksi ini?')) return;
    try {
        await db.collection('transaksi_global').doc(transaksiId).delete();
        showNotifTop('🗑️ Transaksi dihapus');
        await loadTransaksiGlobal();
        renderTransaksiListGlobal();
    } catch(e) {
        showNotifTop('❌ Gagal hapus: ' + e.message, true);
    }
}

function renderTransaksiListGlobal() {
    const container = document.getElementById('transaksiList');
    if (!container) return;
    if (transaksiList.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:40px; color:#9ca3af;">📭 Belum ada catatan transaksi</p>';
        return;
    }
    
    container.innerHTML = transaksiList.map(item => `
        <div class="db-item" style="border-left: 3px solid #4f46e5; margin-bottom: 8px;">
            <div class="db-item-info">
                <h4>💰 ${formatRupiah(item.nominal)}</h4>
                <p>${escapeHtml(item.keterangan || '-')}</p>
                <small>📅 ${new Date(item.tanggal).toLocaleDateString('id-ID')} | 👤 oleh: ${escapeHtml(item.created_by_name || 'CS')}</small>
            </div>
            <div class="db-item-actions">
                ${currentUserRole === 'owner' || item.created_by === currentUser.uid ? 
                    `<button class="db-item-edit" onclick="editTransaksiGlobal('${item.id}')">✏️ Edit</button>
                     <button class="db-item-delete" onclick="deleteTransaksiGlobal('${item.id}')">🗑️ Hapus</button>` : 
                    `<small style="color:#9ca3af;">Hanya pembuat yang bisa edit/hapus</small>`
                }
            </div>
        </div>
    `).join('');
}

window.editTransaksiGlobal = function(id) {
    const transaksi = transaksiList.find(t => t.id === id);
    if (!transaksi) return;
    if (currentUserRole !== 'owner' && transaksi.created_by !== currentUser.uid) {
        showNotifTop('⚠️ Anda hanya bisa mengedit transaksi yang Anda buat sendiri!', true);
        return;
    }
    
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

function showTransaksiListModal() {
    renderTransaksiListGlobal();
    document.getElementById('transaksiListModal').style.display = 'flex';
}

// ========================================
// DUPLICATE CHECK FUNCTIONS
// ========================================
async function checkDuplicateCustomer(agentId, hp, excludeId = null) {
    let query = db.collection('customers').where('user_id', '==', currentUser.uid);
    const snapshot = await query.get();
    let duplicateAgent = null;
    let duplicateHp = null;
    let ownerName = currentUserName;
    
    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (excludeId && doc.id === excludeId) continue;
        if (data.agent_id === agentId) {
            duplicateAgent = { id: doc.id, nama: data.nama, owner: currentUserName };
        }
        if (data.hp === hp) {
            duplicateHp = { id: doc.id, nama: data.nama, owner: currentUserName };
        }
    }
    
    if (currentUserRole === 'owner') {
        const allCustomers = await db.collection('customers').get();
        for (const doc of allCustomers.docs) {
            const data = doc.data();
            if (excludeId && doc.id === excludeId) continue;
            if (data.agent_id === agentId) {
                const userDoc = await db.collection('users').doc(data.user_id).get();
                duplicateAgent = { id: doc.id, nama: data.nama, owner: userDoc.exists ? userDoc.data().nama || 'CS Agent' : 'CS Agent' };
            }
            if (data.hp === hp) {
                const userDoc = await db.collection('users').doc(data.user_id).get();
                duplicateHp = { id: doc.id, nama: data.nama, owner: userDoc.exists ? userDoc.data().nama || 'CS Agent' : 'CS Agent' };
            }
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
        if (data.hp === hp) {
            duplicateHp = { id: doc.id, nama: data.nama, owner: currentUserName };
        }
    }
    
    if (currentUserRole === 'owner') {
        const allProspek = await db.collection('prospek').get();
        for (const doc of allProspek.docs) {
            const data = doc.data();
            if (excludeId && doc.id === excludeId) continue;
            if (data.hp === hp) {
                const userDoc = await db.collection('users').doc(data.user_id).get();
                duplicateHp = { id: doc.id, nama: data.nama, owner: userDoc.exists ? userDoc.data().nama || 'CS Agent' : 'CS Agent' };
            }
        }
    }
    
    return duplicateHp;
}

// ========================================
// MODAL FUNCTIONS
// ========================================
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
    modal._clickOutsideHandler = function(e) {
        if (e.target === modal) closeModal(modalId);
    };
    modal.addEventListener('click', modal._clickOutsideHandler);
}

// ========================================
// CONFIRM DIALOG FUNCTIONS
// ========================================
function showConfirmDialog(title, message, onConfirm, onCancel) {
    const negosiasiModal = document.getElementById('prospekNegosiasiModal');
    let negosiasiWasOpen = false;
    if (negosiasiModal && negosiasiModal.style.display === 'flex') {
        negosiasiWasOpen = true;
        negosiasiModal.style.display = 'none';
    }
    
    const existingConfirm = document.querySelector('.confirm-dialog-overlay');
    if (existingConfirm) existingConfirm.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'confirm-dialog-overlay';
    overlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0, 0, 0, 0.5) !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        z-index: 99999999 !important;
        backdrop-filter: blur(4px);
    `;
    
    overlay.innerHTML = `
        <div class="confirm-dialog-content" style="
            background: white !important;
            border-radius: 24px !important;
            max-width: 400px !important;
            width: 90% !important;
            z-index: 100000000 !important;
            position: relative !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
        ">
            <h3 style="color: #ef4444; font-size: 20px; font-weight: 700; padding: 20px 20px 0; margin-bottom: 4px;">⚠️ ${title}</h3>
            <div class="modal-subtitle" style="color: #374151; white-space: pre-line; padding: 0 20px 12px; font-size: 12px;">${message}</div>
            <div style="padding: 0 20px 20px 20px;">
                <p style="font-size: 12px; color: #ef4444; margin-bottom: 16px;">⚠️ Peringatan: Data yang sudah dipindahkan TIDAK BISA dikembalikan!</p>
                <div class="modal-buttons" style="display: flex; gap: 12px; margin-top: 8px;">
                    <button id="confirmYesBtn" class="btn-danger">✅ Ya, Lanjutkan</button>
                    <button id="confirmNoBtn" class="btn-outline">❌ Batal</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    
    const cleanup = () => {
        overlay.remove();
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        if (negosiasiWasOpen && negosiasiModal) negosiasiModal.style.display = 'flex';
    };
    
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
            <div style="padding: 0 20px;">${fieldsHtml}</div>
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
                if (field.required && !input.value) allFilled = false;
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

// ========================================
// CONVERT MODAL SETUP
// ========================================
function setupConvertModal() {
    const confirmBtn = document.getElementById('confirmConvertBtn');
    const cancelBtn = document.getElementById('cancelConvertBtn');
    const modal = document.getElementById('convertModal');
    
    if (!modal) return;
    
    if (confirmBtn) {
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.onclick = async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const agentId = document.getElementById('convertAgentId')?.value;
            const followupDate = document.getElementById('convertFollowupDate')?.value;
            
            if (!agentId) {
                alert('⚠️ ID Agent wajib diisi!');
                return;
            }
            if (!followupDate) {
                alert('⚠️ Tanggal followup wajib diisi!');
                return;
            }
            if (!currentConvertProspekId) {
                alert('⚠️ Error: Data prospek tidak ditemukan');
                return;
            }
            
            showConfirmDialog(
                'Pindahkan ke Followup Agen?',
                `Apakah Anda yakin ingin memindahkan prospek ini ke FOLLOWUP AGEN dengan ID Agent: ${agentId}?\n\n⚠️ Data yang sudah dipindahkan TIDAK BISA dikembalikan ke Prospek Agen!`,
                async () => {
                    try {
                        showNotif('⏳ Memproses pemindahan...');
                        const prospekDoc = await db.collection('prospek').doc(currentConvertProspekId).get();
                        const prospekData = prospekDoc.data();
                        
                        if (!prospekData) {
                            showNotif('❌ Data prospek tidak ditemukan', true);
                            return;
                        }
                        
                        const cleanHp = prospekData.hp;
                        const { duplicateAgent, duplicateHp } = await checkDuplicateCustomer(agentId, cleanHp);
                        
                        if (duplicateAgent) {
                            showNotif(`⚠️ ID Agent "${agentId}" sudah terdaftar oleh ${duplicateAgent.owner}!`, true);
                            return;
                        }
                        if (duplicateHp) {
                            showNotif(`⚠️ Nomor WhatsApp "${cleanHp}" sudah terdaftar oleh ${duplicateHp.owner}!`, true);
                            return;
                        }
                        
                        await db.collection('customers').add({
                            agent_id: agentId,
                            nama: prospekData.nama,
                            hp: prospekData.hp,
                            tanggal: followupDate,
                            status: 'baru',
                            apk: '',
                            user_id: prospekData.user_id,
                            created_at: new Date().toISOString(),
                            followup_data: null,
                            pending_data: []
                        });
                        
                        await db.collection('prospek').doc(currentConvertProspekId).delete();
                        
                        modal.style.display = 'none';
                        document.body.classList.remove('modal-open');
                        closeModal('detailModal');
                        showNotif('✅ Berhasil dipindahkan ke Followup Agen!');
                        loadAllData();
                    } catch(error) {
                        showNotif('❌ Gagal: ' + error.message, true);
                    }
                }
            );
        };
    }
    
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        newCancelBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        };
    }
    
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    };
}

// ========================================
// PROFILE FUNCTIONS
// ========================================
function showPhotoPreview(imageUrl) {
    const previewModal = document.getElementById('previewPhotoModal');
    const previewImage = document.getElementById('previewPhotoLarge');
    if (previewImage && previewModal) {
        previewImage.src = imageUrl;
        previewModal.style.display = 'flex';
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
    }
}

// ========================================
// BADGE UPDATE FUNCTIONS
// ========================================
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
        
        const [customerOverdue, prospekOverdue] = await Promise.all([customerQuery.get(), prospekQuery.get()]);
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

// ========================================
// TARIF ADMIN FUNCTIONS
// ========================================
async function loadTarifAdmin() {
    if (!currentUser) return;
    const isOwner = currentUserRole === 'owner';
    let query = db.collection('tarif_admin');
    if (!isOwner) query = query.where('user_id', '==', currentUser.uid);
    
    const snapshot = await query.get();
    tarifAdminData = [];
    snapshot.forEach(doc => tarifAdminData.push({ id: doc.id, ...doc.data() }));
    renderTarifAdminList();
}

function renderTarifAdminList() {
    const container = document.getElementById('tarifAdminList');
    if (!container) return;
    
    const searchKeyword = document.getElementById('searchTarifInput')?.value.toLowerCase() || '';
    let filteredData = tarifAdminData;
    if (searchKeyword) {
        filteredData = tarifAdminData.filter(item => item.cid.toLowerCase().includes(searchKeyword));
    }
    
    if (filteredData.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;">🏷️ Tidak ada data admin per CID</p>';
        return;
    }
    
    container.innerHTML = filteredData.map(item => `
        <div class="db-item" data-id="${item.id}">
            <div class="db-item-info">
                <h4>🆔 CID: ${escapeHtml(item.cid)}</h4>
                <p>⚡ PLN Pospaid: ${formatRupiah(item.admin_pospaid || 0)}<br>
                   ⚡ PLN Prepaid: ${formatRupiah(item.admin_prepaid || 0)}<br>
                   ⚡ PLN Nontaglis: ${formatRupiah(item.admin_nontaglis || 0)}</p>
                <small>Terakhir update: ${item.updated_at ? new Date(item.updated_at).toLocaleString('id-ID') : '-'}</small>
            </div>
            <div class="db-item-actions">
                <button class="db-item-edit" onclick="editTarifAdmin('${item.id}')">✏️ Edit</button>
                <button class="db-item-delete" onclick="deleteTarifAdmin('${item.id}')">🗑️ Hapus</button>
            </div>
        </div>
    `).join('');
}

async function saveTarifAdmin(cid, pospaid, prepaid, nontaglis, id = null) {
    if (!cid) {
        showNotifTop('⚠️ CID wajib diisi!', true);
        return false;
    }
    
    const data = {
        cid: cid,
        admin_pospaid: parseInt(pospaid) || 0,
        admin_prepaid: parseInt(prepaid) || 0,
        admin_nontaglis: parseInt(nontaglis) || 0,
        user_id: currentUser.uid,
        updated_at: new Date().toISOString()
    };
    
    try {
        if (id) {
            await db.collection('tarif_admin').doc(id).update(data);
            showNotifTop('✅ Data admin per CID berhasil diupdate');
        } else {
            const existing = tarifAdminData.find(t => t.cid === cid);
            if (existing) {
                showNotifTop(`⚠️ CID ${cid} sudah ada! Silakan edit data yang sudah ada.`, true);
                return false;
            }
            data.created_at = new Date().toISOString();
            await db.collection('tarif_admin').add(data);
            showNotifTop('✅ Data admin per CID berhasil ditambahkan');
        }
        await loadTarifAdmin();
        return true;
    } catch(e) {
        showNotifTop('❌ Gagal: ' + e.message, true);
        return false;
    }
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
                
                if (!json || json.length === 0) {
                    showNotifTop('File Excel kosong!', true);
                    return;
                }
                
                let success = 0, failed = 0;
                const errors = [];
                
                for (const row of json) {
                    try {
                        let cid = row.cid || row.CID || row.Cid || '';
                        let pospaid = row.pospaid || row.Pospaid || row.PLN_Pospaid || row.admin_pospaid || 0;
                        let prepaid = row.prepaid || row.Prepaid || row.PLN_Prepaid || row.admin_prepaid || 0;
                        let nontaglis = row.nontaglis || row.Nontaglis || row.PLN_Nontaglis || row.admin_nontaglis || 0;
                        
                        if (!cid) {
                            failed++;
                            errors.push(`Baris ke-${json.indexOf(row)+2}: CID kosong`);
                            continue;
                        }
                        
                        cid = cid.toString().trim();
                        const existing = tarifAdminData.find(t => t.cid === cid);
                        if (existing) {
                            await db.collection('tarif_admin').doc(existing.id).update({
                                admin_pospaid: parseInt(pospaid) || 0,
                                admin_prepaid: parseInt(prepaid) || 0,
                                admin_nontaglis: parseInt(nontaglis) || 0,
                                updated_at: new Date().toISOString()
                            });
                        } else {
                            await db.collection('tarif_admin').add({
                                cid: cid,
                                admin_pospaid: parseInt(pospaid) || 0,
                                admin_prepaid: parseInt(prepaid) || 0,
                                admin_nontaglis: parseInt(nontaglis) || 0,
                                user_id: currentUser.uid,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            });
                        }
                        success++;
                    } catch(err) {
                        failed++;
                        errors.push(`Baris ke-${json.indexOf(row)+2}: ${err.message}`);
                    }
                }
                
                let resultMsg = `✅ Import selesai! Berhasil: ${success}, Gagal: ${failed}`;
                if (errors.length > 0 && errors.length <= 3) resultMsg += `\n\nError:\n${errors.join('\n')}`;
                else if (errors.length > 3) resultMsg += `\n\n${errors.length} error terjadi.`;
                showNotifTop(resultMsg, failed > 0);
                await loadTarifAdmin();
                fileInput.value = '';
            } catch(err) {
                showNotifTop('❌ Gagal import: ' + err.message, true);
            } finally {
                importBtn.textContent = '📥 Import Excel';
                importBtn.disabled = false;
            }
        };
        reader.readAsArrayBuffer(file);
    };
    fileInput.addEventListener('change', fileInput._handler);
}

async function exportTarifToExcel() {
    if (tarifAdminData.length === 0) {
        showNotifTop('Tidak ada data untuk diexport', true);
        return;
    }
    
    const exportData = tarifAdminData.map(item => ({
        'CID': item.cid,
        'PLN Pospaid (Admin)': item.admin_pospaid || 0,
        'PLN Prepaid (Admin)': item.admin_prepaid || 0,
        'PLN Nontaglis (Admin)': item.admin_nontaglis || 0,
        'Terakhir Update': item.updated_at ? new Date(item.updated_at).toLocaleDateString('id-ID') : '-'
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Admin per CID');
    XLSX.writeFile(wb, `tarif_admin_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotifTop('✅ Export data berhasil!');
}

function downloadTarifExample() {
    const data = [
        { cid: '5213247', pospaid: 7200, prepaid: 7200, nontaglis: 7200 },
        { cid: '5213248', pospaid: 7500, prepaid: 7500, nontaglis: 7500 },
        { cid: '5213249', pospaid: 7000, prepaid: 7000, nontaglis: 7000 }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Admin per CID');
    XLSX.writeFile(wb, 'contoh_tarif_admin.xlsx');
    showNotifTop('📋 Contoh file Excel berhasil diunduh');
}

// ========================================
// PRODUCT MASTER FUNCTIONS
// ========================================
async function loadProduk() {
    if (!currentUser) return;
    const snapshot = await db.collection('produk').get();
    produkData = [];
    snapshot.forEach(doc => produkData.push({ id: doc.id, ...doc.data() }));
    renderProdukList();
    updateProductSelect();
}

function renderProdukList() {
    const container = document.getElementById('produkList');
    if (!container) return;
    
    const searchKeyword = document.getElementById('searchProdukInput')?.value.toLowerCase() || '';
    let filteredProduk = produkData;
    if (searchKeyword) {
        filteredProduk = produkData.filter(p => 
            p.nama.toLowerCase().includes(searchKeyword) ||
            (p.jenis_produk === 'beradmin' ? 'beradmin' : 'tanpa_admin').includes(searchKeyword)
        );
    }
    
    if (filteredProduk.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;">🏷️ Tidak ada produk ditemukan</p>';
        return;
    }
    
    container.innerHTML = filteredProduk.map(item => {
        const isAdminBased = item.jenis_produk === 'beradmin';
        return `
        <div class="db-item produk-item" data-id="${item.id}" style="cursor: pointer;">
            <div class="db-item-info">
                <h4>📦 ${escapeHtml(item.nama)}</h4>
                <p>${isAdminBased ? 
                    `🏷️ Beradmin | Admin Default: ${formatRupiah(item.admin_default || 0)} | ${item.cid_based ? 'CID Based ✅' : 'Admin Tetap'}` :
                    `💰 Tanpa Admin | HPP: ${formatRupiah(item.hpp)} | Harga Jual: ${formatRupiah(item.harga_jual || 0)}`
                }</p>
                <small>${escapeHtml(item.keterangan || '')}</small>
            </div>
            <div class="db-item-actions">
                <button class="db-item-delete" onclick="event.stopPropagation(); deleteProduk('${item.id}')">🗑️ Hapus</button>
            </div>
        </div>`;
    }).join('');
    
    document.querySelectorAll('#produkList .produk-item').forEach(el => {
        el.removeEventListener('click', handleProdukClick);
        el.addEventListener('click', handleProdukClick);
        function handleProdukClick(e) {
            if (e.target.classList.contains('db-item-delete')) return;
            editProduk(el.dataset.id);
        }
    });
}

window.deleteProduk = async function(id) {
    if (!confirm('Yakin hapus produk ini?')) return;
    try {
        await db.collection('produk').doc(id).delete();
        showNotifTop('🗑️ Produk dihapus');
        await loadProduk();
    } catch(e) {
        showNotifTop('❌ Gagal hapus: ' + e.message, true);
    }
};

async function saveProduk(nama, hpp, hargaJual, keterangan, adminDefault, jenisProduk, cidBased, id = null) {
    if (!nama || !hpp) {
        showNotifTop('⚠️ Nama produk dan HPP wajib diisi!', true);
        return false;
    }
    
    const data = {
        nama: nama,
        hpp: parseInt(hpp),
        jenis_produk: jenisProduk || 'tanpa_admin',
        keterangan: keterangan || '',
        updated_at: new Date().toISOString()
    };
    
    if (jenisProduk === 'tanpa_admin') {
        data.harga_jual = parseInt(hargaJual) || 0;
        data.admin_default = 0;
        data.cid_based = false;
    } else {
        data.harga_jual = 0;
        data.admin_default = parseInt(adminDefault) || 0;
        data.cid_based = cidBased === 'yes';
    }
    
    if (id) {
        await db.collection('produk').doc(id).update(data);
        showNotifTop('✅ Produk berhasil diupdate');
    } else {
        data.created_at = new Date().toISOString();
        await db.collection('produk').add(data);
        showNotifTop('✅ Produk berhasil ditambahkan');
    }
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
    
    if (jenis === 'tanpa_admin') {
        tanpaAdminFields.style.display = 'block';
        beradminFields.style.display = 'none';
    } else {
        tanpaAdminFields.style.display = 'none';
        beradminFields.style.display = 'block';
    }
}

function setupProdukImport() {
    const importBtn = document.getElementById('importProdukExcelBtn');
    const fileInput = document.getElementById('produkExcelFile');
    if (!importBtn || !fileInput) return;
    
    importBtn.onclick = () => fileInput.click();
    fileInput.onchange = async (e) => {
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
                
                if (!json || json.length === 0) {
                    showNotifTop('File Excel kosong!', true);
                    return;
                }
                
                let success = 0, failed = 0;
                for (const row of json) {
                    try {
                        let nama = row.nama || row.Nama || row.name || row.Name || '';
                        let hpp = row.hpp || row.HPP || row.harga_modal || row.HargaModal || '';
                        let hargaJual = row.harga_jual || row.HargaJual || row.harga || row.Harga || '';
                        let keterangan = row.keterangan || row.Keterangan || '';
                        
                        if (!nama || !hpp) {
                            failed++;
                            continue;
                        }
                        
                        await db.collection('produk').add({
                            nama: nama.toString().trim(),
                            hpp: parseInt(hpp) || 0,
                            harga_jual: parseInt(hargaJual) || 0,
                            keterangan: keterangan || '',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        });
                        success++;
                    } catch(err) {
                        failed++;
                    }
                }
                
                showNotifTop(`✅ Import produk selesai! Berhasil: ${success}, Gagal: ${failed}`);
                await loadProduk();
                fileInput.value = '';
            } catch(err) {
                showNotifTop('❌ Gagal import: ' + err.message, true);
            } finally {
                importBtn.textContent = '📥 Import Excel';
                importBtn.disabled = false;
            }
        };
        reader.readAsArrayBuffer(file);
    };
}

async function exportProdukToExcel() {
    if (produkData.length === 0) {
        showNotifTop('Tidak ada data produk untuk diexport', true);
        return;
    }
    
    const exportData = produkData.map(item => ({
        'Nama Produk': item.nama,
        'HPP (Modal)': item.hpp,
        'Harga Jual': item.harga_jual,
        'Keterangan': item.keterangan || '',
        'Tanggal Dibuat': new Date(item.created_at).toLocaleDateString('id-ID')
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produk');
    XLSX.writeFile(wb, `produk_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotifTop('✅ Export produk berhasil!');
}

function downloadProdukExample() {
    const data = [
        { nama: 'Contoh Produk Beradmin', admin: 5000, hpp: 100000, harga_jual: '', jenis: 'beradmin', cid_based: 'yes' },
        { nama: 'Contoh Produk Tanpa Admin', admin: '', hpp: 50000, harga_jual: 75000, jenis: 'tanpa_admin' }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produk');
    XLSX.writeFile(wb, 'contoh_produk.xlsx');
}

// ========================================
// AGENT FUNCTIONS
// ========================================
function updateSelectAllAgentButton() {
    const btn = document.getElementById('selectAllAgent');
    if (!btn) return;
    if (!agentsFilteredData || agentsFilteredData.length === 0) {
        btn.textContent = '✅ Pilih Semua';
        return;
    }
    const allChecked = agentsFilteredData.every(item => selectedAgentIds.get(item.id) === true);
    btn.textContent = allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua';
}

async function deleteSelectedAgent() {
    const selectedIds = Array.from(selectedAgentIds.keys());
    if (selectedIds.length === 0) {
        showNotifTop('Tidak ada data yang dipilih', true);
        return;
    }
    if (confirm(`Hapus ${selectedIds.length} data agent yang dipilih?`)) {
        const batch = db.batch();
        selectedIds.forEach(id => batch.delete(db.collection('db_agent').doc(id)));
        await batch.commit();
        selectedAgentIds.clear();
        showNotifTop(`${selectedIds.length} data agent berhasil dihapus`);
        loadDatabaseAgent();
    }
}

async function moveAgentToFollowup(agentId) {
    const doc = await db.collection('db_agent').doc(agentId).get();
    if (!doc.exists) return;
    
    const data = doc.data();
    const { duplicateAgent, duplicateHp } = await checkDuplicateCustomer(data.agent_id, data.hp);
    
    if (duplicateAgent) {
        showNotifTop(`⚠️ ID Agent "${data.agent_id}" sudah terdaftar!`, true);
        return;
    }
    if (duplicateHp) {
        showNotifTop(`⚠️ Nomor WhatsApp "${data.hp}" sudah terdaftar!`, true);
        return;
    }
    
    showConfirmDialog(
        'Pindahkan ke Followup Agen?',
        `Apakah Anda yakin ingin memindahkan agent "${escapeHtml(data.nama)}" ke FOLLOWUP AGEN?`,
        async () => {
            await db.collection('customers').add({
                agent_id: data.agent_id,
                nama: data.nama,
                hp: data.hp,
                apk: data.apk || '',
                agent_type: data.agent_type || '',
                tanggal: getTodayDate(),
                status: 'baru',
                user_id: data.user_id,
                created_at: new Date().toISOString(),
                followup_data: null,
                pending_data: []
            });
            await db.collection('db_agent').doc(agentId).delete();
            showNotifTop('✅ Agent berhasil dipindahkan ke Followup Agen!');
            loadDatabaseAgent();
            loadAllData();
        }
    );
}

async function deleteAgentItem(id) {
    if (!confirm('Yakin hapus data agent ini?')) return;
    await db.collection('db_agent').doc(id).delete();
    selectedAgentIds.delete(id);
    showNotifTop('🗑️ Data agent dihapus');
    loadDatabaseAgent();
}

async function loadDatabaseAgent() {
    if (!currentUser) return;
    
    const isOwner = currentUserRole === 'owner';
    let query = db.collection('db_agent');
    if (!isOwner) query = query.where('user_id', '==', currentUser.uid);
    
    query.onSnapshot(async snap => {
        const items = [];
        for (const doc of snap.docs) {
            const d = doc.data();
            let ownerName = '';
            if (isOwner && d.user_id !== currentUser.uid) {
                const userDoc = await db.collection('users').doc(d.user_id).get();
                ownerName = userDoc.exists ? ` (${userDoc.data().nama || 'CS'})` : '';
            }
            items.push({
                id: doc.id,
                nama: d.nama + ownerName,
                hp: d.hp || '',
                agent_id: d.agent_id || '-',
                agent_type: d.agent_type || '-',
                apk: d.apk || '',
                createdAt: d.created_at,
                checked: selectedAgentIds.get(doc.id) || false,
                upline: d.upline || '',
                cid: d.cid || '',
                jenis_bank: d.jenis_bank || ''
            });
        }
        agentsData = items;
        renderAgentList(items);
    });
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
    
    if (searchTerm) {
        filtered = filtered.filter(item => 
            (item.nama && String(item.nama).toLowerCase().includes(searchTerm)) ||
            (item.agent_id && String(item.agent_id).toLowerCase().includes(searchTerm)) ||
            (item.hp && String(item.hp).includes(searchTerm))
        );
    }
    if (filterUpline) {
        filtered = filtered.filter(item => item.upline && String(item.upline).toLowerCase().includes(filterUpline));
    }
    if (filterCid) {
        filtered = filtered.filter(item => item.cid && String(item.cid).toLowerCase().includes(filterCid));
    }
    if (filterBank) {
        filtered = filtered.filter(item => item.jenis_bank === filterBank);
    }
    if (filterDate) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);
        const monthAgo = new Date(today); monthAgo.setDate(today.getDate() - 30);
        
        filtered = filtered.filter(item => {
            const itemDate = item.createdAt ? new Date(item.createdAt) : new Date(0);
            if (filterDate === 'today') return itemDate >= today;
            if (filterDate === 'week') return itemDate >= weekAgo;
            if (filterDate === 'month') return itemDate >= monthAgo;
            return true;
        });
    }
    if (filterHasHp) filtered = filtered.filter(item => item.hp && String(item.hp).length > 5);
    if (filterHasApk) filtered = filtered.filter(item => item.apk && item.apk !== '-');
    
    agentsFilteredData = filtered;
    
    const filteredCountSpan = document.getElementById('agentFilteredCount');
    if (filteredCountSpan) filteredCountSpan.innerText = filtered.length;
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;color:#9ca3af;">📭 Tidak ada data yang sesuai filter</p>';
        return;
    }
    
    let html = '';
    for (const item of filtered) {
        const isChecked = selectedAgentIds.get(item.id) === true;
        html += `
            <div class="db-item-agent" data-id="${item.id}">
                <input type="checkbox" class="db-item-checkbox-agent" data-id="${item.id}" ${isChecked ? 'checked' : ''}>
                <div class="db-item-agent-info">
                    <h4>${escapeHtml(String(item.nama || '-'))}</h4>
                    <p>📱 ${escapeHtml(String(item.hp || '-'))} | 🆔 ${escapeHtml(String(item.agent_id || '-'))} | 🏷️ ${escapeHtml(String(item.agent_type || '-'))}</p>
                    <p>👤 Upline: ${escapeHtml(String(item.upline || '-'))} | 🆔 CID: ${escapeHtml(String(item.cid || '-'))} | 🏦 Bank: ${escapeHtml(String(item.jenis_bank || '-'))}</p>
                    <small>📅 ${item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : '-'}</small>
                </div>
                <div class="db-item-agent-actions">
                    <button class="db-item-wa" onclick="event.stopPropagation(); openWA('${escapeHtml(String(item.hp || ''))}')">💬 WA</button>
                    <button class="db-item-move-followup" onclick="event.stopPropagation(); moveAgentToFollowup('${item.id}')">📞 Pindah ke Followup</button>
                    <button class="db-item-delete" onclick="event.stopPropagation(); deleteAgentItem('${item.id}')">🗑️ Hapus</button>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    document.querySelectorAll('#dbAgentList .db-item-checkbox-agent').forEach(cb => {
        cb.removeEventListener('change', handleCheckboxChange);
        cb.addEventListener('change', handleCheckboxChange);
        function handleCheckboxChange(e) {
            e.stopPropagation();
            const id = cb.dataset.id;
            if (cb.checked) selectedAgentIds.set(id, true);
            else selectedAgentIds.delete(id);
            updateSelectAllAgentButton();
        }
    });
    
    document.querySelectorAll('#dbAgentList .db-item-agent').forEach(el => {
        el.removeEventListener('click', handleItemClick);
        el.addEventListener('click', handleItemClick);
        function handleItemClick(e) {
            if (e.target.type !== 'checkbox' &&
                !e.target.classList.contains('db-item-wa') &&
                !e.target.classList.contains('db-item-move-followup') &&
                !e.target.classList.contains('db-item-delete')) {
                openAgentDetail(el.dataset.id);
            }
        }
    });
    
    updateSelectAllAgentButton();
}

// Fungsi untuk membuka modal detail agent dengan data lengkap
async function openAgentDetail(id) {
    try {
        const doc = await db.collection('db_agent').doc(id).get();
        if (!doc.exists) {
            showNotifTop('❌ Data agent tidak ditemukan!', true);
            return;
        }
        
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
        
        if (d.cid) {
            await loadTarifAdminByCid(d.cid);
        } else {
            currentTarifData = [];
        }
        
        renderAgentProducts();
        document.getElementById('agentDetailModal').style.display = 'flex';
        document.body.classList.add('modal-open');
    } catch (error) {
        console.error('Error:', error);
        showNotifTop('❌ Gagal membuka detail: ' + error.message, true);
    }
}

async function saveAgentDetail() {
    if (!currentAgentIdForProduct) {
        showNotifTop('⚠️ Data agent tidak ditemukan!', true);
        return;
    }
    
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
    
    if (!nama) {
        showNotifTop('⚠️ Nama agent wajib diisi!', true);
        return;
    }
    if (!agentType) {
        showNotifTop('⚠️ Type/Class wajib dipilih!', true);
        return;
    }
    
    try {
        await db.collection('db_agent').doc(currentAgentIdForProduct).update({
            agent_id: agentId,
            nama: nama,
            agent_type: agentType,
            pemilik: pemilik,
            alamat: alamat,
            email: email,
            tlp: tlp,
            upline: upline,
            no_rekening: noRekening,
            atas_nama: atasNama,
            jenis_bank: jenisBank,
            no_ktp: noKtp,
            cid: cid,
            produk: currentAgentProducts || [],
            updated_at: new Date().toISOString()
        });
        
        showNotifTop('✅ Data agent berhasil disimpan!');
        closeModal('agentDetailModal');
        loadDatabaseAgent();
    } catch (error) {
        showNotifTop('❌ Gagal menyimpan: ' + error.message, true);
        console.error(error);
    }
}

let currentTarifData = [];

async function loadTarifAdminByCid(cid) {
    if (!cid) {
        currentTarifData = [];
        return;
    }
    const snapshot = await db.collection('tarif_admin').where('cid', '==', cid).get();
    currentTarifData = [];
    snapshot.forEach(doc => currentTarifData.push({ id: doc.id, ...doc.data() }));
}

function updateProductSelect() {
    const select = document.getElementById('productSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">Pilih Produk</option>';
    produkData.forEach(produk => {
        select.innerHTML += `<option value="${produk.id}" data-harga="${produk.harga_jual || 0}">${escapeHtml(produk.nama)} - ${formatRupiah(produk.harga_jual)}</option>`;
    });
}

function renderAgentProducts() {
    const container = document.getElementById('agentProductsContainer');
    if (!container) return;
    
    let searchInput = document.getElementById('searchProdukAgent');
    if (!searchInput) {
        const searchWrapper = document.createElement('div');
        searchWrapper.style.marginBottom = '12px';
        searchWrapper.innerHTML = '<input type="text" id="searchProdukAgent" placeholder="🔍 Cari produk..." style="width:100%; padding: 10px; border-radius: 10px; border: 1px solid #e5e7eb;">';
        container.parentNode.insertBefore(searchWrapper, container);
        searchInput = document.getElementById('searchProdukAgent');
        searchInput.addEventListener('input', () => renderAgentProducts());
    }
    
    const searchKeyword = searchInput.value.toLowerCase();
    let filteredProduk = produkData.filter(p => p.nama.toLowerCase().includes(searchKeyword));
    
    if (filteredProduk.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#9ca3af; padding:20px;">🔍 Tidak ada produk yang ditemukan</p>';
        return;
    }
    
    const cid = document.getElementById('agentDetailCid')?.value || '';
    const tarif = currentTarifData.find(t => t.cid === cid);
    const existingMap = new Map();
    if (currentAgentProducts) {
        currentAgentProducts.forEach(p => existingMap.set(p.produk_id, p));
    }
    
    let html = '<table style="width:100%; border-collapse: collapse;">';
    html += `
        <thead>
            <tr>
                <th style="text-align:left; padding:8px; border-bottom:1px solid #e5e7eb;">Produk</th>
                <th style="text-align:left; padding:8px; border-bottom:1px solid #e5e7eb;">Admin</th>
                <th style="text-align:left; padding:8px; border-bottom:1px solid #e5e7eb;">HPP</th>
                <th style="text-align:left; padding:8px; border-bottom:1px solid #e5e7eb;">Profit</th>
                <th style="text-align:left; padding:8px; border-bottom:1px solid #e5e7eb;">Fee Upline</th>
                <th style="text-align:left; padding:8px; border-bottom:1px solid #e5e7eb;">Fee Agent</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    for (const produk of filteredProduk) {
        const isAdminBased = produk.jenis_produk === 'beradmin';
        const existing = existingMap.get(produk.id);
        let adminValue = 0, profit = 0, feeUpline = 0, feeAgent = 0;
        
        if (isAdminBased) {
            if (produk.cid_based && cid) {
                if (produk.id === 'pln_pospaid') adminValue = tarif?.admin_pospaid || 0;
                else if (produk.id === 'pln_prepaid') adminValue = tarif?.admin_prepaid || 0;
                else if (produk.id === 'pln_nontaglis') adminValue = tarif?.admin_nontaglis || 0;
                else adminValue = existing?.admin || 0;
            } else {
                adminValue = existing?.admin || produk.admin_default || 0;
            }
            profit = existing?.profit || 0;
            feeUpline = existing?.fee_upline || 0;
            feeAgent = adminValue - profit - feeUpline;
        }
        
        html += `
            <tr data-produk-id="${produk.id}" style="border-bottom:1px solid #e5e7eb;">
                <td style="padding:8px;"><strong>${escapeHtml(produk.nama)}</strong><br><small style="color:#9ca3af;">${isAdminBased ? '🏷️ Berdasarkan Admin' : '💰 Tanpa Admin'}</small></td>
                <td style="padding:8px;">${isAdminBased ? `<span class="admin-value">${formatRupiah(adminValue)}</span>` : '-'}</td>
                <td style="padding:8px;"><span class="hpp-value">${formatRupiah(produk.hpp)}</span></td>
                <td style="padding:8px;">${isAdminBased ? `<input type="number" class="profit-input" data-id="${produk.id}" value="${profit}" step="100" style="width:100px; padding:6px; border-radius:8px; border:1px solid #e5e7eb;">` : '-'}</td>
                <td style="padding:8px;">${isAdminBased ? `<input type="number" class="fee-upline-input" data-id="${produk.id}" value="${feeUpline}" step="100" style="width:100px; padding:6px; border-radius:8px; border:1px solid #e5e7eb;">` : '-'}</td>
                <td style="padding:8px;">${isAdminBased ? `<span class="fee-agent-value" data-id="${produk.id}">${formatRupiah(feeAgent)}</span>` : '-'}</td>
            </tr>
        `;
    }
    
    html += '</tbody></table>';
    container.innerHTML = html;
    
    document.querySelectorAll('.profit-input').forEach(input => {
        input.removeEventListener('change', handleProfitChange);
        input.addEventListener('change', handleProfitChange);
    });
    document.querySelectorAll('.fee-upline-input').forEach(input => {
        input.removeEventListener('change', handleFeeUplineChange);
        input.addEventListener('change', handleFeeUplineChange);
    });
}

function handleProfitChange(e) {
    const produkId = e.target.dataset.id;
    const profit = parseInt(e.target.value) || 0;
    updateAgentProductField(produkId, 'profit', profit);
}

function handleFeeUplineChange(e) {
    const produkId = e.target.dataset.id;
    const feeUpline = parseInt(e.target.value) || 0;
    updateAgentProductField(produkId, 'fee_upline', feeUpline);
}

function updateAgentProductField(produkId, field, value) {
    if (!currentAgentProducts) currentAgentProducts = [];
    const index = currentAgentProducts.findIndex(p => p.produk_id === produkId);
    const produk = produkData.find(p => p.id === produkId);
    if (!produk) return;
    
    const adminSpan = document.querySelector(`tr[data-produk-id="${produkId}"] .admin-value`);
    let admin = 0;
    if (adminSpan) admin = parseInt(adminSpan.textContent.replace(/[^0-9]/g, '')) || 0;
    
    let profit = field === 'profit' ? value : (currentAgentProducts[index]?.profit || 0);
    let feeUpline = field === 'fee_upline' ? value : (currentAgentProducts[index]?.fee_upline || 0);
    const feeAgent = admin - profit - feeUpline;
    
    const productData = {
        produk_id: produkId,
        nama_produk: produk.nama,
        admin: admin,
        profit: profit,
        fee_upline: feeUpline,
        fee_agent: feeAgent,
        updated_at: new Date().toISOString()
    };
    
    if (index >= 0) {
        currentAgentProducts[index] = productData;
    } else {
        productData.added_at = new Date().toISOString();
        currentAgentProducts.push(productData);
    }
    
    const feeAgentSpan = document.querySelector(`tr[data-produk-id="${produkId}"] .fee-agent-value`);
    if (feeAgentSpan) feeAgentSpan.innerHTML = formatRupiah(feeAgent);
}

function setupAgentImport() {
    const importBtn = document.getElementById('importAgentExcelBtn');
    const fileInput = document.getElementById('agentExcelFile');
    if (!importBtn || !fileInput) return;
    
    importBtn.onclick = () => fileInput.click();
    fileInput.onchange = async (e) => {
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
                
                if (!json || json.length === 0) {
                    showNotifTop('File Excel kosong!', true);
                    return;
                }
                
                let success = 0, failed = 0;
                const duplicates = [];
                const errors = [];
                
                for (const row of json) {
                    try {
                        let agentId = row.agent_id || row.Agent_ID || row.id || row.ID || '';
                        if (!agentId) {
                            failed++;
                            errors.push(`Baris ke-${json.indexOf(row)+2}: ID Agent wajib diisi`);
                            continue;
                        }
                        
                        let nama = row.nama || row.Nama || row.name || row.Name || '';
                        let hp = row.hp || row.HP || row.phone || row.Phone || '';
                        let apk = row.apk || row.APK || row.aplikasi || row.Aplikasi || '';
                        let agentType = row.agent_type || row.Agent_Type || row.type || row.Type || row.class || row.Class || '';
                        let pemilik = row.pemilik || row.Pemilik || '';
                        let alamat = row.alamat || row.Alamat || '';
                        let email = row.email || row.Email || '';
                        let tlp = row.tlp || row.Tlp || row.Telepon || '';
                        let no_rekening = row.no_rekening || row.NoRekening || '';
                        let atas_nama = row.atas_nama || row.AtasNama || '';
                        let jenis_bank = row.jenis_bank || row.JenisBank || '';
                        let no_ktp = row.no_ktp || row.NoKtp || '';
                        let cid = row.cid || row.Cid || row.CID || '';
                        let upline = row.upline || row.Upline || row.atasan || row.Atasan || '';
                        let fee_upline = row.fee_upline || row.FeeUpline || row.fee || row.Fee || 0;
                        
                        if (!nama) nama = agentId;
                        
                        let cleanHp = '';
                        if (hp) {
                            cleanHp = hp.toString().trim();
                            cleanHp = cleanHp.replace(/[^\d+]/g, '');
                            if (!cleanHp.startsWith('+')) {
                                cleanHp = cleanHp.replace(/^0+/, '');
                                if (cleanHp.startsWith('62')) cleanHp = '+' + cleanHp;
                                else if (cleanHp.match(/^\d+$/)) cleanHp = '+62' + cleanHp;
                                else cleanHp = '+' + cleanHp.replace(/^\+/, '');
                            }
                        }
                        
                        const existing = await db.collection('db_agent').where('agent_id', '==', agentId.toString().toUpperCase()).get();
                        if (!existing.empty) {
                            duplicates.push(`ID Agent ${agentId} sudah terdaftar`);
                            failed++;
                            continue;
                        }
                        
                        await db.collection('db_agent').add({
                            agent_id: agentId.toString().toUpperCase(),
                            nama: nama.toString().trim(),
                            hp: cleanHp || '',
                            apk: apk.toString().trim() || '',
                            agent_type: agentType || '',
                            pemilik: pemilik || '',
                            alamat: alamat || '',
                            email: email || '',
                            tlp: tlp || '',
                            no_rekening: no_rekening || '',
                            atas_nama: atas_nama || '',
                            jenis_bank: jenis_bank || '',
                            no_ktp: no_ktp || '',
                            cid: cid || '',
                            upline: upline || '',
                            user_id: currentUser.uid,
                            fee_upline: parseInt(fee_upline) || 0,
                            created_at: new Date().toISOString()
                        });
                        success++;
                    } catch(err) {
                        failed++;
                        errors.push(`Baris ke-${json.indexOf(row)+2}: ${err.message}`);
                    }
                }
                
                let resultMsg = `✅ Import selesai! Berhasil: ${success}, Gagal: ${failed}`;
                if (duplicates.length > 0) resultMsg += `\n\n⏭ Duplikat: ${duplicates.length} data dilewati`;
                if (errors.length > 0 && errors.length <= 3) resultMsg += `\n\nError:\n${errors.join('\n')}`;
                alert(resultMsg);
                loadDatabaseAgent();
                fileInput.value = '';
            } catch(err) {
                showNotifTop('❌ Gagal import: ' + err.message, true);
            } finally {
                importBtn.textContent = '📥 Import Excel';
                importBtn.disabled = false;
            }
        };
        reader.readAsArrayBuffer(file);
    };
}

async function exportAgentToExcel() {
    if (agentsData.length === 0) {
        showNotifTop('Tidak ada data untuk diexport', true);
        return;
    }
    
    const exportData = agentsData.map(item => ({
        'ID Agent': item.agent_id,
        'Nama': item.nama.replace(/ \(.*\)/, ''),
        'Type/Class': item.agent_type,
        'Nomor WhatsApp': item.hp,
        'Tanggal Input': new Date(item.createdAt).toLocaleDateString('id-ID')
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Database Agent');
    XLSX.writeFile(wb, `database_agent_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotifTop('✅ Export data berhasil!');
}

async function downloadAgentExample() {
    try {
        showNotifTop('⏳ Memuat data produk...');
        const produkSnapshot = await db.collection('produk').get();
        const produkList = [];
        produkSnapshot.forEach(doc => produkList.push({ id: doc.id, nama: doc.data().nama }));
        
        if (produkList.length === 0) {
            showNotifTop('⚠️ Belum ada data produk. Silakan tambahkan produk terlebih dahulu!', true);
            return;
        }
        
        const baseData = {
            'agent_id': 'AG-001',
            'nama': 'Budi Santoso',
            'agent_type': 'CollectingAgent (CA)',
            'pemilik': 'PT. Contoh',
            'alamat': 'Jl. Raya No. 123, Jakarta',
            'email': 'budi@example.com',
            'hp': '6281234567890',
            'upline': 'KORWIL Jakarta',
            'no_rekening': '1234567890',
            'atas_nama': 'Budi Santoso',
            'jenis_bank': 'BCA',
            'no_ktp': '3172010101950001',
            'cid': '5213247',
            'apk': 'GNP'
        };
        
        const produkColumns = {};
        for (const produk of produkList) {
            let cleanNama = produk.nama.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
            produkColumns[`profit_${cleanNama}`] = 0;
            produkColumns[`fee_upline_${cleanNama}`] = 0;
            produkColumns[`fee_agent_${cleanNama}`] = 0;
        }
        
        const exampleData = [{ ...baseData, ...produkColumns }];
        const ws = XLSX.utils.json_to_sheet(exampleData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Database Agent');
        XLSX.writeFile(wb, `contoh_database_agent_${new Date().toISOString().split('T')[0]}.xlsx`);
        showNotifTop('📋 Contoh file Excel berhasil diunduh dengan daftar produk terbaru');
    } catch (error) {
        console.error('Error download contoh:', error);
        showNotifTop('❌ Gagal mengunduh contoh: ' + error.message, true);
    }
}

function setupAgentFilters() {
    const searchInput = document.getElementById('searchAgentInput');
    const filterUpline = document.getElementById('filterUplineAgent');
    const filterCid = document.getElementById('filterCidAgent');
    const filterBank = document.getElementById('filterBankAgent');
    const filterDate = document.getElementById('filterDateAgent');
    const filterHasHp = document.getElementById('filterHasHpAgent');
    const filterHasApk = document.getElementById('filterHasApkAgent');
    const resetBtn = document.getElementById('resetAgentFilterBtn');
    
    const applyFilters = () => renderAgentList(agentsData);
    
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (filterUpline) filterUpline.addEventListener('input', applyFilters);
    if (filterCid) filterCid.addEventListener('input', applyFilters);
    if (filterBank) filterBank.addEventListener('change', applyFilters);
    if (filterDate) filterDate.addEventListener('change', applyFilters);
    if (filterHasHp) filterHasHp.addEventListener('change', applyFilters);
    if (filterHasApk) filterHasApk.addEventListener('change', applyFilters);
    
    if (resetBtn) {
        resetBtn.onclick = () => {
            if (searchInput) searchInput.value = '';
            if (filterUpline) filterUpline.value = '';
            if (filterCid) filterCid.value = '';
            if (filterBank) filterBank.value = '';
            if (filterDate) filterDate.value = '';
            if (filterHasHp) filterHasHp.checked = false;
            if (filterHasApk) filterHasApk.checked = false;
            applyFilters();
        };
    }
}

// ========================================
// AGENT PRODUCT FUNCTIONS
// ========================================
window.openAddProductModal = function() {
    if (!currentAgentIdForProduct) {
        showNotifTop('⚠️ Pilih agent terlebih dahulu!', true);
        return;
    }
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
    
    if (!produkId || !price) {
        showNotifTop('⚠️ Pilih produk dan isi harga!', true);
        return;
    }
    
    const produk = produkData.find(p => p.id === produkId);
    if (!produk) return;
    if (!currentAgentProducts) currentAgentProducts = [];
    
    currentAgentProducts.push({
        produk_id: produkId,
        nama_produk: produk.nama,
        harga: price,
        qty: qty,
        added_at: new Date().toISOString()
    });
    
    renderAgentProducts();
    closeModal('productModal');
};

// ========================================
// REMINDER FUNCTIONS
// ========================================
async function loadReminders() {
    try {
        let query = db.collection('reminders');
        if (currentUserRole !== 'owner') query = query.where('user_id', '==', currentUser.uid);
        const snapshot = await query.get();
        const reminderList = document.getElementById('reminderList');
        if (!reminderList) return;
        if (snapshot.empty) {
            reminderList.innerHTML = '<p style="text-align:center;padding:40px;">⏰ Belum ada pengingat</p>';
            return;
        }
        const items = [];
        snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        reminderList.innerHTML = items.map(item => {
            let ownerInfo = '';
            if (currentUserRole === 'owner' && item.user_id !== currentUser.uid) {
                ownerInfo = `<small style="color:#4f46e5;">(Milik: ${escapeHtml(item.user_name || 'CS Lain')})</small>`;
            }
            return `<div class="db-item"><div class="db-item-info"><h4>📝 ${escapeHtml(item.title)}</h4><p>${escapeHtml(item.description || '-')}</p><small>⏰ ${item.datetime ? new Date(item.datetime).toLocaleString('id-ID') : '-'} ${ownerInfo}</small></div><div class="db-item-actions"><button class="db-item-delete" onclick="deleteReminder('${item.id}')">🗑️ Hapus</button></div></div>`;
        }).join('');
    } catch(e) {
        console.error('Error loadReminders:', e);
        document.getElementById('reminderList').innerHTML = '<p style="text-align:center;padding:40px;color:red;">❌ Gagal memuat pengingat</p>';
    }
}

window.deleteReminder = async function(id) {
    if (confirm('Hapus pengingat ini?')) {
        await db.collection('reminders').doc(id).delete();
        showNotif('Pengingat dihapus');
        loadReminders();
    }
};

// ========================================
// MESSAGE FUNCTIONS
// ========================================
async function loadUsersForSelect() {
    const snapshot = await db.collection('users').get();
    const select = document.getElementById('pesanTo');
    if (!select) return;
    select.innerHTML = '<option value="">Pilih CS Tujuan</option>';
    snapshot.forEach(doc => {
        const data = doc.data();
        if (doc.id !== currentUser.uid) {
            select.innerHTML += `<option value="${doc.id}">${escapeHtml(data.nama || data.email || 'CS Agent')}</option>`;
        }
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
        for (const doc of snapshot.docs) {
            const data = doc.data();
            let fromName = 'Unknown';
            try {
                const fromUser = await db.collection('users').doc(data.from_id).get();
                if (fromUser.exists) fromName = fromUser.data().nama || fromUser.data().email || 'CS Agent';
            } catch(e) { console.warn(e); }
            items.push({ id: doc.id, ...data, fromName });
        }
        items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        pesanList.innerHTML = items.map(item => `
            <div class="db-item ${!item.is_read ? 'unread' : ''}">
                <div class="db-item-info">
                    <h4>📨 Dari: ${escapeHtml(item.fromName)}</h4>
                    <p>${escapeHtml(item.message)}</p>
                    <small>📅 ${new Date(item.created_at).toLocaleString('id-ID')} | ${item.is_read ? '✅ Dibaca' : '🆕 Baru'}</small>
                </div>
                <div class="db-item-actions">
                    <button class="db-item-wa" onclick="markAsRead('${item.id}')">✅ Tandai Dibaca</button>
                    <button class="db-item-delete" onclick="deletePesan('${item.id}')">🗑️ Hapus</button>
                </div>
            </div>
        `).join('');
        updateAllBadges();
    } catch(e) {
        console.error(e);
        document.getElementById('pesanList').innerHTML = '<p style="text-align:center;padding:40px;color:red;">❌ Gagal memuat pesan</p>';
    }
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

// ========================================
// BROADCAST FUNCTIONS
// ========================================
let savedTemplates = [];

function loadTemplates() {
    const saved = localStorage.getItem('broadcast_templates');
    if (saved) savedTemplates = JSON.parse(saved);
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
        <div class="template-item">
            <div style="display:flex;justify-content:space-between;align-items:center">
                <strong style="font-size:13px;">📝 ${escapeHtml(template.name)}</strong>
                <div>
                    <button class="template-use-btn" data-idx="${idx}" style="background:#4f46e5;color:#fff;border:0;border-radius:6px;padding:4px 10px;font-size:11px;margin-right:5px;cursor:pointer">Gunakan</button>
                    <button class="template-delete-btn" data-idx="${idx}" style="background:#ef4444;color:#fff;border:0;border-radius:6px;padding:4px 10px;font-size:11px;cursor:pointer">Hapus</button>
                </div>
            </div>
            <div style="font-size:11px;color:#6b7280;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(template.message.substring(0,100))}${template.message.length > 100 ? '...' : ''}</div>
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
            if (confirm('Hapus template ini?')) deleteTemplate(idx);
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

let currentNumbers = [], currentBroadcastIndex = 0, broadcastNumbers = [], broadcastMessageTemplate = '', isBroadcasting = false, broadcastStatus = [];

function initBroadcast() {
    if (!document.querySelector('input[name="sourceType"]')) return;
    
    document.querySelectorAll('input[name="sourceType"]').forEach(radio => {
        radio.removeEventListener('change', handleSourceChange);
        radio.addEventListener('change', handleSourceChange);
    });
    
    function handleSourceChange(e) {
        const value = e.target.value;
        const filterCard = document.getElementById('filterStatusCard');
        const customCard = document.getElementById('customNumbersCard');
        const prospekFilter = document.getElementById('prospekFilter');
        const customerFilter = document.getElementById('customerFilter');
        
        if (filterCard) filterCard.style.display = value === 'custom' ? 'none' : 'block';
        if (customCard) customCard.style.display = value === 'custom' ? 'block' : 'none';
        if (prospekFilter) prospekFilter.style.display = value === 'prospek' ? 'flex' : 'none';
        if (customerFilter) customerFilter.style.display = value === 'customer' ? 'flex' : 'none';
        loadNumbers();
    }
    
    document.querySelectorAll('#customerFilter input, #prospekFilter input').forEach(cb => {
        cb.removeEventListener('change', loadNumbers);
        cb.addEventListener('change', loadNumbers);
    });
    document.getElementById('customNumbers')?.addEventListener('input', loadNumbers);
    document.getElementById('refreshNumbersBtn')?.addEventListener('click', loadNumbers);
    document.getElementById('sendBroadcastBtn')?.addEventListener('click', sendBroadcast);
    
    loadNumbers().catch(e => console.error('loadNumbers error:', e));
    initTemplateFeature();
}

async function loadNumbers() {
    try {
        const sourceType = document.querySelector('input[name="sourceType"]:checked')?.value || 'customer';
        let numbers = [];
        if (sourceType === 'custom') {
            const customText = document.getElementById('customNumbers')?.value || '';
            numbers = customText.split(/[\n,]+/).map(n => n.trim()).filter(n => n && /^62\d+$/.test(n));
        } else {
            let collection = 'customers', statusField = 'status', statusValues = [];
            if (sourceType === 'prospek') {
                collection = 'prospek';
                statusValues = Array.from(document.querySelectorAll('#prospekFilter input:checked')).map(cb => cb.value);
            } else if (sourceType === 'customer') {
                collection = 'customers';
                statusValues = Array.from(document.querySelectorAll('#customerFilter input:checked')).map(cb => cb.value);
            } else if (sourceType === 'closing') {
                collection = 'db_closing';
                statusField = null;
            } else if (sourceType === 'dbTidak') {
                collection = 'db_tidak_tertarik';
                statusField = null;
            }
            let query = db.collection(collection);
            if (currentUserRole !== 'owner') query = query.where('user_id', '==', currentUser.uid);
            if (statusValues && statusValues.length > 0 && statusField) {
                query = query.where(statusField, 'in', statusValues);
            }
            const snapshot = await query.get();
            snapshot.forEach(doc => {
                const data = doc.data();
                numbers.push({ hp: data.hp, nama: data.nama || data.name || 'Agent' });
            });
        }
        currentNumbers = numbers;
        const selectedCountSpan = document.getElementById('selectedCount');
        if (selectedCountSpan) selectedCountSpan.innerText = numbers.length;
        const listDiv = document.getElementById('selectedNumbersList');
        if (!listDiv) return;
        if (numbers.length === 0) {
            listDiv.innerHTML = '<p style="color:#9ca3af;">Tidak ada nomor yang dipilih</p>';
        } else if (typeof numbers[0] === 'string') {
            listDiv.innerHTML = numbers.map(n => `<div class="number-item">${escapeHtml(n)}</div>`).join('');
        } else {
            listDiv.innerHTML = numbers.map(n => `<div class="number-item">${escapeHtml(n.nama)} - ${escapeHtml(n.hp)}</div>`).join('');
        }
    } catch(e) {
        console.error('Error loadNumbers:', e);
        showNotifTop('❌ Gagal memuat nomor: ' + e.message, true);
    }
}

async function sendBroadcast() {
    const messageTemplate = document.getElementById('broadcastMessage')?.value;
    const sendOneByOne = document.getElementById('sendOneByOne')?.checked;
    
    if (!messageTemplate) {
        showNotif('Pesan tidak boleh kosong!', true);
        return;
    }
    if (currentNumbers.length === 0) {
        showNotif('Tidak ada nomor tujuan!', true);
        return;
    }
    if (!sendOneByOne) {
        for (const item of currentNumbers) {
            const hp = typeof item === 'string' ? item : item.hp;
            const nama = typeof item === 'string' ? '' : item.nama;
            const message = messageTemplate.replace(/{nama}/g, nama || 'Customer');
            const nomor = hp.toString().replace('+', '').replace(/^0/, '62');
            window.open('https://wa.me/' + nomor + '?text=' + encodeURIComponent(message), '_blank');
        }
        showNotif(`✅ Membuka ${currentNumbers.length} chat WhatsApp`);
        return;
    }
    if (isBroadcasting) {
        showNotif('⚠️ Broadcast sedang berjalan!', true);
        return;
    }
    
    broadcastNumbers = [...currentNumbers];
    broadcastMessageTemplate = messageTemplate;
    currentBroadcastIndex = 0;
    broadcastStatus = [];
    isBroadcasting = true;
    showBroadcastPanel();
    displayCurrentBroadcast();
}

function showBroadcastPanel() {
    let panelDiv = document.getElementById('broadcastPanel');
    if (!panelDiv) {
        const broadcastCard = document.querySelector('#broadcastPage .broadcast-card:last-child');
        if (broadcastCard) {
            panelDiv = document.createElement('div');
            panelDiv.id = 'broadcastPanel';
            panelDiv.className = 'broadcast-panel';
            panelDiv.innerHTML = `
                <div class="panel-header"><span>📢 Broadcast Manual</span><button id="closeBroadcastPanelBtn" class="close-panel-btn">✕</button></div>
                <div class="panel-content">
                    <div class="current-info"><div class="current-label">Sedang Diproses:</div><div class="current-name" id="currentName">-</div><div class="current-number" id="currentNumber">-</div></div>
                    <div class="message-preview" id="messagePreview"></div>
                    <div class="action-buttons">
                        <button id="markSentBtn" class="mark-sent-btn">✅ Tandai Terkirim & Lanjut</button>
                        <button id="markFailedBtn" class="mark-failed-btn">❌ Tandai Gagal Kirim & Lanjut</button>
                        <button id="stopBroadcastPanelBtn" class="stop-btn">⏹️ Hentikan Broadcast</button>
                    </div>
                    <div class="whatsapp-link-container"><a href="#" id="whatsappLink" target="_blank" class="whatsapp-link-btn">💬 Buka WhatsApp</a></div>
                </div>
                <div class="progress-panel">
                    <div class="progress-bar-container"><div class="progress-bar-fill" id="progressBarFillPanel"></div></div>
                    <div class="progress-text" id="progressTextPanel">0 / 0</div>
                    <div class="progress-list" id="progressListPanel"></div>
                </div>
            `;
            broadcastCard.parentNode.insertBefore(panelDiv, broadcastCard.nextSibling);
            
            document.getElementById('closeBroadcastPanelBtn')?.addEventListener('click', () => {
                document.getElementById('broadcastPanel').style.display = 'none';
                isBroadcasting = false;
            });
            document.getElementById('markSentBtn')?.addEventListener('click', () => {
                if (isBroadcasting) {
                    broadcastStatus[currentBroadcastIndex] = 'success';
                    currentBroadcastIndex++;
                    updateBroadcastPanel();
                    if (currentBroadcastIndex >= broadcastNumbers.length) finishBroadcast();
                    else displayCurrentBroadcast();
                }
            });
            document.getElementById('markFailedBtn')?.addEventListener('click', () => {
                if (isBroadcasting) {
                    broadcastStatus[currentBroadcastIndex] = 'failed';
                    currentBroadcastIndex++;
                    updateBroadcastPanel();
                    if (currentBroadcastIndex >= broadcastNumbers.length) finishBroadcast();
                    else displayCurrentBroadcast();
                }
            });
            document.getElementById('stopBroadcastPanelBtn')?.addEventListener('click', () => {
                if (confirm('⏹️ Hentikan broadcast?')) {
                    isBroadcasting = false;
                    document.getElementById('broadcastPanel').style.display = 'none';
                    showNotif('⏹️ Broadcast dihentikan');
                }
            });
        }
    } else {
        panelDiv.style.display = 'block';
    }
}

function displayCurrentBroadcast() {
    if (!isBroadcasting) return;
    if (currentBroadcastIndex >= broadcastNumbers.length) {
        finishBroadcast();
        return;
    }
    const item = broadcastNumbers[currentBroadcastIndex];
    const hp = typeof item === 'string' ? item : item.hp;
    const nama = typeof item === 'string' ? '' : item.nama;
    const message = broadcastMessageTemplate.replace(/{nama}/g, nama || 'Customer');
    const nomor = hp.toString().replace('+', '').replace(/^0/, '62');
    
    document.getElementById('currentName').innerHTML = escapeHtml(nama || '-');
    document.getElementById('currentNumber').innerHTML = escapeHtml(hp);
    document.getElementById('messagePreview').innerHTML = `<strong>Pesan:</strong><br>${escapeHtml(message)}`;
    document.getElementById('whatsappLink').href = 'https://wa.me/' + nomor + '?text=' + encodeURIComponent(message);
    updateBroadcastPanel();
}

function updateBroadcastPanel() {
    const total = broadcastNumbers.length;
    const processed = currentBroadcastIndex;
    const percent = total > 0 ? (processed / total) * 100 : 0;
    
    document.getElementById('progressBarFillPanel').style.width = `${percent}%`;
    document.getElementById('progressTextPanel').innerText = `${processed} / ${total} terproses`;
    
    const progressList = document.getElementById('progressListPanel');
    if (progressList && broadcastNumbers.length > 0) {
        let html = '';
        for (let i = 0; i < broadcastNumbers.length; i++) {
            const item = broadcastNumbers[i];
            const hp = typeof item === 'string' ? item : item.hp;
            const nama = typeof item === 'string' ? '' : item.nama;
            const displayName = nama ? `${nama} (${hp})` : hp;
            const isCurrent = i === currentBroadcastIndex;
            let status = broadcastStatus[i];
            let statusIcon = '⭕', statusClass = '';
            
            if (status === 'success') {
                statusIcon = '✅';
                statusClass = 'success';
            } else if (status === 'failed') {
                statusIcon = '❌';
                statusClass = 'failed';
            } else if (i < currentBroadcastIndex) {
                statusIcon = '✅';
                statusClass = 'success';
            }
            
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
    isBroadcasting = false;
    document.getElementById('broadcastPanel').style.display = 'none';
    broadcastStatus = [];
}

// ========================================
// CUSTOMER CRUD FUNCTIONS
// ========================================
// (Fungsi addCustomer, addProspek, detail, followup, pending, dll tetap sama)
// ========================================
// ... (Kode untuk customer CRUD, detail modal, followup confirmation, 
//      pending modal, prospek functions, closing functions, dll tetap seperti sebelumnya)
// ========================================

// ========================================
// DATABASE ARCHIVES FUNCTIONS
// ========================================
// (Fungsi loadDBClosing, loadDBTidak, loadDBNomorSalah, loadDBCommitment, 
//      attachCheckboxEvents, deleteDBItem, dll tetap sama)
// ========================================

// ========================================
// IMPORT EXCEL FUNCTIONS
// ========================================
// (Fungsi import dari Excel tetap sama)
// ========================================

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // SIDEBAR SETUP
    const sidebar = document.getElementById('sidebar');
    const hoverZone = document.getElementById('hoverZone');
    const toggleBtn = document.getElementById('toggleSidebarBtn');
    
    function updateState() { updateSidebarBodyClass(); }
    
    if (hoverZone) {
        hoverZone.addEventListener('mouseenter', function() {
            if (!isMobile() && sidebar) {
                clearTimeout(sidebarTimeout);
                sidebar.classList.add('active');
                updateState();
            }
        });
    }
    
    if (sidebar) {
        sidebar.addEventListener('mouseleave', function() {
            if (!isMobile()) {
                sidebarTimeout = setTimeout(() => {
                    sidebar.classList.remove('active');
                    updateState();
                }, 200);
            }
        });
        sidebar.addEventListener('mouseenter', () => clearTimeout(sidebarTimeout));
    }
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (sidebar) sidebar.classList.toggle('active');
            updateState();
        });
    }
    
    document.addEventListener('click', function(e) {
        if (isMobile() && sidebar && toggleBtn && !sidebar.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
            sidebar.classList.remove('active');
            updateState();
        }
    });
    
    window.addEventListener('resize', function() {
        if (sidebar) sidebar.classList.remove('active');
        updateState();
    });
    
    updateState();
    
    // REFRESH PRODUK BUTTON
    document.getElementById('refreshProdukBtn')?.addEventListener('click', () => {
        loadProduk();
        if (currentAgentIdForProduct) renderAgentProducts();
        showNotifTop('🔄 Daftar produk direfresh');
    });
    
    // SETUP CONVERT MODAL
    setupConvertModal();
    
    // MODAL CLICK OUTSIDE SETUP
    const allModalIds = [
        'detailModal', 'customerModal', 'prospekModal', 'prospekNegosiasiModal',
        'profileModal', 'previewPhotoModal', 'reminderModal', 'pesanModal',
        'convertModal', 'followupConfirmModal', 'pendingModal', 'addCsModal',
        'editDeadlineModal', 'infoModal', 'agentDetailModal', 'productModal',
        'produkMasterModal', 'tarifAdminModal', 'manageTargetModal',
        'inputTransaksiModal', 'transaksiListModal'
    ];
    
    allModalIds.forEach(id => setupModalClickOutside(id));
    
    // SETUP TARIF IMPORT/EXPORT
    setupTarifImport();
    
    // SELECT ALL AGENT
    const selectAllAgentBtn = document.getElementById('selectAllAgent');
    if (selectAllAgentBtn) {
        const newSelectAllBtn = selectAllAgentBtn.cloneNode(true);
        selectAllAgentBtn.parentNode.replaceChild(newSelectAllBtn, selectAllAgentBtn);
        
        newSelectAllBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (!agentsFilteredData || agentsFilteredData.length === 0) {
                showNotifTop('⚠️ Tidak ada data yang ditampilkan', true);
                return;
            }
            
            const allChecked = agentsFilteredData.every(item => selectedAgentIds.get(item.id) === true);
            agentsFilteredData.forEach(item => {
                if (allChecked) selectedAgentIds.delete(item.id);
                else selectedAgentIds.set(item.id, true);
            });
            renderAgentList(agentsData);
            updateSelectAllAgentButton();
        });
    }
    
    // TOGGLE PASSWORD
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
    
    // LOGIN BUTTON
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
    
    // LOGOUT BUTTON
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => auth.signOut());
    
    // EVENT LISTENER DATABASE AGENT
    const deleteSelectedAgentBtn = document.getElementById('deleteSelectedAgent');
    if (deleteSelectedAgentBtn) deleteSelectedAgentBtn.addEventListener('click', deleteSelectedAgent);
    
    const exportAgentExcelBtn = document.getElementById('exportAgentExcelBtn');
    if (exportAgentExcelBtn) exportAgentExcelBtn.addEventListener('click', exportAgentToExcel);
    
    setupAgentImport();
    setupAgentFilters();
    
    // TOMBOL DOWNLOAD CONTOH EXCEL
    const downloadExampleBtn = document.createElement('button');
    downloadExampleBtn.textContent = '📋 Download Contoh Excel';
    downloadExampleBtn.className = 'db-import-excel';
    downloadExampleBtn.style.marginLeft = '10px';
    downloadExampleBtn.style.background = '#f59e0b';
    downloadExampleBtn.onclick = () => downloadAgentExample();
    const actionsDiv = document.querySelector('#dbAgentPage .db-actions');
    if (actionsDiv) actionsDiv.appendChild(downloadExampleBtn);
    
    // PRODUK BUTTONS
    document.getElementById('addProdukBtn')?.addEventListener('click', () => {
        currentEditProdukId = null;
        document.getElementById('produkMasterNama').value = '';
        document.getElementById('produkMasterHpp').value = '';
        document.getElementById('produkMasterHargaJual').value = '';
        document.getElementById('produkMasterKeterangan').value = '';
        document.getElementById('produkMasterTitle').innerText = '🏷️ Tambah Produk';
        document.getElementById('produkMasterModal').style.display = 'flex';
    });
    
    document.getElementById('saveProdukMasterBtn')?.addEventListener('click', async () => {
        const nama = document.getElementById('produkMasterNama').value;
        const hpp = document.getElementById('produkMasterHpp').value;
        const keterangan = document.getElementById('produkMasterKeterangan').value;
        const jenisProduk = document.getElementById('produkMasterJenis').value;
        let hargaJual = 0, adminDefault = 0, cidBased = 'no';
        
        if (jenisProduk === 'tanpa_admin') {
            hargaJual = document.getElementById('produkMasterHargaJual').value;
        } else {
            adminDefault = document.getElementById('produkMasterAdminDefault').value;
            cidBased = document.getElementById('produkMasterCidBased').value;
        }
        
        await saveProduk(nama, hpp, hargaJual, keterangan, adminDefault, jenisProduk, cidBased, currentEditProdukId);
        closeModal('produkMasterModal');
    });
    
    document.getElementById('cancelProdukMasterBtn')?.addEventListener('click', () => {
        closeModal('produkMasterModal');
        currentEditProdukId = null;
        document.getElementById('produkMasterNama').value = '';
        document.getElementById('produkMasterHpp').value = '';
        document.getElementById('produkMasterKeterangan').value = '';
        document.getElementById('produkMasterJenis').value = 'tanpa_admin';
        document.getElementById('produkMasterHargaJual').value = '';
        document.getElementById('produkMasterAdminDefault').value = '';
        document.getElementById('produkMasterCidBased').value = 'no';
        toggleProdukJenisFields('tanpa_admin');
    });
    
    // AGENT DETAIL EVENT LISTENERS
    document.getElementById('addAgentProductBtn')?.addEventListener('click', openAddProductModal);
    document.getElementById('saveAgentDetailBtn')?.addEventListener('click', saveAgentDetail);
    document.getElementById('closeAgentDetailBtn')?.addEventListener('click', () => closeModal('agentDetailModal'));
    document.getElementById('saveProductBtn')?.addEventListener('click', saveAgentProduct);
    document.getElementById('cancelProductBtn')?.addEventListener('click', () => closeModal('productModal'));
    
    document.getElementById('productSelect')?.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const harga = selectedOption.getAttribute('data-harga');
        if (harga && document.getElementById('productPrice').value === '') {
            document.getElementById('productPrice').value = harga;
        }
    });
    
    document.getElementById('manageTarifAdminBtn')?.addEventListener('click', () => {
        loadTarifAdmin();
        document.getElementById('tarifAdminModal').style.display = 'flex';
    });
    
    document.getElementById('closeTarifAdminModal')?.addEventListener('click', () => {
        closeModal('tarifAdminModal');
    });
    
    // TARGET KPI EVENT LISTENERS
    document.getElementById('searchProdukInput')?.addEventListener('input', () => renderProdukList());
    document.getElementById('searchTarifInput')?.addEventListener('input', () => renderTarifAdminList());
    
    document.getElementById('saveTarifAdminBtn')?.addEventListener('click', async () => {
        const cid = document.getElementById('tarifCid').value;
        const pospaid = document.getElementById('tarifPospaid').value;
        const prepaid = document.getElementById('tarifPrepaid').value;
        const nontaglis = document.getElementById('tarifNontaglis').value;
        await saveTarifAdmin(cid, pospaid, prepaid, nontaglis, currentEditTarifId);
        clearTarifForm();
    });
    
    document.getElementById('clearTarifFormBtn')?.addEventListener('click', clearTarifForm);
    document.getElementById('produkMasterJenis')?.addEventListener('change', function() {
        toggleProdukJenisFields(this.value);
    });
    
    // TARGET BUTTONS
    const saveTargetBtn = document.getElementById('saveTargetBtn');
    if (saveTargetBtn) {
        const newSaveBtn = saveTargetBtn.cloneNode(true);
        saveTargetBtn.parentNode.replaceChild(newSaveBtn, saveTargetBtn);
        newSaveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await saveTargetData();
        });
    }
    
    const cancelTargetBtn = document.getElementById('cancelTargetBtn');
    if (cancelTargetBtn) {
        const newCancelBtn = cancelTargetBtn.cloneNode(true);
        cancelTargetBtn.parentNode.replaceChild(newCancelBtn, cancelTargetBtn);
        newCancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeModal('manageTargetModal');
        });
    }
    
    const addMonthlyTargetBtn = document.getElementById('addMonthlyTargetBtn');
    if (addMonthlyTargetBtn) {
        const newAddBtn = addMonthlyTargetBtn.cloneNode(true);
        addMonthlyTargetBtn.parentNode.replaceChild(newAddBtn, addMonthlyTargetBtn);
        newAddBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!targetData.monthlyTargets) targetData.monthlyTargets = [];
            const now = new Date();
            const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            targetData.monthlyTargets.push({
                month: defaultMonth,
                target_agent: 0,
                target_ca: 0,
                target_koor: 0
            });
            renderMonthlyTargetList();
        });
    }
    
    // CARD TRANSAKSI CLICK
    const targetTransaksiCard = document.getElementById('targetTransaksiCard');
    if (targetTransaksiCard) {
        const newCard = targetTransaksiCard.cloneNode(true);
        targetTransaksiCard.parentNode.replaceChild(newCard, targetTransaksiCard);
        newCard.style.cursor = 'pointer';
        newCard.addEventListener('click', function(e) {
            if (e.target.closest('.progress-bar')) return;
            showInputTransaksiModal();
        });
    }
    
    // MODAL INPUT TRANSAKSI
    const saveTransaksiBtn = document.getElementById('saveTransaksiBtn');
    if (saveTransaksiBtn) {
        const newSaveBtn = saveTransaksiBtn.cloneNode(true);
        saveTransaksiBtn.parentNode.replaceChild(newSaveBtn, saveTransaksiBtn);
        newSaveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const nominal = document.getElementById('transaksiNominal').value;
            const keterangan = document.getElementById('transaksiKeterangan').value;
            const tanggal = document.getElementById('transaksiTanggal').value;
            if (!nominal || parseInt(nominal) <= 0) {
                showNotifTop('⚠️ Masukkan jumlah transaksi yang valid!', true);
                return;
            }
            await saveTransaksiGlobal(nominal, keterangan, tanggal, currentTransaksiId);
            closeModal('inputTransaksiModal');
            document.getElementById('transaksiNominal').value = '';
            document.getElementById('transaksiKeterangan').value = '';
            document.getElementById('transaksiTanggal').value = new Date().toISOString().split('T')[0];
            currentTransaksiId = null;
        });
    }
    
    const cancelTransaksiBtn = document.getElementById('cancelTransaksiBtn');
    if (cancelTransaksiBtn) {
        const newCancelBtn = cancelTransaksiBtn.cloneNode(true);
        cancelTransaksiBtn.parentNode.replaceChild(newCancelBtn, cancelTransaksiBtn);
        newCancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeModal('inputTransaksiModal');
            currentTransaksiId = null;
        });
    }
    
    // TOMBOL RIWAYAT TRANSAKSI
    const addTransaksiHistoryBtn = () => {
        const targetHeader = document.querySelector('.target-header');
        if (targetHeader && !document.getElementById('viewTransaksiBtn')) {
            const viewBtn = document.createElement('button');
            viewBtn.id = 'viewTransaksiBtn';
            viewBtn.textContent = '📋 Riwayat Transaksi';
            viewBtn.className = 'add-btn';
            viewBtn.style.background = '#10b981';
            viewBtn.style.marginLeft = '10px';
            viewBtn.onclick = showTransaksiListModal;
            targetHeader.appendChild(viewBtn);
        }
    };
    
    if (currentUser) addTransaksiHistoryBtn();
    
    // TOMBOL TAMBAH CUSTOMER & PROSPEK
    document.getElementById('addCustomerBtn')?.addEventListener('click', () => {
        document.getElementById('customerDate').value = getTodayDate();
        document.getElementById('customerModal').style.display = 'flex';
    });
    
    document.getElementById('addProspekBtn')?.addEventListener('click', () => {
        document.getElementById('prospekDeadline').value = getTodayDate();
        document.getElementById('prospekModal').style.display = 'flex';
    });
    
    document.getElementById('addCustomerFullBtn')?.addEventListener('click', () => {
        document.getElementById('customerDate').value = getTodayDate();
        document.getElementById('customerModal').style.display = 'flex';
    });
    
    document.getElementById('addProspekFullBtn')?.addEventListener('click', () => {
        document.getElementById('prospekDeadline').value = getTodayDate();
        document.getElementById('prospekModal').style.display = 'flex';
    });
    
    // TOMBOL PENGINGAT
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
            title, description: description || '', datetime: datetime || null,
            user_id: currentUser.uid, created_at: new Date().toISOString()
        });
        closeModal('reminderModal');
        document.getElementById('reminderTitle').value = '';
        document.getElementById('reminderDesc').value = '';
        document.getElementById('reminderDateTime').value = '';
        showNotif('✅ Pengingat ditambahkan');
        loadReminders();
    });
    
    // TOMBOL PESAN
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
            from_id: currentUser.uid, to_id: toId, message,
            is_read: false, created_at: new Date().toISOString()
        });
        closeModal('pesanModal');
        document.getElementById('pesanTo').value = '';
        document.getElementById('pesanMessage').value = '';
        showNotif('✅ Pesan terkirim');
        updateAllBadges();
    });
    
    // TOMBOL INFO
    document.getElementById('infoBtn')?.addEventListener('click', () => {
        document.getElementById('infoModal').style.display = 'flex';
    });
    
    document.getElementById('infoModalClose')?.addEventListener('click', () => {
        closeModal('infoModal');
    });
    
    // TOMBOL PROFILE
    const profileImgElement = document.getElementById('profileImg');
    if (profileImgElement) {
        const newProfileImg = profileImgElement.cloneNode(true);
        profileImgElement.parentNode.replaceChild(newProfileImg, profileImgElement);
        newProfileImg.addEventListener('click', () => {
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
    
    // PREVIEW FOTO
    const previewFotoElement = document.getElementById('previewFoto');
    if (previewFotoElement) {
        const newPreviewFoto = previewFotoElement.cloneNode(true);
        previewFotoElement.parentNode.replaceChild(newPreviewFoto, previewFotoElement);
        newPreviewFoto.addEventListener('click', (e) => {
            e.stopPropagation();
            showPhotoPreview(document.getElementById('previewFoto').src);
        });
    }
    
    // CAMERA ICON BUTTON
    const cameraIconBtnElement = document.getElementById('cameraIconBtn');
    if (cameraIconBtnElement) {
        const newCameraBtn = cameraIconBtnElement.cloneNode(true);
        cameraIconBtnElement.parentNode.replaceChild(newCameraBtn, cameraIconBtnElement);
        newCameraBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.getElementById('profileFoto').click();
        });
    }
    
    // PROFILE FOTO INPUT
    const profileFotoInputElement = document.getElementById('profileFoto');
    if (profileFotoInputElement) {
        const newProfileFotoInput = profileFotoInputElement.cloneNode(true);
        profileFotoInputElement.parentNode.replaceChild(newProfileFotoInput, profileFotoInputElement);
        newProfileFotoInput.addEventListener('change', function(e) {
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
    
    // SAVE PROFILE BUTTON
    const saveProfileBtnElement = document.getElementById('saveProfileBtn');
    if (saveProfileBtnElement) {
        const newSaveProfileBtn = saveProfileBtnElement.cloneNode(true);
        saveProfileBtnElement.parentNode.replaceChild(newSaveProfileBtn, saveProfileBtnElement);
        newSaveProfileBtn.addEventListener('click', async () => {
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
                    nama, hp, foto, email: currentUser.email,
                    role: currentUserRole, updated_at: new Date().toISOString()
                }, { merge: true });
                document.getElementById('topUserName').innerText = nama;
                document.getElementById('profileImg').src = foto;
                closeModal('profileModal');
                showNotif('Profile tersimpan');
            } catch(e) {
                showNotif('Gagal: ' + e.message, true);
            }
        });
    }
    
    // PREVIEW PHOTO MODAL CLICK
    document.getElementById('previewPhotoModal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('previewPhotoModal')) closeModal('previewPhotoModal');
    });
    
    // FORMAT INPUT
    formatPhoneInput(document.getElementById('customerPhone'));
    formatPhoneInput(document.getElementById('prospekPhone'));
    formatPhoneInput(document.getElementById('profilePhone'));
    
    // DELETE BUTTONS
    document.getElementById('selectAllClosing')?.addEventListener('click', () => {});
    document.getElementById('deleteSelectedClosing')?.addEventListener('click', deleteSelectedClosing);
    document.getElementById('selectAllTidak')?.addEventListener('click', () => {});
    document.getElementById('deleteSelectedTidak')?.addEventListener('click', deleteSelectedTidak);
    document.getElementById('selectAllNomorSalah')?.addEventListener('click', () => {});
    document.getElementById('deleteSelectedNomorSalah')?.addEventListener('click', deleteSelectedNomorSalah);
    document.getElementById('selectAllCommitment')?.addEventListener('click', () => {});
    document.getElementById('deleteSelectedCommitment')?.addEventListener('click', deleteSelectedCommitment);
    
    // EXPORT PRODUK
    document.getElementById('exportProdukExcelBtn')?.addEventListener('click', exportProdukToExcel);
    setupProdukImport();
    
    // TOMBOL DOWNLOAD CONTOH PRODUK
    const downloadProdukExampleBtnElement = document.createElement('button');
    downloadProdukExampleBtnElement.textContent = '📋 Download Contoh Excel';
    downloadProdukExampleBtnElement.className = 'db-import-excel';
    downloadProdukExampleBtnElement.style.marginLeft = '10px';
    downloadProdukExampleBtnElement.style.background = '#f59e0b';
    downloadProdukExampleBtnElement.onclick = downloadProdukExample;
    const produkActionsDivElement = document.querySelector('#produkPage .db-actions');
    if (produkActionsDivElement) produkActionsDivElement.appendChild(downloadProdukExampleBtnElement);
    
    // IMPORT EXCEL - DROPZONE
    const dropZoneElement = document.getElementById('dropZone');
    const excelFileInputElement = document.getElementById('excelFile');
    if (dropZoneElement) dropZoneElement.addEventListener('click', () => excelFileInputElement?.click());
    if (excelFileInputElement) {
        excelFileInputElement.addEventListener('change', function(e) {
            if (e.target.files[0]) document.getElementById('fileInfo').innerHTML = '📄 ' + e.target.files[0].name;
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
        const file = excelFileInputElement?.files[0];
        if (!file) {
            showNotif('Pilih file dulu!', true);
            return;
        }
        const importBtnElement = document.getElementById('importBtn');
        const originalText = importBtnElement.textContent;
        importBtnElement.textContent = '⏳ Memproses...';
        importBtnElement.disabled = true;
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
                    importBtnElement.textContent = originalText;
                    importBtnElement.disabled = false;
                    return;
                }
                
                let success = 0, failed = 0;
                const errors = [];
                const duplicates = [];
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
                    if (!columnMap.agentId || !columnMap.nama || !columnMap.hp || !columnMap.apk) {
                        showNotif('❌ Format Excel tidak sesuai! Gunakan kolom: agent_id, nama, hp, apk, deadline (opsional)', true);
                        importBtnElement.textContent = originalText;
                        importBtnElement.disabled = false;
                        return;
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
                    if (!columnMap.nama || !columnMap.hp) {
                        showNotif('❌ Format Excel tidak sesuai! Gunakan kolom: nama, hp, deadline (opsional)', true);
                        importBtnElement.textContent = originalText;
                        importBtnElement.disabled = false;
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
                        if (importType === 'customer' && (!agentId || !apk)) {
                            failed++;
                            errors.push(`Baris ke-${json.indexOf(row)+2}: ID Agent atau Aplikasi kosong`);
                            continue;
                        }
                        
                        let cleanHp = hp.toString().trim();
                        cleanHp = cleanHp.replace(/[^\d+]/g, '');
                        if (!cleanHp.startsWith('+')) {
                            cleanHp = cleanHp.replace(/^0+/, '');
                            if (cleanHp.startsWith('62')) cleanHp = '+' + cleanHp;
                            else if (cleanHp.match(/^\d+$/)) cleanHp = '+62' + cleanHp;
                            else cleanHp = '+' + cleanHp.replace(/^\+/, '');
                        }
                        
                        let isDuplicate = false;
                        if (importType === 'customer') {
                            const { duplicateAgent, duplicateHp } = await checkDuplicateCustomer(agentId, cleanHp);
                            if (duplicateAgent) {
                                duplicates.push(`ID Agent ${agentId} sudah terdaftar oleh ${duplicateAgent.owner}`);
                                isDuplicate = true;
                            }
                            if (duplicateHp) {
                                duplicates.push(`Nomor ${cleanHp} sudah terdaftar oleh ${duplicateHp.owner}`);
                                isDuplicate = true;
                            }
                        } else {
                            const duplicateHp = await checkDuplicateProspek(cleanHp);
                            if (duplicateHp) {
                                duplicates.push(`Nomor ${cleanHp} sudah terdaftar sebagai prospek oleh ${duplicateHp.owner}`);
                                isDuplicate = true;
                            }
                        }
                        
                        if (isDuplicate) {
                            failed++;
                            continue;
                        }
                        
                        let formattedDeadline = deadline ? new Date(deadline).toISOString().split('T')[0] : getTodayDate();
                        if (deadline && isNaN(new Date(deadline).getTime())) formattedDeadline = getTodayDate();
                        
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
                if (duplicates.length > 0) resultMsg += `\n\n⏭ Data duplikat dilewati:\n${duplicates.slice(0, 5).join('\n')}${duplicates.length > 5 ? `\n... dan ${duplicates.length - 5} lainnya` : ''}`;
                if (errors.length > 0 && errors.length <= 5) resultMsg += `\n\nDetail error:\n${errors.join('\n')}`;
                else if (errors.length > 5) resultMsg += `\n\n${errors.length} error terjadi. Periksa format data Anda.`;
                alert(resultMsg);
                excelFileInputElement.value = '';
                document.getElementById('fileInfo').innerHTML = '';
                updateAllBadges();
                loadAllData();
            } catch(error) {
                console.error('Import error:', error);
                showNotif('❌ Gagal memproses file: ' + error.message, true);
            } finally {
                importBtnElement.textContent = originalText;
                importBtnElement.disabled = false;
            }
        };
        reader.onerror = function() {
            showNotif('❌ Gagal membaca file', true);
            importBtnElement.textContent = originalText;
            importBtnElement.disabled = false;
        };
        reader.readAsArrayBuffer(file);
    });
    
    document.getElementById('downloadCustomerExample')?.addEventListener('click', () => {
        const data = [{ agent_id: 'AG-001', nama: 'Budi Santoso', hp: '6281234567890', apk: 'GNP', deadline: getTodayDate() }];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Customer');
        XLSX.writeFile(wb, 'contoh_customer.xlsx');
    });
    
    document.getElementById('downloadProspekExample')?.addEventListener('click', () => {
        const data = [{ nama: 'Rina Marlina', hp: '6281234567893', deadline: getTodayDate() }];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Prospek');
        XLSX.writeFile(wb, 'contoh_prospek.xlsx');
    });
});

// ========================================
// FORMAT PHONE INPUT HELPER
// ========================================
function formatPhoneInput(input) {
    if (input) {
        input.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.startsWith('0')) value = value.substring(1);
            this.value = value;
        });
    }
}
