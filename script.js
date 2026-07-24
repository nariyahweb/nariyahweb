// ========== SUPABASE CONFIG ==========
const SUPABASE_URL = 'https://haylblhjzfavrfiyaicq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhheWxibGhqemZhdnJmaXlhaWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzgyMDIsImV4cCI6MjA5NTMxNDIwMn0.j4yQa1ZttP5_Zg0ye5lK2OLecq39QhG3tPyv5PZ3r78';

// ========== LOGO CONFIGURATION ==========
const LOGO_CONFIG = {
    icon: 'https://haylblhjzfavrfiyaicq.supabase.co/storage/v1/object/public/logo/prospekta.png',
    text: 'https://haylblhjzfavrfiyaicq.supabase.co/storage/v1/object/public/logo/prospekta_logo.png',
};

const DEBUG = false;

// ========== FLAG UNTUK CEK SETUP TOMBOL ==========
let _buttonsSetupDone = false;

// ===== INISIALISASI SUPABASE CLIENT =====
const _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: {
        domain: '.github.io',  // Domain utama
        secure: true,
        sameSite: 'lax'
    }
});

// ===== EXPOSE KE GLOBAL =====
window.db = _supabaseClient;

// ===== CONSOLE LOG UNTUK VERIFIKASI =====
console.log('✅ Supabase client initialized');

// ========== GLOBAL VARIABLES ==========
let isTargetDataLoading = false;
let isDataLoaded = false;
let isRiwayatLoaded = false;
let _dashboardInitialized = false;
let currentUser = null;
let currentUserRole = 'cs';
let currentUserName = '';
let customersData = [];
let prospekData = [];
let agentsData = [];
let agentsFilteredData = [];
let produkData = [];
let transaksiData = [];
let tarifAdminData = [];
let remindersData = [];
let messagesData = [];
let transaksiGlobalList = [];
let targetData = {
    agent: 0,
    upline: 0,
    transaksi: 0,
    selisih: 0,
    monthlyTargets: []
};

let isAppInitialized = false;
let isLoadingData = false;

// Selected items maps
let selectedAgentIds = new Map();
let selectedProdukIds = new Map();
let selectedClosingIds = new Map();
let selectedTidakIds = new Map();
let selectedNomorSalahIds = new Map();
let selectedCommitmentIds = new Map();
let selectedTransaksiIds = new Map();
let selectedFullFollowupIds = new Map();
let selectedFullProspekIds = new Map();

// Charts
let chartCustomer = null;
let chartProspek = null;
let targetChart = null;
let trendChart = null;

// Broadcast variables
let savedTemplates = [];
let broadcastNumbers = [];
let broadcastMessageTemplate = '';
let currentBroadcastIndex = 0;
let broadcastStatus = [];

// Broadcast Upline variables
let currentUplineIndex = 0;
let uplineNumbers = [];
let uplineMessageTemplate = '';
let uplineBroadcastStatus = [];

// Current edit variables
let currentEditItem = null;
let currentEditType = null;
let currentPendingId = null;
let currentProspekId = null;
let currentEditTarifId = null;
let currentEditProdukId = null;
let currentAgentIdForProduct = null;
let currentAgentProducts = [];
let currentTransaksiId = null;

// Progress
let activeProgress = null;
let sidebarTimeout = null;
let pendingItems = [];

// ========== DEADLINE & NOTIFICATION VARIABLES ==========
let deadlineModalOpen = false;
let pesanModalOpen = false;

// ================================================================
// ========== FUNGSI PEMBUAT MODAL GAYA BARU ==========
// ================================================================

/**
 * Membuat modal dengan gaya baru (seperti DB Transaksi)
 * @param {string} title - Judul modal
 * @param {string} subtitle - Subtitle modal
 * @param {string} bodyHTML - Konten HTML untuk body modal
 * @param {string} footerHTML - Konten HTML untuk footer (opsional)
 * @param {string} modalId - ID untuk modal (opsional)
 * @param {Function} onClose - Callback saat modal ditutup (opsional)
 * @returns {HTMLElement} - Elemen modal yang dibuat
 */
function createModalNew(title, subtitle, bodyHTML, footerHTML = '', modalId = 'detailModalNew', onClose = null) {
    // Hapus modal lama dengan ID yang sama
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
        existingModal.remove();
    }
    
    // Buat elemen modal
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0, 0, 0, 0.7) !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        z-index: 999999999 !important;
        backdrop-filter: blur(5px) !important;
        pointer-events: auto !important;
    `;
    
    // Buat HTML modal
    modal.innerHTML = `
        <div class="modal-content-new">
            <!-- HEADER -->
            <div class="modal-header">
                <div>
                    <h3>${title}</h3>
                    ${subtitle ? `<div class="modal-subtitle">${subtitle}</div>` : ''}
                </div>
                <button class="modal-close" onclick="closeModalNew('${modalId}')">✕</button>
            </div>
            
            <!-- BODY -->
            <div class="modal-body">
                ${bodyHTML}
            </div>
            
            <!-- FOOTER -->
            ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
        </div>
    `;
    
    // Tambahkan ke body
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'auto';
    
    // Klik di luar modal untuk menutup
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModalNew(modalId);
            if (onClose) onClose();
        }
    });
    
    // Apply dark mode
    applyDarkModeToModal(modal);
    
    return modal;
}

/**
 * Menutup modal gaya baru
 * @param {string} modalId - ID modal yang akan ditutup
 */
function closeModalNew(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
}

/**
 * Membuat tombol footer untuk modal
 * @param {Array} buttons - Array tombol [{ label, class, onClick, icon }]
 * @returns {string} - HTML string untuk footer
 */
function createModalFooter(buttons) {
    return buttons.map(btn => {
        const iconHtml = btn.icon ? `<span>${btn.icon}</span> ` : '';
        return `<button class="btn ${btn.class}" onclick="${btn.onClick}">${iconHtml}${btn.label}</button>`;
    }).join('');
}

// ========== HELPER FUNCTIONS ==========
function showNotif(msg, isError = false) {
    const notif = document.createElement('div');
    notif.textContent = msg;
    notif.className = `notif-toast ${isError ? 'notif-error' : ''}`;
    document.getElementById('notifBox').appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

// ========== FORMAT NOMOR HP UNTUK WHATSAPP ==========
function formatPhoneNumber(hp) {
    if (!hp) return '';
    
    // Hapus semua karakter non-digit
    let clean = String(hp).replace(/[^\d+]/g, '');
    
    // Jika sudah ada +, biarkan
    if (clean.startsWith('+')) {
        return clean;
    }
    
    // Hapus leading 0
    clean = clean.replace(/^0+/, '');
    
    // Jika sudah dimulai dengan 62, tambahkan +
    if (clean.startsWith('62')) {
        return '+' + clean;
    }
    
    // Jika dimulai dengan 8 (nomor lokal)
    if (clean.startsWith('8')) {
        return '+62' + clean;
    }
    
    // Fallback: tambahkan +62
    return '+62' + clean;
}

// ========== VALIDASI NOMOR HP ==========
function isValidPhoneNumber(hp) {
    if (!hp) return false;
    const clean = String(hp).replace(/[^\d+]/g, '');
    // Minimal 10 digit setelah +62
    const numberOnly = clean.replace('+', '');
    if (numberOnly.startsWith('62')) {
        return numberOnly.length >= 12 && numberOnly.length <= 15;
    }
    return numberOnly.length >= 10 && numberOnly.length <= 15;
}

// ========== LOADING SCREEN FUNCTIONS ==========
let loadingSteps = [
    'Menyiapkan sistem...',
    'Memeriksa koneksi...',
    'Memuat data user...',
    'Memuat data followup...',
    'Memuat data prospek...',
    'Memuat database agent...',
    'Memuat data produk...',
    'Memuat data transaksi...',
    'Memuat database closing...',
    'Memuat database tidak tertarik...',
    'Memuat database nomor salah...',
    'Memuat database commitment...',
    'Memuat pengingat...',
    'Memuat pesan...',
    'Memuat target KPI...',
    'Menyelesaikan...'
];

let currentLoadingStep = 0;
let loadingInterval = null;

function showLoading(message = 'Memuat aplikasi...', showProgress = true) {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const progressBar = document.getElementById('loadingProgressBar');
    const stepText = document.getElementById('loadingStepText');
    
    if (overlay) {
        overlay.classList.remove('hide');
        overlay.style.display = 'flex';
    }
    
    if (loadingText) loadingText.textContent = message;
    if (progressBar && showProgress) progressBar.style.width = '0%';
    if (stepText) stepText.textContent = loadingSteps[0] || 'Memuat data...';
    
    currentLoadingStep = 0;
    
    // Animasi progress bar
    if (showProgress && progressBar) {
        let progress = 0;
        if (loadingInterval) clearInterval(loadingInterval);
        loadingInterval = setInterval(() => {
            if (progress < 90) {
                progress += Math.random() * 10;
                if (progress > 90) progress = 90;
                progressBar.style.width = progress + '%';
            }
        }, 500);
    }
}

function updateLoadingStep(step) {
    const stepText = document.getElementById('loadingStepText');
    const progressBar = document.getElementById('loadingProgressBar');
    
    if (stepText) {
        if (step < loadingSteps.length) {
            stepText.textContent = loadingSteps[step];
        } else {
            stepText.textContent = 'Memuat data...';
        }
    }
    
    // Update progress berdasarkan step
    if (progressBar) {
        const percent = Math.min(90, Math.floor((step / loadingSteps.length) * 90));
        progressBar.style.width = percent + '%';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    const progressBar = document.getElementById('loadingProgressBar');
    
    if (progressBar) progressBar.style.width = '100%';
    
    if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
    }
    
    if (overlay) {
        // Jangan langsung hide, beri waktu untuk animasi
        setTimeout(() => {
            overlay.classList.add('hide');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 500);
        }, 300);
    }
}

async function withLoading(promise, stepName) {
    updateLoadingStep(currentLoadingStep);
    currentLoadingStep++;
    return await promise;
}

// Tambahkan fungsi ini untuk loading data di halaman tertentu
function showPageLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.classList.add('data-loading');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-overlay-small';
        loadingDiv.innerHTML = '<div class="loading-spinner-small"></div><p>Memuat data...</p>';
        loadingDiv.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; flex-direction: column; z-index: 100;';
        container.style.position = 'relative';
        container.appendChild(loadingDiv);
    }
}

function hidePageLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.classList.remove('data-loading');
        const loadingDiv = container.querySelector('.loading-overlay-small');
        if (loadingDiv) loadingDiv.remove();
    }
}

function showNotifTop(msg, isError = false) {
    // Hapus notif lama jika ada
    const oldNotifs = document.querySelectorAll('.notif-toast');
    oldNotifs.forEach(notif => notif.remove());
    
    const notif = document.createElement('div');
    notif.textContent = msg;
    notif.className = `notif-toast ${isError ? 'notif-error' : ''}`;
    notif.style.cssText = 'z-index: 9999999999 !important; position: fixed; top: 20px; right: 20px; max-width: 350px; background: ' + (isError ? '#ef4444' : '#4f46e5') + '; color: white; padding: 12px 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); font-size: 14px;';
    document.getElementById('notifBox').appendChild(notif);
    
    // Auto remove setelah 3 detik
    setTimeout(() => {
        if (notif && notif.remove) notif.remove();
    }, 3000);
}

// ========== SECTION LOADING FUNCTIONS ==========

/**
 * Menampilkan loading overlay pada section tertentu
 * @param {string} containerId - ID container
 * @param {string} message - Pesan loading
 * @param {string} detail - Detail tambahan (opsional)
 */
function showSectionLoading(containerId, message = 'Memuat data...', detail = '') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Hapus loading yang sudah ada
    hideSectionLoading(containerId);
    
    // Tambahkan class loading
    container.classList.add('section-loading');
    
    // Buat overlay
    const overlay = document.createElement('div');
    overlay.className = 'section-loading-overlay';
    overlay.id = `loading_${containerId}`;
    overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 20;
        background: rgba(255, 255, 255, 0.85);
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        min-height: 200px;
    `;
    
    overlay.innerHTML = `
        <div class="loading-spinner-section"></div>
        <div class="loading-text-section">${message}</div>
        ${detail ? `<div class="loading-detail-section">${detail}</div>` : ''}
        <div class="loading-progress-section">
            <div class="progress-fill-section" id="progress_${containerId}"></div>
        </div>
    `;
    
    // Pastikan container memiliki position: relative
    if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
    }
    
    container.appendChild(overlay);
    
    // Animasi progress bar
    let progress = 0;
    const progressBar = document.getElementById(`progress_${containerId}`);
    if (progressBar) {
        const interval = setInterval(() => {
            if (progress < 90) {
                progress += Math.random() * 8 + 2;
                if (progress > 90) progress = 90;
                progressBar.style.width = progress + '%';
            }
        }, 300);
        
        // Simpan interval untuk dihentikan nanti
        overlay.dataset.progressInterval = interval;
    }
    
    return overlay;
}

/**
 * Menyembunyikan loading overlay pada section
 * @param {string} containerId - ID container
 * @param {boolean} showComplete - Tampilkan animasi selesai
 */
function hideSectionLoading(containerId, showComplete = true) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Hapus class loading
    container.classList.remove('section-loading');
    
    // Cari overlay
    const overlay = document.getElementById(`loading_${containerId}`);
    if (overlay) {
        // Hentikan interval progress
        if (overlay.dataset.progressInterval) {
            clearInterval(parseInt(overlay.dataset.progressInterval));
        }
        
        if (showComplete) {
            // Animasi selesai
            const progressBar = document.getElementById(`progress_${containerId}`);
            if (progressBar) {
                progressBar.style.width = '100%';
                progressBar.style.background = 'linear-gradient(90deg, #10b981, #059669)';
            }
            setTimeout(() => {
                overlay.remove();
            }, 400);
        } else {
            overlay.remove();
        }
    }
}

/**
 * Update progress loading
 * @param {string} containerId - ID container
 * @param {number} percent - Persentase progress (0-100)
 * @param {string} message - Pesan baru
 * @param {string} detail - Detail baru
 */
function updateSectionLoading(containerId, percent, message, detail = '') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const overlay = document.getElementById(`loading_${containerId}`);
    if (!overlay) return;
    
    const progressBar = document.getElementById(`progress_${containerId}`);
    if (progressBar) {
        progressBar.style.width = Math.min(percent, 100) + '%';
    }
    
    const textEl = overlay.querySelector('.loading-text-section');
    if (textEl && message) {
        textEl.textContent = message;
    }
    
    const detailEl = overlay.querySelector('.loading-detail-section');
    if (detailEl) {
        if (detail) {
            detailEl.textContent = detail;
            detailEl.style.display = 'block';
        } else {
            detailEl.style.display = 'none';
        }
    }
}

// ========== PAGE LOADING FUNCTIONS (SAMA SEPERTI LOADING PERTAMA) ==========

let pageLoadingInterval = null;
let pageLoadingStep = 0;
const pageLoadingStepsList = [
    'Menyiapkan halaman...',
    'Menghubungkan ke server...',
    'Memuat data...',
    'Memproses data...',
    'Menyusun tampilan...',
    'Menyelesaikan...'
];

/**
 * Menampilkan loading halaman seperti loading pertama
 * @param {string} message - Pesan utama
 * @param {string} stepText - Teks step
 */
function showPageLoading(message = 'Memuat halaman...', stepText = 'Menyiapkan data...') {
    const overlay = document.getElementById('pageLoadingOverlay');
    if (!overlay) return;
    
    const textEl = document.getElementById('pageLoadingText');
    const stepEl = document.getElementById('pageLoadingStepText');
    const progressBar = document.getElementById('pageLoadingProgressBar');
    
    if (textEl) textEl.textContent = message;
    if (stepEl) stepEl.textContent = stepText;
    if (progressBar) progressBar.style.width = '0%';
    
    pageLoadingStep = 0;
    
    if (pageLoadingInterval) {
        clearInterval(pageLoadingInterval);
        pageLoadingInterval = null;
    }
    
    // ===== TAMPILKAN OVERLAY =====
    // Gunakan display: flex langsung, bukan class
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';
    overlay.style.pointerEvents = 'auto';
    document.body.style.overflow = 'hidden';
    
    // ===== FORCE LAYOUT / REFFLOW (3x untuk memastikan) =====
    void overlay.offsetHeight;
    void overlay.offsetWidth;
    void overlay.offsetHeight;
    
    // ===== TAMBAHKAN CLASS =====
    overlay.classList.add('active');
    
    // Mulai progress bar
    let progress = 0;
    pageLoadingInterval = setInterval(() => {
        if (progress < 90) {
            progress += Math.random() * 6 + 2;
            if (progress > 90) progress = 90;
            if (progressBar) progressBar.style.width = progress + '%';
        }
    }, 400);
}

/**
 * Update progress loading halaman
 * @param {string} stepText - Teks step baru
 * @param {number} progress - Persentase progress (0-100)
 * @param {string} message - Pesan utama baru (opsional)
 */
function updatePageLoading(stepText, progress = null, message = null) {
    const stepEl = document.getElementById('pageLoadingStepText');
    const textEl = document.getElementById('pageLoadingText');
    const progressBar = document.getElementById('pageLoadingProgressBar');
    
    if (stepEl && stepText) {
        stepEl.textContent = stepText;
    }
    
    if (textEl && message) {
        textEl.textContent = message;
    }
    
    if (progressBar && progress !== null) {
        const p = Math.min(progress, 100);
        progressBar.style.width = p + '%';
    }
}

/**
 * Menyembunyikan loading halaman (sama seperti loading pertama)
 * @param {number} delay - Delay sebelum hilang (ms)
 */
function hidePageLoading(delay = 400) {
    const overlay = document.getElementById('pageLoadingOverlay');
    if (!overlay) return;
    
    if (pageLoadingInterval) {
        clearInterval(pageLoadingInterval);
        pageLoadingInterval = null;
    }
    
    const progressBar = document.getElementById('pageLoadingProgressBar');
    if (progressBar) {
        progressBar.style.width = '100%';
        progressBar.style.background = 'linear-gradient(90deg, #10b981, #059669)';
    }
    
    const stepEl = document.getElementById('pageLoadingStepText');
    if (stepEl) stepEl.textContent = '✅ Selesai!';
    
    const textEl = document.getElementById('pageLoadingText');
    if (textEl) textEl.textContent = 'Halaman siap digunakan';
    
    setTimeout(() => {
        overlay.style.display = 'none';
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
        overlay.style.pointerEvents = 'none';
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        if (progressBar) {
            setTimeout(() => {
                progressBar.style.width = '0%';
                progressBar.style.background = 'linear-gradient(90deg, #fff, rgba(255, 255, 255, 0.8))';
            }, 300);
        }
    }, delay);
}

// ================================================================
// ========== UPDATE LOGO USER ==========
// ================================================================

function updateLogoUser(name) {
    const userNameEl = document.getElementById('logoUserName');
    if (userNameEl) {
        userNameEl.textContent = name || 'CS Agent';
    }
}

// ========== APPLY DARK MODE TO MODAL ==========
function applyDarkModeToModal(modalElement) {
    if (!modalElement) return;
    if (!document.body.classList.contains('dark-mode')) return;
    
    const content = modalElement.querySelector('.modal-content');
    if (!content) return;
    
    // Tambahkan class untuk styling via CSS
    content.classList.add('dark-mode-content');
    
    // ===== PERBAIKAN: Cari dan set scroll container =====
    const scrollContainers = content.querySelectorAll('.modal-body-scroll, .chat-premium-container, .modal-body');
    scrollContainers.forEach(container => {
        container.style.background = '#0f172a';
        container.style.borderColor = '#334155';
        container.style.color = '#f1f5f9';
        
        // Scrollbar styling
        container.style.scrollbarWidth = 'thin';
        container.style.scrollbarColor = '#475569 transparent';
    });
    
    // FORCE OVERRIDE untuk inline style yang bandel
    // Cari semua div dengan background kuning (#fef3c7) - PERINGATAN
    const warningDivs = content.querySelectorAll('div[style*="background: #fef3c7"], div[style*="background:#fef3c7"], div[style*="background: #f3c7"]');
    warningDivs.forEach(div => {
        div.style.background = '#451a03 !important';
        div.style.border = '1px solid #78350f !important';
        div.style.borderLeft = '4px solid #f59e0b !important';
        div.style.borderRadius = '12px !important';
        div.style.color = '#fcd34d !important';
        
        div.querySelectorAll('p').forEach(p => {
            p.style.color = '#fcd34d !important';
        });
        div.querySelectorAll('strong').forEach(s => {
            s.style.color = '#fbbf24 !important';
        });
        div.querySelectorAll('span').forEach(s => {
            s.style.color = '#fcd34d !important';
        });
    });
    
    // Cari semua div dengan background biru (#eef2ff) - KETENTUAN
    const infoDivs = content.querySelectorAll('div[style*="background: #eef2ff"], div[style*="background:#eef2ff"]');
    infoDivs.forEach(div => {
        div.style.background = '#1e293b !important';
        div.style.border = '1px solid #334155 !important';
        div.style.borderRadius = '12px !important';
        
        div.querySelectorAll('p').forEach(p => {
            p.style.color = '#a5b4fc !important';
        });
        div.querySelectorAll('strong').forEach(s => {
            s.style.color = '#818cf8 !important';
        });
        div.querySelectorAll('span').forEach(s => {
            s.style.color = '#a5b4fc !important';
        });
    });
    
    // Cari header sticky di negosiasi
    const stickyHeaders = content.querySelectorAll('div[style*="position: sticky"], div[style*="position:sticky"]');
    stickyHeaders.forEach(div => {
        if (div.style.background === '#fff' || div.style.background === 'white' || div.style.background === '') {
            div.style.background = '#1e293b !important';
            div.style.borderRadius = '24px 24px 0 0 !important';
        }
        div.querySelectorAll('h3').forEach(el => el.style.color = '#f1f5f9 !important');
        div.querySelectorAll('.modal-subtitle').forEach(el => el.style.color = '#94a3b8 !important');
        div.querySelectorAll('small').forEach(el => el.style.color = '#94a3b8 !important');
    });
    
    // Background e5e7eb (progress bar) di negosiasi
    const progressBg = content.querySelectorAll('div[style*="background: #e5e7eb"], div[style*="background:#e5e7eb"]');
    progressBg.forEach(div => {
        div.style.background = '#334155 !important';
        const childDiv = div.querySelector('div[style*="background: #10b981"]');
        if (childDiv) {
            childDiv.style.background = '#10b981 !important';
        }
    });
    
    // Background f9fafb
    const grayBg = content.querySelectorAll('div[style*="background: #f9fafb"], div[style*="background:#f9fafb"]');
    grayBg.forEach(el => {
        el.style.background = '#0f172a !important';
        el.style.color = '#f1f5f9 !important';
    });
    
    // Background putih
    const whiteBg = content.querySelectorAll('div[style*="background: #fff"], div[style*="background:#fff"], div[style*="background: white"]');
    whiteBg.forEach(el => {
        if (!el.closest('.modal-buttons') && !el.closest('.detail-footer')) {
            el.style.background = '#0f172a !important';
            el.style.color = '#f1f5f9 !important';
        }
    });
    
    // Modal buttons
    const buttons = content.querySelector('.modal-buttons');
    if (buttons) {
        buttons.style.background = '#1e293b !important';
        buttons.style.borderTop = '1px solid #334155 !important';
    }
    
    // Input dan textarea
    content.querySelectorAll('input, select, textarea').forEach(el => {
        if (!el.closest('.modal-buttons')) {
            el.style.background = '#0f172a !important';
            el.style.borderColor = '#334155 !important';
            el.style.color = '#f1f5f9 !important';
        }
    });
    
    // ===== PERBAIKAN: Chat premium container =====
    const chatContainers = content.querySelectorAll('.chat-premium-container');
    chatContainers.forEach(container => {
        container.style.background = '#0f172a !important';
        container.style.borderColor = '#334155 !important';
    });
}

// ========== FUNGSI UNTUK MEMBUAT MODAL DINAMIS YANG BISA DIKLIK ==========
function createModalWithHighZIndex(htmlContent, onClose = null) {
    // Hapus modal yang sudah ada dengan id yang sama
    const existingModal = document.querySelector('.dynamic-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal dynamic-modal';
    modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0, 0, 0, 0.7) !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        z-index: 999999999 !important;
        backdrop-filter: blur(5px) !important;
        pointer-events: auto !important;
        overflow: hidden !important;
    `;
    modal.innerHTML = htmlContent;
    
    // Pastikan modal content memiliki struktur yang benar
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        // Jika ada elemen dengan class modal-body-scroll, gunakan itu
        // Jika tidak, bungkus body dengan scrollable container
        const bodyElement = modalContent.querySelector('.modal-body, .modal-body-scroll');
        if (!bodyElement) {
            // Cari elemen yang berisi konten utama (setelah header dan sebelum footer)
            const children = Array.from(modalContent.children);
            let startIndex = -1;
            let endIndex = -1;
            
            // Cari header (biasanya div pertama dengan padding)
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (child.style && child.style.padding && child.style.padding.includes('20px')) {
                    if (startIndex === -1) {
                        startIndex = i + 1;
                    }
                }
                if (child.className && child.className.includes('modal-buttons')) {
                    endIndex = i;
                    break;
                }
            }
            
            if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
                // Pindahkan elemen ke dalam scrollable container
                const scrollContainer = document.createElement('div');
                scrollContainer.className = 'modal-body-scroll';
                scrollContainer.style.cssText = `
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px 20px;
                    max-height: calc(85vh - 180px);
                    scroll-behavior: smooth;
                `;
                
                const elementsToMove = [];
                for (let i = startIndex; i < endIndex; i++) {
                    elementsToMove.push(children[i]);
                }
                
                elementsToMove.forEach(el => {
                    modalContent.removeChild(el);
                    scrollContainer.appendChild(el);
                });
                
                // Sisipkan scroll container setelah header
                const headerElement = children[0];
                if (headerElement) {
                    modalContent.insertBefore(scrollContainer, children[endIndex] || null);
                } else {
                    modalContent.insertBefore(scrollContainer, modalContent.firstChild);
                }
            }
        }
        
        // Pastikan z-index tinggi
        modalContent.style.zIndex = '999999999';
        modalContent.style.position = 'relative';
        modalContent.style.pointerEvents = 'auto';
    }
    
    // Pastikan semua tombol di modal bisa diklik
    const buttons = modal.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.style.pointerEvents = 'auto';
        btn.style.cursor = 'pointer';
    });
    
    // Klik di luar modal untuk menutup (hanya jika onClose tersedia)
    modal.addEventListener('click', (e) => {
        if (e.target === modal && onClose) {
            onClose();
        }
    });
    
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.top = '0';
    document.body.style.left = '0';
    document.body.style.pointerEvents = 'auto';
    
    applyDarkModeToModal(modal);
    
    return modal;
}

// ========== CLOSE DYNAMIC MODAL ==========
function closeDynamicModal(modal) {
    if (modal) {
        modal.remove();
    }
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.classList.remove('modal-open');
    document.body.style.pointerEvents = '';
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function addDaysToDate(dateStr, days) {
    if (!dateStr) return getTodayDate();
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatRupiah(angka) {
    if (!angka && angka !== 0) return 'Rp 0';
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatPhone(input) {
    let value = input.value.replace(/[^\d]/g, '');
    if (value.startsWith('0')) value = value.substring(1);
    if (value.length > 12) value = value.slice(0, 12);
    input.value = value;
}

function isMobile() {
    return window.innerWidth <= 768;
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function updateSidebarBodyClass() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('active')) {
        document.body.classList.add('sidebar-open');
    } else {
        document.body.classList.remove('sidebar-open');
    }
}

// ========== CLOSE MODAL ==========
function closeModal(modalId) {
    // Jika modal adalah deadline popup, gunakan fungsi khusus
    if (modalId === 'deadlinePopupModal') {
        closeDeadlinePopup();
        return;
    }
    
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
    document.body.style.pointerEvents = '';
}

// ========== SHOW MODAL ==========
function showModal(modalId) {
    // Deadline popup dihandle terpisah
    if (modalId === 'deadlinePopupModal') {
        showDeadlinePopup();
        return;
    }
    
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.warn('Modal not found:', modalId);
        return;
    }
    
    modal.style.display = 'flex';
    modal.style.zIndex = '999999999';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    modal.style.backdropFilter = 'blur(5px)';
    modal.style.pointerEvents = 'auto';
    
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.zIndex = '999999999';
        modalContent.style.position = 'relative';
        modalContent.style.pointerEvents = 'auto';
    }
    
    const buttons = modal.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.style.pointerEvents = 'auto';
        btn.style.cursor = 'pointer';
    });
    
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'auto';
    
    applyDarkModeToModal(modal);
}

function setupModalClickOutside(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modalId);
    });
}

// ========== AUTO FORMAT FUNCTIONS (Tanpa validasi blokir) ==========
function formatAgentIdAuto(input) {
    let value = input.value.toUpperCase();
    value = value.replace(/[^A-Z0-9-]/g, '');
    if (value.length > 17) value = value.slice(0, 17);
    input.value = value;
}

function formatNamaAuto(input) {
    let value = input.value.toLowerCase();
    value = value.replace(/[^a-z\s]/gi, '');
    value = value.replace(/\b\w/g, char => char.toUpperCase());
    if (value.length > 25) value = value.slice(0, 25);
    input.value = value;
}

function formatPhoneAuto(input) {
    let value = input.value.replace(/[^\d]/g, '');
    if (value.startsWith('0')) value = value.substring(1);
    if (value.length > 0 && !value.startsWith('8')) {
        value = '8' + value;
    }
    if (value.length > 12) value = value.slice(0, 12);
    input.value = value;
}

// ========== FLOATING PROGRESS ==========
function showFloatingProgress(title, total = 0) {
    if (activeProgress) {
        activeProgress.remove();
        activeProgress = null;
    }

    const container = document.createElement('div');
    container.className = 'floating-progress';
    container.innerHTML = `
        <button class="progress-close" id="progressCloseBtn">✕</button>
        <div class="progress-status">
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
    if (closeBtn) {
        closeBtn.onclick = () => {
            if (activeProgress) {
                activeProgress.remove();
                activeProgress = null;
            }
        };
    }

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
                activeProgress.remove();
                activeProgress = null;
            }
        },
        setTotal: (newTotal) => {
            const countEl = document.getElementById('floatingProgressCount');
            if (countEl) countEl.innerHTML = `0 / ${newTotal}`;
        }
    };
}

// ========== FORMAT TANGGAL ==========
function formatDateDDMMYYYY(dateStr) {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    } catch (e) {
        return dateStr;
    }
}

function formatDateInput(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    } catch (e) {
        return dateStr;
    }
}

function parseDateDDMMYYYY(dateStr) {
    if (!dateStr) return null;
    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const year = parseInt(parts[2]);
            return new Date(year, month, day);
        }
        return null;
    } catch (e) {
        return null;
    }
}

// ========== FORMAT BULAN TAHUN ==========
function formatMonthYear(dateStr) {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                           'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    } catch (e) {
        return dateStr;
    }
}

function formatMonthYearShort(dateStr) {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
                           'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    } catch (e) {
        return dateStr;
    }
}

// ========== DARK MODE FUNCTIONS ==========
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (!darkModeToggle) {
        console.warn('Dark mode toggle not found');
        return;
    }
    
    // ===== CEK STATUS YANG DISIMPAN =====
    const savedMode = localStorage.getItem('darkMode');
    const isDarkMode = savedMode === 'enabled';
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.classList.add('active');
        setTimeout(() => {
            updateChartsForDarkMode();
        }, 300);
    }
    
    // ===== HAPUS EVENT LISTENER LAMA =====
    // Clone untuk menghapus semua event listener yang terpasang
    const newToggle = darkModeToggle.cloneNode(true);
    darkModeToggle.parentNode.replaceChild(newToggle, darkModeToggle);
    
    // Gunakan referensi baru
    const freshToggle = document.getElementById('darkModeToggle');
    if (!freshToggle) {
        console.warn('Fresh toggle not found');
        return;
    }
    
    // ===== PASTIKAN ELEMEN BISA DIKLIK =====
    freshToggle.style.cursor = 'pointer';
    freshToggle.style.pointerEvents = 'auto';
    freshToggle.style.position = 'relative';
    freshToggle.style.zIndex = '10';
    
    // ===== PASANG EVENT LISTENER BARU =====
    freshToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Dark mode toggle clicked');
        
        // Toggle class
        document.body.classList.toggle('dark-mode');
        this.classList.toggle('active');
        
        const isDark = document.body.classList.contains('dark-mode');
        
        if (isDark) {
            localStorage.setItem('darkMode', 'enabled');
            showNotifTop('🌙 Mode Gelap diaktifkan');
        } else {
            localStorage.setItem('darkMode', 'disabled');
            showNotifTop('☀️ Mode Terang diaktifkan');
        }
        
        // Update charts
        setTimeout(() => {
            updateChartsForDarkMode();
            
            // Force update chart background
            const isDarkMode = document.body.classList.contains('dark-mode');
            if (chartCustomer) {
                chartCustomer.options.backgroundColor = isDarkMode ? '#0f172a' : '#ffffff';
                chartCustomer.update();
            }
            if (chartProspek) {
                chartProspek.options.backgroundColor = isDarkMode ? '#0f172a' : '#ffffff';
                chartProspek.update();
            }
            if (targetChart) {
                targetChart.options.backgroundColor = isDarkMode ? '#0f172a' : '#ffffff';
                targetChart.update();
            }
            if (trendChart) {
                trendChart.options.backgroundColor = isDarkMode ? '#0f172a' : '#ffffff';
                trendChart.update();
            }
        }, 200);
    });
    
    // ===== TAMBAHKAN HOVER EFFECT =====
    freshToggle.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.2)';
    });
    
    freshToggle.addEventListener('mouseleave', function() {
        this.style.transform = 'none';
        this.style.boxShadow = 'none';
    });
    
    console.log('✅ Dark mode initialized');
}

// ========== UPDATE TARGET DISPLAY ==========
async function updateTargetDisplay() {
    if (!currentUser) return;
    try {
        // ===== PERBAIKAN: Hapus filter user_id =====
        const { data, error } = await window.db
            .from('settings')
            .select('*')
            .eq('key', 'targetKPI')
            .maybeSingle();
        
        if (data && data.value) {
            targetData = data.value;
        } else {
            targetData = { agent: 10, upline: 5, transaksi: 100, selisih: 50, monthlyTargets: [] };
        }
        
        // ===== AMBIL DATA AGENT =====
        let query = window.db.from('db_agent').select('*');
        if (currentUserRole !== 'owner') query = query.eq('user_id', currentUser.id);
        const { data: agents, error: agentError } = await query;
        if (agentError) { console.error('Error loading agents for target:', agentError); return; }
        
        let currentAgent = 0, currentKoor = 0, currentCA = 0;
        if (agents && agents.length > 0) {
            agents.forEach(agent => {
                const type = agent.agent_type || '';
                if (type === 'AGENT' || type === 'Agent') currentAgent++;
                else if (type.includes('KORWIL') || type === 'Koordinator Wilayah (KORWIL)') currentKoor++;
                else if (type.includes('CA') || type === 'CollectingAgent (CA)') currentCA++;
            });
        }
        
        // ===== AMBIL DATA TRANSAKSI =====
        const transaksiDataLocal = window.transaksiData || transaksiData || [];
        let currentTransaksi = 0, totalBulanLalu = 0, validCount = 0;
        let uplineSet = new Set();
        
        if (transaksiDataLocal.length > 0) {
            transaksiDataLocal.forEach(t => {
                if (t.progres_jenis !== 'tidak_transaksi') {
                    validCount++;
                    currentTransaksi += (t.transaksi_bulan_ini || 0);
                    totalBulanLalu += (t.transaksi_bulan_lalu || 0);
                    if (t.upline_name && t.upline_name.trim() !== '' && t.upline_name !== '-') {
                        uplineSet.add(t.upline_name);
                    }
                }
            });
        }
        
        const currentUpline = uplineSet.size;
        const currentSelisih = currentTransaksi - totalBulanLalu;
        
        // HITUNG PERSENTASE
        const agentPercent = targetData.agent > 0 ? Math.min((validCount / targetData.agent) * 100, 100) : 0;
        const uplinePercent = targetData.upline > 0 ? Math.min((currentUpline / targetData.upline) * 100, 100) : 0;
        const transaksiPercent = targetData.transaksi > 0 ? Math.min((currentTransaksi / targetData.transaksi) * 100, 100) : 0;
        const selisihPercent = targetData.selisih > 0 ? Math.min((currentSelisih / targetData.selisih) * 100, 100) : 0;
        
        // UPDATE ELEMEN
        const elements = {
            targetAgentValue: targetData.agent || 0,
            targetUplineValue: targetData.upline || 0,
            targetTransaksiValue: (targetData.transaksi || 0).toLocaleString(),
            targetSelisihValue: (targetData.selisih || 0).toLocaleString(),
            targetAgentReached: validCount,
            targetUplineReached: currentUpline,
            targetTransaksiReached: currentTransaksi.toLocaleString(),
            targetSelisihReached: currentSelisih.toLocaleString()
        };
        
        for (const [id, value] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) el.innerText = value;
        }
        
        // UPDATE PROGRESS BAR
        const progressElements = {
            targetAgentProgress: agentPercent,
            targetUplineProgress: uplinePercent,
            targetTransaksiProgress: transaksiPercent,
            targetSelisihProgress: selisihPercent
        };
        
        for (const [id, value] of Object.entries(progressElements)) {
            const el = document.getElementById(id);
            if (el) el.style.width = Math.min(value, 100) + '%';
        }
        
        // UPDATE CHART
        updateTargetChart([agentPercent, uplinePercent, transaksiPercent]);
        updateTrendChart();
        
        // CEK SEMUA TARGET TERCAPAI
        const allTargetsMet = agentPercent >= 100 && uplinePercent >= 100 && transaksiPercent >= 100;
        const headerTarget = document.querySelector('.target-kpi-section .target-header h3');
        const targetSection = document.querySelector('.target-kpi-section');
        
        if (headerTarget) {
            if (allTargetsMet) {
                headerTarget.innerHTML = '🥳🎉 SELAMAT! Semua Target Tercapai! 🎉🥳';
                headerTarget.style.color = '#10b981';
                headerTarget.style.animation = 'pulseTarget 1.5s ease-in-out infinite';
                if (targetSection) {
                    targetSection.style.background = 'linear-gradient(135deg, #fef3c7, #fde68a, #fcd34d)';
                    targetSection.style.borderColor = '#f59e0b';
                    targetSection.style.boxShadow = '0 0 40px rgba(245, 158, 11, 0.3)';
                    targetSection.classList.add('celebrate');
                }
                showNotifTop('🥳🎉 SELAMAT! Semua target KPI telah tercapai! 🎉🥳');
            } else {
                headerTarget.innerHTML = '🎯 Target & KPI Prospek Agent';
                headerTarget.style.color = '';
                headerTarget.style.animation = '';
                if (targetSection) {
                    targetSection.style.background = '';
                    targetSection.style.borderColor = '';
                    targetSection.style.boxShadow = '';
                    targetSection.classList.remove('celebrate');
                }
            }
        }
        
    } catch (err) {
        console.error('Error updating target display:', err);
    }
}

// ========== UPDATE CHARTS ==========
function updateChartsForDarkMode() {
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const primaryColor = isDark ? '#818cf8' : '#4f46e5';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    
    // ===== UPDATE TOTAL LABEL DI SEMUA CHART =====
    document.querySelectorAll('.chart-total-label').forEach(label => {
        label.style.color = textColor;
        const spans = label.querySelectorAll('span');
        spans.forEach(span => {
            span.style.color = textColor;
        });
        const totalValue = label.querySelector('.total-value');
        if (totalValue) {
            totalValue.style.color = primaryColor;
        }
    });
    
    // ===== UPDATE CHART CUSTOMER =====
    if (chartCustomer) {
        chartCustomer.options.plugins.legend.labels.color = textColor;
        chartCustomer.options.plugins.tooltip.titleColor = textColor;
        chartCustomer.options.plugins.tooltip.bodyColor = textColor;
        chartCustomer.options.plugins.tooltip.backgroundColor = isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        chartCustomer.options.plugins.tooltip.borderColor = isDark ? '#334155' : '#e5e7eb';
        chartCustomer.update();
    }
    
    // ===== UPDATE CHART PROSPEK =====
    if (chartProspek) {
        chartProspek.options.plugins.legend.labels.color = textColor;
        chartProspek.options.plugins.tooltip.titleColor = textColor;
        chartProspek.options.plugins.tooltip.bodyColor = textColor;
        chartProspek.options.plugins.tooltip.backgroundColor = isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        chartProspek.options.plugins.tooltip.borderColor = isDark ? '#334155' : '#e5e7eb';
        chartProspek.update();
    }
    
    // ===== UPDATE TARGET CHART =====
    if (targetChart) {
        targetChart.options.plugins.legend.labels.color = textColor;
        if (targetChart.options.scales && targetChart.options.scales.y) {
            targetChart.options.scales.y.ticks.color = textColor;
        }
        if (targetChart.options.scales && targetChart.options.scales.x) {
            targetChart.options.scales.x.ticks.color = textColor;
        }
        targetChart.update();
    }
    
    // ===== UPDATE TREND CHART =====
    if (trendChart) {
        trendChart.options.plugins.legend.labels.color = textColor;
        trendChart.options.plugins.tooltip.titleColor = textColor;
        trendChart.options.plugins.tooltip.bodyColor = textColor;
        trendChart.options.plugins.tooltip.backgroundColor = isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        trendChart.options.plugins.tooltip.borderColor = isDark ? '#334155' : '#e5e7eb';
        if (trendChart.options.scales && trendChart.options.scales.y) {
            trendChart.options.scales.y.ticks.color = textColor;
            trendChart.options.scales.y.grid.color = gridColor;
        }
        if (trendChart.options.scales && trendChart.options.scales.x) {
            trendChart.options.scales.x.ticks.color = textColor;
        }
        trendChart.update();
    }
    
    // ===== UPDATE BACKGROUND CANVAS =====
    document.querySelectorAll('.chart-card canvas').forEach(canvas => {
        if (isDark) {
            canvas.style.background = '#0f172a';
            canvas.style.borderRadius = '12px';
            canvas.style.padding = '8px';
        } else {
            canvas.style.background = '';
            canvas.style.borderRadius = '';
            canvas.style.padding = '';
        }
    });
    
    // ===== UPDATE LEGEND DI DARK MODE =====
    document.querySelectorAll('.chart-card .chartjs-legend').forEach(legend => {
        if (isDark) {
            legend.style.color = '#f1f5f9';
        } else {
            legend.style.color = '';
        }
    });
}

// ========== SIDEBAR HOVER FUNCTIONS ==========
function initSidebarHover() {
    const hoverZone = document.getElementById('hoverZone');
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleSidebarBtn');
    
    if (!hoverZone || !sidebar) return;
    
    // ===== PERBAIKAN: Hover untuk desktop =====
    hoverZone.addEventListener('mouseenter', function(e) {
        if (window.innerWidth > 768) {
            clearTimeout(sidebarTimeout);
            sidebar.classList.add('active');
            updateSidebarBodyClass();
        }
    });
    
    sidebar.addEventListener('mouseleave', function() {
        if (window.innerWidth > 768) {
            sidebarTimeout = setTimeout(() => {
                sidebar.classList.remove('active');
                updateSidebarBodyClass();
            }, 300);
        }
    });
    
    sidebar.addEventListener('mouseenter', function() {
        clearTimeout(sidebarTimeout);
    });
    
    // ===== PERBAIKAN: Tombol toggle untuk semua device =====
    if (toggleBtn) {
        // Hapus semua event listener lama dengan clone
        const newToggleBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        
        const freshToggleBtn = document.getElementById('toggleSidebarBtn');
        if (freshToggleBtn) {
            freshToggleBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Toggle sidebar clicked'); // Debug
                
                sidebar.classList.toggle('active');
                updateSidebarBodyClass();
                
                // Force reflow untuk memastikan animasi
                void sidebar.offsetHeight;
            });
            
            // Pastikan pointer-events aktif
            freshToggleBtn.style.pointerEvents = 'auto';
            freshToggleBtn.style.cursor = 'pointer';
            freshToggleBtn.style.position = 'relative';
            freshToggleBtn.style.zIndex = '1000';
        }
    }
}

// ===== PERBAIKAN: Fungsi update sidebar body class =====
function updateSidebarBodyClass() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('active')) {
        document.body.classList.add('sidebar-open');
    } else {
        document.body.classList.remove('sidebar-open');
    }
}

// ========== SHOW DEADLINE POPUP ==========
function showDeadlinePopup() {
    // Cegah multiple popup
    if (deadlineModalOpen) {
        return;
    }
    
    const today = getTodayDate();
    
    // Filter data yang overdue
    const overdueCustomers = customersData.filter(c => 
        c.tanggal && c.tanggal < today && c.status !== 'closing'
    );
    const overdueProspek = prospekData.filter(p => 
        p.deadline && p.deadline < today
    );
    const totalOverdue = overdueCustomers.length + overdueProspek.length;
    
    // Filter data yang deadline hari ini
    const todayCustomers = customersData.filter(c => 
        c.tanggal === today && c.status !== 'closing'
    );
    const todayProspek = prospekData.filter(p => 
        p.deadline === today
    );
    const totalToday = todayCustomers.length + todayProspek.length;
    
    // Hapus modal lama jika ada
    const existingModal = document.getElementById('deadlinePopupModal');
    if (existingModal) {
        existingModal.remove();
        deadlineModalOpen = false;
    }
    
    // Buat modal HTML
    const modalHtml = `
        <div class="modal-content" style="max-width: 550px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column; background: #fff; border-radius: 24px;">
            <div style="padding: 20px 24px 0;">
                <h3 style="font-size: 20px; margin-bottom: 4px; color: #1f2937;">📅 Info Deadline</h3>
                <div style="font-size: 13px; color: #6b7280; padding: 0 0 12px 0;">
                    Ringkasan deadline yang perlu diperhatikan
                </div>
            </div>
            
            <div style="padding: 0 24px 12px; display: flex; gap: 12px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 100px; background: #fef2f2; border-radius: 12px; padding: 12px 16px; border-left: 4px solid #ef4444;">
                    <div style="font-size: 24px; font-weight: 800; color: #dc2626;">${totalOverdue}</div>
                    <div style="font-size: 11px; color: #6b7280;">⚠️ Terlewat</div>
                </div>
                <div style="flex: 1; min-width: 100px; background: #fef3c7; border-radius: 12px; padding: 12px 16px; border-left: 4px solid #f59e0b;">
                    <div style="font-size: 24px; font-weight: 800; color: #d97706;">${totalToday}</div>
                    <div style="font-size: 11px; color: #6b7280;">📌 Hari Ini</div>
                </div>
                <div style="flex: 1; min-width: 100px; background: #ecfdf5; border-radius: 12px; padding: 12px 16px; border-left: 4px solid #10b981;">
                    <div style="font-size: 24px; font-weight: 800; color: #059669;">${customersData.length + prospekData.length}</div>
                    <div style="font-size: 11px; color: #6b7280;">📋 Total Data</div>
                </div>
            </div>
            
            <div style="padding: 0 24px; flex: 1; overflow-y: auto; max-height: 300px;">
                ${totalOverdue === 0 && totalToday === 0 ? `
                    <div style="text-align: center; padding: 30px 0; color: #9ca3af;">
                        <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
                        <p>Semua deadline terpenuhi!</p>
                    </div>
                ` : `
                    ${totalOverdue > 0 ? `
                        <div style="margin-bottom: 16px;">
                            <div style="font-weight: 600; color: #dc2626; margin-bottom: 8px; font-size: 13px;">⚠️ Terlewat (${totalOverdue})</div>
                            ${overdueCustomers.slice(0, 10).map(c => `
                                <div class="deadline-item overdue" data-id="${c.id}" data-type="customer" style="
                                    display: flex;
                                    align-items: center;
                                    gap: 10px;
                                    padding: 8px 12px;
                                    margin-bottom: 4px;
                                    background: #fef2f2;
                                    border-radius: 8px;
                                    cursor: pointer;
                                    transition: all 0.2s;
                                    border-left: 3px solid #ef4444;
                                ">
                                    <span style="font-size: 16px;">🔴</span>
                                    <div style="flex: 1; min-width: 0;">
                                        <div style="font-weight: 500; font-size: 13px; color: #1f2937;">${escapeHtml(c.nama)}</div>
                                        <div style="font-size: 11px; color: #6b7280;">📅 ${c.tanggal} | 🆔 ${escapeHtml(c.agent_id || '-')}</div>
                                    </div>
                                    <button class="wa-btn-small" onclick="event.stopPropagation(); openWA('${c.hp}')" style="
                                        background: #25D366;
                                        color: white;
                                        border: none;
                                        border-radius: 6px;
                                        padding: 4px 10px;
                                        font-size: 11px;
                                        cursor: pointer;
                                    ">💬</button>
                                </div>
                            `).join('')}
                            ${overdueCustomers.length > 10 ? `<div style="text-align: center; font-size: 12px; color: #9ca3af; padding: 4px 0;">... dan ${overdueCustomers.length - 10} lainnya</div>` : ''}
                            ${overdueProspek.slice(0, 10).map(p => `
                                <div class="deadline-item overdue" data-id="${p.id}" data-type="prospek" style="
                                    display: flex;
                                    align-items: center;
                                    gap: 10px;
                                    padding: 8px 12px;
                                    margin-bottom: 4px;
                                    background: #fef2f2;
                                    border-radius: 8px;
                                    cursor: pointer;
                                    transition: all 0.2s;
                                    border-left: 3px solid #ef4444;
                                ">
                                    <span style="font-size: 16px;">🔴</span>
                                    <div style="flex: 1; min-width: 0;">
                                        <div style="font-weight: 500; font-size: 13px; color: #1f2937;">${escapeHtml(p.nama)}</div>
                                        <div style="font-size: 11px; color: #6b7280;">📅 ${p.deadline} | 🎯 Prospek</div>
                                    </div>
                                    <button class="wa-btn-small" onclick="event.stopPropagation(); openWA('${p.hp}')" style="
                                        background: #25D366;
                                        color: white;
                                        border: none;
                                        border-radius: 6px;
                                        padding: 4px 10px;
                                        font-size: 11px;
                                        cursor: pointer;
                                    ">💬</button>
                                </div>
                            `).join('')}
                            ${overdueProspek.length > 10 ? `<div style="text-align: center; font-size: 12px; color: #9ca3af; padding: 4px 0;">... dan ${overdueProspek.length - 10} lainnya</div>` : ''}
                        </div>
                    ` : ''}
                    
                    ${totalToday > 0 ? `
                        <div style="margin-bottom: 16px;">
                            <div style="font-weight: 600; color: #d97706; margin-bottom: 8px; font-size: 13px;">📌 Deadline Hari Ini (${totalToday})</div>
                            ${todayCustomers.slice(0, 10).map(c => `
                                <div class="deadline-item today" data-id="${c.id}" data-type="customer" style="
                                    display: flex;
                                    align-items: center;
                                    gap: 10px;
                                    padding: 8px 12px;
                                    margin-bottom: 4px;
                                    background: #fef3c7;
                                    border-radius: 8px;
                                    cursor: pointer;
                                    transition: all 0.2s;
                                    border-left: 3px solid #f59e0b;
                                ">
                                    <span style="font-size: 16px;">🟡</span>
                                    <div style="flex: 1; min-width: 0;">
                                        <div style="font-weight: 500; font-size: 13px; color: #1f2937;">${escapeHtml(c.nama)}</div>
                                        <div style="font-size: 11px; color: #6b7280;">📅 ${c.tanggal} | 🆔 ${escapeHtml(c.agent_id || '-')}</div>
                                    </div>
                                    <button class="wa-btn-small" onclick="event.stopPropagation(); openWA('${c.hp}')" style="
                                        background: #25D366;
                                        color: white;
                                        border: none;
                                        border-radius: 6px;
                                        padding: 4px 10px;
                                        font-size: 11px;
                                        cursor: pointer;
                                    ">💬</button>
                                </div>
                            `).join('')}
                            ${todayCustomers.length > 10 ? `<div style="text-align: center; font-size: 12px; color: #9ca3af; padding: 4px 0;">... dan ${todayCustomers.length - 10} lainnya</div>` : ''}
                            ${todayProspek.slice(0, 10).map(p => `
                                <div class="deadline-item today" data-id="${p.id}" data-type="prospek" style="
                                    display: flex;
                                    align-items: center;
                                    gap: 10px;
                                    padding: 8px 12px;
                                    margin-bottom: 4px;
                                    background: #fef3c7;
                                    border-radius: 8px;
                                    cursor: pointer;
                                    transition: all 0.2s;
                                    border-left: 3px solid #f59e0b;
                                ">
                                    <span style="font-size: 16px;">🟡</span>
                                    <div style="flex: 1; min-width: 0;">
                                        <div style="font-weight: 500; font-size: 13px; color: #1f2937;">${escapeHtml(p.nama)}</div>
                                        <div style="font-size: 11px; color: #6b7280;">📅 ${p.deadline} | 🎯 Prospek</div>
                                    </div>
                                    <button class="wa-btn-small" onclick="event.stopPropagation(); openWA('${p.hp}')" style="
                                        background: #25D366;
                                        color: white;
                                        border: none;
                                        border-radius: 6px;
                                        padding: 4px 10px;
                                        font-size: 11px;
                                        cursor: pointer;
                                    ">💬</button>
                                </div>
                            `).join('')}
                            ${todayProspek.length > 10 ? `<div style="text-align: center; font-size: 12px; color: #9ca3af; padding: 4px 0;">... dan ${todayProspek.length - 10} lainnya</div>` : ''}
                        </div>
                    ` : ''}
                `}
            </div>
            
            <div style="padding: 16px 24px 24px; border-top: 1px solid #e5e7eb; display: flex; gap: 12px;">
                <button onclick="closeDeadlinePopup()" class="btn-primary" style="flex: 1; padding: 12px; border: none; border-radius: 14px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #4f46e5, #6366f1); color: white;">Tutup</button>
            </div>
        </div>
    `;
    
    // Buat modal
    const modal = document.createElement('div');
    modal.id = 'deadlinePopupModal';
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0, 0, 0, 0.7) !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        z-index: 999999999 !important;
        backdrop-filter: blur(5px) !important;
        pointer-events: auto !important;
    `;
    modal.innerHTML = modalHtml;
    
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'auto';
    
    deadlineModalOpen = true;
    
    // Event klik untuk item deadline
    modal.querySelectorAll('.deadline-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (e.target.closest('.wa-btn-small')) return;
            
            const id = this.dataset.id;
            const type = this.dataset.type;
            closeDeadlinePopup();
            if (type === 'customer') {
                openDetailCustomer(id);
            } else if (type === 'prospek') {
                openDetailProspek(id);
            }
        });
    });
    
    // Klik di luar modal untuk tutup
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeDeadlinePopup();
        }
    });
    
    // Apply dark mode
    applyDarkModeToModal(modal);
}

// ========== CLOSE DEADLINE POPUP ==========
function closeDeadlinePopup() {
    const modal = document.getElementById('deadlinePopupModal');
    if (modal) {
        modal.remove();
        deadlineModalOpen = false;
    }
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
    document.body.style.pointerEvents = '';
}

// ================================================================
// ========== SEARCH RIGHT - FIXED & REARRANGED ==========
// ================================================================

let searchRightResults = [];
let searchRightIndex = -1;
let searchRightTimer = null;
let searchRightOpen = false;
let isSearchRightExpanded = false;

function initSearchRight() {
    const wrapper = document.getElementById('searchRightWrapper');
    const trigger = document.getElementById('searchRightTrigger');
    const expanded = document.getElementById('searchRightExpanded');
    const input = document.getElementById('searchRightInput');
    const results = document.getElementById('searchRightResults');
    const resultsList = document.getElementById('searchRightResultsList');
    const clearBtn = document.getElementById('searchRightClear');
    const closeBtn = document.getElementById('searchRightClose');
    const countEl = document.getElementById('searchRightCount');

    if (!wrapper || !trigger || !expanded || !input) return;

    // ===== TOGGLE SEARCH =====
    function toggleSearch(open) {
        if (open === undefined) {
            isSearchRightExpanded = !isSearchRightExpanded;
        } else {
            isSearchRightExpanded = open;
        }

        if (isSearchRightExpanded) {
            expanded.classList.add('active');
            setTimeout(() => {
                input.focus();
                input.select();
            }, 150);
        } else {
            expanded.classList.remove('active');
            results.style.display = 'none';
            input.blur();
        }
    }

    // ===== TRIGGER CLICK =====
    trigger.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleSearch();
    });

    // ===== KEYBOARD SHORTCUT (⌘K / Ctrl+K) =====
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (isSearchRightExpanded) {
                toggleSearch(false);
            } else {
                toggleSearch(true);
            }
        }
        if (e.key === 'Escape' && isSearchRightExpanded) {
            if (input.value.trim()) {
                input.value = '';
                results.style.display = 'none';
                clearBtn.style.display = 'none';
                e.preventDefault();
            } else {
                toggleSearch(false);
                e.preventDefault();
            }
        }
    });

    // ===== INPUT =====
    input.addEventListener('input', function(e) {
        const query = this.value.trim();

        if (query.length > 0) {
            clearBtn.style.display = 'block';
        } else {
            clearBtn.style.display = 'none';
            results.style.display = 'none';
            return;
        }

        clearTimeout(searchRightTimer);
        searchRightTimer = setTimeout(() => {
            performSearchRightFull(query);
        }, 300);
    });

    // ===== FOCUS =====
    input.addEventListener('focus', function() {
        if (this.value.trim().length > 0) {
            results.style.display = 'block';
        }
    });

    // ===== KEYBOARD NAVIGATION =====
    input.addEventListener('keydown', function(e) {
        const items = resultsList.querySelectorAll('.search-right-result-item');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            searchRightIndex = Math.min(searchRightIndex + 1, items.length - 1);
            highlightRightItem(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            searchRightIndex = Math.max(searchRightIndex - 1, -1);
            highlightRightItem(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (searchRightIndex >= 0 && items[searchRightIndex]) {
                items[searchRightIndex].click();
            } else if (items.length > 0) {
                items[0].click();
            }
        } else if (e.key === 'Escape') {
            if (input.value.trim()) {
                input.value = '';
                results.style.display = 'none';
                clearBtn.style.display = 'none';
                e.preventDefault();
            } else {
                toggleSearch(false);
                e.preventDefault();
            }
        }
    });

    // ===== CLEAR =====
    clearBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        input.value = '';
        results.style.display = 'none';
        clearBtn.style.display = 'none';
        input.focus();
        searchRightResults = [];
        searchRightIndex = -1;
    });

    // ===== CLOSE =====
    closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleSearch(false);
    });

    // ===== HOVER HANDLER UNTUK WRAPPER (LANGSUNG, TANPA DELAY) =====
    wrapper.addEventListener('mouseenter', function() {
        // Tidak perlu melakukan apa-apa, cukup biarkan dropdown tetap terbuka
    });

    wrapper.addEventListener('mouseleave', function() {
        if (isSearchRightExpanded) {
            toggleSearch(false); // Langsung tutup
        }
    });

    // ===== CLICK OUTSIDE =====
    document.addEventListener('click', function(e) {
        if (wrapper && !wrapper.contains(e.target)) {
            if (isSearchRightExpanded) {
                toggleSearch(false);
            }
        }
    });

    // ===== PREVENT CLOSE ON INNER CLICK =====
    expanded.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    console.log('✅ Search Right initialized (click-based)');
}

function highlightRightItem(items) {
    items.forEach((item, index) => {
        if (index === searchRightIndex) {
            item.classList.add('active');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('active');
        }
    });
}


// ================================================================
// ========== PERFORM SEARCH - FULL DATABASE ==========
// ================================================================

async function performSearchRightFull(query) {
    const results = document.getElementById('searchRightResults');
    const resultsList = document.getElementById('searchRightResultsList');
    const countEl = document.getElementById('searchRightCount');

    if (!query || query.length < 2) {
        results.style.display = 'none';
        return;
    }

    // Show loading
    resultsList.innerHTML = `
        <div class="search-right-empty">
            <div class="empty-icon">⏳</div>
            <div class="empty-title">Mencari di semua database...</div>
        </div>
    `;
    results.style.display = 'block';

    const q = query.toLowerCase().trim();
    const resultItems = [];
    const searchPromises = [];

    // ================================================================
    // 1. SEARCH CUSTOMERS (Followup Agen)
    // ================================================================
    if (typeof customersData !== 'undefined' && customersData.length > 0) {
        customersData.forEach(item => {
            if (item.nama?.toLowerCase().includes(q) ||
                item.hp?.includes(q) ||
                item.agent_id?.toLowerCase().includes(q)) {
                resultItems.push({
                    id: item.id,
                    type: 'customer',
                    title: item.nama || 'Tidak ada nama',
                    subtitle: `📱 ${item.hp || '-'} · 🆔 ${item.agent_id || '-'}`,
                    icon: '📞',
                    badge: 'Followup',
                    badgeClass: 'badge-customer',
                    status: item.status || 'baru'
                });
            }
        });
    }

    // ================================================================
    // 2. SEARCH PROSPEK
    // ================================================================
    if (typeof prospekData !== 'undefined' && prospekData.length > 0) {
        prospekData.forEach(item => {
            if (item.nama?.toLowerCase().includes(q) ||
                item.hp?.includes(q)) {
                resultItems.push({
                    id: item.id,
                    type: 'prospek',
                    title: item.nama || 'Tidak ada nama',
                    subtitle: `📱 ${item.hp || '-'} · ${item.status || 'Baru'}`,
                    icon: '🎯',
                    badge: 'Prospek',
                    badgeClass: 'badge-prospek',
                    status: item.status || 'Baru'
                });
            }
        });
    }

    // ================================================================
    // 3. SEARCH DB TRANSAKSI
    // ================================================================
    const transaksiLocal = window.transaksiData || transaksiData || [];
    if (transaksiLocal.length > 0) {
        transaksiLocal.forEach(item => {
            if (item.nama?.toLowerCase().includes(q) ||
                item.agent_id?.toLowerCase().includes(q) ||
                item.hp?.includes(q)) {
                resultItems.push({
                    id: item.id,
                    type: 'transaksi',
                    title: item.nama || item.agent_id || 'Tidak ada nama',
                    subtitle: `📱 ${item.hp || '-'} · 💰 ${(item.transaksi_bulan_ini || 0).toLocaleString()}`,
                    icon: '📊',
                    badge: 'DB Transaksi',
                    badgeClass: 'badge-transaksi',
                    status: item.status || 'pending'
                });
            }
        });
    }

    // ================================================================
    // 4. SEARCH DB CLOSING
    // ================================================================
    searchPromises.push(
        window.db.from('db_closing')
            .select('*')
            .or(`nama.ilike.%${query}%,hp.ilike.%${query}%,agent_id.ilike.%${query}%`)
            .limit(20)
            .then(({ data }) => {
                if (data && data.length > 0) {
                    data.forEach(item => {
                        resultItems.push({
                            id: item.id,
                            type: 'closing',
                            title: item.nama || 'Tidak ada nama',
                            subtitle: `📱 ${item.hp || '-'} · ${item.closing_date ? formatDateDDMMYYYY(item.closing_date) : '-'}`,
                            icon: '📁',
                            badge: 'DB Closing',
                            badgeClass: 'badge-closing',
                            status: 'closing'
                        });
                    });
                }
            })
            .catch(err => console.warn('Search closing error:', err))
    );

    // ================================================================
    // 5. SEARCH DB TIDAK TERTARIK
    // ================================================================
    searchPromises.push(
        window.db.from('db_tidak_tertarik')
            .select('*')
            .or(`nama.ilike.%${query}%,hp.ilike.%${query}%`)
            .limit(20)
            .then(({ data }) => {
                if (data && data.length > 0) {
                    data.forEach(item => {
                        resultItems.push({
                            id: item.id,
                            type: 'tidak',
                            title: item.nama || 'Tidak ada nama',
                            subtitle: `📱 ${item.hp || '-'} · ❌ ${item.alasan || 'Tidak tertarik'}`,
                            icon: '❌',
                            badge: 'DB Tidak Tertarik',
                            badgeClass: 'badge-tidak',
                            status: 'tidak'
                        });
                    });
                }
            })
            .catch(err => console.warn('Search tidak tertarik error:', err))
    );

    // ================================================================
    // 6. SEARCH DB NOMOR SALAH
    // ================================================================
    searchPromises.push(
        window.db.from('nomor_salah')
            .select('*')
            .or(`nama.ilike.%${query}%,hp.ilike.%${query}%`)
            .limit(20)
            .then(({ data }) => {
                if (data && data.length > 0) {
                    data.forEach(item => {
                        resultItems.push({
                            id: item.id,
                            type: 'nomor_salah',
                            title: item.nama || 'Tidak ada nama',
                            subtitle: `📱 ${item.hp || '-'} · 📵 ${item.alasan || 'Nomor salah'}`,
                            icon: '📵',
                            badge: 'DB Nomor Salah',
                            badgeClass: 'badge-nomor-salah',
                            status: 'nomor_salah'
                        });
                    });
                }
            })
            .catch(err => console.warn('Search nomor salah error:', err))
    );

    // ================================================================
    // 7. SEARCH DB COMMITMENT
    // ================================================================
    searchPromises.push(
        window.db.from('db_commitment')
            .select('*')
            .or(`nama.ilike.%${query}%,hp.ilike.%${query}%,agent_id.ilike.%${query}%`)
            .limit(20)
            .then(({ data }) => {
                if (data && data.length > 0) {
                    data.forEach(item => {
                        resultItems.push({
                            id: item.id,
                            type: 'commitment',
                            title: item.nama || 'Tidak ada nama',
                            subtitle: `📱 ${item.hp || '-'} · 🆔 ${item.agent_id || '-'}`,
                            icon: '🤝',
                            badge: 'DB Commitment',
                            badgeClass: 'badge-commitment',
                            status: 'commitment'
                        });
                    });
                }
            })
            .catch(err => console.warn('Search commitment error:', err))
    );

    // ================================================================
    // 8. SEARCH DB AGENT
    // ================================================================
    searchPromises.push(
        window.db.from('db_agent')
            .select('*')
            .or(`nama.ilike.%${query}%,hp.ilike.%${query}%,agent_id.ilike.%${query}%`)
            .limit(20)
            .then(({ data }) => {
                if (data && data.length > 0) {
                    data.forEach(item => {
                        resultItems.push({
                            id: item.id,
                            type: 'db_agent',
                            title: item.nama || 'Tidak ada nama',
                            subtitle: `📱 ${item.hp || '-'} · 🆔 ${item.agent_id || '-'}`,
                            icon: '👥',
                            badge: 'DB Agent',
                            badgeClass: 'badge-customer',
                            status: 'agent'
                        });
                    });
                }
            })
            .catch(err => console.warn('Search db_agent error:', err))
    );

    // ================================================================
    // 9. SEARCH PRODUK
    // ================================================================
    searchPromises.push(
        window.db.from('produk')
            .select('*')
            .or(`nama.ilike.%${query}%`)
            .limit(10)
            .then(({ data }) => {
                if (data && data.length > 0) {
                    data.forEach(item => {
                        resultItems.push({
                            id: item.id,
                            type: 'produk',
                            title: `📦 ${item.nama || 'Produk'}`,
                            subtitle: `💰 ${formatRupiah(item.hpp || 0)} · ${item.keterangan || ''}`,
                            icon: '🏷️',
                            badge: 'Produk',
                            badgeClass: 'badge-produk',
                            status: 'produk'
                        });
                    });
                }
            })
            .catch(err => console.warn('Search produk error:', err))
    );

    // ================================================================
    // 10. SEARCH USERS (CS Agent) - only for owner
    // ================================================================
    if (currentUserRole === 'owner') {
        searchPromises.push(
            window.db.from('users')
                .select('*')
                .or(`nama.ilike.%${query}%,email.ilike.%${query}%`)
                .neq('id', currentUser.id)
                .limit(10)
                .then(({ data }) => {
                    if (data && data.length > 0) {
                        data.forEach(item => {
                            resultItems.push({
                                id: item.id,
                                type: 'user',
                                title: item.nama || item.email || 'User',
                                subtitle: `📧 ${item.email || '-'} · ${item.role || 'cs'}`,
                                icon: '👤',
                                badge: 'CS Agent',
                                badgeClass: 'badge-user',
                                status: 'user'
                            });
                        });
                    }
                })
                .catch(err => console.warn('Search users error:', err))
        );
    }

    // ===== WAIT ALL SEARCH COMPLETE =====
    await Promise.allSettled(searchPromises);

    // ===== SORT & LIMIT =====
    // Prioritaskan hasil yang lebih relevan (nama exact match lebih dulu)
    resultItems.sort((a, b) => {
        const aExact = a.title.toLowerCase() === q ? 0 : 1;
        const bExact = b.title.toLowerCase() === q ? 0 : 1;
        return aExact - bExact;
    });

    const limited = resultItems.slice(0, 30);
    searchRightResults = limited;
    searchRightIndex = -1;

    countEl.textContent = limited.length;

    // ===== RENDER RESULTS =====
    if (limited.length === 0) {
        resultsList.innerHTML = `
            <div class="search-right-empty">
                <div class="empty-icon">🔍</div>
                <div class="empty-title">Tidak ditemukan</div>
                <div class="empty-sub">Coba dengan kata kunci lain di semua database</div>
            </div>
        `;
    } else {
        resultsList.innerHTML = limited.map((item, index) => `
            <div class="search-right-result-item" data-index="${index}" data-id="${item.id}" data-type="${item.type}">
                <span class="result-icon">${item.icon}</span>
                <div class="result-info">
                    <div class="result-title">${escapeHtml(item.title)}</div>
                    <div class="result-subtitle">${escapeHtml(item.subtitle)}</div>
                </div>
                <span class="result-badge ${item.badgeClass}">${item.badge}</span>
            </div>
        `).join('');

        resultsList.querySelectorAll('.search-right-result-item').forEach(el => {
            el.addEventListener('click', function() {
                const id = this.dataset.id;
                const type = this.dataset.type;
                results.style.display = 'none';
                openSearchRightResultFull(id, type);
                // Close search after opening result
                setTimeout(() => {
                    const expanded = document.getElementById('searchRightExpanded');
                    if (expanded) expanded.classList.remove('active');
                    isSearchRightExpanded = false;
                }, 300);
            });
        });
    }
}

// ================================================================
// ========== OPEN SEARCH RESULT ==========
// ================================================================

function openSearchRightResultFull(id, type) {
    switch (type) {
        case 'customer':
            if (typeof openDetailCustomer === 'function') openDetailCustomer(id);
            break;
        case 'prospek':
            if (typeof openDetailProspek === 'function') openDetailProspek(id);
            break;
        case 'transaksi':
            if (typeof openDetailTransaksi === 'function') openDetailTransaksi(id);
            break;
        case 'closing':
        case 'tidak':
        case 'nomor_salah':
        case 'commitment':
        case 'db_agent':
            if (typeof openDBDetailModal === 'function') openDBDetailModal(id, type);
            break;
        case 'produk':
            if (typeof openProdukDetail === 'function') openProdukDetail(id);
            break;
        case 'user':
            showNotifTop('👤 Detail CS Agent: ' + escapeHtml(document.querySelector(`.search-right-result-item[data-id="${id}"] .result-title`)?.textContent || 'User'));
            break;
        default:
            showNotifTop('⚠️ Data tidak ditemukan', true);
    }
}

// ================================================================
// ========== OPEN PRODUK DETAIL ==========
// ================================================================

function openProdukDetail(id) {
    const produk = produkData.find(p => p.id === id);
    if (!produk) {
        showNotifTop('❌ Produk tidak ditemukan!', true);
        return;
    }
    
    const modalHtml = `
        <div class="modal-content" style="max-width: 450px;">
            <h3>🏷️ Detail Produk</h3>
            <div class="modal-subtitle">Informasi lengkap produk</div>
            <div style="padding: 0 20px 20px;">
                <div class="detail-info-item"><strong>Nama Produk</strong><span>${escapeHtml(produk.nama)}</span></div>
                <div class="detail-info-item"><strong>HPP (Modal)</strong><span>${formatRupiah(produk.hpp || 0)}</span></div>
                <div class="detail-info-item"><strong>Harga Jual</strong><span>${formatRupiah(produk.harga_jual || 0)}</span></div>
                <div class="detail-info-item"><strong>Keterangan</strong><span>${escapeHtml(produk.keterangan || '-')}</span></div>
                <div class="detail-info-item"><strong>Jenis Produk</strong><span>${produk.jenis_produk === 'beradmin' ? '🏷️ Beradmin' : '📦 Tanpa Admin'}</span></div>
                ${produk.jenis_produk === 'beradmin' ? `
                    <div class="detail-info-item"><strong>Admin Default</strong><span>${formatRupiah(produk.admin_default || 0)}</span></div>
                    <div class="detail-info-item"><strong>Admin Berdasarkan CID</strong><span>${produk.cid_based ? '✅ Ya' : '❌ Tidak'}</span></div>
                ` : ''}
            </div>
            <div class="modal-buttons">
                <button onclick="closeModal('detailModal')" class="btn-primary">Tutup</button>
            </div>
        </div>
    `;
    
    document.getElementById('detailContent').innerHTML = modalHtml;
    showModal('detailModal');
    applyDarkModeToModal(document.getElementById('detailModal'));
}

// ================================================================
// ========== OPEN AGENT DETAIL ==========
// ================================================================
function openAgentDetail(id) {
    const agent = agentsData.find(a => a.id === id);
    if (!agent) {
        showNotifTop('❌ Agent tidak ditemukan!', true);
        return;
    }
    
    const typeMap = {
        'AGENT': '👤 Agent',
        'CollectingAgent (CA)': '🏦 Collecting Agent (CA)',
        'Koordinator Wilayah (KORWIL)': '👥 Koordinator Wilayah (KORWIL)'
    };
    
    let ownerInfo = '';
    if (currentUserRole === 'owner' && agent.user_id !== currentUser.id) {
        ownerInfo = `<div class="info-row"><span class="label">👤 Pemilik Data</span><span class="value">CS Lain</span></div>`;
    }
    
    // ===== BUILD BODY HTML =====
    let bodyHTML = `
        <!-- IDENTITAS -->
        <div class="info-card">
            <div class="card-title">📋 Identitas</div>
            <div class="info-row"><span class="label">🏷️ Nama Agent</span><span class="value">${escapeHtml(agent.agent_name || agent.nama || '-')}</span></div>
            <div class="info-row"><span class="label">👤 Nama Lengkap</span><span class="value">${escapeHtml(agent.nama || '-')}</span></div>
            <div class="info-row"><span class="label">🆔 ID Agent</span><span class="value">${escapeHtml(agent.agent_id || '-')}</span></div>
            <div class="info-row"><span class="label">📱 Nomor HP</span><span class="value">${escapeHtml(agent.hp || '-')}</span></div>
            <div class="info-row"><span class="label">🏷️ Tipe Agent</span><span class="value">${typeMap[agent.agent_type] || agent.agent_type || '-'}</span></div>
            <div class="info-row" style="border-bottom: none;"><span class="label">📱 Aplikasi</span><span class="value">${escapeHtml(agent.apk || '-')}</span></div>
        </div>
        
        <!-- UPLINE -->
        <div class="info-card">
            <div class="card-title">👤 Upline</div>
            <div class="info-row"><span class="label">Nama Upline</span><span class="value">${escapeHtml(agent.upline || '-')}</span></div>
            <div class="info-row" style="border-bottom: none;"><span class="label">📞 HP Upline</span><span class="value">${escapeHtml(agent.upline_phone || '-')}</span></div>
        </div>
        
        <!-- ADMIN & FEE -->
        <div class="info-card">
            <div class="card-title">💰 Admin & Fee</div>
            <div class="info-row"><span class="label">🏷️ Admin</span><span class="value" style="font-size: 11px;">Postpaid: ${formatRupiah(agent.admin_postpaid || 0)} | Prepaid: ${formatRupiah(agent.admin_prepaid || 0)} | Nontaglis: ${formatRupiah(agent.admin_nontaglis || 0)}</span></div>
            <div class="info-row" style="border-bottom: none;"><span class="label">💰 Fee</span><span class="value" style="font-size: 11px;">Postpaid: ${formatRupiah(agent.fee_postpaid || 0)} | Prepaid: ${formatRupiah(agent.fee_prepaid || 0)} | Nontaglis: ${formatRupiah(agent.fee_nontaglis || 0)}</span></div>
        </div>
        
        <!-- BANK & REKENING -->
        <div class="info-card">
            <div class="card-title">🏦 Bank & Rekening</div>
            <div class="info-row"><span class="label">Jenis Bank</span><span class="value">${escapeHtml(agent.jenis_bank || '-')}</span></div>
            <div class="info-row"><span class="label">🔢 Nomor Rekening</span><span class="value">${escapeHtml(agent.nomor_rekening || '-')}</span></div>
            <div class="info-row"><span class="label">📛 Atas Nama Rekening</span><span class="value">${escapeHtml(agent.atas_nama_rekening || '-')}</span></div>
            <div class="info-row" style="border-bottom: none;"><span class="label">🆔 CID</span><span class="value">${escapeHtml(agent.cid || '-')}</span></div>
        </div>
        
        <!-- TIMESTAMP -->
        <div class="info-card" style="margin-bottom: 0;">
            <div class="card-title">📅 Informasi</div>
            <div class="info-row"><span class="label">📅 Tanggal Dibuat</span><span class="value">${agent.created_at ? formatDateDDMMYYYY(agent.created_at) : '-'}</span></div>
            <div class="info-row" style="border-bottom: none;"><span class="label">📅 Terakhir Update</span><span class="value">${agent.updated_at ? formatDateDDMMYYYY(agent.updated_at) : '-'}</span></div>
            ${ownerInfo}
        </div>
    `;
    
    // ===== FOOTER BUTTONS =====
    let footerButtons = [
        { label: 'Tutup', class: 'btn-outline', onClick: `closeModalNew('detailModalAgent')` }
    ];
    
    if (agent.hp) {
        footerButtons.push({ label: '💬 WhatsApp', class: 'btn-success', onClick: `closeModalNew('detailModalAgent'); openWA('${agent.hp}')` });
    }
    
    const footerHTML = footerButtons.map(btn => 
        `<button class="btn ${btn.class}" onclick="${btn.onClick}">${btn.label}</button>`
    ).join('');
    
    // ===== TAMPILKAN MODAL =====
    createModalNew(
        '👤 Detail Agent',
        'Informasi lengkap agent',
        bodyHTML,
        footerHTML,
        'detailModalAgent'
    );
}

// ========== PROFILE PHOTO FUNCTIONS ==========
function initProfilePhoto() {
    const profileImg = document.getElementById('profileImg');
    const previewFoto = document.getElementById('previewFoto');
    const cameraIconBtn = document.getElementById('cameraIconBtn');
    const profileFotoInput = document.getElementById('profileFoto');
    
    if (!profileImg) return;
    
    // ===== PERBAIKAN: Click profile untuk buka modal =====
    profileImg.addEventListener('click', () => {
        loadProfileData();
        showModal('profileModal');
    });
    
    // ===== PERBAIKAN: Preview foto di modal bisa diklik =====
    if (previewFoto) {
        // Pastikan previewFoto bisa diklik
        previewFoto.style.cursor = 'pointer';
        previewFoto.style.pointerEvents = 'auto';
        
        previewFoto.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Preview foto diklik'); // Debug
            const src = this.src;
            if (src && src !== 'https://i.pravatar.cc/100' && !src.includes('pravatar')) {
                showPhotoPreview(src);
            } else {
                showNotifTop('📸 Belum ada foto profil untuk diperbesar');
            }
        });
    }
    
    if (cameraIconBtn) {
        cameraIconBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (profileFotoInput) profileFotoInput.click();
        });
    }
    
    if (profileFotoInput) {
        profileFotoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                if (file.size > 5 * 1024 * 1024) {
                    showNotifTop('⚠️ Ukuran foto maksimal 5MB!', true);
                    return;
                }
                
                // Kompres gambar
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = new Image();
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        const MAX_SIZE = 300;
                        let width = img.width;
                        let height = img.height;
                        
                        if (width > height) {
                            if (width > MAX_SIZE) {
                                height = Math.round((height * MAX_SIZE) / width);
                                width = MAX_SIZE;
                            }
                        } else {
                            if (height > MAX_SIZE) {
                                width = Math.round((width * MAX_SIZE) / height);
                                height = MAX_SIZE;
                            }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                        
                        if (previewFoto) previewFoto.src = compressedDataUrl;
                        if (profileImg) profileImg.src = compressedDataUrl;
                        showNotifTop('📷 Foto berhasil dipilih. Klik Simpan untuk menyimpan.');
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                showNotifTop('⚠️ Silakan pilih file gambar!', true);
            }
        });
    }
}

function showPhotoPreview(imageUrl) {
    const previewModal = document.getElementById('previewPhotoModal');
    const previewImage = document.getElementById('previewPhotoLarge');
    
    if (!previewModal) {
        console.warn('Preview modal not found');
        return;
    }
    
    if (!previewImage) {
        console.warn('Preview image element not found');
        return;
    }
    
    // ===== PERBAIKAN: Set image dan tampilkan modal =====
    previewImage.src = imageUrl;
    previewImage.alt = 'Foto Profil';
    previewImage.style.display = 'block';
    previewImage.style.maxWidth = '100%';
    previewImage.style.maxHeight = '70vh';
    previewImage.style.objectFit = 'contain';
    previewImage.style.margin = '0 auto';
    
    console.log('Showing photo preview:', imageUrl.substring(0, 50) + '...');
    showModal('previewPhotoModal');
}

// ===== PERBAIKAN: Load profile data =====
function loadProfileData() {
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');
    const previewFoto = document.getElementById('previewFoto');
    const profileImg = document.getElementById('profileImg');
    
    if (profileName) profileName.value = currentUserName || '';
    if (profileEmail && currentUser) profileEmail.value = currentUser.email || '';
    
    // ===== PERBAIKAN: Set foto preview =====
    if (previewFoto && profileImg) {
        // Gunakan foto dari profileImg, jika tidak ada gunakan icon default
        const fotoSrc = profileImg.src;
        if (fotoSrc && !fotoSrc.includes('pravatar') && fotoSrc !== 'https://i.pravatar.cc/40') {
            previewFoto.src = fotoSrc;
        } else {
            // Gunakan icon default yang stabil
            previewFoto.src = 'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    <rect width="100" height="100" rx="50" fill="#4f46e5"/>
                    <text x="50" y="65" font-size="40" text-anchor="middle" fill="white" font-family="Arial">👤</text>
                </svg>
            `);
        }
    }
    
    // Load HP secara async
    if (profilePhone && currentUser) {
        profilePhone.value = '';
        window.db.from('users')
            .select('hp')
            .eq('id', currentUser.id)
            .single()
            .then(({ data }) => {
                if (data && data.hp) {
                    profilePhone.value = data.hp.replace('+62', '');
                }
            })
            .catch(() => {});
    }
}

// ===== Save profile =====
async function saveUserProfile() {
    const nama = document.getElementById('profileName')?.value;
    let hp = document.getElementById('profilePhone')?.value;
    const foto = document.getElementById('previewFoto')?.src;
    const profileImg = document.getElementById('profileImg');
    const saveBtn = document.getElementById('saveProfileBtn');
    
    if (!nama) {
        showNotifTop('⚠️ Nama wajib diisi!', true);
        return false;
    }
    
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = '⏳ Menyimpan...';
        saveBtn.style.opacity = '0.6';
    }
    
    showNotifTop('⏳ Menyimpan profile...', false);
    
    try {
        if (hp) {
            hp = hp.replace(/[^\d]/g, '');
            if (hp.startsWith('0')) hp = hp.substring(1);
            if (hp && !hp.startsWith('62')) hp = '62' + hp;
            hp = '+' + hp;
        }
        
        const { data: existingUser, error: fetchError } = await window.db
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
        }
        
        // ===== PERBAIKAN: Hapus foto lama jika ada =====
        let fotoUrl = existingUser?.foto || null;
        const isDefaultFoto = foto && (foto.includes('pravatar') || foto.includes('data:image/svg'));
        
        if (foto && !isDefaultFoto && !foto.startsWith('https://i.pravatar.cc')) {
            try {
                // ===== 1. HAPUS FOTO LAMA =====
                const oldFotoUrl = existingUser?.foto;
                if (oldFotoUrl && !oldFotoUrl.includes('pravatar') && !oldFotoUrl.includes('data:image')) {
                    try {
                        // Extract filename dari URL
                        const oldFileName = oldFotoUrl.split('/').pop().split('?')[0];
                        if (oldFileName) {
                            const { error: deleteError } = await window.db.storage
                                .from('profiles')
                                .remove([oldFileName]);
                            
                            if (deleteError) {
                                console.warn('⚠️ Gagal menghapus foto lama:', deleteError);
                                // Lanjutkan proses meskipun hapus gagal
                            } else {
                                console.log('✅ Foto lama berhasil dihapus:', oldFileName);
                            }
                        }
                    } catch (err) {
                        console.warn('⚠️ Error saat menghapus foto lama:', err);
                    }
                }
                
                // ===== 2. UPLOAD FOTO BARU =====
                const response = await fetch(foto);
                const blob = await response.blob();
                
                const fileName = `profile_${currentUser.id}_${Date.now()}.jpg`;
                const { data: uploadData, error: uploadError } = await window.db.storage
                    .from('profiles')
                    .upload(fileName, blob, {
                        contentType: 'image/jpeg',
                        upsert: true
                    });
                
                if (uploadError) {
                    console.warn('Upload to storage failed:', uploadError);
                    fotoUrl = foto;
                } else {
                    const { data: publicUrlData } = window.db.storage
                        .from('profiles')
                        .getPublicUrl(fileName);
                    fotoUrl = publicUrlData.publicUrl;
                }
            } catch (err) {
                console.warn('Error uploading photo:', err);
                fotoUrl = foto;
            }
        } else if (isDefaultFoto) {
            // Jika foto default, jangan ubah
            fotoUrl = existingUser?.foto || null;
        }
        
        const updateData = {
            id: currentUser.id,
            nama: nama,
            hp: hp || null,
            foto: fotoUrl,
            email: currentUser.email,
            role: existingUser?.role || 'cs',
            updated_at: new Date().toISOString()
        };
        
        const { error } = await window.db
            .from('users')
            .upsert(updateData);
        
        if (error) throw error;
        
        currentUserName = nama;
        document.getElementById('topUserName').innerText = nama;
        
        // ===== PERBAIKAN: Update profile image =====
        if (profileImg) {
            if (fotoUrl) {
                profileImg.src = fotoUrl;
            } else {
                // Gunakan icon default yang stabil
                profileImg.src = 'data:image/svg+xml,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                        <rect width="100" height="100" rx="50" fill="#4f46e5"/>
                        <text x="50" y="65" font-size="40" text-anchor="middle" fill="white" font-family="Arial">👤</text>
                    </svg>
                `);
            }
        }
        
        showNotifTop('✅ Profile berhasil disimpan!');
        closeModal('profileModal');
        return true;
        
    } catch (error) {
        console.error('Save profile error:', error);
        showNotifTop('❌ Gagal menyimpan profile: ' + error.message, true);
        return false;
        
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 Simpan';
            saveBtn.style.opacity = '1';
        }
    }
}

// ========== FUNGSI UNTUK MEMBERSIHKAN FOTO LAMA ==========
async function cleanupOldProfilePhotos() {
    try {
        // Ambil semua foto profil yang ada di storage
        const { data: files, error } = await window.db.storage
            .from('profiles')
            .list();
        
        if (error) {
            console.warn('⚠️ Gagal mengambil daftar file:', error);
            return;
        }
        
        if (!files || files.length === 0) return;
        
        // Ambil semua user ID yang aktif
        const { data: users, error: userError } = await window.db
            .from('users')
            .select('id');
        
        if (userError) {
            console.warn('⚠️ Gagal mengambil daftar user:', userError);
            return;
        }
        
        const activeUserIds = new Set(users.map(u => u.id));
        
        // File yang tidak terkait dengan user aktif akan dihapus
        const toDelete = [];
        files.forEach(file => {
            // Ekstrak user_id dari nama file: profile_{userId}_{timestamp}.jpg
            const match = file.name.match(/^profile_([a-f0-9-]+)_\d+\.jpg$/i);
            if (match) {
                const userId = match[1];
                if (!activeUserIds.has(userId)) {
                    toDelete.push(file.name);
                }
            } else if (!file.name.includes('profile_')) {
                // Hapus file yang tidak sesuai format
                toDelete.push(file.name);
            }
        });
        
        if (toDelete.length > 0) {
            console.log(`🗑️ Menghapus ${toDelete.length} file foto yang tidak terpakai`);
            const { error: deleteError } = await window.db.storage
                .from('profiles')
                .remove(toDelete);
            
            if (deleteError) {
                console.warn('⚠️ Gagal menghapus file:', deleteError);
            } else {
                console.log('✅ File foto berhasil dibersihkan');
            }
        }
        
    } catch (err) {
        console.warn('⚠️ Error cleanup photos:', err);
    }
}

// ========== PANGGIL CLEANUP SAAT APP START ==========
// Tambahkan di bagian checkAuth atau setelah login
async function runPhotoCleanup() {
    try {
        await cleanupOldProfilePhotos();
    } catch (e) {
        // Abaikan error
    }
}

// Panggil setelah login berhasil
// Tambahkan di dalam checkAuth() setelah currentUser diset:
// setTimeout(runPhotoCleanup, 5000);

// ========== HAPUS FOTO PROFIL DARI STORAGE ==========
async function deleteProfilePhotoFromStorage(userId) {
    try {
        // Ambil data user untuk mendapatkan URL foto
        const { data: user, error } = await window.db
            .from('users')
            .select('foto')
            .eq('id', userId)
            .single();
        
        if (error || !user || !user.foto) {
            return;
        }
        
        const fotoUrl = user.foto;
        
        // Cek apakah URL valid dan bukan default
        if (fotoUrl.includes('pravatar') || 
            fotoUrl.includes('data:image') ||
            fotoUrl.includes('data:image/svg')) {
            return;
        }
        
        // Extract filename
        const fileName = fotoUrl.split('/').pop().split('?')[0];
        if (!fileName) return;
        
        // Hapus dari storage
        const { error: deleteError } = await window.db.storage
            .from('profiles')
            .remove([fileName]);
        
        if (deleteError) {
            console.warn('⚠️ Gagal hapus foto dari storage:', deleteError);
        } else {
            console.log('✅ Foto profil berhasil dihapus dari storage:', fileName);
        }
        
    } catch (err) {
        console.warn('⚠️ Error delete foto:', err);
    }
}

// Fungsi untuk hapus foto saat user dihapus
async function deleteUserWithPhoto(userId) {
    // Hapus foto terlebih dahulu
    await deleteProfilePhotoFromStorage(userId);
    
    // Kemudian hapus user
    await window.db.from('users').delete().eq('id', userId);
}

// ========== EDIT DEADLINE FUNCTIONS ==========
function openEditDeadlineModal(id, type, currentDeadline) {
    currentEditItem = id;
    currentEditType = type;
    
    const existingModal = document.querySelector('.edit-deadline-modal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'modal edit-deadline-modal';
    modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0, 0, 0, 0.7) !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        z-index: 999999999 !important;
        backdrop-filter: blur(5px) !important;
        pointer-events: auto !important;
    `;
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px; z-index: 999999999; pointer-events: auto;">
            <h3>📅 Edit Deadline</h3>
            <div class="modal-subtitle">Ubah tanggal deadline untuk data ini</div>
            <div style="padding: 20px;">
                <label for="editDeadlineDateInput">Tanggal Deadline Baru <span class="required">*</span></label>
                <input type="date" id="editDeadlineDateInput" style="width:100%; padding: 12px; border-radius: 14px; border: 1.5px solid #e5e7eb; margin-top: 8px;">
            </div>
            <div style="background: #fef3c7; padding: 10px; border-radius: 10px; margin: 0 20px 10px 20px;">
                <p style="font-size: 12px; color: #d97706; margin: 0;">⚠️ <strong>Peringatan:</strong> Perubahan deadline harus diketahui oleh Owner/Atasan.</p>
            </div>
            <div class="modal-buttons" style="display: flex; gap: 12px; padding: 16px 20px 20px;">
                <button id="saveDeadlineBtnModal" class="btn-primary" style="flex: 1; cursor: pointer;">💾 Simpan Perubahan</button>
                <button id="cancelDeadlineBtnModal" class="btn-outline" style="flex: 1; cursor: pointer;">❌ Batal</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    
    const dateInput = document.getElementById('editDeadlineDateInput');
    if (dateInput) {
        dateInput.value = currentDeadline || getTodayDate();
    }
    
    // ===== TOMBOL SIMPAN =====
    document.getElementById('saveDeadlineBtnModal').onclick = async () => {
        const newDeadline = document.getElementById('editDeadlineDateInput').value;
        if (!newDeadline) {
            showNotifTop('⚠️ Tanggal deadline harus diisi!', true);
            return;
        }
        try {
            if (currentEditType === 'customer') {
                await window.db.from('customers').update({ tanggal: newDeadline }).eq('id', currentEditItem);
                showNotifTop(`✅ Deadline customer berhasil diubah menjadi ${newDeadline}`);
                await loadCustomers();
            } else if (currentEditType === 'prospek') {
                await window.db.from('prospek').update({ deadline: newDeadline }).eq('id', currentEditItem);
                showNotifTop(`✅ Deadline prospek berhasil diubah menjadi ${newDeadline}`);
                await loadProspek();
            }
            modal.remove();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
        } catch (e) {
            showNotifTop('❌ Gagal: ' + e.message, true);
        }
    };
    
    // ===== TOMBOL BATAL =====
    document.getElementById('cancelDeadlineBtnModal').onclick = () => {
        modal.remove();
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    };
    
    // ===== KLIK DI LUAR MODAL =====
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
        }
    };
    
    applyDarkModeToModal(modal);
}

async function saveDeadline() {
    const newDeadline = document.getElementById('editDeadlineDate').value;
    if (!newDeadline) {
        showNotifTop('⚠️ Tanggal deadline harus diisi!', true);
        return;
    }
    
    try {
        if (currentEditType === 'customer') {
            await window.db.from('customers').update({ tanggal: newDeadline }).eq('id', currentEditItem);
            showNotifTop(`✅ Deadline customer berhasil diubah menjadi ${newDeadline}`);
            await loadCustomers();
        } else if (currentEditType === 'prospek') {
            await window.db.from('prospek').update({ deadline: newDeadline }).eq('id', currentEditItem);
            showNotifTop(`✅ Deadline prospek berhasil diubah menjadi ${newDeadline}`);
            await loadProspek();
        }
        closeModal('editDeadlineModal');
    } catch (e) {
        showNotifTop('❌ Gagal: ' + e.message, true);
    }
}

// ========== WHATSAPP FUNCTIONS ==========
function openWA(hp) {
    if (!hp) {
        showNotifTop('⚠️ Nomor WhatsApp tidak ditemukan!', true);
        return;
    }
    let cleanNomor = hp.toString().replace(/[^\d+]/g, '');
    if (!cleanNomor.startsWith('+')) {
        cleanNomor = cleanNomor.replace(/^0+/, '');
        if (cleanNomor.startsWith('62')) cleanNomor = '+' + cleanNomor;
        else cleanNomor = '+62' + cleanNomor;
    }
    window.open('https://wa.me/' + encodeURIComponent(cleanNomor), '_blank');
}

function openWAById(customerId) {
    const customer = customersData.find(c => c.id === customerId);
    if (customer && customer.hp) openWA(customer.hp);
    const prospek = prospekData.find(p => p.id === customerId);
    if (prospek && prospek.hp) openWA(prospek.hp);
}

// ========== OPEN DETAIL CUSTOMER ==========
async function openDetailCustomer(id) {
    const customer = customersData.find(c => c.id === id);
    if (!customer) {
        showNotifTop('❌ Data tidak ditemukan!', true);
        return;
    }
    
    // ===== AMBIL DATA DARI DB TRANSAKSI =====
    let dataTransaksi = null;
    
    if (customer.agent_id) {
        const { data } = await window.db
            .from('db_transaksi')
            .select('*')
            .eq('agent_id', customer.agent_id)
            .maybeSingle();
        
        if (data) {
            const jumlah = data.progres_jumlah || 0;
            let jenisColor = '#ef4444';
            let jenisText = 'Turun';
            let displayValue = '-' + Math.abs(jumlah).toLocaleString();
            
            if (data.progres_jenis === 'naik') {
                jenisColor = '#10b981';
                jenisText = 'Naik';
                displayValue = '+' + jumlah.toLocaleString();
            } else if (data.progres_jenis === 'turun') {
                jenisColor = '#ef4444';
                jenisText = 'Turun';
                displayValue = '-' + Math.abs(jumlah).toLocaleString();
            } else if (data.progres_jenis === 'tidak_transaksi') {
                jenisColor = '#6b7280';
                jenisText = 'Tidak Transaksi';
                displayValue = '0';
            } else {
                if (jumlah > 0) {
                    displayValue = '+' + jumlah.toLocaleString();
                    jenisColor = '#10b981';
                    jenisText = 'Naik';
                } else if (jumlah < 0) {
                    displayValue = '-' + Math.abs(jumlah).toLocaleString();
                    jenisColor = '#ef4444';
                    jenisText = 'Turun';
                } else {
                    displayValue = '0';
                    jenisColor = '#f59e0b';
                    jenisText = 'Normal';
                }
            }
            
            dataTransaksi = {
                periode_lalu: data.periode_bulan_lalu || 'Tidak tersedia',
                periode_ini: data.periode_bulan_ini || 'Tidak tersedia',
                transaksi_lalu: data.transaksi_bulan_lalu || 0,
                transaksi_ini: data.transaksi_bulan_ini || 0,
                progres_jenis: data.progres_jenis || 'normal',
                progres_jumlah: jumlah,
                status: data.status || 'pending_import',
                jenis_color: jenisColor,
                jenis_text: jenisText,
                display_value: displayValue
            };
        }
    }
    
    const statusText = customer.status === 'followup' ? 'Follow Up' : customer.status;
    const statusClass = customer.status === 'followup' ? 'status-followup' : `status-${customer.status}`;
    
    // ===== RIWAYAT FOLLOWUP =====
    const followupHistory = customer.followup_history || [];
    const hasHistory = followupHistory.length > 0;
    
    let ownerInfo = '';
    if (currentUserRole === 'owner' && customer.user_id !== currentUser.id) {
        try {
            const { data: userDoc } = await window.db.from('users').select('nama').eq('id', customer.user_id).single();
            const ownerName = userDoc?.nama || 'CS Agent';
            ownerInfo = `<div class="info-row"><span class="label">👤 Pemilik Data</span><span class="value">${escapeHtml(ownerName)}</span></div>`;
        } catch(e) { console.error(e); }
    }
    
    // ===== BUILD BODY HTML =====
    let bodyHTML = `
        <!-- INFO UTAMA -->
        <div class="info-card">
            <div class="card-title">📋 Identitas</div>
            <div class="info-row"><span class="label">🆔 ID Agent</span><span class="value">${escapeHtml(customer.agent_id || '-')}</span></div>
            <div class="info-row"><span class="label">👤 Nama</span><span class="value">${escapeHtml(customer.nama)}</span></div>
            <div class="info-row"><span class="label">📱 Nomor HP</span><span class="value">${escapeHtml(customer.hp)}</span></div>
            <div class="info-row"><span class="label">📱 Aplikasi</span><span class="value">${escapeHtml(customer.apk || '-')}</span></div>
            <div class="info-row"><span class="label">👤 Upline</span><span class="value">${escapeHtml(customer.upline_name || '-')}</span></div>
            <div class="info-row"><span class="label">📞 HP Upline</span><span class="value">${escapeHtml(customer.upline_phone || '-')}</span></div>
            <div class="info-row"><span class="label">📊 Status</span><span class="value"><span class="status-badge ${statusClass}">${escapeHtml(statusText)}</span></span></div>
            ${dataTransaksi ? `
                <div class="info-row"><span class="label">📊 Jenis Progres</span><span class="value" style="color: ${dataTransaksi.jenis_color}; font-weight: 600;">${dataTransaksi.jenis_text}</span></div>
                <div class="info-row" style="border-bottom: none;"><span class="label">📊 Selisih</span><span class="value" style="color: ${dataTransaksi.jenis_color}; font-weight: 700; font-size: 18px;">${dataTransaksi.display_value}</span></div>
            ` : `
                <div class="info-row" style="border-bottom: none;"><span class="label">📊 Data Transaksi</span><span class="value" style="color: #9ca3af;">Belum ada data</span></div>
            `}
        </div>
    `;
    
    // ===== RIWAYAT KOMUNIKASI (CHAT MODERN) =====
    bodyHTML += `
        <div class="info-card" style="margin-bottom: 0;">
            <div class="card-title">💬 Riwayat Komunikasi</div>
            <div id="chatModernDetailCustomer" class="chat-modern-container" style="max-height: 300px; min-height: ${hasHistory ? '150px' : '80px'};">
                <!-- Akan diisi oleh JavaScript -->
            </div>
        </div>
    `;
    
    // ===== DATA PERBANDINGAN TRANSAKSI =====
    if (dataTransaksi) {
        bodyHTML += `
            <div class="info-card">
                <div class="card-title">📊 Data Perbandingan Transaksi</div>
                <div class="comparison-grid">
                    <div class="comparison-item">
                        <div class="comparison-label">PERIODE LALU</div>
                        <div class="comparison-value">${(dataTransaksi.transaksi_lalu || 0).toLocaleString()}</div>
                        <div class="comparison-period">${dataTransaksi.periode_lalu}</div>
                    </div>
                    <div class="comparison-item">
                        <div class="comparison-label">PERIODE INI</div>
                        <div class="comparison-value">${(dataTransaksi.transaksi_ini || 0).toLocaleString()}</div>
                        <div class="comparison-period">${dataTransaksi.periode_ini}</div>
                    </div>
                </div>
                <div class="selisih-row">
                    Selisih: <strong style="color: ${dataTransaksi.jenis_color};">${dataTransaksi.display_value}</strong>
                </div>
            </div>
        `;
    }
    
    // ===== FOLLOWUP DATA =====
    if (customer.followup_data) {
        bodyHTML += `
            <div class="info-card">
                <div class="card-title">✅ Follow Up</div>
                <div class="info-row"><span class="label">Terkirim</span><span class="value">${customer.followup_data.terkirim ? '✅ Ya' : '❌ Tidak'}</span></div>
                <div class="info-row"><span class="label">Dibalas</span><span class="value">${customer.followup_data.dibalas ? '✅ Ya' : '❌ Tidak'}</span></div>
                <div class="info-row"><span class="label">Pesan</span><span class="value" style="font-size: 12px;">${escapeHtml(customer.followup_data.pesan || '-')}</span></div>
                <div class="info-row" style="border-bottom: none;"><span class="label">Balasan</span><span class="value" style="font-size: 12px;">${escapeHtml(customer.followup_data.balasan || '-')}</span></div>
            </div>
        `;
    }
    
    // ===== PENDING DATA =====
    if (customer.pending_data && customer.pending_data.length > 0) {
        const pendingItems = customer.pending_data.map(item => `
            <div class="info-row" style="padding: 4px 0;">
                <span class="label">${item.checked ? '✅' : '⭕'}</span>
                <span class="value" style="font-size: 12px; text-align: left; max-width: 80%;">${escapeHtml(item.text || '(kosong)')}</span>
            </div>
        `).join('');
        
        bodyHTML += `
            <div class="info-card">
                <div class="card-title">📝 Pending (${customer.pending_data.filter(item => item.checked && item.text?.trim() !== '').length}/${customer.pending_data.length})</div>
                ${pendingItems}
            </div>
        `;
    }
    
    // ===== DEADLINE & OWNER =====
    bodyHTML += `
        <div class="info-card" style="margin-bottom: 0;">
            <div class="info-row"><span class="label">📅 Deadline</span><span class="value">${customer.tanggal || '-'} <button class="edit-deadline-btn" onclick="closeModalNew('detailModalCustomer'); openEditDeadlineModal('${id}','customer','${customer.tanggal || ''}')">✏️ Edit</button></span></div>
            ${ownerInfo}
        </div>
    `;
    
    // ===== FOOTER BUTTONS =====
    let footerButtons = [
        { label: 'Tutup', class: 'btn-outline', onClick: `closeModalNew('detailModalCustomer')` },
        { label: '💬 WhatsApp', class: 'btn-success', onClick: `closeModalNew('detailModalCustomer'); openWA('${customer.hp}')` }
    ];
    
    if (customer.status === 'baru') {
        footerButtons.push({ label: '📞 Lanjut Follow Up', class: 'btn-primary', onClick: `closeModalNew('detailModalCustomer'); updateCustomerStatus('${id}', 'followup')` });
    } else if (customer.status === 'followup') {
        footerButtons.push({ label: '✅ Konfirmasi Follow Up', class: 'btn-primary', onClick: `closeModalNew('detailModalCustomer'); openFollowupConfirm('${id}')` });
    } else if (customer.status === 'pending') {
        footerButtons.push({ label: '📝 Kelola Pending', class: 'btn-primary', onClick: `closeModalNew('detailModalCustomer'); openPendingModal('${id}')` });
    } else if (customer.status === 'closing') {
        footerButtons.push({ label: '📁 Pindah ke DB Closing', class: 'btn-primary', onClick: `closeModalNew('detailModalCustomer'); confirmClosingToDB('${id}')` });
    }
    
    footerButtons.push({ label: '🗑️ Hapus', class: 'btn-danger', onClick: `closeModalNew('detailModalCustomer'); deleteCustomer('${id}')` });
    
    const footerHTML = footerButtons.map(btn => 
        `<button class="btn ${btn.class}" onclick="${btn.onClick}">${btn.label}</button>`
    ).join('');
    
    // ===== TAMPILKAN MODAL =====
    createModalNew(
        '📊 Detail Customer',
        'Informasi lengkap data customer',
        bodyHTML,
        footerHTML,
        'detailModalCustomer'
    );
    
    // ===== RENDER CHAT MODERN SETELAH MODAL TAMPIL =====
    setTimeout(() => {
        const chatContainer = document.getElementById('chatModernDetailCustomer');
        if (chatContainer) {
            const history = customer.followup_history || [];
            renderChatModern(history, 'chatModernDetailCustomer', {
                title: 'Riwayat Followup',
                emptyMessage: 'Belum ada riwayat komunikasi',
                showHeader: true,
                showAvatar: true,
                showTime: true,
                showStatus: true
            });
        }
    }, 100);
}

// ========== FIX MODAL SCROLLBAR ==========
function fixModalScrollbar(modal) {
    if (!modal) return;
    
    // Cari semua elemen dengan overflow di dalam modal
    const scrollableElements = modal.querySelectorAll('.popup-body, .modal-content, .detail-popup');
    scrollableElements.forEach(el => {
        // Set scrollbar styling
        el.style.scrollbarWidth = 'thin';
        el.style.scrollbarColor = '#d1d5db transparent';
        
        // Webkit scrollbar
        const style = document.createElement('style');
        style.textContent = `
            .detail-popup .popup-body::-webkit-scrollbar {
                width: 4px !important;
            }
            .detail-popup .popup-body::-webkit-scrollbar-track {
                background: transparent !important;
            }
            .detail-popup .popup-body::-webkit-scrollbar-thumb {
                background: #d1d5db !important;
                border-radius: 4px !important;
            }
            .detail-popup .popup-body::-webkit-scrollbar-thumb:hover {
                background: #9ca3af !important;
            }
            body.dark-mode .detail-popup .popup-body::-webkit-scrollbar-thumb {
                background: #334155 !important;
            }
            body.dark-mode .detail-popup .popup-body::-webkit-scrollbar-thumb:hover {
                background: #475569 !important;
            }
        `;
        document.head.appendChild(style);
    });
}

// ========== OPEN DETAIL PROSPEK ==========
async function openDetailProspek(id) {
    const prospek = prospekData.find(p => p.id === id);
    if (!prospek) {
        showNotifTop('❌ Data tidak ditemukan!', true);
        return;
    }
    
    let ownerInfo = '';
    if (currentUserRole === 'owner' && prospek.user_id !== currentUser.id) {
        try {
            const { data: userDoc } = await window.db.from('users').select('nama').eq('id', prospek.user_id).single();
            const ownerName = userDoc?.nama || 'CS Agent';
            ownerInfo = `<div class="info-row"><span class="label">👤 Pemilik Data</span><span class="value">${escapeHtml(ownerName)}</span></div>`;
        } catch(e) { console.error(e); }
    }
    
    const statusMap = {
        'Baru': 'status-baru',
        'Dihubungi': 'status-dihubungi',
        'Negosiasi': 'status-negosiasi',
        'Tertarik': 'status-tertarik'
    };
    const statusClass = statusMap[prospek.status] || 'status-baru';
    
    const tipeAgent = prospek.tipe_agent || 'AGENT';
    const tipeLabel = tipeAgent === 'CA' ? '🏦 Collecting Agent (CA)' : 
                     tipeAgent === 'Koordinator' ? '👥 Koordinator Wilayah (KORWIL)' : '👤 Agent';
    
    // ===== RIWAYAT DIHUBUNGI =====
    const dihubungiHistory = prospek.dihubungi_history || [];
    const hasHistory = dihubungiHistory.length > 0;
    
    // ===== BUILD BODY HTML =====
    let bodyHTML = `
        <!-- INFO UTAMA -->
        <div class="info-card">
            <div class="card-title">🎯 Identitas Prospek</div>
            <div class="info-row"><span class="label">👤 Nama</span><span class="value">${escapeHtml(prospek.nama)}</span></div>
            <div class="info-row"><span class="label">📱 Nomor HP</span><span class="value">${escapeHtml(prospek.hp)}</span></div>
            <div class="info-row"><span class="label">👤 Upline</span><span class="value">${escapeHtml(prospek.upline_name || '-')}</span></div>
            <div class="info-row"><span class="label">📞 HP Upline</span><span class="value">${escapeHtml(prospek.upline_phone || '-')}</span></div>
            <div class="info-row"><span class="label">🏷️ Tipe Agent</span><span class="value">${escapeHtml(tipeLabel)}</span></div>
            <div class="info-row"><span class="label">📊 Status</span><span class="value"><span class="status-badge ${statusClass}">${escapeHtml(prospek.status || 'Baru')}</span></span></div>
            <div class="info-row" style="border-bottom: none;"><span class="label">📅 Deadline</span><span class="value">${prospek.deadline || '-'} <button class="edit-deadline-btn" onclick="closeModalNew('detailModalProspek'); openEditDeadlineModal('${id}','prospek','${prospek.deadline || ''}')">✏️ Edit</button></span></div>
        </div>
    `;
    
    // ===== RIWAYAT KOMUNIKASI (CHAT MODERN) =====
    bodyHTML += `
        <div class="info-card" style="margin-bottom: 0;">
            <div class="card-title">💬 Riwayat Komunikasi</div>
            <div id="chatModernDetailProspek" class="chat-modern-container" style="max-height: 300px; min-height: ${hasHistory ? '150px' : '80px'};">
                <!-- Akan diisi oleh JavaScript -->
            </div>
        </div>
    `;
    
    // ===== NEGOSIASI DATA =====
    if (prospek.negosiasi_data) {
        const nd = prospek.negosiasi_data;
        bodyHTML += `
            <div class="info-card">
                <div class="card-title">📋 Data Negosiasi</div>
                <div class="info-row"><span class="label">Aplikasi</span><span class="value">${escapeHtml(nd.aplikasi || '-')}</span></div>
                <div class="info-row"><span class="label">Domisili</span><span class="value">${escapeHtml(nd.domisili || '-')}</span></div>
                <div class="info-row"><span class="label">Transaksi</span><span class="value">${escapeHtml(nd.transaksi || '-')}</span></div>
                <div class="info-row"><span class="label">Deposit</span><span class="value">${escapeHtml(nd.deposit || '-')}</span></div>
                <div class="info-row"><span class="label">Tertarik</span><span class="value" style="color: ${nd.tertarik === 'Ya' ? '#10b981' : nd.tertarik === 'Tidak' ? '#ef4444' : '#6b7280'};">${escapeHtml(nd.tertarik || '-')}</span></div>
                <div class="info-row" style="border-bottom: none;"><span class="label">Penawaran</span><span class="value">${escapeHtml(nd.penawaran || '-')}</span></div>
            </div>
        `;
    }
    
    // ===== OWNER =====
    if (ownerInfo) {
        bodyHTML += `
            <div class="info-card" style="margin-bottom: 0;">
                ${ownerInfo}
            </div>
        `;
    }
    
    // ===== FOOTER BUTTONS =====
    let footerButtons = [
        { label: 'Tutup', class: 'btn-outline', onClick: `closeModalNew('detailModalProspek')` },
        { label: '💬 WhatsApp', class: 'btn-success', onClick: `closeModalNew('detailModalProspek'); openWA('${prospek.hp}')` }
    ];
    
    if (prospek.status === 'Baru') {
        footerButtons.push({ label: '📞 Dihubungi', class: 'btn-primary', onClick: `closeModalNew('detailModalProspek'); updateProspekStatus('${id}', 'Dihubungi')` });
    } else if (prospek.status === 'Dihubungi') {
        footerButtons.push({ label: '✅ Konfirmasi Dihubungi', class: 'btn-primary', onClick: `closeModalNew('detailModalProspek'); openProspekDihubungiConfirm('${id}')` });
    } else if (prospek.status === 'Negosiasi') {
        footerButtons.push({ label: '📝 Kelola Negosiasi', class: 'btn-primary', onClick: `closeModalNew('detailModalProspek'); openProspekNegosiasiModal('${id}')` });
        if (prospek.negosiasi_data?.is_complete) {
            footerButtons.push({ label: '⭐ Tertarik', class: 'btn-success', onClick: `closeModalNew('detailModalProspek'); updateProspekStatus('${id}', 'Tertarik')` });
        }
    } else if (prospek.status === 'Tertarik') {
        footerButtons.push({ label: '⭐ Jadikan Member Baru', class: 'btn-primary', onClick: `closeModalNew('detailModalProspek'); confirmTertarikToDB('${id}')` });
    }
    
    footerButtons.push({ label: '🗑️ Hapus', class: 'btn-danger', onClick: `closeModalNew('detailModalProspek'); deleteProspek('${id}')` });
    
    const footerHTML = footerButtons.map(btn => 
        `<button class="btn ${btn.class}" onclick="${btn.onClick}">${btn.label}</button>`
    ).join('');
    
    // ===== TAMPILKAN MODAL =====
    createModalNew(
        '🎯 Detail Prospek',
        'Informasi lengkap data prospek',
        bodyHTML,
        footerHTML,
        'detailModalProspek'
    );
    
    // ===== RENDER CHAT MODERN SETELAH MODAL TAMPIL =====
    setTimeout(() => {
        const chatContainer = document.getElementById('chatModernDetailProspek');
        if (chatContainer) {
            const history = prospek.dihubungi_history || [];
            renderChatModern(history, 'chatModernDetailProspek', {
                title: 'Riwayat Dihubungi',
                emptyMessage: 'Belum ada riwayat komunikasi',
                showHeader: true,
                showAvatar: true,
                showTime: true,
                showStatus: true
            });
        }
    }, 100);
}

// ========== FOLLOWUP CONFIRMATION FUNCTIONS ==========
function openFollowupConfirm(id) {
    currentPendingId = id;
    
    window.db.from('customers').select('*').eq('id', id).single().then(({ data: existingData }) => {
        const followupHistory = existingData?.followup_history || [];
        const followupCount = followupHistory.length;
        const nextFollowupNumber = followupCount + 1;
        const lastPesan = followupHistory.length > 0 ? followupHistory[followupHistory.length - 1].pesan : '';
        
        const modal = createModalWithHighZIndex(`
            <div class="modal-content" style="max-width: 600px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; background: #fff; border-radius: 24px;">
                <!-- HEADER -->
                <div style="padding: 16px 24px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;">
                    <div>
                        <h3 style="font-size: 18px; margin: 0; color: #1f2937;">💬 Konfirmasi Follow Up #${nextFollowupNumber}</h3>
                        <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">
                            📞 ${escapeHtml(existingData?.nama || 'Customer')}
                        </div>
                    </div>
                    <button onclick="closeDynamicModal(this.closest('.modal'))" style="
                        background: none;
                        border: none;
                        font-size: 28px;
                        cursor: pointer;
                        color: #6b7280;
                        padding: 0 4px;
                        line-height: 1;
                    ">✕</button>
                </div>
                
                <!-- ===== RIWAYAT CHAT ===== -->
                <div style="padding: 12px 20px 8px; flex-shrink: 0;">
                    <div id="chatModernConfirmFollowup" class="chat-modern-container" style="max-height: 250px; min-height: 120px;">
                        <!-- Akan diisi oleh JavaScript -->
                    </div>
                </div>
                
                <!-- ===== FORM INPUT ===== -->
                <div style="padding: 0 20px 12px; flex-shrink: 0;">
                    <!-- Checklist -->
                    <div class="chat-modern-checklist">
                        <input type="checkbox" id="followup_terkirim" ${existingData?.followup_data?.terkirim ? 'checked' : ''}>
                        <span class="checklist-label">✅ Pesan sudah terkirim dan terbaca <span class="required">*</span></span>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                        <div style="flex: 1;">
                            <label style="font-size: 12px; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">
                                ✏️ Pesan Dikirim <span style="color: #ef4444;">*</span>
                            </label>
                            <textarea id="followup_pesan" rows="2" placeholder="Tulis pesan yang dikirim..." style="
                                width:100%; 
                                padding: 10px 14px; 
                                border-radius: 12px; 
                                border: 1.5px solid #e5e7eb; 
                                font-size: 13px;
                                resize: vertical;
                                background: #fafcff;
                                color: #1f2937;
                                transition: all 0.3s;
                            ">${escapeHtml(existingData?.followup_data?.pesan || '')}</textarea>
                        </div>
                    </div>
                    
                    <div class="chat-modern-checklist">
                        <input type="checkbox" id="followup_dibalas" ${existingData?.followup_data?.dibalas ? 'checked' : ''}>
                        <span class="checklist-label">💬 Sudah di balas <span style="color: #ef4444;">*</span></span>
                    </div>
                    
                    <div style="margin-bottom: 4px;">
                        <label style="font-size: 12px; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">
                            💬 Balasan dari Customer <span style="color: #ef4444;">*</span>
                        </label>
                        <textarea id="followup_balasan" rows="2" placeholder="Tulis balasan dari customer..." style="
                            width:100%; 
                            padding: 10px 14px; 
                            border-radius: 12px; 
                            border: 1.5px solid #e5e7eb; 
                            font-size: 13px;
                            resize: vertical;
                            background: #fafcff;
                            color: #1f2937;
                            transition: all 0.3s;
                        ">${escapeHtml(existingData?.followup_data?.balasan || '')}</textarea>
                    </div>
                    
                    <div style="background: #fef3c7; padding: 8px 12px; border-radius: 8px; margin-top: 8px; border-left: 3px solid #f59e0b;">
                        <p style="font-size: 11px; color: #92400e; margin: 0;">
                            ⚠️ <strong>Peringatan:</strong> Pesan harus berbeda dari sebelumnya
                            ${followupCount > 0 ? `<br>📝 Pesan terakhir: "${escapeHtml(lastPesan.substring(0, 30))}${lastPesan.length > 30 ? '...' : ''}"` : ''}
                        </p>
                    </div>
                </div>
                
                <!-- ===== TOMBOL ===== -->
                <div class="modal-buttons" style="display: flex; gap: 10px; flex-wrap: wrap; padding: 12px 20px 16px; border-top: 1px solid #e5e7eb; flex-shrink: 0;">
                    <button id="followupSaveBtn" class="btn-primary" style="flex: 1; padding: 10px; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #4f46e5, #6366f1); color: white;" disabled>💾 Simpan (+1 hari)</button>
                    <button id="followupMoveBtn" class="btn-success" style="flex: 1; padding: 10px; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; background: #10b981; color: white;" disabled>📋 Simpan & Pindah ke Pending</button>
                    <button id="followupConfirmNo" class="btn-danger" style="flex: 1; padding: 10px; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; background: #ef4444; color: white;">📵 Nomor salah</button>
                    <button id="followupConfirmCancel" class="btn-outline" style="flex: 1; padding: 10px; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; background: #f3f4f6; color: #374151;">❌ Batal</button>
                </div>
            </div>
        `, () => closeDynamicModal(modal));
        
        // ===== RENDER CHAT =====
        renderChatModern(followupHistory, 'chatModernConfirmFollowup', {
            title: 'Riwayat Followup',
            emptyMessage: 'Belum ada riwayat komunikasi',
            showHeader: false,
            showAvatar: true,
            showTime: true,
            showStatus: true
        });
        
        // ===== ELEMEN FORM =====
        const cb1 = modal.querySelector('#followup_terkirim');
        const cb2 = modal.querySelector('#followup_dibalas');
        const pesanInput = modal.querySelector('#followup_pesan');
        const balasanInput = modal.querySelector('#followup_balasan');
        const saveBtn = modal.querySelector('#followupSaveBtn');
        const moveBtn = modal.querySelector('#followupMoveBtn');
        const noBtn = modal.querySelector('#followupConfirmNo');
        const cancelBtn = modal.querySelector('#followupConfirmCancel');
        
        // ===== VALIDASI FORM =====
        function validateForm() {
            const isChecked = cb1.checked;
            const hasPesan = pesanInput.value.trim() !== '';
            const hasBalasan = balasanInput.value.trim() !== '';
            const isDibalas = cb2.checked;
            
            const previousPesan = followupHistory.length > 0 ? followupHistory[followupHistory.length - 1].pesan : '';
            const isDifferent = pesanInput.value.trim() !== previousPesan.trim();
            
            const canSave = isChecked && hasPesan && isDifferent;
            const canMove = isChecked && hasPesan && isDifferent && hasBalasan && isDibalas;
            
            saveBtn.disabled = !canSave;
            saveBtn.style.opacity = canSave ? '1' : '0.6';
            saveBtn.style.cursor = canSave ? 'pointer' : 'not-allowed';
            
            moveBtn.disabled = !canMove;
            moveBtn.style.opacity = canMove ? '1' : '0.6';
            moveBtn.style.cursor = canMove ? 'pointer' : 'not-allowed';
        }
        
        cb1.onclick = validateForm;
        cb2.onclick = validateForm;
        pesanInput.oninput = validateForm;
        balasanInput.oninput = validateForm;
        validateForm();
        
        // ===== TOMBOL SIMPAN =====
        saveBtn.onclick = async () => {
            if (saveBtn.disabled) {
                showNotifTop('⚠️ Harap centang checklist dan isi pesan yang berbeda!', true);
                return;
            }
            
            saveBtn.disabled = true;
            saveBtn.textContent = '⏳ Menyimpan...';
            
            try {
                const { data: doc } = await window.db.from('customers').select('*').eq('id', id).single();
                if (!doc) {
                    showNotifTop('❌ Data customer tidak ditemukan!', true);
                    return;
                }
                
                const newDeadline = addDaysFromToday(1);
                const followupHistory = doc.followup_history || [];
                
                const followupData = {
                    terkirim: true,
                    dibalas: cb2.checked,
                    pesan: pesanInput.value,
                    balasan: balasanInput.value || null,
                    timestamp: new Date().toISOString(),
                    followup_number: followupHistory.length + 1
                };
                
                const updatedHistory = [...followupHistory, {
                    pesan: pesanInput.value,
                    balasan: balasanInput.value || null,
                    timestamp: new Date().toISOString(),
                    followup_number: followupHistory.length + 1,
                    dibalas: cb2.checked
                }];
                
                await window.db.from('customers').update({
                    followup_data: followupData,
                    followup_history: updatedHistory,
                    tanggal: newDeadline,
                    pesan_terkirim: pesanInput.value,
                    balasan_diterima: balasanInput.value || null,
                    pesan_dikirim_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }).eq('id', id);
                
                closeDynamicModal(modal);
                showNotifTop(`✅ Followup #${followupHistory.length + 1} tersimpan! Deadline +1 hari menjadi ${newDeadline}`);
                await loadCustomers();
                closeModal('detailModal');
                
            } catch (err) {
                console.error('Error:', err);
                showNotifTop('❌ Gagal: ' + err.message, true);
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = '💾 Simpan (+1 hari)';
            }
        };
        
        // ===== TOMBOL PINDAH =====
        moveBtn.onclick = async () => {
            if (moveBtn.disabled) {
                showNotifTop('⚠️ Harap lengkapi semua data termasuk balasan!', true);
                return;
            }
            
            if (!confirm('Pindahkan data ke Pending? Pastikan semua data sudah lengkap.')) {
                return;
            }
            
            moveBtn.disabled = true;
            moveBtn.textContent = '⏳ Memproses...';
            
            try {
                const { data: doc } = await window.db.from('customers').select('*').eq('id', id).single();
                if (!doc) {
                    showNotifTop('❌ Data customer tidak ditemukan!', true);
                    return;
                }
                
                const newDeadline = addDaysFromToday(1);
                const followupHistory = doc.followup_history || [];
                
                const followupData = {
                    terkirim: true,
                    dibalas: true,
                    pesan: pesanInput.value,
                    balasan: balasanInput.value,
                    timestamp: new Date().toISOString(),
                    followup_number: followupHistory.length + 1
                };
                
                const updatedHistory = [...followupHistory, {
                    pesan: pesanInput.value,
                    balasan: balasanInput.value,
                    timestamp: new Date().toISOString(),
                    followup_number: followupHistory.length + 1,
                    dibalas: true
                }];
                
                await window.db.from('customers').update({
                    followup_data: followupData,
                    followup_history: updatedHistory,
                    status: 'pending',
                    tanggal: newDeadline,
                    pesan_terkirim: pesanInput.value,
                    balasan_diterima: balasanInput.value,
                    pesan_dikirim_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }).eq('id', id);
                
                closeDynamicModal(modal);
                showNotifTop(`✅ Followup #${followupHistory.length + 1} selesai! Data dipindahkan ke Pending. Deadline +1 hari menjadi ${newDeadline}`);
                await loadCustomers();
                closeModal('detailModal');
                
            } catch (err) {
                console.error('Error:', err);
                showNotifTop('❌ Gagal: ' + err.message, true);
            } finally {
                moveBtn.disabled = false;
                moveBtn.textContent = '📋 Simpan & Pindah ke Pending';
            }
        };
        
        // ===== TOMBOL NOMOR SALAH =====
        noBtn.onclick = async () => {
            const { data: doc } = await window.db.from('customers').select('*').eq('id', id).single();
            if (!doc) {
                showNotifTop('❌ Data customer tidak ditemukan!', true);
                return;
            }
            
            if (confirm(`Pindahkan "${escapeHtml(doc.nama)}" ke Database Nomor Salah?`)) {
                try {
                    const nomorSalahData = {
                        nama: doc.nama || 'Tidak ada nama',
                        hp: doc.hp || '',
                        alasan: 'Nomor tidak bisa dihubungi / tidak aktif',
                        deleted_at: new Date().toISOString()
                    };
                    
                    await window.db.from('nomor_salah').insert(nomorSalahData);
                    await window.db.from('customers').delete().eq('id', id);
                    
                    showNotifTop('📵 Data dipindahkan ke Database Nomor Salah');
                    closeDynamicModal(modal);
                    await loadCustomers();
                    await loadDBNomorSalah();
                    closeModal('detailModal');
                } catch (err) {
                    showNotifTop('❌ Gagal: ' + err.message, true);
                }
            }
        };
        
        cancelBtn.onclick = () => {
            closeDynamicModal(modal);
        };
        
        // ===== DARK MODE =====
        applyDarkModeToModal(modal);
        
    }).catch(err => {
        console.error('❌ Error load customer:', err);
        showNotifTop('❌ Gagal memuat data: ' + err.message, true);
    });
}

// ========== PROSPEK DIHUBUNGI CONFIRMATION ==========
// ========== PROSPEK DIHUBUNGI CONFIRMATION (DENGAN EDIT & HAPUS - FIX) ==========
function openProspekDihubungiConfirm(id) {
    currentProspekId = id;
    
    window.db.from('prospek').select('*').eq('id', id).single().then(({ data: existingData }) => {
        const dihubungiHistory = existingData?.dihubungi_history || [];
        const dihubungiCount = dihubungiHistory.length;
        const nextDihubungiNumber = dihubungiCount + 1;
        const lastPesan = dihubungiHistory.length > 0 ? dihubungiHistory[dihubungiHistory.length - 1].pesan : '';
        const namaProspek = existingData?.nama || 'Prospek';
        
        // ===== BUAT MODAL CHAT =====
        const modal = createModalWithHighZIndex(`
            <div class="modal-content" style="max-width: 650px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; background: #fff; border-radius: 24px;">
                <!-- HEADER -->
                <div style="padding: 14px 20px 10px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;">
                    <div>
                        <h3 style="font-size: 16px; margin: 0; color: #1f2937;">💬 Konfirmasi Dihubungi #${nextDihubungiNumber}</h3>
                        <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
                            📞 ${escapeHtml(namaProspek)}
                        </div>
                    </div>
                    <button onclick="closeDynamicModal(this.closest('.modal'))" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #6b7280;
                        padding: 0 4px;
                        line-height: 1;
                    ">✕</button>
                </div>
                
                <!-- ===== RIWAYAT CHAT ===== -->
                <div style="padding: 8px 16px 4px; flex-shrink: 0;">
                    <div id="chatConfirmProspek" class="chat-premium-container" style="max-height: 300px; min-height: 120px; overflow-y: auto;">
                        <!-- Akan diisi oleh JavaScript -->
                    </div>
                </div>
                
                <!-- ===== INFO ===== -->
                <div style="padding: 0 16px 6px; flex-shrink: 0;">
                    <div style="background: #eef2ff; padding: 6px 12px; border-radius: 8px; border-left: 3px solid #4f46e5;">
                        <p style="font-size: 10px; color: #4f46e5; margin: 0;">
                            💡 Pilih peran lalu kirim pesan. Klik ✏️ untuk edit, 🗑️ untuk hapus.
                            ${dihubungiCount > 0 ? `<br>📝 Pesan terakhir: "${escapeHtml(lastPesan.substring(0, 25))}${lastPesan.length > 25 ? '...' : ''}"` : ''}
                        </p>
                    </div>
                </div>
                
                <!-- ===== TOMBOL AKSI ===== -->
                <div class="modal-buttons" style="display: flex; gap: 8px; flex-wrap: wrap; padding: 10px 16px 14px; border-top: 1px solid #e5e7eb; flex-shrink: 0;">
                    <button id="prospekSaveBtn" class="btn-primary" style="flex: 1; padding: 8px; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #4f46e5, #6366f1); color: white; font-size: 12px;" disabled>💾 Simpan (+5 hari)</button>
                    <button id="prospekMoveBtn" class="btn-success" style="flex: 1; padding: 8px; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; background: #10b981; color: white; font-size: 12px;" disabled>📋 Pindah Negosiasi</button>
                    <button id="prospekConfirmNo" class="btn-danger" style="flex: 1; padding: 8px; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; background: #ef4444; color: white; font-size: 12px;">📵 Nomor salah</button>
                    <button id="prospekConfirmCancel" class="btn-outline" style="flex: 1; padding: 8px; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; background: #f3f4f6; color: #374151; font-size: 12px;">❌ Batal</button>
                </div>
            </div>
        `, () => closeDynamicModal(modal));
        
        // ===== VARIABEL STATE =====
        let currentHistory = [...dihubungiHistory];
        let editingIndex = -1;
        let isSending = false;
        let currentRole = 'sender';
        
        // ===== REFERENSI KE ELEMEN =====
        const chatContainer = document.getElementById('chatConfirmProspek');
        
        // ===== FUNGSI UPDATE TOMBOL =====
        function updateButtons() {
            const hasPesan = currentHistory.some(h => h.pesan && h.pesan.trim());
            const hasBalasan = currentHistory.some(h => h.balasan && h.balasan.trim());
            
            const saveBtn = modal.querySelector('#prospekSaveBtn');
            const moveBtn = modal.querySelector('#prospekMoveBtn');
            
            if (saveBtn) {
                saveBtn.disabled = !hasPesan;
                saveBtn.style.opacity = hasPesan ? '1' : '0.6';
                saveBtn.style.cursor = hasPesan ? 'pointer' : 'not-allowed';
            }
            
            if (moveBtn) {
                const canMove = hasPesan && hasBalasan;
                moveBtn.disabled = !canMove;
                moveBtn.style.opacity = canMove ? '1' : '0.6';
                moveBtn.style.cursor = canMove ? 'pointer' : 'not-allowed';
            }
        }
        
        // ===== FUNGSI KIRIM PESAN =====
        async function sendMessage(message, role) {
            if (isSending) {
                showNotifTop('⏳ Sedang mengirim...', true);
                return;
            }
            
            if (!message || message.trim() === '') {
                showNotifTop('⚠️ Pesan tidak boleh kosong!', true);
                return;
            }
            
            isSending = true;
            
            const isSender = role === 'sender';
            
            try {
                // ===== CEK DUPLIKAT =====
                const lastItem = currentHistory.length > 0 ? currentHistory[currentHistory.length - 1] : null;
                if (lastItem && isSender && lastItem.pesan === message) {
                    showNotifTop('⚠️ Pesan sama dengan sebelumnya!', true);
                    isSending = false;
                    return;
                }
                
                const newItem = {
                    pesan: isSender ? message : '',
                    balasan: isSender ? '' : message,
                    timestamp: new Date().toISOString(),
                    dibalas: isSender ? false : true,
                    dihubungi_number: currentHistory.length + 1
                };
                
                currentHistory.push(newItem);
                
                const updateData = {
                    dihubungi_history: currentHistory,
                    updated_at: new Date().toISOString()
                };
                
                if (isSender) {
                    updateData.pesan_terkirim = message;
                    updateData.pesan_dikirim_at = new Date().toISOString();
                } else {
                    updateData.balasan_diterima = message;
                }
                
                await window.db.from('prospek').update(updateData).eq('id', id);
                
                showNotifTop(`✅ ${isSender ? 'Pesan' : 'Balasan'} berhasil dikirim!`);
                
                // ===== RE-RENDER CHAT =====
                renderChatWithActions(currentHistory);
                updateButtons();
                
            } catch (err) {
                console.error('Error:', err);
                showNotifTop('❌ Gagal mengirim: ' + err.message, true);
            } finally {
                isSending = false;
            }
        }
        
        // ===== FUNGSI RENDER CHAT DENGAN EDIT & HAPUS =====
        function renderChatWithActions(history) {
            if (!chatContainer) return;
            
            if (!history || history.length === 0) {
                chatContainer.innerHTML = `
                    <div class="chat-premium-empty">
                        <div class="empty-icon">💬</div>
                        <div class="empty-title">Belum ada riwayat komunikasi</div>
                    </div>
                `;
                // Tetap tambahkan input group meskipun kosong
                renderInputGroup();
                return;
            }
            
            // Batasi 20 pesan terakhir
            const displayHistory = history.slice(-20);
            let html = '';
            let prevDate = '';
            
            displayHistory.forEach((item, index) => {
                const pesan = item.pesan || '';
                const balasan = item.balasan || '';
                const timestamp = item.timestamp || item.created_at || '';
                const dateStr = timestamp ? formatDateDDMMYYYY(timestamp) : '';
                const timeStr = timestamp ? formatTimeMessage(timestamp) : '';
                const isRead = item.dibalas === true || item.dibalas === 'true';
                const actualIndex = history.length - displayHistory.length + index;
                
                if (dateStr && dateStr !== prevDate) {
                    html += `
                        <div class="chat-premium-message system">
                            <div class="chat-premium-bubble">📅 ${dateStr}</div>
                        </div>
                    `;
                    prevDate = dateStr;
                }
                
                // ===== PESAN TERKIRIM (Pengirim - CS Agent) =====
                if (pesan) {
                    const initials = getInitials('CS Agent');
                    html += `
                        <div class="chat-premium-message sent" data-index="${actualIndex}">
                            <div class="chat-premium-avatar sender">
                                <span class="avatar-initials">${initials}</span>
                            </div>
                            <div class="chat-premium-bubble" style="position: relative; padding-right: 55px;">
                                ${escapeHtml(pesan)}
                                <span class="chat-premium-time">
                                    ${timeStr || 'Baru saja'}
                                    <span class="chat-premium-status ${isRead ? 'read' : 'sent'}">
                                        ${isRead ? '✅' : '⏳'}
                                    </span>
                                </span>
                                <div style="position: absolute; top: 4px; right: 4px; display: flex; gap: 4px;">
                                    <button class="btn-edit-message" data-index="${actualIndex}" data-type="pesan" style="
                                        background: #f59e0b;
                                        border: none;
                                        border-radius: 50%;
                                        width: 20px;
                                        height: 20px;
                                        font-size: 10px;
                                        cursor: pointer;
                                        color: white;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                        opacity: 0.7;
                                        transition: opacity 0.2s;
                                    " title="Edit pesan">✏️</button>
                                    <button class="btn-delete-message" data-index="${actualIndex}" data-type="pesan" style="
                                        background: #ef4444;
                                        border: none;
                                        border-radius: 50%;
                                        width: 20px;
                                        height: 20px;
                                        font-size: 10px;
                                        cursor: pointer;
                                        color: white;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                        opacity: 0.7;
                                        transition: opacity 0.2s;
                                    " title="Hapus pesan">🗑️</button>
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                // ===== BALASAN (Penerima - Customer) =====
                if (balasan) {
                    const initials = getInitials('Customer');
                    html += `
                        <div class="chat-premium-message received" data-index="${actualIndex}">
                            <div class="chat-premium-avatar receiver">
                                <span class="avatar-initials">${initials}</span>
                            </div>
                            <div class="chat-premium-bubble" style="position: relative; padding-right: 55px;">
                                ${escapeHtml(balasan)}
                                <span class="chat-premium-time">${timeStr || 'Baru saja'}</span>
                                <div style="position: absolute; top: 4px; right: 4px; display: flex; gap: 4px;">
                                    <button class="btn-edit-message" data-index="${actualIndex}" data-type="balasan" style="
                                        background: #f59e0b;
                                        border: none;
                                        border-radius: 50%;
                                        width: 20px;
                                        height: 20px;
                                        font-size: 10px;
                                        cursor: pointer;
                                        color: white;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                        opacity: 0.7;
                                        transition: opacity 0.2s;
                                    " title="Edit balasan">✏️</button>
                                    <button class="btn-delete-message" data-index="${actualIndex}" data-type="balasan" style="
                                        background: #ef4444;
                                        border: none;
                                        border-radius: 50%;
                                        width: 20px;
                                        height: 20px;
                                        font-size: 10px;
                                        cursor: pointer;
                                        color: white;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                        opacity: 0.7;
                                        transition: opacity 0.2s;
                                    " title="Hapus balasan">🗑️</button>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });
            
            chatContainer.innerHTML = html;
            
            // ===== EVENT LISTENER UNTUK EDIT =====
            chatContainer.querySelectorAll('.btn-edit-message').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const index = parseInt(this.dataset.index);
                    const type = this.dataset.type;
                    openEditMessageModal(index, type);
                });
                // Tampilkan selalu di mobile
                if (window.innerWidth <= 640) {
                    btn.style.opacity = '1';
                }
            });
            
            // ===== EVENT LISTENER UNTUK HAPUS =====
            chatContainer.querySelectorAll('.btn-delete-message').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const index = parseInt(this.dataset.index);
                    const type = this.dataset.type;
                    if (confirm(`Hapus ${type === 'pesan' ? 'pesan' : 'balasan'} ini?`)) {
                        deleteMessage(index, type);
                    }
                });
                // Tampilkan selalu di mobile
                if (window.innerWidth <= 640) {
                    btn.style.opacity = '1';
                }
            });
            
            // ===== SCROLL KE BAWAH =====
            setTimeout(() => {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }, 100);
            
            // ===== TAMBAHKAN INPUT GROUP =====
            renderInputGroup();
        }
        
        // ===== FUNGSI RENDER INPUT GROUP =====
        function renderInputGroup() {
            // Hapus input group lama
            const oldInputGroup = chatContainer.querySelector('.chat-premium-input-group');
            if (oldInputGroup) {
                oldInputGroup.remove();
            }
            
            const inputGroup = document.createElement('div');
            inputGroup.className = 'chat-premium-input-group';
            inputGroup.style.cssText = `
                display: flex !important;
                gap: 8px !important;
                align-items: flex-end !important;
                padding-top: 10px !important;
                border-top: 1px solid #e5e7eb !important;
                flex-wrap: wrap !important;
                flex-shrink: 0 !important;
                background: #f8fafc !important;
                border-radius: 12px !important;
                padding: 10px !important;
                margin-top: 8px !important;
            `;
            
            inputGroup.innerHTML = `
                <div class="chat-premium-input-wrapper" style="flex: 1 !important; min-width: 0 !important;">
                    <textarea class="chat-premium-input" rows="1" placeholder="Tulis pesan..." id="chatPremiumInput" style="
                        width: 100% !important;
                        padding: 10px 14px !important;
                        border: 1.5px solid #e5e7eb !important;
                        border-radius: 12px !important;
                        font-size: 13px !important;
                        resize: none !important;
                        min-height: 44px !important;
                        max-height: 100px !important;
                        background: #ffffff !important;
                        color: #1f2937 !important;
                        transition: all 0.3s !important;
                    "></textarea>
                </div>
                <div class="chat-premium-role-selector" style="display: flex !important; gap: 6px !important; flex-shrink: 0 !important;">
                    <button class="chat-premium-role-btn active-sender" data-role="sender" id="chatRoleSender" style="
                        padding: 8px 14px !important;
                        border-radius: 10px !important;
                        border: 1.5px solid #e5e7eb !important;
                        background: linear-gradient(135deg, #4f46e5, #6366f1) !important;
                        color: #ffffff !important;
                        font-size: 12px !important;
                        font-weight: 600 !important;
                        cursor: pointer !important;
                        transition: all 0.3s !important;
                    ">📤 CS</button>
                    <button class="chat-premium-role-btn" data-role="receiver" id="chatRoleReceiver" style="
                        padding: 8px 14px !important;
                        border-radius: 10px !important;
                        border: 1.5px solid #e5e7eb !important;
                        background: #ffffff !important;
                        color: #6b7280 !important;
                        font-size: 12px !important;
                        font-weight: 600 !important;
                        cursor: pointer !important;
                        transition: all 0.3s !important;
                    ">📥 Customer</button>
                </div>
                <button class="chat-premium-send-btn" id="chatPremiumSendBtn" style="
                    padding: 10px 20px !important;
                    border-radius: 12px !important;
                    border: none !important;
                    background: linear-gradient(135deg, #4f46e5, #6366f1) !important;
                    color: white !important;
                    font-weight: 600 !important;
                    font-size: 13px !important;
                    cursor: pointer !important;
                    transition: all 0.3s !important;
                    min-height: 44px !important;
                    white-space: nowrap !important;
                    flex-shrink: 0 !important;
                ">📤 Kirim</button>
            `;
            
            chatContainer.appendChild(inputGroup);
            
            // ===== SETUP EVENT LISTENERS =====
            setupInputListeners();
        }
        
        // ===== FUNGSI SETUP INPUT LISTENERS =====
        // ===== FUNGSI SETUP INPUT LISTENERS =====
function setupInputListeners() {
    const input = chatContainer.querySelector('#chatPremiumInput');
    const sendBtn = chatContainer.querySelector('#chatPremiumSendBtn');
    const roleSender = chatContainer.querySelector('#chatRoleSender');
    const roleReceiver = chatContainer.querySelector('#chatRoleReceiver');
    
    // ===== ROLE SELECTOR DENGAN ANIMASI =====
    if (roleSender && roleReceiver) {
        // Reset ke sender
        currentRole = 'sender';
        
        // Set class awal
        roleSender.className = 'chat-premium-role-btn active-sender';
        roleReceiver.className = 'chat-premium-role-btn inactive';
        
        // Hapus listener lama dengan clone
        const newRoleSender = roleSender.cloneNode(true);
        const newRoleReceiver = roleReceiver.cloneNode(true);
        roleSender.parentNode.replaceChild(newRoleSender, roleSender);
        roleReceiver.parentNode.replaceChild(newRoleReceiver, roleReceiver);
        
        const freshRoleSender = chatContainer.querySelector('#chatRoleSender');
        const freshRoleReceiver = chatContainer.querySelector('#chatRoleReceiver');
        
        // ===== EVENT SENDER =====
        freshRoleSender.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            currentRole = 'sender';
            
            // Animasi class
            this.className = 'chat-premium-role-btn active-sender';
            freshRoleReceiver.className = 'chat-premium-role-btn inactive';
            
            // Tambahkan efek ripple
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1.02)';
            }, 100);
            
            // Update style inline untuk keamanan
            this.style.background = 'linear-gradient(135deg, #4f46e5, #6366f1)';
            this.style.color = '#ffffff';
            this.style.borderColor = '#4f46e5';
            this.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.3)';
            
            freshRoleReceiver.style.background = '#ffffff';
            freshRoleReceiver.style.color = '#6b7280';
            freshRoleReceiver.style.borderColor = '#e5e7eb';
            freshRoleReceiver.style.boxShadow = 'none';
            
            // Dark mode support
            if (document.body.classList.contains('dark-mode')) {
                freshRoleReceiver.style.background = '#1e293b';
                freshRoleReceiver.style.color = '#94a3b8';
                freshRoleReceiver.style.borderColor = '#334155';
            }
        });
        
        // ===== EVENT RECEIVER =====
        freshRoleReceiver.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            currentRole = 'receiver';
            
            // Animasi class
            this.className = 'chat-premium-role-btn active-receiver';
            freshRoleSender.className = 'chat-premium-role-btn inactive';
            
            // Tambahkan efek ripple
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1.02)';
            }, 100);
            
            // Update style inline untuk keamanan
            this.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            this.style.color = '#ffffff';
            this.style.borderColor = '#10b981';
            this.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
            
            freshRoleSender.style.background = '#ffffff';
            freshRoleSender.style.color = '#6b7280';
            freshRoleSender.style.borderColor = '#e5e7eb';
            freshRoleSender.style.boxShadow = 'none';
            
            // Dark mode support
            if (document.body.classList.contains('dark-mode')) {
                freshRoleSender.style.background = '#1e293b';
                freshRoleSender.style.color = '#94a3b8';
                freshRoleSender.style.borderColor = '#334155';
            }
        });
        
        // ===== TERAPKAN DARK MODE AWAL =====
        if (document.body.classList.contains('dark-mode')) {
            // Sender aktif di dark mode
            freshRoleSender.style.background = 'linear-gradient(135deg, #4f46e5, #6366f1)';
            freshRoleSender.style.color = '#ffffff';
            freshRoleSender.style.borderColor = '#4f46e5';
            
            freshRoleReceiver.style.background = '#1e293b';
            freshRoleReceiver.style.color = '#94a3b8';
            freshRoleReceiver.style.borderColor = '#334155';
        }
    }
    
    // ===== SEND BUTTON =====
    if (sendBtn) {
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        const freshSendBtn = chatContainer.querySelector('#chatPremiumSendBtn');
        
        freshSendBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const inputField = chatContainer.querySelector('#chatPremiumInput');
            const message = inputField ? inputField.value.trim() : '';
            
            if (message) {
                // Efek klik
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 150);
                
                sendMessage(message, currentRole);
                if (inputField) {
                    inputField.value = '';
                    inputField.style.height = 'auto';
                }
            } else {
                showNotifTop('⚠️ Pesan tidak boleh kosong!', true);
            }
        });
    }
    
    // ===== INPUT TEXTAREA =====
    if (input) {
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        const freshInput = chatContainer.querySelector('#chatPremiumInput');
        
        freshInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const message = this.value.trim();
                if (message) {
                    sendMessage(message, currentRole);
                    this.value = '';
                    this.style.height = 'auto';
                } else {
                    showNotifTop('⚠️ Pesan tidak boleh kosong!', true);
                }
            }
        });
        
        freshInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });
        
        // ===== DARK MODE INPUT =====
        if (document.body.classList.contains('dark-mode')) {
            freshInput.style.background = '#0f172a';
            freshInput.style.color = '#f1f5f9';
            freshInput.style.borderColor = '#334155';
        }
    }
}
        
        // ===== FUNGSI EDIT PESAN =====
        function openEditMessageModal(index, type) {
            const item = currentHistory[index];
            if (!item) return;
            
            const currentText = type === 'pesan' ? item.pesan : item.balasan;
            
            // Buat modal edit sederhana
            const editModal = document.createElement('div');
            editModal.className = 'modal edit-message-modal';
            editModal.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: rgba(0, 0, 0, 0.6) !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                z-index: 9999999999 !important;
                backdrop-filter: blur(4px) !important;
            `;
            
            editModal.innerHTML = `
                <div class="modal-content" style="max-width: 450px; padding: 0; overflow: hidden;">
                    <div style="padding: 16px 20px 12px; border-bottom: 1px solid #f0f0f0;">
                        <h3 style="font-size: 16px; margin: 0;">✏️ Edit ${type === 'pesan' ? 'Pesan' : 'Balasan'}</h3>
                    </div>
                    <div style="padding: 16px 20px;">
                        <textarea id="editMessageText" rows="3" style="
                            width: 100%;
                            padding: 10px 14px;
                            border: 1.5px solid #e5e7eb;
                            border-radius: 12px;
                            font-size: 13px;
                            resize: vertical;
                            background: #fafcff;
                            color: #1f2937;
                        ">${escapeHtml(currentText)}</textarea>
                        <div style="margin-top: 8px; font-size: 11px; color: #6b7280;">
                            💡 Edit pesan dan klik Simpan
                        </div>
                    </div>
                    <div class="modal-buttons" style="padding: 12px 20px 16px; border-top: 1px solid #e5e7eb; gap: 10px;">
                        <button id="saveEditMessageBtn" class="btn-primary" style="flex: 1; padding: 10px; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #4f46e5, #6366f1); color: white;">💾 Simpan</button>
                        <button id="cancelEditMessageBtn" class="btn-outline" style="flex: 1; padding: 10px; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; background: #f3f4f6; color: #374151;">❌ Batal</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(editModal);
            
            // ===== TOMBOL SIMPAN =====
            document.getElementById('saveEditMessageBtn').onclick = async function() {
                const newText = document.getElementById('editMessageText').value.trim();
                if (!newText) {
                    showNotifTop('⚠️ Pesan tidak boleh kosong!', true);
                    return;
                }
                
                this.disabled = true;
                this.textContent = '⏳ Menyimpan...';
                
                try {
                    // Update data
                    const updatedItem = { ...item };
                    if (type === 'pesan') {
                        updatedItem.pesan = newText;
                    } else {
                        updatedItem.balasan = newText;
                    }
                    updatedItem.timestamp = new Date().toISOString();
                    
                    currentHistory[index] = updatedItem;
                    
                    // Simpan ke database
                    await window.db.from('prospek').update({
                        dihubungi_history: currentHistory,
                        updated_at: new Date().toISOString()
                    }).eq('id', id);
                    
                    showNotifTop('✅ Pesan berhasil diupdate!');
                    editModal.remove();
                    
                    // Re-render chat
                    renderChatWithActions(currentHistory);
                    updateButtons();
                    
                } catch (err) {
                    console.error('Error:', err);
                    showNotifTop('❌ Gagal update: ' + err.message, true);
                } finally {
                    this.disabled = false;
                    this.textContent = '💾 Simpan';
                }
            };
            
            // ===== TOMBOL BATAL =====
            document.getElementById('cancelEditMessageBtn').onclick = function() {
                editModal.remove();
            };
            
            // Klik di luar modal
            editModal.onclick = function(e) {
                if (e.target === this) {
                    editModal.remove();
                }
            };
            
            // Fokus ke textarea
            setTimeout(() => {
                const textarea = document.getElementById('editMessageText');
                if (textarea) {
                    textarea.focus();
                    textarea.select();
                }
            }, 100);
        }
        
        // ===== FUNGSI HAPUS PESAN =====
        async function deleteMessage(index, type) {
            try {
                const item = currentHistory[index];
                if (!item) return;
                
                // Kosongkan field yang dihapus
                if (type === 'pesan') {
                    item.pesan = '';
                } else {
                    item.balasan = '';
                }
                
                // Jika kedua field kosong, hapus item dari array
                if (!item.pesan && !item.balasan) {
                    currentHistory.splice(index, 1);
                } else {
                    currentHistory[index] = item;
                }
                
                // Simpan ke database
                await window.db.from('prospek').update({
                    dihubungi_history: currentHistory,
                    updated_at: new Date().toISOString()
                }).eq('id', id);
                
                showNotifTop('🗑️ Pesan berhasil dihapus!');
                
                // Re-render chat
                renderChatWithActions(currentHistory);
                updateButtons();
                
            } catch (err) {
                console.error('Error:', err);
                showNotifTop('❌ Gagal hapus: ' + err.message, true);
            }
        }
        
        // ===== RENDER AWAL =====
        renderChatWithActions(currentHistory);
        updateButtons();
        
        // ===== TOMBOL SIMPAN =====
        const saveBtn = modal.querySelector('#prospekSaveBtn');
        if (saveBtn) {
            saveBtn.onclick = async () => {
                if (saveBtn.disabled) {
                    showNotifTop('⚠️ Kirim minimal satu pesan terlebih dahulu!', true);
                    return;
                }
                
                saveBtn.disabled = true;
                saveBtn.textContent = '⏳ Menyimpan...';
                
                try {
                    const newDeadline = addDaysFromToday(5);
                    const lastItem = currentHistory.length > 0 ? currentHistory[currentHistory.length - 1] : {};
                    
                    const dihubungiData = {
                        terkirim: !!lastItem.pesan,
                        dibalas: !!lastItem.balasan,
                        pesan: lastItem.pesan || null,
                        balasan: lastItem.balasan || null,
                        timestamp: lastItem.timestamp || new Date().toISOString(),
                        dihubungi_number: currentHistory.length
                    };
                    
                    await window.db.from('prospek').update({
                        dihubungi_data: dihubungiData,
                        deadline: newDeadline,
                        updated_at: new Date().toISOString()
                    }).eq('id', id);
                    
                    closeDynamicModal(modal);
                    showNotifTop(`✅ Data tersimpan! Deadline +5 hari menjadi ${newDeadline}`);
                    await loadProspek();
                    closeModal('detailModal');
                    
                } catch (err) {
                    console.error('Error:', err);
                    showNotifTop('❌ Gagal: ' + err.message, true);
                } finally {
                    saveBtn.disabled = false;
                    saveBtn.textContent = '💾 Simpan (+5 hari)';
                }
            };
        }
        
        // ===== TOMBOL PINDAH =====
        const moveBtn = modal.querySelector('#prospekMoveBtn');
        if (moveBtn) {
            moveBtn.onclick = async () => {
                if (moveBtn.disabled) {
                    showNotifTop('⚠️ Harap kirim pesan dan balasan terlebih dahulu!', true);
                    return;
                }
                
                if (!confirm('Pindahkan data ke Negosiasi? Pastikan semua data sudah lengkap.')) {
                    return;
                }
                
                moveBtn.disabled = true;
                moveBtn.textContent = '⏳ Memproses...';
                
                try {
                    const newDeadline = addDaysFromToday(5);
                    const lastItem = currentHistory.length > 0 ? currentHistory[currentHistory.length - 1] : {};
                    
                    const dihubungiData = {
                        terkirim: true,
                        dibalas: true,
                        pesan: lastItem.pesan || null,
                        balasan: lastItem.balasan || null,
                        timestamp: lastItem.timestamp || new Date().toISOString(),
                        dihubungi_number: currentHistory.length
                    };
                    
                    await window.db.from('prospek').update({
                        dihubungi_data: dihubungiData,
                        status: 'Negosiasi',
                        deadline: newDeadline,
                        updated_at: new Date().toISOString()
                    }).eq('id', id);
                    
                    closeDynamicModal(modal);
                    showNotifTop(`✅ Data dipindahkan ke Negosiasi! Deadline +5 hari menjadi ${newDeadline}`);
                    await loadProspek();
                    closeModal('detailModal');
                    
                } catch (err) {
                    console.error('Error:', err);
                    showNotifTop('❌ Gagal: ' + err.message, true);
                } finally {
                    moveBtn.disabled = false;
                    moveBtn.textContent = '📋 Pindah Negosiasi';
                }
            };
        }
        
        // ===== TOMBOL NOMOR SALAH =====
        const noBtn = modal.querySelector('#prospekConfirmNo');
        if (noBtn) {
            noBtn.onclick = async () => {
                if (currentHistory.length === 0) {
                    showNotifTop('⚠️ Tidak ada data untuk dipindahkan!', true);
                    return;
                }
                
                if (confirm(`Pindahkan "${escapeHtml(namaProspek)}" ke Database Nomor Salah?`)) {
                    try {
                        const { data: doc } = await window.db.from('prospek').select('*').eq('id', id).single();
                        if (!doc) {
                            showNotifTop('❌ Data prospek tidak ditemukan!', true);
                            return;
                        }
                        
                        const negosiasiData = doc.negosiasi_data || null;
                        const dihubungiData = doc.dihubungi_data || null;
                        
                        const nomorSalahData = {
                            nama: doc.nama || 'Tidak ada nama',
                            hp: formatPhoneNumber(doc.hp || ''),
                            alasan: 'Nomor tidak bisa dihubungi / tidak aktif',
                            deleted_at: new Date().toISOString(),
                            user_id: doc.user_id || currentUser.id,
                            dihubungi_data: dihubungiData || { pesan: null, balasan: null },
                            negosiasi_data: negosiasiData,
                            pesan_terkirim: doc.pesan_terkirim || null,
                            balasan_diterima: doc.balasan_diterima || null,
                            upline_name: doc.upline_name || null,
                            upline_phone: doc.upline_phone || null,
                            dihubungi_history: currentHistory
                        };
                        
                        await window.db.from('nomor_salah').insert(nomorSalahData);
                        await window.db.from('prospek').delete().eq('id', id);
                        
                        showNotifTop('📵 Data dipindahkan ke Database Nomor Salah');
                        closeDynamicModal(modal);
                        await loadProspek();
                        await loadDBNomorSalah();
                        closeModal('detailModal');
                    } catch (err) {
                        showNotifTop('❌ Gagal: ' + err.message, true);
                    }
                }
            };
        }
        
        // ===== TOMBOL BATAL =====
        const cancelBtn = modal.querySelector('#prospekConfirmCancel');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                closeDynamicModal(modal);
            };
        }
        
        // ===== DARK MODE =====
        applyDarkModeToModal(modal);
        
        // ===== SCROLL KE BAWAH =====
        setTimeout(() => {
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }, 200);
        
    }).catch(err => {
        console.error('❌ Error load prospek:', err);
        showNotifTop('❌ Gagal memuat data: ' + err.message, true);
    });
}

// ========== PENDING MODAL FUNCTIONS ==========
function openPendingModal(id) {
    currentPendingId = id;
    
    window.db.from('customers').select('*').eq('id', id).single().then(({ data }) => {
        pendingItems = data.pending_data || [];
        
        const modal = createModalWithHighZIndex(`
            <div class="modal-content" style="max-width: 500px;">
                <h3>📝 Catatan Pending</h3>
                <div class="modal-subtitle">Catat setiap balasan/respon dari customer</div>
                <div style="background: #eef2ff; padding: 12px; border-radius: 10px; margin: 0 20px 10px 20px;">
                    <p style="font-size: 12px; color: #4f46e5; margin: 0;">📌 <strong>Ketentuan:</strong><br>
                    • Setiap kali menyimpan data pending, deadline akan bertambah 2 hari dari HARI INI<br>
                    • Setelah semua balasan terisi dan tercentang, Anda dapat melanjutkan ke Closing</p>
                </div>
                <div id="pendingItemsContainer" style="max-height: 300px; overflow-y: auto; padding: 0 20px;"></div>
                <button id="addPendingItemBtn" class="add-btn" style="margin: 10px 20px; width: calc(100% - 40px);">+ Tambah Balasan</button>
                <div class="modal-buttons" style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button id="pendingFinishBtn" class="btn-success" style="flex: 1;" disabled>✅ Selesai & Lanjut ke Closing</button>
                    <button id="pendingSaveBtn" class="btn-primary" style="flex: 1;">💾 Simpan (Deadline +2 hari)</button>
                    <button id="pendingCancelBtn" class="btn-outline" style="flex: 1;">Batal</button>
                </div>
            </div>
        `, () => closeDynamicModal(modal));
        
        renderPendingModalInContainer(modal);
    });
}

function renderPendingModalInContainer(modal) {
    const container = modal.querySelector('#pendingItemsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (pendingItems.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.textAlign = 'center';
        emptyDiv.style.padding = '20px';
        emptyDiv.style.color = '#9ca3af';
        emptyDiv.innerHTML = 'Belum ada catatan pending. Klik "+ Tambah Balasan" untuk menambahkan.';
        container.appendChild(emptyDiv);
    }
    
    pendingItems.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'pending-item';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '8px';
        div.style.marginBottom = '8px';
        div.style.padding = '8px';
        div.style.background = '#f9fafb';
        div.style.borderRadius = '8px';
        div.innerHTML = `
            <input type="text" value="${escapeHtml(item.text)}" placeholder="Balasan/respon..." style="flex:1; padding: 8px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <input type="checkbox" ${item.checked ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;">
            <button class="delete-pending-item" data-idx="${idx}" style="background: #fef2f2; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; padding: 4px 8px; color: #dc2626;">🗑️</button>
        `;
        const textInput = div.querySelector('input[type="text"]');
        const checkBox = div.querySelector('input[type="checkbox"]');
        const delBtn = div.querySelector('.delete-pending-item');
        
        textInput.addEventListener('change', (e) => {
            pendingItems[idx].text = e.target.value;
            updatePendingButtonsInModal(modal);
        });
        checkBox.addEventListener('change', (e) => {
            pendingItems[idx].checked = e.target.checked;
            updatePendingButtonsInModal(modal);
        });
        delBtn.addEventListener('click', () => {
            pendingItems.splice(idx, 1);
            renderPendingModalInContainer(modal);
            updatePendingButtonsInModal(modal);
        });
        container.appendChild(div);
    });
    
    const addBtn = modal.querySelector('#addPendingItemBtn');
    if (addBtn) {
        const newAddBtn = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(newAddBtn, addBtn);
        newAddBtn.onclick = () => {
            pendingItems.push({ text: '', checked: false });
            renderPendingModalInContainer(modal);
            updatePendingButtonsInModal(modal);
        };
    }
    
    updatePendingButtonsInModal(modal);
}

function updatePendingButtonsInModal(modal) {
    const allFilledAndChecked = pendingItems.length > 0 && pendingItems.every(item => item.checked === true && item.text.trim() !== '');
    
    const finishBtn = modal.querySelector('#pendingFinishBtn');
    if (finishBtn) {
        if (allFilledAndChecked) {
            finishBtn.disabled = false;
            finishBtn.style.opacity = '1';
            finishBtn.style.cursor = 'pointer';
            const newFinishBtn = finishBtn.cloneNode(true);
            finishBtn.parentNode.replaceChild(newFinishBtn, finishBtn);
            newFinishBtn.onclick = async () => {
                await window.db.from('customers').update({ pending_data: pendingItems }).eq('id', currentPendingId);
                // Pindah ke Closing dengan deadline tanggal 1 bulan depan
                await updateCustomerStatus(currentPendingId, 'closing');
                closeDynamicModal(modal);
            };
        } else {
            finishBtn.disabled = true;
            finishBtn.style.opacity = '0.5';
            finishBtn.style.cursor = 'not-allowed';
        }
    }
    
    const saveBtn = modal.querySelector('#pendingSaveBtn');
    if (saveBtn) {
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        newSaveBtn.onclick = async () => {
            const { data: doc } = await window.db.from('customers').select('*').eq('id', currentPendingId).single();
            const oldPendingData = doc.pending_data || [];
            
            let hasChanges = false;
            if (pendingItems.length !== oldPendingData.length) {
                hasChanges = true;
            } else {
                for (let i = 0; i < pendingItems.length; i++) {
                    const newItem = pendingItems[i];
                    const oldItem = oldPendingData[i] || {};
                    if (newItem.text !== oldItem.text || newItem.checked !== oldItem.checked) {
                        hasChanges = true;
                        break;
                    }
                }
            }
            
            const hasAnyData = pendingItems.some(item => item.text && item.text.trim() !== '');
            
            if (!hasAnyData) {
                showNotifTop('⚠️ Minimal isi satu balasan sebelum menyimpan!', true);
                return;
            }
            
            if (!hasChanges) {
                showNotifTop('⚠️ Tidak ada perubahan data!', true);
                return;
            }
            
            // Deadline bertambah 2 hari dari HARI INI (bukan dari deadline lama)
            const newDeadline = addDaysFromToday(2);
            await window.db.from('customers').update({
                pending_data: pendingItems,
                tanggal: newDeadline
            }).eq('id', currentPendingId);
            
            showNotifTop(`💾 Data pending berhasil disimpan. Deadline +2 hari dari hari ini menjadi ${newDeadline}`);
            closeDynamicModal(modal);
            await loadCustomers();
        };
    }
    
    const cancelBtn = modal.querySelector('#pendingCancelBtn');
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.onclick = () => {
            closeDynamicModal(modal);
        };
    }
}

// ========== PROSPEK NEGOSIASI MODAL ==========
function openProspekNegosiasiModal(id) {
    currentProspekId = id;
    
    const existingModal = document.getElementById('prospekNegosiasiModalFix');
    if (existingModal) existingModal.remove();
    
    window.db.from('prospek').select('*').eq('id', id).single().then(({ data }) => {
        const modal = document.createElement('div');
        modal.id = 'prospekNegosiasiModalFix';
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: rgba(0, 0, 0, 0.8) !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            z-index: 999999999 !important;
            backdrop-filter: blur(5px) !important;
        `;
        
        // Hitung persentase kelengkapan data negosiasi
        const negosiasiData = data.negosiasi_data || {};
        const fields = ['aplikasi', 'domisili', 'transaksi', 'deposit', 'tertarik', 'penawaran'];
        const filledFields = fields.filter(f => negosiasiData[f] && negosiasiData[f] !== '');
        const completePercent = Math.round((filledFields.length / fields.length) * 100);
        const isComplete = filledFields.length === fields.length;
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; max-height: 85vh; overflow-y: auto; background: #fff; border-radius: 24px;">
                <div style="position: sticky; top: 0; background: #fff; border-radius: 24px 24px 0 0; z-index: 10;">
                    <h3 style="font-size: 20px; padding: 20px 20px 0; color: #1f2937;">📋 Kuesioner Negosiasi</h3>
                    <div class="modal-subtitle" style="font-size: 12px; color: #6b7280; padding: 0 20px 12px; border-bottom: 1px solid #f0f0f0;">
                        Isi data kuesioner di bawah ini
                        <div style="margin-top: 8px; background: #e5e7eb; border-radius: 10px; height: 6px; overflow: hidden;">
                            <div style="width: ${completePercent}%; height: 100%; background: #10b981; border-radius: 10px; transition: width 0.3s;"></div>
                        </div>
                        <small>Kelengkapan data: ${completePercent}% (${filledFields.length}/${fields.length})</small>
                    </div>
                </div>
                <div style="background: #eef2ff; padding: 12px; border-radius: 10px; margin: 0 20px 10px 20px;">
                    <p style="font-size: 12px; color: #4f46e5; margin: 0;">📌 <strong>Ketentuan:</strong><br>
                    • Setiap kali menyimpan data kuesioner, deadline akan bertambah 5 hari dari HARI INI<br>
                    • Setelah semua data terisi, Anda dapat memindahkan ke Tertarik (deadline +1 hari dari HARI INI)</p>
                </div>
                <div style="padding: 20px;">
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;">Aplikasi yang dipakai? <span style="color: #ef4444;">*</span></label>
                        <input type="text" id="negosiasi_aplikasi" placeholder="Contoh: GNP, BSB, BTN" value="${escapeHtml(data.negosiasi_data?.aplikasi || '')}" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                    </div>
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;">Domisili dimana? <span style="color: #ef4444;">*</span></label>
                        <input type="text" id="negosiasi_domisili" placeholder="Kota/Kabupaten" value="${escapeHtml(data.negosiasi_data?.domisili || '')}" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                    </div>
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;">Total transaksi per bulan? <span style="color: #ef4444;">*</span></label>
                        <input type="text" id="negosiasi_transaksi" placeholder="Nominal" value="${escapeHtml(data.negosiasi_data?.transaksi || '')}" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                    </div>
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;">Apakah deposit atau saldo pinjaman? <span style="color: #ef4444;">*</span></label>
                        <select id="negosiasi_deposit" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                            <option value="">Pilih</option>
                            <option value="Deposit" ${data.negosiasi_data?.deposit === 'Deposit' ? 'selected' : ''}>Deposit</option>
                            <option value="Saldo Pinjaman" ${data.negosiasi_data?.deposit === 'Saldo Pinjaman' ? 'selected' : ''}>Saldo Pinjaman</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;">Apakah tertarik dengan penawaran kamu? <span style="color: #ef4444;">*</span></label>
                        <select id="negosiasi_tertarik" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                            <option value="">Pilih</option>
                            <option value="Ya" ${data.negosiasi_data?.tertarik === 'Ya' ? 'selected' : ''}>Ya</option>
                            <option value="Tidak" ${data.negosiasi_data?.tertarik === 'Tidak' ? 'selected' : ''}>Tidak</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;">Penawaran apa yang diberikan? <span style="color: #ef4444;">*</span></label>
                        <input type="text" id="negosiasi_penawaran" placeholder="Penawaran" value="${escapeHtml(data.negosiasi_data?.penawaran || '')}" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                    </div>
                </div>
                <div class="modal-buttons" style="display: flex; gap: 10px; flex-wrap: wrap; padding: 16px 20px 20px; border-top: 1px solid #f0f0f0;">
                    <button type="button" id="negosiasiTertarikBtnFix" class="btn-success" style="flex: 1; padding: 12px; border: 0; border-radius: 14px; font-weight: 600; font-size: 13px; background: ${isComplete ? '#10b981' : '#9ca3af'}; color: white; cursor: ${isComplete ? 'pointer' : 'not-allowed'}; opacity: ${isComplete ? '1' : '0.6'};">⭐ Tertarik</button>
                    <button type="button" id="negosiasiTidakTertarikBtnFix" class="btn-danger" style="flex: 1; padding: 12px; border: 0; border-radius: 14px; font-weight: 600; font-size: 13px; background: ${isComplete ? '#ef4444' : '#9ca3af'}; color: white; cursor: ${isComplete ? 'pointer' : 'not-allowed'}; opacity: ${isComplete ? '1' : '0.6'};">❌ Tidak Tertarik</button>
                    <button type="button" id="negosiasiSimpanBtnFix" class="btn-primary" style="flex: 1; padding: 12px; border: 0; border-radius: 14px; font-weight: 600; font-size: 13px; background: #4f46e5; color: white; cursor: pointer;">💾 Simpan (Deadline +5 hari)</button>
                    <button type="button" id="negosiasiBatalBtnFix" class="btn-outline" style="flex: 1; padding: 12px; border: 0; border-radius: 14px; font-weight: 600; font-size: 13px; background: #f3f4f6; color: #374151; cursor: pointer;">❌ Batal</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        
        function closeModalFix() {
            if (modal && modal.remove) modal.remove();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
        }
        
        function updateCompleteStatus() {
            const aplikasi = document.getElementById('negosiasi_aplikasi').value;
            const domisili = document.getElementById('negosiasi_domisili').value;
            const transaksi = document.getElementById('negosiasi_transaksi').value;
            const deposit = document.getElementById('negosiasi_deposit').value;
            const tertarik = document.getElementById('negosiasi_tertarik').value;
            const penawaran = document.getElementById('negosiasi_penawaran').value;
            
            const filled = [aplikasi, domisili, transaksi, deposit, tertarik, penawaran].filter(v => v && v !== '').length;
            const newIsComplete = filled === 6;
            
            const tertarikBtn = document.getElementById('negosiasiTertarikBtnFix');
            const tidakTertarikBtn = document.getElementById('negosiasiTidakTertarikBtnFix');
            
            if (tertarikBtn) {
                if (newIsComplete) {
                    tertarikBtn.disabled = false;
                    tertarikBtn.style.background = '#10b981';
                    tertarikBtn.style.opacity = '1';
                    tertarikBtn.style.cursor = 'pointer';
                    tidakTertarikBtn.disabled = false;
                    tidakTertarikBtn.style.background = '#ef4444';
                    tidakTertarikBtn.style.opacity = '1';
                    tidakTertarikBtn.style.cursor = 'pointer';
                } else {
                    tertarikBtn.disabled = true;
                    tertarikBtn.style.background = '#9ca3af';
                    tertarikBtn.style.opacity = '0.6';
                    tertarikBtn.style.cursor = 'not-allowed';
                    tidakTertarikBtn.disabled = true;
                    tidakTertarikBtn.style.background = '#9ca3af';
                    tidakTertarikBtn.style.opacity = '0.6';
                    tidakTertarikBtn.style.cursor = 'not-allowed';
                }
            }
        }
        
        // Tambahkan event listener ke semua input untuk update status
        const inputs = ['negosiasi_aplikasi', 'negosiasi_domisili', 'negosiasi_transaksi', 'negosiasi_deposit', 'negosiasi_tertarik', 'negosiasi_penawaran'];
        inputs.forEach(inputId => {
            const el = document.getElementById(inputId);
            if (el) {
                el.addEventListener('input', updateCompleteStatus);
                if (el.tagName === 'SELECT') {
                    el.addEventListener('change', updateCompleteStatus);
                }
            }
        });
        updateCompleteStatus();
        
// ===== FUNGSI UNTUK SAVE DATA NEGOSIASI =====
async function saveNegosiasiData(forceSave = false) {
    const aplikasi = document.getElementById('negosiasi_aplikasi').value;
    const domisili = document.getElementById('negosiasi_domisili').value;
    const transaksi = document.getElementById('negosiasi_transaksi').value;
    const deposit = document.getElementById('negosiasi_deposit').value;
    const tertarik = document.getElementById('negosiasi_tertarik').value;
    const penawaran = document.getElementById('negosiasi_penawaran').value;
    
    // ===== PERBAIKAN: Selalu simpan, meskipun kosong =====
    // Tapi beri peringatan jika kosong
    const hasAnyData = aplikasi || domisili || transaksi || deposit || tertarik || penawaran;
    
    // Jika tidak ada data dan bukan force save, beri peringatan
    if (!hasAnyData && !forceSave) {
        showNotifTop('⚠️ Tidak ada data untuk disimpan!', true);
        return null;
    }
    
    try {
        const { data: doc } = await window.db.from('prospek').select('*').eq('id', currentProspekId).single();
        const existingData = doc.negosiasi_data || {};
        
        // ===== PERBAIKAN: Selalu update, tidak perlu cek perubahan =====
        const negosiasi_data = {
            aplikasi: aplikasi || '',
            domisili: domisili || '',
            transaksi: transaksi || '',
            deposit: deposit || '',
            tertarik: tertarik || '',
            penawaran: penawaran || '',
            timestamp: new Date().toISOString(),
            is_complete: !!(aplikasi && domisili && transaksi && deposit && tertarik && penawaran)
        };
        
        // Deadline bertambah 5 hari dari HARI INI (hanya jika ada data)
        let newDeadline = doc.deadline;
        if (hasAnyData) {
            newDeadline = addDaysFromToday(5);
        }
        
        const updateData = {
            negosiasi_data: negosiasi_data,
            updated_at: new Date().toISOString()
        };
        
        if (hasAnyData) {
            updateData.deadline = newDeadline;
        }
        
        await window.db.from('prospek').update(updateData).eq('id', currentProspekId);
        
        if (hasAnyData) {
            showNotifTop(`💾 Data kuesioner berhasil disimpan. Deadline +5 hari dari hari ini menjadi ${newDeadline}`);
        } else {
            showNotifTop('💾 Data kuesioner berhasil disimpan (kosong)');
        }
        
        return negosiasi_data;
        
    } catch (err) {
        console.error('Error saving negosiasi:', err);
        showNotifTop('❌ Gagal menyimpan data: ' + err.message, true);
        return null;
    }
}
        
// Tombol Simpan
const simpanBtn = document.getElementById('negosiasiSimpanBtnFix');
if (simpanBtn) {
    simpanBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        this.disabled = true;
        this.textContent = '⏳ Menyimpan...';
        
        try {
            // ===== PERBAIKAN: Ambil data dari input langsung =====
            const aplikasi = document.getElementById('negosiasi_aplikasi').value;
            const domisili = document.getElementById('negosiasi_domisili').value;
            const transaksi = document.getElementById('negosiasi_transaksi').value;
            const deposit = document.getElementById('negosiasi_deposit').value;
            const tertarik = document.getElementById('negosiasi_tertarik').value;
            const penawaran = document.getElementById('negosiasi_penawaran').value;
            
            const hasAnyData = aplikasi || domisili || transaksi || deposit || tertarik || penawaran;
            
            if (!hasAnyData) {
                showNotifTop('⚠️ Tidak ada data untuk disimpan!', true);
                return;
            }
            
            const negosiasi_data = {
                aplikasi: aplikasi || '',
                domisili: domisili || '',
                transaksi: transaksi || '',
                deposit: deposit || '',
                tertarik: tertarik || '',
                penawaran: penawaran || '',
                timestamp: new Date().toISOString(),
                is_complete: !!(aplikasi && domisili && transaksi && deposit && tertarik && penawaran)
            };
            
            // Deadline bertambah 5 hari dari HARI INI
            const newDeadline = addDaysFromToday(5);
            
            await window.db.from('prospek').update({
                negosiasi_data: negosiasi_data,
                deadline: newDeadline,
                updated_at: new Date().toISOString()
            }).eq('id', currentProspekId);
            
            showNotifTop(`💾 Data kuesioner berhasil disimpan. Deadline +5 hari dari hari ini menjadi ${newDeadline}`);
            
            // ===== PERBAIKAN: Update status kelengkapan di UI =====
            updateCompleteStatus();
            
            // Reload data
            await loadProspek();
            
        } catch (err) {
            console.error('❌ Error:', err);
            showNotifTop('❌ Gagal: ' + err.message, true);
        } finally {
            this.disabled = false;
            this.textContent = '💾 Simpan (Deadline +5 hari)';
        }
    });
}
        
// ===== PERBAIKAN: Tombol Tertarik =====
const tertarikBtn = document.getElementById('negosiasiTertarikBtnFix');
if (tertarikBtn) {
    tertarikBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (tertarikBtn.disabled) {
            showNotifTop('⚠️ Harap lengkapi semua data kuesioner terlebih dahulu!', true);
            return;
        }
        
        this.disabled = true;
        this.textContent = '⏳ Memproses...';
        
        try {
            // ===== PERBAIKAN: Ambil data dari input langsung =====
            const aplikasi = document.getElementById('negosiasi_aplikasi').value;
            const domisili = document.getElementById('negosiasi_domisili').value;
            const transaksi = document.getElementById('negosiasi_transaksi').value;
            const deposit = document.getElementById('negosiasi_deposit').value;
            const tertarik = document.getElementById('negosiasi_tertarik').value;
            const penawaran = document.getElementById('negosiasi_penawaran').value;
            
            // ===== PERBAIKAN: Buat data negosiasi dari input =====
            const negosiasiData = {
                aplikasi: aplikasi || '',
                domisili: domisili || '',
                transaksi: transaksi || '',
                deposit: deposit || '',
                tertarik: tertarik || '',
                penawaran: penawaran || '',
                timestamp: new Date().toISOString(),
                is_complete: !!(aplikasi && domisili && transaksi && deposit && tertarik && penawaran)
            };
            
            console.log('📝 Data negosiasi dari input (Tertarik):', negosiasiData);
            
            if (!confirm('Apakah Anda yakin prospek ini TERTARIK?\n\nData akan dipindahkan ke status TERTARIK dengan deadline +1 hari dari hari ini.')) {
                this.disabled = false;
                this.textContent = '⭐ Tertarik';
                return;
            }
            
            // Deadline +1 hari dari HARI INI
            const newDeadline = addDaysFromToday(1);
            
            // ===== PERBAIKAN: Update dengan data negosiasi =====
            await window.db.from('prospek').update({
                status: 'Tertarik',
                negosiasi_data: negosiasiData,
                deadline: newDeadline,
                updated_at: new Date().toISOString()
            }).eq('id', currentProspekId);
            
            showNotifTop(`✅ Prospek dipindahkan ke status TERTARIK. Deadline +1 hari dari hari ini menjadi ${newDeadline}`);
            closeModalFix();
            await loadProspek();
            closeModal('detailModal');
            
        } catch (err) {
            console.error('❌ Error:', err);
            showNotifTop('❌ Gagal: ' + err.message, true);
        } finally {
            this.disabled = false;
            this.textContent = '⭐ Tertarik';
        }
    });
}
        
// ===== PERBAIKAN: Tombol Tidak Tertarik =====
const tidakTertarikBtn = document.getElementById('negosiasiTidakTertarikBtnFix');
if (tidakTertarikBtn) {
    tidakTertarikBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (tidakTertarikBtn.disabled) {
            showNotifTop('⚠️ Harap lengkapi semua data kuesioner terlebih dahulu!', true);
            return;
        }
        
        this.disabled = true;
        this.textContent = '⏳ Memproses...';
        
        try {
            // ===== PERBAIKAN: Ambil data dari input langsung =====
            const aplikasi = document.getElementById('negosiasi_aplikasi').value;
            const domisili = document.getElementById('negosiasi_domisili').value;
            const transaksi = document.getElementById('negosiasi_transaksi').value;
            const deposit = document.getElementById('negosiasi_deposit').value;
            const tertarik = document.getElementById('negosiasi_tertarik').value;
            const penawaran = document.getElementById('negosiasi_penawaran').value;
            
            // ===== PERBAIKAN: Buat data negosiasi dari input =====
            const negosiasiData = {
                aplikasi: aplikasi || '',
                domisili: domisili || '',
                transaksi: transaksi || '',
                deposit: deposit || '',
                tertarik: tertarik || '',
                penawaran: penawaran || '',
                timestamp: new Date().toISOString(),
                is_complete: !!(aplikasi && domisili && transaksi && deposit && tertarik && penawaran)
            };
            
            console.log('📝 Data negosiasi dari input:', negosiasiData);
            
            // ===== PERBAIKAN: SIMPAN DULU KE DATABASE =====
            const hasAnyData = aplikasi || domisili || transaksi || deposit || tertarik || penawaran;
            
            const updateData = {
                negosiasi_data: negosiasiData,
                updated_at: new Date().toISOString()
            };
            
            if (hasAnyData) {
                updateData.deadline = addDaysFromToday(5);
            }
            
            const { error: updateError } = await window.db
                .from('prospek')
                .update(updateData)
                .eq('id', currentProspekId);
            
            if (updateError) {
                console.error('❌ Error update negosiasi:', updateError);
                showNotifTop('❌ Gagal menyimpan data negosiasi: ' + updateError.message, true);
                return;
            }
            
            console.log('✅ Data negosiasi berhasil disimpan ke database');
            
            // ===== TAMPILKAN POPUP ALASAN =====
            // Tutup modal negosiasi dulu
            closeModalFix();
            
            // Buka popup alasan dengan data negosiasi
            showAlasanTidakTertarikModal(currentProspekId, negosiasiData);
            
        } catch (err) {
            console.error('❌ Error:', err);
            showNotifTop('❌ Gagal: ' + err.message, true);
        } finally {
            this.disabled = false;
            this.textContent = '❌ Tidak Tertarik';
        }
    });
}
        
        // Tombol Batal
        const batalBtn = document.getElementById('negosiasiBatalBtnFix');
        if (batalBtn) {
            batalBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeModalFix();
            });
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModalFix();
        });
        
    }).catch(err => {
        console.error('Error loading prospek data:', err);
        showNotifTop('❌ Gagal memuat data prospek: ' + err.message, true);
    });
}

// ========== POPUP ALASAN TIDAK TERTARIK ==========
function showAlasanTidakTertarikModal(prospekId, negosiasiDataFromInput = null) {
    // Hapus modal lama jika ada
    const existingModal = document.querySelector('.alasan-tidak-tertarik-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal alasan-tidak-tertarik-modal';
    modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0, 0, 0, 0.8) !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        z-index: 999999999 !important;
        backdrop-filter: blur(5px) !important;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 450px; max-height: 80vh; overflow-y: auto; background: #fff; border-radius: 24px;">
            <h3 style="font-size: 20px; padding: 20px 20px 0; color: #1f2937;">❌ Konfirmasi Tidak Tertarik</h3>
            <div class="modal-subtitle" style="font-size: 12px; color: #6b7280; padding: 0 20px 12px; border-bottom: 1px solid #f0f0f0;">
                Berikan alasan mengapa prospek tidak tertarik
            </div>
            
            <div style="padding: 20px 20px 0;">
                <div class="form-group" style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">
                        Alasan Tidak Tertarik <span style="color: #ef4444;">*</span>
                    </label>
                    <select id="alasanTidakTertarikSelect" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px; background: #fff;">
                        <option value="">Pilih Alasan</option>
                        <option value="Harga terlalu mahal">💰 Harga terlalu mahal</option>
                        <option value="Sudah punya produk lain">🏷️ Sudah punya produk lain</option>
                        <option value="Tidak membutuhkan sekarang">⏰ Tidak membutuhkan sekarang</option>
                        <option value="Membandingkan dengan kompetitor">📊 Membandingkan dengan kompetitor</option>
                        <option value="Tidak sesuai kebutuhan">❌ Tidak sesuai kebutuhan</option>
                        <option value="Tidak ada anggaran">💸 Tidak ada anggaran</option>
                        <option value="Kurang informasi">📄 Kurang informasi</option>
                        <option value="Tidak nyaman dengan penawaran">😕 Tidak nyaman dengan penawaran</option>
                        <option value="Lainnya">📝 Lainnya (tulis di keterangan)</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">
                        Keterangan Tambahan (Opsional)
                    </label>
                    <textarea id="alasanTidakTertarikKeterangan" rows="3" placeholder="Tulis keterangan tambahan..." style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px; resize: vertical;"></textarea>
                </div>
            </div>
            
            <div style="background: #fef3c7; padding: 12px; border-radius: 10px; margin: 0 20px 10px 20px;">
                <p style="font-size: 12px; color: #d97706; margin: 0;">⚠️ <strong>Peringatan:</strong><br>
                Data akan dipindahkan ke DATABASE TIDAK TERTARIK dan DIHAPUS dari Prospek Agen.<br>
                Proses ini TIDAK BISA dibatalkan!</p>
            </div>
            
            <div class="modal-buttons" style="display: flex; gap: 10px; flex-wrap: wrap; padding: 16px 20px 20px; border-top: 1px solid #f0f0f0;">
                <button type="button" id="alasanTidakTertarikConfirmBtn" class="btn-danger" style="flex: 1; padding: 12px; border: 0; border-radius: 14px; font-weight: 600; font-size: 13px; background: #ef4444; color: white; cursor: pointer;">✅ Konfirmasi Pindah</button>
                <button type="button" id="alasanTidakTertarikBatalBtn" class="btn-outline" style="flex: 1; padding: 12px; border: 0; border-radius: 14px; font-weight: 600; font-size: 13px; background: #f3f4f6; color: #374151; cursor: pointer;">❌ Batal</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    
    function closeModalAlasan() {
        if (modal && modal.remove) modal.remove();
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    }
    
    // Tombol Konfirmasi
    document.getElementById('alasanTidakTertarikConfirmBtn').addEventListener('click', async function() {
        const alasanSelect = document.getElementById('alasanTidakTertarikSelect');
        const keterangan = document.getElementById('alasanTidakTertarikKeterangan').value;
        const alasan = alasanSelect.value;
        
        if (!alasan) {
            showNotifTop('⚠️ Silakan pilih alasan tidak tertarik!', true);
            return;
        }
        
        // Gabungkan alasan dengan keterangan
        const alasanLengkap = keterangan ? `${alasan} - ${keterangan}` : alasan;
        
        // Disable button
        this.disabled = true;
        this.textContent = '⏳ Memproses...';
        
        try {
            // ===== Ambil data prospek LENGKAP =====
            const { data: doc, error: getError } = await window.db
                .from('prospek')
                .select('*')
                .eq('id', prospekId)
                .single();
            
            if (getError || !doc) {
                showNotifTop('❌ Data prospek tidak ditemukan!', true);
                return;
            }
            
            // ===== PERBAIKAN: Gunakan data negosiasi dari parameter =====
            // Jika ada data dari input, gunakan itu
            // Jika tidak, ambil dari database
            let negosiasiData = negosiasiDataFromInput || doc.negosiasi_data || {};
            
            // ===== PERBAIKAN: Jika negosiasiDataFromInput ada tapi kosong, coba ambil dari database =====
            if (negosiasiDataFromInput && Object.keys(negosiasiDataFromInput).length > 0) {
                console.log('✅ Menggunakan data negosiasi dari input:', negosiasiDataFromInput);
            } else if (doc.negosiasi_data && Object.keys(doc.negosiasi_data).length > 0) {
                console.log('✅ Menggunakan data negosiasi dari database:', doc.negosiasi_data);
                negosiasiData = doc.negosiasi_data;
            } else {
                console.log('⚠️ Tidak ada data negosiasi, menggunakan data kosong');
                negosiasiData = {
                    aplikasi: '',
                    domisili: '',
                    transaksi: '',
                    deposit: '',
                    tertarik: '',
                    penawaran: '',
                    is_complete: false,
                    timestamp: new Date().toISOString()
                };
            }
            
            // ===== Data dihubungi =====
            const dihubungiData = doc.dihubungi_data || {};
            
            // ===== Data lengkap untuk arsip =====
            const tidakTertarikData = {
                // Field utama
                nama: doc.nama || 'Tidak ada nama',
                hp: doc.hp || '',
                tanggal: new Date().toISOString(),
                alasan: alasanLengkap,
                user_id: doc.user_id || currentUser.id,
                
                // Status sebelumnya
                status_sebelumnya: doc.status || 'Negosiasi',
                
                // DATA DIHUBUNGI (arsip)
                dihubungi_data: dihubungiData,
                pesan_terkirim: doc.pesan_terkirim || dihubungiData.pesan || null,
                balasan_diterima: doc.balasan_diterima || dihubungiData.balasan || null,
                
                // ===== DATA NEGOSIASI (arsip) =====
                negosiasi_data: {
                    aplikasi: negosiasiData.aplikasi || '',
                    domisili: negosiasiData.domisili || '',
                    transaksi: negosiasiData.transaksi || '',
                    deposit: negosiasiData.deposit || '',
                    tertarik: negosiasiData.tertarik || '',
                    penawaran: negosiasiData.penawaran || '',
                    is_complete: negosiasiData.is_complete || false,
                    timestamp: negosiasiData.timestamp || new Date().toISOString()
                },
                
                // Upline
                upline_name: doc.upline_name || null,
                upline_phone: doc.upline_phone || null,
                
                // Timestamp
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            console.log('📝 Menyimpan ke db_tidak_tertarik:', tidakTertarikData);
            
            // Simpan ke DB Tidak Tertarik
            const { error: insertError } = await window.db
                .from('db_tidak_tertarik')
                .insert(tidakTertarikData);
            
            if (insertError) {
                console.error('❌ Error insert db_tidak_tertarik:', insertError);
                showNotifTop('❌ Gagal menyimpan ke Database Tidak Tertarik: ' + insertError.message, true);
                return;
            }
            
            console.log('✅ Berhasil simpan ke db_tidak_tertarik');
            
            // Hapus dari Prospek
            await window.db.from('prospek').delete().eq('id', prospekId);
            
            showNotifTop('📵 Data dipindahkan ke Database Tidak Tertarik (dengan arsip lengkap)');
            closeModalAlasan();
            
            // Reload data
            await loadProspek();
            await loadDBTidak();
            closeModal('detailModal');
            
        } catch (err) {
            console.error('❌ Error dalam proses:', err);
            showNotifTop('❌ Terjadi kesalahan: ' + err.message, true);
        } finally {
            this.disabled = false;
            this.textContent = '✅ Konfirmasi Pindah';
        }
    });
    
    // Tombol Batal
    document.getElementById('alasanTidakTertarikBatalBtn').addEventListener('click', function() {
        closeModalAlasan();
        openProspekNegosiasiModal(prospekId);
    });
    
    // Klik di luar modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModalAlasan();
            openProspekNegosiasiModal(prospekId);
        }
    });
}

// ========== SHOW CONVERT TO CUSTOMER MODAL ==========
function showConvertToCustomerModal(prospekId) {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    const followupDate = nextMonth.toISOString().split('T')[0];
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '9999999';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h3>📋 Lengkapi Data Customer</h3>
            <div class="modal-subtitle">Data prospek akan dipindahkan ke Followup Agen</div>
            <div style="padding: 0 20px;">
                <div class="form-group">
                    <label>ID Agent <span class="required">*</span></label>
                    <input type="text" id="convertAgentId" placeholder="Contoh: AG-001" maxlength="17" oninput="formatAgentIdAuto(this)">
                    <small>Huruf besar, angka, max 17 karakter</small>
                </div>
                <div class="form-group">
                    <label>Aplikasi <span class="required">*</span></label>
                    <select id="convertAplikasi">
                        <option value="">Pilih Aplikasi</option>
                        <option value="GNP">GNP</option>
                        <option value="BSB">BSB</option>
                        <option value="BTN">BTN</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Tanggal Followup</label>
                    <input type="date" id="convertFollowupDate" value="${followupDate}">
                </div>
            </div>
            <div class="modal-buttons">
                <button id="confirmConvertBtn" class="btn-primary">✅ Konfirmasi Pindah</button>
                <button id="cancelConvertBtn" class="btn-outline">Batal</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('confirmConvertBtn').onclick = async () => {
        const agentId = document.getElementById('convertAgentId').value;
        const aplikasi = document.getElementById('convertAplikasi').value;
        const followupDateValue = document.getElementById('convertFollowupDate').value;
        
        if (!agentId || !aplikasi) {
            showNotifTop('⚠️ ID Agent dan Aplikasi wajib diisi!', true);
            return;
        }
        
        const { data: prospekDoc } = await window.db.from('prospek').select('*').eq('id', prospekId).single();
        const data = prospekDoc;
        
        const { data: existing } = await window.db.from('customers').select('id').eq('agent_id', agentId).maybeSingle();
        if (existing) {
            showNotifTop(`⚠️ ID Agent "${agentId}" sudah terdaftar!`, true);
            return;
        }
        
        if (confirm(`Jadikan "${escapeHtml(data.nama)}" sebagai Customer?`)) {
            await window.db.from('db_commitment').insert({
                nama: data.nama,
                hp: data.hp,
                negosiasi_data: data.negosiasi_data || null,
                agent_id: agentId,
                aplikasi: aplikasi,
                committed_at: new Date().toISOString(),
                user_id: data.user_id,
                original_prospek_id: prospekId,
                followup_date: followupDateValue
            });
            
            await window.db.from('customers').insert({
                agent_id: agentId,
                nama: data.nama,
                hp: data.hp,
                apk: aplikasi,
                tanggal: followupDateValue,
                status: 'baru',
                user_id: data.user_id,
                created_at: new Date().toISOString(),
                converted_from: 'prospek_commitment',
                is_new_member: true
            });
            
            await window.db.from('prospek').delete().eq('id', prospekId);
            
            showNotifTop('✅ Berhasil! Member baru telah ditambahkan ke Followup Agen dan tersimpan di Database Commitment');
            modal.remove();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            await loadCustomers();
            await loadProspek();
            await loadDBCommitment();
            closeModal('detailModal');
        }
    };
    
    document.getElementById('cancelConvertBtn').onclick = () => {
        modal.remove();
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
        }
    };
}

// ========== CRUD OPERATIONS ==========
let isAddingCustomer = false;
let isAddingProspek = false;

async function addCustomer(agentId, nama, hp, apk, uplineName, deadline) {
    // ===== PERBAIKAN: Cegah multiple submit =====
    if (isAddingCustomer) {
        showNotifTop('⏳ Data sedang diproses, harap tunggu...', true);
        return false;
    }
    isAddingCustomer = true;
    
    try {
        // ===== PERBAIKAN: Cek duplikat berdasarkan agent_id =====
        const { data: existingById } = await window.db
            .from('customers')
            .select('id')
            .eq('agent_id', agentId)
            .maybeSingle();
        
        if (existingById) {
            showNotifTop(`⚠️ ID Agent "${agentId}" sudah terdaftar!`, true);
            return false;
        }
        
        // ===== PERBAIKAN: Cek duplikat berdasarkan hp =====
        if (hp) {
            const { data: existingByHp } = await window.db
                .from('customers')
                .select('id')
                .eq('hp', hp)
                .maybeSingle();
            
            if (existingByHp) {
                showNotifTop(`⚠️ Nomor HP "${hp}" sudah terdaftar!`, true);
                return false;
            }
        }
        
        // ===== PERBAIKAN: Cek duplikat berdasarkan nama =====
        if (nama) {
            const { data: existingByName } = await window.db
                .from('customers')
                .select('id')
                .eq('nama', nama)
                .maybeSingle();
            
            if (existingByName) {
                showNotifTop(`⚠️ Nama "${nama}" sudah terdaftar!`, true);
                return false;
            }
        }
        
        const { error } = await window.db.from('customers').insert({
            agent_id: agentId,
            nama: nama,
            hp: hp || '',
            apk: apk || null,
            upline_name: uplineName || null,
            tanggal: deadline,
            status: 'baru',
            user_id: currentUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
        
        if (error) {
            showNotifTop('❌ Gagal simpan: ' + error.message, true);
            return false;
        }
        
        showNotifTop('✅ Data customer berhasil ditambahkan');
        await loadCustomers();
        return true;
        
    } finally {
        isAddingCustomer = false;
    }
}

async function addProspek(nama, hp, deadline, tipeAgent = 'AGENT') {
    // ===== PERBAIKAN: Cegah multiple submit =====
    if (isAddingProspek) {
        showNotifTop('⏳ Data sedang diproses, harap tunggu...', true);
        return false;
    }
    isAddingProspek = true;
    
    try {
        // ===== PERBAIKAN: Cek duplikat berdasarkan hp =====
        if (hp) {
            const { data: existingByHp } = await window.db
                .from('prospek')
                .select('id')
                .eq('hp', hp)
                .maybeSingle();
            
            if (existingByHp) {
                showNotifTop(`⚠️ Nomor HP "${hp}" sudah terdaftar di Prospek!`, true);
                return false;
            }
        }
        
        // ===== PERBAIKAN: Cek duplikat berdasarkan nama =====
        if (nama) {
            const { data: existingByName } = await window.db
                .from('prospek')
                .select('id')
                .eq('nama', nama)
                .maybeSingle();
            
            if (existingByName) {
                showNotifTop(`⚠️ Nama "${nama}" sudah terdaftar di Prospek!`, true);
                return false;
            }
        }
        
        const { error } = await window.db.from('prospek').insert({
            nama: nama,
            hp: hp || '',
            deadline: deadline,
            status: 'Baru',
            tipe_agent: tipeAgent || 'AGENT', // <-- TAMBAHKAN INI
            user_id: currentUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
        
        if (error) {
            showNotifTop('❌ Gagal simpan: ' + error.message, true);
            return false;
        }
        
        showNotifTop('✅ Data prospek berhasil ditambahkan');
        await loadProspek();
        return true;
        
    } finally {
        isAddingProspek = false;
    }
}

// ========== KONFIRMASI CLOSING KE DB ==========
function confirmClosingToDB(id) {
    window.db.from('customers').select('*').eq('id', id).single().then(async ({ data: customer, error: getError }) => {
        if (getError || !customer) {
            showNotifTop('❌ Data customer tidak ditemukan!', true);
            return;
        }

        // ===== AMBIL DATA TRANSAKSI =====
        let transaksiData = null;
        if (customer.agent_id) {
            const { data } = await window.db
                .from('db_transaksi')
                .select('*')
                .eq('agent_id', customer.agent_id)
                .maybeSingle();
            if (data) transaksiData = data;
        }

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: rgba(0, 0, 0, 0.7) !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            z-index: 999999999 !important;
            backdrop-filter: blur(5px) !important;
            pointer-events: auto !important;
        `;

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; z-index: 999999999; pointer-events: auto; background: #fff; border-radius: 24px; max-height: 85vh; overflow-y: auto;">
                <div style="padding: 20px 24px 0; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0;">
                    <div>
                        <h3 style="font-size: 20px; margin: 0; color: #1f2937;">📋 Pindahkan ke Database Closing</h3>
                        <div class="modal-subtitle" style="font-size: 13px; color: #6b7280; padding: 4px 0 12px 0;">Data customer akan dipindahkan ke Database Closing</div>
                    </div>
                    <button onclick="closeModal('${modal.id}')" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #6b7280;">✕</button>
                </div>
                
                ${transaksiData ? `
                    <div style="padding: 0 24px; margin-top: 16px;">
                        <div style="background: #f9fafb; border-radius: 14px; padding: 16px; border: 1px solid #e5e7eb;">
                            <div style="font-weight: 600; font-size: 13px; color: #1f2937; margin-bottom: 12px;">📊 Data Transaksi Terkait</div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div style="background: #f1f5f9; border-radius: 8px; padding: 10px; border-left: 3px solid #f59e0b;">
                                    <div style="font-size: 10px; color: #6b7280;">Periode Lalu</div>
                                    <div style="font-weight: 700; font-size: 16px; color: #1f2937;">${(transaksiData.transaksi_bulan_lalu || 0).toLocaleString()}</div>
                                    <div style="font-size: 10px; color: #6b7280;">📅 ${transaksiData.periode_bulan_lalu || 'Tidak tersedia'}</div>
                                </div>
                                <div style="background: #f1f5f9; border-radius: 8px; padding: 10px; border-left: 3px solid #4f46e5;">
                                    <div style="font-size: 10px; color: #6b7280;">Periode Ini</div>
                                    <div style="font-weight: 700; font-size: 16px; color: #1f2937;">${(transaksiData.transaksi_bulan_ini || 0).toLocaleString()}</div>
                                    <div style="font-size: 10px; color: #6b7280;">📅 ${transaksiData.periode_bulan_ini || 'Tidak tersedia'}</div>
                                </div>
                            </div>
                            <div style="margin-top: 8px; text-align: center; font-size: 12px; color: #6b7280;">
                                Selisih: <strong style="color: ${transaksiData.progres_jenis === 'naik' ? '#10b981' : transaksiData.progres_jenis === 'turun' ? '#ef4444' : '#f59e0b'};">
                                    ${transaksiData.progres_jenis === 'naik' ? '+' : transaksiData.progres_jenis === 'turun' ? '-' : ''}${Math.abs(transaksiData.progres_jumlah || 0).toLocaleString()}
                                </strong>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <div style="padding: 0 20px; margin-top: 12px;">
                    <div style="background: #fef3c7; padding: 12px; border-radius: 10px; margin: 0 0 10px 0;">
                        <p style="font-size: 12px; color: #d97706; margin: 0;">⚠️ <strong>Peringatan:</strong> Data yang sudah dipindahkan TIDAK BISA dikembalikan ke Followup Agen!</p>
                    </div>
                    <div class="form-group">
                        <label>Catatan Closing (Opsional)</label>
                        <textarea id="closingNote" rows="3" placeholder="Contoh: Berhasil closing dengan produk A..." style="width:100%; padding: 10px; border-radius: 10px; border: 1px solid #e5e7eb;"></textarea>
                    </div>
                </div>
                
                <div class="modal-buttons" style="display: flex; gap: 12px; padding: 16px 20px 20px; border-top: 1px solid #e5e7eb;">
                    <button id="confirmClosingToDBBtn" class="btn-primary" style="flex: 1; padding: 12px; border: none; border-radius: 14px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #4f46e5, #6366f1); color: white;">✅ Ya, Pindahkan ke Closing</button>
                    <button id="cancelClosingToDBBtn" class="btn-outline" style="flex: 1; padding: 12px; border: none; border-radius: 14px; font-weight: 600; cursor: pointer; background: #f3f4f6; color: #374151;">❌ Batal</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';

        // ===== EVENT LISTENER =====
        document.getElementById('confirmClosingToDBBtn').onclick = async () => {
            const note = document.getElementById('closingNote').value;
            
            try {
                // ===== PASTIKAN SEMUA DATA ADA =====
                // Data dasar customer
                const closingData = {
                    nama: customer.nama || 'Tidak ada nama',
                    hp: customer.hp || '',
                    closing_date: new Date().toISOString(),
                    closing_note: note || null,
                    user_id: customer.user_id || currentUser.id,
                    agent_id: customer.agent_id || null,
                    apk: customer.apk || null,
                    upline_name: customer.upline_name || null,
                    upline_phone: customer.upline_phone || null,
                    followup_data: customer.followup_data || null,
                    pending_data: customer.pending_data || [],
                    pesan_terkirim: customer.followup_data?.pesan || null,
                    balasan_diterima: customer.followup_data?.balasan || null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                // ===== TAMBAHKAN DATA TRANSAKSI JIKA ADA =====
                if (transaksiData) {
                    closingData.transaksi_bulan_lalu = transaksiData.transaksi_bulan_lalu || 0;
                    closingData.transaksi_bulan_ini = transaksiData.transaksi_bulan_ini || 0;
                    closingData.periode_bulan_lalu = transaksiData.periode_bulan_lalu || null;
                    closingData.periode_bulan_ini = transaksiData.periode_bulan_ini || null;
                    closingData.progres_jenis = transaksiData.progres_jenis || 'normal';
                    closingData.progres_jumlah = transaksiData.progres_jumlah || 0;
                } else {
                    // ===== SET DEFAULT =====
                    closingData.transaksi_bulan_lalu = 0;
                    closingData.transaksi_bulan_ini = 0;
                    closingData.periode_bulan_lalu = null;
                    closingData.periode_bulan_ini = null;
                    closingData.progres_jenis = 'normal';
                    closingData.progres_jumlah = 0;
                }

                // ===== VALIDASI DATA: pastikan tidak ada field undefined =====
                // Hapus field yang nilainya undefined
                Object.keys(closingData).forEach(key => {
                    if (closingData[key] === undefined) {
                        delete closingData[key];
                    }
                });

                console.log('📊 Data Closing yang akan dikirim:', closingData);

                // ===== SIMPAN KE DB CLOSING =====
                const { error: insertError } = await window.db.from('db_closing').insert(closingData);
                
                if (insertError) {
                    console.error('Error simpan ke db_closing:', insertError);
                    showNotifTop('❌ Gagal menyimpan ke Database Closing: ' + insertError.message, true);
                    return;
                }

                // ===== UPDATE STATUS DI DB_TRANSAKSI =====
                if (transaksiData && transaksiData.id) {
                    await window.db
                        .from('db_transaksi')
                        .update({ 
                            status: 'imported',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', transaksiData.id);
                }

                // ===== HAPUS DARI CUSTOMERS =====
                await window.db.from('customers').delete().eq('id', id);

                showNotifTop('✅ Data berhasil dipindahkan ke Database Closing!');
                modal.remove();
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';

                await loadCustomers();
                await loadDBClosing();
                await loadDbTransaksi();
                closeModal('detailModal');

            } catch (err) {
                console.error('Error dalam proses:', err);
                showNotifTop('❌ Terjadi kesalahan: ' + err.message, true);
            }
        };

        document.getElementById('cancelClosingToDBBtn').onclick = () => {
            modal.remove();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
            }
        };

        applyDarkModeToModal(modal);
    }).catch(err => {
        console.error('Error:', err);
        showNotifTop('❌ Gagal: ' + err.message, true);
    });
}

// ========== KONFIRMASI PROSPEK TERTARIK KE DB COMMITMENT ==========
function confirmTertarikToDB(prospekId) {
    window.db.from('prospek').select('*').eq('id', prospekId).single().then(async ({ data: prospekData }) => {
        if (!prospekData) {
            showNotifTop('❌ Data prospek tidak ditemukan!', true);
            return;
        }
        
        const penawaranDariNegosiasi = prospekData.negosiasi_data?.penawaran || '';
        
        // ===== TIPE AGENT DARI PROSPEK =====
        const tipeAgent = prospekData.tipe_agent || 'AGENT';
        const agentTypeMap = {
            'AGENT': 'AGENT',
            'CA': 'CollectingAgent (CA)',
            'Koordinator': 'Koordinator Wilayah (KORWIL)'
        };
        const agentType = agentTypeMap[tipeAgent] || 'AGENT';
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.style.zIndex = '999999999';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        modal.style.backdropFilter = 'blur(5px)';
        modal.style.pointerEvents = 'auto';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; z-index: 999999999; pointer-events: auto;">
                <h3>⭐ Jadikan Member Baru</h3>
                <div class="modal-subtitle">Data akan dipindahkan ke Database Commitment dan menjadi Member Baru di Followup</div>
                <div style="background: #eef2ff; padding: 12px; border-radius: 10px; margin: 0 20px 10px 20px;">
                    <p style="font-size: 12px; color: #4f46e5; margin: 0;">📌 <strong>Ketentuan:</strong><br>
                    • Data akan disimpan ke DATABASE COMMITMENT sebagai arsip<br>
                    • Data akan DIPINDAHKAN ke FOLLOWUP AGEN dengan status "Baru"<br>
                    • Data akan DIHAPUS dari Prospek Agen<br>
                    • Proses ini TIDAK BISA dibatalkan!</p>
                </div>
                <div style="background: #fef3c7; padding: 12px; border-radius: 10px; margin: 0 20px 10px 20px;">
                    <p style="font-size: 12px; color: #d97706; margin: 0;">📋 <strong>Data Negosiasi:</strong><br>
                    Aplikasi: ${escapeHtml(prospekData.negosiasi_data?.aplikasi || '-')}<br>
                    Domisili: ${escapeHtml(prospekData.negosiasi_data?.domisili || '-')}<br>
                    Transaksi: ${escapeHtml(prospekData.negosiasi_data?.transaksi || '-')}<br>
                    Deposit: ${escapeHtml(prospekData.negosiasi_data?.deposit || '-')}<br>
                    Tertarik: ${escapeHtml(prospekData.negosiasi_data?.tertarik || '-')}<br>
                    <strong>Penawaran: ${escapeHtml(penawaranDariNegosiasi || '-')}</strong></p>
                </div>
                <div style="background: #d1fae5; padding: 12px; border-radius: 10px; margin: 0 20px 10px 20px; border-left: 4px solid #10b981;">
                    <p style="font-size: 12px; color: #065f46; margin: 0;">🏷️ <strong>Tipe Agent:</strong> ${agentType}</p>
                </div>
                <div style="padding: 0 20px 20px 20px;">
                    <div class="form-group">
                        <label>ID Agent <span class="required">*</span></label>
                        <input type="text" id="commitmentAgentId" placeholder="Contoh: AG-001" maxlength="17" style="width:100%; padding: 10px; border-radius: 10px; border: 1px solid #e5e7eb;" oninput="formatAgentIdAuto(this)" value="${escapeHtml(prospekData.agent_id || '')}">
                        <small>ID Agent untuk member baru (huruf besar, angka, max 17 karakter)</small>
                    </div>
                    <div class="form-group">
                        <label>Aplikasi <span class="required">*</span></label>
                        <select id="commitmentAplikasi" style="width:100%; padding: 10px; border-radius: 10px; border: 1px solid #e5e7eb;">
                            <option value="">Pilih Aplikasi</option>
                            <option value="GNP" ${prospekData.negosiasi_data?.aplikasi === 'GNP' ? 'selected' : ''}>GNP</option>
                            <option value="BSB" ${prospekData.negosiasi_data?.aplikasi === 'BSB' ? 'selected' : ''}>BSB</option>
                            <option value="BTN" ${prospekData.negosiasi_data?.aplikasi === 'BTN' ? 'selected' : ''}>BTN</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Tipe Agent <span class="required">*</span></label>
                        <select id="commitmentTipeAgent" style="width:100%; padding: 10px; border-radius: 10px; border: 1px solid #e5e7eb;">
                            <option value="AGENT" ${tipeAgent === 'AGENT' ? 'selected' : ''}>👤 Agent</option>
                            <option value="CA" ${tipeAgent === 'CA' ? 'selected' : ''}>🏦 Collecting Agent (CA)</option>
                            <option value="Koordinator" ${tipeAgent === 'Koordinator' ? 'selected' : ''}>👥 Koordinator</option>
                        </select>
                        <small>Pilih tipe agent untuk perhitungan target KPI</small>
                    </div>
                    <div class="form-group">
                        <label>Upline / Atasan</label>
                        <input type="text" id="commitmentUplineName" placeholder="Nama Upline" style="width:100%; padding: 10px; border-radius: 10px; border: 1px solid #e5e7eb;" maxlength="50" value="${escapeHtml(prospekData.upline_name || '')}">
                        <small>Nama upline/atasan dari member baru</small>
                    </div>
                    <div class="form-group">
                        <label>Nomor HP Upline</label>
                        <div class="phone-input">
                            <div class="phone-prefix">+62</div>
                            <input type="tel" id="commitmentUplinePhone" placeholder="81234567890" style="flex:1; padding: 10px; border-radius: 10px; border: 1px solid #e5e7eb;" oninput="formatPhoneAuto(this)" value="${escapeHtml(prospekData.upline_phone ? prospekData.upline_phone.replace('+62', '') : '')}">
                        </div>
                        <small>Nomor WhatsApp upline (awalan 8, 9-12 digit)</small>
                    </div>
                    <div class="form-group">
                        <label>Catatan (Opsional)</label>
                        <textarea id="commitmentNote" rows="2" placeholder="Contoh: Akan followup bulan depan..." style="width:100%; padding: 10px; border-radius: 10px; border: 1px solid #e5e7eb;"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Tanggal Followup (Opsional)</label>
                        <input type="date" id="commitmentFollowupDate" style="width:100%; padding: 10px; border-radius: 10px; border: 1px solid #e5e7eb;">
                    </div>
                </div>
                <div class="modal-buttons" style="display: flex; gap: 12px; padding: 16px 20px 20px;">
                    <button id="confirmTertarikToDBBtn" class="btn-primary" style="flex: 1; cursor: pointer;">✅ Ya, Jadikan Member Baru</button>
                    <button id="cancelTertarikToDBBtn" class="btn-outline" style="flex: 1; cursor: pointer;">❌ Batal</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        
        // ===== TOMBOL KONFIRMASI =====
        document.getElementById('confirmTertarikToDBBtn').onclick = async () => {
            const agentId = document.getElementById('commitmentAgentId').value;
            const aplikasi = document.getElementById('commitmentAplikasi').value;
            const tipeAgentSelected = document.getElementById('commitmentTipeAgent').value;
            const uplineName = document.getElementById('commitmentUplineName').value;
            let uplinePhone = document.getElementById('commitmentUplinePhone').value;
            const note = document.getElementById('commitmentNote').value;
            const followupDateInput = document.getElementById('commitmentFollowupDate').value;
            
            if (!agentId || !aplikasi) {
                showNotifTop('⚠️ ID Agent dan Aplikasi wajib diisi!', true);
                return;
            }
            
            let formattedUplinePhone = '';
            if (uplinePhone) {
                uplinePhone = uplinePhone.replace(/[^\d]/g, '');
                if (uplinePhone.startsWith('0')) uplinePhone = uplinePhone.substring(1);
                if (uplinePhone && !uplinePhone.startsWith('62')) uplinePhone = '62' + uplinePhone;
                formattedUplinePhone = '+' + uplinePhone;
            }
            
            const data = prospekData;
            const formattedAgentId = agentId.toUpperCase();
            
            // ===== CEK DUPLIKAT DI FOLLOWUP =====
            const { data: existingCustomer } = await window.db
                .from('customers')
                .select('id')
                .eq('agent_id', formattedAgentId)
                .maybeSingle();
            
            if (existingCustomer) {
                showNotifTop(`⚠️ ID Agent "${formattedAgentId}" sudah terdaftar di Followup Agen!`, true);
                return;
            }
            
            // ===== CEK DUPLIKAT DI DB_AGENT =====
            const { data: existingAgent } = await window.db
                .from('db_agent')
                .select('id')
                .eq('agent_id', formattedAgentId)
                .maybeSingle();
            
            if (existingAgent) {
                showNotifTop(`⚠️ ID Agent "${formattedAgentId}" sudah terdaftar di Database Agent!`, true);
                return;
            }
            
            let followupDateValue = followupDateInput;
            if (!followupDateValue) {
                const nextMonth = new Date();
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                followupDateValue = nextMonth.toISOString().split('T')[0];
            }
            
            // ===== MAP TIPE AGENT =====
            const agentTypeMap = {
                'AGENT': 'AGENT',
                'CA': 'CollectingAgent (CA)',
                'Koordinator': 'Koordinator Wilayah (KORWIL)'
            };
            const agentTypeDisplay = agentTypeMap[tipeAgentSelected] || 'AGENT';
            
            // Siapkan data dihubungi yang lengkap
            const dihubungiData = data.dihubungi_data ? {
                terkirim: data.dihubungi_data.terkirim || false,
                dibalas: data.dihubungi_data.dibalas || false,
                pesan: data.dihubungi_data.pesan || null,
                balasan: data.dihubungi_data.balasan || null,
                timestamp: data.dihubungi_data.timestamp || new Date().toISOString()
            } : null;
            
            try {
                // ===== 1. SIMPAN KE DB AGENT =====
                const { error: agentError } = await window.db.from('db_agent').insert({
                    agent_id: formattedAgentId,
                    nama: data.nama,
                    hp: data.hp,
                    apk: aplikasi,
                    agent_type: agentTypeDisplay,
                    upline: uplineName || null,
                    upline_phone: formattedUplinePhone || null,
                    user_id: data.user_id || currentUser.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
                
                if (agentError) {
                    console.error('Error simpan ke db_agent:', agentError);
                    showNotifTop('❌ Gagal menyimpan ke Database Agent: ' + agentError.message, true);
                    return;
                }
                
                console.log('✅ Berhasil simpan ke db_agent dengan tipe:', agentTypeDisplay);
                
                // ===== 2. SIMPAN KE DB COMMITMENT =====
                const { error: commitError } = await window.db.from('db_commitment').insert({
                    nama: data.nama,
                    hp: data.hp,
                    agent_id: formattedAgentId,
                    aplikasi: aplikasi,
                    upline_name: uplineName || null,
                    upline_phone: formattedUplinePhone || null,
                    penawaran: penawaranDariNegosiasi,
                    commitment_note: note || null,
                    committed_at: new Date().toISOString(),
                    followup_date: followupDateValue,
                    user_id: data.user_id || currentUser.id,
                    original_prospek_id: prospekId,
                    pesan_terkirim: data.pesan_terkirim || null,
                    balasan_diterima: data.balasan_diterima || null,
                    dihubungi_data: dihubungiData,
                    negosiasi_data: {
                        aplikasi: data.negosiasi_data?.aplikasi || '',
                        domisili: data.negosiasi_data?.domisili || '',
                        transaksi: data.negosiasi_data?.transaksi || '',
                        deposit: data.negosiasi_data?.deposit || '',
                        tertarik: data.negosiasi_data?.tertarik || '',
                        penawaran: penawaranDariNegosiasi,
                        timestamp: new Date().toISOString()
                    },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
                
                if (commitError) {
                    console.error('Error simpan ke db_commitment:', commitError);
                    showNotifTop('❌ Gagal menyimpan ke Database Commitment: ' + commitError.message, true);
                    return;
                }
                
                console.log('✅ Berhasil simpan ke db_commitment dengan pesan dihubungi:', dihubungiData?.pesan);
                
                // ===== 3. PINDAHKAN KE FOLLOWUP AGEN =====
                const followupDate = getTodayDate();
                await window.db.from('customers').insert({
                    agent_id: formattedAgentId,
                    nama: data.nama,
                    hp: data.hp,
                    apk: aplikasi,
                    upline_name: uplineName || '',
                    upline_phone: formattedUplinePhone || '',
                    tanggal: followupDate,
                    status: 'baru',
                    user_id: data.user_id || currentUser.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    pesan_terkirim: data.pesan_terkirim || null,
                    balasan_diterima: data.balasan_diterima || null
                });
                
                // ===== 4. HAPUS DARI PROSPEK =====
                await window.db.from('prospek').delete().eq('id', prospekId);
                
                showNotifTop(`✅ Berhasil! Member baru (${agentTypeDisplay}) telah ditambahkan ke Followup Agen, Database Agent, dan tersimpan di Database Commitment`);
                modal.remove();
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                
                // ===== 5. RELOAD SEMUA DATA =====
                await loadCustomers();
                await loadProspek();
                await loadDBCommitment();
                await loadDatabaseAgent();
                await updateTargetDisplay();
                closeModal('detailModal');
                
            } catch (err) {
                console.error('Error:', err);
                showNotifTop('❌ Terjadi kesalahan: ' + err.message, true);
            }
        };
        
        document.getElementById('cancelTertarikToDBBtn').onclick = () => {
            modal.remove();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
        };
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
            }
        };
        
        // ===== APPLY DARK MODE =====
        applyDarkModeToModal(modal);
        
    }).catch(err => {
        console.error('Error:', err);
        showNotifTop('❌ Gagal memuat data prospek: ' + err.message, true);
    });
}

// ========== FUNGSI TAMBAHAN UNTUK DEADLINE ==========
function addDaysFromToday(days) {
    // ===== PERBAIKAN: Gunakan tanggal lokal, hindari timezone UTC =====
    const today = new Date();
    today.setDate(today.getDate() + days);
    
    // Format manual ke YYYY-MM-DD dengan waktu LOKAL
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getFirstDayOfNextMonth() {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const year = nextMonth.getFullYear();
    const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
    const day = String(nextMonth.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ========== FUNGSI updateCustomerStatus ==========
async function updateCustomerStatus(id, newStatus) {
    const customer = customersData.find(c => c.id === id);
    if (!customer) return;
    
    // Jika dari Follow Up ke Pending
    if (customer.status === 'followup' && newStatus === 'pending') {
        openFollowupConfirm(id);
        return;
    }
    
    // Jika dari Pending ke Closing
    if (customer.status === 'pending' && newStatus === 'closing') {
        const newDeadline = getFirstDayOfNextMonth();
        
        const { error } = await window.db
            .from('customers')
            .update({ status: newStatus, tanggal: newDeadline, updated_at: new Date().toISOString() })
            .eq('id', id);
        
        if (error) {
            showNotifTop('❌ Gagal update: ' + error.message, true);
            return;
        }
        
        showNotifTop(`✅ Customer dipindahkan ke Closing. Deadline menjadi tanggal 1 bulan depan (${newDeadline})`);
        closeModal('detailModal');
        await loadCustomers();
        return;
    }
    
    // Jika dari Closing ke DB Closing
    if (customer.status === 'closing' && newStatus === 'db_closing') {
        confirmClosingToDB(id);
        return;
    }
    
    // Jika dari Baru ke Follow Up
    if (customer.status === 'baru' && newStatus === 'followup') {
        const { error } = await window.db
            .from('customers')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', id);
        
        if (error) {
            showNotifTop('❌ Gagal update: ' + error.message, true);
            return;
        }
        
        showNotifTop(`✅ Status berhasil diupdate ke Follow Up. Deadline tidak berubah.`);
        closeModal('detailModal');
        await loadCustomers();
        return;
    }
    
    showNotifTop('⚠️ Aksi tidak dikenali!', true);
}

// ========== FUNGSI updateProspekStatus ==========
async function updateProspekStatus(id, newStatus) {
    const prospek = prospekData.find(p => p.id === id);
    if (!prospek) return;
    
    // Jika dari Negosiasi ke Tertarik
    if (prospek.status === 'Negosiasi' && newStatus === 'Tertarik') {
        // Ambil data negosiasi yang sudah ada
        const negosiasiData = prospek.negosiasi_data || {};
        
        // Tampilkan konfirmasi dengan ringkasan data
        if (!confirm(`⭐ KONFIRMASI PINDAH KE TERTARIK\n\nData Negosiasi:\nAplikasi: ${negosiasiData.aplikasi || '-'}\nDomisili: ${negosiasiData.domisili || '-'}\nTransaksi: ${negosiasiData.transaksi || '-'}\nPenawaran: ${negosiasiData.penawaran || '-'}\n\nApakah data sudah lengkap dan prospek TERTARIK?`)) {
            return;
        }
        
        const newDeadline = addDaysFromToday(1);
        
        const { error } = await window.db
            .from('prospek')
            .update({ 
                status: newStatus, 
                deadline: newDeadline, 
                updated_at: new Date().toISOString(),
                // Pastikan negosiasi_data tetap tersimpan
                negosiasi_data: negosiasiData
            })
            .eq('id', id);
        
        if (error) {
            showNotifTop('❌ Gagal update: ' + error.message, true);
            return;
        }
        
        showNotifTop(`✅ Prospek dipindahkan ke Tertarik. Deadline +1 hari dari hari ini menjadi ${newDeadline}`);
        closeModal('detailModal');
        await loadProspek();
        return;
    }
    
    // Jika dari Tertarik ke DB Commitment - panggil confirmTertarikToDB
    if (prospek.status === 'Tertarik' && newStatus === 'db_commitment') {
        confirmTertarikToDB(id);
        return;
    }
    
    // Untuk status lainnya (Baru -> Dihubungi, Dihubungi -> Negosiasi) tidak menambah deadline
    let daysToAdd = 0;
    if (newStatus === 'Dihubungi') daysToAdd = 0;
    else if (newStatus === 'Negosiasi') daysToAdd = 0;
    
    const newDeadline = addDaysToDate(prospek.deadline || getTodayDate(), daysToAdd);
    
    const { error } = await window.db
        .from('prospek')
        .update({ status: newStatus, deadline: newDeadline, updated_at: new Date().toISOString() })
        .eq('id', id);
    
    if (error) {
        showNotifTop('❌ Gagal update: ' + error.message, true);
        return;
    }
    
    showNotifTop(`✅ Status berhasil diupdate ke ${newStatus}. Deadline tidak berubah`);
    closeModal('detailModal');
    await loadProspek();
}

// ========== DELETE CUSTOMER ==========
async function deleteCustomer(id) {
    if (!confirm('Yakin hapus customer ini? Data akan dihapus permanen!')) return;
    
    // ===== AMBIL DATA CUSTOMER SEBELUM DIHAPUS =====
    const { data: customer, error: getError } = await window.db
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
    
    if (getError) {
        showNotifTop('❌ Gagal mengambil data: ' + getError.message, true);
        return;
    }
    
    // ===== CEK APAKAH DATA INI DARI TRANSAKSI =====
    const agentId = customer?.agent_id;
    let transaksiId = null;
    
    if (agentId) {
        const { data: transaksiData } = await window.db
            .from('db_transaksi')
            .select('id')
            .eq('agent_id', agentId)
            .eq('status', 'imported')
            .maybeSingle();
        
        if (transaksiData) {
            transaksiId = transaksiData.id;
        }
    }
    
    // ===== HAPUS CUSTOMER =====
    const { error } = await window.db.from('customers').delete().eq('id', id);
    if (error) {
        showNotifTop('❌ Gagal hapus: ' + error.message, true);
        return;
    }
    
    // ===== KEMBALIKAN STATUS DI DB_TRANSAKSI =====
    if (transaksiId) {
        const { error: updateError } = await window.db
            .from('db_transaksi')
            .update({ 
                status: 'pending_import',
                updated_at: new Date().toISOString()
            })
            .eq('id', transaksiId);
        
        if (updateError) {
            console.warn('⚠️ Gagal mengembalikan status transaksi:', updateError);
        } else {
            showNotifTop('🔄 Status di DB Transaksi dikembalikan ke Pending');
        }
    }
    
    showNotifTop('🗑️ Data customer berhasil dihapus');
    closeModal('detailModal');
    await loadCustomers();
    await loadDbTransaksi();
    renderFullFollowupKanban();
    updateChartCustomer();
    updateStats();
    updateDeadlineBadge();
}

// ========== DELETE PROSPEK ==========
async function deleteProspek(id) {
    if (!confirm('Yakin hapus prospek ini? Data akan dihapus permanen!')) return;
    
    try {
        const { error } = await window.db.from('prospek').delete().eq('id', id);
        if (error) {
            showNotifTop('❌ Gagal hapus: ' + error.message, true);
            return;
        }
        
        showNotifTop('🗑️ Data prospek berhasil dihapus');
        closeModal('detailModal');
        await loadProspek();
        renderFullProspekKanban();
        updateChartProspek();
        updateDeadlineBadge();
        
    } catch (err) {
        console.error('Error delete prospek:', err);
        showNotifTop('❌ Gagal: ' + err.message, true);
    }
}

// ================================================================
// ========== RENDER CHAT MODERN (UNTUK DETAIL) ==========
// ================================================================

/**
 * Render chat modern untuk riwayat komunikasi di detail (READ-ONLY)
 * @param {Array} history - Array riwayat komunikasi
 * @param {string} containerId - ID container
 * @param {Object} options - Opsi tambahan
 */
function renderChatModern(history, containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const {
        title = '💬 Riwayat Komunikasi',
        emptyMessage = 'Belum ada riwayat komunikasi',
        showHeader = true,
        showAvatar = true,
        showTime = true,
        showStatus = true,
        maxItems = 30, // REDUKSI DARI 50 KE 30
        senderLabel = 'CS Agent',
        receiverLabel = 'Customer'
    } = options;
    
    if (!history || history.length === 0) {
        container.innerHTML = `
            <div class="chat-modern-empty">
                <div class="empty-icon">💬</div>
                <div class="empty-title">${emptyMessage}</div>
            </div>
        `;
        return;
    }
    
    // ===== BATASI HISTORI =====
    const displayHistory = history.slice(-maxItems);
    const totalMessages = displayHistory.length;
    const totalPesan = displayHistory.filter(h => h.pesan && h.pesan.trim()).length;
    const totalBalasan = displayHistory.filter(h => h.balasan && h.balasan.trim()).length;
    
    let html = '';
    
    if (showHeader) {
        html += `
            <div class="chat-modern-header">
                <div class="chat-title">
                    💬 ${title}
                    <span style="font-size: 10px; font-weight: 400; color: #9ca3af; margin-left: 4px;">
                        (${totalMessages} pesan)
                    </span>
                </div>
                <div class="chat-meta">
                    📤 ${totalPesan} · 📥 ${totalBalasan}
                </div>
            </div>
        `;
    }
    
    let prevDate = '';
    
    displayHistory.forEach((item) => {
        const pesan = item.pesan || '';
        const balasan = item.balasan || '';
        const timestamp = item.timestamp || item.created_at || '';
        const dateStr = timestamp ? formatDateDDMMYYYY(timestamp) : '';
        const timeStr = timestamp ? formatTimeMessage(timestamp) : '';
        const isRead = item.dibalas === true || item.dibalas === 'true';
        
        // ===== HANYA TAMPILKAN TANGGAL JIKA BERBEDA =====
        if (dateStr && dateStr !== prevDate) {
            html += `
                <div class="chat-modern-message system">
                    <div class="chat-modern-bubble">📅 ${dateStr}</div>
                </div>
            `;
            prevDate = dateStr;
        }
        
        // ===== PESAN TERKIRIM (Pengirim - CS Agent) =====
        if (pesan) {
            const initials = getInitials(senderLabel);
            html += `
                <div class="chat-modern-message sent">
                    ${showAvatar ? `
                        <div class="chat-modern-avatar sender">
                            <span class="avatar-initials">${initials}</span>
                        </div>
                    ` : ''}
                    <div class="chat-modern-bubble">
                        ${escapeHtml(pesan)}
                        ${showTime ? `
                            <span class="chat-modern-time">
                                ${timeStr || 'Baru saja'}
                                ${showStatus ? `
                                    <span class="chat-modern-status ${isRead ? 'read' : 'unread'}">
                                        <span class="status-dot"></span>
                                        ${isRead ? 'Dibaca' : 'Belum Dibaca'}
                                    </span>
                                ` : ''}
                            </span>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        // ===== BALASAN (Penerima - Customer) =====
        if (balasan) {
            const initials = getInitials(receiverLabel);
            html += `
                <div class="chat-modern-message received">
                    ${showAvatar ? `
                        <div class="chat-modern-avatar receiver">
                            <span class="avatar-initials">${initials}</span>
                        </div>
                    ` : ''}
                    <div class="chat-modern-bubble">
                        ${escapeHtml(balasan)}
                        ${showTime ? `
                            <span class="chat-modern-time">${timeStr || 'Baru saja'}</span>
                        ` : ''}
                    </div>
                </div>
            `;
        }
    });
    
    container.innerHTML = html;
    
    // ===== SCROLL KE BAWAH =====
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

// ================================================================
// ========== RENDER CHAT PREMIUM DENGAN INPUT ==========
// ================================================================

function renderChatPremiumWithInput(history, containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const {
        title = '💬 Riwayat Komunikasi',
        emptyMessage = 'Belum ada riwayat komunikasi',
        showHeader = false,
        showAvatar = true,
        showTime = true,
        showStatus = true,
        maxItems = 20,
        onSendMessage = null,
        senderLabel = 'CS Agent',
        receiverLabel = 'Customer'
    } = options;
    
    // ===== RENDER CHAT =====
    if (!history || history.length === 0) {
        container.innerHTML = `
            <div class="chat-premium-empty">
                <div class="empty-icon">💬</div>
                <div class="empty-title">${emptyMessage}</div>
            </div>
        `;
    } else {
        const displayHistory = history.slice(-maxItems);
        let html = '';
        let prevDate = '';
        
        displayHistory.forEach((item) => {
            const pesan = item.pesan || '';
            const balasan = item.balasan || '';
            const timestamp = item.timestamp || item.created_at || '';
            const dateStr = timestamp ? formatDateDDMMYYYY(timestamp) : '';
            const timeStr = timestamp ? formatTimeMessage(timestamp) : '';
            const isRead = item.dibalas === true || item.dibalas === 'true';
            
            if (dateStr && dateStr !== prevDate) {
                html += `
                    <div class="chat-premium-message system">
                        <div class="chat-premium-bubble">📅 ${dateStr}</div>
                    </div>
                `;
                prevDate = dateStr;
            }
            
            if (pesan) {
                const initials = getInitials(senderLabel);
                html += `
                    <div class="chat-premium-message sent">
                        ${showAvatar ? `
                            <div class="chat-premium-avatar sender">
                                <span class="avatar-initials">${initials}</span>
                            </div>
                        ` : ''}
                        <div class="chat-premium-bubble">
                            ${escapeHtml(pesan)}
                            ${showTime ? `
                                <span class="chat-premium-time">
                                    ${timeStr || 'Baru saja'}
                                    ${showStatus ? `
                                        <span class="chat-premium-status ${isRead ? 'read' : 'sent'}">
                                            ${isRead ? '✅' : '⏳'}
                                        </span>
                                    ` : ''}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
            
            if (balasan) {
                const initials = getInitials(receiverLabel);
                html += `
                    <div class="chat-premium-message received">
                        ${showAvatar ? `
                            <div class="chat-premium-avatar receiver">
                                <span class="avatar-initials">${initials}</span>
                            </div>
                        ` : ''}
                        <div class="chat-premium-bubble">
                            ${escapeHtml(balasan)}
                            ${showTime ? `
                                <span class="chat-premium-time">${timeStr || 'Baru saja'}</span>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
        });
        
        container.innerHTML = html;
    }
    
    // ===== HAPUS INPUT GROUP LAMA =====
    const oldInputGroup = container.querySelector('.chat-premium-input-group');
    if (oldInputGroup) {
        oldInputGroup.remove();
    }
    
    // ===== TAMBAHKAN INPUT GROUP =====
    const inputGroup = document.createElement('div');
    inputGroup.className = 'chat-premium-input-group';
    inputGroup.innerHTML = `
        <div class="chat-premium-input-wrapper">
            <textarea class="chat-premium-input" rows="1" placeholder="Tulis pesan..." id="chatPremiumInput"></textarea>
        </div>
        <div class="chat-premium-role-selector">
            <button class="chat-premium-role-btn active-sender" data-role="sender" id="chatRoleSender">📤 CS</button>
            <button class="chat-premium-role-btn" data-role="receiver" id="chatRoleReceiver">📥 Customer</button>
        </div>
        <button class="chat-premium-send-btn" id="chatPremiumSendBtn">📤 Kirim</button>
    `;
    
    container.appendChild(inputGroup);
    
    // ===== EVENT LISTENERS =====
    const input = container.querySelector('#chatPremiumInput');
    const sendBtn = container.querySelector('#chatPremiumSendBtn');
    const roleSender = container.querySelector('#chatRoleSender');
    const roleReceiver = container.querySelector('#chatRoleReceiver');
    let currentRole = 'sender';
    
    if (roleSender && roleReceiver) {
        roleSender.addEventListener('click', function() {
            this.classList.add('active-sender');
            this.classList.remove('active-receiver');
            roleReceiver.classList.remove('active-sender', 'active-receiver');
            currentRole = 'sender';
        });
        
        roleReceiver.addEventListener('click', function() {
            this.classList.add('active-receiver');
            this.classList.remove('active-sender');
            roleSender.classList.remove('active-sender', 'active-receiver');
            currentRole = 'receiver';
        });
    }
    
    const sendMessage = () => {
        const message = input.value.trim();
        if (!message) return;
        
        if (onSendMessage) {
            onSendMessage(message, currentRole);
        }
        input.value = '';
        input.style.height = 'auto';
    };
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        input.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });
    }
    
    // ===== SCROLL KE BAWAH =====
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

// ================================================================
// ========== CHAT PREMIUM RENDERER ==========
// ================================================================

/**
 * Render chat premium untuk riwayat dihubungi
 * @param {Array} history - Array riwayat dihubungi
 * @param {string} containerId - ID container
 * @param {Object} options - Opsi tambahan
 */
function renderChatPremium(history, containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const {
        title = '📞 Riwayat Dihubungi',
        emptyMessage = 'Belum ada riwayat komunikasi',
        showHeader = true,
        showAvatar = true,
        showTime = true,
        maxItems = 50
    } = options;
    
    if (!history || history.length === 0) {
        container.innerHTML = `
            <div class="chat-premium-empty">
                <div class="empty-icon">💬</div>
                <div class="empty-title">${emptyMessage}</div>
            </div>
        `;
        return;
    }
    
    // Batasi jumlah item
    const displayHistory = history.slice(-maxItems);
    
    // Hitung statistik
    const totalMessages = displayHistory.length;
    const totalPesan = displayHistory.filter(h => h.pesan && h.pesan.trim()).length;
    const totalBalasan = displayHistory.filter(h => h.balasan && h.balasan.trim()).length;
    
    let html = '';
    
    // Header
    if (showHeader) {
        html += `
            <div class="chat-premium-header">
                <div class="chat-title">
                    💬 ${title}
                    <span style="font-size: 11px; font-weight: 400; color: #9ca3af; margin-left: 4px;">
                        (${totalMessages} pesan)
                    </span>
                </div>
                <div class="chat-meta">
                    📤 ${totalPesan} terkirim · 📥 ${totalBalasan} balasan
                </div>
            </div>
        `;
    }
    
    // Messages
    html += `<div class="chat-premium-messages">`;
    
    let prevDate = '';
    
    displayHistory.forEach((item, index) => {
        const isSender = item.dibalas === true || item.dibalas === 'true';
        const pesan = item.pesan || '';
        const balasan = item.balasan || '';
        const timestamp = item.timestamp || item.created_at || '';
        const dateStr = timestamp ? formatDateDDMMYYYY(timestamp) : '';
        const timeStr = timestamp ? formatTimeMessage(timestamp) : '';
        
        // Tambahkan pemisah tanggal jika berubah
        if (dateStr && dateStr !== prevDate) {
            html += `
                <div class="chat-premium-message system">
                    <div class="chat-premium-bubble">
                        📅 ${dateStr}
                    </div>
                </div>
            `;
            prevDate = dateStr;
        }
        
        // ===== PESAN TERKIRIM (Pengirim) =====
        if (pesan) {
            const avatarName = 'CS Agent';
            const initials = getInitials(avatarName);
            
            html += `
                <div class="chat-premium-message sent">
                    ${showAvatar ? `
                        <div class="chat-premium-avatar sender">
                            <span class="avatar-initials">${initials}</span>
                        </div>
                    ` : ''}
                    <div class="chat-premium-bubble">
                        ${escapeHtml(pesan)}
                        ${showTime ? `<span class="chat-premium-time">${timeStr || 'Baru saja'} <span class="chat-premium-status read">✅</span></span>` : ''}
                    </div>
                </div>
            `;
        }
        
        // ===== BALASAN (Penerima) =====
        if (balasan) {
            const avatarName = 'Customer';
            const initials = getInitials(avatarName);
            
            html += `
                <div class="chat-premium-message received">
                    ${showAvatar ? `
                        <div class="chat-premium-avatar receiver">
                            <span class="avatar-initials">${initials}</span>
                        </div>
                    ` : ''}
                    <div class="chat-premium-bubble">
                        ${escapeHtml(balasan)}
                        ${showTime ? `<span class="chat-premium-time">${timeStr || 'Baru saja'}</span>` : ''}
                    </div>
                </div>
            `;
        }
    });
    
    html += `</div>`;
    container.innerHTML = html;
    
    // Scroll ke bawah
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

/**
 * Format waktu untuk chat
 */
function formatTimeMessage(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Baru saja';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm yang lalu';
        if (diff < 86400000) {
            return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        }
        if (diff < 604800000) {
            const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            return days[date.getDay()];
        }
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    } catch (e) {
        return '';
    }
}

/**
 * Dapatkan inisial dari nama
 */
function getInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// ========== LOAD DATA FUNCTIONS ==========
async function loadCustomers() {
    if (!currentUser) return;
    let query = window.db.from('customers').select('*');
    if (currentUserRole !== 'owner') query = query.eq('user_id', currentUser.id);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) { console.error('Error loading customers:', error); return; }
    customersData = data || [];
    renderFollowupKanban();
    renderFullFollowupKanban();
    updateStats();
    updateChartCustomer();
    updateDeadlineBadge();
}

async function loadProspek() {
    if (!currentUser) return;
    
    let query = window.db.from('prospek').select('*');
    if (currentUserRole !== 'owner') {
        query = query.eq('user_id', currentUser.id);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
        console.error('Error loading prospek:', error);
        return;
    }
    
    prospekData = data || [];
    renderProspekKanban();
    renderFullProspekKanban();
    updateChartProspek();
    updateDeadlineBadge();
}

// ========== LOAD DATABASE AGENT ==========
async function loadDatabaseAgent() {
    if (!currentUser) return;
    
    // ===== PERBAIKAN: Owner dan CS melihat semua agent =====
    let query = window.db.from('db_agent').select('*');
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
        console.error('Error loading agents:', error);
        return;
    }
    
    agentsData = data || [];
    renderAgentList(agentsData);
    
    // ===== POPULATE UPLINE FILTER =====
    populateUplineFilter();
    
    await updateTargetDisplay();
}

async function loadProduk() {
    if (!currentUser) return;
    
    const { data, error } = await window.db.from('produk').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error('Error loading produk:', error);
        return;
    }
    
    produkData = data || [];
    renderProdukList();
}

// ========== LOAD DB TRANSAKSI (TANPA BATAS) ==========
async function loadDbTransaksi() {
    if (!currentUser) return;
    if (window._isLoadingTransaksi) return;
    if (transaksiData && transaksiData.length > 0 && isAppInitialized) return;
    try {
        window._isLoadingTransaksi = true;
        let allData = [], page = 0, pageSize = 1000, hasMore = true, totalCount = 0;
        while (hasMore) {
            const start = page * pageSize, end = start + pageSize - 1;
            // ===== PERBAIKAN: Hapus filter user_id untuk transaksi =====
            // CS dan Owner sama-sama melihat semua data transaksi
            let query = window.db.from('db_transaksi').select('*', { count: 'exact' });
            // HAPUS INI: if (currentUserRole !== 'owner') query = query.eq('user_id', currentUser.id);
            const { data, error, count } = await query.order('created_at', { ascending: false }).range(start, end);
            if (error) { console.error('Error loading transaksi:', error); window._isLoadingTransaksi = false; return; }
            if (page === 0) totalCount = count || 0;
            if (!data || data.length === 0) { hasMore = false; break; }
            allData = allData.concat(data);
            if (data.length < pageSize || allData.length >= totalCount) hasMore = false;
            page++;
            await delay(50);
        }
        window.transaksiData = allData;
        transaksiData = allData;
        renderTransaksiList();
        updateTransaksiStats(transaksiData);
        updateSelectAllTransaksiButton();
        updateTransaksiSelectionCount();
        await loadTargetData();
        await updateTargetDisplay();
        updateTrendChart();
        const totalAllSpan = document.getElementById('transaksiTotalAll');
        if (totalAllSpan) totalAllSpan.innerText = totalCount.toLocaleString();
        const totalCountSpan = document.getElementById('transaksiTotalCount');
        if (totalCountSpan) totalCountSpan.innerText = allData.length.toLocaleString();
        const totalInfoSpan = document.getElementById('transaksiTotalInfo');
        if (totalInfoSpan) {
            totalInfoSpan.innerText = allData.length < totalCount ? `⚠️ Menampilkan ${allData.length.toLocaleString()} dari ${totalCount.toLocaleString()} data` : `✅ Semua ${totalCount.toLocaleString()} data ditampilkan`;
        }
        showNotifTop(`✅ ${allData.length.toLocaleString()} data transaksi berhasil dimuat`);
    } catch (err) {
        console.error('Error loadDbTransaksi:', err);
        showNotifTop('❌ Gagal memuat data: ' + err.message, true);
    } finally {
        window._isLoadingTransaksi = false;
    }
}

async function loadDBClosing() {
    if (!currentUser) return;
    
    let query = window.db.from('db_closing').select('*');
    if (currentUserRole !== 'owner') {
        query = query.eq('user_id', currentUser.id);
    }
    
    const { data, error } = await query.order('closing_date', { ascending: false });
    if (error) {
        console.error('Error loading closing:', error);
        return;
    }
    
    renderDBClosing(data || []);
}

async function loadDBTidak() {
    if (!currentUser) return;
    
    let query = window.db.from('db_tidak_tertarik').select('*');
    if (currentUserRole !== 'owner') {
        query = query.eq('user_id', currentUser.id);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
        console.error('Error loading tidak tertarik:', error);
        return;
    }
    
    renderDBTidak(data || []);
}

async function loadDBNomorSalah() {
    if (!currentUser) return;
    
    let query = window.db.from('nomor_salah').select('*');
    if (currentUserRole !== 'owner') {
        query = query.eq('user_id', currentUser.id);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
        console.error('Error loading nomor salah:', error);
        return;
    }
    
    renderDBNomorSalah(data || []);
}

async function loadDBCommitment() {
    if (!currentUser) return;
    
    let query = window.db.from('db_commitment').select('*');
    if (currentUserRole !== 'owner') {
        query = query.eq('user_id', currentUser.id);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
        console.error('Error loading commitment:', error);
        return;
    }
    
    renderDBCommitment(data || []);
}

async function loadReminders() {
    if (!currentUser) return;
    
    let query = window.db.from('reminders').select('*');
    if (currentUserRole !== 'owner') {
        query = query.eq('user_id', currentUser.id);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
        console.error('Error loading reminders:', error);
        return;
    }
    
    remindersData = data || [];
    renderRemindersList();
}

async function loadMessages() {
    if (!currentUser) return;
    
    const { data, error } = await window.db
        .from('messages')
        .select('*')
        .or(`from_id.eq.${currentUser.id},to_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error loading messages:', error);
        return;
    }
    
    messagesData = data || [];
    renderMessagesList();
    updatePesanBadge();
    
    // Jika halaman pesan aktif, refresh chat
    if (document.getElementById('pesanPage')?.style.display !== 'none') {
        loadPesanUsers();
        if (pesanCurrentChatId) {
            loadPesanMessages(pesanCurrentChatId);
        }
    }
}

// ================================================================
// ========== PESAN PAGE - WHATSAPP STYLE ==========
// ================================================================

let pesanCurrentChatId = null;
let pesanAllMessages = [];
let pesanUsers = [];
let pesanFilteredUsers = [];
let pesanAutoRefreshInterval = null;

// ===== LOAD PESAN USERS (SEMUA USER YANG PERNAH CHAT) =====
async function loadPesanUsers() {
    if (!currentUser) return;

    try {
        // Ambil semua user yang pernah mengirim atau menerima pesan dengan user ini
        const { data, error } = await window.db
            .from('messages')
            .select('from_id, from_name, to_id, to_name, created_at')
            .or(`from_id.eq.${currentUser.id},to_id.eq.${currentUser.id}`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Buat map user unik
        const userMap = new Map();
        
        (data || []).forEach(msg => {
            let userId, userName;
            if (msg.from_id === currentUser.id) {
                // Pesan dari saya ke orang lain
                userId = msg.to_id;
                userName = msg.to_name || 'CS Agent';
            } else {
                // Pesan dari orang lain ke saya
                userId = msg.from_id;
                userName = msg.from_name || 'CS Agent';
            }
            
            if (!userMap.has(userId)) {
                userMap.set(userId, {
                    id: userId,
                    name: userName,
                    lastMessage: msg,
                    unread: 0
                });
            }
        });

        // Hitung unread per user
        const unreadData = messagesData.filter(m => !m.is_read && m.from_id !== currentUser.id);
        unreadData.forEach(msg => {
            if (userMap.has(msg.from_id)) {
                const user = userMap.get(msg.from_id);
                user.unread = (user.unread || 0) + 1;
            }
        });

        pesanUsers = Array.from(userMap.values());
        
        // Urutkan berdasarkan pesan terbaru
        pesanUsers.sort((a, b) => {
            const timeA = a.lastMessage?.created_at || '';
            const timeB = b.lastMessage?.created_at || '';
            return timeB.localeCompare(timeA);
        });

        renderPesanUserList(pesanUsers);
        
        // Jika ada chat yang sedang aktif, refresh pesannya
        if (pesanCurrentChatId) {
            await loadPesanMessages(pesanCurrentChatId);
        }

    } catch (err) {
        console.error('Error loading pesan users:', err);
        showNotifTop('❌ Gagal memuat daftar chat: ' + err.message, true);
    }
}

// ===== RENDER USER LIST =====
function renderPesanUserList(users) {
    const container = document.getElementById('pesanUserList');
    if (!container) return;

    const searchQuery = document.getElementById('pesanSearchInput')?.value.toLowerCase().trim() || '';
    
    let filtered = users;
    if (searchQuery) {
        filtered = users.filter(u => 
            u.name.toLowerCase().includes(searchQuery) ||
            u.id.toLowerCase().includes(searchQuery)
        );
    }
    pesanFilteredUsers = filtered;

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px 16px; color: #9ca3af;">
                <div style="font-size: 28px; margin-bottom: 8px;">💬</div>
                <div style="font-size: 13px;">${searchQuery ? 'Tidak ditemukan' : 'Belum ada chat'}</div>
                <div style="font-size: 11px; margin-top: 4px;">${searchQuery ? 'Coba dengan kata kunci lain' : 'Kirim pesan untuk memulai percakapan'}</div>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(user => {
        const isActive = pesanCurrentChatId === user.id;
        const unread = user.unread || 0;
        const lastMsg = user.lastMessage;
        const lastText = lastMsg?.message || '';
        const lastTime = lastMsg?.created_at ? formatTimeMessage(lastMsg.created_at) : '';

        return `
            <div class="pesan-user-item ${isActive ? 'active' : ''}" data-user-id="${user.id}">
                <div class="pesan-user-avatar">${getInitials(user.name)}</div>
                <div class="pesan-user-info">
                    <div class="pesan-user-name">
                        ${escapeHtml(user.name)}
                        ${unread > 0 ? `<span class="pesan-user-badge">${unread}</span>` : ''}
                    </div>
                    <div class="pesan-user-last">${escapeHtml(lastText.substring(0, 50))}${lastText.length > 50 ? '...' : ''}</div>
                </div>
                <div class="pesan-user-time">${lastTime}</div>
            </div>
        `;
    }).join('');

    // Event listener untuk klik user
    container.querySelectorAll('.pesan-user-item').forEach(el => {
        el.addEventListener('click', function() {
            const userId = this.dataset.userId;
            if (userId) {
                openPesanChat(userId);
            }
        });
    });
}

// ===== FORMAT TIME =====
function formatTimeMessage(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Baru saja';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
        if (diff < 86400000) return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        if (diff < 604800000) {
            const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            return days[date.getDay()];
        }
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    } catch (e) {
        return '';
    }
}

// ===== GET INITIALS =====
function getInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// ===== OPEN PESAN CHAT =====
async function openPesanChat(userId) {
    if (!userId) return;
    
    pesanCurrentChatId = userId;
    
    // Update active state di sidebar
    document.querySelectorAll('.pesan-user-item').forEach(el => {
        el.classList.toggle('active', el.dataset.userId === userId);
    });

    // Ambil data user
    const user = pesanUsers.find(u => u.id === userId) || 
                 pesanFilteredUsers.find(u => u.id === userId);
    
    if (user) {
        document.getElementById('pesanChatName').innerText = user.name;
        document.getElementById('pesanChatAvatar').innerText = getInitials(user.name);
        document.getElementById('pesanChatStatus').innerText = 'Online';
        
        // Reset unread
        user.unread = 0;
        renderPesanUserList(pesanUsers);
    }

    // Enable input
    document.getElementById('pesanChatInput').disabled = false;
    document.getElementById('pesanSendBtn').disabled = false;

    // Load messages
    await loadPesanMessages(userId);
}

// ===== LOAD PESAN MESSAGES =====
async function loadPesanMessages(userId) {
    if (!userId) return;

    try {
        const { data, error } = await window.db
            .from('messages')
            .select('*')
            .or(`and(from_id.eq.${currentUser.id},to_id.eq.${userId}),and(from_id.eq.${userId},to_id.eq.${currentUser.id})`)
            .order('created_at', { ascending: true });

        if (error) throw error;

        pesanAllMessages = data || [];

        // Tandai semua pesan dari user ini sebagai sudah dibaca
        const unreadMessages = pesanAllMessages.filter(m => !m.is_read && m.from_id === userId);
        if (unreadMessages.length > 0) {
            for (const msg of unreadMessages) {
                await window.db.from('messages').update({ is_read: true }).eq('id', msg.id);
            }
            // Reload messages untuk update badge
            await loadMessages();
        }

        renderPesanMessages(pesanAllMessages, userId);
        
        // Scroll ke bawah
        const body = document.getElementById('pesanChatBody');
        if (body) {
            setTimeout(() => {
                body.scrollTop = body.scrollHeight;
            }, 50);
        }

    } catch (err) {
        console.error('Error loading messages:', err);
        showNotifTop('❌ Gagal memuat pesan: ' + err.message, true);
    }
}

// ===== RENDER PESAN MESSAGES =====
function renderPesanMessages(messages, userId) {
    const container = document.getElementById('pesanChatBody');
    if (!container) return;

    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div class="pesan-empty-chat">
                <div class="pesan-empty-icon">💬</div>
                <div class="pesan-empty-text">Belum ada pesan</div>
                <div class="pesan-empty-sub">Mulai kirim pesan sekarang</div>
            </div>
        `;
        return;
    }

    container.innerHTML = messages.map(msg => {
        const isSent = msg.from_id === currentUser.id;
        const time = msg.created_at ? formatTimeMessage(msg.created_at) : '';
        const senderName = isSent ? 'Anda' : (msg.from_name || 'CS Agent');

        return `
            <div class="pesan-message ${isSent ? 'sent' : 'received'}">
                ${!isSent ? `<span class="message-sender">${escapeHtml(senderName)}</span>` : ''}
                ${escapeHtml(msg.message)}
                <span class="message-time">
                    ${time}
                    ${isSent ? (msg.is_read ? '✅' : '✓') : ''}
                </span>
            </div>
        `;
    }).join('');

    // Scroll ke bawah
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 50);
}

// ===== SEND PESAN =====
async function sendPesanChat() {
    if (!pesanCurrentChatId) {
        showNotifTop('⚠️ Pilih chat terlebih dahulu!', true);
        return;
    }

    const input = document.getElementById('pesanChatInput');
    const message = input.value.trim();
    
    if (!message) {
        showNotifTop('⚠️ Pesan tidak boleh kosong!', true);
        return;
    }

    const sendBtn = document.getElementById('pesanSendBtn');
    sendBtn.disabled = true;
    sendBtn.textContent = '⏳';

    try {
        // Simpan ke database
        const { error } = await window.db.from('messages').insert({
            from_id: currentUser.id,
            from_name: currentUserName,
            to_id: pesanCurrentChatId,
            message: message,
            is_read: false,
            created_at: new Date().toISOString()
        });

        if (error) throw error;

        // Reset input
        input.value = '';
        input.style.height = 'auto';

        // Reload messages
        await loadPesanMessages(pesanCurrentChatId);
        
        // Update user list
        await loadPesanUsers();

        // Update badge
        await updatePesanBadge();

    } catch (err) {
        console.error('Error sending message:', err);
        showNotifTop('❌ Gagal mengirim: ' + err.message, true);
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = '📤';
    }
}

// ===== INIT PESAN PAGE =====
function initPesanPage() {
    console.log('🔄 Init Pesan Page - WhatsApp Style');
    
    // Load users
    loadPesanUsers();

    // Auto refresh setiap 10 detik
    if (pesanAutoRefreshInterval) {
        clearInterval(pesanAutoRefreshInterval);
    }
    pesanAutoRefreshInterval = setInterval(() => {
        if (document.getElementById('pesanPage')?.style.display !== 'none') {
            loadPesanUsers();
            if (pesanCurrentChatId) {
                loadPesanMessages(pesanCurrentChatId);
            }
        }
    }, 10000);

    // Search input
    const searchInput = document.getElementById('pesanSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            renderPesanUserList(pesanUsers);
        });
    }

    // Send button
    const sendBtn = document.getElementById('pesanSendBtn');
    if (sendBtn) {
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        document.getElementById('pesanSendBtn')?.addEventListener('click', sendPesanChat);
    }

    // Input enter key
    const chatInput = document.getElementById('pesanChatInput');
    if (chatInput) {
        const newInput = chatInput.cloneNode(true);
        chatInput.parentNode.replaceChild(newInput, chatInput);
        document.getElementById('pesanChatInput')?.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendPesanChat();
            }
        });
        // Auto resize textarea
        document.getElementById('pesanChatInput')?.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
    }

    // Add Pesan button (sudah ada di event listener utama)
}

// ===== REFRESH PESAN =====
function refreshPesan() {
    loadPesanUsers();
    if (pesanCurrentChatId) {
        loadPesanMessages(pesanCurrentChatId);
    }
}

// Ekspos ke global
window.refreshPesan = refreshPesan;
window.pesanCurrentChatId = pesanCurrentChatId;
window.pesanUsers = pesanUsers;

async function loadUsersList() {
    if (currentUserRole !== 'owner') return;
    
    const { data, error } = await window.db.from('users').select('*').neq('id', currentUser.id);
    if (error) {
        console.error('Error loading users:', error);
        return;
    }
    
    renderUsersList(data || []);
}

async function loadUsersForSelect() {
    const { data, error } = await window.db.from('users').select('*').neq('id', currentUser.id);
    if (error) return;
    
    const select = document.getElementById('pesanTo');
    if (select) {
        // Urutkan: Owner dulu, baru CS
        const sorted = (data || []).sort((a, b) => {
            if (a.role === 'owner' && b.role !== 'owner') return -1;
            if (a.role !== 'owner' && b.role === 'owner') return 1;
            return (a.nama || a.email).localeCompare(b.nama || b.email);
        });
        
        select.innerHTML = '<option value="">Pilih CS Tujuan</option>' + 
            sorted.map(user => {
                const roleLabel = user.role === 'owner' ? '👑 ' : '👤 ';
                return `<option value="${user.id}">${roleLabel}${escapeHtml(user.nama || user.email)}</option>`;
            }).join('');
    }
}

async function loadTarifAdmin() {
    if (!currentUser) return;
    
    let query = window.db.from('tarif_admin').select('*');
    if (currentUserRole !== 'owner') {
        query = query.eq('user_id', currentUser.id);
    }
    
    const { data, error } = await query;
    if (error) {
        console.error('Error loading tarif admin:', error);
        return;
    }
    
    tarifAdminData = data || [];
    renderTarifAdminList();
}

async function loadTransaksiGlobal() {
    const { data, error } = await window.db.from('transaksi_global').select('*').order('tanggal', { ascending: false });
    if (error) return;
    
    transaksiGlobalList = data || [];
    renderTransaksiListGlobal();
    
    let totalBulanIni = 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    (data || []).forEach(item => {
        const tglTransaksi = new Date(item.tanggal);
        if (tglTransaksi >= startOfMonth) {
            totalBulanIni += item.nominal || 0;
        }
    });
    
    window.totalTransaksiGlobal = totalBulanIni;
    updateTargetDisplay();
}

// ========== RENDER FUNCTIONS - FOLLOWUP KANBAN ==========
function renderFollowupKanban() {
    const today = getTodayDate();
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
    
    document.getElementById('countBaru').innerText = lists.baru.length;
    document.getElementById('countFollowup').innerText = lists.followup.length;
    document.getElementById('countPending').innerText = lists.pending.length;
    document.getElementById('countClosing').innerText = lists.closing.length;
    
    const renderColumn = (containerId, items, columnType) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = items.map(item => {
            const isOverdue = item.tanggal && item.tanggal < today;
            const isToday = item.tanggal === today;
            let deadlineClass = '';
            if (isOverdue) deadlineClass = 'deadline-overdue';
            else if (isToday) deadlineClass = 'deadline-today';
            
            // Validasi untuk tombol berdasarkan status
            let canProceed = true;
            let disabledReason = '';
            
            if (columnType === 'followup') {
                // Untuk tombol Konfirmasi Follow Up, perlu checklist
                canProceed = item.followup_data && item.followup_data.terkirim && item.followup_data.dibalas;
                disabledReason = 'Harap lengkapi data follow up terlebih dahulu';
            } else if (columnType === 'pending') {
                // Untuk tombol Selesai & Closing, perlu semua pending items terisi dan tercentang
                const pendingData = item.pending_data || [];
                canProceed = pendingData.length > 0 && pendingData.every(p => p.checked === true && p.text && p.text.trim() !== '');
                disabledReason = 'Harap isi semua balasan pending dan centang';
            } else if (columnType === 'closing') {
                // Untuk tombol Pindah ke DB Closing, selalu bisa
                canProceed = true;
            } else {
                canProceed = true;
            }
            
            const actionButton = getActionButtonForStatus(item.status, item.id, canProceed, disabledReason);
            
            // ===== PERBAIKAN: Tambahkan style inline untuk dark mode =====
            return `<div class="card-item ${deadlineClass}" data-id="${item.id}">
                <div class="card-id" style="background: #eef2ff; padding: 3px 8px; border-radius: 20px; margin-bottom: 6px; display: inline-block; font-weight: 600; font-size: 10px; color: #4f46e5; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">🆔 ${escapeHtml(item.agent_id || '-')}</div>
                <div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div>
                <div class="card-phone">
                    <span title="${item.hp}">${escapeHtml(item.hp)}</span>
                    <span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span>
                </div>
                <div class="card-deadline">📅 ${item.tanggal || '-'}</div>
                ${actionButton}
            </div>`;
        }).join('');
        
        container.querySelectorAll('.card-item').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('whatsapp-icon') && !e.target.classList.contains('action-btn')) {
                    openDetailCustomer(card.dataset.id);
                }
            });
        });
    };
    
    renderColumn('baruList', lists.baru, 'baru');
    renderColumn('followupList', lists.followup, 'followup');
    renderColumn('pendingList', lists.pending, 'pending');
    renderColumn('closingList', lists.closing, 'closing');
}

function getActionButtonForStatus(status, id, canProceed, disabledReason) {
    let buttonHtml = '';
    let buttonText = '';
    let buttonClass = '';
    let onClickAction = '';
    
    if (status === 'baru') {
        buttonText = '📞 Lanjut Follow Up';
        buttonClass = 'action-btn followup-btn';
        onClickAction = `updateCustomerStatus('${id}', 'followup')`;
        buttonHtml = `<button class="${buttonClass}" onclick="event.stopPropagation(); ${onClickAction}" style="margin-top: 8px; width: 100%; padding: 4px 8px; font-size: 10px; border-radius: 6px; border: none; cursor: pointer; background: #4f46e5; color: white;">${buttonText}</button>`;
    } else if (status === 'followup') {
        buttonText = '✅ Konfirmasi Follow Up';
        buttonClass = `action-btn confirm-followup-btn ${!canProceed ? 'disabled-btn' : ''}`;
        onClickAction = `openFollowupConfirm('${id}')`;
        const disabledAttr = !canProceed ? 'disabled' : '';
        const titleAttr = !canProceed ? `title="${disabledReason}"` : '';
        buttonHtml = `<button class="${buttonClass}" onclick="event.stopPropagation(); ${!canProceed ? 'return false;' : onClickAction}" ${disabledAttr} ${titleAttr} style="margin-top: 8px; width: 100%; padding: 4px 8px; font-size: 10px; border-radius: 6px; border: none; cursor: ${!canProceed ? 'not-allowed' : 'pointer'}; background: ${!canProceed ? '#9ca3af' : '#4f46e5'}; color: white; opacity: ${!canProceed ? '0.6' : '1'};">${buttonText}</button>`;
    } else if (status === 'pending') {
        buttonText = '✅ Selesai & Closing';
        buttonClass = `action-btn pending-finish-btn ${!canProceed ? 'disabled-btn' : ''}`;
        onClickAction = `openPendingModal('${id}')`;
        const disabledAttr = !canProceed ? 'disabled' : '';
        const titleAttr = !canProceed ? `title="${disabledReason}"` : '';
        buttonHtml = `<button class="${buttonClass}" onclick="event.stopPropagation(); ${!canProceed ? 'return false;' : onClickAction}" ${disabledAttr} ${titleAttr} style="margin-top: 8px; width: 100%; padding: 4px 8px; font-size: 10px; border-radius: 6px; border: none; cursor: ${!canProceed ? 'not-allowed' : 'pointer'}; background: ${!canProceed ? '#9ca3af' : '#10b981'}; color: white; opacity: ${!canProceed ? '0.6' : '1'};">${buttonText}</button>`;
    } else if (status === 'closing') {
        buttonText = '📁 Pindah ke DB Closing';
        buttonClass = 'action-btn closing-db-btn';
        onClickAction = `confirmClosingToDB('${id}')`;
        buttonHtml = `<button class="${buttonClass}" onclick="event.stopPropagation(); ${onClickAction}" style="margin-top: 8px; width: 100%; padding: 4px 8px; font-size: 10px; border-radius: 6px; border: none; cursor: pointer; background: #8b5cf6; color: white;">${buttonText}</button>`;
    }
    
    return buttonHtml;
}

// ========== TAMBAHKAN INI DI AWAL FILE ==========
// Definisikan fungsi initTargetFeatures di awal agar tersedia saat dipanggil

function initTargetFeatures() {
    console.log('🔄 Inisialisasi fitur target...');
    
    // 1. Init target card click
    if (typeof initTargetCardClick === 'function') {
        initTargetCardClick();
    } else {
        console.warn('⚠️ initTargetCardClick belum didefinisikan');
    }
    
    // 2. Force load target data jika dashboard aktif
    const dashboardPage = document.getElementById('dashboardPage');
    if (dashboardPage && dashboardPage.style.display !== 'none') {
        console.log('📊 Dashboard aktif, memuat target data...');
        setTimeout(() => {
            if (typeof loadTargetData === 'function') {
                loadTargetData();
            } else {
                console.warn('⚠️ loadTargetData belum didefinisikan');
            }
        }, 500);
    }
}

function renderProspekKanban() {
    const today = getTodayDate();
    const lists = { baru: [], dihubungi: [], negosiasi: [], tertarik: [] };
    
    prospekData.forEach(item => {
        const status = item.status || 'Baru';
        if (status === 'Baru') lists.baru.push(item);
        else if (status === 'Dihubungi') lists.dihubungi.push(item);
        else if (status === 'Negosiasi') lists.negosiasi.push(item);
        else if (status === 'Tertarik') lists.tertarik.push(item);
    });
    
    lists.baru.sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'));
    lists.dihubungi.sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'));
    lists.negosiasi.sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'));
    lists.tertarik.sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'));
    
    document.getElementById('countProspekBaru').innerText = lists.baru.length;
    document.getElementById('countDihubungi').innerText = lists.dihubungi.length;
    document.getElementById('countNegosiasi').innerText = lists.negosiasi.length;
    document.getElementById('countTertarik').innerText = lists.tertarik.length;
    
    const renderColumn = (containerId, items, columnType) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = items.map(item => {
            const isOverdue = item.deadline && item.deadline < today;
            const isToday = item.deadline === today;
            let deadlineClass = '';
            if (isOverdue) deadlineClass = 'deadline-overdue';
            else if (isToday) deadlineClass = 'deadline-today';
            
            // Validasi untuk tombol berdasarkan status
            let canProceed = true;
            let disabledReason = '';
            
            if (columnType === 'dihubungi') {
                // Untuk tombol Konfirmasi Dihubungi, perlu checklist
                canProceed = item.dihubungi_data && item.dihubungi_data.terkirim && item.dihubungi_data.dibalas;
                disabledReason = 'Harap lengkapi data dihubungi terlebih dahulu';
            } else if (columnType === 'negosiasi') {
                // Untuk tombol Kelola Negosiasi, selalu bisa diklik
                canProceed = true;
                // Untuk tombol Tertarik, perlu data negosiasi lengkap
                const negosiasiComplete = item.negosiasi_data && item.negosiasi_data.is_complete;
                disabledReason = 'Harap lengkapi data kuesioner negosiasi terlebih dahulu';
            } else if (columnType === 'tertarik') {
                canProceed = true;
            } else {
                canProceed = true;
            }
            
            const actionButton = getProspekActionButtonForStatus(item.status, item.id, item, canProceed, disabledReason);
            
            return `<div class="card-item ${deadlineClass}" data-id="${item.id}">
                <div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div>
                <div class="card-phone">
                    <span title="${item.hp}">${escapeHtml(item.hp)}</span>
                    <span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span>
                </div>
                <div class="card-deadline">📅 ${item.deadline || '-'}</div>
                ${actionButton}
            </div>`;
        }).join('');
        
        container.querySelectorAll('.card-item').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('whatsapp-icon') && !e.target.classList.contains('action-btn')) {
                    openDetailProspek(card.dataset.id);
                }
            });
        });
    };
    
    renderColumn('prospekBaruList', lists.baru, 'baru');
    renderColumn('prospekDihubungiList', lists.dihubungi, 'dihubungi');
    renderColumn('prospekNegosiasiList', lists.negosiasi, 'negosiasi');
    renderColumn('prospekTertarikList', lists.tertarik, 'tertarik');
}

function getProspekActionButtonForStatus(status, id, item, canProceed, disabledReason) {
    let buttonHtml = '';
    let buttonText = '';
    let buttonClass = '';
    let onClickAction = '';
    
    if (status === 'Baru') {
        buttonText = '📞 Dihubungi';
        buttonClass = 'action-btn dihubungi-btn';
        onClickAction = `updateProspekStatus('${id}', 'Dihubungi')`;
        buttonHtml = `<button class="${buttonClass}" onclick="event.stopPropagation(); ${onClickAction}" style="margin-top: 8px; width: 100%; padding: 4px 8px; font-size: 10px; border-radius: 6px; border: none; cursor: pointer; background: #4f46e5; color: white;">${buttonText}</button>`;
    } else if (status === 'Dihubungi') {
        buttonText = '✅ Konfirmasi Dihubungi';
        buttonClass = `action-btn confirm-dihubungi-btn ${!canProceed ? 'disabled-btn' : ''}`;
        onClickAction = `openProspekDihubungiConfirm('${id}')`;
        const disabledAttr = !canProceed ? 'disabled' : '';
        const titleAttr = !canProceed ? `title="${disabledReason}"` : '';
        buttonHtml = `<button class="${buttonClass}" onclick="event.stopPropagation(); ${!canProceed ? 'return false;' : onClickAction}" ${disabledAttr} ${titleAttr} style="margin-top: 8px; width: 100%; padding: 4px 8px; font-size: 10px; border-radius: 6px; border: none; cursor: ${!canProceed ? 'not-allowed' : 'pointer'}; background: ${!canProceed ? '#9ca3af' : '#4f46e5'}; color: white; opacity: ${!canProceed ? '0.6' : '1'};">${buttonText}</button>`;
    } else if (status === 'Negosiasi') {
        // Cek apakah data negosiasi sudah lengkap
        const isComplete = item.negosiasi_data && item.negosiasi_data.is_complete;
        buttonText = '⭐ Tertarik';
        buttonClass = `action-btn tertarik-btn ${!isComplete ? 'disabled-btn' : ''}`;
        onClickAction = `updateProspekStatus('${id}', 'Tertarik')`;
        const disabledAttr = !isComplete ? 'disabled' : '';
        const titleAttr = !isComplete ? 'title="Harap lengkapi data kuesioner negosiasi terlebih dahulu"' : '';
        buttonHtml = `<button class="${buttonClass}" onclick="event.stopPropagation(); ${!isComplete ? 'return false;' : onClickAction}" ${disabledAttr} ${titleAttr} style="margin-top: 8px; width: 100%; padding: 4px 8px; font-size: 10px; border-radius: 6px; border: none; cursor: ${!isComplete ? 'not-allowed' : 'pointer'}; background: ${!isComplete ? '#9ca3af' : '#10b981'}; color: white; opacity: ${!isComplete ? '0.6' : '1'};">${buttonText}</button>
                        <button class="action-btn negosiasi-btn" onclick="event.stopPropagation(); openProspekNegosiasiModal('${id}')" style="margin-top: 4px; width: 100%; padding: 4px 8px; font-size: 10px; border-radius: 6px; border: none; cursor: pointer; background: #f59e0b; color: white;">📝 Kelola Negosiasi</button>`;
    } else if (status === 'Tertarik') {
        // ===== TAMPILKAN TIPE AGENT DI TOMBOL =====
        const tipeAgent = item.tipe_agent || 'AGENT';
        const tipeLabel = tipeAgent === 'CA' ? '🏦 CA' : 
                         tipeAgent === 'Koordinator' ? '👥 Koor' : '👤 Agent';
        buttonText = `📁 Jadikan Member (${tipeLabel})`;
        buttonClass = 'action-btn commitment-db-btn';
        onClickAction = `confirmTertarikToDB('${id}')`;
        buttonHtml = `<button class="${buttonClass}" onclick="event.stopPropagation(); ${onClickAction}" style="margin-top: 8px; width: 100%; padding: 4px 8px; font-size: 10px; border-radius: 6px; border: none; cursor: pointer; background: #8b5cf6; color: white;">${buttonText}</button>`;
    }
    
    return buttonHtml;
}

// ========== FULL PAGE KANBAN ==========
function renderFullFollowupKanban() {
    const today = getTodayDate();
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
    
    const renderColumn = (containerId, items, columnType) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = items.map(item => {
            const isOverdue = item.tanggal && item.tanggal < today;
            const isToday = item.tanggal === today;
            let deadlineClass = '';
            if (isOverdue) deadlineClass = 'deadline-overdue';
            else if (isToday) deadlineClass = 'deadline-today';
            const isChecked = selectedFullFollowupIds.get(item.id) === true;
            const checkboxHtml = currentUserRole === 'owner' ? `<input type="checkbox" class="full-item-checkbox" data-id="${item.id}" ${isChecked ? 'checked' : ''} style="margin-right: 8px;">` : '';
            
            // ===== PERBAIKAN: Tambahkan tombol aksi =====
            let canProceed = true;
            let disabledReason = '';
            
            if (columnType === 'followup') {
                canProceed = item.followup_data && item.followup_data.terkirim && item.followup_data.dibalas;
                disabledReason = 'Harap lengkapi data follow up terlebih dahulu';
            } else if (columnType === 'pending') {
                const pendingData = item.pending_data || [];
                canProceed = pendingData.length > 0 && pendingData.every(p => p.checked === true && p.text && p.text.trim() !== '');
                disabledReason = 'Harap isi semua balasan pending dan centang';
            } else if (columnType === 'closing') {
                canProceed = true;
            } else {
                canProceed = true;
            }
            
            const actionButton = getActionButtonForStatus(item.status, item.id, canProceed, disabledReason);
            
            return `<div class="card-item ${deadlineClass}" data-id="${item.id}">
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${checkboxHtml}
                    <div style="flex: 1; min-width: 0;">
                        <div class="card-id">🆔 ${escapeHtml(item.agent_id || '-')}</div>
                        <div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div>
                        <div class="card-phone">
                            <span title="${item.hp}">${escapeHtml(item.hp)}</span>
                            <span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span>
                        </div>
                        <div class="card-deadline">📅 ${item.tanggal || '-'}</div>
                        ${actionButton}
                    </div>
                </div>
            </div>`;
        }).join('');
        
        // Event listener untuk klik pada area card (tanpa checkbox)
        container.querySelectorAll('.card-item').forEach(card => {
            card.addEventListener('click', (e) => {
                // Abaikan jika klik pada checkbox, whatsapp, atau action button
                if (e.target.classList.contains('full-item-checkbox') || 
                    e.target.classList.contains('whatsapp-icon') || 
                    e.target.classList.contains('action-btn')) {
                    return;
                }
                openDetailCustomer(card.dataset.id);
            });
        });
        
        // Event listener untuk checkbox
        if (currentUserRole === 'owner') {
            container.querySelectorAll('.full-item-checkbox').forEach(cb => {
                cb.addEventListener('change', (e) => {
                    e.stopPropagation();
                    const id = cb.dataset.id;
                    if (cb.checked) selectedFullFollowupIds.set(id, true);
                    else selectedFullFollowupIds.delete(id);
                    updateSelectAllFullFollowupButton();
                });
            });
        }
    };
    
    renderColumn('fullBaruList', lists.baru, 'baru');
    renderColumn('fullFollowupList', lists.followup, 'followup');
    renderColumn('fullPendingList', lists.pending, 'pending');
    renderColumn('fullClosingList', lists.closing, 'closing');
    
    updateSelectAllFullFollowupButton();
}

function renderFullProspekKanban() {
    const today = getTodayDate();
    const lists = { baru: [], dihubungi: [], negosiasi: [], tertarik: [] };
    
    prospekData.forEach(item => {
        const status = item.status || 'Baru';
        if (status === 'Baru') lists.baru.push(item);
        else if (status === 'Dihubungi') lists.dihubungi.push(item);
        else if (status === 'Negosiasi') lists.negosiasi.push(item);
        else if (status === 'Tertarik') lists.tertarik.push(item);
    });
    
    lists.baru.sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'));
    lists.dihubungi.sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'));
    lists.negosiasi.sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'));
    lists.tertarik.sort((a,b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'));
    
    document.getElementById('fullCountProspekBaru').innerText = lists.baru.length;
    document.getElementById('fullCountDihubungi').innerText = lists.dihubungi.length;
    document.getElementById('fullCountNegosiasi').innerText = lists.negosiasi.length;
    document.getElementById('fullCountTertarik').innerText = lists.tertarik.length;
    
    const renderColumn = (containerId, items, columnType) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = items.map(item => {
            const isOverdue = item.deadline && item.deadline < today;
            const isToday = item.deadline === today;
            let deadlineClass = '';
            if (isOverdue) deadlineClass = 'deadline-overdue';
            else if (isToday) deadlineClass = 'deadline-today';
            const isChecked = selectedFullProspekIds.get(item.id) === true;
            const checkboxHtml = currentUserRole === 'owner' ? `<input type="checkbox" class="full-item-checkbox" data-id="${item.id}" ${isChecked ? 'checked' : ''} style="margin-right: 8px;">` : '';
            
            // ===== PERBAIKAN: Tambahkan tombol aksi =====
            let canProceed = true;
            let disabledReason = '';
            
            if (columnType === 'dihubungi') {
                canProceed = item.dihubungi_data && item.dihubungi_data.terkirim && item.dihubungi_data.dibalas;
                disabledReason = 'Harap lengkapi data dihubungi terlebih dahulu';
            } else if (columnType === 'negosiasi') {
                canProceed = true;
            } else if (columnType === 'tertarik') {
                canProceed = true;
            } else {
                canProceed = true;
            }
            
            const actionButton = getProspekActionButtonForStatus(item.status, item.id, item, canProceed, disabledReason);
            
            return `<div class="card-item ${deadlineClass}" data-id="${item.id}">
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${checkboxHtml}
                    <div style="flex: 1; min-width: 0;">
                        <div class="card-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div>
                        <div class="card-phone">
                            <span title="${item.hp}">${escapeHtml(item.hp)}</span>
                            <span class="whatsapp-icon" onclick="event.stopPropagation(); openWA('${item.hp}')">💬</span>
                        </div>
                        <div class="card-deadline">📅 ${item.deadline || '-'}</div>
                        ${actionButton}
                    </div>
                </div>
            </div>`;
        }).join('');
        
        // Event listener untuk klik pada area card (tanpa checkbox)
        container.querySelectorAll('.card-item').forEach(card => {
            card.addEventListener('click', (e) => {
                // Abaikan jika klik pada checkbox, whatsapp, atau action button
                if (e.target.classList.contains('full-item-checkbox') || 
                    e.target.classList.contains('whatsapp-icon') || 
                    e.target.classList.contains('action-btn')) {
                    return;
                }
                openDetailProspek(card.dataset.id);
            });
        });
        
        // Event listener untuk checkbox
        if (currentUserRole === 'owner') {
            container.querySelectorAll('.full-item-checkbox').forEach(cb => {
                cb.addEventListener('change', (e) => {
                    e.stopPropagation();
                    const id = cb.dataset.id;
                    if (cb.checked) selectedFullProspekIds.set(id, true);
                    else selectedFullProspekIds.delete(id);
                    updateSelectAllFullProspekButton();
                });
            });
        }
    };
    
    renderColumn('fullProspekBaruList', lists.baru, 'baru');
    renderColumn('fullProspekDihubungiList', lists.dihubungi, 'dihubungi');
    renderColumn('fullProspekNegosiasiList', lists.negosiasi, 'negosiasi');
    renderColumn('fullProspekTertarikList', lists.tertarik, 'tertarik');
    
    updateSelectAllFullProspekButton();
}

function updateSelectAllFullFollowupButton() {
    const btn = document.getElementById('selectAllFullFollowup');
    if (!btn) return;
    if (currentUserRole !== 'owner') {
        btn.style.display = 'none';
        return;
    }
    btn.style.display = 'inline-block';
    
    const checkboxes = document.querySelectorAll('#fullBaruList .full-item-checkbox, #fullFollowupList .full-item-checkbox, #fullPendingList .full-item-checkbox, #fullClosingList .full-item-checkbox');
    const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
    btn.textContent = allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua';
}

function updateSelectAllFullProspekButton() {
    const btn = document.getElementById('selectAllFullProspek');
    if (!btn) return;
    if (currentUserRole !== 'owner') {
        btn.style.display = 'none';
        return;
    }
    btn.style.display = 'inline-block';
    
    const checkboxes = document.querySelectorAll('#fullProspekBaruList .full-item-checkbox, #fullProspekDihubungiList .full-item-checkbox, #fullProspekNegosiasiList .full-item-checkbox, #fullProspekTertarikList .full-item-checkbox');
    const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
    btn.textContent = allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua';
}

function toggleSelectAllFullFollowup() {
    if (currentUserRole !== 'owner') {
        showNotifTop('⚠️ Hanya Owner yang dapat menggunakan fitur ini!', true);
        return;
    }
    const checkboxes = document.querySelectorAll('#fullBaruList .full-item-checkbox, #fullFollowupList .full-item-checkbox, #fullPendingList .full-item-checkbox, #fullClosingList .full-item-checkbox');
    if (checkboxes.length === 0) return;
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
}

function toggleSelectAllFullProspek() {
    if (currentUserRole !== 'owner') {
        showNotifTop('⚠️ Hanya Owner yang dapat menggunakan fitur ini!', true);
        return;
    }
    const checkboxes = document.querySelectorAll('#fullProspekBaruList .full-item-checkbox, #fullProspekDihubungiList .full-item-checkbox, #fullProspekNegosiasiList .full-item-checkbox, #fullProspekTertarikList .full-item-checkbox');
    if (checkboxes.length === 0) return;
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
}

// ========== RENDER AGENT LIST ==========
function renderAgentList(items) {
    const container = document.getElementById('dbAgentList');
    if (!container) return;

    const totalCountSpan = document.getElementById('agentTotalCount');
    if (totalCountSpan) totalCountSpan.innerText = items.length;

    const searchTerm = document.getElementById('searchAgentInput')?.value.toLowerCase() || '';
    const filterUpline = document.getElementById('filterUplineAgent')?.value || '';
    const filterCid = document.getElementById('filterCidAgent')?.value || '';
    const filterBank = document.getElementById('filterBankAgent')?.value || '';
    const filterType = document.getElementById('filterTypeAgent')?.value || '';
    const filterDateStart = document.getElementById('filterDateStartAgent')?.value || '';
    const filterDateEnd = document.getElementById('filterDateEndAgent')?.value || '';
    
    let filtered = [...items];

    // ===== SEARCH =====
    if (searchTerm) {
        filtered = filtered.filter(item =>
            (item.nama && String(item.nama).toLowerCase().includes(searchTerm)) ||
            (item.agent_name && String(item.agent_name).toLowerCase().includes(searchTerm)) ||
            (item.agent_id && String(item.agent_id).toLowerCase().includes(searchTerm)) ||
            (item.hp && String(item.hp).includes(searchTerm)) ||
            (item.upline && String(item.upline).toLowerCase().includes(searchTerm)) ||
            (item.cid && String(item.cid).toLowerCase().includes(searchTerm))
        );
    }

    // ===== FILTER UPLINE =====
    if (filterUpline) {
        filtered = filtered.filter(item =>
            item.upline && String(item.upline).toLowerCase().includes(filterUpline.toLowerCase())
        );
    }

    // ===== FILTER CID =====
    if (filterCid) {
        filtered = filtered.filter(item =>
            item.cid && String(item.cid).toLowerCase().includes(filterCid.toLowerCase())
        );
    }

    // ===== FILTER BANK =====
    if (filterBank) {
        filtered = filtered.filter(item =>
            item.jenis_bank && String(item.jenis_bank).toLowerCase() === filterBank.toLowerCase()
        );
    }

    // ===== FILTER TIPE AGENT =====
    if (filterType) {
        filtered = filtered.filter(item =>
            item.agent_type && String(item.agent_type) === filterType
        );
    }

    // ===== FILTER TANGGAL =====
    if (filterDateStart) {
        filtered = filtered.filter(item => {
            if (!item.created_at) return false;
            const date = item.created_at.split('T')[0];
            return date >= filterDateStart;
        });
    }
    if (filterDateEnd) {
        filtered = filtered.filter(item => {
            if (!item.created_at) return false;
            const date = item.created_at.split('T')[0];
            return date <= filterDateEnd;
        });
    }

    // ===== UPDATE FILTER DATE INFO =====
    const dateInfoSpan = document.getElementById('agentFilterDateInfo');
    if (dateInfoSpan) {
        if (filterDateStart && filterDateEnd) {
            dateInfoSpan.innerText = `${formatDateDDMMYYYY(filterDateStart)} → ${formatDateDDMMYYYY(filterDateEnd)}`;
        } else if (filterDateStart) {
            dateInfoSpan.innerText = `Dari ${formatDateDDMMYYYY(filterDateStart)}`;
        } else if (filterDateEnd) {
            dateInfoSpan.innerText = `Sampai ${formatDateDDMMYYYY(filterDateEnd)}`;
        } else {
            dateInfoSpan.innerText = 'Semua';
        }
    }

    agentsFilteredData = filtered;
    const filteredCountSpan = document.getElementById('agentFilteredCount');
    if (filteredCountSpan) filteredCountSpan.innerText = filtered.length;

    // ===== TAMBAHKAN CLASS OWNER MODE =====
    if (currentUserRole === 'owner') {
        document.body.classList.add('owner-mode');
    } else {
        document.body.classList.remove('owner-mode');
    }

    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;color:#9ca3af;">📭 Tidak ada data agent</p>';
        return;
    }

    container.innerHTML = filtered.map(item => {
        const isChecked = selectedAgentIds.get(item.id) === true;
        const dateStr = item.created_at ? formatDateDDMMYYYY(item.created_at) : '-';
        const displayName = item.agent_name || item.nama || '-';
        
        // Tampilkan badge tipe agent
        let typeBadge = '';
        if (item.agent_type) {
            const typeMap = {
                'AGENT': '👤 Agent',
                'CollectingAgent (CA)': '🏦 CA',
                'Koordinator Wilayah (KORWIL)': '👥 KORWIL'
            };
            typeBadge = `<span style="font-size: 10px; background: #eef2ff; padding: 2px 10px; border-radius: 12px; color: #4f46e5;">${typeMap[item.agent_type] || item.agent_type}</span>`;
        }
        
        // ===== TOMBOL EDIT HANYA UNTUK OWNER =====
        const editButton = currentUserRole === 'owner' 
            ? `<button class="db-item-edit-agent owner-only" onclick="event.stopPropagation(); openEditAgentModal('${item.id}')">✏️ Edit</button>`
            : '';
        
        return `
            <div class="db-item-agent" data-id="${item.id}">
                <input type="checkbox" class="db-item-checkbox-agent" data-id="${item.id}" ${isChecked ? 'checked' : ''}>
                <div class="db-item-agent-info">
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <h4 style="margin: 0;">🏷️ ${escapeHtml(displayName)}</h4>
                        ${typeBadge}
                        ${item.apk ? `<span style="font-size: 10px; background: #dbeafe; padding: 2px 10px; border-radius: 12px; color: #2563eb;">📱 ${escapeHtml(item.apk)}</span>` : ''}
                    </div>
                    <p style="margin: 4px 0 2px 0;">
                        👤 ${escapeHtml(item.nama || '-')} | 
                        📱 ${escapeHtml(item.hp || '-')} | 
                        🆔 ${escapeHtml(item.agent_id || '-')}
                    </p>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; font-size: 11px; color: #6b7280;">
                        ${item.upline ? `<span>👤 Upline: ${escapeHtml(item.upline)}</span>` : ''}
                        ${item.cid ? `<span>🆔 CID: ${escapeHtml(item.cid)}</span>` : ''}
                        ${item.jenis_bank ? `<span>🏦 ${escapeHtml(item.jenis_bank)}</span>` : ''}
                        ${item.agent_type ? `<span>🏷️ ${escapeHtml(item.agent_type)}</span>` : ''}
                        <span>📅 ${dateStr}</span>
                    </div>
                </div>
                <div class="db-item-agent-actions">
                    <button class="db-item-wa" onclick="event.stopPropagation(); openWA('${escapeHtml(item.hp || '')}')">💬 WA</button>
                    <button class="db-item-move-followup" onclick="event.stopPropagation(); moveAgentToFollowup('${item.id}')">📞 Pindah ke Followup</button>
                    ${editButton}
                    <button class="db-item-delete" onclick="event.stopPropagation(); deleteAgentItem('${item.id}')">🗑️ Hapus</button>
                </div>
            </div>
        `;
    }).join('');

    // ===== EVENT DELEGATION =====
    const newContainer = container.cloneNode(true);
    container.parentNode.replaceChild(newContainer, container);
    const freshContainer = document.getElementById('dbAgentList');
    if (!freshContainer) return;
    
    freshContainer.addEventListener('change', function(e) {
        if (e.target.classList.contains('db-item-checkbox-agent')) {
            const id = e.target.dataset.id;
            if (e.target.checked) {
                selectedAgentIds.set(id, true);
            } else {
                selectedAgentIds.delete(id);
            }
            updateSelectAllAgentButton();
            updateAgentSelectionCount();
        }
    });
    
    freshContainer.addEventListener('click', function(e) {
        const target = e.target;
        
        if (target.type === 'checkbox' ||
            target.classList.contains('db-item-wa') ||
            target.classList.contains('db-item-move-followup') ||
            target.classList.contains('db-item-edit-agent') ||
            target.classList.contains('db-item-delete')) {
            return;
        }
        
        const itemElement = target.closest('.db-item-agent');
        if (itemElement) {
            const id = itemElement.dataset.id;
            if (id) {
                e.stopPropagation();
                e.preventDefault();
                openAgentDetail(id);
            }
        }
    });

    updateSelectAllAgentButton();
    updateAgentSelectionCount();
}

// ========== OPEN EDIT AGENT MODAL (HANYA OWNER) ==========
function openEditAgentModal(agentId) {
    if (currentUserRole !== 'owner') {
        showNotifTop('⚠️ Hanya Owner yang dapat mengedit data agent!', true);
        return;
    }
    
    const agent = agentsData.find(a => a.id === agentId);
    if (!agent) {
        showNotifTop('❌ Data agent tidak ditemukan!', true);
        return;
    }
    
    // ===== BUAT MODAL EDIT =====
    const modalHtml = `
        <div class="modal-content-new">
            <div class="modal-header">
                <div>
                    <h3>✏️ Edit Agent</h3>
                    <div class="modal-subtitle">Edit data agent - <span style="color: #ef4444;">*</span> wajib diisi</div>
                </div>
                <button class="modal-close" onclick="closeModalNew('editAgentModal')">✕</button>
            </div>
            
            <div class="modal-body" style="max-height: 65vh; overflow-y: auto;">
                <!-- ===== APLIKASI ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">📱 Aplikasi</label>
                    <select id="editAgentApk" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px; background: #fff;">
                        <option value="">Pilih Aplikasi</option>
                        <option value="GNP" ${agent.apk === 'GNP' ? 'selected' : ''}>GNP</option>
                        <option value="BSB" ${agent.apk === 'BSB' ? 'selected' : ''}>BSB</option>
                        <option value="BTN" ${agent.apk === 'BTN' ? 'selected' : ''}>BTN</option>
                    </select>
                </div>

                <!-- ===== TIPE AGENT ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">🏷️ Tipe Agent</label>
                    <select id="editAgentType" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px; background: #fff;">
                        <option value="">Pilih Tipe Agent</option>
                        <option value="AGENT" ${agent.agent_type === 'AGENT' ? 'selected' : ''}>👤 Agent</option>
                        <option value="CollectingAgent (CA)" ${agent.agent_type === 'CollectingAgent (CA)' ? 'selected' : ''}>🏦 Collecting Agent (CA)</option>
                        <option value="Koordinator Wilayah (KORWIL)" ${agent.agent_type === 'Koordinator Wilayah (KORWIL)' ? 'selected' : ''}>👥 Koordinator Wilayah (KORWIL)</option>
                    </select>
                </div>

                <!-- ===== UPLINE ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">👤 Upline / Atasan</label>
                    <input type="text" id="editAgentUpline" value="${escapeHtml(agent.upline || '')}" placeholder="Nama upline..." maxlength="50" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                </div>

                <!-- ===== NOMOR HP UPLINE ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">📞 Nomor HP Upline</label>
                    <div class="phone-input" style="display: flex; gap: 10px; align-items: center;">
                        <div class="phone-prefix" style="background: #f3f4f6; border: 1.5px solid #e5e7eb; border-radius: 14px; padding: 0 16px; display: flex; align-items: center; font-weight: 600; height: 48px; color: #1f2937;">+62</div>
                        <input type="tel" id="editAgentUplinePhone" placeholder="81234567890" maxlength="12" value="${escapeHtml(agent.upline_phone ? agent.upline_phone.replace('+62', '') : '')}" oninput="formatPhoneAuto(this)" style="flex:1; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                    </div>
                </div>

                <!-- ===== NAMA LENGKAP (WAJIB) ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">👤 Nama Lengkap <span style="color: #ef4444;">*</span></label>
                    <input type="text" id="editAgentName" value="${escapeHtml(agent.nama || '')}" placeholder="Masukkan nama lengkap" maxlength="25" oninput="formatNamaAuto(this)" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                </div>

                <!-- ===== NAMA AGENT (WAJIB) ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">🏷️ Nama Agent <span style="color: #ef4444;">*</span></label>
                    <input type="text" id="editAgentAgentName" value="${escapeHtml(agent.agent_name || agent.nama || '')}" placeholder="Masukkan nama agent" maxlength="25" oninput="formatNamaAuto(this)" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                </div>

                <!-- ===== NOMOR WHATSAPP ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">📱 Nomor WhatsApp</label>
                    <div class="phone-input" style="display: flex; gap: 10px; align-items: center;">
                        <div class="phone-prefix" style="background: #f3f4f6; border: 1.5px solid #e5e7eb; border-radius: 14px; padding: 0 16px; display: flex; align-items: center; font-weight: 600; height: 48px; color: #1f2937;">+62</div>
                        <input type="tel" id="editAgentPhone" placeholder="81234567890" maxlength="12" value="${escapeHtml(agent.hp ? agent.hp.replace('+62', '') : '')}" oninput="formatPhoneAuto(this)" style="flex:1; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                    </div>
                </div>

                <!-- ===== ID AGENT (WAJIB) ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">🆔 ID Agent <span style="color: #ef4444;">*</span></label>
                    <input type="text" id="editAgentId" value="${escapeHtml(agent.agent_id || '')}" placeholder="Contoh: AG-001" maxlength="17" oninput="formatAgentIdAuto(this)" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                </div>

                <!-- ===== ADMIN ===== -->
                <div style="background: #f8fafc; border-radius: 14px; padding: 12px 16px; margin-bottom: 14px; border: 1px solid #e5e7eb;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 10px;">🏷️ Admin</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                        <div>
                            <label style="font-size: 11px; color: #6b7280; display: block; margin-bottom: 4px;">Postpaid</label>
                            <input type="number" id="editAgentAdminPostpaid" value="${agent.admin_postpaid || 0}" style="width:100%; padding: 8px 10px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="font-size: 11px; color: #6b7280; display: block; margin-bottom: 4px;">Prepaid</label>
                            <input type="number" id="editAgentAdminPrepaid" value="${agent.admin_prepaid || 0}" style="width:100%; padding: 8px 10px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="font-size: 11px; color: #6b7280; display: block; margin-bottom: 4px;">Nontaglis</label>
                            <input type="number" id="editAgentAdminNontaglis" value="${agent.admin_nontaglis || 0}" style="width:100%; padding: 8px 10px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 12px;">
                        </div>
                    </div>
                </div>

                <!-- ===== FEE ===== -->
                <div style="background: #f8fafc; border-radius: 14px; padding: 12px 16px; margin-bottom: 14px; border: 1px solid #e5e7eb;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 10px;">💰 Fee</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                        <div>
                            <label style="font-size: 11px; color: #6b7280; display: block; margin-bottom: 4px;">Postpaid</label>
                            <input type="number" id="editAgentFeePostpaid" value="${agent.fee_postpaid || 0}" style="width:100%; padding: 8px 10px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="font-size: 11px; color: #6b7280; display: block; margin-bottom: 4px;">Prepaid</label>
                            <input type="number" id="editAgentFeePrepaid" value="${agent.fee_prepaid || 0}" style="width:100%; padding: 8px 10px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="font-size: 11px; color: #6b7280; display: block; margin-bottom: 4px;">Nontaglis</label>
                            <input type="number" id="editAgentFeeNontaglis" value="${agent.fee_nontaglis || 0}" style="width:100%; padding: 8px 10px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 12px;">
                        </div>
                    </div>
                </div>

                <!-- ===== JENIS BANK ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">🏦 Jenis Bank</label>
                    <input type="text" id="editAgentBank" value="${escapeHtml(agent.jenis_bank || '')}" placeholder="Contoh: BCA, Mandiri, BNI" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                </div>

                <!-- ===== NOMOR REKENING ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">🔢 Nomor Rekening</label>
                    <input type="text" id="editAgentRekening" value="${escapeHtml(agent.nomor_rekening || '')}" placeholder="Nomor rekening" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                </div>

                <!-- ===== ATAS NAMA REKENING ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">📛 Atas Nama Rekening</label>
                    <input type="text" id="editAgentRekeningAtasNama" value="${escapeHtml(agent.atas_nama_rekening || '')}" placeholder="Nama pemilik rekening" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                </div>

                <!-- ===== CID ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">🆔 CID</label>
                    <input type="text" id="editAgentCid" value="${escapeHtml(agent.cid || '')}" placeholder="CID" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-primary" onclick="saveEditAgent('${agent.id}')">💾 Simpan Perubahan</button>
                <button class="btn btn-outline" onclick="closeModalNew('editAgentModal')">❌ Batal</button>
            </div>
        </div>
    `;
    
    // ===== TAMPILKAN MODAL =====
    const modal = createModalWithHighZIndex(modalHtml, () => {
        closeModalNew('editAgentModal');
    });
    
    // Set ID modal
    modal.id = 'editAgentModal';
    
    applyDarkModeToModal(modal);
}

// ========== SAVE EDIT AGENT (HANYA OWNER) ==========
async function saveEditAgent(agentId) {
    if (currentUserRole !== 'owner') {
        showNotifTop('⚠️ Hanya Owner yang dapat mengedit data agent!', true);
        return;
    }
    
    // ===== AMBIL DATA DARI FORM =====
    const apk = document.getElementById('editAgentApk').value;
    const agentType = document.getElementById('editAgentType').value;
    const upline = document.getElementById('editAgentUpline').value.trim();
    let uplinePhone = document.getElementById('editAgentUplinePhone').value.trim();
    const nama = document.getElementById('editAgentName').value.trim();
    const agentName = document.getElementById('editAgentAgentName').value.trim();
    let hp = document.getElementById('editAgentPhone').value.trim();
    const agentIdInput = document.getElementById('editAgentId').value.trim();
    const adminPostpaid = parseInt(document.getElementById('editAgentAdminPostpaid').value) || 0;
    const adminPrepaid = parseInt(document.getElementById('editAgentAdminPrepaid').value) || 0;
    const adminNontaglis = parseInt(document.getElementById('editAgentAdminNontaglis').value) || 0;
    const feePostpaid = parseInt(document.getElementById('editAgentFeePostpaid').value) || 0;
    const feePrepaid = parseInt(document.getElementById('editAgentFeePrepaid').value) || 0;
    const feeNontaglis = parseInt(document.getElementById('editAgentFeeNontaglis').value) || 0;
    const bank = document.getElementById('editAgentBank').value.trim();
    const rekening = document.getElementById('editAgentRekening').value.trim();
    const rekeningAtasNama = document.getElementById('editAgentRekeningAtasNama').value.trim();
    const cid = document.getElementById('editAgentCid').value.trim();
    
    // ===== VALIDASI =====
    if (!agentIdInput) {
        showNotifTop('⚠️ ID Agent wajib diisi!', true);
        document.getElementById('editAgentId').focus();
        return;
    }
    
    if (!nama) {
        showNotifTop('⚠️ Nama Lengkap wajib diisi!', true);
        document.getElementById('editAgentName').focus();
        return;
    }
    
    if (!agentName) {
        showNotifTop('⚠️ Nama Agent wajib diisi!', true);
        document.getElementById('editAgentAgentName').focus();
        return;
    }
    
    // ===== FORMAT HP =====
    hp = hp.replace(/[^\d]/g, '');
    if (hp.startsWith('0')) hp = hp.substring(1);
    if (hp && !hp.startsWith('62')) hp = '62' + hp;
    
    if (uplinePhone) {
        uplinePhone = uplinePhone.replace(/[^\d]/g, '');
        if (uplinePhone.startsWith('0')) uplinePhone = uplinePhone.substring(1);
        if (uplinePhone && !uplinePhone.startsWith('62')) uplinePhone = '62' + uplinePhone;
    }
    
    // ===== CEK DUPLIKAT ID AGENT (KECUALI DIRI SENDIRI) =====
    const { data: existing } = await window.db
        .from('db_agent')
        .select('id')
        .eq('agent_id', agentIdInput.toUpperCase())
        .neq('id', agentId)
        .maybeSingle();
    
    if (existing) {
        showNotifTop(`⚠️ ID Agent "${agentIdInput}" sudah terdaftar!`, true);
        document.getElementById('editAgentId').focus();
        return;
    }
    
    // ===== CEK DUPLIKAT NAMA LENGKAP (KECUALI DIRI SENDIRI) =====
    const { data: existingName } = await window.db
        .from('db_agent')
        .select('id')
        .eq('nama', nama)
        .neq('id', agentId)
        .maybeSingle();
    
    if (existingName) {
        showNotifTop(`⚠️ Nama "${nama}" sudah terdaftar!`, true);
        document.getElementById('editAgentName').focus();
        return;
    }
    
    // ===== CEK DUPLIKAT NAMA AGENT (KECUALI DIRI SENDIRI) =====
    const { data: existingAgentName } = await window.db
        .from('db_agent')
        .select('id')
        .eq('agent_name', agentName)
        .neq('id', agentId)
        .maybeSingle();
    
    if (existingAgentName) {
        showNotifTop(`⚠️ Nama Agent "${agentName}" sudah terdaftar!`, true);
        document.getElementById('editAgentAgentName').focus();
        return;
    }
    
    // ===== DISABLE BUTTON =====
    const saveBtn = document.querySelector('#editAgentModal .btn-primary');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = '⏳ Menyimpan...';
        saveBtn.style.opacity = '0.6';
    }
    
    try {
        // ===== UPDATE DATA =====
        const updateData = {
            agent_id: agentIdInput.toUpperCase(),
            nama: nama,
            agent_name: agentName,
            hp: hp || '',
            apk: apk || '',
            agent_type: agentType || '',
            upline: upline || '',
            upline_phone: uplinePhone || '',
            admin_postpaid: adminPostpaid,
            admin_prepaid: adminPrepaid,
            admin_nontaglis: adminNontaglis,
            fee_postpaid: feePostpaid,
            fee_prepaid: feePrepaid,
            fee_nontaglis: feeNontaglis,
            jenis_bank: bank || '',
            nomor_rekening: rekening || '',
            atas_nama_rekening: rekeningAtasNama || '',
            cid: cid || '',
            updated_at: new Date().toISOString()
        };
        
        const { error } = await window.db
            .from('db_agent')
            .update(updateData)
            .eq('id', agentId);
        
        if (error) {
            showNotifTop('❌ Gagal menyimpan: ' + error.message, true);
            return;
        }
        
        showNotifTop('✅ Data agent berhasil diperbarui!');
        closeModalNew('editAgentModal');
        
        // ===== RELOAD DATA =====
        await loadDatabaseAgent();
        
    } catch (err) {
        console.error('Error:', err);
        showNotifTop('❌ Gagal: ' + err.message, true);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 Simpan Perubahan';
            saveBtn.style.opacity = '1';
        }
    }
}

// ===== FUNGSI UPDATE AGENT SELECTION COUNT =====
function updateAgentSelectionCount() {
    const countSpan = document.getElementById('agentSelectedCount');
    if (countSpan) {
        countSpan.innerText = selectedAgentIds.size;
    }
}

function handleAgentCheckboxChange(e) {
    e.stopPropagation();
    const id = e.target.dataset.id;
    if (e.target.checked) selectedAgentIds.set(id, true);
    else selectedAgentIds.delete(id);
    updateSelectAllAgentButton();
}

function handleAgentItemClick(e) {
    if (e.target.type !== 'checkbox' &&
        !e.target.classList.contains('db-item-wa') &&
        !e.target.classList.contains('db-item-move-followup') &&
        !e.target.classList.contains('db-item-delete')) {
        openAgentDetail(e.currentTarget.dataset.id);
    }
}

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

// ========== MODAL AGENT LENGKAP ==========
let agentUplineSuggestions = [];
let agentUplineTimeout = null;

function showAddAgentModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'addAgentModal';
    modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0, 0, 0, 0.7) !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        z-index: 999999999 !important;
        backdrop-filter: blur(5px) !important;
        pointer-events: auto !important;
    `;
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 520px; max-height: 85vh; overflow-y: auto; z-index: 999999999; pointer-events: auto; background: #fff; border-radius: 24px;">
            <div style="position: sticky; top: 0; background: #fff; border-radius: 24px 24px 0 0; z-index: 10; padding: 20px 24px 0; border-bottom: 1px solid #f0f0f0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 style="font-size: 20px; margin: 0; color: #1f2937;">👤 Tambah Agent</h3>
                        <div class="modal-subtitle" style="font-size: 13px; color: #6b7280; padding: 4px 0 12px 0;">Isi data agent baru <span style="color: #ef4444;">*</span> wajib diisi</div>
                    </div>
                    <button onclick="closeAddAgentModal()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #6b7280; padding: 0 4px; line-height: 1;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#6b7280'">✕</button>
                </div>
            </div>
            
            <div style="padding: 16px 24px 8px;">
                <!-- ===== APLIKASI ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">📱 Aplikasi</label>
                    <select id="agentApkInput" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px; background: #fff;">
                        <option value="">Pilih Aplikasi</option>
                        <option value="GNP">GNP</option>
                        <option value="BSB">BSB</option>
                        <option value="BTN">BTN</option>
                    </select>
                </div>

                <!-- ===== TIPE AGENT ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">🏷️ Tipe Agent</label>
                    <select id="agentTypeInput" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px; background: #fff;">
                        <option value="">Pilih Tipe Agent</option>
                        <option value="AGENT">👤 Agent</option>
                        <option value="CollectingAgent (CA)">🏦 Collecting Agent (CA)</option>
                        <option value="Koordinator Wilayah (KORWIL)">👥 Koordinator Wilayah (KORWIL)</option>
                    </select>
                </div>

                <!-- ===== UPLINE DENGAN DROPDOWN CLUE ===== -->
                <div class="form-group" style="margin-bottom: 14px; position: relative;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">👤 Upline / Atasan</label>
                    <input type="text" id="agentUplineInput" placeholder="Ketik nama upline..." maxlength="50" autocomplete="off" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                    <div id="uplineSuggestions" style="
                        position: absolute;
                        top: 100%;
                        left: 0;
                        right: 0;
                        background: #fff;
                        border: 1px solid #e5e7eb;
                        border-radius: 12px;
                        max-height: 200px;
                        overflow-y: auto;
                        display: none;
                        z-index: 1000;
                        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                        margin-top: 4px;
                    "></div>
                    <small class="input-hint" style="color: #6b7280; font-size: 11px;">Ketik nama upline, akan muncul saran otomatis</small>
                </div>

                <!-- ===== NOMOR HP UPLINE ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">📞 Nomor HP Upline</label>
                    <div class="phone-input" style="display: flex; gap: 10px; align-items: center;">
                        <div class="phone-prefix" style="background: #f3f4f6; border: 1.5px solid #e5e7eb; border-radius: 14px; padding: 0 16px; display: flex; align-items: center; font-weight: 600; height: 48px; color: #1f2937;">+62</div>
                        <input type="tel" id="agentUplinePhoneInput" placeholder="81234567890" maxlength="12" oninput="formatPhoneAuto(this)" style="flex:1; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                    </div>
                    <small class="input-hint" style="color: #6b7280; font-size: 11px;">Akan terisi otomatis jika memilih upline dari saran</small>
                </div>

                <!-- ===== NAMA LENGKAP (WAJIB) ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">👤 Nama Lengkap <span style="color: #ef4444;">*</span></label>
                    <input type="text" id="agentNameInput" placeholder="Masukkan nama lengkap" maxlength="25" oninput="formatNamaAuto(this)" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                    <small class="input-hint" style="color: #6b7280; font-size: 11px;">Huruf saja, max 25 karakter</small>
                </div>

                <!-- ===== NAMA AGENT (WAJIB) ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">🏷️ Nama Agent <span style="color: #ef4444;">*</span></label>
                    <input type="text" id="agentAgentNameInput" placeholder="Masukkan nama agent" maxlength="25" oninput="formatNamaAuto(this)" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                    <small class="input-hint" style="color: #6b7280; font-size: 11px;">Nama agent untuk display, huruf saja, max 25 karakter</small>
                </div>

                <!-- ===== NOMOR WHATSAPP ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">📱 Nomor WhatsApp</label>
                    <div class="phone-input" style="display: flex; gap: 10px; align-items: center;">
                        <div class="phone-prefix" style="background: #f3f4f6; border: 1.5px solid #e5e7eb; border-radius: 14px; padding: 0 16px; display: flex; align-items: center; font-weight: 600; height: 48px; color: #1f2937;">+62</div>
                        <input type="tel" id="agentPhoneInput" placeholder="81234567890" maxlength="12" oninput="formatPhoneAuto(this)" style="flex:1; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                    </div>
                    <small class="input-hint" style="color: #6b7280; font-size: 11px;">Awalan 8, angka 9-12 digit</small>
                </div>

                <!-- ===== ID AGENT ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">🆔 ID Agent <span style="color: #ef4444;">*</span></label>
                    <input type="text" id="agentIdInput" placeholder="Contoh: AG-001" maxlength="17" oninput="formatAgentIdAuto(this)" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                    <small class="input-hint" style="color: #6b7280; font-size: 11px;">Huruf besar, angka, max 17 karakter</small>
                </div>

                <!-- ===== ADMIN ===== -->
                <div style="background: #f8fafc; border-radius: 14px; padding: 12px 16px; margin-bottom: 14px; border: 1px solid #e5e7eb;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 10px;">🏷️ Admin</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                        <div>
                            <label style="font-size: 11px; color: #6b7280; display: block; margin-bottom: 4px;">Postpaid</label>
                            <input type="number" id="agentAdminPostpaid" placeholder="0" style="width:100%; padding: 8px 10px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="font-size: 11px; color: #6b7280; display: block; margin-bottom: 4px;">Prepaid</label>
                            <input type="number" id="agentAdminPrepaid" placeholder="0" style="width:100%; padding: 8px 10px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="font-size: 11px; color: #6b7280; display: block; margin-bottom: 4px;">Nontaglis</label>
                            <input type="number" id="agentAdminNontaglis" placeholder="0" style="width:100%; padding: 8px 10px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 12px;">
                        </div>
                    </div>
                </div>

                <!-- ===== FEE ===== -->
                <div style="background: #f8fafc; border-radius: 14px; padding: 12px 16px; margin-bottom: 14px; border: 1px solid #e5e7eb;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 10px;">💰 Fee</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                        <div>
                            <label style="font-size: 11px; color: #6b7280; display: block; margin-bottom: 4px;">Postpaid</label>
                            <input type="number" id="agentFeePostpaid" placeholder="0" style="width:100%; padding: 8px 10px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="font-size: 11px; color: #6b7280; display: block; margin-bottom: 4px;">Prepaid</label>
                            <input type="number" id="agentFeePrepaid" placeholder="0" style="width:100%; padding: 8px 10px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="font-size: 11px; color: #6b7280; display: block; margin-bottom: 4px;">Nontaglis</label>
                            <input type="number" id="agentFeeNontaglis" placeholder="0" style="width:100%; padding: 8px 10px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 12px;">
                        </div>
                    </div>
                </div>

                <!-- ===== JENIS BANK ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">🏦 Jenis Bank</label>
                    <input type="text" id="agentBankInput" placeholder="Contoh: BCA, Mandiri, BNI" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                </div>

                <!-- ===== NOMOR REKENING ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">🔢 Nomor Rekening</label>
                    <input type="text" id="agentRekeningInput" placeholder="Nomor rekening" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                </div>

                <!-- ===== ATAS NAMA REKENING ===== -->
                <div class="form-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">📛 Atas Nama Rekening</label>
                    <input type="text" id="agentRekeningAtasNamaInput" placeholder="Nama pemilik rekening" style="width:100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px; font-size: 13px;">
                </div>
            </div>

            <!-- ===== TOMBOL ===== -->
            <div class="modal-buttons" style="display: flex; gap: 12px; padding: 16px 24px 24px; border-top: 1px solid #e5e7eb; position: sticky; bottom: 0; background: #fff; border-radius: 0 0 24px 24px;">
                <button id="saveAgentBtn" class="btn-primary" style="flex: 1; padding: 12px; border: none; border-radius: 14px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #4f46e5, #6366f1); color: white;">💾 Simpan Agent</button>
                <button id="cancelAgentBtn" class="btn-outline" style="flex: 1; padding: 12px; border: none; border-radius: 14px; font-weight: 600; cursor: pointer; background: #f3f4f6; color: #374151;">❌ Batal</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    
    // ===== INISIALISASI UPLINE SUGGESTIONS =====
    initUplineSuggestions();
    
    applyDarkModeToModal(modal);
    
    // ===== TOMBOL SIMPAN =====
    document.getElementById('saveAgentBtn').onclick = async function() {
        await saveAgentData();
    };
    
    // ===== TOMBOL BATAL =====
    document.getElementById('cancelAgentBtn').onclick = function() {
        closeAddAgentModal();
    };
    
    // Klik di luar modal
    modal.onclick = function(e) {
        if (e.target === modal) {
            closeAddAgentModal();
        }
    };
}

// ========== UPLINE SUGGESTIONS ==========
function initUplineSuggestions() {
    const input = document.getElementById('agentUplineInput');
    const suggestionBox = document.getElementById('uplineSuggestions');
    
    if (!input || !suggestionBox) return;
    
    // Hapus listener lama
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
    
    const freshInput = document.getElementById('agentUplineInput');
    if (!freshInput) return;
    
    // Event: input
    freshInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        if (query.length < 1) {
            suggestionBox.style.display = 'none';
            return;
        }
        
        clearTimeout(agentUplineTimeout);
        agentUplineTimeout = setTimeout(() => {
            fetchUplineSuggestions(query);
        }, 300);
    });
    
    // Event: focus
    freshInput.addEventListener('focus', function() {
        if (this.value.trim().length >= 1) {
            fetchUplineSuggestions(this.value.trim());
        }
    });
    
    // Event: blur (tunda agar klik pada suggestion bisa terdeteksi)
    freshInput.addEventListener('blur', function() {
        setTimeout(() => {
            suggestionBox.style.display = 'none';
        }, 250);
    });
    
    // Event: keyboard navigation
    freshInput.addEventListener('keydown', function(e) {
        const items = suggestionBox.querySelectorAll('.suggestion-item');
        if (items.length === 0) return;
        
        let currentIndex = -1;
        items.forEach((item, index) => {
            if (item.classList.contains('active')) {
                currentIndex = index;
            }
        });
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = Math.min(currentIndex + 1, items.length - 1);
            items.forEach((item, index) => {
                item.classList.toggle('active', index === nextIndex);
                if (index === nextIndex) {
                    item.scrollIntoView({ block: 'nearest' });
                }
            });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = Math.max(currentIndex - 1, 0);
            items.forEach((item, index) => {
                item.classList.toggle('active', index === prevIndex);
                if (index === prevIndex) {
                    item.scrollIntoView({ block: 'nearest' });
                }
            });
        } else if (e.key === 'Enter') {
            const activeItem = suggestionBox.querySelector('.suggestion-item.active');
            if (activeItem) {
                e.preventDefault();
                activeItem.click();
            }
        } else if (e.key === 'Escape') {
            suggestionBox.style.display = 'none';
        }
    });
    
    // ===== OBSERVER UNTUK DARK MODE =====
    // Ketika dark mode berubah, update warna suggestion
    const darkModeObserver = new MutationObserver(function() {
        const isDark = document.body.classList.contains('dark-mode');
        const items = suggestionBox.querySelectorAll('.suggestion-item');
        items.forEach(item => {
            if (isDark) {
                item.style.background = '#1e293b';
                item.style.color = '#f1f5f9';
                item.style.borderBottomColor = '#334155';
            } else {
                item.style.background = '#ffffff';
                item.style.color = '#1f2937';
                item.style.borderBottomColor = '#f0f0f0';
            }
        });
    });
    
    darkModeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
}

async function fetchUplineSuggestions(query) {
    const suggestionBox = document.getElementById('uplineSuggestions');
    if (!suggestionBox) return;
    
    try {
        // ===== AMBIL DATA DARI DB_AGENT =====
        const { data: agentData, error: agentError } = await window.db
            .from('db_agent')
            .select('upline, upline_phone')
            .not('upline', 'is', null)
            .not('upline', 'eq', '')
            .ilike('upline', `%${query}%`)
            .limit(20);
        
        if (agentError) {
            console.error('Error fetching agent upline:', agentError);
        }
        
        let allData = [];
        let sourceMap = new Map(); // Untuk tracking sumber data
        
        if (agentData && agentData.length > 0) {
            agentData.forEach(item => {
                const key = (item.upline || '').trim().toLowerCase();
                if (key && !sourceMap.has(key)) {
                    sourceMap.set(key, {
                        name: item.upline.trim(),
                        phone: item.upline_phone || '',
                        source: '📋 DB Agent'
                    });
                }
            });
        }
        
        // ===== AMBIL DATA DARI CUSTOMERS =====
        const { data: customerData, error: customerError } = await window.db
            .from('customers')
            .select('upline_name, upline_phone')
            .not('upline_name', 'is', null)
            .not('upline_name', 'eq', '')
            .ilike('upline_name', `%${query}%`)
            .limit(20);
        
        if (!customerError && customerData) {
            customerData.forEach(item => {
                const key = (item.upline_name || '').trim().toLowerCase();
                if (key && !sourceMap.has(key)) {
                    sourceMap.set(key, {
                        name: item.upline_name.trim(),
                        phone: item.upline_phone || '',
                        source: '📞 Followup'
                    });
                }
            });
        }
        
        // ===== AMBIL DATA DARI PROSPEK =====
        const { data: prospekData, error: prospekError } = await window.db
            .from('prospek')
            .select('upline_name, upline_phone')
            .not('upline_name', 'is', null)
            .not('upline_name', 'eq', '')
            .ilike('upline_name', `%${query}%`)
            .limit(20);
        
        if (!prospekError && prospekData) {
            prospekData.forEach(item => {
                const key = (item.upline_name || '').trim().toLowerCase();
                if (key && !sourceMap.has(key)) {
                    sourceMap.set(key, {
                        name: item.upline_name.trim(),
                        phone: item.upline_phone || '',
                        source: '🎯 Prospek'
                    });
                }
            });
        }
        
        // ===== AMBIL DATA DARI DB_TRANSAKSI =====
        const { data: transaksiData, error: transaksiError } = await window.db
            .from('db_transaksi')
            .select('upline_name, upline_phone')
            .not('upline_name', 'is', null)
            .not('upline_name', 'eq', '')
            .not('upline_name', 'eq', '-')
            .ilike('upline_name', `%${query}%`)
            .limit(30);
        
        if (!transaksiError && transaksiData) {
            transaksiData.forEach(item => {
                const key = (item.upline_name || '').trim().toLowerCase();
                if (key && !sourceMap.has(key)) {
                    sourceMap.set(key, {
                        name: item.upline_name.trim(),
                        phone: item.upline_phone || '',
                        source: '📊 DB Transaksi'
                    });
                }
            });
        }
        
        // ===== AMBIL DATA DARI DB_CLOSING =====
        const { data: closingData, error: closingError } = await window.db
            .from('db_closing')
            .select('upline_name, upline_phone')
            .not('upline_name', 'is', null)
            .not('upline_name', 'eq', '')
            .not('upline_name', 'eq', '-')
            .ilike('upline_name', `%${query}%`)
            .limit(20);
        
        if (!closingError && closingData) {
            closingData.forEach(item => {
                const key = (item.upline_name || '').trim().toLowerCase();
                if (key && !sourceMap.has(key)) {
                    sourceMap.set(key, {
                        name: item.upline_name.trim(),
                        phone: item.upline_phone || '',
                        source: '📁 DB Closing'
                    });
                }
            });
        }
        
        // ===== AMBIL DATA DARI DB_COMMITMENT =====
        const { data: commitmentData, error: commitmentError } = await window.db
            .from('db_commitment')
            .select('upline_name, upline_phone')
            .not('upline_name', 'is', null)
            .not('upline_name', 'eq', '')
            .not('upline_name', 'eq', '-')
            .ilike('upline_name', `%${query}%`)
            .limit(20);
        
        if (!commitmentError && commitmentData) {
            commitmentData.forEach(item => {
                const key = (item.upline_name || '').trim().toLowerCase();
                if (key && !sourceMap.has(key)) {
                    sourceMap.set(key, {
                        name: item.upline_name.trim(),
                        phone: item.upline_phone || '',
                        source: '🤝 DB Commitment'
                    });
                }
            });
        }
        
        const uniqueData = Array.from(sourceMap.values());
        
        // Urutkan berdasarkan nama
        uniqueData.sort((a, b) => a.name.localeCompare(b.name));
        
        if (uniqueData.length === 0) {
            suggestionBox.innerHTML = `
                <div class="suggestion-empty">
                    🔍 Tidak ditemukan upline dengan nama "${escapeHtml(query)}"
                </div>
            `;
            suggestionBox.style.display = 'block';
            return;
        }
        
        // ===== RENDER SUGGESTIONS =====
        suggestionBox.innerHTML = uniqueData.map(item => `
            <div class="suggestion-item" data-name="${escapeHtml(item.name)}" data-phone="${escapeHtml(item.phone)}" style="
                padding: 10px 14px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                transition: all 0.2s;
                font-size: 13px;
                color: #1f2937;
                background: #ffffff;
            " 
            onmouseenter="this.style.background='#eef2ff'" 
            onmouseleave="this.style.background='#ffffff'"
            onmouseenterDark="this.style.background='#0f172a'" 
            onmouseleaveDark="this.style.background='#1e293b'">
                <div class="suggestion-name">👤 ${escapeHtml(item.name)}</div>
                ${item.phone ? 
                    `<div class="suggestion-phone">📞 ${escapeHtml(item.phone)}</div>` : 
                    `<div class="suggestion-phone" style="color: #9ca3af;">📞 No HP tidak tersedia</div>`
                }
                <div class="suggestion-source">${item.source || '📋 Sumber tidak diketahui'}</div>
            </div>
        `).join('');
        
        // ===== EVENT LISTENER UNTUK SETIAP SUGGESTION =====
        suggestionBox.querySelectorAll('.suggestion-item').forEach(el => {
            el.addEventListener('click', function() {
                const name = this.dataset.name;
                const phone = this.dataset.phone;
                
                document.getElementById('agentUplineInput').value = name;
                if (phone && phone !== '') {
                    let cleanPhone = phone.replace(/[^\d]/g, '');
                    if (cleanPhone.startsWith('62')) cleanPhone = cleanPhone.substring(2);
                    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
                    document.getElementById('agentUplinePhoneInput').value = cleanPhone;
                } else {
                    document.getElementById('agentUplinePhoneInput').value = '';
                }
                suggestionBox.style.display = 'none';
            });
            
            // ===== DARK MODE SUPPORT =====
            el.addEventListener('mouseenter', function() {
                if (document.body.classList.contains('dark-mode')) {
                    this.style.background = '#0f172a';
                } else {
                    this.style.background = '#eef2ff';
                }
            });
            el.addEventListener('mouseleave', function() {
                if (document.body.classList.contains('dark-mode')) {
                    this.style.background = '#1e293b';
                } else {
                    this.style.background = '#ffffff';
                }
            });
        });
        
        suggestionBox.style.display = 'block';
        
    } catch (err) {
        console.error('Error fetching suggestions:', err);
        suggestionBox.innerHTML = `
            <div class="suggestion-empty" style="color: #ef4444;">
                ❌ Gagal memuat data: ${escapeHtml(err.message)}
            </div>
        `;
        suggestionBox.style.display = 'block';
    }
}

// ========== SAVE AGENT ==========
async function saveAgentData() {
    const agentId = document.getElementById('agentIdInput').value;
    const nama = document.getElementById('agentNameInput').value;
    const agentName = document.getElementById('agentAgentNameInput').value;
    let hp = document.getElementById('agentPhoneInput').value;
    const apk = document.getElementById('agentApkInput').value;
    const agentType = document.getElementById('agentTypeInput').value;
    const upline = document.getElementById('agentUplineInput').value;
    let uplinePhone = document.getElementById('agentUplinePhoneInput').value;
    const adminPostpaid = document.getElementById('agentAdminPostpaid').value;
    const adminPrepaid = document.getElementById('agentAdminPrepaid').value;
    const adminNontaglis = document.getElementById('agentAdminNontaglis').value;
    const feePostpaid = document.getElementById('agentFeePostpaid').value;
    const feePrepaid = document.getElementById('agentFeePrepaid').value;
    const feeNontaglis = document.getElementById('agentFeeNontaglis').value;
    const bank = document.getElementById('agentBankInput').value;
    const rekening = document.getElementById('agentRekeningInput').value;
    const rekeningAtasNama = document.getElementById('agentRekeningAtasNamaInput').value;
    
    // ===== VALIDASI WAJIB =====
    if (!agentId) {
        showNotifTop('⚠️ ID Agent wajib diisi!', true);
        document.getElementById('agentIdInput').focus();
        return;
    }
    
    if (!nama) {
        showNotifTop('⚠️ Nama Lengkap wajib diisi!', true);
        document.getElementById('agentNameInput').focus();
        return;
    }
    
    if (!agentName) {
        showNotifTop('⚠️ Nama Agent wajib diisi!', true);
        document.getElementById('agentAgentNameInput').focus();
        return;
    }
    
    // ===== FORMAT HP =====
    hp = hp.replace(/[^\d]/g, '');
    if (hp.startsWith('0')) hp = hp.substring(1);
    if (hp && !hp.startsWith('62')) hp = '62' + hp;
    
    if (uplinePhone) {
        uplinePhone = uplinePhone.replace(/[^\d]/g, '');
        if (uplinePhone.startsWith('0')) uplinePhone = uplinePhone.substring(1);
        if (uplinePhone && !uplinePhone.startsWith('62')) uplinePhone = '62' + uplinePhone;
    }
    
    // ===== CEK DUPLIKAT ID AGENT =====
    const { data: existing } = await window.db
        .from('db_agent')
        .select('id')
        .eq('agent_id', agentId.toUpperCase())
        .maybeSingle();
    
    if (existing) {
        showNotifTop(`⚠️ ID Agent "${agentId}" sudah terdaftar!`, true);
        document.getElementById('agentIdInput').focus();
        return;
    }
    
    // ===== CEK DUPLIKAT NAMA LENGKAP =====
    const { data: existingName } = await window.db
        .from('db_agent')
        .select('id')
        .eq('nama', nama)
        .maybeSingle();
    
    if (existingName) {
        showNotifTop(`⚠️ Nama "${nama}" sudah terdaftar!`, true);
        document.getElementById('agentNameInput').focus();
        return;
    }
    
    // ===== CEK DUPLIKAT NAMA AGENT =====
    const { data: existingAgentName } = await window.db
        .from('db_agent')
        .select('id')
        .eq('agent_name', agentName)
        .maybeSingle();
    
    if (existingAgentName) {
        showNotifTop(`⚠️ Nama Agent "${agentName}" sudah terdaftar!`, true);
        document.getElementById('agentAgentNameInput').focus();
        return;
    }
    
    try {
        const btn = document.getElementById('saveAgentBtn');
        btn.disabled = true;
        btn.textContent = '⏳ Menyimpan...';
        btn.style.opacity = '0.6';
        
        const insertData = {
            agent_id: agentId.toUpperCase(),
            nama: nama,
            agent_name: agentName, // <-- NAMA AGENT
            hp: hp || '',
            apk: apk || '',
            agent_type: agentType || '',
            upline: upline || '',
            upline_phone: uplinePhone || '',
            admin_postpaid: parseInt(adminPostpaid) || 0,
            admin_prepaid: parseInt(adminPrepaid) || 0,
            admin_nontaglis: parseInt(adminNontaglis) || 0,
            fee_postpaid: parseInt(feePostpaid) || 0,
            fee_prepaid: parseInt(feePrepaid) || 0,
            fee_nontaglis: parseInt(feeNontaglis) || 0,
            jenis_bank: bank || '',
            nomor_rekening: rekening || '',
            atas_nama_rekening: rekeningAtasNama || '',
            user_id: currentUser.id,
            created_at: new Date().toISOString()
        };
        
        await window.db.from('db_agent').insert(insertData);
        
        showNotifTop('✅ Agent berhasil ditambahkan!');
        closeAddAgentModal();
        await loadDatabaseAgent();
        
    } catch (err) {
        console.error('Error:', err);
        showNotifTop('❌ Gagal: ' + err.message, true);
    } finally {
        const btn = document.getElementById('saveAgentBtn');
        if (btn) {
            btn.disabled = false;
            btn.textContent = '💾 Simpan Agent';
            btn.style.opacity = '1';
        }
    }
}

// ========== CLOSE ADD AGENT MODAL ==========
function closeAddAgentModal() {
    const modal = document.getElementById('addAgentModal');
    if (modal) {
        modal.remove();
    }
    // Bersihkan suggestion
    const suggestionBox = document.getElementById('uplineSuggestions');
    if (suggestionBox) {
        suggestionBox.style.display = 'none';
        suggestionBox.innerHTML = '';
    }
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
}

// ========== PRODUK FUNCTIONS ==========
function renderProdukList() {
    const container = document.getElementById('produkList');
    if (!container) return;

    if (produkData.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;">🏷️ Tidak ada produk</p>';
        return;
    }

    container.innerHTML = produkData.map(item => {
        const isChecked = selectedProdukIds.get(item.id) === true;
        return `
            <div class="db-item produk-item" data-id="${item.id}">
                <input type="checkbox" class="db-item-checkbox-produk" data-id="${item.id}" ${isChecked ? 'checked' : ''}>
                <div class="db-item-info">
                    <h4>📦 ${escapeHtml(item.nama)}</h4>
                    <p>💰 HPP: ${formatRupiah(item.hpp)} | Jual: ${formatRupiah(item.harga_jual)}</p>
                    <small>${escapeHtml(item.keterangan || '')}</small>
                </div>
                <div class="db-item-actions">
                    <button class="db-item-edit" onclick="event.stopPropagation(); editProduk('${item.id}')">✏️ Edit</button>
                    <button class="db-item-delete" onclick="event.stopPropagation(); deleteProduk('${item.id}')">🗑️ Hapus</button>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('#produkList .db-item-checkbox-produk').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const id = cb.dataset.id;
            if (cb.checked) selectedProdukIds.set(id, true);
            else selectedProdukIds.delete(id);
            updateSelectAllProdukButton();
        });
    });

    updateSelectAllProdukButton();
}

function updateSelectAllProdukButton() {
    const btn = document.getElementById('selectAllProduk');
    if (!btn) return;
    
    const allChecked = produkData.length > 0 && produkData.every(item => selectedProdukIds.get(item.id) === true);
    btn.textContent = allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua';
}

async function deleteProduk(id) {
    if (!confirm('Yakin hapus produk ini?')) return;
    
    await window.db.from('produk').delete().eq('id', id);
    const index = produkData.findIndex(p => p.id === id);
    if (index !== -1) produkData.splice(index, 1);
    selectedProdukIds.delete(id);
    renderProdukList();
    showNotifTop('🗑️ Produk berhasil dihapus');
}

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
        await window.db.from('produk').update(data).eq('id', id);
        showNotifTop('✅ Produk berhasil diupdate');
    } else {
        data.created_at = new Date().toISOString();
        await window.db.from('produk').insert(data);
        showNotifTop('✅ Produk berhasil ditambahkan');
    }
    await loadProduk();
    return true;
}

function editProduk(id) {
    const produk = produkData.find(p => p.id === id);
    if (!produk) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '9999999';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 450px;">
            <h3>✏️ Edit Produk</h3>
            <div class="modal-subtitle">Edit data produk</div>
            <div style="padding: 0 20px;">
                <div class="form-group"><label>Nama Produk</label><input type="text" id="editNama" value="${escapeHtml(produk.nama)}"></div>
                <div class="form-group"><label>HPP (Modal)</label><input type="number" id="editHpp" value="${produk.hpp}"></div>
                <div class="form-group"><label>Keterangan</label><textarea id="editKeterangan" rows="2">${escapeHtml(produk.keterangan || '')}</textarea></div>
            </div>
            <div class="modal-buttons">
                <button id="saveEditBtn" class="btn-primary">💾 Simpan</button>
                <button class="closeEditBtn btn-outline">Batal</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('saveEditBtn').onclick = async () => {
        const nama = document.getElementById('editNama').value;
        const hpp = document.getElementById('editHpp').value;
        const keterangan = document.getElementById('editKeterangan').value;
        
        if (!nama || !hpp) {
            showNotifTop('⚠️ Nama dan HPP wajib diisi!', true);
            return;
        }
        
        await window.db.from('produk').update({
            nama: nama,
            hpp: parseInt(hpp),
            keterangan: keterangan,
            updated_at: new Date().toISOString()
        }).eq('id', id);
        
        showNotifTop('✅ Produk berhasil diupdate');
        modal.remove();
        await loadProduk();
    };
    
    modal.querySelector('.closeEditBtn').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

function handleTransaksiListChange(e) {
    if (e.target.classList.contains('transaksi-checkbox')) {
        const id = e.target.dataset.id;
        if (e.target.checked) {
            selectedTransaksiIds.set(id, true);
        } else {
            selectedTransaksiIds.delete(id);
        }
        updateSelectAllTransaksiButton();
        updateTransaksiSelectionCount();
    }
}

function renderTransaksiList() {
    const container = document.getElementById('dbTransaksiList');
    if (!container) return;
    
    const data = window.transaksiData || transaksiData || [];
    
    console.log('📊 renderTransaksiList - data length:', data.length);
    
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #9ca3af;">
                <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
                <p style="font-size: 16px; font-weight: 500;">Tidak ada data transaksi</p>
                <p style="font-size: 13px; margin-top: 4px;">Coba ubah filter atau import data baru</p>
            </div>
        `;
        return;  // ← Kembali ke sini jika tidak ada data
    }
    
    // ===== FILTER DATA =====
    const searchTerm = document.getElementById('searchTransaksiInput')?.value.toLowerCase().trim() || '';
    const filterJenis = document.getElementById('filterTransaksiJenis')?.value || '';
    const filterStatus = document.getElementById('filterTransaksiStatus')?.value || '';
    const filterUpline = document.getElementById('filterTransaksiUpline')?.value.toLowerCase().trim() || '';
    
    let filtered = [...data];
    
    if (searchTerm) {
        filtered = filtered.filter(item =>
            (item.nama && String(item.nama).toLowerCase().includes(searchTerm)) ||
            (item.agent_id && String(item.agent_id).toLowerCase().includes(searchTerm)) ||
            (item.hp && String(item.hp).includes(searchTerm))
        );
    }
    
    if (filterJenis) {
        filtered = filtered.filter(item => item.progres_jenis === filterJenis);
    }
    
    if (filterStatus) {
        filtered = filtered.filter(item => item.status === filterStatus);
    }
    
    if (filterUpline) {
        filtered = filtered.filter(item => {
            if (item.upline_name && String(item.upline_name).toLowerCase().includes(filterUpline)) return true;
            if (item.upline_phone && String(item.upline_phone).toLowerCase().includes(filterUpline)) return true;
            if (item.upline && String(item.upline).toLowerCase().includes(filterUpline)) return true;
            return false;
        });
    }
    
    // ===== UPDATE STATISTIK =====
    updateTransaksiStats(data);
    
    // ===== UPDATE TOTAL INFO =====
    const totalCountSpan = document.getElementById('transaksiTotalCount');
    if (totalCountSpan) totalCountSpan.innerText = filtered.length;
    
    const totalAllSpan = document.getElementById('transaksiTotalAll');
    if (totalAllSpan) totalAllSpan.innerText = data.length;
    
    const selectedCountSpan = document.getElementById('transaksiSelectedCount');
    if (selectedCountSpan) selectedCountSpan.innerText = selectedTransaksiIds.size;
    
    // ===== TAMPILKAN DATA =====
    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #9ca3af;">
                <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
                <p style="font-size: 16px; font-weight: 500;">Tidak ada data sesuai filter</p>
                <p style="font-size: 13px; margin-top: 4px;">Coba ubah filter pencarian</p>
            </div>
        `;
        return;  // ← Kembali ke sini jika filter tidak cocok
    }
    
    // ===== BUILD HTML =====
    let html = '';
    filtered.forEach((item, index) => {
        const isChecked = selectedTransaksiIds.get(item.id) === true;
        const absValue = Math.abs(item.progres_jumlah || 0);
        const jumlah = item.progres_jumlah || 0;
        
        let statusClass = 'baru';
        let statusText = '📋 Baru';
        if (item.status === 'imported') {
            statusClass = 'imported';
            statusText = '✅ Sudah Dipindah';
        } else if (item.status === 'pending_import') {
            statusClass = 'pending';
            statusText = '⏳ Pending';
        }
        
        // ===== JENIS & WARNA =====
        let jenisClass = 'normal';
        let jenisText = '⚖️ Normal';
        let progressClass = 'normal';
        
        if (item.progres_jenis === 'naik') {
            jenisClass = 'naik';
            jenisText = '📈 Naik';
            progressClass = 'naik';
        } else if (item.progres_jenis === 'turun') {
            jenisClass = 'turun';
            jenisText = '📉 Turun';
            progressClass = 'turun';
        } else if (item.progres_jenis === 'tidak_transaksi') {
            jenisClass = 'tidak';
            jenisText = '🚫 Tidak Transaksi';
            progressClass = 'tidak';
        }
        
        // ===== WARNA UNTUK NILAI =====
        let nilaiClass = 'normal';
        if (item.progres_jenis === 'naik' || (item.progres_jenis === 'normal' && jumlah > 0)) {
            nilaiClass = 'naik';
        } else if (item.progres_jenis === 'turun' || (item.progres_jenis === 'normal' && jumlah < 0)) {
            nilaiClass = 'turun';
        } else if (item.progres_jenis === 'tidak_transaksi') {
            nilaiClass = 'tidak';
        }
        
        const maxValue = Math.max(...data.map(t => Math.abs(t.progres_jumlah || 0)), 1);
        const barPercent = Math.min((absValue / maxValue) * 100, 100);
        
        // ===== LOGIKA TANDA + / - =====
        let displayValue = '';
        
        if (item.progres_jenis === 'tidak_transaksi') {
            displayValue = '0';
        } else if (item.progres_jenis === 'naik') {
            displayValue = '+' + jumlah.toLocaleString();
        } else if (item.progres_jenis === 'turun') {
            displayValue = '-' + Math.abs(jumlah).toLocaleString();
        } else {
            // NORMAL - gunakan nilai asli (bisa positif atau negatif)
            if (jumlah > 0) {
                displayValue = '+' + jumlah.toLocaleString();
            } else if (jumlah < 0) {
                displayValue = '-' + Math.abs(jumlah).toLocaleString();
            } else {
                displayValue = '0';
            }
        }
        
        // ===== HTML =====
        html += `
            <div class="transaksi-item-premium" data-id="${item.id}">
                <div class="nomor-urut">${index + 1}</div>
                <div class="checkbox-wrapper">
                    <input type="checkbox" class="transaksi-checkbox" data-id="${item.id}" ${isChecked ? 'checked' : ''}>
                </div>
                <div class="info-utama">
                    <div class="header-row">
                        <span class="nama">${escapeHtml(item.nama || item.agent_id)}</span>
                        <span class="agent-id">🆔 ${escapeHtml(item.agent_id || '-')}</span>
                        <span class="badge-jenis ${jenisClass}">${jenisText}</span>
                        <span class="badge-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="detail-row">
                        <span>📱 ${escapeHtml(item.hp || '-')}</span>
                        <span>👤 ${escapeHtml(item.upline_name || '-')}</span>
                        <span>📊 ${(item.transaksi_bulan_lalu || 0).toLocaleString()} → ${(item.transaksi_bulan_ini || 0).toLocaleString()}</span>
                        ${item.apk ? `<span>📱 ${escapeHtml(item.apk)}</span>` : ''}
                    </div>
                </div>
                <div class="nilai-container">
                    <div class="nilai ${nilaiClass}">
                        ${displayValue}
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill ${progressClass}" style="width: ${barPercent}%;"></div>
                    </div>
                    <span class="nilai-label">${absValue.toLocaleString()}</span>
                </div>
                <div class="aksi-container">
                    <button class="btn-wa" data-hp="${escapeHtml(item.hp || '')}">💬</button>
                    ${item.status !== 'imported' ? `
                        <button class="btn-move" data-id="${item.id}">📋 Pindah ke CS</button>
                    ` : ''}
                    <button class="btn-delete" data-id="${item.id}">🗑️</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;

    // ===== HAPUS EVENT LISTENER LAMA =====
    const newContainer = container.cloneNode(true);
    container.parentNode.replaceChild(newContainer, container);
    const freshContainer = document.getElementById('dbTransaksiList');
    if (!freshContainer) return;
    
    // ===== PASANG EVENT DELEGATION =====
freshContainer.addEventListener('click', function(e) {
    const target = e.target;
    
    if (target.classList.contains('btn-delete')) {
        e.stopPropagation();
        e.preventDefault();
        const id = target.dataset.id;
        if (id) deleteTransaksiItem(id);
        return;
    }
    
    if (target.classList.contains('btn-wa')) {
        e.stopPropagation();
        e.preventDefault();
        const hp = target.dataset.hp;
        if (hp) openWA(hp);
        return;
    }
    
    if (target.classList.contains('btn-move')) {
        e.stopPropagation();
        e.preventDefault();
        const id = target.dataset.id;
        if (id) {
            // ✅ SUDAH BENAR - menggunakan modal
            moveSingleToFollowupWithModal(id);
        }
        return;
    }
    
    const itemElement = target.closest('.transaksi-item-premium');
    if (itemElement && !target.closest('.aksi-container') && !target.closest('.checkbox-wrapper')) {
        const id = itemElement.dataset.id;
        if (id) {
            e.stopPropagation();
            e.preventDefault();
            openDetailTransaksi(id);
        }
    }
});

freshContainer.addEventListener('change', function(e) {
    if (e.target.classList.contains('transaksi-checkbox')) {
        const id = e.target.dataset.id;
        if (e.target.checked) {
            selectedTransaksiIds.set(id, true);
        } else {
            selectedTransaksiIds.delete(id);
        }
        updateSelectAllTransaksiButton();
        updateTransaksiSelectionCount();
    }
});
    
    updateSelectAllTransaksiButton();
    updateTransaksiSelectionCount();
}
    
// ===== HANDLE TRANSAKSI CHECKBOX CHANGE =====
function handleTransaksiCheckboxChange(e) {
    e.stopPropagation();
    const id = this.dataset.id;
    if (this.checked) {
        selectedTransaksiIds.set(id, true);
    } else {
        selectedTransaksiIds.delete(id);
    }
    updateSelectAllTransaksiButton();
    updateTransaksiSelectionCount();
}

// ========== UPDATE TRANSAKSI TOTALS ==========
function updateTransaksiTotals(filteredData) {
    const data = filteredData || transaksiData;
    
    // ===== HITUNG JUMLAH AGENT PER KATEGORI =====
    let totalNaik = 0;      // JUMLAH AGENT yang naik
    let totalTurun = 0;     // JUMLAH AGENT yang turun
    let totalNormal = 0;    // JUMLAH AGENT yang normal
    let totalTidakTransaksi = 0; // JUMLAH AGENT yang tidak transaksi
    let totalImported = 0;
    let totalPending = 0;
    
    data.forEach(t => {
        const jenis = t.progres_jenis || 'normal';
        
        // Hitung JUMLAH AGENT berdasarkan jenis
        if (jenis === 'naik') {
            totalNaik++;
        } else if (jenis === 'turun') {
            totalTurun++;
        } else if (jenis === 'tidak_transaksi') {
            totalTidakTransaksi++;
        } else {
            totalNormal++;
        }
        
        // Hitung status
        if (t.status === 'imported') {
            totalImported++;
        } else {
            totalPending++;
        }
    });
    
    // ===== UPDATE SEMUA ELEMEN STATISTIK =====
    const naikSpan = document.getElementById('transaksiTotalNaik');
    const turunSpan = document.getElementById('transaksiTotalTurun');
    const normalSpan = document.getElementById('transaksiTotalNormal');
    const tidakSpan = document.getElementById('transaksiTotalTidak');
    
    if (naikSpan) naikSpan.innerText = totalNaik.toLocaleString();
    if (turunSpan) turunSpan.innerText = totalTurun.toLocaleString();
    if (normalSpan) normalSpan.innerText = totalNormal.toLocaleString();
    if (tidakSpan) tidakSpan.innerText = totalTidakTransaksi.toLocaleString();
}

// ========== UPDATE TRANSAKSI SELECTION COUNT ==========
function updateTransaksiSelectionCount() {
    const countSpan = document.getElementById('transaksiSelectedCount');
    if (countSpan) {
        countSpan.innerText = selectedTransaksiIds.size;
    }
}

// ========== UPDATE TRANSAKSI STATS ==========
function updateTransaksiStats(data) {
    // ===== GUNAKAN DATA YANG DITERIMA =====
    const allData = data || transaksiData || [];
    
    if (DEBUG) console.log('📊 updateTransaksiStats - data length:', allData.length);
    
    let totalNaik = 0;
    let totalTurun = 0;
    let totalNormal = 0;
    let totalTidakTransaksi = 0;
    let totalImported = 0;
    let totalPending = 0;
    let totalData = allData.length;
    
    allData.forEach(t => {
        const jenis = t.progres_jenis || 'normal';
        
        if (jenis === 'naik') totalNaik++;
        else if (jenis === 'turun') totalTurun++;
        else if (jenis === 'tidak_transaksi') totalTidakTransaksi++;
        else totalNormal++;
        
        if (t.status === 'imported') totalImported++;
        else totalPending++;
    });
    
    if (DEBUG) console.log('📊 Statistik:', {
        total: totalData,
        naik: totalNaik,
        turun: totalTurun,
        normal: totalNormal,
        tidak: totalTidakTransaksi,
        imported: totalImported,
        pending: totalPending
    });
    
    // ===== UPDATE STATS CONTAINER =====
    const statsContainer = document.getElementById('transaksiStats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; padding: 12px 16px; background: #f8fafc; border-radius: 14px; border: 1px solid #e5e7eb;">
                <div style="display: flex; align-items: center; gap: 6px; background: #eef2ff; padding: 6px 14px; border-radius: 10px;">
                    <span style="font-weight: 600; color: #4f46e5;">📊 Total</span>
                    <span style="font-weight: 700; color: #1f2937;">${totalData.toLocaleString()}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; background: #d1fae5; padding: 6px 14px; border-radius: 10px;">
                    <span style="font-weight: 600; color: #065f46;">✅ Imported</span>
                    <span style="font-weight: 700; color: #1f2937;">${totalImported.toLocaleString()}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; background: #fef3c7; padding: 6px 14px; border-radius: 10px;">
                    <span style="font-weight: 600; color: #92400e;">⏳ Pending</span>
                    <span style="font-weight: 700; color: #1f2937;">${totalPending.toLocaleString()}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; background: #d1fae5; padding: 6px 14px; border-radius: 10px;">
                    <span style="font-weight: 600; color: #065f46;">📈 Naik</span>
                    <span style="font-weight: 700; color: #1f2937;">${totalNaik.toLocaleString()}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; background: #fee2e2; padding: 6px 14px; border-radius: 10px;">
                    <span style="font-weight: 600; color: #991b1b;">📉 Turun</span>
                    <span style="font-weight: 700; color: #1f2937;">${totalTurun.toLocaleString()}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; background: #fef3c7; padding: 6px 14px; border-radius: 10px;">
                    <span style="font-weight: 600; color: #92400e;">⚖️ Normal</span>
                    <span style="font-weight: 700; color: #1f2937;">${totalNormal.toLocaleString()}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; background: #e5e7eb; padding: 6px 14px; border-radius: 10px;">
                    <span style="font-weight: 600; color: #4b5563;">🚫 Tidak Transaksi</span>
                    <span style="font-weight: 700; color: #1f2937;">${totalTidakTransaksi.toLocaleString()}</span>
                </div>
            </div>
        `;
    }
}

// ================================================================
// ========== RIWAYAT TRANSAKSI BULANAN ==========
// ================================================================

/**
 * Menyimpan riwayat transaksi bulanan ke Supabase
 * @param {string} periode - Format: "Januari 2024"
 * @param {Array} data - Array data transaksi
 * @param {string} userId - ID user
 */
// ========== SAVE RIWAYAT TRANSAKSI BULANAN ==========
async function saveRiwayatTransaksiBulanan(periode, data, userId) {
    if (!periode || !data || data.length === 0) {
        console.warn('⚠️ Tidak ada data untuk disimpan');
        return;
    }
    
    try {
        // Parse periode
        const [namaBulan, tahunStr] = periode.split(' ');
        const tahun = parseInt(tahunStr);
        const bulanIndex = getBulanIndex(namaBulan);
        
        if (!bulanIndex || isNaN(tahun)) {
            console.error('❌ Format periode salah:', periode);
            return;
        }
        
        // Hitung statistik dari data
        let totalNaik = 0;
        let totalTurun = 0;
        let totalNormal = 0;
        let totalTidakTransaksi = 0;
        
        data.forEach(item => {
            const jenis = item.progres_jenis || 'normal';
            if (jenis === 'naik') totalNaik++;
            else if (jenis === 'turun') totalTurun++;
            else if (jenis === 'tidak_transaksi') totalTidakTransaksi++;
            else totalNormal++;
        });
        
        const totalData = data.length;
        
        // Data untuk di-insert
        const riwayatData = {
            bulan: periode,
            tahun: tahun,
            bulan_index: bulanIndex,
            total_naik: totalNaik,
            total_turun: totalTurun,
            total_normal: totalNormal,
            total_tidak_transaksi: totalTidakTransaksi,
            total_data: totalData,
            user_id: userId || currentUser.id,
            updated_at: new Date().toISOString()
        };
        
        if (DEBUG) console.log('📊 Menyimpan riwayat:', riwayatData);
        
        // Upsert (insert atau update jika sudah ada)
        const { data: result, error } = await window.db
            .from('riwayat_transaksi_bulanan')
            .upsert(riwayatData, {
                onConflict: 'bulan,tahun,user_id',
                ignoreDuplicates: false
            })
            .select();
        
        if (error) {
            console.error('❌ Gagal menyimpan riwayat:', error);
            showNotifTop('❌ Gagal menyimpan riwayat: ' + error.message, true);
            return;
        }
        
        if (DEBUG) console.log('✅ Riwayat berhasil disimpan:', result);
        showNotifTop(`📊 Riwayat ${periode} berhasil disimpan!`);
        
        // ===== RELOAD RIWAYAT DAN UPDATE CHART =====
        await loadRiwayatTransaksi();
        
    } catch (err) {
        console.error('❌ Error save riwayat:', err);
        showNotifTop('❌ Error: ' + err.message, true);
    }
}

/**
 * Mendapatkan index bulan dari nama bulan
 */
function getBulanIndex(namaBulan) {
    const bulanMap = {
        'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4,
        'Mei': 5, 'Juni': 6, 'Juli': 7, 'Agustus': 8,
        'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12
    };
    return bulanMap[namaBulan] || null;
}

/**
 * Mendapatkan nama bulan dari index
 */
function getNamaBulan(index) {
    const bulanMap = {
        1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April',
        5: 'Mei', 6: 'Juni', 7: 'Juli', 8: 'Agustus',
        9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
    };
    return bulanMap[index] || null;
}

// ========== LOAD RIWAYAT TRANSAKSI ==========
let _isLoadingRiwayat = false;

async function loadRiwayatTransaksi() {
    // ===== CEGAH MULTIPLE LOAD =====
    if (_isLoadingRiwayat) {
        if (DEBUG) console.log('⏳ Riwayat sedang dimuat, skip...');
        return;
    }
    
    if (!currentUser) {
        console.warn('loadRiwayatTransaksi: No user');
        return;
    }
    
    _isLoadingRiwayat = true;
    
    try {
        // ===== AMBIL SEMUA DATA TANPA LIMIT =====
        const { data, error, count } = await window.db
            .from('riwayat_transaksi_bulanan')
            .select('*', { count: 'exact' })
            .eq('user_id', currentUser.id)
            .order('tahun', { ascending: false })
            .order('bulan_index', { ascending: false });
        
        if (error) {
            console.error('❌ Gagal load riwayat:', error);
            window._riwayatData = [];
            updateTrendChart();
            renderRiwayatTransaksi([]);
            return;
        }
        
        if (DEBUG) console.log(`📊 Riwayat ditemukan: ${count || 0} data`);
        if (DEBUG) console.log('📊 Data riwayat:', data);
        
        // ===== SIMPAN DATA GLOBAL =====
        window._riwayatData = data || [];
        isRiwayatLoaded = true;
        
        // ===== UPDATE CHART =====
        updateTrendChart();
        
        // ===== RENDER LIST =====
        renderRiwayatTransaksi(data || []);
        
        // ===== UPDATE BADGE =====
        updateTrendChartBadge();
        
        if (DEBUG) console.log(`📊 Riwayat dimuat: ${(data || []).length} bulan`);
        
    } catch (err) {
        console.error('❌ Error load riwayat:', err);
        window._riwayatData = [];
        updateTrendChart();
        showNotifTop('⚠️ Gagal memuat riwayat', true);
    } finally {
        _isLoadingRiwayat = false;
    }
}

// ========== RENDER RIWAYAT TRANSAKSI ==========
function renderRiwayatTransaksi(data) {
    const container = document.getElementById('riwayatTransaksiList');
    if (!container) return;
    
    // ===== URUTKAN DARI TERBARU KE TERLAMA =====
    const sortedData = [...data].sort((a, b) => {
        // Urutkan berdasarkan tahun dan bulan (descending)
        if (a.tahun !== b.tahun) {
            return b.tahun - a.tahun;
        }
        return b.bulan_index - a.bulan_index;
    });
    
    if (sortedData.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #9ca3af;">
                <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                <p style="font-size: 14px;">Belum ada riwayat transaksi</p>
                <p style="font-size: 12px; margin-top: 4px;">Import data transaksi untuk mulai mencatat riwayat</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = sortedData.map(item => `
        <div class="riwayat-item" style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 18px;
            margin-bottom: 8px;
            background: #f8fafc;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            transition: all 0.2s;
            flex-wrap: wrap;
            gap: 12px;
            animation: fadeInUp 0.3s ease-out;
        ">
            <div style="font-weight: 700; font-size: 16px; color: #1f2937; min-width: 140px;">
                📅 ${escapeHtml(item.bulan)}
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, auto); gap: 8px; flex: 1;">
                <span style="background: #d1fae5; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #065f46; text-align: center; white-space: nowrap;">
                    📈 Naik: ${item.total_naik}
                </span>
                <span style="background: #fee2e2; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #991b1b; text-align: center; white-space: nowrap;">
                    📉 Turun: ${item.total_turun}
                </span>
                <span style="background: #fef3c7; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #92400e; text-align: center; white-space: nowrap;">
                    ⚖️ Normal: ${item.total_normal}
                </span>
                <span style="background: #e5e7eb; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #4b5563; text-align: center; white-space: nowrap;">
                    🚫 Tidak: ${item.total_tidak_transaksi}
                </span>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
                <span style="font-size: 12px; color: #6b7280;">
                    Total: ${item.total_data}
                </span>
                <button onclick="deleteRiwayat('${item.id}')" style="
                    background: #fef2f2;
                    border: none;
                    border-radius: 8px;
                    padding: 4px 10px;
                    cursor: pointer;
                    color: #ef4444;
                    font-size: 12px;
                    transition: all 0.2s;
                " onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

// ========== DELETE RIWAYAT ==========
async function deleteRiwayat(id) {
    if (!confirm('Hapus riwayat ini?')) return;
    
    try {
        const { error } = await window.db
            .from('riwayat_transaksi_bulanan')
            .delete()
            .eq('id', id);
        
        if (error) {
            showNotifTop('❌ Gagal hapus: ' + error.message, true);
            return;
        }
        
        showNotifTop('🗑️ Riwayat berhasil dihapus');
        await loadRiwayatTransaksi();
        
    } catch (err) {
        console.error('Error delete riwayat:', err);
        showNotifTop('❌ Error: ' + err.message, true);
    }
}

// ========== OPEN DETAIL TRANSAKSI ==========
function openDetailTransaksi(id) {
    const item = transaksiData.find(t => t.id === id);
    if (!item) {
        showNotifTop('❌ Data tidak ditemukan!', true);
        return;
    }
    
    const periodeLalu = item.periode_bulan_lalu || 'Tidak tersedia';
    const periodeIni = item.periode_bulan_ini || 'Tidak tersedia';
    const tanggalImport = item.created_at ? formatDateDDMMYYYY(item.created_at) : '-';
    
    const jumlah = item.progres_jumlah || 0;
    let displayValue = '';
    let nilaiColor = '#f59e0b';
    let jenisText = '⚖️ Normal';
    
    if (item.progres_jenis === 'tidak_transaksi') {
        displayValue = '0';
        nilaiColor = '#6b7280';
        jenisText = '🚫 Tidak Transaksi';
    } else if (item.progres_jenis === 'naik') {
        displayValue = '+' + jumlah.toLocaleString();
        nilaiColor = '#10b981';
        jenisText = '📈 Naik';
    } else if (item.progres_jenis === 'turun') {
        displayValue = '-' + Math.abs(jumlah).toLocaleString();
        nilaiColor = '#ef4444';
        jenisText = '📉 Turun';
    } else {
        if (jumlah > 0) {
            displayValue = '+' + jumlah.toLocaleString();
            nilaiColor = '#10b981';
        } else if (jumlah < 0) {
            displayValue = '-' + Math.abs(jumlah).toLocaleString();
            nilaiColor = '#ef4444';
        } else {
            displayValue = '0';
            nilaiColor = '#f59e0b';
        }
    }
    
    let jenisColor = '#f59e0b';
    if (item.progres_jenis === 'naik') jenisColor = '#10b981';
    else if (item.progres_jenis === 'turun') jenisColor = '#ef4444';
    else if (item.progres_jenis === 'tidak_transaksi') jenisColor = '#6b7280';
    
    let ownerInfo = '';
    if (currentUserRole === 'owner' && item.user_id !== currentUser.id) {
        ownerInfo = `<div class="info-row"><span class="label">👤 Pemilik Data</span><span class="value">CS Lain</span></div>`;
    }
    
    // ===== STATUS BADGE =====
    let statusText = '📋 Baru';
    let statusClass = 'status-baru';
    if (item.status === 'imported') {
        statusText = '✅ Sudah Dipindah';
        statusClass = 'status-closing';
    } else if (item.status === 'pending_import') {
        statusText = '⏳ Pending';
        statusClass = 'status-pending';
    }
    
    // ===== BUILD BODY HTML =====
    let bodyHTML = `
        <!-- INFO UTAMA -->
        <div class="info-card">
            <div class="card-title">📋 Identitas</div>
            <div class="info-row"><span class="label">🆔 ID Agent</span><span class="value">${escapeHtml(item.agent_id || '-')}</span></div>
            <div class="info-row"><span class="label">👤 Nama</span><span class="value">${escapeHtml(item.nama || '-')}</span></div>
            <div class="info-row"><span class="label">📱 Nomor HP</span><span class="value">${escapeHtml(item.hp || '-')}</span></div>
            <div class="info-row"><span class="label">📱 Aplikasi</span><span class="value">${escapeHtml(item.apk || '-')}</span></div>
            <div class="info-row"><span class="label">👤 Upline</span><span class="value">${escapeHtml(item.upline_name || '-')}</span></div>
            <div class="info-row"><span class="label">📞 HP Upline</span><span class="value">${escapeHtml(item.upline_phone || '-')}</span></div>
            <div class="info-row"><span class="label">📊 Jenis Progres</span><span class="value" style="color: ${jenisColor}; font-weight: 600;">${jenisText}</span></div>
            <div class="info-row" style="border-bottom: none;"><span class="label">📊 Selisih</span><span class="value" style="color: ${nilaiColor}; font-weight: 700; font-size: 20px;">${displayValue}</span></div>
        </div>
        
        <!-- DATA PERBANDINGAN -->
        <div class="info-card">
            <div class="card-title">📊 Data Perbandingan Transaksi</div>
            <div class="comparison-grid">
                <div class="comparison-item">
                    <div class="comparison-label">PERIODE LALU</div>
                    <div class="comparison-value">${(item.transaksi_bulan_lalu || 0).toLocaleString()}</div>
                    <div class="comparison-period">📅 ${periodeLalu}</div>
                </div>
                <div class="comparison-item">
                    <div class="comparison-label">PERIODE INI</div>
                    <div class="comparison-value">${(item.transaksi_bulan_ini || 0).toLocaleString()}</div>
                    <div class="comparison-period">📅 ${periodeIni}</div>
                </div>
            </div>
            <div class="selisih-row">
                Selisih: <strong style="color: ${nilaiColor};">${displayValue}</strong>
            </div>
        </div>
        
        <!-- STATUS & TANGGAL -->
        <div class="info-card" style="margin-bottom: 0;">
            <div class="card-title">📋 Status</div>
            <div class="info-row"><span class="label">📊 Status</span><span class="value"><span class="status-badge ${statusClass}">${statusText}</span></span></div>
            <div class="info-row" style="border-bottom: none;"><span class="label">📅 Tanggal Import</span><span class="value">${tanggalImport}</span></div>
            ${ownerInfo}
        </div>
    `;
    
    // ===== FOOTER BUTTONS =====
    let footerButtons = [
        { label: 'Tutup', class: 'btn-outline', onClick: `closeModalNew('detailModalTransaksi')` }
    ];
    
    if (item.hp) {
        footerButtons.push({ label: '💬 WhatsApp', class: 'btn-success', onClick: `closeModalNew('detailModalTransaksi'); openWA('${item.hp}')` });
    }
    
    if (item.status !== 'imported') {
        footerButtons.push({ label: '📋 Pindah ke CS', class: 'btn-primary', onClick: `closeModalNew('detailModalTransaksi'); moveSingleToFollowupWithModal('${item.id}')` });
    }
    
    footerButtons.push({ label: '🗑️ Hapus', class: 'btn-danger', onClick: `closeModalNew('detailModalTransaksi'); deleteTransaksiItem('${item.id}')` });
    
    const footerHTML = footerButtons.map(btn => 
        `<button class="btn ${btn.class}" onclick="${btn.onClick}">${btn.label}</button>`
    ).join('');
    
    // ===== TAMPILKAN MODAL =====
    createModalNew(
        '📊 Detail Transaksi',
        'Informasi lengkap data transaksi',
        bodyHTML,
        footerHTML,
        'detailModalTransaksi'
    );
}

// ========== CLOSE DETAIL MODAL ==========
function closeDetailModal() {
    const modal = document.getElementById('detailTransaksiModal');
    if (modal) {
        modal.remove();
    }
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
    
    // ===== RESET FLAG =====
    isDetailModalOpen = false;
}

// ========== SETUP TRANSAKSI FILTERS ==========
function setupTransaksiFilters() {
    const searchInput = document.getElementById('searchTransaksiInput');
    const filterJenis = document.getElementById('filterTransaksiJenis');
    const filterStatus = document.getElementById('filterTransaksiStatus');
    const filterUpline = document.getElementById('filterTransaksiUpline'); // <-- PASTIKAN INI
    const resetBtn = document.getElementById('resetTransaksiFilterBtn');
    
    const applyFilters = () => renderTransaksiList();
    
    if (searchInput) {
        searchInput.removeEventListener('input', applyFilters);
        searchInput.addEventListener('input', applyFilters);
    }
    if (filterJenis) {
        filterJenis.removeEventListener('change', applyFilters);
        filterJenis.addEventListener('change', applyFilters);
    }
    if (filterStatus) {
        filterStatus.removeEventListener('change', applyFilters);
        filterStatus.addEventListener('change', applyFilters);
    }
    if (filterUpline) {
        filterUpline.removeEventListener('input', applyFilters); // <-- INPUT, BUKAN CHANGE
        filterUpline.addEventListener('input', applyFilters);
    }
    
    if (resetBtn) {
        resetBtn.removeEventListener('click', resetFilters);
        resetBtn.addEventListener('click', resetFilters);
    }
}

function resetFilters() {
    const searchInput = document.getElementById('searchTransaksiInput');
    const filterJenis = document.getElementById('filterTransaksiJenis');
    const filterStatus = document.getElementById('filterTransaksiStatus');
    const filterUpline = document.getElementById('filterTransaksiUpline');
    
    if (searchInput) searchInput.value = '';
    if (filterJenis) filterJenis.value = '';
    if (filterStatus) filterStatus.value = '';
    if (filterUpline) filterUpline.value = '';
    
    renderTransaksiList();
}
    
// ========== UPDATE SELECT ALL TRANSAKSI ==========
function updateSelectAllTransaksiButton() {
    const btn = document.getElementById('selectAllTransaksi');
    if (!btn) return;
    
    // Hanya untuk owner
    if (currentUserRole !== 'owner') {
        btn.style.display = 'none';
        return;
    }
    btn.style.display = 'inline-block';
    
    const checkboxes = document.querySelectorAll('#dbTransaksiList .transaksi-checkbox');
    if (checkboxes.length === 0) {
        btn.textContent = '✅ Pilih Semua';
        return;
    }
    
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    btn.textContent = allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua';
}

// ========== SELECT ALL TRANSAKSI ==========
function toggleSelectAllTransaksi() {
    if (DEBUG) console.log('🔄 toggleSelectAllTransaksi dipanggil!'); // Debug
    
    if (currentUserRole !== 'owner') {
        showNotifTop('⚠️ Hanya Owner yang dapat menggunakan fitur ini!', true);
        return;
    }
    
    const checkboxes = document.querySelectorAll('#dbTransaksiList .transaksi-checkbox');
    if (DEBUG) console.log('📋 Jumlah checkbox:', checkboxes.length); // Debug
    
    if (checkboxes.length === 0) {
        showNotifTop('⚠️ Tidak ada data untuk dipilih', true);
        return;
    }
    
    // Cek apakah semua checkbox sudah tercentang
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
        const id = cb.dataset.id;
        if (id) {
            if (!allChecked) {
                selectedTransaksiIds.set(id, true);
            } else {
                selectedTransaksiIds.delete(id);
            }
        }
    });
    
    // ===== UPDATE UI =====
    updateSelectAllTransaksiButton();
    updateTransaksiSelectionCount();
    
    // ===== UPDATE TOMBOL =====
    const btn = document.getElementById('selectAllTransaksi');
    if (btn) {
        btn.textContent = !allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua';
    }
}

// ========== MOVE SELECTED TO FOLLOWUP (DENGAN DIALOG CS) ==========
let isMovingSelected = false;

async function moveSelectedToFollowup() {
    if (isMovingSelected) {
        showNotifTop('⏳ Proses pemindahan sedang berjalan...', true);
        return;
    }
    
    if (currentUserRole !== 'owner') {
        showNotifTop('⚠️ Hanya Owner yang dapat memindahkan massal!', true);
        return;
    }
    
    const selectedIds = Array.from(selectedTransaksiIds.keys());
    if (selectedIds.length === 0) {
        showNotifTop('⚠️ Tidak ada data yang dipilih!', true);
        return;
    }
    
    // Simpan ID yang dipilih ke variabel global (digunakan oleh modal)
    selectedTransaksiIdsForMove = selectedIds;
    
    // Load daftar CS
    const csList = await loadCsList();
    if (csList.length === 0) {
        showNotifTop('⚠️ Tidak ada CS Agent selain Anda! Tambahkan CS terlebih dahulu.', true);
        return;
    }
    
    // Render checkbox CS di modal
    renderCsCheckboxList(csList);
    
    // Update preview data
    updatePreviewDataTransaksi();
    
    // Tampilkan modal pilih CS
    showModal('pilihCsTransaksiModal');
}

// ========== DELETE SELECTED TRANSAKSI (BATCH + REALTIME) ==========
let isDeletingSelectedTransaksi = false;

async function deleteSelectedTransaksi() {
    // Cegah multiple click
    if (isDeletingSelectedTransaksi) {
        showNotifTop('⏳ Proses hapus sedang berjalan...', true);
        return;
    }
    
    if (currentUserRole !== 'owner') {
        showNotifTop('⚠️ Hanya Owner yang dapat menghapus massal!', true);
        return;
    }
    
    // Ambil ID yang dipilih dari state
    const selectedIds = Array.from(selectedTransaksiIds.keys());
    if (selectedIds.length === 0) {
        showNotifTop('⚠️ Tidak ada data yang dipilih', true);
        return;
    }
    
    // ===== HANYA 1 KONFIRMASI =====
    if (!confirm(`⚠️ Hapus ${selectedIds.length} data transaksi yang dipilih?\n\nData akan dihapus permanen!`)) {
        return;
    }
    
    isDeletingSelectedTransaksi = true;
    const progress = showFloatingProgress('🗑️ Menghapus Transaksi', selectedIds.length);
    let deleted = 0;
    let failed = 0;
    
    try {
        const totalData = selectedIds.length;
        
        // ===== BATCH DELETE: Hapus 100 data sekaligus =====
        const BATCH_SIZE = 100;
        const batches = [];
        
        for (let i = 0; i < selectedIds.length; i += BATCH_SIZE) {
            batches.push(selectedIds.slice(i, i + BATCH_SIZE));
        }
        
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            
            try {
                // ===== HAPUS BATCH SEKALIGUS dengan IN query =====
                const { error } = await window.db
                    .from('db_transaksi')
                    .delete()
                    .in('id', batch);
                
                if (error) {
                    console.error('Batch delete error:', error);
                    failed += batch.length;
                    continue;
                }
                
                // ===== HAPUS DARI DATA LOKAL =====
                batch.forEach(id => {
                    const index = transaksiData.findIndex(t => t.id === id);
                    if (index !== -1) {
                        transaksiData.splice(index, 1);
                    }
                    selectedTransaksiIds.delete(id);
                });
                
                deleted += batch.length;
                
                // Update progress
                const percent = Math.min(Math.floor((deleted / totalData) * 100), 100);
                progress.update(percent, '🗑️ Menghapus', `Menghapus data... (${deleted}/${totalData})`, deleted, totalData);
                
                // ===== UPDATE UI SETIAP BATCH (REALTIME) =====
                renderTransaksiList();
                updateTransaksiStats(transaksiData);
                updateSelectAllTransaksiButton();
                updateTransaksiSelectionCount();
                
                // Delay kecil antar batch
                if (batchIndex < batches.length - 1) {
                    await delay(100);
                }
                
            } catch (batchError) {
                console.error('Batch error:', batchError);
                failed += batch.length;
            }
        }
        
        progress.update(100, '✅ Selesai', `Berhasil: ${deleted}, Gagal: ${failed}`, deleted, totalData);
        showNotifTop(`✅ ${deleted} data berhasil dihapus${failed > 0 ? `, ${failed} gagal` : ''}`);
        
    } catch (err) {
        console.error('Error delete selected:', err);
        showNotifTop('❌ Gagal: ' + err.message, true);
    } finally {
        isDeletingSelectedTransaksi = false;
        setTimeout(() => progress.hide(), 2000);
    }
}

// ========== DELETE ALL TRANSAKSI (REALTIME) ==========
let isDeletingAllTransaksi = false;

async function deleteAllTransaksi() {
    if (isDeletingAllTransaksi) {
        showNotifTop('⏳ Proses hapus sedang berjalan...', true);
        return;
    }
    
    if (currentUserRole !== 'owner') {
        showNotifTop('⚠️ Hanya Owner yang dapat menghapus semua data!', true);
        return;
    }
    
    if (!confirm('⚠️ PERINGATAN! Anda akan menghapus SEMUA data Transaksi. Tidak bisa dibatalkan!\n\nYakin ingin melanjutkan?')) {
        return;
    }
    
    isDeletingAllTransaksi = true;
    
    // Ambil semua ID yang akan dihapus
    const idsToDelete = transaksiData.map(t => t.id);
    const totalData = idsToDelete.length;
    
    if (totalData === 0) {
        showNotifTop('📭 Tidak ada data untuk dihapus', true);
        isDeletingAllTransaksi = false;
        return;
    }
    
    const progress = showFloatingProgress('🗑️ Menghapus Semua Transaksi', totalData);
    let deleted = 0;
    let failed = 0;
    
    try {
        for (const id of idsToDelete) {
            try {
                // Hapus dari database
                const { error } = await window.db.from('db_transaksi').delete().eq('id', id);
                if (error) {
                    console.error(`Gagal hapus ${id}:`, error);
                    failed++;
                    continue;
                }
                
                // ===== PERBAIKAN: Hapus dari data lokal =====
                const index = transaksiData.findIndex(t => t.id === id);
                if (index !== -1) {
                    transaksiData.splice(index, 1);
                }
                
                selectedTransaksiIds.delete(id);
                deleted++;
                
                // ===== UPDATE UI REALTIME =====
                const percent = Math.floor((deleted / totalData) * 100);
                progress.update(percent, '🗑️ Menghapus', `Menghapus data... (${deleted}/${totalData})`, deleted, totalData);
                
                if (deleted % 10 === 0 || deleted === totalData) {
                    renderTransaksiList();
                    updateTransaksiStats(transaksiData);
                }
                
                await delay(30);
                
            } catch (e) {
                console.error(`Gagal hapus ${id}:`, e);
                failed++;
            }
        }
        
        // ===== FINAL REFRESH =====
        renderTransaksiList();
        updateTransaksiStats(transaksiData);
        updateSelectAllTransaksiButton();
        updateTransaksiSelectionCount();
        
        progress.update(100, '✅ Selesai', `Berhasil: ${deleted}, Gagal: ${failed}`, deleted, totalData);
        showNotifTop(`✅ ${deleted} data Transaksi berhasil dihapus${failed > 0 ? `, ${failed} gagal` : ''}`);
        
    } catch (err) {
        console.error('Error delete all:', err);
        showNotifTop('❌ Gagal: ' + err.message, true);
    } finally {
        isDeletingAllTransaksi = false;
        setTimeout(() => progress.hide(), 2000);
    }
}

// ========== DELETE TRANSAKSI ITEM (SINGLE) ==========
let isDeletingTransaksi = false;

async function deleteTransaksiItem(id) {
    // Cegah multiple click
    if (isDeletingTransaksi) {
        showNotifTop('⏳ Proses hapus sedang berjalan...', true);
        return;
    }
    
    const item = transaksiData.find(t => t.id === id);
    if (!item) {
        showNotifTop('❌ Data tidak ditemukan!', true);
        return;
    }
    
    // Hanya 1 KONFIRMASI
    if (!confirm(`⚠️ Hapus data transaksi "${escapeHtml(item.nama || item.agent_id)}"?\n\nData akan dihapus permanen!`)) {
        return;
    }
    
    isDeletingTransaksi = true;
    
    try {
        // Hapus dari database
        const { error } = await window.db.from('db_transaksi').delete().eq('id', id);
        if (error) {
            showNotifTop('❌ Gagal hapus: ' + error.message, true);
            isDeletingTransaksi = false;
            return;
        }
        
        // ===== HAPUS DARI DATA LOKAL =====
        const index = transaksiData.findIndex(t => t.id === id);
        if (index !== -1) {
            transaksiData.splice(index, 1);
        }
        
        selectedTransaksiIds.delete(id);
        
        // ===== UPDATE UI LANGSUNG (REALTIME) =====
        renderTransaksiList();
        updateTransaksiStats(transaksiData);
        updateSelectAllTransaksiButton();
        updateTransaksiSelectionCount();
        
        showNotifTop('🗑️ Data transaksi berhasil dihapus');
        
    } catch (err) {
        console.error('Error delete transaksi:', err);
        showNotifTop('❌ Gagal: ' + err.message, true);
    } finally {
        isDeletingTransaksi = false;
    }
}

// ========== MOVE SINGLE TO FOLLOWUP ==========
let isMovingSingle = false;

async function moveSingleToFollowup(id) {
    // Cegah multiple click
    if (isMovingSingle) {
        showNotifTop('⏳ Proses pemindahan sedang berjalan...', true);
        return;
    }
    
    const item = transaksiData.find(t => t.id === id);
    if (!item) {
        showNotifTop('❌ Data tidak ditemukan!', true);
        return;
    }
    
    // ===== CEK DUPLIKAT =====
    const { data: existing } = await window.db
        .from('customers')
        .select('id')
        .eq('agent_id', item.agent_id)
        .maybeSingle();
    
    if (existing) {
        showNotifTop(`⚠️ ID Agent "${item.agent_id}" sudah terdaftar di Followup Agen!`, true);
        return;
    }
    
    // ===== KONFIRMASI HANYA 1 KALI =====
    const isConfirmed = confirm(`📋 Pindahkan data "${escapeHtml(item.nama || item.agent_id)}" ke Followup Agen?`);
    
    // ===== JIKA BATAL, LANGSUNG KELUAR =====
    if (!isConfirmed) {
        if (DEBUG) console.log('❌ Pemindahan dibatalkan oleh user');
        showNotifTop('❌ Pemindahan dibatalkan', true);
        return;
    }
    
    // ===== PROSES PINDAH =====
    isMovingSingle = true;
    
    try {
        // Insert ke customers
        const { error: insertError } = await window.db.from('customers').insert({
            agent_id: item.agent_id,
            nama: item.nama || `Agent ${item.agent_id}`,
            hp: item.hp || '',
            apk: item.apk || '',
            upline_name: item.upline_name || '',
            upline_phone: item.upline_phone || '',
            tanggal: getTodayDate(),
            status: 'baru',
            user_id: currentUser.id,
            created_at: new Date().toISOString()
        });
        
        if (insertError) {
            showNotifTop('❌ Gagal pindah: ' + insertError.message, true);
            isMovingSingle = false;
            return;
        }
        
        // Update status di db_transaksi
        await window.db.from('db_transaksi').update({ 
            status: 'imported', 
            updated_at: new Date().toISOString() 
        }).eq('id', id);
        
        // Hapus dari selected
        selectedTransaksiIds.delete(id);
        
        showNotifTop('✅ Data berhasil dipindahkan ke Followup Agen!');
        await loadDbTransaksi();
        await loadCustomers();
        
    } catch (err) {
        console.error('Error move to followup:', err);
        showNotifTop('❌ Gagal: ' + err.message, true);
    } finally {
        isMovingSingle = false;
    }
}

// ========== MOVE SINGLE TO FOLLOWUP WITH CS SELECTION ==========
let isMovingSingleWithModal = false;

async function moveSingleToFollowupWithModal(id) {
    if (DEBUG) console.log('🔍 moveSingleToFollowupWithModal dipanggil dengan id:', id); // <-- TAMBAHKAN
    
    // Cegah multiple click
    if (isMovingSingleWithModal) {
        showNotifTop('⏳ Proses pemindahan sedang berjalan...', true);
        return;
    }
    
    const item = transaksiData.find(t => t.id === id);
    if (!item) {
        showNotifTop('❌ Data tidak ditemukan!', true);
        return;
    }
    
    // ===== CEK DUPLIKAT =====
    const { data: existing } = await window.db
        .from('customers')
        .select('id')
        .eq('agent_id', item.agent_id)
        .maybeSingle();
    
    if (existing) {
        showNotifTop(`⚠️ ID Agent "${item.agent_id}" sudah terdaftar di Followup Agen!`, true);
        return;
    }
    
    // ===== LOAD CS LIST =====
    const csList = await loadCsList();
    if (DEBUG) console.log('📋 Daftar CS:', csList); // <-- TAMBAHKAN
    
    if (csList.length === 0) {
        showNotifTop('⚠️ Tidak ada CS Agent selain Anda! Tambahkan CS terlebih dahulu.', true);
        return;
    }
    
    // ===== TAMPILKAN MODAL PILIH CS =====
    const modalHtml = `
        <div class="modal-content" style="max-width: 480px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column; background: #fff; border-radius: 24px;">
            <div style="padding: 20px 24px 0; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0;">
                <div>
                    <h3 style="font-size: 20px; margin: 0; color: #1f2937;">📋 Pilih CS Tujuan</h3>
                    <div class="modal-subtitle" style="font-size: 13px; color: #6b7280; padding: 4px 0 12px 0;">
                        Pindahkan data ke CS Agent
                    </div>
                </div>
                <button onclick="closeModal('pilihCsSingleModal')" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #6b7280; padding: 0 4px; line-height: 1;">✕</button>
            </div>
            
            <div style="padding: 16px 24px; flex: 1; overflow-y: auto;">
                <div style="background: #eef2ff; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; border-left: 4px solid #4f46e5;">
                    <p style="font-size: 13px; color: #4f46e5; margin: 0;">
                        📌 <strong>Data yang akan dipindah:</strong><br>
                        👤 ${escapeHtml(item.nama || item.agent_id)}<br>
                        🆔 ${escapeHtml(item.agent_id)}<br>
                        📱 ${escapeHtml(item.hp || '-')}
                    </p>
                </div>
                
                <div class="form-group" style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">👥 Pilih CS Tujuan <span class="required">*</span></label>
                    <div id="csSingleSelect" style="max-height: 200px; overflow-y: auto; border: 1.5px solid #e5e7eb; border-radius: 14px; padding: 8px; background: #fff;">
                        ${csList.map(cs => `
                            <label style="
                                display: flex;
                                align-items: center;
                                gap: 10px;
                                padding: 8px 12px;
                                border-radius: 10px;
                                cursor: pointer;
                                transition: all 0.2s;
                                border: 1px solid transparent;
                                margin-bottom: 4px;
                            " onmouseenter="this.style.background='#f3f4f6'" onmouseleave="this.style.background='transparent'">
                                <input type="radio" name="csSingleTarget" value="${cs.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: #4f46e5;">
                                <div>
                                    <div style="font-weight: 500; font-size: 13px; color: #1f2937;">${escapeHtml(cs.nama || cs.email)}</div>
                                    <div style="font-size: 11px; color: #6b7280;">📧 ${escapeHtml(cs.email)}</div>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="modal-buttons" style="display: flex; gap: 12px; padding: 16px 24px 24px; border-top: 1px solid #e5e7eb;">
                <button id="confirmSingleMoveBtn" class="btn-primary" style="flex: 1; padding: 12px; border: none; border-radius: 14px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #4f46e5, #6366f1); color: white;">✅ Pindahkan</button>
                <button id="cancelSingleMoveBtn" class="btn-outline" style="flex: 1; padding: 12px; border: none; border-radius: 14px; font-weight: 600; cursor: pointer; background: #f3f4f6; color: #374151;">❌ Batal</button>
            </div>
        </div>
    `;
    
    // Buat modal
    const modal = document.createElement('div');
    modal.id = 'pilihCsSingleModal';
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0, 0, 0, 0.7) !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        z-index: 999999999 !important;
        backdrop-filter: blur(5px) !important;
        pointer-events: auto !important;
    `;
    modal.innerHTML = modalHtml;
    
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    
    applyDarkModeToModal(modal);
    
    // ===== EVENT LISTENER =====
    document.getElementById('confirmSingleMoveBtn').onclick = async function() {
        const selectedCs = document.querySelector('input[name="csSingleTarget"]:checked');
        if (!selectedCs) {
            showNotifTop('⚠️ Pilih CS tujuan terlebih dahulu!', true);
            return;
        }
        
        const targetUserId = selectedCs.value;
        
        // Disable button
        this.disabled = true;
        this.textContent = '⏳ Memproses...';
        this.style.opacity = '0.6';
        
        isMovingSingleWithModal = true;
        
        try {
            // ===== PINDAHKAN DATA =====
            await moveSingleTransaksiToFollowup(id, targetUserId);
            
            // ===== HAPUS DARI SELECTED =====
            selectedTransaksiIds.delete(id);
            
            // ===== TUTUP MODAL =====
            modal.remove();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            
            showNotifTop('✅ Data berhasil dipindahkan ke Followup Agen!');
            
            // ===== RELOAD DATA =====
            await loadDbTransaksi();
            await loadCustomers();
            
        } catch (err) {
            console.error('Error move to followup:', err);
            showNotifTop('❌ Gagal: ' + err.message, true);
        } finally {
            isMovingSingleWithModal = false;
            this.disabled = false;
            this.textContent = '✅ Pindahkan';
            this.style.opacity = '1';
        }
    };
    
    document.getElementById('cancelSingleMoveBtn').onclick = function() {
        modal.remove();
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    };
    
    // Klik di luar modal
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.remove();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
        }
    };
}

// ========== DATABASE ARCHIVE RENDER FUNCTIONS ==========
function renderDBClosing(items) {
    const container = document.getElementById('dbClosingList');
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;color:#9ca3af;">📭 Belum ada data closing</p>';
        return;
    }
    
    container.innerHTML = items.map(item => {
        const isChecked = selectedClosingIds.get(item.id) === true;
        let followupText = '';
        if (item.followup_data && item.followup_data.pesan) {
            followupText = `<small>📝 ${escapeHtml(item.followup_data.pesan.substring(0, 50))}${item.followup_data.pesan.length > 50 ? '...' : ''}</small>`;
        }
        // ===== PERBAIKAN: Format tanggal DD-MM-YYYY =====
        const dateStr = item.closing_date ? formatDateDDMMYYYY(item.closing_date) : '-';
        return `
            <div class="db-item" data-id="${item.id}" data-type="closing" style="cursor: pointer;">
                <input type="checkbox" class="db-item-checkbox" data-id="${item.id}" ${isChecked ? 'checked' : ''}>
                <div class="db-item-info">
                    <h4>${escapeHtml(item.nama)}</h4>
                    <p>📱 ${escapeHtml(item.hp)}</p>
                    <small>Closing: ${dateStr}</small>
                    ${item.closing_note ? `<small>Catatan: ${escapeHtml(item.closing_note)}</small>` : ''}
                    ${followupText ? `<small>💬 ${followupText}</small>` : ''}
                </div>
                <div class="db-item-actions">
                    <button class="db-item-wa" onclick="event.stopPropagation(); openWA('${item.hp}')">💬 WA</button>
                    <button class="db-item-delete" onclick="event.stopPropagation(); deleteDBItem('db_closing', '${item.id}')">🗑️ Hapus</button>
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('#dbClosingList .db-item').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox' && 
                !e.target.classList.contains('db-item-wa') && 
                !e.target.classList.contains('db-item-delete')) {
                openDBDetailModal(el.dataset.id, 'closing');
            }
        });
    });
    
    document.querySelectorAll('#dbClosingList .db-item-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const id = cb.dataset.id;
            if (e.target.checked) selectedClosingIds.set(id, true);
            else selectedClosingIds.delete(id);
            updateSelectAllButton('selectAllClosing', '#dbClosingList', selectedClosingIds);
        });
    });
    
    updateSelectAllButton('selectAllClosing', '#dbClosingList', selectedClosingIds);
}

function renderDBTidak(items) {
    const container = document.getElementById('dbTidakList');
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;color:#9ca3af;">📭 Belum ada data tidak tertarik</p>';
        return;
    }
    
    container.innerHTML = items.map(item => {
        const isChecked = selectedTidakIds.get(item.id) === true;
        
        let negosiasiPreview = '';
        if (item.negosiasi_data) {
            const nd = item.negosiasi_data;
            const fields = [];
            if (nd.aplikasi) fields.push(`📱 ${nd.aplikasi}`);
            if (nd.domisili) fields.push(`📍 ${nd.domisili}`);
            if (nd.transaksi) fields.push(`💰 ${nd.transaksi}`);
            if (nd.penawaran) fields.push(`🏷️ ${nd.penawaran}`);
            negosiasiPreview = fields.length > 0 ? 
                `<small>📋 ${fields.join(' | ')}</small>` : '';
        }
        
        let dihubungiPreview = '';
        if (item.dihubungi_data && item.dihubungi_data.pesan) {
            const pesan = item.dihubungi_data.pesan.substring(0, 30);
            dihubungiPreview = `<small>💬 Pesan: ${escapeHtml(pesan)}${item.dihubungi_data.pesan.length > 30 ? '...' : ''}</small>`;
        } else if (item.pesan_terkirim) {
            const pesan = item.pesan_terkirim.substring(0, 30);
            dihubungiPreview = `<small>💬 Pesan: ${escapeHtml(pesan)}${item.pesan_terkirim.length > 30 ? '...' : ''}</small>`;
        }
        
        // ===== PERBAIKAN: Format tanggal DD-MM-YYYY =====
        const dateStr = item.tanggal ? formatDateDDMMYYYY(item.tanggal) : '-';
        
        return `
            <div class="db-item" data-id="${item.id}" data-type="tidak" style="cursor: pointer;">
                <input type="checkbox" class="db-item-checkbox" data-id="${item.id}" ${isChecked ? 'checked' : ''}>
                <div class="db-item-info">
                    <h4>${escapeHtml(item.nama)}</h4>
                    <p>📱 ${escapeHtml(item.hp)}</p>
                    <small>❌ Alasan: ${escapeHtml(item.alasan || '-')}</small>
                    <small>📅 ${dateStr}</small>
                    ${item.status_sebelumnya ? `<small>📌 Status sebelumnya: ${escapeHtml(item.status_sebelumnya)}</small>` : ''}
                    ${negosiasiPreview}
                    ${dihubungiPreview}
                    ${item.upline_name ? `<small>👤 Upline: ${escapeHtml(item.upline_name)}</small>` : ''}
                </div>
                <div class="db-item-actions">
                    <button class="db-item-wa" onclick="event.stopPropagation(); openWA('${item.hp}')">💬 WA</button>
                    <button class="db-item-delete" onclick="event.stopPropagation(); deleteDBItem('db_tidak_tertarik', '${item.id}')">🗑️ Hapus</button>
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('#dbTidakList .db-item').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox' && 
                !e.target.classList.contains('db-item-wa') && 
                !e.target.classList.contains('db-item-delete')) {
                openDBDetailModal(el.dataset.id, 'tidak');
            }
        });
    });
    
    document.querySelectorAll('#dbTidakList .db-item-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const id = cb.dataset.id;
            if (e.target.checked) selectedTidakIds.set(id, true);
            else selectedTidakIds.delete(id);
            updateSelectAllButton('selectAllTidak', '#dbTidakList', selectedTidakIds);
        });
    });
    
    updateSelectAllButton('selectAllTidak', '#dbTidakList', selectedTidakIds);
}

function renderDBNomorSalah(items) {
    const container = document.getElementById('dbNomorSalahList');
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;color:#9ca3af;">📭 Belum ada data nomor salah</p>';
        return;
    }
    
    container.innerHTML = items.map(item => {
        const isChecked = selectedNomorSalahIds.get(item.id) === true;
        // ===== PERBAIKAN: Format tanggal DD-MM-YYYY =====
        const dateStr = item.deleted_at ? formatDateDDMMYYYY(item.deleted_at) : '-';
        return `
            <div class="db-item" data-id="${item.id}" data-type="nomor_salah" style="cursor: pointer;">
                <input type="checkbox" class="db-item-checkbox" data-id="${item.id}" ${isChecked ? 'checked' : ''}>
                <div class="db-item-info">
                    <h4>${escapeHtml(item.nama)}</h4>
                    <p>📱 ${escapeHtml(item.hp)}</p>
                    <small>Alasan: ${escapeHtml(item.alasan || '-')}</small>
                    <small>📅 ${dateStr}</small>
                    ${item.followup_data ? `<small>💬 Pesan: ${escapeHtml(item.followup_data.pesan?.substring(0, 30) || '-')}${item.followup_data.pesan?.length > 30 ? '...' : ''}</small>` : ''}
                    ${item.dihubungi_data ? `<small>💬 Pesan: ${escapeHtml(item.dihubungi_data.pesan?.substring(0, 30) || '-')}${item.dihubungi_data.pesan?.length > 30 ? '...' : ''}</small>` : ''}
                </div>
                <div class="db-item-actions">
                    <button class="db-item-wa" onclick="event.stopPropagation(); openWA('${item.hp}')">💬 WA</button>
                    <button class="db-item-restore-followup" onclick="event.stopPropagation(); restoreToFollowup('${item.id}')">🔄 Kembali ke Followup</button>
                    <button class="db-item-restore-prospek" onclick="event.stopPropagation(); restoreToProspek('${item.id}')">🔄 Kembali ke Prospek</button>
                    <button class="db-item-delete" onclick="event.stopPropagation(); deleteDBItem('nomor_salah', '${item.id}')">🗑️ Hapus</button>
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('#dbNomorSalahList .db-item').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox' && 
                !e.target.classList.contains('db-item-wa') && 
                !e.target.classList.contains('db-item-restore-followup') &&
                !e.target.classList.contains('db-item-restore-prospek') &&
                !e.target.classList.contains('db-item-delete')) {
                openDBDetailModal(el.dataset.id, 'nomor_salah');
            }
        });
    });
    
    document.querySelectorAll('#dbNomorSalahList .db-item-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const id = cb.dataset.id;
            if (e.target.checked) selectedNomorSalahIds.set(id, true);
            else selectedNomorSalahIds.delete(id);
            updateSelectAllButton('selectAllNomorSalah', '#dbNomorSalahList', selectedNomorSalahIds);
        });
    });
    
    updateSelectAllButton('selectAllNomorSalah', '#dbNomorSalahList', selectedNomorSalahIds);
}

// ========== RESTORE NOMOR SALAH KE FOLLOWUP ==========
async function restoreToFollowup(id) {
    // Ambil data dari nomor_salah
    const { data: item, error: getError } = await window.db
        .from('nomor_salah')
        .select('*')
        .eq('id', id)
        .single();
    
    if (getError || !item) {
        showNotifTop('❌ Gagal mengambil data: ' + (getError?.message || 'Data tidak ditemukan'), true);
        return;
    }
    
    // Cek apakah sudah ada di customers
    const { data: existing } = await window.db
        .from('customers')
        .select('id')
        .eq('hp', item.hp)
        .maybeSingle();
    
    if (existing) {
        showNotifTop(`⚠️ Nomor "${item.hp}" sudah terdaftar di Followup Agen!`, true);
        return;
    }
    
    if (!confirm(`Kembalikan data "${escapeHtml(item.nama)}" ke Followup Agen?`)) return;
    
    try {
        // Siapkan data followup
        let followupData = null;
        let dihubungiData = null;
        
        if (item.followup_data) {
            followupData = {
                terkirim: item.followup_data.terkirim || false,
                dibalas: item.followup_data.dibalas || false,
                pesan: item.followup_data.pesan || null,
                balasan: item.followup_data.balasan || null,
                timestamp: item.followup_data.timestamp || new Date().toISOString()
            };
        }
        
        if (item.dihubungi_data) {
            dihubungiData = {
                terkirim: item.dihubungi_data.terkirim || false,
                dibalas: item.dihubungi_data.dibalas || false,
                pesan: item.dihubungi_data.pesan || null,
                balasan: item.dihubungi_data.balasan || null,
                timestamp: item.dihubungi_data.timestamp || new Date().toISOString()
            };
        }
        
        // ===== PERBAIKAN: Hapus restored_from =====
        // Insert ke customers
        const { error: insertError } = await window.db.from('customers').insert({
            agent_id: item.agent_id || `NOMOR_${Date.now()}`,
            nama: item.nama,
            hp: item.hp,
            apk: item.apk || null,
            upline_name: item.upline_name || null,
            upline_phone: item.upline_phone || null,
            tanggal: getTodayDate(),
            status: 'baru',
            user_id: item.user_id || currentUser.id,
            followup_data: followupData,
            pesan_terkirim: item.followup_data?.pesan || item.dihubungi_data?.pesan || null,
            balasan_diterima: item.followup_data?.balasan || item.dihubungi_data?.balasan || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
            // restored_from: 'nomor_salah'  // <-- HAPUS BARIS INI
        });
        
        if (insertError) {
            showNotifTop('❌ Gagal memindahkan: ' + insertError.message, true);
            return;
        }
        
        // Hapus dari nomor_salah
        await window.db.from('nomor_salah').delete().eq('id', id);
        
        // Hapus dari selected jika ada
        selectedNomorSalahIds.delete(id);
        
        showNotifTop(`✅ "${escapeHtml(item.nama)}" berhasil dikembalikan ke Followup Agen!`);
        
        // Reload data
        await loadCustomers();
        await loadDBNomorSalah();
        renderFullFollowupKanban();
        updateStats();
        updateChartCustomer();
        updateDeadlineBadge();
        
    } catch (err) {
        console.error('Error restore to followup:', err);
        showNotifTop('❌ Gagal: ' + err.message, true);
    }
}

// ========== RESTORE NOMOR SALAH KE PROSPEK ==========
async function restoreToProspek(id) {
    // Ambil data dari nomor_salah
    const { data: item, error: getError } = await window.db
        .from('nomor_salah')
        .select('*')
        .eq('id', id)
        .single();
    
    if (getError || !item) {
        showNotifTop('❌ Gagal mengambil data: ' + (getError?.message || 'Data tidak ditemukan'), true);
        return;
    }
    
    // Cek apakah sudah ada di prospek
    const { data: existing } = await window.db
        .from('prospek')
        .select('id')
        .eq('hp', item.hp)
        .maybeSingle();
    
    if (existing) {
        showNotifTop(`⚠️ Nomor "${item.hp}" sudah terdaftar di Prospek Agen!`, true);
        return;
    }
    
    if (!confirm(`Kembalikan data "${escapeHtml(item.nama)}" ke Prospek Agen?`)) return;
    
    try {
        // Siapkan data dihubungi jika ada
        let dihubungiData = null;
        let negosiasiData = null;
        
        if (item.dihubungi_data) {
            dihubungiData = {
                terkirim: item.dihubungi_data.terkirim || false,
                dibalas: item.dihubungi_data.dibalas || false,
                pesan: item.dihubungi_data.pesan || null,
                balasan: item.dihubungi_data.balasan || null,
                timestamp: item.dihubungi_data.timestamp || new Date().toISOString()
            };
        }
        
        if (item.negosiasi_data) {
            negosiasiData = item.negosiasi_data;
        }
        
        // ===== PERBAIKAN: Hapus restored_from =====
        // Insert ke prospek
        const { error: insertError } = await window.db.from('prospek').insert({
            nama: item.nama,
            hp: item.hp,
            deadline: getTodayDate(),
            status: 'Baru',
            user_id: item.user_id || currentUser.id,
            dihubungi_data: dihubungiData,
            negosiasi_data: negosiasiData,
            pesan_terkirim: item.dihubungi_data?.pesan || null,
            balasan_diterima: item.dihubungi_data?.balasan || null,
            upline_name: item.upline_name || null,
            upline_phone: item.upline_phone || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
            // restored_from: 'nomor_salah'  // <-- HAPUS BARIS INI
        });
        
        if (insertError) {
            showNotifTop('❌ Gagal memindahkan: ' + insertError.message, true);
            return;
        }
        
        // Hapus dari nomor_salah
        await window.db.from('nomor_salah').delete().eq('id', id);
        
        // Hapus dari selected jika ada
        selectedNomorSalahIds.delete(id);
        
        showNotifTop(`✅ "${escapeHtml(item.nama)}" berhasil dikembalikan ke Prospek Agen!`);
        
        // Reload data
        await loadProspek();
        await loadDBNomorSalah();
        renderFullProspekKanban();
        updateChartProspek();
        updateDeadlineBadge();
        
    } catch (err) {
        console.error('Error restore to prospek:', err);
        showNotifTop('❌ Gagal: ' + err.message, true);
    }
}

function renderDBCommitment(items) {
    const container = document.getElementById('dbCommitmentList');
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;color:#9ca3af;">📭 Belum ada data commitment</p>';
        return;
    }
    
    container.innerHTML = items.map(item => {
        const isChecked = selectedCommitmentIds.get(item.id) === true;
        let dihubungiText = '';
        if (item.dihubungi_data && item.dihubungi_data.pesan) {
            dihubungiText = `<small>📝 ${escapeHtml(item.dihubungi_data.pesan.substring(0, 50))}${item.dihubungi_data.pesan.length > 50 ? '...' : ''}</small>`;
        }
        let penawaranText = '';
        if (item.penawaran) {
            penawaranText = `<small>🏷️ ${escapeHtml(item.penawaran)}</small>`;
        } else if (item.negosiasi_data?.penawaran) {
            penawaranText = `<small>🏷️ ${escapeHtml(item.negosiasi_data.penawaran)}</small>`;
        }
        // ===== PERBAIKAN: Format tanggal DD-MM-YYYY =====
        const dateStr = item.committed_at ? formatDateDDMMYYYY(item.committed_at) : '-';
        
        return `
            <div class="db-item" data-id="${item.id}" data-type="commitment" style="cursor: pointer;">
                <input type="checkbox" class="db-item-checkbox" data-id="${item.id}" ${isChecked ? 'checked' : ''}>
                <div class="db-item-info">
                    <h4>${escapeHtml(item.nama)}</h4>
                    <p>📱 ${escapeHtml(item.hp)}</p>
                    <small>Agent: ${escapeHtml(item.agent_id || '-')} | Aplikasi: ${escapeHtml(item.aplikasi || '-')}</small>
                    <small>Upline: ${escapeHtml(item.upline_name || '-')}</small>
                    <small>Komitmen: ${dateStr}</small>
                    ${penawaranText}
                    ${dihubungiText}
                </div>
                <div class="db-item-actions">
                    <button class="db-item-wa" onclick="event.stopPropagation(); openWA('${item.hp}')">💬 WA</button>
                    <button class="db-item-delete" onclick="event.stopPropagation(); deleteDBItem('db_commitment', '${item.id}')">🗑️ Hapus</button>
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('#dbCommitmentList .db-item').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox' && 
                !e.target.classList.contains('db-item-wa') && 
                !e.target.classList.contains('db-item-delete')) {
                openDBDetailModal(el.dataset.id, 'commitment');
            }
        });
    });
    
    document.querySelectorAll('#dbCommitmentList .db-item-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const id = cb.dataset.id;
            if (e.target.checked) selectedCommitmentIds.set(id, true);
            else selectedCommitmentIds.delete(id);
            updateSelectAllButton('selectAllCommitment', '#dbCommitmentList', selectedCommitmentIds);
        });
    });
    
    updateSelectAllButton('selectAllCommitment', '#dbCommitmentList', selectedCommitmentIds);
}

function renderRemindersList() {
    const container = document.getElementById('reminderList');
    if (!container) return;
    
    if (remindersData.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;color:#9ca3af;">⏰ Belum ada pengingat</p>';
        return;
    }
    
    container.innerHTML = remindersData.map(item => {
        // ===== PERBAIKAN: Format tanggal DD-MM-YYYY =====
        const dateStr = item.datetime ? formatDateDDMMYYYY(item.datetime) : '-';
        const timeStr = item.datetime ? new Date(item.datetime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
        return `
            <div class="db-item">
                <div class="db-item-info">
                    <h4>📝 ${escapeHtml(item.title)}</h4>
                    <p>${escapeHtml(item.description || '-')}</p>
                    <small>⏰ ${dateStr} ${timeStr ? 'Jam ' + timeStr : ''}</small>
                </div>
                <div class="db-item-actions">
                    <button class="db-item-delete" onclick="deleteReminder('${item.id}')">🗑️ Hapus</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderMessagesList() {
    const container = document.getElementById('pesanList');
    if (!container) return;
    
    if (messagesData.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;color:#9ca3af;">💬 Belum ada pesan</p>';
        return;
    }
    
    container.innerHTML = messagesData.map(item => {
        // ===== PERBAIKAN: Format tanggal DD-MM-YYYY =====
        const dateStr = item.created_at ? formatDateDDMMYYYY(item.created_at) : '-';
        const timeStr = item.created_at ? new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
        return `
            <div class="db-item ${!item.is_read ? 'unread' : ''}">
                <div class="db-item-info">
                    <h4>📨 Dari: ${escapeHtml(item.from_name || 'CS Agent')}</h4>
                    <p>${escapeHtml(item.message)}</p>
                    <small>📅 ${dateStr} ${timeStr ? 'Jam ' + timeStr : ''} | ${item.is_read ? '✅ Dibaca' : '🆕 Baru'}</small>
                </div>
                <div class="db-item-actions">
                    ${!item.is_read ? `<button class="db-item-wa" onclick="markAsRead('${item.id}')">✅ Tandai Dibaca</button>` : ''}
                    <button class="db-item-delete" onclick="deletePesan('${item.id}')">🗑️ Hapus</button>
                </div>
            </div>
        `;
    }).join('');
}

// ========== RENDER USERS LIST ==========
function renderUsersList(users) {
    const container = document.getElementById('usersList');
    if (!container) return;
    
    if (users.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #9ca3af;">
                <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
                <p style="font-size: 14px;">Belum ada user selain Anda</p>
                <p style="font-size: 12px;">Klik "+ Tambah User" untuk menambahkan</p>
            </div>
        `;
        return;
    }
    
    // Urutkan: Owner dulu, baru CS
    const sortedUsers = [...users].sort((a, b) => {
        if (a.role === 'owner' && b.role !== 'owner') return -1;
        if (a.role !== 'owner' && b.role === 'owner') return 1;
        return a.nama?.localeCompare(b.nama || '') || 0;
    });
    
    container.innerHTML = sortedUsers.map(user => {
        const isOwner = user.role === 'owner';
        const roleLabel = isOwner ? '👑 Owner' : '👤 CS Agent';
        const roleClass = isOwner ? 'role-owner' : 'role-cs';
        const dateStr = user.created_at ? formatDateDDMMYYYY(user.created_at) : '-';
        
        return `
            <div class="db-item user-item" data-id="${user.id}" style="border-left: 3px solid ${isOwner ? '#f59e0b' : '#4f46e5'};">
                <div class="db-item-info" style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <h4 style="margin: 0; display: flex; align-items: center; gap: 8px;">
                            ${isOwner ? '👑' : '👤'} 
                            ${escapeHtml(user.nama || user.email)}
                        </h4>
                        <span class="role-badge ${roleClass}" style="
                            font-size: 11px;
                            padding: 2px 12px;
                            border-radius: 20px;
                            font-weight: 600;
                            ${isOwner ? 'background: #fef3c7; color: #92400e;' : 'background: #eef2ff; color: #4f46e5;'}
                        ">${roleLabel}</span>
                        ${user.id === currentUser?.id ? '<span style="font-size: 10px; background: #d1fae5; color: #065f46; padding: 2px 10px; border-radius: 12px;">(Anda)</span>' : ''}
                    </div>
                    <p style="margin: 4px 0 2px 0; font-size: 13px; color: var(--gray);">
                        📧 ${escapeHtml(user.email)}
                        ${user.hp ? `| 📱 ${escapeHtml(user.hp)}` : ''}
                    </p>
                    <small style="font-size: 11px; color: var(--gray);">
                        📅 Bergabung: ${dateStr}
                        ${user.updated_at ? `| 🔄 Update: ${formatDateDDMMYYYY(user.updated_at)}` : ''}
                    </small>
                </div>
                <div class="db-item-actions" style="display: flex; gap: 8px; flex-shrink: 0; align-items: center;">
                    ${user.id !== currentUser?.id ? `
                        <button class="db-item-delete" onclick="event.stopPropagation(); deleteUser('${user.id}')" style="
                            padding: 5px 12px;
                            border-radius: 8px;
                            border: none;
                            cursor: pointer;
                            font-size: 11px;
                            font-weight: 600;
                            background: #fef2f2;
                            color: #ef4444;
                            transition: all 0.2s;
                        " onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'">
                            🗑️ Hapus
                        </button>
                    ` : `
                        <span style="font-size: 11px; color: #9ca3af;">(Anda)</span>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

function renderTarifAdminList() {
    const container = document.getElementById('tarifAdminList');
    if (!container) return;
    
    if (tarifAdminData.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;">🏷️ Tidak ada data admin per CID</p>';
        return;
    }
    
    container.innerHTML = tarifAdminData.map(item => `
        <div class="db-item" data-id="${item.id}">
            <div class="db-item-info">
                <h4>🆔 CID: ${escapeHtml(item.cid)}</h4>
                <p>⚡ PLN Pospaid: ${formatRupiah(item.admin_pospaid || 0)}<br>⚡ PLN Prepaid: ${formatRupiah(item.admin_prepaid || 0)}<br>⚡ PLN Nontaglis: ${formatRupiah(item.admin_nontaglis || 0)}</p>
            </div>
            <div class="db-item-actions">
                <button class="db-item-edit" onclick="editTarifAdmin('${item.id}')">✏️ Edit</button>
                <button class="db-item-delete" onclick="deleteTarifAdmin('${item.id}')">🗑️ Hapus</button>
            </div>
        </div>
    `).join('');
}

function renderTransaksiListGlobal() {
    const container = document.getElementById('transaksiList');
    if (!container) return;
    
    if (transaksiGlobalList.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:40px; color:#9ca3af;">📭 Belum ada catatan transaksi</p>';
        return;
    }
    
    container.innerHTML = transaksiGlobalList.map(item => `
        <div class="db-item" style="border-left: 3px solid #4f46e5; margin-bottom: 8px;">
            <div class="db-item-info">
                <h4>💰 ${formatRupiah(item.nominal)}</h4>
                <p>${escapeHtml(item.keterangan || '-')}</p>
                <small>📅 ${new Date(item.tanggal).toLocaleDateString('id-ID')} | 👤 oleh: ${escapeHtml(item.created_by_name || 'CS')}</small>
            </div>
            <div class="db-item-actions">
                ${currentUserRole === 'owner' || item.created_by === currentUser?.id ? 
                    `<button class="db-item-edit" onclick="editTransaksiGlobal('${item.id}')">✏️ Edit</button>
                     <button class="db-item-delete" onclick="deleteTransaksiGlobal('${item.id}')">🗑️ Hapus</button>` : ''
                }
            </div>
        </div>
    `).join('');
}

// ========== TARIF ADMIN FUNCTIONS ==========
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
        user_id: currentUser.id,
        updated_at: new Date().toISOString()
    };

    try {
        if (id) {
            await window.db.from('tarif_admin').update(data).eq('id', id);
            showNotifTop('✅ Data admin per CID berhasil diupdate');
        } else {
            const existing = tarifAdminData.find(t => t.cid === cid);
            if (existing) {
                showNotifTop(`⚠️ CID ${cid} sudah ada! Silakan edit data yang sudah ada.`, true);
                return false;
            }
            data.created_at = new Date().toISOString();
            await window.db.from('tarif_admin').insert(data);
            showNotifTop('✅ Data admin per CID berhasil ditambahkan');
        }
        await loadTarifAdmin();
        return true;
    } catch (e) {
        showNotifTop('❌ Gagal: ' + e.message, true);
        return false;
    }
}

function deleteTarifAdmin(id) {
    if (!confirm('Yakin hapus data admin per CID ini?')) return;
    window.db.from('tarif_admin').delete().eq('id', id);
    showNotifTop('🗑️ Data dihapus');
    loadTarifAdmin();
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

// ========== DELETE FUNCTIONS ==========
async function deleteReminder(id) {
    if (!confirm('Hapus pengingat ini?')) return;
    await window.db.from('reminders').delete().eq('id', id);
    showNotifTop('🗑️ Pengingat dihapus');
    await loadReminders();
}

async function markAsRead(id) {
    await window.db.from('messages').update({ is_read: true }).eq('id', id);
    await loadMessages();
}

async function deletePesan(id) {
    if (!confirm('Hapus pesan ini?')) return;
    await window.db.from('messages').delete().eq('id', id);
    await loadMessages();
}

async function sendPesan(toId, message) {
    const { error } = await window.db.from('messages').insert({
        from_id: currentUser.id,
        from_name: currentUserName,
        to_id: toId,
        message: message,
        is_read: false,
        created_at: new Date().toISOString()
    });
    
    if (error) {
        showNotifTop('❌ Gagal kirim: ' + error.message, true);
        return false;
    }
    
    showNotifTop('✅ Pesan terkirim');
    return true;
}

async function deleteUser(id) {
    if (!confirm('Yakin ingin menghapus CS Agent ini?')) return;
    try {
        await window.db.from('users').delete().eq('id', id);
        showNotifTop('✅ CS Agent berhasil dihapus');
        await loadUsersList();
    } catch (e) {
        showNotifTop('❌ Gagal: ' + e.message, true);
    }
}

// ========== VARIABLES ==========
let selectedTransaksiIdsForMove = [];
let csListData = [];

// ========== LOAD CS LIST ==========
async function loadCsList() {
    try {
        const { data, error } = await window.db
            .from('users')
            .select('id, nama, email, role')
            .neq('id', currentUser.id)
            .neq('role', 'owner')   // <-- tambahkan filter ini
            .order('nama', { ascending: true });
        
        if (error) throw error;
        
        csListData = data || [];
        return csListData;
    } catch (err) {
        console.error('Error loading CS list:', err);
        return [];
    }
}

// ========== RENDER CS CHECKBOX LIST ==========
function renderCsCheckboxList(csList) {
    const container = document.getElementById('csMultiSelectTransaksi');
    if (!container) return;
    
    if (!csList || csList.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #9ca3af;">
                <p>Tidak ada CS Agent selain Anda</p>
                <p style="font-size: 12px;">Tambahkan CS Agent melalui menu Kelola CS</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = csList.map(cs => `
        <label style="
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid transparent;
            margin-bottom: 4px;
        " onmouseenter="this.style.background='#f3f4f6'" onmouseleave="this.style.background='transparent'">
            <input type="checkbox" class="cs-checkbox-transaksi" value="${cs.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: #4f46e5;">
            <div>
                <div style="font-weight: 500; font-size: 13px; color: #1f2937;">${escapeHtml(cs.nama || cs.email)}</div>
                <div style="font-size: 11px; color: #6b7280;">📧 ${escapeHtml(cs.email)}</div>
            </div>
        </label>
    `).join('');
    
    // Event listener untuk update preview
    container.querySelectorAll('.cs-checkbox-transaksi').forEach(cb => {
        cb.addEventListener('change', updatePreviewDataTransaksi);
    });
}

// ========== UPDATE PREVIEW DATA ==========
function updatePreviewDataTransaksi() {
    const selectedCs = getSelectedCsTransaksi();
    const totalData = selectedTransaksiIdsForMove.length;
    
    document.getElementById('selectedDataCountTransaksi').innerText = totalData;
    
    const previewGroup = document.getElementById('previewUplineGroupTransaksi');
    if (!previewGroup) return;
    
    if (selectedCs.length === 0 || totalData === 0) {
        previewGroup.innerHTML = '';
        return;
    }
    
    // ===== HITUNG PEMBAGIAN PER UPLINE =====
    const metode = document.getElementById('metodePembagianTransaksi').value;
    
    if (metode === 'satu') {
        previewGroup.innerHTML = `
            <div style="background: #eef2ff; padding: 8px 12px; border-radius: 8px;">
                📨 Kirim <strong>${totalData}</strong> data ke <strong>${selectedCs.length}</strong> CS
            </div>
        `;
        return;
    }
    
    // ===== PEMBAGIAN RATA =====
    const dataPerCs = Math.floor(totalData / selectedCs.length);
    const sisa = totalData - (dataPerCs * selectedCs.length);
    
    let detailHtml = `<div style="background: #eef2ff; padding: 8px 12px; border-radius: 8px; margin-bottom: 8px;">
        📊 <strong>${totalData}</strong> data dibagi ke <strong>${selectedCs.length}</strong> CS
        <br><small>Masing-masing: ~${dataPerCs} data, ${sisa > 0 ? `${sisa} CS mendapat +1 data` : 'rata'}</small>
    </div>`;
    
    // ===== TAMPILKAN PER UPLINE =====
    const transaksiItems = transaksiData.filter(t => selectedTransaksiIdsForMove.includes(t.id));
    const uplineMap = new Map();
    
    transaksiItems.forEach(item => {
        const upline = item.upline_name || 'Tidak ada upline';
        if (!uplineMap.has(upline)) {
            uplineMap.set(upline, []);
        }
        uplineMap.get(upline).push(item);
    });
    
    detailHtml += `<div style="font-size: 12px; color: #6b7280; max-height: 100px; overflow-y: auto;">
        <strong>📋 Per Upline:</strong><br>
        ${Array.from(uplineMap.entries()).map(([upline, items]) => 
            `• ${escapeHtml(upline)}: ${items.length} agent`
        ).join('<br>')}
    </div>`;
    
    previewGroup.innerHTML = detailHtml;
}

// ========== GET SELECTED CS ==========
function getSelectedCsTransaksi() {
    const checkboxes = document.querySelectorAll('.cs-checkbox-transaksi:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// ========== DISTRIBUSI DATA KE CS ==========
async function distributeDataToCs(selectedIds, csIds, metode) {
    if (!selectedIds || selectedIds.length === 0) {
        showNotifTop('⚠️ Tidak ada data yang dipilih!', true);
        return false;
    }
    
    if (!csIds || csIds.length === 0) {
        showNotifTop('⚠️ Pilih minimal satu CS tujuan!', true);
        return false;
    }
    
    // ===== AMBIL DATA TRANSAKSI =====
    const transaksiItems = transaksiData.filter(t => selectedIds.includes(t.id));
    if (transaksiItems.length === 0) {
        showNotifTop('⚠️ Data transaksi tidak ditemukan!', true);
        return false;
    }
    
    // ===== KELOMPOKKAN BERDASARKAN UPLINE =====
    const uplineMap = new Map();
    transaksiItems.forEach(item => {
        const upline = item.upline_name || 'Tidak ada upline';
        if (!uplineMap.has(upline)) {
            uplineMap.set(upline, []);
        }
        uplineMap.get(upline).push(item);
    });
    
    const uplineGroups = Array.from(uplineMap.entries());
    
    // ===== METODE SATU CS =====
    if (metode === 'satu') {
        const targetCsId = csIds[0];
        let success = 0, failed = 0;
        
        for (const item of transaksiItems) {
            try {
                await moveSingleTransaksiToFollowup(item.id, targetCsId);
                success++;
            } catch (err) {
                console.error('Error moving:', err);
                failed++;
            }
        }
        
        showNotifTop(`✅ ${success} data dipindahkan ke CS, ${failed} gagal`);
        return true;
    }
    
    // ===== METODE RATA =====
    // Hitung total data
    const totalData = transaksiItems.length;
    const dataPerCs = Math.floor(totalData / csIds.length);
    const sisa = totalData - (dataPerCs * csIds.length);
    
    // Buat array pembagian
    const distribution = csIds.map((csId, index) => ({
        csId: csId,
        count: dataPerCs + (index < sisa ? 1 : 0),
        assigned: []
    }));
    
    // ===== DISTRIBUSI PER UPLINE (agar tidak terpisah) =====
    let currentCsIndex = 0;
    
    for (const [upline, items] of uplineGroups) {
        const totalItems = items.length;
        let remaining = totalItems;
        let startIndex = 0;
        
        while (remaining > 0) {
            // Cari CS yang masih punya kuota
            let csIndex = currentCsIndex;
            let found = false;
            
            for (let i = 0; i < distribution.length; i++) {
                const idx = (currentCsIndex + i) % distribution.length;
                if (distribution[idx].assigned.length < distribution[idx].count) {
                    csIndex = idx;
                    found = true;
                    break;
                }
            }
            
            if (!found) break;
            
            // Ambil data untuk CS ini
            const takeCount = Math.min(
                remaining,
                distribution[csIndex].count - distribution[csIndex].assigned.length
            );
            
            if (takeCount > 0) {
                const itemsToAssign = items.slice(startIndex, startIndex + takeCount);
                distribution[csIndex].assigned.push(...itemsToAssign);
                remaining -= takeCount;
                startIndex += takeCount;
            }
            
            currentCsIndex = (currentCsIndex + 1) % distribution.length;
        }
    }
    
    // ===== EKSEKUSI PEMINDAHAN =====
    let totalSuccess = 0;
    let totalFailed = 0;
    
    for (const dist of distribution) {
        for (const item of dist.assigned) {
            try {
                await moveSingleTransaksiToFollowup(item.id, dist.csId);
                totalSuccess++;
            } catch (err) {
                console.error('Error moving:', err);
                totalFailed++;
            }
        }
    }
    
    showNotifTop(`✅ ${totalSuccess} data dipindahkan ke ${csIds.length} CS, ${totalFailed} gagal`);
    
    // ===== TAMPILKAN RINGKASAN =====
    const summary = distribution.map(d => {
        const csName = csListData.find(c => c.id === d.csId)?.nama || 'CS';
        return `${csName}: ${d.assigned.length} data`;
    }).join('\n');
    
    if (DEBUG) console.log('📊 Distribusi Data:', summary);
    
    return true;
}

// ========== MOVE SINGLE TRANSAKSI TO FOLLOWUP ==========
async function moveSingleTransaksiToFollowup(transaksiId, targetUserId) {
    const item = transaksiData.find(t => t.id === transaksiId);
    if (!item) throw new Error('Data tidak ditemukan');
    
    // Cek duplikat
    const { data: existing } = await window.db
        .from('customers')
        .select('id')
        .eq('agent_id', item.agent_id)
        .maybeSingle();
    
    if (existing) {
        // Update status di db_transaksi
        await window.db.from('db_transaksi').update({ 
            status: 'imported', 
            updated_at: new Date().toISOString() 
        }).eq('id', transaksiId);
        return;
    }
    
    // Insert ke customers dengan user_id target
    await window.db.from('customers').insert({
        agent_id: item.agent_id,
        nama: item.nama || `Agent ${item.agent_id}`,
        hp: item.hp || '',
        apk: item.apk || '',
        upline_name: item.upline_name || '',
        upline_phone: item.upline_phone || '',
        tanggal: getTodayDate(),
        status: 'baru',
        user_id: targetUserId || currentUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });
    
    // Update status di db_transaksi
    await window.db.from('db_transaksi').update({ 
        status: 'imported', 
        updated_at: new Date().toISOString() 
    }).eq('id', transaksiId);
}

// ========== MOVE AGENT TO FOLLOWUP ==========
async function moveAgentToFollowup(agentId) {
    const agent = agentsData.find(a => a.id === agentId);
    if (!agent) return;

    const { data: existing } = await window.db
        .from('customers')
        .select('id')
        .eq('agent_id', agent.agent_id)
        .maybeSingle();
    
    if (existing) {
        showNotifTop(`⚠️ ID Agent "${agent.agent_id}" sudah terdaftar di Followup!`, true);
        return;
    }

    if (!confirm(`Pindahkan agent "${escapeHtml(agent.nama)}" ke Followup Agen?`)) return;

    const { error } = await window.db.from('customers').insert({
        agent_id: agent.agent_id,
        nama: agent.nama,
        hp: agent.hp,
        apk: agent.apk || '',
        agent_type: agent.agent_type || '',
        upline_name: agent.upline || '',
        upline_phone: agent.upline_phone || '',
        tanggal: getTodayDate(),
        status: 'baru',
        user_id: agent.user_id || currentUser.id,
        created_at: new Date().toISOString()
    });

    if (error) {
        showNotifTop('❌ Gagal memindahkan: ' + error.message, true);
        return;
    }

    await window.db.from('db_agent').delete().eq('id', agentId);
    selectedAgentIds.delete(agentId);
    showNotifTop('✅ Agent berhasil dipindahkan ke Followup Agen!');
    await loadDatabaseAgent();
    await loadCustomers();
}

async function deleteAgentItem(id) {
    if (!confirm('Yakin hapus data agent ini?')) return;
    
    const { error } = await window.db.from('db_agent').delete().eq('id', id);
    if (error) {
        showNotifTop('❌ Gagal hapus: ' + error.message, true);
        return;
    }
    
    selectedAgentIds.delete(id);
    showNotifTop('🗑️ Data agent berhasil dihapus');
    await loadDatabaseAgent();
}

async function deleteDBItem(collection, id) {
    if (!confirm('Yakin hapus data ini?')) return;
    
    await window.db.from(collection).delete().eq('id', id);
    showNotifTop('🗑️ Data berhasil dihapus');
    
    if (collection === 'db_closing') await loadDBClosing();
    else if (collection === 'db_tidak_tertarik') await loadDBTidak();
    else if (collection === 'nomor_salah') await loadDBNomorSalah();
    else if (collection === 'db_commitment') await loadDBCommitment();
}

// ========== TARGET KPI FUNCTIONS ==========
// ========== LOAD TARGET DATA ==========
async function loadTargetData() {
    if (!currentUser) {
        console.warn('loadTargetData: No current user');
        return;
    }
    
    try {
        // ===== PERBAIKAN: Hapus filter user_id =====
        const { data, error } = await window.db
            .from('settings')
            .select('*')
            .eq('key', 'targetKPI')
            .maybeSingle();
        
        if (error) {
            console.error('Error loading target:', error);
            targetData = { agent: 10, upline: 5, transaksi: 100, selisih: 50, monthlyTargets: [] };
            updateTargetUI(0, 0, 0, 0, 0, 0, 0, 0);
            return;
        }
        
        if (data && data.value) {
            targetData = data.value;
            if (DEBUG) console.log('✅ Target loaded from settings:', targetData);
        } else {
            if (DEBUG) console.log('⚠️ No target found, creating default');
            targetData = { agent: 10, upline: 5, transaksi: 100, selisih: 50, monthlyTargets: [] };
            
            try {
                await window.db.from('settings').insert({
                    key: 'targetKPI',
                    value: targetData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
                if (DEBUG) console.log('✅ Default target saved to database');
            } catch (insertErr) {
                console.warn('⚠️ Error inserting default target:', insertErr);
            }
        }
        
        // ===== AMBIL DATA TRANSAKSI =====
        const transaksiDataLocal = window.transaksiData || transaksiData || [];
        if (DEBUG) console.log(`📊 Transaksi data length: ${transaksiDataLocal.length}`);
        
        if (transaksiDataLocal.length === 0) { 
            console.warn('⚠️ No transaksi data available');
            updateTargetUI(targetData.agent || 0, targetData.upline || 0, targetData.transaksi || 0, targetData.selisih || 0, 0, 0, 0, 0);
            return; 
        }
        
        // ===== HITUNG STATISTIK =====
        const validData = transaksiDataLocal.filter(t => t.progres_jenis !== 'tidak_transaksi');
        const agentIds = new Set();
        validData.forEach(t => { if (t.agent_id) agentIds.add(t.agent_id); });
        const currentAgent = agentIds.size;
        
        const uplineSet = new Set();
        validData.forEach(t => { 
            if (t.upline_name && t.upline_name.trim() !== '' && t.upline_name !== '-') {
                uplineSet.add(t.upline_name); 
            }
        });
        const currentUpline = uplineSet.size;
        
        let totalTransaksiBulanIni = 0;
        validData.forEach(t => { totalTransaksiBulanIni += (t.transaksi_bulan_ini || 0); });
        const currentTransaksi = totalTransaksiBulanIni;
        
        let totalBulanLalu = 0;
        validData.forEach(t => { totalBulanLalu += (t.transaksi_bulan_lalu || 0); });
        const currentSelisih = currentTransaksi - totalBulanLalu;
        
        if (DEBUG) console.log('📊 Target Statistics:', {
            currentAgent, currentUpline, currentTransaksi, currentSelisih
        });
        
        updateTargetUI(
            targetData.agent || 0, 
            targetData.upline || 0, 
            targetData.transaksi || 0, 
            targetData.selisih || 0, 
            currentAgent, 
            currentUpline, 
            currentTransaksi, 
            currentSelisih
        );
        
        updateTrendChart();
        
    } catch (err) { 
        console.error('❌ Error loading target data:', err); 
        targetData = { agent: 10, upline: 5, transaksi: 100, selisih: 50, monthlyTargets: [] };
        updateTargetUI(0, 0, 0, 0, 0, 0, 0, 0);
    }
}

const existingStyle = document.querySelector('#targetCelebrateStyle');
if (existingStyle) {
    existingStyle.remove();
}

// Tambahkan style baru tanpa flip animation
const newStyle = document.createElement('style');
newStyle.id = 'targetCelebrateStyle';
newStyle.textContent = `
    /* ===== PULSE TARGET HEADER ===== */
    @keyframes pulseTarget {
        0% { transform: scale(1); }
        50% { transform: scale(1.03); }
        100% { transform: scale(1); }
    }
    
    /* ===== CELEBRATE BACKGROUND (tanpa flip) ===== */
    .target-kpi-section.celebrate {
        background: linear-gradient(135deg, #fef3c7, #fde68a, #fcd34d) !important;
        border-color: #f59e0b !important;
        box-shadow: 0 0 40px rgba(245, 158, 11, 0.3) !important;
        transition: all 0.6s ease !important;
    }
    
    /* ===== CELEBRATE CONFETTI EFFECT ===== */
    .target-kpi-section.celebrate::before {
        content: '🎉🥳🎉🥳🎉🥳🎉🥳';
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 32px;
        animation: confettiDrop 1.5s ease-in-out infinite;
        pointer-events: none;
        opacity: 0.8;
        letter-spacing: 8px;
        white-space: nowrap;
        z-index: 10;
    }
    
    @keyframes confettiDrop {
        0% { transform: translateX(-50%) translateY(-20px) rotate(0deg); opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% { transform: translateX(-50%) translateY(10px) rotate(360deg); opacity: 0; }
    }
    
    /* ===== KARTU TARGET CELEBRATE (tanpa flip) ===== */
    .target-kpi-section.celebrate .target-card {
        animation: cardCelebrate 0.8s ease-in-out;
    }
    
    .target-kpi-section.celebrate .target-card:nth-child(1) { animation-delay: 0.0s; }
    .target-kpi-section.celebrate .target-card:nth-child(2) { animation-delay: 0.1s; }
    .target-kpi-section.celebrate .target-card:nth-child(3) { animation-delay: 0.2s; }
    .target-kpi-section.celebrate .target-card:nth-child(4) { animation-delay: 0.3s; }
    
    @keyframes cardCelebrate {
        0% { transform: scale(1); }
        25% { transform: scale(1.05); }
        50% { transform: scale(1.08); }
        75% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    /* ===== DARK MODE ===== */
    body.dark-mode .target-kpi-section.celebrate {
        background: linear-gradient(135deg, #451a03, #78350f, #92400e) !important;
        border-color: #f59e0b !important;
    }
    
    body.dark-mode .target-kpi-section.celebrate .target-header h3 {
        color: #fcd34d !important;
    }
    
    /* ===== TARGET CARD CLICKABLE ===== */
    .target-card {
        cursor: pointer !important;
        transition: all 0.3s ease !important;
    }
    
    .target-card:hover {
        transform: translateY(-6px) !important;
        box-shadow: 0 20px 30px -12px rgba(0, 0, 0, 0.3) !important;
    }
    
    .target-card:active {
        transform: translateY(-2px) !important;
    }
`;
document.head.appendChild(newStyle);

// ================================================================
// ========== FUNGSI INIT TARGET CARD CLICK ==========
// ================================================================

function initTargetCardClick() {
    const targetCards = document.querySelectorAll('.target-card');
    targetCards.forEach((card, index) => {
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);
        const freshCard = document.querySelectorAll('.target-card')[index];
        if (freshCard) {
            freshCard.style.cursor = 'pointer';
            freshCard.style.transition = 'all 0.3s ease';
            freshCard.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const labels = ['Agent','Upline','Transaksi','Selisih'];
                const label = labels[index] || 'Target';
                const valueEl = this.querySelector('.target-card-value');
                const reachedEl = this.querySelector('.target-card-sub span');
                const progressEl = this.querySelector('.progress-bar div');
                const targetValue = valueEl ? valueEl.innerText : '0';
                const reachedValue = reachedEl ? reachedEl.innerText : '0';
                const progressWidth = progressEl ? progressEl.style.width : '0%';
                if (typeof window.showTargetDetailModal === 'function') {
                    window.showTargetDetailModal(label, targetValue, reachedValue, progressWidth);
                } else {
                    alert(`${label}\nTarget: ${targetValue}\nTercapai: ${reachedValue}\nProgress: ${progressWidth}`);
                }
            });
            freshCard.addEventListener('mouseenter', function() { this.style.transform = 'translateY(-8px) scale(1.02)'; this.style.boxShadow = '0 20px 40px -12px rgba(0,0,0,0.25)'; });
            freshCard.addEventListener('mouseleave', function() { this.style.transform = ''; this.style.boxShadow = ''; });
        }
    });
}

// ================================================================
// ========== FUNGSI SHOW TARGET DETAIL MODAL ==========
// ================================================================

function showTargetDetailModal(label, targetValue, reachedValue, progressWidth) {
    let percent = 0;
    if (typeof progressWidth === 'string') percent = parseFloat(progressWidth) || 0;
    else if (typeof progressWidth === 'number') percent = progressWidth;
    const isComplete = percent >= 100;
    const targetNum = parseInt(String(targetValue).replace(/[^0-9]/g, '')) || 0;
    const reachedNum = parseInt(String(reachedValue).replace(/[^0-9]/g, '')) || 0;
    let emoji = '🎯', color = '#4f46e5', labelKey = 'agent';
    if (label === 'Agent') { emoji = '👤'; color = '#667eea'; labelKey = 'agent'; }
    else if (label === 'Upline') { emoji = '👥'; color = '#4facfe'; labelKey = 'upline'; }
    else if (label === 'Transaksi') { emoji = '📊'; color = '#f093fb'; labelKey = 'transaksi'; }
    else if (label === 'Selisih') { emoji = '📈'; color = '#fa709a'; labelKey = 'selisih'; }
    const transaksiLocal = window.transaksiData || transaksiData || [];
    const monthData = [];
    const periodMap = new Map();
    transaksiLocal.forEach(t => {
        if (t.progres_jenis === 'tidak_transaksi') return;
        const periode = t.periode_bulan_ini || 'Unknown';
        if (!periodMap.has(periode)) periodMap.set(periode, { count: 0, uplineSet: new Set(), totalTransaksi: 0, agentIds: new Set() });
        const stats = periodMap.get(periode);
        stats.count++;
        stats.totalTransaksi += (t.transaksi_bulan_ini || 0);
        if (t.upline_name && t.upline_name.trim() !== '' && t.upline_name !== '-') stats.uplineSet.add(t.upline_name);
        if (t.agent_id) stats.agentIds.add(t.agent_id);
    });
    const sortedPeriods = Array.from(periodMap.keys()).sort((a,b) => {
        if (a === 'Unknown') return 1;
        if (b === 'Unknown') return -1;
        const [bulanA, tahunA] = a.split(' '), [bulanB, tahunB] = b.split(' ');
        const idxA = getBulanIndex(bulanA) || 0, idxB = getBulanIndex(bulanB) || 0;
        if (tahunA !== tahunB) return parseInt(tahunA) - parseInt(tahunB);
        return idxA - idxB;
    });
    const recentPeriods = sortedPeriods.slice(-6);
    recentPeriods.forEach(periode => {
        const stats = periodMap.get(periode);
        let value = 0;
        if (labelKey === 'agent') value = stats.agentIds.size;
        else if (labelKey === 'upline') value = stats.uplineSet.size;
        else if (labelKey === 'transaksi') value = stats.totalTransaksi;
        else if (labelKey === 'selisih') value = stats.totalTransaksi;
        monthData.push({ periode, value, count: stats.count, upline: stats.uplineSet.size, agent: stats.agentIds.size, totalTransaksi: stats.totalTransaksi });
    });
    let monthRowsHtml = '';
    if (monthData.length > 0) {
        monthRowsHtml = monthData.map((item, index) => {
            const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
            let displayValue = item.value;
            if (labelKey === 'transaksi' || labelKey === 'selisih') displayValue = item.value.toLocaleString();
            return `<tr style="background:${bgColor};border-bottom:1px solid #e5e7eb;"><td style="padding:6px 10px;font-weight:600;color:#1f2937;font-size:12px;">${escapeHtml(item.periode)}</td><td style="padding:6px 10px;text-align:center;font-weight:700;color:${color};font-size:13px;">${displayValue}</td><td style="padding:6px 10px;text-align:center;color:#6b7280;font-size:11px;">${item.agent}</td><td style="padding:6px 10px;text-align:center;color:#6b7280;font-size:11px;">${item.upline}</td></tr>`;
        }).join('');
    }
    const modalHtml = `
        <div class="modal-content" style="max-width:480px;border-radius:24px;overflow:hidden;background:#fff;max-height:85vh;display:flex;flex-direction:column;">
            <div style="background:linear-gradient(135deg,${color},${color}dd);padding:20px 24px 16px;color:white;flex-shrink:0;">
                <div style="display:flex;align-items:center;gap:12px;"><span style="font-size:28px;">${emoji}</span><div><h3 style="font-size:18px;font-weight:700;margin:0;color:white;">Detail Target ${label}</h3><p style="font-size:12px;opacity:0.9;margin:2px 0 0;">Informasi lengkap pencapaian target</p></div></div>
            </div>
            <div style="padding:16px 20px;flex:1;overflow-y:auto;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
                    <div style="background:#f1f5f9;border-radius:12px;padding:12px 16px;text-align:center;border-left:4px solid ${color};"><div style="font-size:10px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">🎯 Target</div><div style="font-size:24px;font-weight:800;color:${color};margin-top:2px;">${targetNum.toLocaleString()}</div></div>
                    <div style="background:${isComplete ? '#d1fae5' : '#f1f5f9'};border-radius:12px;padding:12px 16px;text-align:center;border-left:4px solid ${isComplete ? '#10b981' : '#9ca3af'};"><div style="font-size:10px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">✅ Tercapai</div><div style="font-size:24px;font-weight:800;color:${isComplete ? '#10b981' : '#6b7280'};margin-top:2px;">${reachedNum.toLocaleString()}</div></div>
                </div>
                <div style="margin-bottom:16px;"><div style="display:flex;justify-content:space-between;font-size:12px;color:#6b7280;margin-bottom:4px;"><span>📊 Progress</span><span style="font-weight:700;color:${color};">${Math.round(percent)}%</span></div><div style="background:#e5e7eb;border-radius:8px;height:8px;overflow:hidden;"><div style="width:${Math.min(percent,100)}%;height:100%;background:linear-gradient(90deg,${color},${color}dd);border-radius:8px;transition:width 0.6s ease;"></div></div></div>
                ${isComplete ? `<div style="background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:12px;padding:12px 16px;text-align:center;border:2px solid #f59e0b;animation:pulseCelebrate 1.5s ease-in-out infinite;margin-bottom:16px;"><div style="font-size:24px;margin-bottom:2px;">🥳🎉</div><div style="font-size:16px;font-weight:800;color:#92400e;">Target ${label} TERCAPAI!</div><div style="font-size:12px;color:#78350f;margin-top:2px;">Selamat! Target telah berhasil dicapai 🎊</div></div>` : `<div style="background:#f3f4f6;border-radius:12px;padding:12px 16px;text-align:center;margin-bottom:16px;"><div style="font-size:20px;margin-bottom:2px;">💪</div><div style="font-size:14px;font-weight:600;color:#374151;">Terus Semangat!</div><div style="font-size:12px;color:#6b7280;margin-top:2px;">${Math.round(100 - percent)}% lagi menuju target</div></div>`}
                ${monthData.length > 0 ? `<div style="margin-top:4px;"><div style="font-weight:600;font-size:13px;color:#1f2937;margin-bottom:8px;">📅 Data ${label} per Bulan</div><div style="overflow-x:auto;border:1px solid #e5e7eb;border-radius:10px;max-height:180px;overflow-y:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;"><thead style="position:sticky;top:0;background:#eef2ff;z-index:2;"><tr><th style="padding:6px 10px;text-align:left;color:#4f46e5;font-weight:700;font-size:11px;">📅 Bulan</th><th style="padding:6px 10px;text-align:center;color:${color};font-weight:700;font-size:11px;">${emoji} ${label}</th><th style="padding:6px 10px;text-align:center;color:#6b7280;font-weight:700;font-size:11px;">👤 Agent</th><th style="padding:6px 10px;text-align:center;color:#6b7280;font-weight:700;font-size:11px;">👥 Upline</th></tr></thead><tbody>${monthRowsHtml}</tbody></table></div><div style="font-size:10px;color:#9ca3af;margin-top:4px;text-align:right;">Menampilkan ${monthData.length} bulan terakhir</div></div>` : `<div style="text-align:center;padding:16px;color:#9ca3af;font-size:12px;">Belum ada data transaksi untuk ditampilkan</div>`}
            </div>
            <div style="padding:12px 20px 16px;border-top:1px solid #e5e7eb;flex-shrink:0;"><button onclick="closeTargetDetailModal()" class="btn-primary" style="width:100%;padding:10px;border:none;border-radius:12px;font-weight:600;cursor:pointer;background:linear-gradient(135deg,#4f46e5,#6366f1);color:white;transition:all 0.3s;font-size:14px;">Tutup</button></div>
        </div>
    `;
    const existingModal = document.getElementById('targetDetailModal');
    if (existingModal) existingModal.remove();
    const modal = document.createElement('div');
    modal.id = 'targetDetailModal';
    modal.className = 'modal';
    modal.style.cssText = 'position:fixed !important;top:0 !important;left:0 !important;width:100% !important;height:100% !important;background:rgba(0,0,0,0.7) !important;display:flex !important;justify-content:center !important;align-items:center !important;z-index:999999999 !important;backdrop-filter:blur(5px) !important;pointer-events:auto !important;';
    modal.innerHTML = modalHtml;
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'auto';
    modal.addEventListener('click', function(e) { if (e.target === this) closeTargetDetailModal(); });
    const closeBtn = modal.querySelector('.btn-primary');
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); closeTargetDetailModal(); });
    }
    if (document.body.classList.contains('dark-mode')) applyDarkModeToModal(modal);
}

function initDashboard() {
    const targetCards = document.querySelectorAll('.target-card');
    targetCards.forEach(card => {
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);
    });
    if (typeof updateStats === 'function') updateStats();
    if (typeof updateChartCustomer === 'function') updateChartCustomer();
    if (typeof updateChartProspek === 'function') updateChartProspek();
    if (typeof updateDeadlineBadge === 'function') updateDeadlineBadge();
    if (typeof loadTargetData === 'function') {
        if (window.transaksiData && window.transaksiData.length > 0) loadTargetData();
        else if (typeof loadDbTransaksi === 'function') loadDbTransaksi().then(() => loadTargetData());
    }
    setTimeout(() => { if (typeof initTargetCardClick === 'function') initTargetCardClick(); }, 300);
    if (typeof updateTrendChart === 'function') updateTrendChart();
    if (typeof updateTargetDisplay === 'function') updateTargetDisplay();
}

// ========== FUNGSI CLOSE TARGET DETAIL MODAL ==========
function closeTargetDetailModal() {
    const modal = document.getElementById('targetDetailModal');
    if (modal) {
        modal.remove();
    }
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
}

// ========== TAMBAHKAN CSS ANIMASI ==========
const targetModalStyle = document.createElement('style');
targetModalStyle.textContent = `
    @keyframes pulseCelebrate {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
    
    #targetDetailModal .modal-content {
        animation: modalPopup 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
    }
    
    @keyframes modalPopup {
        from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }
    
    /* Dark mode untuk target detail modal */
    body.dark-mode #targetDetailModal .modal-content {
        background: #1e293b !important;
    }
    
    body.dark-mode #targetDetailModal .modal-content [style*="background: #f1f5f9"] {
        background: #0f172a !important;
    }
    
    body.dark-mode #targetDetailModal .modal-content [style*="background: #f3f4f6"] {
        background: #0f172a !important;
    }
    
    body.dark-mode #targetDetailModal .modal-content [style*="color: #374151"] {
        color: #f1f5f9 !important;
    }
    
    body.dark-mode #targetDetailModal .modal-content [style*="color: #6b7280"] {
        color: #94a3b8 !important;
    }
    
    body.dark-mode #targetDetailModal .modal-content [style*="color: #1f2937"] {
        color: #f1f5f9 !important;
    }
    
    body.dark-mode #targetDetailModal .modal-content [style*="background: #fef3c7"] {
        background: #451a03 !important;
        border-color: #78350f !important;
    }
    
    body.dark-mode #targetDetailModal .modal-content [style*="background: #fef3c7"] div {
        color: #fcd34d !important;
    }
    
    body.dark-mode #targetDetailModal .modal-content [style*="color: #92400e"] {
        color: #fcd34d !important;
    }
    
    body.dark-mode #targetDetailModal .modal-content [style*="color: #78350f"] {
        color: #fbbf24 !important;
    }
    
    body.dark-mode #targetDetailModal .modal-content [style*="background: #d1fae5"] {
        background: #064e3b !important;
    }
    
    body.dark-mode #targetDetailModal .modal-content [style*="color: #10b981"] {
        color: #34d399 !important;
    }
    
    body.dark-mode #targetDetailModal .modal-content table thead {
        background: #1e293b !important;
    }
    
    body.dark-mode #targetDetailModal .modal-content table thead th {
        color: #a5b4fc !important;
    }
    
    body.dark-mode #targetDetailModal .modal-content table tbody tr {
        background: #0f172a !important;
    }
    
    body.dark-mode #targetDetailModal .modal-content table tbody td {
        color: #e2e8f0 !important;
    }
    
    body.dark-mode #targetDetailModal .modal-content [style*="background: #eef2ff"] {
        background: #1e293b !important;
    }
`;
document.head.appendChild(targetModalStyle);

// ========== UPDATE TREND CHART (PREMIUM - OTOMATIS) ==========
async function updateTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) {
        console.warn('⚠️ trendChart canvas tidak ditemukan');
        return;
    }
    
    if (trendChart) {
        trendChart.destroy();
        trendChart = null;
    }
    
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    
    let labels = [];
    let naikData = [];
    let turunData = [];
    let tidakData = [];
    
    // ===== AMBIL DATA DARI window._riwayatData =====
    let riwayatData = window._riwayatData || [];
    
    if (DEBUG) console.log('📊 updateTrendChart - riwayatData length:', riwayatData.length);
    
    // ===== JIKA KOSONG, COBA AMBIL DARI DATABASE =====
    if (riwayatData.length === 0 && currentUser) {
        try {
            const { data, error } = await window.db
                .from('riwayat_transaksi_bulanan')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('tahun', { ascending: true })
                .order('bulan_index', { ascending: true });
            
            if (!error && data && data.length > 0) {
                riwayatData = data;
                window._riwayatData = data;
                if (DEBUG) console.log(`📊 Ambil riwayat dari database: ${data.length} bulan`);
            }
        } catch (err) {
            console.warn('Gagal ambil riwayat dari database:', err);
        }
    }
    
    if (riwayatData.length > 0) {
        // ===== URUTKAN RIWAYAT DARI LAMA KE BARU =====
        const sortedRiwayat = [...riwayatData].sort((a, b) => {
            if (a.tahun !== b.tahun) {
                return a.tahun - b.tahun;
            }
            return a.bulan_index - b.bulan_index;
        });
        
        sortedRiwayat.forEach(item => {
            labels.push(item.bulan);
            naikData.push(item.total_naik || 0);
            turunData.push(item.total_turun || 0);
            tidakData.push(item.total_tidak_transaksi || 0);
        });
        
        if (DEBUG) console.log(`📊 Trend Chart: Menampilkan ${labels.length} bulan dari riwayat:`, labels);
    } else {
        // ===== TIDAK ADA DATA =====
        if (DEBUG) console.log('📊 Trend Chart: Tidak ada data riwayat');
        
        const parent = ctx.parentElement;
        if (parent) {
            const oldMessage = parent.querySelector('.chart-empty-message');
            if (oldMessage) oldMessage.remove();
            
            const message = document.createElement('div');
            message.className = 'chart-empty-message';
            message.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #9ca3af;
                font-size: 14px;
                text-align: center;
                pointer-events: none;
                z-index: 2;
            `;
            message.innerHTML = `
                <div style="font-size: 32px; margin-bottom: 8px;">📊</div>
                <p>Belum ada data riwayat transaksi</p>
                <p style="font-size: 12px; color: #b0b8c4;">Import data transaksi untuk mulai menampilkan trend</p>
            `;
            
            parent.style.position = 'relative';
            parent.appendChild(message);
        }
        
        // Chart kosong
        trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Tidak Ada Data'],
                datasets: [
                    {
                        label: '📈 Naik',
                        data: [0],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 6,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                    },
                    {
                        label: '📉 Turun',
                        data: [0],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 6,
                        pointBackgroundColor: '#ef4444',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                    },
                    {
                        label: '🚫 Tidak Transaksi',
                        data: [0],
                        borderColor: '#6b7280',
                        backgroundColor: 'rgba(107, 114, 128, 0.15)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 6,
                        pointBackgroundColor: '#6b7280',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { size: 11, weight: '600' },
                            color: textColor,
                            usePointStyle: true,
                            padding: 16,
                        }
                    },
                    tooltip: {
                        enabled: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            color: textColor,
                            font: { size: 10 },
                            stepSize: 1,
                        },
                        grid: {
                            color: gridColor,
                            drawBorder: false,
                        }
                    },
                    x: {
                        ticks: {
                            color: textColor,
                            font: { size: 10 },
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
        
        ctx.style.maxHeight = '260px';
        ctx.style.minHeight = '200px';
        ctx.style.width = '100% !important';
        updateTrendChartBadge();
        return;
    }
    
    // ===== HITUNG MAKSIMAL UNTUK SKALA Y =====
    const allData = [...naikData, ...turunData, ...tidakData];
    const maxValue = allData.length > 0 ? Math.max(...allData) : 10;
    const yMax = Math.max(maxValue + Math.ceil(maxValue * 0.25) + 2, 10);
    
    // ===== HAPUS PESAN KOSONG JIKA ADA =====
    const parent = ctx.parentElement;
    if (parent) {
        const oldMessage = parent.querySelector('.chart-empty-message');
        if (oldMessage) oldMessage.remove();
    }
    
    // ===== DATA COUNT UNTUK MENENTUKAN GAYA =====
    const dataCount = labels.length;
    const isMinimalData = dataCount <= 2;
    
    // ===== GRADIEN FILL =====
    const gradientNaik = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradientNaik.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
    gradientNaik.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
    
    const gradientTurun = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradientTurun.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
    gradientTurun.addColorStop(1, 'rgba(239, 68, 68, 0.02)');
    
    const gradientTidak = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradientTidak.addColorStop(0, 'rgba(107, 114, 128, 0.2)');
    gradientTidak.addColorStop(1, 'rgba(107, 114, 128, 0.02)');
    
    // ===== BUAT CHART PREMIUM =====
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '📈 Naik',
                    data: naikData,
                    borderColor: '#10b981',
                    backgroundColor: gradientNaik,
                    tension: 0.4,
                    fill: true,
                    pointRadius: isMinimalData ? 10 : 6,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 3,
                    hoverRadius: isMinimalData ? 14 : 9,
                    hoverBorderWidth: 4,
                    borderWidth: isMinimalData ? 4 : 3,
                    spanGaps: false,
                },
                {
                    label: '📉 Turun',
                    data: turunData,
                    borderColor: '#ef4444',
                    backgroundColor: gradientTurun,
                    tension: 0.4,
                    fill: true,
                    pointRadius: isMinimalData ? 10 : 6,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 3,
                    hoverRadius: isMinimalData ? 14 : 9,
                    hoverBorderWidth: 4,
                    borderWidth: isMinimalData ? 4 : 3,
                    spanGaps: false,
                },
                {
                    label: '🚫 Tidak Transaksi',
                    data: tidakData,
                    borderColor: '#6b7280',
                    backgroundColor: gradientTidak,
                    tension: 0.4,
                    fill: true,
                    pointRadius: isMinimalData ? 10 : 6,
                    pointBackgroundColor: '#6b7280',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 3,
                    hoverRadius: isMinimalData ? 14 : 9,
                    hoverBorderWidth: 4,
                    borderWidth: isMinimalData ? 4 : 3,
                    borderDash: [6, 4],
                    spanGaps: false,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: { size: 12, weight: '600' },
                        color: textColor,
                        usePointStyle: true,
                        padding: 20,
                        boxWidth: 16,
                        boxHeight: 16,
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDark ? '#f1f5f9' : '#1f2937',
                    bodyColor: isDark ? '#cbd5e1' : '#374151',
                    borderColor: isDark ? '#334155' : '#e5e7eb',
                    borderWidth: 1,
                    cornerRadius: 12,
                    padding: 14,
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value} Agent`;
                        }
                    }
                },
                // ===== TAMBAHKAN ANOTASI UNTUK DATA MINIMAL =====
                annotation: isMinimalData ? {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: 0,
                            yMax: 0,
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 0,
                        }
                    }
                } : undefined
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: yMax,
                    ticks: {
                        color: textColor,
                        font: { size: 11 },
                        stepSize: Math.max(1, Math.ceil(yMax / 8)),
                        callback: function(value) {
                            return value + ' Agent';
                        },
                        padding: 8,
                    },
                    grid: {
                        color: gridColor,
                        drawBorder: false,
                        lineWidth: 1,
                    },
                    title: {
                        display: true,
                        text: 'Jumlah Agent',
                        color: textColor,
                        font: { size: 11, weight: '500' },
                        padding: { bottom: 8 }
                    }
                },
                x: {
                    ticks: {
                        color: textColor,
                        font: { size: 11, weight: '600' },
                        maxRotation: 30,
                        minRotation: 0,
                        padding: 6,
                    },
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            elements: {
                line: {
                    borderWidth: 3,
                },
                point: {
                    hoverRadius: 9,
                    hoverBorderWidth: 4,
                }
            },
            hover: {
                mode: 'index',
                intersect: false,
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
    
    if (DEBUG) console.log(`✅ Trend Chart updated: ${labels.length} bulan ditampilkan`);
    
    // ===== UPDATE BADGE =====
    updateTrendChartBadge();
    
    // ===== TAMPILKAN INFORMASI JUMLAH DATA =====
    if (isMinimalData && labels.length > 0) {
        if (DEBUG) console.log(`ℹ️ Hanya ${labels.length} bulan data, titik diperbesar untuk tampilan premium`);
    }
}

// ========== FUNGSI DEBUG UNTUK CEK DATA RIWAYAT ==========
function debugRiwayat() {
    if (DEBUG) console.log('📊 === DEBUG RIWAYAT ===');
    if (DEBUG) console.log('📊 window._riwayatData:', window._riwayatData);
    if (DEBUG) console.log('📊 isRiwayatLoaded:', isRiwayatLoaded);
    if (DEBUG) console.log('📊 currentUser:', currentUser?.id);
    if (DEBUG) console.log('📊 Jumlah data:', window._riwayatData?.length || 0);
    
    // Coba ambil langsung dari database
    if (currentUser) {
        window.db.from('riwayat_transaksi_bulanan')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('tahun', { ascending: true })
            .order('bulan_index', { ascending: true })
            .then(({ data, error }) => {
                if (error) {
                    console.error('❌ Error:', error);
                } else {
                    if (DEBUG) console.log('📊 Data dari database:', data);
                    if (DEBUG) console.log('📊 Jumlah dari database:', data?.length || 0);
                    
                    // Jika data ditemukan, update chart
                    if (data && data.length > 0) {
                        window._riwayatData = data;
                        updateTrendChart();
                        showNotifTop(`✅ Chart diperbarui: ${data.length} bulan ditampilkan`);
                    }
                }
            });
    }
}

// Ekspos ke global
window.debugRiwayat = debugRiwayat;

// ========== FUNGSI SHOW DETAIL PER BULAN ==========

function showDetailPerBulan(data) {
    const modalHtml = `
        <div class="modal-content" style="max-width: 400px;">
            <h3>📊 Detail Bulanan</h3>
            <div class="modal-subtitle">${data.periode}</div>
            <div style="padding: 0 20px 20px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div style="background: #d1fae5; border-radius: 12px; padding: 16px; text-align: center; border-left: 4px solid #10b981;">
                        <div style="font-size: 10px; color: #6b7280;">📈 Naik</div>
                        <div style="font-size: 28px; font-weight: 800; color: #10b981;">${data.naik}</div>
                    </div>
                    <div style="background: #fee2e2; border-radius: 12px; padding: 16px; text-align: center; border-left: 4px solid #ef4444;">
                        <div style="font-size: 10px; color: #6b7280;">📉 Turun</div>
                        <div style="font-size: 28px; font-weight: 800; color: #ef4444;">${data.turun}</div>
                    </div>
                    <div style="background: #e5e7eb; border-radius: 12px; padding: 16px; text-align: center; border-left: 4px solid #6b7280;">
                        <div style="font-size: 10px; color: #6b7280;">🚫 Tidak Transaksi</div>
                        <div style="font-size: 28px; font-weight: 800; color: #6b7280;">${data.tidak}</div>
                    </div>
                    <div style="background: #eef2ff; border-radius: 12px; padding: 16px; text-align: center; border-left: 4px solid #4f46e5;">
                        <div style="font-size: 10px; color: #6b7280;">📊 Total</div>
                        <div style="font-size: 28px; font-weight: 800; color: #4f46e5;">${data.total}</div>
                    </div>
                </div>
            </div>
            <div class="modal-buttons">
                <button onclick="closeModal('detailModal')" class="btn-primary" style="width: 100%;">Tutup</button>
            </div>
        </div>
    `;
    
    document.getElementById('detailContent').innerHTML = modalHtml;
    showModal('detailModal');
    applyDarkModeToModal(document.getElementById('detailModal'));
}

// ========== TAMBAHKAN CSS ANIMASI ==========

// Tambahkan ke style.css atau inject via JS
const targetAnimationStyle = document.createElement('style');
targetAnimationStyle.textContent = `
    @keyframes pulseTarget {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
    
    .target-header h3[style*="color: #10b981"] {
        animation: pulseTarget 1s infinite !important;
    }
`;
document.head.appendChild(targetAnimationStyle);

// ===== GENERATE DEMO DATA UNTUK CHART =====
function generateDemoData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const demoData = [];
    
    // Generate data untuk 6 bulan terakhir
    for (let i = 5; i >= 0; i--) {
        let monthIndex = currentMonth - i;
        let year = currentYear;
        if (monthIndex < 0) {
            monthIndex += 12;
            year--;
        }
        
        demoData.push({
            bulan: `${months[monthIndex]} ${year}`,
            bulan_index: monthIndex + 1,
            tahun: year,
            total_naik: Math.floor(Math.random() * 15) + 5,
            total_turun: Math.floor(Math.random() * 8) + 2,
            total_tidak_transaksi: Math.floor(Math.random() * 4) + 1,
            total_data: Math.floor(Math.random() * 20) + 10
        });
    }
    
    return demoData;
}

// ========== FUNGSI UPDATE UI TARGET ==========
function updateTargetUI(targetAgent, targetUpline, targetTransaksi, targetSelisih, currentAgent, currentUpline, currentTransaksi, currentSelisih) {
    if (DEBUG) console.log('📊 updateTargetUI:', {
        targetAgent, targetUpline, targetTransaksi, targetSelisih,
        currentAgent, currentUpline, currentTransaksi, currentSelisih
    });
    
    const elements = {
        targetAgentValue: targetAgent || 0,
        targetUplineValue: targetUpline || 0,
        targetTransaksiValue: (targetTransaksi || 0).toLocaleString(),
        targetSelisihValue: (targetSelisih || 0).toLocaleString(),
        targetAgentReached: currentAgent || 0,
        targetUplineReached: currentUpline || 0,
        targetTransaksiReached: (currentTransaksi || 0).toLocaleString(),
        targetSelisihReached: (currentSelisih || 0).toLocaleString()
    };
    
    for (const [id, value] of Object.entries(elements)) { 
        const el = document.getElementById(id); 
        if (el) el.innerText = value; 
    }
    
    const agentPercent = targetAgent > 0 ? Math.min((currentAgent / targetAgent) * 100, 100) : 0;
    const uplinePercent = targetUpline > 0 ? Math.min((currentUpline / targetUpline) * 100, 100) : 0;
    const transaksiPercent = targetTransaksi > 0 ? Math.min((currentTransaksi / targetTransaksi) * 100, 100) : 0;
    const selisihPercent = targetSelisih > 0 ? Math.min((currentSelisih / targetSelisih) * 100, 100) : 0;
    
    const progressElements = {
        targetAgentProgress: agentPercent,
        targetUplineProgress: uplinePercent,
        targetTransaksiProgress: transaksiPercent,
        targetSelisihProgress: selisihPercent
    };
    
    for (const [id, value] of Object.entries(progressElements)) { 
        const el = document.getElementById(id); 
        if (el) el.style.width = Math.min(value, 100) + '%'; 
    }
    
    const allTargetsMet = agentPercent >= 100 && uplinePercent >= 100 && transaksiPercent >= 100;
    const headerTarget = document.querySelector('.target-kpi-section .target-header h3');
    const targetSection = document.querySelector('.target-kpi-section');
    
    if (headerTarget) {
        if (allTargetsMet) {
            headerTarget.innerHTML = '🥳🎉 SELAMAT! Semua Target Tercapai! 🎉🥳';
            headerTarget.style.color = '#10b981';
            headerTarget.style.animation = 'pulseTarget 1.5s ease-in-out infinite';
            if (targetSection) {
                targetSection.style.background = 'linear-gradient(135deg, #fef3c7, #fde68a, #fcd34d)';
                targetSection.style.borderColor = '#f59e0b';
                targetSection.style.boxShadow = '0 0 40px rgba(245, 158, 11, 0.3)';
                targetSection.classList.add('celebrate');
            }
            showNotifTop('🥳🎉 SELAMAT! Semua target KPI telah tercapai! 🎉🥳');
        } else {
            headerTarget.innerHTML = '🎯 Target & KPI Prospek Agent';
            headerTarget.style.color = '';
            headerTarget.style.animation = '';
            if (targetSection) {
                targetSection.style.background = '';
                targetSection.style.borderColor = '';
                targetSection.style.boxShadow = '';
                targetSection.classList.remove('celebrate');
            }
        }
    }
    
    updateTargetChart([agentPercent, uplinePercent, transaksiPercent]);
}

// ========== FUNGSI UPDATE TARGET CHART ==========
function updateTargetChart(percentages) {
    const ctx = document.getElementById('targetChart');
    if (!ctx) return;
    
    if (targetChart) {
        targetChart.destroy();
        targetChart = null;
    }
    
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    
    let data = [0, 0, 0];
    if (percentages && percentages.length >= 3) {
        data = percentages.slice(0, 3).map(v => typeof v === 'number' && !isNaN(v) ? Math.min(v, 100) : 0);
    }
    
    targetChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Agent', 'Upline', 'Transaksi'],
            datasets: [{
                label: 'Pencapaian Target (%)',
                data: data,
                backgroundColor: ['#667eea', '#4facfe', '#f093fb'],
                borderRadius: 8,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.raw || 0}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Persentase (%)',
                        color: textColor,
                        font: { size: 11 }
                    },
                    ticks: {
                        color: textColor,
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                },
                x: {
                    ticks: {
                        color: textColor,
                        font: { size: 12, weight: 'bold' }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    targetChart.update();
}

// ========== FUNGSI SHOW DETAIL PER BULAN (DARI CHART TARGET) ==========

function showDetailPerBulanChart(label) {
    // ===== AMBIL DATA DARI TRANSAKSI =====
    const transaksiLocal = window.transaksiData || transaksiData || [];
    const periodMap = new Map();
    
    transaksiLocal.forEach(t => {
        const periode = t.periode_bulan_ini || 'Unknown';
        if (!periodMap.has(periode)) {
            periodMap.set(periode, { 
                naik: 0, 
                turun: 0, 
                tidak: 0, 
                total: 0,
                totalTransaksi: 0,
                uplineSet: new Set()
            });
        }
        const stats = periodMap.get(periode);
        if (t.progres_jenis === 'naik') stats.naik++;
        else if (t.progres_jenis === 'turun') stats.turun++;
        else if (t.progres_jenis === 'tidak_transaksi') stats.tidak++;
        stats.total++;
        stats.totalTransaksi += (t.transaksi_bulan_ini || 0);
        if (t.upline_name && t.upline_name.trim() !== '' && t.upline_name !== '-') {
            stats.uplineSet.add(t.upline_name);
        }
    });
    
    // Urutkan periode
    const sortedPeriods = Array.from(periodMap.keys()).sort((a, b) => {
        if (a === 'Unknown') return 1;
        if (b === 'Unknown') return -1;
        const [bulanA, tahunA] = a.split(' ');
        const [bulanB, tahunB] = b.split(' ');
        const idxA = getBulanIndex(bulanA) || 0;
        const idxB = getBulanIndex(bulanB) || 0;
        if (tahunA !== tahunB) return parseInt(tahunA) - parseInt(tahunB);
        return idxA - idxB;
    });
    
    const monthData = [];
    sortedPeriods.forEach(periode => {
        const stats = periodMap.get(periode);
        monthData.push({
            periode: periode,
            naik: stats.naik,
            turun: stats.turun,
            tidak: stats.tidak,
            total: stats.total,
            totalTransaksi: stats.totalTransaksi,
            upline: stats.uplineSet.size
        });
    });
    
    if (monthData.length === 0) {
        showNotifTop('⚠️ Belum ada data transaksi untuk ditampilkan', true);
        return;
    }
    
    // ===== BUILD HTML =====
    let rowsHtml = monthData.map((item, index) => {
        const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
        return `
            <tr style="background: ${bgColor}; border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px 12px; font-weight: 600; color: #1f2937;">${escapeHtml(item.periode)}</td>
                <td style="padding: 8px 12px; text-align: center; color: #10b981;">${item.naik}</td>
                <td style="padding: 8px 12px; text-align: center; color: #ef4444;">${item.turun}</td>
                <td style="padding: 8px 12px; text-align: center; color: #6b7280;">${item.tidak}</td>
                <td style="padding: 8px 12px; text-align: center; font-weight: 700; color: #4f46e5;">${item.total}</td>
                <td style="padding: 8px 12px; text-align: center; color: #8b5cf6;">${item.totalTransaksi.toLocaleString()}</td>
                <td style="padding: 8px 12px; text-align: center; color: #059669;">${item.upline}</td>
            </tr>
        `;
    }).join('');
    
    const modalHtml = `
        <div class="modal-content" style="max-width: 750px; max-height: 85vh; overflow-y: auto;">
            <div style="padding: 20px 24px 0; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="font-size: 20px; margin: 0; color: #1f2937;">📊 Detail Per Bulan</h3>
                <button onclick="closeModal('detailModal')" style="
                    background: none;
                    border: none;
                    font-size: 28px;
                    cursor: pointer;
                    color: #6b7280;
                    padding: 0 4px;
                    line-height: 1;
                " onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#6b7280'">✕</button>
            </div>
            <div class="modal-subtitle" style="font-size: 13px; color: #6b7280; padding: 0 24px 12px; border-bottom: 1px solid #f0f0f0;">
                Data per bulan dari Database Transaksi
            </div>
            
            <div style="padding: 16px 24px; overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                        <tr style="background: #eef2ff; border-radius: 8px;">
                            <th style="padding: 10px 12px; text-align: left; color: #4f46e5; font-weight: 700;">📅 Bulan</th>
                            <th style="padding: 10px 12px; text-align: center; color: #10b981; font-weight: 700;">📈 Naik</th>
                            <th style="padding: 10px 12px; text-align: center; color: #ef4444; font-weight: 700;">📉 Turun</th>
                            <th style="padding: 10px 12px; text-align: center; color: #6b7280; font-weight: 700;">🚫 Tidak</th>
                            <th style="padding: 10px 12px; text-align: center; color: #4f46e5; font-weight: 700;">📊 Total</th>
                            <th style="padding: 10px 12px; text-align: center; color: #8b5cf6; font-weight: 700;">💰 Transaksi</th>
                            <th style="padding: 10px 12px; text-align: center; color: #059669; font-weight: 700;">👥 Upline</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
            
            <div class="modal-buttons" style="padding: 16px 24px 24px; border-top: 1px solid #e5e7eb;">
                <button onclick="closeModal('detailModal')" class="btn-primary" style="flex: 1; padding: 12px; border: none; border-radius: 14px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #4f46e5, #6366f1); color: white;">Tutup</button>
            </div>
        </div>
    `;
    
    document.getElementById('detailContent').innerHTML = modalHtml;
    showModal('detailModal');
    applyDarkModeToModal(document.getElementById('detailModal'));
}

// ===== SIMPAN DATA RIWAYAT UNTUK CHART =====
function updateRiwayatDataForChart(data) {
    window._riwayatData = data || [];
    // Hanya update chart, tidak perlu generate ulang
    updateTrendChart();
}

// ========== LOAD RIWAYAT TRANSAKSI ==========
async function loadRiwayatTransaksi() {
    if (!currentUser) {
        console.warn('loadRiwayatTransaksi: No user');
        return;
    }
    
    try {
        const { data, error } = await window.db
            .from('riwayat_transaksi_bulanan')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('tahun', { ascending: false })
            .order('bulan_index', { ascending: false });
        
        if (error) {
            console.error('❌ Gagal load riwayat:', error);
            window._riwayatData = [];
            updateTrendChart();
            renderRiwayatTransaksi([]);
            return;
        }
        
        // ===== SIMPAN DATA GLOBAL =====
        window._riwayatData = data || [];
        
        // ===== UPDATE CHART =====
        updateTrendChart();
        
        // ===== RENDER LIST =====
        renderRiwayatTransaksi(data || []);
        
        if (DEBUG) console.log(`📊 Riwayat dimuat: ${(data || []).length} bulan`);
        
    } catch (err) {
        console.error('❌ Error load riwayat:', err);
        window._riwayatData = [];
        updateTrendChart();
        showNotifTop('⚠️ Gagal memuat riwayat', true);
    }
}

// ========== REFRESH TREND CHART DARI RIWAYAT ==========
function refreshTrendChartFromRiwayat() {
    const riwayatData = window._riwayatData || [];
    
    if (riwayatData.length === 0) {
        showNotifTop('⚠️ Belum ada data riwayat untuk ditampilkan', true);
        return;
    }
    
    updateTrendChart();
    showNotifTop(`✅ Chart diperbarui: ${riwayatData.length} bulan ditampilkan`);
}

// Ekspos ke global
window.refreshTrendChartFromRiwayat = refreshTrendChartFromRiwayat;

// ========== UPDATE TREND CHART BADGE ==========
function updateTrendChartBadge() {
    const badge = document.getElementById('trendChartCount');
    if (!badge) return;
    
    const riwayatData = window._riwayatData || [];
    const count = riwayatData.length;
    badge.innerText = count;
}

// ========== FUNGSI SAVE TARGET ==========
// ========== SAVE TARGET DATA (GLOBAL - HANYA OWNER) ==========
async function saveTargetData() {
    // ===== PERBAIKAN: Cek role =====
    if (currentUserRole !== 'owner') {
        showNotifTop('⚠️ Hanya Owner yang dapat mengelola target!', true);
        return;
    }
    
    const agentVal = parseInt(document.getElementById('targetAgentInput')?.value) || 0;
    const uplineVal = parseInt(document.getElementById('targetUplineInput')?.value) || 0;
    const transaksiVal = parseInt(document.getElementById('targetTransaksiInput')?.value) || 0;
    const selisihVal = parseInt(document.getElementById('targetSelisihInput')?.value) || 0;
    
    const newTarget = { 
        agent: agentVal, 
        upline: uplineVal, 
        transaksi: transaksiVal, 
        selisih: selisihVal, 
        monthlyTargets: targetData.monthlyTargets || [], 
        updated_at: new Date().toISOString() 
    };
    
    try {
        // ===== PERBAIKAN: Hapus filter user_id =====
        const { data: existingData, error: checkError } = await window.db
            .from('settings')
            .select('id')
            .eq('key', 'targetKPI')
            .maybeSingle();
        
        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }
        
        if (existingData) {
            const { error: updateError } = await window.db
                .from('settings')
                .update({ 
                    value: newTarget, 
                    updated_at: new Date().toISOString() 
                })
                .eq('key', 'targetKPI');
            
            if (updateError) throw updateError;
            
        } else {
            const { error: insertError } = await window.db
                .from('settings')
                .insert({ 
                    key: 'targetKPI', 
                    value: newTarget,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            
            if (insertError) throw insertError;
        }
        
        targetData = newTarget;
        showNotifTop('✅ Target berhasil disimpan!');
        closeModal('manageTargetModal');
        await loadTargetData();
        await updateTargetDisplay();
        
    } catch (error) {
        console.error('Error saving target:', error);
        showNotifTop('❌ Gagal menyimpan target: ' + error.message, true);
    }
}

// ================================================================
// ========== BROADCAST TEMPLATE FUNCTIONS ==========
// ================================================================

const TEMPLATE_STORAGE_KEY = 'broadcast_templates';

// Template default dengan variabel baru
const DEFAULT_TEMPLATES = {
    followup: {
        name: '📞 Follow Up',
        message: `Halo {nama},

Kami ingin menindaklanjuti komunikasi sebelumnya.

📋 Data Agent:
🆔 ID Agent: {id_agent}
🏷️ Nama Loket: {nama_loket}
📱 Aplikasi: {apk}
👤 Upline: {upline}

📊 Data Transaksi:
📈 Jenis Progres: {progres_jenis}
💰 Selisih: {selisih}
📅 Periode Lalu: {periode_lalu} - {transaksi_lalu}
📅 Periode Ini: {periode_ini} - {transaksi_ini}

Apakah ada yang bisa kami bantu?

Terima kasih.`
    },
    dihubungi: {
        name: '📞 Dihubungi',
        message: `Halo {nama},

Terima kasih atas waktunya. Kami ingin menanyakan apakah Anda sudah mempertimbangkan penawaran kami?

📋 Data Agent:
🆔 ID Agent: {id_agent}
🏷️ Nama Loket: {nama_loket}
📱 Aplikasi: {apk}

📊 Perkembangan Transaksi:
📈 ${'{progres_jenis}'} - Selisih: ${'{selisih}'}
📅 Periode Lalu: ${'{periode_lalu}'} - ${'{transaksi_lalu}'}
📅 Periode Ini: ${'{periode_ini}'} - ${'{transaksi_ini}'}

Kami tunggu kabar baiknya.`
    },
    closing: {
        name: '📋 Closing',
        message: `Halo {nama},

Selamat! Anda telah berhasil menyelesaikan proses.

📋 Data Agent:
🆔 ID Agent: {id_agent}
🏷️ Nama Loket: {nama_loket}
📱 Aplikasi: {apk}

📊 Perkembangan Transaksi:
📈 ${'{progres_jenis}'} - Selisih: ${'{selisih}'}
📅 Periode Lalu: ${'{periode_lalu}'} - ${'{transaksi_lalu}'}
📅 Periode Ini: ${'{periode_ini}'} - ${'{transaksi_ini}'}

Terima kasih atas kepercayaannya.

Salam sukses!`
    },
    negosiasi: {
        name: '📋 Negosiasi',
        message: `Halo {nama},

Kami ingin menindaklanjuti negosiasi yang sedang berjalan.

📋 Data Agent:
🆔 ID Agent: {id_agent}
🏷️ Nama Loket: {nama_loket}
📱 Aplikasi: {apk}
👤 Upline: {upline}

📊 Data Transaksi:
📈 Jenis Progres: {progres_jenis}
💰 Selisih: {selisih}

Apakah ada yang bisa kami bantu?

Terima kasih.`
    },
    transaksi: {
        name: '📊 Update Transaksi',
        message: `Halo {nama},

Berikut adalah update data transaksi terbaru:

📋 Data Agent:
🆔 ID Agent: {id_agent}
🏷️ Nama Loket: {nama_loket}
📱 Aplikasi: {apk}
👤 Upline: {upline}

📊 Perbandingan Transaksi:
📅 Periode Lalu: {periode_lalu} - {transaksi_lalu}
📅 Periode Ini: {periode_ini} - {transaksi_ini}
📈 Jenis Progres: {progres_jenis}
💰 Selisih: {selisih}

Terima kasih.`
    },
    custom: {
        name: '✏️ Custom',
        message: ''
    }
};

// ================================================================
// ========== KEY UNTUK STORAGE HISTORY ==========
// ================================================================

const BROADCAST_HISTORY_KEY = 'broadcast_history';
const UPLINE_BROADCAST_HISTORY_KEY = 'upline_broadcast_history';

// ================================================================
// ========== LOAD TEMPLATES ==========
// ================================================================
function loadBroadcastTemplates() {
    const select = document.getElementById('templateSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- Pilih Template --</option>';
    
    const savedTemplates = JSON.parse(localStorage.getItem(TEMPLATE_STORAGE_KEY) || '{}');
    const allTemplates = { ...DEFAULT_TEMPLATES, ...savedTemplates };
    
    for (const [key, value] of Object.entries(allTemplates)) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = value.name || key;
        select.appendChild(option);
    }
    
    // ===== TAMBAHKAN OPSI TEMPLATE TRANSAKSI =====
    // Template transaksi sudah ada di DEFAULT_TEMPLATES
}

function loadUplineTemplates() {
    const select = document.getElementById('uplineTemplateSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- Pilih Template --</option>';
    
    const savedTemplates = JSON.parse(localStorage.getItem(TEMPLATE_STORAGE_KEY) || '{}');
    const allTemplates = { ...DEFAULT_TEMPLATES, ...savedTemplates };
    
    for (const [key, value] of Object.entries(allTemplates)) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = value.name || key;
        select.appendChild(option);
    }
}

// ================================================================
// ========== SAVE & DELETE TEMPLATE ==========
// ================================================================

function saveBroadcastTemplate() {
    const message = document.getElementById('broadcastMessage').value;
    const templateName = document.getElementById('templateSelect').value;
    
    if (!message) {
        showNotifTop('⚠️ Pesan tidak boleh kosong!', true);
        return;
    }
    
    let key = templateName;
    let name = '';
    
    if (templateName && templateName !== '') {
        name = prompt('Edit nama template:', templateName);
        if (name === null) return;
        key = name.toLowerCase().replace(/\s/g, '_');
    } else {
        name = prompt('Masukkan nama template:');
        if (!name || name.trim() === '') {
            showNotifTop('⚠️ Nama template tidak boleh kosong!', true);
            return;
        }
        key = name.toLowerCase().replace(/\s/g, '_');
    }
    
    const templates = JSON.parse(localStorage.getItem(TEMPLATE_STORAGE_KEY) || '{}');
    templates[key] = { name: name, message: message };
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
    
    loadBroadcastTemplates();
    document.getElementById('templateSelect').value = key;
    showNotifTop(`✅ Template "${name}" berhasil disimpan!`);
}

function saveUplineTemplate() {
    const message = document.getElementById('uplineBroadcastMessage').value;
    const templateName = document.getElementById('uplineTemplateSelect').value;
    
    if (!message) {
        showNotifTop('⚠️ Pesan tidak boleh kosong!', true);
        return;
    }
    
    let key = templateName;
    let name = '';
    
    if (templateName && templateName !== '') {
        name = prompt('Edit nama template:', templateName);
        if (name === null) return;
        key = name.toLowerCase().replace(/\s/g, '_');
    } else {
        name = prompt('Masukkan nama template:');
        if (!name || name.trim() === '') {
            showNotifTop('⚠️ Nama template tidak boleh kosong!', true);
            return;
        }
        key = name.toLowerCase().replace(/\s/g, '_');
    }
    
    const templates = JSON.parse(localStorage.getItem(TEMPLATE_STORAGE_KEY) || '{}');
    templates[key] = { name: name, message: message };
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
    
    loadUplineTemplates();
    document.getElementById('uplineTemplateSelect').value = key;
    showNotifTop(`✅ Template Upline "${name}" berhasil disimpan!`);
}

function deleteBroadcastTemplate() {
    const templateName = document.getElementById('templateSelect').value;
    if (!templateName || templateName === '') {
        showNotifTop('⚠️ Pilih template yang akan dihapus!', true);
        return;
    }
    if (DEFAULT_TEMPLATES[templateName]) {
        showNotifTop('⚠️ Template default tidak bisa dihapus!', true);
        return;
    }
    if (!confirm(`Hapus template "${templateName}"?`)) return;
    
    const templates = JSON.parse(localStorage.getItem(TEMPLATE_STORAGE_KEY) || '{}');
    delete templates[templateName];
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
    
    loadBroadcastTemplates();
    document.getElementById('broadcastMessage').value = '';
    showNotifTop(`🗑️ Template berhasil dihapus!`);
}

function deleteUplineTemplate() {
    const templateName = document.getElementById('uplineTemplateSelect').value;
    if (!templateName || templateName === '') {
        showNotifTop('⚠️ Pilih template yang akan dihapus!', true);
        return;
    }
    if (DEFAULT_TEMPLATES[templateName]) {
        showNotifTop('⚠️ Template default tidak bisa dihapus!', true);
        return;
    }
    if (!confirm(`Hapus template upline "${templateName}"?`)) return;
    
    const templates = JSON.parse(localStorage.getItem(TEMPLATE_STORAGE_KEY) || '{}');
    delete templates[templateName];
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
    
    loadUplineTemplates();
    document.getElementById('uplineBroadcastMessage').value = '';
    showNotifTop(`🗑️ Template Upline berhasil dihapus!`);
}

// ================================================================
// ========== LOAD TEMPLATE ==========
// ================================================================

function loadBroadcastTemplate() {
    const templateName = document.getElementById('templateSelect').value;
    if (!templateName) {
        document.getElementById('broadcastMessage').value = '';
        return;
    }
    const templates = JSON.parse(localStorage.getItem(TEMPLATE_STORAGE_KEY) || '{}');
    if (templates[templateName]) {
        document.getElementById('broadcastMessage').value = templates[templateName].message;
        return;
    }
    if (DEFAULT_TEMPLATES[templateName]) {
        document.getElementById('broadcastMessage').value = DEFAULT_TEMPLATES[templateName].message;
    }
}

function loadUplineTemplate() {
    const templateName = document.getElementById('uplineTemplateSelect').value;
    if (!templateName) {
        document.getElementById('uplineBroadcastMessage').value = '';
        return;
    }
    const templates = JSON.parse(localStorage.getItem(TEMPLATE_STORAGE_KEY) || '{}');
    if (templates[templateName]) {
        document.getElementById('uplineBroadcastMessage').value = templates[templateName].message;
        return;
    }
    if (DEFAULT_TEMPLATES[templateName]) {
        document.getElementById('uplineBroadcastMessage').value = DEFAULT_TEMPLATES[templateName].message;
    }
}

// ================================================================
// ========== SAVE & LOAD BROADCAST HISTORY ==========
// ================================================================

function saveBroadcastHistory(isUpline = false) {
    const key = isUpline ? UPLINE_BROADCAST_HISTORY_KEY : BROADCAST_HISTORY_KEY;
    const data = isUpline ? uplineBroadcastHistory : broadcastHistory;
    
    // Filter hanya data yang belum diproses (pending)
    const pendingData = data.filter(item => item.status === 'success' && item.id && !item.processed);
    
    // Simpan ke localStorage (hanya data pending, akan menimpa yang lama)
    localStorage.setItem(key, JSON.stringify(pendingData));
    
    // Update indicator
    updateBroadcastHistoryIndicator();
}

function loadBroadcastHistory(isUpline = false) {
    const key = isUpline ? UPLINE_BROADCAST_HISTORY_KEY : BROADCAST_HISTORY_KEY;
    const savedData = localStorage.getItem(key);
    
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
                if (isUpline) {
                    // Gabungkan dengan data yang sudah ada (jika ada)
                    const existingIds = new Set(uplineBroadcastHistory.map(item => item.id));
                    const newItems = parsedData.filter(item => !existingIds.has(item.id));
                    uplineBroadcastHistory = [...uplineBroadcastHistory, ...newItems];
                } else {
                    const existingIds = new Set(broadcastHistory.map(item => item.id));
                    const newItems = parsedData.filter(item => !existingIds.has(item.id));
                    broadcastHistory = [...broadcastHistory, ...newItems];
                }
                updateBroadcastHistoryIndicator();
                return true;
            }
        } catch (e) {
            console.error('Error loading history:', e);
        }
    }
    updateBroadcastHistoryIndicator();
    return false;
}

function clearBroadcastHistory(isUpline = false) {
    const key = isUpline ? UPLINE_BROADCAST_HISTORY_KEY : BROADCAST_HISTORY_KEY;
    localStorage.removeItem(key);
    if (isUpline) {
        uplineBroadcastHistory = uplineBroadcastHistory.filter(item => item.processed);
    } else {
        broadcastHistory = broadcastHistory.filter(item => item.processed);
    }
    updateBroadcastHistoryIndicator();
}

// ================================================================
// ========== UPDATE BROADCAST HISTORY INDICATOR ==========
// ================================================================

function updateBroadcastHistoryIndicator() {
    // ===== BROADCAST WHATSAPP =====
    const indicator = document.getElementById('broadcastHistoryIndicator');
    const badge = document.getElementById('broadcastPendingBadge');
    const pendingData = broadcastHistory.filter(item => item.status === 'success' && item.id && !item.processed);
    const pendingCount = pendingData.length;
    
    if (pendingCount > 0) {
        if (indicator) {
            indicator.style.display = 'inline-flex';
            indicator.style.alignItems = 'center';
        }
        if (badge) badge.textContent = pendingCount;
    } else {
        if (indicator) indicator.style.display = 'none';
    }
    
    // ===== BROADCAST UPLINE =====
    const uplineIndicator = document.getElementById('uplineBroadcastHistoryIndicator');
    const uplineBadge = document.getElementById('uplineBroadcastPendingBadge');
    const uplinePendingData = uplineBroadcastHistory.filter(item => item.status === 'success' && item.id && !item.processed);
    const uplinePendingCount = uplinePendingData.length;
    
    if (uplinePendingCount > 0) {
        if (uplineIndicator) {
            uplineIndicator.style.display = 'inline-flex';
            uplineIndicator.style.alignItems = 'center';
        }
        if (uplineBadge) uplineBadge.textContent = uplinePendingCount;
    } else {
        if (uplineIndicator) uplineIndicator.style.display = 'none';
    }
}

// ================================================================
// ========== CLOSE BROADCAST HISTORY ==========
// ================================================================

function closeBroadcastHistory() {
    // Simpan history sebelum ditutup
    saveBroadcastHistory(false);
    saveBroadcastHistory(true);
    closeModal('broadcastHistoryModal');
}

// ================================================================
// ========== BROADCAST WHATSAPP FUNCTIONS ==========
// ================================================================

let currentNumbers = [];
let isBroadcasting = false;
let broadcastHistory = [];
let isProcessingHistory = false;

// ========== LOAD BROADCAST NUMBERS ==========
async function loadBroadcastNumbers() {
    if (!currentUser) return;
    
    const sourceType = document.querySelector('input[name="sourceType"]:checked')?.value || 'customer';
    
    const customerFilter = document.getElementById('customerFilterCard');
    const prospekFilter = document.getElementById('prospekFilterCard');
    const customCard = document.getElementById('customNumbersCard');
    
    if (sourceType === 'customer') {
        if (customerFilter) customerFilter.style.display = 'block';
        if (prospekFilter) prospekFilter.style.display = 'none';
        if (customCard) customCard.style.display = 'none';
    } else if (sourceType === 'prospek') {
        if (customerFilter) customerFilter.style.display = 'none';
        if (prospekFilter) prospekFilter.style.display = 'block';
        if (customCard) customCard.style.display = 'none';
    } else {
        if (customerFilter) customerFilter.style.display = 'none';
        if (prospekFilter) prospekFilter.style.display = 'none';
        if (customCard) customCard.style.display = 'block';
    }
    
    if (sourceType === 'custom') {
        const customNumbers = document.getElementById('customNumbers')?.value || '';
        const numbers = customNumbers.split('\n')
            .filter(n => n.trim())
            .map(n => {
                let hp = n.trim();
                hp = formatPhoneNumber(hp); // <-- GUNAKAN FUNGSI FORMAT
                return { 
                    hp: hp, 
                    nama: 'Custom', 
                    source: 'custom',
                    id: null,
                    status: 'custom'
                };
            });
        currentNumbers = numbers;
        updateNumberDisplay();
        return;
    }
    
    let collection = '';
    let statusFilter = [];
    
    if (sourceType === 'customer') {
        collection = 'customers';
        const checkedStatus = document.querySelectorAll('#customerFilterCard input:checked');
        statusFilter = Array.from(checkedStatus).map(cb => cb.value);
        if (statusFilter.length === 0) statusFilter = ['baru', 'followup'];
    } else if (sourceType === 'prospek') {
        collection = 'prospek';
        const checkedStatus = document.querySelectorAll('#prospekFilterCard input:checked');
        statusFilter = Array.from(checkedStatus).map(cb => cb.value);
        if (statusFilter.length === 0) statusFilter = ['Baru', 'Dihubungi'];
    }
    
    if (!collection) return;
    
    let query = window.db.from(collection).select('*');
    if (currentUserRole !== 'owner') {
        query = query.eq('user_id', currentUser.id);
    }
    if (statusFilter.length > 0) {
        query = query.in('status', statusFilter);
    }
    
    const { data, error } = await query;
    if (error) {
        showNotifTop('❌ Gagal memuat nomor: ' + error.message, true);
        return;
    }
    
    // ===== AMBIL DATA TRANSAKSI UNTUK SETIAP AGENT =====
    const transaksiMap = new Map();
    if (sourceType === 'customer') {
        const agentIds = data.filter(item => item.agent_id).map(item => item.agent_id);
        if (agentIds.length > 0) {
            const { data: transaksiData, error: transaksiError } = await window.db
                .from('db_transaksi')
                .select('*')
                .in('agent_id', agentIds);
            
            if (!transaksiError && transaksiData) {
                transaksiData.forEach(t => {
                    transaksiMap.set(t.agent_id, t);
                });
            }
        }
    }
    
    currentNumbers = (data || [])
        .filter(item => item.hp && item.hp !== '+62' && item.hp !== '')
        .map(item => {
            let transaksi = null;
            if (sourceType === 'customer' && item.agent_id) {
                transaksi = transaksiMap.get(item.agent_id) || null;
            }
            
            // ===== FORMAT NOMOR HP =====
            let formattedHp = formatPhoneNumber(item.hp);
            
            return {
                hp: formattedHp, // <-- SIMPAN DALAM FORMAT +62
                nama: item.nama || 'Customer',
                id: item.id,
                source: sourceType,
                status: item.status,
                agent_id: item.agent_id || '',
                apk: item.apk || '',
                upline: item.upline_name || '',
                upline_phone: item.upline_phone || '',
                transaksi: transaksi,
                tipe_agent: item.tipe_agent || ''
            };
        });
    
    updateNumberDisplay();
}

// ========== FORMAT NOMOR HP UNTUK WHATSAPP ==========
function formatPhoneNumber(hp) {
    if (!hp) return '';
    
    // Hapus semua karakter non-digit
    let clean = String(hp).replace(/[^\d+]/g, '');
    
    // Jika sudah ada +, biarkan
    if (clean.startsWith('+')) {
        return clean;
    }
    
    // Hapus leading 0
    clean = clean.replace(/^0+/, '');
    
    // Jika sudah dimulai dengan 62, tambahkan +
    if (clean.startsWith('62')) {
        return '+' + clean;
    }
    
    // Jika dimulai dengan 8 (nomor lokal)
    if (clean.startsWith('8')) {
        return '+62' + clean;
    }
    
    // Fallback: tambahkan +62
    return '+62' + clean;
}

// ========== VALIDASI NOMOR HP ==========
function isValidPhoneNumber(hp) {
    if (!hp) return false;
    const clean = String(hp).replace(/[^\d+]/g, '');
    // Minimal 10 digit setelah +62
    const numberOnly = clean.replace('+', '');
    return numberOnly.length >= 10 && numberOnly.length <= 15;
}

function updateNumberDisplay() {
    document.getElementById('numberCount').innerText = currentNumbers.length;
    document.getElementById('numbersList').innerHTML = currentNumbers.map(item => 
        `<div class="number-item">👤 ${escapeHtml(item.nama)}<br>📞 ${escapeHtml(item.hp)}<br><small style="color:#6b7280;">Status: ${escapeHtml(item.status)}</small></div>`
    ).join('');
}

// ===== SHOW CONTINUE MODAL =====
function showContinueModal(item, current, total) {
    return new Promise((resolve) => {
        const modalHtml = `
            <div class="modal-content" style="max-width: 420px;">
                <h3>📤 Lanjut Broadcast</h3>
                <div class="modal-subtitle">${current} dari ${total}</div>
                <div style="padding: 0 20px 20px;">
                    <div style="background: #eef2ff; padding: 12px; border-radius: 10px; margin-bottom: 16px;">
                        <p style="font-size: 13px; color: #4f46e5; margin: 0;">
                            📤 Pesan dikirim ke <strong>${escapeHtml(item.nama)}</strong>
                        </p>
                        <p style="font-size: 11px; color: #6b7280; margin: 4px 0 0;">
                            📞 ${escapeHtml(item.hp)}
                        </p>
                    </div>
                    <div style="background: #fef3c7; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; border-left: 3px solid #f59e0b;">
                        <p style="font-size: 11px; color: #92400e; margin: 0;">
                            ⚠️ <strong>Konfirmasi:</strong> Apakah pesan berhasil terkirim ke nomor di atas?
                        </p>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <button id="continueSuccessBtn" class="btn-success" style="width: 100%; padding: 12px; border-radius: 12px; border: none; cursor: pointer; font-weight: 600; background: #10b981; color: white;">
                            ✅ Berhasil Terkirim
                        </button>
                        <button id="continueFailedBtn" class="btn-danger" style="width: 100%; padding: 12px; border-radius: 12px; border: none; cursor: pointer; font-weight: 600; background: #ef4444; color: white;">
                            ❌ Gagal Terkirim
                        </button>
                        <button id="continueStopBtn" class="btn-outline" style="width: 100%; padding: 12px; border-radius: 12px; border: none; cursor: pointer; font-weight: 600; background: #f3f4f6; color: #374151;">
                            ⏹️ Hentikan Broadcast
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const modal = createModalWithHighZIndex(modalHtml, () => {
            closeDynamicModal(modal);
            resolve({ status: 'stopped' });
        });
        
        modal.querySelector('#continueSuccessBtn').onclick = () => {
            closeDynamicModal(modal);
            resolve({ status: 'success' });
        };
        
        modal.querySelector('#continueFailedBtn').onclick = () => {
            closeDynamicModal(modal);
            resolve({ status: 'failed' });
        };
        
        modal.querySelector('#continueStopBtn').onclick = () => {
            if (confirm('Hentikan broadcast? Data yang sudah terkirim akan tetap tersimpan di history.')) {
                closeDynamicModal(modal);
                resolve({ status: 'stopped' });
            }
        };
    });
}

// ================================================================
// ========== SHOW BROADCAST HISTORY ==========
// ================================================================

function showBroadcastHistory(isUpline = false) {
    const historyData = isUpline ? uplineBroadcastHistory : broadcastHistory;
    const successCount = historyData.filter(h => h.status === 'success').length;
    const failedCount = historyData.filter(h => h.status === 'failed').length;
    const pendingCount = historyData.filter(h => h.status === 'success' && h.id && !h.processed).length;
    
    document.getElementById('historySuccessCount').innerText = successCount;
    document.getElementById('historyFailedCount').innerText = failedCount;
    document.getElementById('historyTotalCount').innerText = historyData.length;
    document.getElementById('historyPendingCount').innerText = pendingCount;
    
    const list = document.getElementById('broadcastHistoryList');
    if (historyData.length === 0) {
        list.innerHTML = '<p style="text-align:center;padding:20px;color:#9ca3af;">Belum ada data broadcast</p>';
    } else {
        list.innerHTML = historyData.map((item, index) => {
            const isSuccess = item.status === 'success';
            const hasId = !!item.id;
            const isUplineItem = item.source === 'customer_upline' || isUpline;
            const isProcessed = item.processed === true;
            
            // ===== DATA GAGAL =====
            if (!isSuccess) {
                return `
                <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;margin-bottom:4px;border-radius:8px;background:#fef2f2;border-left:3px solid #ef4444;flex-wrap:wrap;">
                    <span style="font-size:14px;">❌</span>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:500;font-size:12px;color:#1f2937;">${escapeHtml(item.nama)}</div>
                        <div style="font-size:10px;color:#6b7280;">📞 ${escapeHtml(item.hp)} | <span style="color:#ef4444;">Gagal Terkirim</span></div>
                        ${item.upline_name ? `<div style="font-size:9px;color:#9ca3af;">👤 Upline: ${escapeHtml(item.upline_name)}</div>` : ''}
                    </div>
                    <span style="font-size:9px;color:#9ca3af;">${item.timestamp ? formatDateDDMMYYYY(item.timestamp) : '-'}</span>
                    <span style="font-size:9px;color:#ef4444;background:#fee2e2;padding:2px 8px;border-radius:12px;">✅ Otomatis ke Nomor Salah</span>
                </div>
            `;
            }
            
            // ===== DATA SUDAH DIPROSES =====
            if (isProcessed) {
                return `
                <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;margin-bottom:4px;border-radius:8px;background:#d1fae5;border-left:3px solid #10b981;flex-wrap:wrap;opacity:0.7;">
                    <span style="font-size:14px;">✅</span>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:500;font-size:12px;color:#1f2937;text-decoration:line-through;">${escapeHtml(item.nama)}</div>
                        <div style="font-size:10px;color:#6b7280;">📞 ${escapeHtml(item.hp)} | <span style="color:#10b981;">Sudah Diproses</span></div>
                        ${item.upline_name ? `<div style="font-size:9px;color:#9ca3af;">👤 Upline: ${escapeHtml(item.upline_name)}</div>` : ''}
                    </div>
                    <span style="font-size:9px;color:#9ca3af;">${item.timestamp ? formatDateDDMMYYYY(item.timestamp) : '-'}</span>
                    <span style="font-size:9px;color:#10b981;background:#d1fae5;padding:2px 8px;border-radius:12px;">✅ Selesai</span>
                </div>
            `;
            }
            
            // ===== DATA SUKSES BELUM DIPROSES =====
            const isCustomer = item.source === 'customer';
            const isProspekItem = item.source === 'prospek';
            const statusAwal = item.status_awal || '';
            
            let actionLabel = '';
            let actionIcon = '';
            let actionId = '';
            
            if (isUplineItem || isCustomer) {
                actionLabel = 'Buka Followup';
                actionIcon = '📞';
                actionId = 'open_followup';
            } else if (isProspekItem) {
                actionLabel = 'Buka Dihubungi';
                actionIcon = '📞';
                actionId = 'open_dihubungi';
            }
            
            if (!actionId) {
                return `
                <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;margin-bottom:4px;border-radius:8px;background:#f0fdf4;border-left:3px solid #10b981;flex-wrap:wrap;">
                    <span style="font-size:14px;">✅</span>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:500;font-size:12px;color:#1f2937;">${escapeHtml(item.nama)}</div>
                        <div style="font-size:10px;color:#6b7280;">📞 ${escapeHtml(item.hp)} | <span style="color:#10b981;">Terkirim</span></div>
                    </div>
                    <span style="font-size:9px;color:#9ca3af;">${item.timestamp ? formatDateDDMMYYYY(item.timestamp) : '-'}</span>
                    <span style="font-size:9px;color:#9ca3af;">Tidak ada tindakan</span>
                </div>
            `;
            }
            
            return `
            <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;margin-bottom:4px;border-radius:8px;background:#f0fdf4;border-left:3px solid #10b981;flex-wrap:wrap;">
                <span style="font-size:14px;">✅</span>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:500;font-size:12px;color:#1f2937;">${escapeHtml(item.nama)}</div>
                    <div style="font-size:10px;color:#6b7280;">📞 ${escapeHtml(item.hp)} | <span style="color:#10b981;">Terkirim</span></div>
                    <div style="font-size:9px;color:#9ca3af;">Status: <strong>${escapeHtml(statusAwal || '-')}</strong></div>
                    ${item.upline_name ? `<div style="font-size:9px;color:#9ca3af;">👤 Upline: ${escapeHtml(item.upline_name)}</div>` : ''}
                </div>
                <button class="btn-action-item btn-primary" data-index="${index}" data-action="${actionId}" style="padding:4px 10px;font-size:10px;border-radius:6px;border:none;cursor:pointer;background:#4f46e5;color:white;font-weight:600;white-space:nowrap;">
                    ${actionIcon} ${actionLabel}
                </button>
                <span style="font-size:9px;color:#9ca3af;">${item.timestamp ? formatDateDDMMYYYY(item.timestamp) : '-'}</span>
            </div>
        `}).join('');
    }
    
    document.getElementById('broadcastHistoryModal').dataset.isUpline = isUpline ? 'true' : 'false';
    showModal('broadcastHistoryModal');
    
    document.querySelectorAll('.btn-action-item').forEach(btn => {
        btn.removeEventListener('click', handleActionClick);
        btn.addEventListener('click', handleActionClick);
    });
}

// ================================================================
// ========== HANDLE TOMBOL TINDAKAN DIKLIK ==========
// ================================================================

async function handleActionClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const btn = e.target;
    const index = parseInt(btn.dataset.index);
    const action = btn.dataset.action;
    const modal = document.getElementById('broadcastHistoryModal');
    const isUpline = modal?.dataset?.isUpline === 'true';
    const historyData = isUpline ? uplineBroadcastHistory : broadcastHistory;
    
    if (isNaN(index) || index >= historyData.length) {
        showNotifTop('❌ Data tidak ditemukan!', true);
        return;
    }
    
    const item = historyData[index];
    if (!item || item.status !== 'success' || !item.id) {
        showNotifTop('❌ Data ini tidak bisa diproses!', true);
        return;
    }
    
    if (item.processed) {
        showNotifTop('⏳ Data sudah diproses sebelumnya!', true);
        return;
    }
    
    btn.disabled = true;
    btn.textContent = '⏳';
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
    
    try {
        if (action === 'open_followup') {
            await openFollowupPopup(item.id);
        } else if (action === 'open_dihubungi') {
            await openDihubungiPopup(item.id);
        }
        
        item.processed = true;
        item.processed_at = new Date().toISOString();
        
        saveBroadcastHistory(isUpline);
        
        showNotifTop(`✅ ${item.nama} berhasil diproses!`);
        showBroadcastHistory(isUpline);
        
    } catch (err) {
        console.error('Error processing action:', err);
        showNotifTop('❌ Gagal: ' + err.message, true);
        btn.disabled = false;
        btn.textContent = action === 'open_followup' ? '📞 Buka Followup' : '📞 Buka Dihubungi';
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    }
}

// ================================================================
// ========== OPEN POPUP FOLLOWUP ==========
// ================================================================

async function openFollowupPopup(id) {
    const { data: customer } = await window.db
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
    
    if (!customer) {
        showNotifTop('❌ Data customer tidak ditemukan!', true);
        return;
    }
    
    const status = customer.status || 'baru';
    
    if (status === 'baru') {
        const newDeadline = addDaysFromToday(1);
        const followupHistory = customer.followup_history || [];
        
        const followupData = {
            terkirim: true,
            dibalas: false,
            pesan: 'Broadcast - Pindah ke Followup',
            balasan: null,
            timestamp: new Date().toISOString(),
            followup_number: followupHistory.length + 1
        };
        
        await window.db.from('customers').update({
            status: 'followup',
            followup_data: followupData,
            followup_history: [...followupHistory, {
                pesan: 'Broadcast - Pindah ke Followup',
                balasan: null,
                timestamp: new Date().toISOString(),
                followup_number: followupHistory.length + 1,
                dibalas: false
            }],
            tanggal: newDeadline,
            pesan_terkirim: 'Broadcast - Pindah ke Followup',
            pesan_dikirim_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }).eq('id', id);
        
        showNotifTop(`✅ ${customer.nama} dipindahkan ke Followup. Deadline +1 hari`);
        await loadCustomers();
        
    } else if (status === 'followup' || status === 'pending' || status === 'closing') {
        if (typeof openFollowupConfirm === 'function') {
            closeModal('broadcastHistoryModal');
            await openFollowupConfirm(id);
            setTimeout(() => {
                showBroadcastHistory(false);
            }, 500);
        } else {
            showNotifTop('❌ Fungsi followup tidak tersedia!', true);
        }
    }
}

// ================================================================
// ========== OPEN POPUP DIHUBUNGI ==========
// ================================================================

async function openDihubungiPopup(id) {
    const { data: prospek } = await window.db
        .from('prospek')
        .select('*')
        .eq('id', id)
        .single();
    
    if (!prospek) {
        showNotifTop('❌ Data prospek tidak ditemukan!', true);
        return;
    }
    
    const status = prospek.status || 'Baru';
    
    if (status === 'Baru') {
        const newDeadline = addDaysFromToday(1);
        const dihubungiHistory = prospek.dihubungi_history || [];
        
        const dihubungiData = {
            terkirim: true,
            dibalas: false,
            pesan: 'Broadcast - Pindah ke Dihubungi',
            balasan: null,
            timestamp: new Date().toISOString(),
            dihubungi_number: dihubungiHistory.length + 1
        };
        
        await window.db.from('prospek').update({
            status: 'Dihubungi',
            dihubungi_data: dihubungiData,
            dihubungi_history: [...dihubungiHistory, {
                pesan: 'Broadcast - Pindah ke Dihubungi',
                balasan: null,
                timestamp: new Date().toISOString(),
                dihubungi_number: dihubungiHistory.length + 1,
                dibalas: false
            }],
            deadline: newDeadline,
            pesan_terkirim: 'Broadcast - Pindah ke Dihubungi',
            pesan_dikirim_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }).eq('id', id);
        
        showNotifTop(`✅ ${prospek.nama} dipindahkan ke Dihubungi. Deadline +1 hari`);
        await loadProspek();
        
    } else if (status === 'Dihubungi' || status === 'Negosiasi' || status === 'Tertarik') {
        if (typeof openProspekDihubungiConfirm === 'function') {
            closeModal('broadcastHistoryModal');
            await openProspekDihubungiConfirm(id);
            setTimeout(() => {
                showBroadcastHistory(false);
            }, 500);
        } else {
            showNotifTop('❌ Fungsi dihubungi tidak tersedia!', true);
        }
    }
}

// ================================================================
// ========== MOVE TO NOMOR SALAH ==========
// ================================================================

async function moveToNomorSalah(id, type, alasan) {
    try {
        let insertData = {};
        
        if (type === 'customer') {
            const { data: customer } = await window.db
                .from('customers')
                .select('*')
                .eq('id', id)
                .single();
            
            if (!customer) return;
            
            insertData = {
                nama: customer.nama || 'Tidak ada nama',
                hp: customer.hp || '',
                alasan: alasan || 'Nomor tidak bisa dihubungi / tidak aktif',
                agent_id: customer.agent_id || null,
                followup_data: customer.followup_data || null,
                user_id: customer.user_id || currentUser.id,
                deleted_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            };
            
            await window.db.from('nomor_salah').insert(insertData);
            await window.db.from('customers').delete().eq('id', id);
            
        } else if (type === 'prospek') {
            const { data: prospek } = await window.db
                .from('prospek')
                .select('*')
                .eq('id', id)
                .single();
            
            if (!prospek) return;
            
            insertData = {
                nama: prospek.nama || 'Tidak ada nama',
                hp: prospek.hp || '',
                alasan: alasan || 'Nomor tidak bisa dihubungi / tidak aktif',
                dihubungi_data: prospek.dihubungi_data || null,
                negosiasi_data: prospek.negosiasi_data || null,
                user_id: prospek.user_id || currentUser.id,
                deleted_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            };
            
            await window.db.from('nomor_salah').insert(insertData);
            await window.db.from('prospek').delete().eq('id', id);
        }
        
        showNotifTop(`📵 Data dipindahkan ke DB Nomor Salah: ${alasan}`);
        await loadDBNomorSalah();
        await loadCustomers();
        await loadProspek();
        
    } catch (err) {
        console.error('Error move to nomor salah:', err);
        showNotifTop('❌ Gagal pindah ke nomor salah: ' + err.message, true);
    }
}

// ================================================================
// ========== SEND BROADCAST ==========
// ================================================================
async function sendBroadcast() {
    if (isBroadcasting) {
        showNotifTop('⏳ Broadcast sedang berjalan...', true);
        return;
    }
    
    const messageTemplate = document.getElementById('broadcastMessage')?.value;
    const sendOneByOne = document.getElementById('sendOneByOne')?.checked;
    
    if (!messageTemplate) {
        showNotifTop('⚠️ Pesan tidak boleh kosong!', true);
        return;
    }
    
    if (currentNumbers.length === 0) {
        showNotifTop('⚠️ Tidak ada nomor tujuan!', true);
        return;
    }
    
    // ===== VALIDASI NOMOR =====
    const invalidNumbers = currentNumbers.filter(item => !isValidPhoneNumber(item.hp));
    if (invalidNumbers.length > 0) {
        console.warn('⚠️ Nomor tidak valid:', invalidNumbers.map(i => i.hp).join(', '));
        if (!confirm(`⚠️ ${invalidNumbers.length} nomor tidak valid. Lanjutkan?`)) {
            return;
        }
    }
    
    // Filter nomor valid
    const validNumbers = currentNumbers.filter(item => isValidPhoneNumber(item.hp));
    if (validNumbers.length === 0) {
        showNotifTop('⚠️ Tidak ada nomor valid!', true);
        return;
    }
    
    if (!confirm(`📢 Kirim broadcast ke ${validNumbers.length} nomor valid? (${currentNumbers.length - validNumbers.length} nomor tidak valid)`)) {
        return;
    }
    
    isBroadcasting = true;
    broadcastHistory = [];
    
    const progress = showFloatingProgress('📢 Broadcast', validNumbers.length);
    let success = 0;
    let failed = 0;
    let stopped = false;
    
    for (let i = 0; i < validNumbers.length; i++) {
        const item = validNumbers[i];
        
        // ===== PERSIAPKAN VARIABEL =====
        let message = messageTemplate;
        
        // Variabel dasar
        message = message.replace(/{nama}/g, item.nama || 'Customer');
        message = message.replace(/{id_agent}/g, item.agent_id || '-');
        message = message.replace(/{nama_loket}/g, item.nama || '-');
        message = message.replace(/{apk}/g, item.apk || '-');
        message = message.replace(/{upline}/g, item.upline || '-');
        message = message.replace(/{upline_phone}/g, item.upline_phone || '-');
        
        // ===== DATA TRANSAKSI =====
        let transaksiData = item.transaksi || null;
        
        if (!transaksiData && item.source === 'customer' && item.agent_id) {
            const { data: tData } = await window.db
                .from('db_transaksi')
                .select('*')
                .eq('agent_id', item.agent_id)
                .maybeSingle();
            if (tData) transaksiData = tData;
        }
        
        if (transaksiData) {
            const jumlah = transaksiData.progres_jumlah || 0;
            let selisihText = '0';
            let progresJenis = 'Normal';
            
            if (transaksiData.progres_jenis === 'tidak_transaksi') {
                selisihText = '0';
                progresJenis = '🚫 Tidak Transaksi';
            } else if (transaksiData.progres_jenis === 'naik') {
                selisihText = '+' + jumlah.toLocaleString();
                progresJenis = '📈 Naik';
            } else if (transaksiData.progres_jenis === 'turun') {
                selisihText = '-' + Math.abs(jumlah).toLocaleString();
                progresJenis = '📉 Turun';
            } else {
                if (jumlah > 0) {
                    selisihText = '+' + jumlah.toLocaleString();
                    progresJenis = '📈 Naik';
                } else if (jumlah < 0) {
                    selisihText = '-' + Math.abs(jumlah).toLocaleString();
                    progresJenis = '📉 Turun';
                } else {
                    selisihText = '0';
                    progresJenis = '⚖️ Normal';
                }
            }
            
            message = message.replace(/{progres_jenis}/g, progresJenis);
            message = message.replace(/{selisih}/g, selisihText);
            message = message.replace(/{transaksi_lalu}/g, (transaksiData.transaksi_bulan_lalu || 0).toLocaleString());
            message = message.replace(/{transaksi_ini}/g, (transaksiData.transaksi_bulan_ini || 0).toLocaleString());
            message = message.replace(/{periode_lalu}/g, transaksiData.periode_bulan_lalu || 'Tidak tersedia');
            message = message.replace(/{periode_ini}/g, transaksiData.periode_bulan_ini || 'Tidak tersedia');
        } else {
            message = message.replace(/{progres_jenis}/g, '-');
            message = message.replace(/{selisih}/g, '-');
            message = message.replace(/{transaksi_lalu}/g, '-');
            message = message.replace(/{transaksi_ini}/g, '-');
            message = message.replace(/{periode_lalu}/g, '-');
            message = message.replace(/{periode_ini}/g, '-');
        }
        
        // ===== KIRIM =====
        // Gunakan nomor yang sudah diformat dengan +62
        const nomor = String(item.hp).replace(/[^\d+]/g, '');
        
        // Pastikan formatnya benar
        let cleanNomor = nomor;
        if (!cleanNomor.startsWith('+')) {
            cleanNomor = cleanNomor.replace(/^0+/, '');
            if (cleanNomor.startsWith('62')) {
                cleanNomor = '+' + cleanNomor;
            } else {
                cleanNomor = '+62' + cleanNomor;
            }
        }
        
        // Validasi terakhir
        if (!isValidPhoneNumber(cleanNomor)) {
            failed++;
            showNotifTop(`⚠️ Nomor tidak valid: ${cleanNomor}`, true);
            continue;
        }
        
        const waUrl = 'https://wa.me/' + encodeURIComponent(cleanNomor) + '?text=' + encodeURIComponent(message);
        window.open(waUrl, '_blank');
        
        let confirmResult;
        if (sendOneByOne) {
            confirmResult = await showContinueModal(item, i + 1, validNumbers.length);
        } else {
            confirmResult = { status: 'success' };
        }
        
        if (confirmResult.status === 'stopped') {
            stopped = true;
            showNotifTop('⏸️ Broadcast dihentikan oleh user');
            break;
        } else if (confirmResult.status === 'success') {
            success++;
            broadcastHistory.push({
                id: item.id,
                nama: item.nama || 'Customer',
                hp: item.hp,
                status: 'success',
                timestamp: new Date().toISOString(),
                source: item.source,
                status_awal: item.status,
                processed: false
            });
        } else if (confirmResult.status === 'failed') {
            failed++;
            broadcastHistory.push({
                id: item.id,
                nama: item.nama || 'Customer',
                hp: item.hp,
                status: 'failed',
                timestamp: new Date().toISOString(),
                source: item.source,
                status_awal: item.status,
                processed: true
            });
            
            if (item.id) {
                await moveToNomorSalah(item.id, item.source === 'prospek' ? 'prospek' : 'customer', 'Gagal broadcast');
            }
        }
        
        const percent = Math.floor(((i + 1) / validNumbers.length) * 100);
        progress.update(percent, '📢 Mengirim', `Memproses ${item.nama} (${i + 1}/${validNumbers.length})...`, i + 1, validNumbers.length);
        await delay(300);
    }
    
    progress.update(100, '✅ Selesai', `Berhasil: ${success}, Gagal: ${failed}`, validNumbers.length, validNumbers.length);
    showNotifTop(`✅ Broadcast selesai! Berhasil: ${success}, Gagal: ${failed}`);
    if (failed > 0) {
        showNotifTop(`⚠️ ${failed} nomor gagal dipindahkan ke DB Nomor Salah`, true);
    }
    if (stopped) {
        showNotifTop('⏸️ Broadcast dihentikan sebagian');
    }
    
    isBroadcasting = false;
    setTimeout(() => progress.hide(), 1000);
    
    saveBroadcastHistory(false);
    updateBroadcastHistoryIndicator();
    
    showBroadcastHistory(false);
    
    await loadBroadcastNumbers();
    await loadCustomers();
    await loadProspek();
    await loadDBNomorSalah();
}

// ================================================================
// ========== BROADCAST UPLINE FUNCTIONS ==========
// ================================================================

let uplineDataList = [];
let isUplineBroadcasting = false;
let uplineBroadcastHistory = [];

// ===== LOAD UPLINE NUMBERS =====
async function loadUplineNumbers() {
    if (!currentUser) return;
    
    const sourceType = document.querySelector('input[name="uplineSourceType"]:checked')?.value || 'customer';
    const customerFilter = document.getElementById('uplineCustomerFilter');
    const customCard = document.getElementById('uplineCustomCard');
    const listDiv = document.getElementById('uplineNumbersList');
    const countSpan = document.getElementById('uplineCount');
    
    if (sourceType === 'customer') {
        if (customerFilter) customerFilter.style.display = 'block';
        if (customCard) customCard.style.display = 'none';
    } else {
        if (customerFilter) customerFilter.style.display = 'none';
        if (customCard) customCard.style.display = 'block';
    }
    
    if (sourceType === 'custom') {
        const customNumbers = document.getElementById('uplineCustomNumbers')?.value || '';
        const numbers = customNumbers.split('\n').filter(n => n.trim()).map(n => {
            let phone = formatPhoneNumber(n.trim());
            return {
                upline_phone: phone,
                upline_name: 'Custom',
                agents: [],
                source: 'custom'
            };
        });
        uplineDataList = numbers;
        if (listDiv) {
            if (numbers.length === 0) {
                listDiv.innerHTML = '<p style="color:#9ca3af; padding:20px;">Masukkan nomor tujuan!</p>';
            } else {
                listDiv.innerHTML = numbers.map(num => `
                    <div class="number-item ${isValidPhoneNumber(num.upline_phone) ? '' : 'invalid'}">
                        📞 ${escapeHtml(num.upline_phone)}
                        ${!isValidPhoneNumber(num.upline_phone) ? '<span class="number-warning">⚠️ Tidak valid</span>' : ''}
                    </div>
                `).join('');
            }
        }
        if (countSpan) countSpan.innerText = numbers.length;
        return;
    }
    
    const statusValues = Array.from(document.querySelectorAll('#uplineCustomerFilter input:checked')).map(cb => cb.value);
    if (statusValues.length === 0) {
        showNotifTop('⚠️ Pilih minimal satu status!', true);
        if (listDiv) listDiv.innerHTML = '<p style="color:#ef4444; padding:20px;">⚠️ Silakan pilih minimal satu status terlebih dahulu!</p>';
        if (countSpan) countSpan.innerText = '0';
        return;
    }
    
    let query = window.db.from('customers').select('*');
    if (currentUserRole !== 'owner') {
        query = query.eq('user_id', currentUser.id);
    }
    query = query.in('status', statusValues);
    
    const { data, error } = await query;
    if (error) {
        showNotifTop('❌ Gagal memuat data: ' + error.message, true);
        return;
    }
    
    if (!data || data.length === 0) {
        if (listDiv) listDiv.innerHTML = '<p style="color:#9ca3af; padding:20px;">Tidak ada data dengan filter yang dipilih.</p>';
        if (countSpan) countSpan.innerText = '0';
        return;
    }
    
    const uplineMap = new Map();
    let dataWithoutUpline = 0;
    
    for (const item of data) {
        let uplinePhone = item.upline_phone || '';
        let uplineName = item.upline_name || 'Tidak ada upline';
        
        if (!uplinePhone || uplinePhone === '+62' || uplinePhone === '62' || uplinePhone === '' || uplinePhone === '0') {
            dataWithoutUpline++;
            continue;
        }
        
        // ===== FORMAT NOMOR =====
        uplinePhone = formatPhoneNumber(uplinePhone);
        
        if (!isValidPhoneNumber(uplinePhone)) {
            dataWithoutUpline++;
            continue;
        }
        
        if (!uplineMap.has(uplinePhone)) {
            uplineMap.set(uplinePhone, {
                upline_phone: uplinePhone,
                upline_name: uplineName,
                agents: [],
                source: 'customer_upline'
            });
        }
        
        uplineMap.get(uplinePhone).agents.push({
            agent_id: item.agent_id || '-',
            nama: item.nama || '-',
            hp: item.hp || '-',
            status: item.status || '-',
            id: item.id
        });
    }
    
    uplineDataList = Array.from(uplineMap.values());
    
    if (listDiv) {
        if (uplineDataList.length === 0) {
            listDiv.innerHTML = `
                <p style="color:#ef4444; padding:20px;">⚠️ Tidak ada data upline yang ditemukan!</p>
                <p style="color:#6b7280; font-size: 12px; padding: 0 20px 20px 20px;">
                📌 Pastikan data memiliki field:<br>
                • <strong>upline_phone</strong> (nomor HP upline)<br>
                • <strong>upline_name</strong> (nama upline)<br><br>
                ⏭ Data tanpa upline: ${dataWithoutUpline}
                </p>
            `;
            if (countSpan) countSpan.innerText = '0';
        } else {
            const totalAgent = uplineDataList.reduce((sum, u) => sum + u.agents.length, 0);
            if (countSpan) countSpan.innerText = uplineDataList.length;
            
            listDiv.innerHTML = `
                <div style="background: #eef2ff; padding: 10px; border-radius: 8px; margin-bottom: 12px;">
                    <strong>📊 Ringkasan:</strong><br>
                    Upline: ${uplineDataList.length} | Total Agent: ${totalAgent} | Data tanpa upline: ${dataWithoutUpline}
                </div>
                ${uplineDataList.map(upline => `
                    <div class="number-item upline-item" style="border-bottom: 1px solid #e5e7eb; padding: 12px 0;">
                        <div style="font-weight: 600; color: #8b5cf6;">👤 ${escapeHtml(upline.upline_name)}</div>
                        <div style="font-size: 11px; color: #6b7280;">📞 ${escapeHtml(upline.upline_phone)}</div>
                        <div style="font-size: 11px; margin-top: 6px; background: #f3f4f6; padding: 8px; border-radius: 8px;">
                            <strong>📋 Agent (${upline.agents.length}):</strong><br>
                            ${upline.agents.slice(0, 5).map(agent => 
                                `🆔 ${escapeHtml(agent.agent_id)} - ${escapeHtml(agent.nama)} (${escapeHtml(agent.status)})`
                            ).join('<br>')}
                            ${upline.agents.length > 5 ? `<br>... dan ${upline.agents.length - 5} agent lainnya` : ''}
                        </div>
                    </div>
                `).join('')}
            `;
        }
    }
    
    showNotifTop(`✅ Ditemukan ${uplineDataList.length} Upline dengan total ${uplineDataList.reduce((sum, u) => sum + u.agents.length, 0)} agent`);
}

// ===== INIT UPLINE BROADCAST =====
function initUplineBroadcast() {
    if (DEBUG) console.log('initUplineBroadcast dipanggil');
    
    loadBroadcastHistory(true);
    updateBroadcastHistoryIndicator();
    
    const radioButtons = document.querySelectorAll('input[name="uplineSourceType"]');
    radioButtons.forEach(radio => {
        radio.removeEventListener('change', handleUplineSourceChange);
        radio.addEventListener('change', handleUplineSourceChange);
    });
    
    function handleUplineSourceChange(e) {
        const value = e.target.value;
        const customerFilter = document.getElementById('uplineCustomerFilter');
        const customCard = document.getElementById('uplineCustomCard');
        
        if (customerFilter) customerFilter.style.display = value === 'customer' ? 'block' : 'none';
        if (customCard) customCard.style.display = value === 'custom' ? 'block' : 'none';
        
        loadUplineNumbers();
    }
    
    const customerCheckboxes = document.querySelectorAll('#uplineCustomerFilter input');
    customerCheckboxes.forEach(cb => {
        cb.removeEventListener('change', loadUplineNumbers);
        cb.addEventListener('change', loadUplineNumbers);
    });
    
    const customNumbers = document.getElementById('uplineCustomNumbers');
    if (customNumbers) {
        customNumbers.removeEventListener('input', loadUplineNumbers);
        customNumbers.addEventListener('input', loadUplineNumbers);
    }
    
    const refreshBtn = document.getElementById('refreshUplineBtn');
    if (refreshBtn) {
        refreshBtn.removeEventListener('click', loadUplineNumbers);
        refreshBtn.addEventListener('click', loadUplineNumbers);
    }
    
    const sendBtn = document.getElementById('sendUplineBroadcastBtn');
    if (sendBtn) {
        sendBtn.removeEventListener('click', sendUplineBroadcast);
        sendBtn.addEventListener('click', sendUplineBroadcast);
    }
    
    // ===== LOAD UPLINE TEMPLATES =====
    loadUplineTemplates();
    
    loadUplineNumbers();
}

// ================================================================
// ========== SEND UPLINE BROADCAST ==========
// ================================================================
async function sendUplineBroadcast() {
    if (isUplineBroadcasting) {
        showNotifTop('⏳ Broadcast sedang berjalan...', true);
        return;
    }
    
    const messageTemplate = document.getElementById('uplineBroadcastMessage')?.value;
    const sendOneByOne = document.getElementById('uplineSendOneByOne')?.checked;
    
    if (!messageTemplate) {
        showNotifTop('⚠️ Pesan tidak boleh kosong!', true);
        return;
    }
    
    if (!uplineDataList || uplineDataList.length === 0) {
        showNotifTop('⚠️ Tidak ada data upline! Klik "Refresh Data Upline" terlebih dahulu.', true);
        return;
    }
    
    // ===== VALIDASI NOMOR =====
    const validUpline = uplineDataList.filter(item => isValidPhoneNumber(item.upline_phone));
    if (validUpline.length === 0) {
        showNotifTop('⚠️ Tidak ada nomor upline yang valid!', true);
        return;
    }
    
    const totalAgent = validUpline.reduce((sum, u) => sum + u.agents.length, 0);
    if (!confirm(`⭐ KIRIM BROADCAST KE UPLINE\n\n👥 Upline valid: ${validUpline.length}\n📋 Total Agent: ${totalAgent}\n\nKlik OK untuk melanjutkan.`)) {
        return;
    }
    
    isUplineBroadcasting = true;
    uplineBroadcastHistory = [];
    
    const progress = showFloatingProgress('⭐ Broadcast ke Upline', validUpline.length);
    let success = 0;
    let failed = 0;
    let stopped = false;
    
    for (let i = 0; i < validUpline.length; i++) {
        const upline = validUpline[i];
        
        let message = messageTemplate;
        message = message.replace(/{nama_upline}/g, upline.upline_name);
        message = message.replace(/{total_agent}/g, upline.agents.length);
        
        let tableText = '';
        for (let j = 0; j < upline.agents.length; j++) {
            const agent = upline.agents[j];
            tableText += `${j + 1}. ${agent.nama} (${agent.agent_id}) - ${agent.status}\n`;
        }
        message = message.replace(/{tabel_agent}/g, tableText);
        
        // ===== FORMAT NOMOR =====
        let nomor = String(upline.upline_phone).replace(/[^\d+]/g, '');
        if (!nomor.startsWith('+')) {
            nomor = nomor.replace(/^0+/, '');
            if (nomor.startsWith('62')) {
                nomor = '+' + nomor;
            } else {
                nomor = '+62' + nomor;
            }
        }
        
        // Validasi
        if (!isValidPhoneNumber(nomor)) {
            failed++;
            showNotifTop(`⚠️ Nomor upline tidak valid: ${nomor}`, true);
            continue;
        }
        
        const cleanNomor = nomor.replace(/[^\d+]/g, '');
        const waUrl = 'https://wa.me/' + encodeURIComponent(cleanNomor) + '?text=' + encodeURIComponent(message);
        window.open(waUrl, '_blank');
        
        let confirmResult;
        if (sendOneByOne) {
            confirmResult = await showContinueModal(
                { nama: upline.upline_name, hp: upline.upline_phone }, 
                i + 1, 
                validUpline.length
            );
        } else {
            confirmResult = { status: 'success' };
        }
        
        if (confirmResult.status === 'stopped') {
            stopped = true;
            showNotifTop('⏸️ Broadcast dihentikan oleh user');
            break;
        } else if (confirmResult.status === 'success') {
            success++;
            upline.agents.forEach(agent => {
                uplineBroadcastHistory.push({
                    id: agent.id,
                    nama: agent.nama,
                    hp: agent.hp,
                    status: 'success',
                    timestamp: new Date().toISOString(),
                    source: 'customer_upline',
                    status_awal: agent.status,
                    upline_name: upline.upline_name,
                    processed: false
                });
            });
        } else if (confirmResult.status === 'failed') {
            failed++;
            upline.agents.forEach(agent => {
                uplineBroadcastHistory.push({
                    id: agent.id,
                    nama: agent.nama,
                    hp: agent.hp,
                    status: 'failed',
                    timestamp: new Date().toISOString(),
                    source: 'customer_upline',
                    status_awal: agent.status,
                    upline_name: upline.upline_name,
                    processed: true
                });
            });
            
            for (const agent of upline.agents) {
                if (agent.id) {
                    await moveToNomorSalah(agent.id, 'customer', 'Gagal broadcast upline');
                }
            }
        }
        
        const percent = Math.floor(((i + 1) / validUpline.length) * 100);
        progress.update(percent, '⭐ Mengirim', `Mengirim ke ${upline.upline_name} (${i + 1}/${validUpline.length})...`, i + 1, validUpline.length);
        await delay(300);
    }
    
    progress.update(100, '✅ Selesai', `Berhasil: ${success}, Gagal: ${failed}`, validUpline.length, validUpline.length);
    showNotifTop(`✅ Broadcast ke Upline selesai! Terkirim ke ${success} upline, Gagal: ${failed}`);
    if (failed > 0) {
        showNotifTop(`⚠️ ${failed} data gagal dipindahkan ke DB Nomor Salah`, true);
    }
    if (stopped) {
        showNotifTop('⏸️ Broadcast dihentikan sebagian');
    }
    
    isUplineBroadcasting = false;
    setTimeout(() => progress.hide(), 1000);
    
    saveBroadcastHistory(true);
    updateBroadcastHistoryIndicator();
    
    showBroadcastHistory(true);
    
    await loadCustomers();
    await loadDBNomorSalah();
    await loadUplineNumbers();
}

// ===== INIT UPLINE BROADCAST =====
function initUplineBroadcast() {
    if (DEBUG) console.log('initUplineBroadcast dipanggil');
    
    loadBroadcastHistory(true);
    updateBroadcastHistoryIndicator();
    
    const radioButtons = document.querySelectorAll('input[name="uplineSourceType"]');
    radioButtons.forEach(radio => {
        radio.removeEventListener('change', handleUplineSourceChange);
        radio.addEventListener('change', handleUplineSourceChange);
    });
    
    function handleUplineSourceChange(e) {
        const value = e.target.value;
        const customerFilter = document.getElementById('uplineCustomerFilter');
        const customCard = document.getElementById('uplineCustomCard');
        
        if (customerFilter) customerFilter.style.display = value === 'customer' ? 'block' : 'none';
        if (customCard) customCard.style.display = value === 'custom' ? 'block' : 'none';
        
        loadUplineNumbers();
    }
    
    const customerCheckboxes = document.querySelectorAll('#uplineCustomerFilter input');
    customerCheckboxes.forEach(cb => {
        cb.removeEventListener('change', loadUplineNumbers);
        cb.addEventListener('change', loadUplineNumbers);
    });
    
    const customNumbers = document.getElementById('uplineCustomNumbers');
    if (customNumbers) {
        customNumbers.removeEventListener('input', loadUplineNumbers);
        customNumbers.addEventListener('input', loadUplineNumbers);
    }
    
    const refreshBtn = document.getElementById('refreshUplineBtn');
    if (refreshBtn) {
        refreshBtn.removeEventListener('click', loadUplineNumbers);
        refreshBtn.addEventListener('click', loadUplineNumbers);
    }
    
    const sendBtn = document.getElementById('sendUplineBroadcastBtn');
    if (sendBtn) {
        sendBtn.removeEventListener('click', sendUplineBroadcast);
        sendBtn.addEventListener('click', sendUplineBroadcast);
    }
    
    loadUplineNumbers();
}

// ================================================================
// ========== LOAD ALL TEMPLATES & HISTORY ==========
// ================================================================

function loadAllTemplates() {
    loadBroadcastTemplates();
    loadUplineTemplates();
    
    loadBroadcastHistory(false);
    loadBroadcastHistory(true);
    updateBroadcastHistoryIndicator();
}

// ================================================================
// ========== INIT BROADCAST PAGE ==========
// ================================================================

function initBroadcastPage() {
    loadBroadcastHistory(false);
    loadBroadcastHistory(true);
    updateBroadcastHistoryIndicator();
    loadBroadcastTemplates();
    loadUplineTemplates();
}

// ========== SEARCH FUNCTIONS ==========
async function performSearch() {
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!keyword) {
        showNotifTop('⚠️ Masukkan kata kunci pencarian!', true);
        return;
    }
    
    const searchCustomer = document.getElementById('searchCustomer')?.checked || false;
    const searchProspek = document.getElementById('searchProspek')?.checked || false;
    const searchClosing = document.getElementById('searchClosing')?.checked || false;
    const searchTidak = document.getElementById('searchTidak')?.checked || false;
    const searchNomorSalah = document.getElementById('searchNomorSalah')?.checked || false;
    const searchCommitment = document.getElementById('searchCommitment')?.checked || false;
    
    const results = [];
    
    if (searchCustomer) {
        customersData.forEach(item => {
            if (item.nama?.toLowerCase().includes(keyword) || item.hp?.includes(keyword) || item.agent_id?.toLowerCase().includes(keyword)) {
                results.push({ id: item.id, type: 'customer', title: item.nama, subtitle: item.hp, badge: 'Followup Agen', badgeClass: 'badge-customer' });
            }
        });
    }
    
    if (searchProspek) {
        prospekData.forEach(item => {
            if (item.nama?.toLowerCase().includes(keyword) || item.hp?.includes(keyword)) {
                results.push({ id: item.id, type: 'prospek', title: item.nama, subtitle: item.hp, badge: 'Prospek Agen', badgeClass: 'badge-prospek' });
            }
        });
    }
    
    const resultsContainer = document.getElementById('searchResults');
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p style="text-align:center;padding:40px;color:#9ca3af;">🔍 Tidak ada data yang ditemukan</p>';
        return;
    }
    
    resultsContainer.innerHTML = results.map(result => `
        <div class="search-result-item" data-id="${result.id}" data-type="${result.type}">
            <div class="search-result-info">
                <h4>${escapeHtml(result.title)}</h4>
                <p>${escapeHtml(result.subtitle)}</p>
            </div>
            <span class="search-result-badge ${result.badgeClass}">${result.badge}</span>
        </div>
    `).join('');
    
    document.querySelectorAll('.search-result-item').forEach(el => {
        el.onclick = () => {
            const id = el.dataset.id;
            const type = el.dataset.type;
            if (type === 'customer') openDetailCustomer(id);
            else if (type === 'prospek') openDetailProspek(id);
            else openDBDetailModal(id, type);
        };
    });
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '<p style="text-align:center;padding:40px;color:#9ca3af;">🔍 Masukkan kata kunci untuk mencari data</p>';
}

// ========== OPEN DB DETAIL MODAL (UNTUK SEMUA DATABASE) ==========
function openDBDetailModal(id, type) {
    let collectionName = '';
    let title = '';
    let isClosing = false;
    
    switch (type) {
        case 'closing':
            collectionName = 'db_closing';
            title = '📊 Detail Database Closing';
            isClosing = true;
            break;
        case 'tidak':
            collectionName = 'db_tidak_tertarik';
            title = '📊 Detail Database Tidak Tertarik';
            break;
        case 'nomor_salah':
            collectionName = 'nomor_salah';
            title = '📊 Detail Database Nomor Salah';
            break;
        case 'commitment':
            collectionName = 'db_commitment';
            title = '📊 Detail Database Commitment';
            break;
        case 'db_agent':
            collectionName = 'db_agent';
            title = '📊 Detail Database Agent';
            break;
        default:
            return;
    }
    
    window.db.from(collectionName).select('*').eq('id', id).single().then(async ({ data: d, error }) => {
        if (error || !d) {
            console.error('Error loading data:', error);
            showNotifTop('❌ Gagal memuat data', true);
            return;
        }
        
        let ownerInfo = '';
        if (currentUserRole === 'owner' && d.user_id !== currentUser.id) {
            try {
                const { data: userDoc } = await window.db.from('users').select('nama').eq('id', d.user_id).single();
                const ownerName = userDoc?.nama || 'CS Agent';
                ownerInfo = `<div class="info-row"><span class="label">👤 Pemilik Data</span><span class="value">${escapeHtml(ownerName)}</span></div>`;
            } catch(e) { console.error(e); }
        }
        
        // ===== BUILD BODY HTML =====
        let bodyHTML = `<div class="info-card"><div class="card-title">📋 Informasi</div>`;
        
        if (type === 'closing') {
            const dateStr = d.closing_date ? formatDateDDMMYYYY(d.closing_date) : '-';
            bodyHTML += `
                <div class="info-row"><span class="label">👤 Nama</span><span class="value">${escapeHtml(d.nama)}</span></div>
                <div class="info-row"><span class="label">📱 Nomor WA</span><span class="value">${escapeHtml(d.hp)}</span></div>
                ${d.agent_id ? `<div class="info-row"><span class="label">🆔 ID Agent</span><span class="value">${escapeHtml(d.agent_id)}</span></div>` : ''}
                ${d.apk ? `<div class="info-row"><span class="label">📱 Aplikasi</span><span class="value">${escapeHtml(d.apk)}</span></div>` : ''}
                ${d.upline_name ? `<div class="info-row"><span class="label">👤 Upline</span><span class="value">${escapeHtml(d.upline_name)}</span></div>` : ''}
                ${d.upline_phone ? `<div class="info-row"><span class="label">📞 No. Upline</span><span class="value">${escapeHtml(d.upline_phone)}</span></div>` : ''}
                <div class="info-row"><span class="label">📅 Tanggal Closing</span><span class="value">${dateStr}</span></div>
                <div class="info-row" style="border-bottom: none;"><span class="label">📝 Catatan Closing</span><span class="value">${escapeHtml(d.closing_note || '-')}</span></div>
            `;
            
            // Transaksi data untuk closing
            if (isClosing && (d.transaksi_bulan_lalu !== undefined || d.transaksi_bulan_ini !== undefined)) {
                const periodeLalu = d.periode_bulan_lalu || 'Tidak tersedia';
                const periodeIni = d.periode_bulan_ini || 'Tidak tersedia';
                const jenis = d.progres_jenis || 'normal';
                const jumlah = d.progres_jumlah || 0;
                
                let jenisColor = '#f59e0b';
                let jenisText = '⚖️ Normal';
                let displayValue = '0';
                
                if (jenis === 'naik') {
                    jenisColor = '#10b981';
                    jenisText = '📈 Naik';
                    displayValue = '+' + jumlah.toLocaleString();
                } else if (jenis === 'turun') {
                    jenisColor = '#ef4444';
                    jenisText = '📉 Turun';
                    displayValue = '-' + Math.abs(jumlah).toLocaleString();
                } else if (jenis === 'tidak_transaksi') {
                    jenisColor = '#6b7280';
                    jenisText = '🚫 Tidak Transaksi';
                    displayValue = '0';
                } else {
                    if (jumlah > 0) {
                        displayValue = '+' + jumlah.toLocaleString();
                        jenisColor = '#10b981';
                    } else if (jumlah < 0) {
                        displayValue = '-' + Math.abs(jumlah).toLocaleString();
                        jenisColor = '#ef4444';
                    } else {
                        displayValue = '0';
                        jenisColor = '#f59e0b';
                    }
                }
                
                bodyHTML += `
                    </div>
                    <div class="info-card">
                        <div class="card-title">📊 Data Perbandingan Transaksi</div>
                        <div class="comparison-grid">
                            <div class="comparison-item">
                                <div class="comparison-label">PERIODE LALU</div>
                                <div class="comparison-value">${(d.transaksi_bulan_lalu || 0).toLocaleString()}</div>
                                <div class="comparison-period">${periodeLalu}</div>
                            </div>
                            <div class="comparison-item">
                                <div class="comparison-label">PERIODE INI</div>
                                <div class="comparison-value">${(d.transaksi_bulan_ini || 0).toLocaleString()}</div>
                                <div class="comparison-period">${periodeIni}</div>
                            </div>
                        </div>
                        <div class="selisih-row">
                            Selisih: <strong style="color: ${jenisColor};">${displayValue}</strong>
                            <span style="font-size: 11px; margin-left: 8px; background: ${jenis === 'naik' ? '#d1fae5' : jenis === 'turun' ? '#fee2e2' : '#fef3c7'}; padding: 2px 10px; border-radius: 20px;">${jenisText}</span>
                        </div>
                    </div>
                    <div class="info-card"><div class="card-title">📋 Informasi</div>
                `;
            }
            
            bodyHTML += `${ownerInfo}</div>`;
            
        } else if (type === 'tidak') {
            const dateStr = d.tanggal ? formatDateDDMMYYYY(d.tanggal) : '-';
            bodyHTML += `
                <div class="info-row"><span class="label">👤 Nama</span><span class="value">${escapeHtml(d.nama)}</span></div>
                <div class="info-row"><span class="label">📱 Nomor WA</span><span class="value">${escapeHtml(d.hp)}</span></div>
                <div class="info-row"><span class="label">📅 Tanggal Pindah</span><span class="value">${dateStr}</span></div>
                <div class="info-row"><span class="label">📌 Status Sebelumnya</span><span class="value">${escapeHtml(d.status_sebelumnya || 'Negosiasi')}</span></div>
                ${d.upline_name ? `<div class="info-row"><span class="label">👤 Upline</span><span class="value">${escapeHtml(d.upline_name)}</span></div>` : ''}
                ${d.upline_phone ? `<div class="info-row"><span class="label">📞 No. Upline</span><span class="value">${escapeHtml(d.upline_phone)}</span></div>` : ''}
                <div class="info-row" style="border-bottom: none;">
                    <span class="label">❌ Alasan Tidak Tertarik</span>
                    <span class="value" style="color: #dc2626; font-weight: 600;">${escapeHtml(d.alasan || 'Tidak tertarik')}</span>
                </div>
            `;
            
            // Dihubungi data
            if (d.dihubungi_data) {
                bodyHTML += `
                    </div>
                    <div class="info-card">
                        <div class="card-title">✅ Dihubungi</div>
                        <div class="info-row"><span class="label">Terkirim</span><span class="value">${d.dihubungi_data.terkirim ? '✅ Ya' : '❌ Tidak'}</span></div>
                        <div class="info-row"><span class="label">Dibalas</span><span class="value">${d.dihubungi_data.dibalas ? '✅ Ya' : '❌ Tidak'}</span></div>
                        <div class="info-row"><span class="label">Pesan</span><span class="value" style="font-size: 12px;">${escapeHtml(d.dihubungi_data.pesan || '-')}</span></div>
                        <div class="info-row" style="border-bottom: none;"><span class="label">Balasan</span><span class="value" style="font-size: 12px;">${escapeHtml(d.dihubungi_data.balasan || '-')}</span></div>
                    </div>
                `;
            }
            
            // Negosiasi data
            if (d.negosiasi_data) {
                const nd = d.negosiasi_data;
                bodyHTML += `
                    <div class="info-card">
                        <div class="card-title">📋 Data Negosiasi</div>
                        <div class="info-row"><span class="label">Aplikasi</span><span class="value">${escapeHtml(nd.aplikasi || '-')}</span></div>
                        <div class="info-row"><span class="label">Domisili</span><span class="value">${escapeHtml(nd.domisili || '-')}</span></div>
                        <div class="info-row"><span class="label">Transaksi</span><span class="value">${escapeHtml(nd.transaksi || '-')}</span></div>
                        <div class="info-row"><span class="label">Deposit</span><span class="value">${escapeHtml(nd.deposit || '-')}</span></div>
                        <div class="info-row"><span class="label">Tertarik</span><span class="value">${escapeHtml(nd.tertarik || '-')}</span></div>
                        <div class="info-row" style="border-bottom: none;"><span class="label">Penawaran</span><span class="value">${escapeHtml(nd.penawaran || '-')}</span></div>
                    </div>
                `;
            }
            
            bodyHTML += `<div class="info-card">${ownerInfo}</div>`;
            
        } else if (type === 'nomor_salah') {
            const dateStr = d.deleted_at ? formatDateDDMMYYYY(d.deleted_at) : '-';
            bodyHTML += `
                <div class="info-row"><span class="label">👤 Nama</span><span class="value">${escapeHtml(d.nama)}</span></div>
                <div class="info-row"><span class="label">📱 Nomor WA</span><span class="value">${escapeHtml(d.hp)}</span></div>
                <div class="info-row"><span class="label">📅 Tanggal Dihapus</span><span class="value">${dateStr}</span></div>
                <div class="info-row" style="border-bottom: none;"><span class="label">📵 Alasan</span><span class="value">${escapeHtml(d.alasan || 'Nomor tidak bisa dihubungi')}</span></div>
            `;
            
            // Followup data
            if (d.followup_data) {
                bodyHTML += `
                    </div>
                    <div class="info-card">
                        <div class="card-title">✅ Follow Up</div>
                        <div class="info-row"><span class="label">Terkirim</span><span class="value">${d.followup_data.terkirim ? '✅ Ya' : '❌ Tidak'}</span></div>
                        <div class="info-row"><span class="label">Dibalas</span><span class="value">${d.followup_data.dibalas ? '✅ Ya' : '❌ Tidak'}</span></div>
                        <div class="info-row"><span class="label">Pesan</span><span class="value" style="font-size: 12px;">${escapeHtml(d.followup_data.pesan || '-')}</span></div>
                        <div class="info-row" style="border-bottom: none;"><span class="label">Balasan</span><span class="value" style="font-size: 12px;">${escapeHtml(d.followup_data.balasan || '-')}</span></div>
                    </div>
                `;
            }
            
            if (d.dihubungi_data) {
                bodyHTML += `
                    <div class="info-card">
                        <div class="card-title">✅ Dihubungi</div>
                        <div class="info-row"><span class="label">Terkirim</span><span class="value">${d.dihubungi_data.terkirim ? '✅ Ya' : '❌ Tidak'}</span></div>
                        <div class="info-row"><span class="label">Dibalas</span><span class="value">${d.dihubungi_data.dibalas ? '✅ Ya' : '❌ Tidak'}</span></div>
                        <div class="info-row"><span class="label">Pesan</span><span class="value" style="font-size: 12px;">${escapeHtml(d.dihubungi_data.pesan || '-')}</span></div>
                        <div class="info-row" style="border-bottom: none;"><span class="label">Balasan</span><span class="value" style="font-size: 12px;">${escapeHtml(d.dihubungi_data.balasan || '-')}</span></div>
                    </div>
                `;
            }
            
            bodyHTML += `<div class="info-card">${ownerInfo}</div>`;
            
        } else if (type === 'commitment') {
            const dateStr = d.committed_at ? formatDateDDMMYYYY(d.committed_at) : '-';
            const followupDate = d.followup_date ? formatDateDDMMYYYY(d.followup_date) : '-';
            bodyHTML += `
                <div class="info-row"><span class="label">👤 Nama</span><span class="value">${escapeHtml(d.nama)}</span></div>
                <div class="info-row"><span class="label">📱 Nomor WA</span><span class="value">${escapeHtml(d.hp)}</span></div>
                <div class="info-row"><span class="label">🆔 ID Agent</span><span class="value">${escapeHtml(d.agent_id || '-')}</span></div>
                <div class="info-row"><span class="label">📱 Aplikasi</span><span class="value">${escapeHtml(d.aplikasi || '-')}</span></div>
                <div class="info-row"><span class="label">👤 Upline</span><span class="value">${escapeHtml(d.upline_name || '-')}</span></div>
                <div class="info-row"><span class="label">📞 No. Upline</span><span class="value">${escapeHtml(d.upline_phone || '-')}</span></div>
                <div class="info-row"><span class="label">📅 Tanggal Komitmen</span><span class="value">${dateStr}</span></div>
                <div class="info-row"><span class="label">📅 Followup Date</span><span class="value">${followupDate}</span></div>
                <div class="info-row" style="border-bottom: none;"><span class="label">📝 Catatan</span><span class="value">${escapeHtml(d.commitment_note || '-')}</span></div>
            `;
            
            // Dihubungi data
            if (d.dihubungi_data) {
                bodyHTML += `
                    </div>
                    <div class="info-card">
                        <div class="card-title">✅ Dihubungi</div>
                        <div class="info-row"><span class="label">Terkirim</span><span class="value">${d.dihubungi_data.terkirim ? '✅ Ya' : '❌ Tidak'}</span></div>
                        <div class="info-row"><span class="label">Dibalas</span><span class="value">${d.dihubungi_data.dibalas ? '✅ Ya' : '❌ Tidak'}</span></div>
                        <div class="info-row"><span class="label">Pesan</span><span class="value" style="font-size: 12px;">${escapeHtml(d.dihubungi_data.pesan || '-')}</span></div>
                        <div class="info-row" style="border-bottom: none;"><span class="label">Balasan</span><span class="value" style="font-size: 12px;">${escapeHtml(d.dihubungi_data.balasan || '-')}</span></div>
                    </div>
                `;
            }
            
            // Negosiasi data
            if (d.negosiasi_data) {
                const nd = d.negosiasi_data;
                bodyHTML += `
                    <div class="info-card">
                        <div class="card-title">📋 Data Negosiasi</div>
                        <div class="info-row"><span class="label">Aplikasi</span><span class="value">${escapeHtml(nd.aplikasi || '-')}</span></div>
                        <div class="info-row"><span class="label">Domisili</span><span class="value">${escapeHtml(nd.domisili || '-')}</span></div>
                        <div class="info-row"><span class="label">Transaksi</span><span class="value">${escapeHtml(nd.transaksi || '-')}</span></div>
                        <div class="info-row"><span class="label">Deposit</span><span class="value">${escapeHtml(nd.deposit || '-')}</span></div>
                        <div class="info-row"><span class="label">Tertarik</span><span class="value">${escapeHtml(nd.tertarik || '-')}</span></div>
                        <div class="info-row" style="border-bottom: none;"><span class="label">Penawaran</span><span class="value">${escapeHtml(nd.penawaran || '-')}</span></div>
                    </div>
                `;
            }
            
            bodyHTML += `<div class="info-card">${ownerInfo}</div>`;
        }
        
        // ===== FOOTER BUTTONS =====
        let footerButtons = [
            { label: 'Tutup', class: 'btn-outline', onClick: `closeModalNew('detailModalDB')` }
        ];
        
        if (d.hp) {
            footerButtons.push({ label: '💬 WhatsApp', class: 'btn-success', onClick: `closeModalNew('detailModalDB'); openWA('${d.hp}')` });
        }
        
        if (type === 'nomor_salah') {
            footerButtons.push({ label: '🔄 Kembali ke Followup', class: 'btn-primary', onClick: `closeModalNew('detailModalDB'); restoreToFollowup('${id}')` });
            footerButtons.push({ label: '🔄 Kembali ke Prospek', class: 'btn-primary', onClick: `closeModalNew('detailModalDB'); restoreToProspek('${id}')` });
        }
        
        footerButtons.push({ label: '🗑️ Hapus', class: 'btn-danger', onClick: `closeModalNew('detailModalDB'); deleteDBItem('${collectionName}', '${id}')` });
        
        const footerHTML = footerButtons.map(btn => 
            `<button class="btn ${btn.class}" onclick="${btn.onClick}">${btn.label}</button>`
        ).join('');
        
        // ===== TAMPILKAN MODAL =====
        createModalNew(
            title,
            'Informasi lengkap data',
            bodyHTML,
            footerHTML,
            'detailModalDB'
        );
    }).catch(err => {
        console.error('Error:', err);
        showNotifTop('❌ Gagal memuat detail: ' + err.message, true);
    });
}

// ========== UPDATE STATS & CHARTS ==========
function updateStats() {
    const total = customersData.length;
    const closing = customersData.filter(c => c.status === 'closing').length;
    const active = total - closing;
    
    document.getElementById('totalData').innerText = total;
    document.getElementById('closingTotal').innerText = closing;
    document.getElementById('activeProspek').innerText = active;
    document.getElementById('rateClosing').innerText = total ? Math.round((closing / total) * 100) + '%' : '0%';
}

function updateChartCustomer() {
    const ctx = document.getElementById('chartCustomer');
    if (!ctx) return;
    
    const closing = customersData.filter(c => c.status === 'closing').length;
    const pending = customersData.filter(c => c.status === 'pending').length;
    const followup = customersData.filter(c => c.status === 'followup').length;
    const baru = customersData.length - (closing + pending + followup);
    
    const labels = ['Closing', 'Pending', 'Follow Up', 'Baru'];
    const data = [closing, pending, followup, baru];
    const colors = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];
    
    if (chartCustomer) {
        chartCustomer.destroy();
        chartCustomer = null;
    }
    
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const primaryColor = isDark ? '#818cf8' : '#4f46e5';
    const total = data.reduce((a, b) => a + b, 0);
    
    // ===== BUAT TOTAL LABEL DI ATAS LEGEND =====
    const container = ctx.parentElement;
    let totalEl = container.querySelector('.chart-total-label');
    if (!totalEl) {
        totalEl = document.createElement('div');
        totalEl.className = 'chart-total-label';
        totalEl.style.cssText = `
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 8px !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            margin-bottom: 6px !important;
            padding: 0 4px !important;
            width: 100% !important;
            color: ${textColor} !important;
        `;
        container.insertBefore(totalEl, ctx);
    }
    
    // ===== SET TOTAL LABEL =====
    totalEl.innerHTML = `
        <span style="font-size: 13px; color: ${textColor};">📊 Total Data:</span>
        <span class="total-value" style="font-size: 18px; font-weight: 800; color: ${primaryColor};">${total.toLocaleString()}</span>
    `;
    totalEl.style.color = textColor;
    
    // ===== BUAT CHART =====
    chartCustomer = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: isDark ? '#1e293b' : '#ffffff',
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: { size: 11, weight: '600' },
                        color: textColor,
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 10,
                        boxHeight: 10,
                        generateLabels: function(chart) {
                            const data = chart.data;
                            return data.labels.map((label, i) => {
                                const value = data.datasets[0].data[i];
                                const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return {
                                    text: `${label}  ${percent}%`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    strokeStyle: data.datasets[0].backgroundColor[i],
                                    hidden: false,
                                    index: i
                                };
                            });
                        }
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDark ? '#f1f5f9' : '#1f2937',
                    bodyColor: isDark ? '#cbd5e1' : '#374151',
                    borderColor: isDark ? '#334155' : '#e5e7eb',
                    borderWidth: 1,
                    cornerRadius: 12,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // ===== PASTIKAN LEGEND COLOR DI DARK MODE =====
    chartCustomer.options.plugins.legend.labels.color = textColor;
    chartCustomer.update();
}

function updateChartProspek() {
    const ctx = document.getElementById('chartProspek');
    if (!ctx) return;
    
    const baru = prospekData.filter(p => p.status === 'Baru').length;
    const dihubungi = prospekData.filter(p => p.status === 'Dihubungi').length;
    const negosiasi = prospekData.filter(p => p.status === 'Negosiasi').length;
    const tertarik = prospekData.filter(p => p.status === 'Tertarik').length;
    
    const labels = ['Baru', 'Dihubungi', 'Negosiasi', 'Tertarik'];
    const data = [baru, dihubungi, negosiasi, tertarik];
    const colors = ['#8b5cf6', '#3b82f6', '#f59e0b', '#10b981'];
    
    if (chartProspek) {
        chartProspek.destroy();
        chartProspek = null;
    }
    
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const primaryColor = isDark ? '#818cf8' : '#4f46e5';
    const total = data.reduce((a, b) => a + b, 0);
    
    // ===== BUAT TOTAL LABEL DI ATAS LEGEND =====
    const container = ctx.parentElement;
    let totalEl = container.querySelector('.chart-total-label');
    if (!totalEl) {
        totalEl = document.createElement('div');
        totalEl.className = 'chart-total-label';
        totalEl.style.cssText = `
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 8px !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            margin-bottom: 6px !important;
            padding: 0 4px !important;
            width: 100% !important;
            color: ${textColor} !important;
        `;
        container.insertBefore(totalEl, ctx);
    }
    
    // ===== SET TOTAL LABEL =====
    totalEl.innerHTML = `
        <span style="font-size: 13px; color: ${textColor};">📊 Total Data:</span>
        <span class="total-value" style="font-size: 18px; font-weight: 800; color: ${primaryColor};">${total.toLocaleString()}</span>
    `;
    totalEl.style.color = textColor;
    
    // ===== BUAT CHART =====
    chartProspek = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: isDark ? '#1e293b' : '#ffffff',
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: { size: 11, weight: '600' },
                        color: textColor,
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 10,
                        boxHeight: 10,
                        generateLabels: function(chart) {
                            const data = chart.data;
                            return data.labels.map((label, i) => {
                                const value = data.datasets[0].data[i];
                                const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return {
                                    text: `${label}  ${percent}%`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    strokeStyle: data.datasets[0].backgroundColor[i],
                                    hidden: false,
                                    index: i
                                };
                            });
                        }
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDark ? '#f1f5f9' : '#1f2937',
                    bodyColor: isDark ? '#cbd5e1' : '#374151',
                    borderColor: isDark ? '#334155' : '#e5e7eb',
                    borderWidth: 1,
                    cornerRadius: 12,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // ===== PASTIKAN LEGEND COLOR DI DARK MODE =====
    chartProspek.options.plugins.legend.labels.color = textColor;
    chartProspek.update();
}

// ========== BADGE FUNCTIONS ==========
async function updateDeadlineBadge() {
    if (!currentUser) return;
    const badge = document.getElementById('deadlineCount');
    if (!badge) return;
    
    const today = getTodayDate();
    let overdueCount = 0;
    
    customersData.forEach(c => {
        if (c.tanggal && c.tanggal < today && c.status !== 'closing') overdueCount++;
    });
    prospekData.forEach(p => {
        if (p.deadline && p.deadline < today) overdueCount++;
    });
    
    badge.innerText = overdueCount;
    
    // ===== PERBAIKAN: Update class berdasarkan nilai =====
    if (overdueCount === 0) {
        badge.classList.remove('badge-active');
        badge.classList.add('badge-zero');
    } else {
        badge.classList.remove('badge-zero');
        badge.classList.add('badge-active');
    }
}

async function updatePesanBadge() {
    if (!currentUser) return;
    const badge = document.getElementById('pesanCount');
    if (!badge) return;
    
    const unreadCount = messagesData.filter(m => !m.is_read).length;
    badge.innerText = unreadCount;
    
    // ===== PERBAIKAN: Update class berdasarkan nilai =====
    if (unreadCount === 0) {
        badge.classList.remove('badge-active');
        badge.classList.add('badge-zero');
    } else {
        badge.classList.remove('badge-zero');
        badge.classList.add('badge-active');
    }
}

// ========== AUTH STATE CHANGE LISTENER ==========
function initAuthListener() {
    window.db.auth.onAuthStateChange((event, session) => {
        if (DEBUG) console.log('Auth state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session) {
            // ===== CEK APAKAH SUDAH LOGIN =====
            if (currentUser && currentUser.id === session.user.id) {
                if (DEBUG) console.log('⏳ User sudah login, skip reload');
                return;
            }
            
            // ===== RESET FLAG =====
            isAppInitialized = false;
            isDataLoaded = false;
            isTargetDataLoading = false;
            isTransaksiDataLoaded = false;
            isTransaksiDataLoading = false;
            isRiwayatLoaded = false; // <-- TAMBAHKAN FLAG INI
            
            currentUser = session.user;
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('app').style.display = 'block';
            showNotifTop('✅ Login berhasil!');
            
            // Reload data (hanya jika belum dimuat)
            setTimeout(async () => {
                try {
                    await loadUserProfile();
                    await loadCustomers();
                    await loadProspek();
                    await loadDatabaseAgent();
                    await loadProduk();
                    await loadDbTransaksi();
                    await loadDBClosing();
                    await loadDBTidak();
                    await loadDBNomorSalah();
                    await loadDBCommitment();
                    await loadReminders();
                    await loadMessages();
                    await loadUsersList();
                    await loadTarifAdmin();
                    await loadTargetData();
                    await updateTargetDisplay();
                    await loadTransaksiGlobal();
                    
                    // ===== MUAT RIWAYAT SEKALI =====
                    if (!isRiwayatLoaded) {
                        await loadRiwayatTransaksi();
                        isRiwayatLoaded = true;
                    }
                    
                    isAppInitialized = true;
                    navigateTo('dashboard');
                } catch (err) {
                    console.error('Error reload data:', err);
                }
            }, 500);
            
        } else if (event === 'SIGNED_OUT') {
            // ===== RESET FLAG =====
            isDataLoaded = false;
            isTargetDataLoading = false;
            isTransaksiDataLoaded = false;
            isTransaksiDataLoading = false;
            isAppInitialized = false;
            isRiwayatLoaded = false; // <-- TAMBAHKAN
            
            currentUser = null;
            document.getElementById('loginPage').style.display = 'flex';
            document.getElementById('app').style.display = 'none';
            showNotifTop('👋 Anda telah logout');
            
        } else if (event === 'TOKEN_REFRESHED') {
            if (DEBUG) console.log('Token refreshed successfully');
        } else if (event === 'USER_UPDATED') {
            if (DEBUG) console.log('User updated');
            if (currentUser) {
                loadUserProfile();
            }
        }
    });
}

// ========== CHECK AUTH & START ==========
async function checkAuth() {
    if (isAppInitialized) return;
    showLoading('Memeriksa autentikasi...', true);
    updateLoadingStep(0);
    try {
        const { data: { session }, error } = await window.db.auth.getSession();
        if (session) {
            currentUser = session.user;
            updateLoadingStep(1);
            await loadUserProfile();
            updateLoadingStep(2);
            
            setTimeout(runPhotoCleanup, 3000);
            
            if (!isAppInitialized) {
                // ===== PASTIKAN TRANSAKSI DIMUAT DULU =====
                await loadDbTransaksi();
                
                await Promise.all([
                    loadCustomers(),
                    loadProspek(),
                    loadDatabaseAgent(),
                    loadProduk(),
                    loadDBClosing(),
                    loadDBTidak(),
                    loadDBNomorSalah(),
                    loadDBCommitment(),
                    loadReminders(),
                    loadMessages(),
                    loadTarifAdmin(),
                    loadTransaksiGlobal()
                ]);
                
                await loadMessages();
                // Inisialisasi pesan jika halaman pesan aktif
                if (document.getElementById('pesanPage')?.style.display !== 'none') {
                    if (typeof initPesanPage === 'function') {
                        initPesanPage();
                    }
                }

                // ===== MUAT TARGET =====
                await loadTargetData();
                
                // ===== MUAT RIWAYAT HANYA SEKALI =====
                if (!isRiwayatLoaded) {
                    await loadRiwayatTransaksi();
                    isRiwayatLoaded = true;
                }
                
                updateTrendChart();
                await updateTargetDisplay();
                isAppInitialized = true;
            }

            if (currentUserRole === 'owner') {
                document.getElementById('ownerMenu').style.display = 'block';
                document.getElementById('menuDbAgent').style.display = 'flex';
                document.getElementById('menuDbTransaksi').style.display = 'flex';
                document.getElementById('menuImport').style.display = 'flex';
            } else {
                document.getElementById('ownerMenu').style.display = 'none';
                document.getElementById('menuDbAgent').style.display = 'none';
                document.getElementById('menuDbTransaksi').style.display = 'none';
                document.getElementById('menuImport').style.display = 'none';
            }
            updateTargetAccess();
            updateLogoUser(currentUserName);
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('app').style.display = 'block';
            initFullModeSelection();
            navigateTo('dashboard');
            setTimeout(() => { initBadges(); initDarkMode(); initDarkModeObserver(); }, 100);
            setTimeout(hideLoading, 500);
        } else {
            hideLoading();
            document.getElementById('loginPage').style.display = 'flex';
            document.getElementById('app').style.display = 'none';
        }
    } catch (err) {
        console.error('Check auth error:', err);
        hideLoading();
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
    }
}

// ========== DOM READY ==========
document.addEventListener('DOMContentLoaded', function() {
    // ===== CEK APAKAH SUDAH DIPROSES =====
    if (document._domReadyExecuted) {
        if (DEBUG) console.log('⏳ DOM already processed, skip');
        return;
    }
    document._domReadyExecuted = true;
    
    // ===== INISIALISASI LOGO =====
    function initLogos() {
        // Update favicon
        const faviconLink = document.querySelector("link[rel*='icon']") || document.createElement('link');
        faviconLink.type = 'image/x-icon';
        faviconLink.rel = 'shortcut icon';
        faviconLink.href = LOGO_CONFIG.icon;
        document.head.appendChild(faviconLink);
        
        // Apple touch icon
        const appleLink = document.querySelector("link[rel*='apple-touch-icon']") || document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        appleLink.href = LOGO_CONFIG.icon;
        document.head.appendChild(appleLink);
        
        if (DEBUG) console.log('✅ Logo PROSPEKTA initialized');
    }
    
    // Panggil init logos
    setTimeout(initLogos, 50);

    // ===== RESET FLAG GLOBAL =====
    isDataLoaded = false;
    isTargetDataLoading = false;
    isTransaksiDataLoaded = false;
    isTransaksiDataLoading = false;
    
    // ===== INISIALISASI AUTH LISTENER =====
    initAuthListener();
    
    // ===== INISIALISASI EVENT LISTENERS =====
    initEventListeners();
    
    // ===== CHECK AUTHENTICATION =====
    checkAuth();

    // ===== INISIALISASI SEARCH RIGHT =====
    initSearchRight();
    
    // ===== ANIMASI LOGO BERULANG =====
    setInterval(function() {
        const logo = document.getElementById('logoWrapper');
        if (logo) {
            logo.classList.remove('animate');
            void logo.offsetWidth;
            logo.classList.add('animate');
        }
    }, 5000);
    
    if (DEBUG) console.log('✅ PROSPEKTA loaded successfully');
});

// ================================================================
// ========== FUNGSI TAMBAHAN UNTUK RESET TARGET ==========
// ================================================================

// ===== FUNGSI UNTUK RESET TARGET (jika diperlukan) =====
function resetTargetData() {
    if (DEBUG) console.log('🔄 Reset target data...');
    
    // Reset data target
    targetData = {
        agent: 0,
        upline: 0,
        transaksi: 0,
        selisih: 0,
        monthlyTargets: []
    };
    
    // Reset UI
    const elements = [
        'targetAgentValue', 'targetUplineValue', 'targetTransaksiValue', 'targetSelisihValue',
        'targetAgentReached', 'targetUplineReached', 'targetTransaksiReached', 'targetSelisihReached'
    ];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = '0';
    });
    
    const progressElements = [
        'targetAgentProgress', 'targetUplineProgress', 'targetTransaksiProgress', 'targetSelisihProgress'
    ];
    progressElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.width = '0%';
    });
    
    // Reset chart
    if (targetChart) {
        targetChart.destroy();
        targetChart = null;
    }
    updateTargetChart([0, 0, 0]);
    
    // Reset header
    const headerTarget = document.querySelector('.target-kpi-section .target-header h3');
    if (headerTarget) {
        headerTarget.innerHTML = '🎯 Target & KPI Prospek Agent';
        headerTarget.style.color = '';
        headerTarget.style.animation = '';
    }
    
    // Remove celebrate class
    const targetSection = document.querySelector('.target-kpi-section');
    if (targetSection) {
        targetSection.classList.remove('target-celebrate');
    }
    
    // Reset flag
    isDataLoaded = false;
    isTargetDataLoading = false;
    
    showNotifTop('🔄 Target data telah direset');
}

// ===== FUNGSI UNTUK REFRESH TARGET =====
function refreshTargetData() {
    if (DEBUG) console.log('🔄 Refresh target data...');
    
    // Reset flag agar bisa dimuat ulang
    isDataLoaded = false;
    isTargetDataLoading = false;
    
    if (typeof loadTargetData === 'function') {
        loadTargetData();
    }
    if (typeof initTargetCardClick === 'function') {
        initTargetCardClick();
    }
    showNotifTop('🔄 Data target direfresh');
}

// ================================================================
// ========== EKSPOR FUNGSI GLOBAL ==========
// ================================================================
window.resetTargetData = resetTargetData;
window.refreshTargetData = refreshTargetData;
window.initTargetFeatures = initTargetFeatures;
window.initTargetCardClick = initTargetCardClick;
window.showTargetDetailModal = showTargetDetailModal;
window.updateTargetUI = updateTargetUI;
window.updateTargetChart = updateTargetChart;
window.loadTargetData = loadTargetData;
window.closeTargetDetailModal = closeTargetDetailModal;

if (DEBUG) console.log('✅ Semua fungsi target telah diinisialisasi');

// ========== GLOBAL FUNCTIONS ==========
window.showAlasanTidakTertarikModal = showAlasanTidakTertarikModal;

// ========== TRANSAKSI GLOBAL FUNCTIONS ==========
async function saveTransaksiGlobal(nominal, keterangan, tanggal, transaksiId = null) {
    if (!nominal || nominal <= 0) {
        showNotifTop('⚠️ Jumlah transaksi harus diisi dan lebih dari 0!', true);
        return false;
    }
    
    const data = {
        nominal: parseInt(nominal),
        keterangan: keterangan || '',
        tanggal: tanggal || getTodayDate(),
        updated_at: new Date().toISOString()
    };
    
    if (transaksiId) {
        await window.db.from('transaksi_global').update(data).eq('id', transaksiId);
        showNotifTop('✅ Transaksi berhasil diupdate!');
    } else {
        data.created_at = new Date().toISOString();
        data.created_by = currentUser.id;
        data.created_by_name = currentUserName;
        await window.db.from('transaksi_global').insert(data);
        showNotifTop('✅ Transaksi berhasil ditambahkan!');
    }
    
    await loadTransaksiGlobal();
    return true;
}

async function deleteTransaksiGlobal(transaksiId) {
    if (!confirm('Yakin ingin menghapus transaksi ini?')) return;
    
    await window.db.from('transaksi_global').delete().eq('id', transaksiId);
    showNotifTop('🗑️ Transaksi dihapus');
    await loadTransaksiGlobal();
}

function showInputTransaksiModal() {
    currentTransaksiId = null;
    document.getElementById('transaksiNominal').value = '';
    document.getElementById('transaksiKeterangan').value = '';
    document.getElementById('transaksiTanggal').value = getTodayDate();
    showModal('inputTransaksiModal');
}

function showTransaksiListModal() {
    renderTransaksiListGlobal();
    showModal('transaksiListModal');
}

window.editTransaksiGlobal = function(id) {
    const transaksi = transaksiGlobalList.find(t => t.id === id);
    if (!transaksi) return;
    
    if (currentUserRole !== 'owner' && transaksi.created_by !== currentUser.id) {
        showNotifTop('⚠️ Anda hanya bisa mengedit transaksi yang Anda buat sendiri!', true);
        return;
    }
    
    currentTransaksiId = id;
    document.getElementById('transaksiNominal').value = transaksi.nominal;
    document.getElementById('transaksiKeterangan').value = transaksi.keterangan || '';
    document.getElementById('transaksiTanggal').value = transaksi.tanggal;
    showModal('inputTransaksiModal');
};

// ========== PROGRES FUNCTIONS ==========
function openTambahProgres(customerId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '9999999';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h3>📊 Tambah Progres Transaksi</h3>
            <div class="modal-subtitle">Catat perubahan jumlah transaksi customer</div>
            <div style="padding: 0 20px;">
                <div class="form-group">
                    <label>Jenis Perubahan <span class="required">*</span></label>
                    <select id="progresJenis" style="width:100%; padding:12px; border-radius:14px; border:1.5px solid #e5e7eb;">
                        <option value="naik">📈 Naik (Transaksi bertambah)</option>
                        <option value="turun">📉 Turun (Transaksi berkurang)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Jumlah Perubahan <span class="required">*</span></label>
                    <input type="number" id="progresJumlah" placeholder="Contoh: 25" style="width:100%; padding:12px; border-radius:14px; border:1.5px solid #e5e7eb;">
                    <small>Jumlah kenaikan/turunan transaksi (dalam Transaksi, selalu positif)</small>
                </div>
                <div class="form-group">
                    <label>Keterangan</label>
                    <textarea id="progresKeterangan" rows="2" placeholder="Contoh: Penambahan outlet baru" style="width:100%; padding:12px; border-radius:14px; border:1.5px solid #e5e7eb;"></textarea>
                </div>
            </div>
            <div class="modal-buttons">
                <button id="simpanProgresBtn" class="btn-primary">💾 Simpan Progres</button>
                <button id="batalProgresBtn" class="btn-outline">Batal</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const simpanBtn = modal.querySelector('#simpanProgresBtn');
    const batalBtn = modal.querySelector('#batalProgresBtn');
    
    simpanBtn.onclick = async () => {
        const jenis = modal.querySelector('#progresJenis').value;
        const jumlah = parseInt(modal.querySelector('#progresJumlah').value) || 0;
        const keterangan = modal.querySelector('#progresKeterangan').value;
        
        if (jumlah <= 0) {
            showNotifTop('⚠️ Masukkan jumlah perubahan yang valid (minimal 1 Transaksi)!', true);
            return;
        }
        
        const { data: doc } = await window.db.from('customers').select('*').eq('id', customerId).single();
        const currentData = doc;
        const progresData = currentData.progres_transaksi || { items: [], total_tercapai: 0 };
        
        let perubahan = jenis === 'naik' ? jumlah : -jumlah;
        const newTotalTercapai = (progresData.total_tercapai || 0) + perubahan;
        
        const newItem = {
            tanggal: getTodayDate(),
            jenis: jenis,
            jumlah: jumlah,
            keterangan: keterangan,
            created_at: new Date().toISOString()
        };
        
        await window.db.from('customers').update({
            progres_transaksi: {
                items: [...(progresData.items || []), newItem],
                total_tercapai: newTotalTercapai
            },
            updated_at: new Date().toISOString()
        }).eq('id', customerId);
        
        showNotifTop(`✅ Progres berhasil ditambahkan! Total transaksi tercapai: ${newTotalTercapai > 0 ? '+' : ''}${newTotalTercapai.toLocaleString()} Transaksi`);
        modal.remove();
        
        await loadCustomers();
        updateTargetDisplay();
        closeModal('detailModal');
    };
    
    batalBtn.onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

// ========== SELECT ALL FUNCTIONS ==========
function updateSelectAllButton(btnId, containerSelector, selectedMap) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    
    const checkboxes = document.querySelectorAll(`${containerSelector} .db-item-checkbox`);
    if (checkboxes.length === 0) {
        btn.textContent = '✅ Pilih Semua';
        return;
    }
    
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    btn.textContent = allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua';
}

// ========== PERBAIKAN: SETUP SELECT ALL UNTUK AGENT ==========
function setupSelectAll(btnId, containerSelector, selectedMap, itemSelector = '.db-item-checkbox') {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    
    // Hapus semua event listener lama
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    const freshBtn = document.getElementById(btnId);
    if (!freshBtn) return;
    
    freshBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Cari checkbox di container yang sesuai
        const container = document.querySelector(containerSelector);
        if (!container) return;
        
        const checkboxes = container.querySelectorAll(itemSelector);
        if (checkboxes.length === 0) {
            showNotifTop('⚠️ Tidak ada data untuk dipilih', true);
            return;
        }
        
        // Cek apakah semua checkbox sudah tercentang
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
            const id = cb.dataset.id;
            if (id) {
                if (!allChecked) {
                    selectedMap.set(id, true);
                } else {
                    selectedMap.delete(id);
                }
            }
        });
        
        // Update tombol text
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.textContent = !allChecked ? '⬜ Batal Semua' : '✅ Pilih Semua';
        }
        
        // Update selection count jika ada
        const countSpan = document.getElementById('agentSelectedCount');
        if (countSpan) {
            countSpan.innerText = selectedMap.size;
        }
    });
}

// ========== AUTH & LOAD USER PROFILE ==========
// ========== UPDATE LOGO USER ==========
function updateLogoUser(name) {
    const userNameEl = document.getElementById('logoUserName');
    if (userNameEl) {
        userNameEl.textContent = name || 'CS Agent';
    }
    
    // Pastikan logo text tetap dengan animasi
    const logoText = document.querySelector('.logo-text');
    if (logoText) {
        const chars = 'PROSPEKTA'.split('');
        logoText.innerHTML = chars.map((char, i) => 
            `<span class="logo-char" style="transition-delay: ${i * 0.05}s">${char}</span>`
        ).join('');
        logoText.style.fontSize = '22px';
        logoText.style.background = 'linear-gradient(135deg, #4f46e5, #8b5cf6, #a855f7)';
        logoText.style.webkitBackgroundClip = 'text';
        logoText.style.backgroundClip = 'text';
        logoText.style.color = 'transparent';
        logoText.style.display = 'inline-block';
    }
}

// ========== LOAD USER PROFILE ==========
async function loadUserProfile() {
    if (!currentUser) return;
    
    try {
        // ===== PERBAIKAN: Gunakan maybeSingle() untuk mencegah 406 =====
        const { data, error } = await window.db
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();
        
        if (error) {
            console.error('Error loading user profile:', error);
            currentUserName = currentUser.email;
            currentUserRole = 'cs';
            return;
        }
        
        if (data) {
            currentUserName = data.nama || currentUser.email;
            currentUserRole = data.role || 'cs';
            document.getElementById('topUserName').innerText = currentUserName;
            document.getElementById('profileImg').src = data.foto || 'https://i.pravatar.cc/40';
            updateLogoUser(currentUserName);
        } else {
            currentUserName = currentUser.email;
            currentUserRole = 'cs';
            document.getElementById('topUserName').innerText = currentUserName;
        }
    } catch (err) {
        console.error('Error in loadUserProfile:', err);
        currentUserName = currentUser.email;
        currentUserRole = 'cs';
    }
}

// ========== UPDATE TARGET ACCESS - HANYA OWNER ==========
function updateTargetAccess() {
    const manageTargetBtn = document.getElementById('manageTargetBtn');
    if (!manageTargetBtn) return;
    
    // Hanya tampilkan tombol jika user adalah Owner
    if (currentUserRole === 'owner') {
        manageTargetBtn.style.display = 'inline-block';
    } else {
        manageTargetBtn.style.display = 'none';
    }
}

async function handleLogin(email, password) {
    const { error } = await window.db.auth.signInWithPassword({ email, password });
    if (error) throw error;
}

async function handleLogout() {
    // ===== RESET SEMUA FLAG =====
    isDataLoaded = false;
    isTargetDataLoading = false;
    isTransaksiDataLoaded = false;
    isTransaksiDataLoading = false;
    isAppInitialized = false;
    isRiwayatLoaded = false;
    window._dashboardLoaded = false;
    window._riwayatData = [];
    
    // ===== RESET DATA =====
    customersData = [];
    prospekData = [];
    agentsData = [];
    transaksiData = [];
    window.transaksiData = [];
    produkData = [];
    targetData = { agent: 0, upline: 0, transaksi: 0, selisih: 0, monthlyTargets: [] };
    
    // ===== LOGOUT =====
    await window.db.auth.signOut();
    currentUser = null;
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    
    showNotifTop('👋 Anda telah logout');
}

// ========== PAGE NAVIGATION ==========
function navigateTo(page) {
    // Daftar semua halaman
    const pages = [
        'dashboardPage', 
        'followupFullPage', 
        'prospekFullPage', 
        'dbAgentPage', 
        'dbTransaksiPage', 
        'dbClosingPage', 
        'dbTidakPage', 
        'dbNomorSalahPage', 
        'dbCommitmentPage', 
        'produkPage', 
        'reminderPage', 
        'pesanPage', 
        'broadcastPage', 
        'broadcastUplinePage', 
        'searchPage', 
        'manageUsersPage', 
        'importPage'
    ];
    
    // Sembunyikan semua halaman
    pages.forEach(p => {
        const el = document.getElementById(p);
        if (el) el.style.display = 'none';
    });
    
    // Map page ke ID
    const pageMap = {
        'dashboard': 'dashboardPage',
        'followupFull': 'followupFullPage',
        'prospekFull': 'prospekFullPage',
        'dbAgent': 'dbAgentPage',
        'dbTransaksi': 'dbTransaksiPage',
        'dbClosing': 'dbClosingPage',
        'dbTidak': 'dbTidakPage',
        'dbNomorSalah': 'dbNomorSalahPage',
        'dbCommitment': 'dbCommitmentPage',
        'produk': 'produkPage',
        'reminder': 'reminderPage',
        'pesan': 'pesanPage',
        'broadcast': 'broadcastPage',
        'broadcastUpline': 'broadcastUplinePage',
        'search': 'searchPage',
        'manageUsers': 'manageUsersPage',
        'import': 'importPage'
    };
    
    // Tampilkan halaman yang dipilih
    const target = pageMap[page];
    if (target) {
        const el = document.getElementById(target);
        if (el) el.style.display = 'block';
    }
    
    // ================================================================
    // ===== STEP 1: TAMPILKAN LOADING LANGSUNG =====
    // ================================================================
    const loadingPages = ['dashboard', 'dbTransaksi', 'followupFull', 'prospekFull', 
                          'dbAgent', 'dbClosing', 'dbTidak', 'dbNomorSalah', 
                          'dbCommitment', 'produk', 'manageUsers'];
    
    if (loadingPages.includes(page)) {
        const pageNames = {
            'dashboard': { icon: '📊', title: 'Memuat Dashboard' },
            'dbTransaksi': { icon: '📊', title: 'Memuat Database Transaksi' },
            'followupFull': { icon: '📋', title: 'Memuat Data Followup' },
            'prospekFull': { icon: '🎯', title: 'Memuat Data Prospek' },
            'dbAgent': { icon: '👥', title: 'Memuat Database Agent' },
            'dbClosing': { icon: '📁', title: 'Memuat Database Closing' },
            'dbTidak': { icon: '📁', title: 'Memuat Database Tidak Tertarik' },
            'dbNomorSalah': { icon: '📵', title: 'Memuat Database Nomor Salah' },
            'dbCommitment': { icon: '🤝', title: 'Memuat Database Commitment' },
            'produk': { icon: '🏷️', title: 'Memuat Data Produk' },
            'manageUsers': { icon: '👥', title: 'Memuat Data CS Agent' }
        };
        
        const info = pageNames[page] || { icon: '📊', title: 'Memuat Halaman' };
        
        // ===== LOADING LANGSUNG =====
        showPageLoading(info.title, 'Menghubungi server...');
        updatePageLoading('Menyiapkan koneksi...', 5);
    }
    
    // ===== UPDATE MENU AKTIF =====
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    const activeMenu = document.querySelector(`.menu-item[data-page="${page}"]`);
    if (activeMenu) activeMenu.classList.add('active');
    
    // ===== TUTUP SIDEBAR DI MOBILE =====
    if (isMobile()) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('active');
        updateSidebarBodyClass();
    }
    
    // ================================================================
    // ===== STEP 2: GUNAKAN MULTI-STEP EXECUTION =====
    // ================================================================
    // Gunakan setTimeout dengan delay 0 untuk memberi browser waktu merender
    setTimeout(() => {
        // Gunakan requestAnimationFrame untuk memastikan rendering selesai
        requestAnimationFrame(() => {
            // Gunakan setTimeout lagi untuk memastikan semua render selesai
            setTimeout(() => {
                // Mulai proses data
                executePageLoad(page);
            }, 0);
        });
    }, 0);
}

// ===== FUNGSI TERPISAH UNTUK EKSEKUSI DATA =====
async function executePageLoad(page) {
    switch(page) {
case 'dashboard':
    if (DEBUG) console.log('📊 Dashboard diinisialisasi');
    
    // ===== CEK APAKAH SUDAH DILOAD =====
    if (_dashboardInitialized) {
        if (DEBUG) console.log('⏳ Dashboard sudah dimuat, skip...');
        // Tapi tetap update chart jika data berubah
        if (typeof updateTrendChart === 'function') {
            updateTrendChart();
        }
        // ===== PERBAIKAN: TUTUP LOADING SCREEN =====
        setTimeout(() => {
            hidePageLoading(300);
        }, 100);
        return; // ← Tetap return tapi setelah hide loading
    }
    
    try {
        _dashboardInitialized = true;
        
        updatePageLoading('Memuat statistik...', 15);
        
        if (typeof updateStats === 'function') updateStats();
        if (typeof updateChartCustomer === 'function') updateChartCustomer();
        if (typeof updateChartProspek === 'function') updateChartProspek();
        if (typeof updateDeadlineBadge === 'function') updateDeadlineBadge();
        
        updatePageLoading('Memuat target KPI...', 40);
        
        if (typeof loadTargetData === 'function') {
            if (window.transaksiData && window.transaksiData.length > 0) {
                if (!isDataLoaded) {
                    await loadTargetData();
                }
            } else {
                if (typeof loadDbTransaksi === 'function' && !isTransaksiDataLoading) {
                    updatePageLoading('Memuat database transaksi...', 50);
                    await loadDbTransaksi();
                    if (!isDataLoaded) {
                        await loadTargetData();
                    }
                }
            }
        }
        
        updatePageLoading('Menyiapkan grafik...', 70);
        
        if (typeof initTargetCardClick === 'function') {
            setTimeout(() => initTargetCardClick(), 200);
        }
        
        // ===== UPDATE CHART DENGAN DATA RIWAYAT =====
        if (typeof updateTrendChart === 'function') {
            // Pastikan data riwayat sudah dimuat
            if (!isRiwayatLoaded) {
                await loadRiwayatTransaksi();
            }
            await updateTrendChart();
        }
        
        if (typeof updateTargetDisplay === 'function') updateTargetDisplay();
        
        updatePageLoading('Selesai!', 100);
        
        setTimeout(() => {
            hidePageLoading(500);
        }, 300);
        
    } catch (err) {
        console.error('Error loading dashboard:', err);
        hidePageLoading(300);
        showNotifTop('⚠️ Gagal memuat beberapa data', true);
    }
    break;

        case 'pesan':
        updatePageLoading('Memuat pesan...', 20);
        if (typeof loadMessages === 'function') {
            await loadMessages();
        }
        if (typeof initPesanPage === 'function') {
            initPesanPage();
        }
        if (typeof updatePesanBadge === 'function') {
            updatePesanBadge();
        }
        updatePageLoading('Selesai!', 100);
        setTimeout(() => hidePageLoading(500), 300);
        break;
            
        case 'dbTransaksi':
            updatePageLoading('Menghubungi server...', 10);
            
            if (typeof loadDbTransaksi === 'function') {
                if (window.transaksiData && window.transaksiData.length > 0) {
                    updatePageLoading('Data sudah tersedia', 100);
                    renderTransaksiList();
                    updateTransaksiStats(transaksiData);
                    setTimeout(() => {
                        hidePageLoading(500);
                    }, 300);
                } else {
                    updatePageLoading('Memuat data transaksi...', 20);
                    await loadDbTransaksi();
                    setTimeout(() => {
                        hidePageLoading(500);
                    }, 300);
                }
            }
            break;
            
        case 'followupFull':
            updatePageLoading('Mengambil data customer...', 20);
            
            if (typeof loadCustomers === 'function') {
                await loadCustomers();
                updatePageLoading('Menyusun kanban...', 60);
                if (typeof renderFullFollowupKanban === 'function') {
                    renderFullFollowupKanban();
                }
                updatePageLoading('Selesai!', 100);
                setTimeout(() => {
                    hidePageLoading(500);
                }, 300);
            } else {
                if (typeof renderFullFollowupKanban === 'function') {
                    renderFullFollowupKanban();
                }
                setTimeout(() => hidePageLoading(500), 300);
            }
            break;
            
        case 'prospekFull':
            updatePageLoading('Mengambil data prospek...', 20);
            
            if (typeof loadProspek === 'function') {
                await loadProspek();
                updatePageLoading('Menyusun kanban...', 60);
                if (typeof renderFullProspekKanban === 'function') {
                    renderFullProspekKanban();
                }
                updatePageLoading('Selesai!', 100);
                setTimeout(() => {
                    hidePageLoading(500);
                }, 300);
            } else {
                if (typeof renderFullProspekKanban === 'function') {
                    renderFullProspekKanban();
                }
                setTimeout(() => hidePageLoading(500), 300);
            }
            break;
            
        case 'dbAgent':
            updatePageLoading('Memuat data agent...', 30);
            if (typeof loadDatabaseAgent === 'function') {
                await loadDatabaseAgent();
                updatePageLoading('Selesai!', 100);
                setTimeout(() => hidePageLoading(500), 300);
            }
            break;
            
        case 'dbClosing':
            updatePageLoading('Memuat data closing...', 30);
            if (typeof loadDBClosing === 'function') {
                await loadDBClosing();
                updatePageLoading('Selesai!', 100);
                setTimeout(() => hidePageLoading(500), 300);
            }
            break;
            
        case 'dbTidak':
            updatePageLoading('Memuat data...', 30);
            if (typeof loadDBTidak === 'function') {
                await loadDBTidak();
                updatePageLoading('Selesai!', 100);
                setTimeout(() => hidePageLoading(500), 300);
            }
            break;
            
        case 'dbNomorSalah':
            updatePageLoading('Memuat data...', 30);
            if (typeof loadDBNomorSalah === 'function') {
                await loadDBNomorSalah();
                updatePageLoading('Selesai!', 100);
                setTimeout(() => hidePageLoading(500), 300);
            }
            break;
            
        case 'dbCommitment':
            updatePageLoading('Memuat data...', 30);
            if (typeof loadDBCommitment === 'function') {
                await loadDBCommitment();
                updatePageLoading('Selesai!', 100);
                setTimeout(() => hidePageLoading(500), 300);
            }
            break;
            
        case 'produk':
            updatePageLoading('Memuat produk...', 30);
            if (typeof loadProduk === 'function') {
                await loadProduk();
                updatePageLoading('Selesai!', 100);
                setTimeout(() => hidePageLoading(500), 300);
            }
            break;
            
        case 'broadcast':
            if (typeof loadBroadcastNumbers === 'function') loadBroadcastNumbers();
            if (typeof loadBroadcastTemplates === 'function') loadBroadcastTemplates();
            if (typeof loadBroadcastHistory === 'function') loadBroadcastHistory(false);
            if (typeof updateBroadcastHistoryIndicator === 'function') updateBroadcastHistoryIndicator();
            break;
            
        case 'broadcastUpline':
            if (typeof initUplineBroadcast === 'function') initUplineBroadcast();
            if (typeof loadUplineTemplates === 'function') loadUplineTemplates();
            if (typeof loadBroadcastHistory === 'function') loadBroadcastHistory(true);
            if (typeof updateBroadcastHistoryIndicator === 'function') updateBroadcastHistoryIndicator();
            break;
            
        case 'reminder':
            if (typeof loadReminders === 'function') loadReminders();
            break;
            
        case 'pesan':
    if (typeof initPesanPage === 'function') {
        initPesanPage();
    } else {
        // Fallback: hanya load messages biasa
        if (typeof loadMessages === 'function') loadMessages();
        if (typeof updatePesanBadge === 'function') updatePesanBadge();
    }
    break;
            
        case 'search':
            if (typeof clearSearch === 'function') clearSearch();
            break;
            
        case 'manageUsers':
            updatePageLoading('Memuat data CS...', 30);
            if (typeof loadUsersList === 'function') {
                await loadUsersList();
                updatePageLoading('Selesai!', 100);
                setTimeout(() => hidePageLoading(500), 300);
            }
            break;
            
        case 'import':
            break;
            
        default:
            break;
    }
}

// ========== SETUP IMPORT EXCEL ==========
function setupImportExcel() {
    const dropZone = document.getElementById('dropZone');
    const excelFileInput = document.getElementById('excelFile');
    const importTypeRadios = document.querySelectorAll('.radio-option');
    const importBtn = document.getElementById('importBtn');
    let importType = "transaksi";
    
    // ===== DROP ZONE =====
    if (dropZone) {
        dropZone.addEventListener('click', () => excelFileInput?.click());
    }
    
    // ===== FILE INPUT =====
    if (excelFileInput) {
        excelFileInput.addEventListener('change', function(e) {
            if (e.target.files[0]) {
                document.getElementById('fileInfo').innerHTML = '📄 ' + e.target.files[0].name;
            }
        });
    }
    
    // ===== RADIO BUTTONS =====
    if (importTypeRadios) {
        importTypeRadios.forEach(opt => {
            opt.addEventListener('click', function() {
                importType = this.dataset.import;
                importTypeRadios.forEach(o => o.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }
    
    // ===== HANYA 1 EVENT LISTENER UNTUK IMPORT =====
    if (importBtn) {
        // Hapus semua listener lama dengan clone
        const newImportBtn = importBtn.cloneNode(true);
        importBtn.parentNode.replaceChild(newImportBtn, importBtn);
        
        const freshImportBtn = document.getElementById('importBtn');
        if (freshImportBtn) {
            freshImportBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Cegah double click
                if (this.disabled) {
                    showNotifTop('⏳ Proses import sedang berjalan...', true);
                    return;
                }
                
                const file = excelFileInput?.files[0];
                if (!file) {
                    showNotifTop('⚠️ Pilih file dulu!', true);
                    return;
                }
                
                const btn = this;
                const originalText = btn.textContent;
                btn.textContent = '⏳ Memproses...';
                btn.disabled = true;
                
                const progress = showFloatingProgress('📥 Import Data', 0);
                progress.update(0, '📥 Import Data', 'Membaca file Excel...');
                
                const reader = new FileReader();
                
                reader.onload = async function(e) {
                    try {
                        progress.update(5, '📥 Import Data', 'Memproses file Excel...');
                        
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const sheet = workbook.Sheets[workbook.SheetNames[0]];
                        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
                        
                        if (!json || json.length === 0) {
                            showNotifTop('⚠️ File Excel kosong!', true);
                            btn.textContent = originalText;
                            btn.disabled = false;
                            progress.hide();
                            return;
                        }
                        
                        let success = 0, failed = 0;
                        const errors = [];
                        const successData = [];
                        
                        progress.update(10, '📥 Import Data', `Memproses ${json.length} baris...`);
                        
                        // ===== CEGAH DUPLIKAT: Ambil data existing =====
                        let existingIds = new Set();
                        let existingNames = new Set();
                        let existingHps = new Set();
                        
                        if (importType === 'transaksi') {
                            const { data: existingData } = await window.db
                                .from('db_transaksi')
                                .select('agent_id');
                            if (existingData) {
                                existingData.forEach(item => {
                                    if (item.agent_id) {
                                        existingIds.add(item.agent_id.toUpperCase());
                                    }
                                });
                            }
                            if (DEBUG) console.log(`📊 Data existing di DB Transaksi: ${existingIds.size} agent_id`);
                        } else if (importType === 'customer') {
                            const { data: existingData } = await window.db
                                .from('customers')
                                .select('agent_id, hp, nama');
                            if (existingData) {
                                existingData.forEach(item => {
                                    if (item.agent_id) existingIds.add(item.agent_id.toUpperCase());
                                    if (item.hp) existingHps.add(item.hp);
                                    if (item.nama) existingNames.add(item.nama.toLowerCase());
                                });
                            }
                            if (DEBUG) console.log(`📊 Data existing di Customers: ${existingIds.size} agent_id`);
                        } else if (importType === 'prospek') {
                            const { data: existingData } = await window.db
                                .from('prospek')
                                .select('nama, hp');
                            if (existingData) {
                                existingData.forEach(item => {
                                    if (item.hp) existingHps.add(item.hp);
                                    if (item.nama) existingNames.add(item.nama.toLowerCase());
                                });
                            }
                            if (DEBUG) console.log(`📊 Data existing di Prospek: ${existingNames.size} nama`);
                        }
                        
                        // ===== BATCH PROCESSING =====
                        const BATCH_SIZE = 200;
                        const batches = [];
                        
                        for (let i = 0; i < json.length; i += BATCH_SIZE) {
                            batches.push(json.slice(i, i + BATCH_SIZE));
                        }
                        
                        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                            const batch = batches[batchIndex];
                            const batchPromises = [];
                            
                            for (let j = 0; j < batch.length; j++) {
                                const row = batch[j];
                                const rowIndex = (batchIndex * BATCH_SIZE) + j;
                                
                                try {
                                    // ===== IMPORT CUSTOMER =====
                                    if (importType === 'customer') {
                                        const agentId = (row.agent_id || row.Agent_ID || '').toString().trim();
                                        const nama = (row.nama || row.Nama || '').toString().trim();
                                        let hp = (row.hp || row.HP || '').toString().trim();
                                        const apk = (row.apk || row.APK || '').toString().trim();
                                        const upline = (row.upline_name || row.upline || '').toString().trim();
                                        const deadline = row.deadline || getTodayDate();
                                        
                                        if (!agentId || !nama) {
                                            failed++;
                                            errors.push(`⚠️ Baris ${rowIndex+1}: agent_id atau nama kosong`);
                                            continue;
                                        }
                                        
                                        // ===== CEK DUPLIKAT =====
                                        const agentIdUpper = agentId.toUpperCase();
                                        if (existingIds.has(agentIdUpper)) {
                                            failed++;
                                            errors.push(`⚠️ Baris ${rowIndex+1}: agent_id "${agentId}" sudah terdaftar!`);
                                            continue;
                                        }
                                        
                                        hp = String(hp).replace(/[^\d]/g, '');
                                        if (hp.startsWith('0')) hp = hp.substring(1);
                                        if (hp && !hp.startsWith('62')) hp = '62' + hp;
                                        
                                        if (hp && existingHps.has(hp)) {
                                            failed++;
                                            errors.push(`⚠️ Baris ${rowIndex+1}: nomor HP "${hp}" sudah terdaftar!`);
                                            continue;
                                        }
                                        
                                        if (existingNames.has(nama.toLowerCase())) {
                                            failed++;
                                            errors.push(`⚠️ Baris ${rowIndex+1}: nama "${nama}" sudah terdaftar!`);
                                            continue;
                                        }
                                        
                                        batchPromises.push(
                                            window.db.from('customers').insert({
                                                agent_id: agentIdUpper,
                                                nama: nama,
                                                hp: hp || '',
                                                apk: apk || '',
                                                upline_name: upline || '',
                                                tanggal: deadline || getTodayDate(),
                                                status: 'baru',
                                                user_id: currentUser.id,
                                                created_at: new Date().toISOString()
                                            }).then(() => {
                                                existingIds.add(agentIdUpper);
                                                existingHps.add(hp);
                                                existingNames.add(nama.toLowerCase());
                                                success++;
                                                successData.push(`✅ Baris ${rowIndex+1}: ${nama} berhasil`);
                                            }).catch((err) => {
                                                failed++;
                                                errors.push(`❌ Baris ${rowIndex+1}: ${err.message}`);
                                            })
                                        );
                                        
                                    // ===== IMPORT PROSPEK =====
                                    } else if (importType === 'prospek') {
                                        const nama = (row.nama || row.Nama || '').toString().trim();
                                        let hp = (row.hp || row.HP || '').toString().trim();
                                        const deadline = row.deadline || getTodayDate();
                                        
                                        if (!nama) {
                                            failed++;
                                            errors.push(`⚠️ Baris ${rowIndex+1}: nama kosong`);
                                            continue;
                                        }
                                        
                                        // ===== CEK DUPLIKAT =====
                                        if (existingNames.has(nama.toLowerCase())) {
                                            failed++;
                                            errors.push(`⚠️ Baris ${rowIndex+1}: nama "${nama}" sudah terdaftar!`);
                                            continue;
                                        }
                                        
                                        hp = String(hp).replace(/[^\d]/g, '');
                                        if (hp.startsWith('0')) hp = hp.substring(1);
                                        if (hp && !hp.startsWith('62')) hp = '62' + hp;
                                        
                                        if (hp && existingHps.has(hp)) {
                                            failed++;
                                            errors.push(`⚠️ Baris ${rowIndex+1}: nomor HP "${hp}" sudah terdaftar!`);
                                            continue;
                                        }
                                        
                                        batchPromises.push(
                                            window.db.from('prospek').insert({
                                                nama: nama,
                                                hp: hp || '',
                                                deadline: deadline || getTodayDate(),
                                                status: 'Baru',
                                                user_id: currentUser.id,
                                                created_at: new Date().toISOString()
                                            }).then(() => {
                                                existingNames.add(nama.toLowerCase());
                                                existingHps.add(hp);
                                                success++;
                                                successData.push(`✅ Baris ${rowIndex+1}: ${nama} berhasil`);
                                            }).catch((err) => {
                                                failed++;
                                                errors.push(`❌ Baris ${rowIndex+1}: ${err.message}`);
                                            })
                                        );
                                        
                                    // ===== IMPORT DB TRANSAKSI =====
                                    } else if (importType === 'transaksi') {
                                        const agentId = (row.agent_id || row.Agent_ID || '').toString().trim();
                                        const nama = (row.nama || row.Nama || '').toString().trim();
                                        let hp = (row.hp || row.HP || '').toString().trim();
                                        const apk = (row.apk || row.APK || '').toString().trim();
                                        const uplineName = (row.upline || row.upline_name || '').toString().trim();
                                        let uplinePhone = (row.hp_upline || row.upline_phone || '').toString().trim();
                                        
                                        const transaksiBulanLalu = parseFloat(row.transaksi_bulan_lalu || row.bulan_lalu || 0);
                                        const transaksiBulanIni = parseFloat(row.transaksi_bulan_ini || row.bulan_ini || 0);
                                        
                                        // ===== VALIDASI =====
                                        if (!agentId) {
                                            failed++;
                                            errors.push(`⚠️ Baris ${rowIndex+1}: agent_id kosong`);
                                            continue;
                                        }
                                        
                                        if (!nama) {
                                            failed++;
                                            errors.push(`⚠️ Baris ${rowIndex+1}: nama kosong untuk agent ${agentId}`);
                                            continue;
                                        }
                                        
                                        // ===== CEK DUPLIKAT (CEGAH DOUBLE) =====
                                        const agentIdUpper = agentId.toUpperCase();
                                        if (existingIds.has(agentIdUpper)) {
                                            failed++;
                                            errors.push(`⚠️ Baris ${rowIndex+1}: agent_id "${agentId}" sudah ada di database! (double)`);
                                            continue;
                                        }
                                        
                                        if (isNaN(transaksiBulanLalu) || isNaN(transaksiBulanIni)) {
                                            failed++;
                                            errors.push(`⚠️ Baris ${rowIndex+1}: transaksi_bulan_lalu atau transaksi_bulan_ini bukan angka (agent: ${agentId})`);
                                            continue;
                                        }
                                        
                                        if (transaksiBulanLalu < 0 || transaksiBulanIni < 0) {
                                            failed++;
                                            errors.push(`⚠️ Baris ${rowIndex+1}: transaksi tidak boleh negatif (agent: ${agentId})`);
                                            continue;
                                        }
                                        
                                        // ===== PERHITUNGAN OTOMATIS =====
                                        const selisih = transaksiBulanIni - transaksiBulanLalu;
                                        
                                        let progresJenis = 'normal';
                                        let progresJumlah = 0;
                                        
                                        if (transaksiBulanLalu === 0 && transaksiBulanIni === 0) {
                                            progresJenis = 'tidak_transaksi';
                                            progresJumlah = 0;
                                        } else if (selisih >= 100) {
                                            progresJenis = 'naik';
                                            progresJumlah = selisih;  // ← POSITIF
                                        } else if (selisih <= -100) {
                                            progresJenis = 'turun';
                                            progresJumlah = selisih;  // ← NEGATIF
                                        } else {
                                            progresJenis = 'normal';
                                            progresJumlah = selisih;  // ← BISA POSITIF ATAU NEGATIF (-99 sampai 99)
                                        }
                                        
                                        // ===== FORMAT HP =====
                                        if (hp) {
                                            hp = String(hp).replace(/[^\d]/g, '');
                                            if (hp.startsWith('0')) hp = hp.substring(1);
                                            if (hp && !hp.startsWith('62')) hp = '62' + hp;
                                        }
                                        
                                        if (uplinePhone) {
                                            uplinePhone = String(uplinePhone).replace(/[^\d]/g, '');
                                            if (uplinePhone.startsWith('0')) uplinePhone = uplinePhone.substring(1);
                                            if (uplinePhone && !uplinePhone.startsWith('62')) uplinePhone = '62' + uplinePhone;
                                        }
                                        
                                        // ===== AMBIL PERIODE =====
                                        let periodeBulanLalu = (row.periode_bulan_lalu || row.periode_lalu || '').toString().trim();
                                        let periodeBulanIni = (row.periode_bulan_ini || row.periode_ini || '').toString().trim();
                                        
                                        if (!periodeBulanLalu) {
                                            const now = new Date();
                                            const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                                                               'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                                            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                                            periodeBulanLalu = `${monthNames[lastMonth.getMonth()]} ${lastMonth.getFullYear()}`;
                                        }
                                        
                                        if (!periodeBulanIni) {
                                            const now = new Date();
                                            const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                                                               'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                                            periodeBulanIni = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
                                        }
                                        
                                        // ===== DATA UNTUK INSERT =====
                                        const insertData = {
                                            agent_id: agentIdUpper,
                                            nama: nama,
                                            hp: hp || '',
                                            apk: apk || '',
                                            upline_name: uplineName || '',
                                            upline_phone: uplinePhone || '',
                                            progres_jenis: progresJenis,
                                            progres_jumlah: progresJumlah,
                                            transaksi_bulan_lalu: transaksiBulanLalu,
                                            transaksi_bulan_ini: transaksiBulanIni,
                                            periode_bulan_lalu: periodeBulanLalu,
                                            periode_bulan_ini: periodeBulanIni,
                                            status: 'pending_import',
                                            user_id: currentUser.id,
                                            created_at: new Date().toISOString()
                                        };
                                        
                                        batchPromises.push(
                                            window.db.from('db_transaksi').insert(insertData)
                                                .then((result) => {
                                                    if (result.error) {
                                                        console.error(`❌ Insert error baris ${rowIndex+1}:`, result.error);
                                                        failed++;
                                                        errors.push(`❌ Baris ${rowIndex+1}: ${result.error.message}`);
                                                    } else {
                                                        // ===== TAMBAHKAN KE SET AGAR TIDAK DOUBLE =====
                                                        existingIds.add(agentIdUpper);
                                                        success++;
                                                        successData.push(`✅ Baris ${rowIndex+1}: ${agentId} (${progresJenis})`);
                                                    }
                                                })
                                                .catch((err) => {
                                                    console.error(`❌ Insert catch error baris ${rowIndex+1}:`, err);
                                                    failed++;
                                                    errors.push(`❌ Baris ${rowIndex+1}: ${err.message || err}`);
                                                })
                                        );
                                    }
                                } catch (err) {
                                    console.error(`Error baris ${rowIndex+1}:`, err);
                                    failed++;
                                    errors.push(`❌ Baris ${rowIndex+1}: ${err.message}`);
                                }
                            }
                            
                            // ===== EKSEKUSI BATCH =====
                            if (batchPromises.length > 0) {
                                await Promise.allSettled(batchPromises);
                            }
                            
                            // ===== UPDATE PROGRESS =====
                            const processed = Math.min((batchIndex + 1) * BATCH_SIZE, json.length);
                            const percent = Math.min(Math.floor((processed / json.length) * 100), 100);
                            progress.update(percent, '📥 Import Data', `Memproses ${processed}/${json.length} baris...`, success, json.length);
                        }
                        
                        // ===== KELOMPOKKAN DATA UNTUK RIWAYAT (KHUSUS TRANSAKSI) =====
                        if (importType === 'transaksi') {
                            try {
                                const groupedByPeriode = {};
                                const periodData = json.map(row => {
                                    const periode = row.periode_bulan_ini || row.periode_ini || '';
                                    const agentId = row.agent_id || row.Agent_ID || '';
                                    const nama = row.nama || row.Nama || '';
                                    let hp = row.hp || row.HP || '';
                                    const transaksiBulanLalu = parseFloat(row.transaksi_bulan_lalu || row.bulan_lalu || 0);
                                    const transaksiBulanIni = parseFloat(row.transaksi_bulan_ini || row.bulan_ini || 0);
                                    
                                    if (!agentId || !nama || isNaN(transaksiBulanLalu) || isNaN(transaksiBulanIni)) {
                                        return null;
                                    }
                                    
                                    const selisih = transaksiBulanIni - transaksiBulanLalu;
                                    let progresJenis = 'normal';
                                    
                                    if (transaksiBulanLalu === 0 && transaksiBulanIni === 0) {
                                        progresJenis = 'tidak_transaksi';
                                    } else if (selisih >= 100) {
                                        progresJenis = 'naik';
                                    } else if (selisih <= -100) {
                                        progresJenis = 'turun';
                                    }
                                    
                                    return {
                                        agent_id: agentId,
                                        nama: nama,
                                        hp: hp,
                                        progres_jenis: progresJenis,
                                        periode: periode
                                    };
                                }).filter(item => item !== null);
                                
                                periodData.forEach(item => {
                                    const periode = item.periode || 'Unknown';
                                    if (!groupedByPeriode[periode]) {
                                        groupedByPeriode[periode] = [];
                                    }
                                    groupedByPeriode[periode].push(item);
                                });
                                
                                for (const [periode, items] of Object.entries(groupedByPeriode)) {
                                    if (periode && periode !== 'Unknown') {
                                        await saveRiwayatTransaksiBulanan(periode, items, currentUser.id);
                                    }
                                }
                            } catch (err) {
                                console.warn('Gagal menyimpan riwayat:', err);
                            }
                        }
                        
                        // ===== TAMPILKAN HASIL =====
                        progress.update(100, '✅ Selesai', `Berhasil: ${success}, Gagal: ${failed}`, success, json.length);
                        showImportResultPopup(success, failed, errors, successData, importType);
                        
                        setTimeout(() => progress.hide(), 3000);
                        
                        excelFileInput.value = '';
                        document.getElementById('fileInfo').innerHTML = '';
                        
                        // ===== RELOAD DATA =====
                        if (importType === 'customer') {
                            await loadCustomers();
                        } else if (importType === 'prospek') {
                            await loadProspek();
                        } else if (importType === 'transaksi') {
                            await loadDbTransaksi();
                        }
                        
                        showNotifTop(`✅ Import selesai! ${success} data berhasil, ${failed} gagal`);
                        
                    } catch (err) {
                        console.error('Import error:', err);
                        showNotifTop('❌ Gagal memproses file: ' + err.message, true);
                        progress.hide();
                    } finally {
                        btn.textContent = originalText;
                        btn.disabled = false;
                    }
                };
                
                reader.onerror = function() {
                    showNotifTop('❌ Gagal membaca file', true);
                    btn.textContent = originalText;
                    btn.disabled = false;
                    if (progress) progress.hide();
                };
                
                reader.readAsArrayBuffer(file);
            });
        }
    }
    
    // ===== DOWNLOAD CONTOH FILE =====
    // Customer Example
    const customerExampleBtn = document.getElementById('downloadCustomerExample');
    if (customerExampleBtn) {
        const newCustomerBtn = customerExampleBtn.cloneNode(true);
        customerExampleBtn.parentNode.replaceChild(newCustomerBtn, customerExampleBtn);
        document.getElementById('downloadCustomerExample')?.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const data = [{ agent_id: 'AG-001', nama: 'Budi Santoso', hp: '6281234567890', apk: 'GNP' }];
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Customer');
            XLSX.writeFile(wb, 'contoh_customer.xlsx');
            showNotifTop('📋 Contoh file Customer berhasil diunduh');
        });
    }
    
    // Prospek Example
    const prospekExampleBtn = document.getElementById('downloadProspekExample');
    if (prospekExampleBtn) {
        const newProspekBtn = prospekExampleBtn.cloneNode(true);
        prospekExampleBtn.parentNode.replaceChild(newProspekBtn, prospekExampleBtn);
        document.getElementById('downloadProspekExample')?.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const data = [{ nama: 'Rina Marlina', hp: '6281234567893' }];
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Prospek');
            XLSX.writeFile(wb, 'contoh_prospek.xlsx');
            showNotifTop('📋 Contoh file Prospek berhasil diunduh');
        });
    }
    
    // Transaksi Example
    const transaksiExampleBtn = document.getElementById('downloadTransaksiExample');
    if (transaksiExampleBtn) {
        const newTransaksiBtn = transaksiExampleBtn.cloneNode(true);
        transaksiExampleBtn.parentNode.replaceChild(newTransaksiBtn, transaksiExampleBtn);
        document.getElementById('downloadTransaksiExample')?.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const data = [
                {
                    apk: 'GNP',
                    agent_id: 'AG-001',
                    nama: 'Budi Santoso',
                    hp: '6281234567890',
                    upline: 'Pak Upline',
                    hp_upline: '6281234567891',
                    periode_bulan_lalu: 'Januari 2024',
                    transaksi_bulan_lalu: 50,
                    periode_bulan_ini: 'Februari 2024',
                    transaksi_bulan_ini: 200
                },
                {
                    apk: 'BSB',
                    agent_id: 'AG-002',
                    nama: 'Ani Lestari',
                    hp: '6281234567892',
                    upline: 'Bu Upline',
                    hp_upline: '6281234567893',
                    periode_bulan_lalu: 'Januari 2024',
                    transaksi_bulan_lalu: 300,
                    periode_bulan_ini: 'Februari 2024',
                    transaksi_bulan_ini: 150
                },
                {
                    apk: 'BTN',
                    agent_id: 'AG-003',
                    nama: 'Cahya Wijaya',
                    hp: '6281234567894',
                    upline: '',
                    hp_upline: '',
                    periode_bulan_lalu: 'Januari 2024',
                    transaksi_bulan_lalu: 50,
                    periode_bulan_ini: 'Februari 2024',
                    transaksi_bulan_ini: 80
                },
                {
                    apk: 'GNP',
                    agent_id: 'AG-004',
                    nama: 'Dewi Sartika',
                    hp: '6281234567895',
                    upline: 'Pak Upline',
                    hp_upline: '6281234567891',
                    periode_bulan_lalu: 'Januari 2024',
                    transaksi_bulan_lalu: 0,
                    periode_bulan_ini: 'Februari 2024',
                    transaksi_bulan_ini: 0
                }
            ];
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'DB Transaksi');
            XLSX.writeFile(wb, 'contoh_db_transaksi.xlsx');
            showNotifTop('📋 Contoh file DB Transaksi berhasil diunduh');
        });
    }
}

// ========== SETUP AGENT IMPORT ==========
function setupAgentImport() {
    const importBtn = document.getElementById('importAgentExcelBtn');
    const fileInput = document.getElementById('agentExcelFile');
    if (!importBtn || !fileInput) return;
    
    // Hapus listener lama dengan clone
    const newImportBtn = importBtn.cloneNode(true);
    importBtn.parentNode.replaceChild(newImportBtn, importBtn);
    
    const freshImportBtn = document.getElementById('importAgentExcelBtn');
    if (freshImportBtn) {
        freshImportBtn.onclick = () => fileInput.click();
    }
    
    // Hapus listener lama pada fileInput
    const newFileInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newFileInput, fileInput);
    
    const freshFileInput = document.getElementById('agentExcelFile');
    if (!freshFileInput) return;
    
    freshFileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const btn = document.getElementById('importAgentExcelBtn');
        if (btn) {
            btn.textContent = '⏳ Memproses...';
            btn.disabled = true;
        }
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
                
                if (!json || json.length === 0) {
                    showNotifTop('⚠️ File Excel kosong!', true);
                    return;
                }
                
                // ===== TAMPILKAN PROGRESS =====
                const progress = showFloatingProgress('📥 Import Agent', json.length);
                progress.update(0, '📥 Import Agent', `Memproses ${json.length} data...`);
                
                let success = 0;
                let failed = 0;
                const errors = [];
                
                // ===== AMBIL DATA EXISTING UNTUK CEK DUPLIKAT =====
                const { data: existingData } = await window.db
                    .from('db_agent')
                    .select('agent_id, nama, agent_name');
                
                const existingIds = new Set();
                const existingNames = new Set();
                const existingAgentNames = new Set();
                
                if (existingData) {
                    existingData.forEach(item => {
                        if (item.agent_id) existingIds.add(item.agent_id.toUpperCase());
                        if (item.nama) existingNames.add(item.nama.toLowerCase());
                        if (item.agent_name) existingAgentNames.add(item.agent_name.toLowerCase());
                    });
                }
                
                // ===== PROSES BATCH =====
                const BATCH_SIZE = 50;
                const batches = [];
                
                for (let i = 0; i < json.length; i += BATCH_SIZE) {
                    batches.push(json.slice(i, i + BATCH_SIZE));
                }
                
                for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                    const batch = batches[batchIndex];
                    const batchPromises = [];
                    
                    for (let j = 0; j < batch.length; j++) {
                        const row = batch[j];
                        const rowIndex = (batchIndex * BATCH_SIZE) + j;
                        
                        try {
                            // ===== MAPPING FIELD =====
                            const apk = (row.Aplikasi || row.aplikasi || '').toString().trim();
                            const agentType = (row['Tipe Agent'] || row.tipe_agent || row.TipeAgent || '').toString().trim();
                            const upline = (row['Upline / Atasan'] || row.upline || row.Upline || '').toString().trim();
                            let uplinePhone = (row['Nomor HP Upline'] || row.upline_phone || row.UplinePhone || '').toString().trim();
                            const nama = (row['Nama Lengkap'] || row.nama || row.Nama || '').toString().trim();
                            const agentName = (row['Nama Agent'] || row.agent_name || row.AgentName || '').toString().trim();
                            let hp = (row['Nomor WhatsApp'] || row.hp || row.HP || '').toString().trim();
                            const agentId = (row['ID Agent'] || row.agent_id || row.Agent_ID || '').toString().trim();
                            const adminPostpaid = parseFloat(row['Admin Postpaid'] || row.admin_postpaid || 0);
                            const adminPrepaid = parseFloat(row['Admin Prepaid'] || row.admin_prepaid || 0);
                            const adminNontaglis = parseFloat(row['Admin Nontaglis'] || row.admin_nontaglis || 0);
                            const feePostpaid = parseFloat(row['Fee Postpaid'] || row.fee_postpaid || 0);
                            const feePrepaid = parseFloat(row['Fee Prepaid'] || row.fee_prepaid || 0);
                            const feeNontaglis = parseFloat(row['Fee Nontaglis'] || row.fee_nontaglis || 0);
                            const bank = (row['Jenis Bank'] || row.jenis_bank || row.Bank || '').toString().trim();
                            const rekening = (row['Nomor Rekening'] || row.nomor_rekening || row.Rekening || '').toString().trim();
                            const rekeningAtasNama = (row['Atas Nama Rekening'] || row.atas_nama_rekening || row.RekeningAtasNama || '').toString().trim();
                            const cid = (row.CID || row.cid || '').toString().trim();
                            
                            // ===== VALIDASI WAJIB =====
                            if (!agentId) {
                                failed++;
                                errors.push(`⚠️ Baris ${rowIndex+1}: ID Agent kosong`);
                                continue;
                            }
                            
                            if (!nama) {
                                failed++;
                                errors.push(`⚠️ Baris ${rowIndex+1}: Nama Lengkap kosong untuk ID ${agentId}`);
                                continue;
                            }
                            
                            // ===== CEK DUPLIKAT =====
                            const agentIdUpper = agentId.toUpperCase();
                            if (existingIds.has(agentIdUpper)) {
                                failed++;
                                errors.push(`⚠️ Baris ${rowIndex+1}: ID Agent "${agentId}" sudah terdaftar!`);
                                continue;
                            }
                            
                            if (existingNames.has(nama.toLowerCase())) {
                                failed++;
                                errors.push(`⚠️ Baris ${rowIndex+1}: Nama "${nama}" sudah terdaftar!`);
                                continue;
                            }
                            
                            // Cek duplikat Nama Agent (jika diisi)
                            const agentNameTrim = (agentName || nama).trim();
                            if (existingAgentNames.has(agentNameTrim.toLowerCase())) {
                                failed++;
                                errors.push(`⚠️ Baris ${rowIndex+1}: Nama Agent "${agentNameTrim}" sudah terdaftar!`);
                                continue;
                            }
                            
                            // ===== FORMAT HP =====
                            hp = String(hp).replace(/[^\d]/g, '');
                            if (hp.startsWith('0')) hp = hp.substring(1);
                            if (hp && !hp.startsWith('62')) hp = '62' + hp;
                            
                            if (uplinePhone) {
                                uplinePhone = String(uplinePhone).replace(/[^\d]/g, '');
                                if (uplinePhone.startsWith('0')) uplinePhone = uplinePhone.substring(1);
                                if (uplinePhone && !uplinePhone.startsWith('62')) uplinePhone = '62' + uplinePhone;
                            }
                            
                            // ===== DATA UNTUK INSERT =====
                            const insertData = {
                                agent_id: agentIdUpper,
                                nama: nama,
                                agent_name: agentName || nama,
                                hp: hp || '',
                                apk: apk || '',
                                agent_type: agentType || '',
                                upline: upline || '',
                                upline_phone: uplinePhone || '',
                                admin_postpaid: adminPostpaid || 0,
                                admin_prepaid: adminPrepaid || 0,
                                admin_nontaglis: adminNontaglis || 0,
                                fee_postpaid: feePostpaid || 0,
                                fee_prepaid: feePrepaid || 0,
                                fee_nontaglis: feeNontaglis || 0,
                                jenis_bank: bank || '',
                                nomor_rekening: rekening || '',
                                atas_nama_rekening: rekeningAtasNama || '',
                                cid: cid || '',
                                user_id: currentUser.id,
                                created_at: new Date().toISOString()
                            };
                            
                            batchPromises.push(
                                window.db.from('db_agent').insert(insertData)
                                    .then(() => {
                                        existingIds.add(agentIdUpper);
                                        existingNames.add(nama.toLowerCase());
                                        existingAgentNames.add((agentName || nama).toLowerCase());
                                        success++;
                                    })
                                    .catch((err) => {
                                        failed++;
                                        errors.push(`❌ Baris ${rowIndex+1}: ${err.message}`);
                                    })
                            );
                            
                        } catch (err) {
                            console.error(`Error baris ${rowIndex+1}:`, err);
                            failed++;
                            errors.push(`❌ Baris ${rowIndex+1}: ${err.message}`);
                        }
                    }
                    
                    // ===== EKSEKUSI BATCH =====
                    if (batchPromises.length > 0) {
                        await Promise.allSettled(batchPromises);
                    }
                    
                    // ===== UPDATE PROGRESS =====
                    const processed = Math.min((batchIndex + 1) * BATCH_SIZE, json.length);
                    const percent = Math.min(Math.floor((processed / json.length) * 100), 100);
                    progress.update(percent, '📥 Import Agent', `Memproses ${processed}/${json.length} baris...`, success, json.length);
                }
                
                // ===== TAMPILKAN HASIL =====
                progress.update(100, '✅ Selesai', `Berhasil: ${success}, Gagal: ${failed}`, success, json.length);
                
                showNotifTop(`✅ Import Agent selesai! Berhasil: ${success}, Gagal: ${failed}`);
                
                if (errors.length > 0) {
                    showImportResultPopup(success, failed, errors, [], 'agent');
                }
                
                // ===== RELOAD DATA =====
                await loadDatabaseAgent();
                
                // ===== RESET =====
                freshFileInput.value = '';
                setTimeout(() => progress.hide(), 2000);
                
            } catch (err) {
                console.error('Import error:', err);
                showNotifTop('❌ Gagal import: ' + err.message, true);
            } finally {
                const btn = document.getElementById('importAgentExcelBtn');
                if (btn) {
                    btn.textContent = '📥 Import Excel';
                    btn.disabled = false;
                }
            }
        };
        
        reader.onerror = function() {
            showNotifTop('❌ Gagal membaca file', true);
            const btn = document.getElementById('importAgentExcelBtn');
            if (btn) {
                btn.textContent = '📥 Import Excel';
                btn.disabled = false;
            }
        };
        
        reader.readAsArrayBuffer(file);
    };
}

// ========== DOWNLOAD CONTOH AGENT ==========
function downloadAgentExample() {
    const data = [{
        'Aplikasi': 'GNP',
        'Tipe Agent': 'AGENT',
        'Upline / Atasan': 'Budi Santoso',
        'Nomor HP Upline': '81234567890',
        'Nama Lengkap': 'Ahmad Setiawan',
        'Nama Agent': 'Ahmad Setiawan',
        'Nomor WhatsApp': '81234567891',
        'ID Agent': 'AG-001',
        'Admin Postpaid': 7200,
        'Admin Prepaid': 7200,
        'Admin Nontaglis': 7200,
        'Fee Postpaid': 5000,
        'Fee Prepaid': 5000,
        'Fee Nontaglis': 5000,
        'Jenis Bank': 'BCA',
        'Nomor Rekening': '1234567890',
        'Atas Nama Rekening': 'Ahmad Setiawan',
        'CID': '5213247'
    }, {
        'Aplikasi': 'BSB',
        'Tipe Agent': 'CollectingAgent (CA)',
        'Upline / Atasan': 'Siti Rahayu',
        'Nomor HP Upline': '81234567892',
        'Nama Lengkap': 'Dewi Lestari',
        'Nama Agent': 'Dewi Lestari',
        'Nomor WhatsApp': '81234567893',
        'ID Agent': 'CA-001',
        'Admin Postpaid': 6500,
        'Admin Prepaid': 6500,
        'Admin Nontaglis': 6500,
        'Fee Postpaid': 4500,
        'Fee Prepaid': 4500,
        'Fee Nontaglis': 4500,
        'Jenis Bank': 'Mandiri',
        'Nomor Rekening': '0987654321',
        'Atas Nama Rekening': 'Dewi Lestari',
        'CID': '5213248'
    }, {
        'Aplikasi': 'BTN',
        'Tipe Agent': 'Koordinator Wilayah (KORWIL)',
        'Upline / Atasan': '',
        'Nomor HP Upline': '',
        'Nama Lengkap': 'Joko Widodo',
        'Nama Agent': 'Joko Widodo',
        'Nomor WhatsApp': '81234567894',
        'ID Agent': 'KW-001',
        'Admin Postpaid': 8000,
        'Admin Prepaid': 8000,
        'Admin Nontaglis': 8000,
        'Fee Postpaid': 6000,
        'Fee Prepaid': 6000,
        'Fee Nontaglis': 6000,
        'Jenis Bank': 'BNI',
        'Nomor Rekening': '5555555555',
        'Atas Nama Rekening': 'Joko Widodo',
        'CID': '5213249'
    }];
    
    const ws = XLSX.utils.json_to_sheet(data);
    
    // ===== SET COLUMN WIDTH =====
    ws['!cols'] = [
        { wch: 12 }, // Aplikasi
        { wch: 18 }, // Tipe Agent
        { wch: 20 }, // Upline
        { wch: 18 }, // Nomor HP Upline
        { wch: 20 }, // Nama Lengkap
        { wch: 20 }, // Nama Agent
        { wch: 18 }, // Nomor WhatsApp
        { wch: 14 }, // ID Agent
        { wch: 16 }, // Admin Postpaid
        { wch: 16 }, // Admin Prepaid
        { wch: 16 }, // Admin Nontaglis
        { wch: 16 }, // Fee Postpaid
        { wch: 16 }, // Fee Prepaid
        { wch: 16 }, // Fee Nontaglis
        { wch: 16 }, // Jenis Bank
        { wch: 18 }, // Nomor Rekening
        { wch: 20 }, // Atas Nama Rekening
        { wch: 14 }  // CID
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Database Agent');
    XLSX.writeFile(wb, 'contoh_database_agent.xlsx');
    showNotifTop('📋 Contoh file Database Agent berhasil diunduh');
}

// ========== SETUP AGENT FILTERS ==========
function setupAgentFilters() {
    const searchInput = document.getElementById('searchAgentInput');
    const filterUpline = document.getElementById('filterUplineAgent');
    const filterCid = document.getElementById('filterCidAgent');
    const filterBank = document.getElementById('filterBankAgent');
    const filterType = document.getElementById('filterTypeAgent');
    const filterDateStart = document.getElementById('filterDateStartAgent');
    const filterDateEnd = document.getElementById('filterDateEndAgent');
    const resetBtn = document.getElementById('resetAgentFilterBtn');
    
    const applyFilters = () => renderAgentList(agentsData);
    
    // ===== EVENT LISTENERS =====
    if (searchInput) {
        searchInput.removeEventListener('input', applyFilters);
        searchInput.addEventListener('input', applyFilters);
    }
    
    if (filterUpline) {
        filterUpline.removeEventListener('change', applyFilters);
        filterUpline.addEventListener('change', applyFilters);
    }
    
    if (filterCid) {
        filterCid.removeEventListener('change', applyFilters);
        filterCid.addEventListener('change', applyFilters);
    }
    
    if (filterBank) {
        filterBank.removeEventListener('change', applyFilters);
        filterBank.addEventListener('change', applyFilters);
    }
    
    if (filterType) {
        filterType.removeEventListener('change', applyFilters);
        filterType.addEventListener('change', applyFilters);
    }
    
    if (filterDateStart) {
        filterDateStart.removeEventListener('change', applyFilters);
        filterDateStart.addEventListener('change', applyFilters);
    }
    
    if (filterDateEnd) {
        filterDateEnd.removeEventListener('change', applyFilters);
        filterDateEnd.addEventListener('change', applyFilters);
    }
    
    // ===== RESET =====
    if (resetBtn) {
        resetBtn.removeEventListener('click', resetAgentFilters);
        resetBtn.addEventListener('click', resetAgentFilters);
    }
    
    // ===== POPULATE UPLINE FILTER =====
    populateUplineFilter();
}

// ========== RESET AGENT FILTERS ==========
function resetAgentFilters() {
    const searchInput = document.getElementById('searchAgentInput');
    const filterUpline = document.getElementById('filterUplineAgent');
    const filterCid = document.getElementById('filterCidAgent');
    const filterBank = document.getElementById('filterBankAgent');
    const filterType = document.getElementById('filterTypeAgent');
    const filterDateStart = document.getElementById('filterDateStartAgent');
    const filterDateEnd = document.getElementById('filterDateEndAgent');
    
    if (searchInput) searchInput.value = '';
    if (filterUpline) filterUpline.value = '';
    if (filterCid) filterCid.value = '';
    if (filterBank) filterBank.value = '';
    if (filterType) filterType.value = '';
    if (filterDateStart) filterDateStart.value = '';
    if (filterDateEnd) filterDateEnd.value = '';
    
    renderAgentList(agentsData);
}

// ========== POPULATE UPLINE FILTER ==========
function populateUplineFilter() {
    const filterUpline = document.getElementById('filterUplineAgent');
    if (!filterUpline) return;
    
    const uplineSet = new Set();
    agentsData.forEach(item => {
        if (item.upline && item.upline.trim() !== '') {
            uplineSet.add(item.upline);
        }
    });
    
    const currentValue = filterUpline.value;
    filterUpline.innerHTML = '<option value="">👤 Semua Upline</option>';
    
    Array.from(uplineSet).sort().forEach(upline => {
        const option = document.createElement('option');
        option.value = upline;
        option.textContent = upline;
        filterUpline.appendChild(option);
    });
    
    if (currentValue && uplineSet.has(currentValue)) {
        filterUpline.value = currentValue;
    }
}

// ========== EXPORT AGENT TO EXCEL ==========
function exportAgentToExcel() {
    if (agentsData.length === 0) {
        showNotifTop('⚠️ Tidak ada data untuk diexport', true);
        return;
    }
    
    const exportData = agentsData.map(agent => ({
        'Aplikasi': agent.apk || '',
        'Tipe Agent': agent.agent_type || '',
        'Upline / Atasan': agent.upline || '',
        'Nomor HP Upline': agent.upline_phone ? agent.upline_phone.replace('+62', '') : '',
        'Nama Lengkap': agent.nama || '',
        'Nama Agent': agent.agent_name || agent.nama || '',
        'Nomor WhatsApp': agent.hp ? agent.hp.replace('+62', '') : '',
        'ID Agent': agent.agent_id || '',
        'Admin Postpaid': agent.admin_postpaid || 0,
        'Admin Prepaid': agent.admin_prepaid || 0,
        'Admin Nontaglis': agent.admin_nontaglis || 0,
        'Fee Postpaid': agent.fee_postpaid || 0,
        'Fee Prepaid': agent.fee_prepaid || 0,
        'Fee Nontaglis': agent.fee_nontaglis || 0,
        'Jenis Bank': agent.jenis_bank || '',
        'Nomor Rekening': agent.nomor_rekening || '',
        'Atas Nama Rekening': agent.atas_nama_rekening || '',
        'CID': agent.cid || '',
        'Tanggal Dibuat': agent.created_at ? formatDateDDMMYYYY(agent.created_at) : ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // ===== SET COLUMN WIDTH =====
    ws['!cols'] = [
        { wch: 12 }, // Aplikasi
        { wch: 18 }, // Tipe Agent
        { wch: 20 }, // Upline
        { wch: 18 }, // Nomor HP Upline
        { wch: 20 }, // Nama Lengkap
        { wch: 20 }, // Nama Agent
        { wch: 18 }, // Nomor WhatsApp
        { wch: 14 }, // ID Agent
        { wch: 16 }, // Admin Postpaid
        { wch: 16 }, // Admin Prepaid
        { wch: 16 }, // Admin Nontaglis
        { wch: 16 }, // Fee Postpaid
        { wch: 16 }, // Fee Prepaid
        { wch: 16 }, // Fee Nontaglis
        { wch: 16 }, // Jenis Bank
        { wch: 18 }, // Nomor Rekening
        { wch: 20 }, // Atas Nama Rekening
        { wch: 14 }, // CID
        { wch: 14 }  // Tanggal Dibuat
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Database Agent');
    XLSX.writeFile(wb, `database_agent_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotifTop('✅ Export data agent berhasil!');
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
                        const nama = row.nama || row.Nama || '';
                        const hpp = row.hpp || row.HPP || '';
                        
                        if (!nama || !hpp) {
                            failed++;
                            continue;
                        }
                        
                        await window.db.from('produk').insert({
                            nama: nama,
                            hpp: parseInt(hpp),
                            harga_jual: parseInt(row.harga_jual || 0),
                            keterangan: row.keterangan || '',
                            created_at: new Date().toISOString()
                        });
                        success++;
                    } catch (err) {
                        failed++;
                    }
                }
                
                showNotifTop(`✅ Import produk selesai! Berhasil: ${success}, Gagal: ${failed}`);
                await loadProduk();
                fileInput.value = '';
            } catch (err) {
                showNotifTop('❌ Gagal import: ' + err.message, true);
            } finally {
                importBtn.textContent = '📥 Import Excel';
                importBtn.disabled = false;
            }
        };
        reader.readAsArrayBuffer(file);
    };
}

function exportProdukToExcel() {
    if (produkData.length === 0) {
        showNotifTop('Tidak ada data produk untuk diexport', true);
        return;
    }
    
    const exportData = produkData.map(item => ({
        'Nama Produk': item.nama,
        'HPP (Modal)': item.hpp,
        'Harga Jual': item.harga_jual,
        'Keterangan': item.keterangan || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produk');
    XLSX.writeFile(wb, `produk_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotifTop('✅ Export produk berhasil!');
}

// ========== SHOW IMPORT RESULT POPUP ==========
function showImportResultPopup(success, failed, errors, successData, importType) {
    // Hapus modal lama jika ada
    const existingModal = document.querySelector('.import-result-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const typeNames = {
        'customer': 'Customer/Followup Agen',
        'prospek': 'Prospek Agen',
        'transaksi': 'Database Transaksi',
        'agent': 'Database Agent'  // <-- TAMBAHKAN
    };
    
    const typeName = typeNames[importType] || 'Data';
    
    // Buat daftar error (max 10)
    const errorList = errors.slice(0, 10).map(err => `<li style="color: #ef4444; font-size: 12px; padding: 4px 0; border-bottom: 1px solid #fef2f2;">${escapeHtml(err)}</li>`).join('');
    const errorMore = errors.length > 10 ? `<li style="color: #6b7280; font-size: 12px; padding: 4px 0;">... dan ${errors.length - 10} error lainnya</li>` : '';
    
    // Buat daftar sukses (max 5)
    const successList = successData.slice(0, 5).map(s => `<li style="color: #10b981; font-size: 12px; padding: 4px 0; border-bottom: 1px solid #f0fdf4;">${escapeHtml(s)}</li>`).join('');
    const successMore = successData.length > 5 ? `<li style="color: #6b7280; font-size: 12px; padding: 4px 0;">... dan ${successData.length - 5} data lainnya</li>` : '';
    
    const modalHtml = `
        <div class="modal-content" style="max-width: 500px; max-height: 85vh; overflow: hidden; display: flex; flex-direction: column; background: #fff; border-radius: 24px;">
            <!-- Header -->
            <div style="padding: 20px 24px 0; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="font-size: 20px; margin: 0; color: #1f2937;">📊 Hasil Import</h3>
                <button onclick="closeImportResultPopup()" style="
                    background: none;
                    border: none;
                    font-size: 28px;
                    cursor: pointer;
                    color: #6b7280;
                    padding: 0 4px;
                    transition: all 0.2s;
                    line-height: 1;
                " onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#6b7280'">✕</button>
            </div>
            <div class="modal-subtitle" style="font-size: 13px; color: #6b7280; padding: 0 24px 12px 24px; border-bottom: 1px solid #f0f0f0;">
                Import ${typeName}
            </div>
            
            <!-- Statistik -->
            <div style="padding: 16px 24px; display: flex; gap: 12px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 80px; background: #f0fdf4; border-radius: 12px; padding: 12px 16px; border-left: 4px solid #10b981; text-align: center;">
                    <div style="font-size: 28px; font-weight: 800; color: #10b981;">${success}</div>
                    <div style="font-size: 11px; color: #6b7280;">✅ Berhasil</div>
                </div>
                <div style="flex: 1; min-width: 80px; background: #fef2f2; border-radius: 12px; padding: 12px 16px; border-left: 4px solid #ef4444; text-align: center;">
                    <div style="font-size: 28px; font-weight: 800; color: #ef4444;">${failed}</div>
                    <div style="font-size: 11px; color: #6b7280;">❌ Gagal</div>
                </div>
                <div style="flex: 1; min-width: 80px; background: #eef2ff; border-radius: 12px; padding: 12px 16px; border-left: 4px solid #4f46e5; text-align: center;">
                    <div style="font-size: 28px; font-weight: 800; color: #4f46e5;">${success + failed}</div>
                    <div style="font-size: 11px; color: #6b7280;">📋 Total</div>
                </div>
            </div>
            
            <!-- Detail -->
            <div style="padding: 0 24px; flex: 1; overflow-y: auto; max-height: 250px;">
                ${successData.length > 0 ? `
                    <div style="margin-bottom: 12px;">
                        <div style="font-weight: 600; color: #10b981; font-size: 13px; margin-bottom: 6px;">✅ Data Berhasil (${successData.length})</div>
                        <ul style="list-style: none; padding: 0; margin: 0; background: #f0fdf4; border-radius: 8px; padding: 8px 12px;">
                            ${successList}
                            ${successMore}
                        </ul>
                    </div>
                ` : ''}
                
                ${errors.length > 0 ? `
                    <div>
                        <div style="font-weight: 600; color: #ef4444; font-size: 13px; margin-bottom: 6px;">❌ Data Gagal (${errors.length})</div>
                        <ul style="list-style: none; padding: 0; margin: 0; background: #fef2f2; border-radius: 8px; padding: 8px 12px;">
                            ${errorList}
                            ${errorMore}
                        </ul>
                    </div>
                ` : ''}
            </div>
            
            <!-- Tombol -->
            <div class="modal-buttons" style="display: flex; gap: 12px; padding: 16px 24px 24px; border-top: 1px solid #e5e7eb;">
                <button onclick="closeImportResultPopup()" class="btn-primary" style="flex: 1; padding: 12px; border: none; border-radius: 14px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #4f46e5, #6366f1); color: white;">Tutup</button>
                ${failed > 0 ? `
                    <button onclick="closeImportResultPopup(); downloadImportErrors('${importType}', ${JSON.stringify(errors).replace(/"/g, '&quot;')})" class="btn-warning" style="flex: 1; padding: 12px; border: none; border-radius: 14px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #f59e0b, #d97706); color: white;">📥 Download Error</button>
                ` : ''}
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal import-result-modal';
    modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0, 0, 0, 0.7) !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        z-index: 999999999 !important;
        backdrop-filter: blur(5px) !important;
        pointer-events: auto !important;
    `;
    modal.innerHTML = modalHtml;
    
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeImportResultPopup();
        }
    });
    
    applyDarkModeToModal(modal);
}

// ========== CLOSE IMPORT RESULT POPUP ==========
function closeImportResultPopup() {
    const modal = document.querySelector('.import-result-modal');
    if (modal) {
        modal.remove();
    }
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
}

// ========== DOWNLOAD IMPORT ERRORS ==========
function downloadImportErrors(importType, errorsData) {
    try {
        const errors = typeof errorsData === 'string' ? JSON.parse(errorsData) : errorsData;
        
        if (!errors || errors.length === 0) {
            showNotifTop('Tidak ada error untuk di-download', true);
            return;
        }
        
        const data = errors.map((err, index) => ({
            'No': index + 1,
            'Error': err
        }));
        
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Error Import');
        XLSX.writeFile(wb, `error_import_${importType}_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        showNotifTop('📥 File error berhasil diunduh');
    } catch (e) {
        console.error('Error download:', e);
        showNotifTop('❌ Gagal download file error', true);
    }
}

// ========== DELETE SELECTED FUNCTIONS ==========
async function deleteSelectedDBItems(collection, selectedMap, loadFunction) {
    const selectedIds = Array.from(selectedMap.keys());
    if (selectedIds.length === 0) {
        showNotifTop('⚠️ Tidak ada data yang dipilih', true);
        return;
    }
    
    if (!confirm(`Hapus ${selectedIds.length} data?`)) return;
    
    const progress = showFloatingProgress('🗑️ Menghapus', selectedIds.length);
    let deleted = 0;
    
    for (const id of selectedIds) {
        try {
            await window.db.from(collection).delete().eq('id', id);
            selectedMap.delete(id);
            deleted++;
            progress.update(Math.floor((deleted / selectedIds.length) * 100), 'Menghapus', `Memproses...`, deleted, selectedIds.length);
            await delay(30);
        } catch (e) {
            console.error(`Gagal hapus ${id}:`, e);
        }
    }
    
    progress.update(100, 'Selesai', `Berhasil menghapus ${deleted} data`, deleted, selectedIds.length);
    showNotifTop(`✅ ${deleted} data berhasil dihapus`);
    setTimeout(() => progress.hide(), 2000);
    
    if (loadFunction) await loadFunction();
}

async function deleteAllDBItems(collection, loadFunction) {
    if (!confirm(`⚠️ Hapus SEMUA data dari ${collection}? Tidak bisa dibatalkan!`)) return;
    
    let query = window.db.from(collection).select('id');
    if (currentUserRole !== 'owner' && collection !== 'users') {
        query = query.eq('user_id', currentUser.id);
    }
    
    const { data, error } = await query;
    if (error) {
        showNotifTop('❌ Gagal: ' + error.message, true);
        return;
    }
    
    const progress = showFloatingProgress('🗑️ Menghapus Semua', data.length);
    let deleted = 0;
    
    for (const item of data) {
        try {
            await window.db.from(collection).delete().eq('id', item.id);
            deleted++;
            progress.update(Math.floor((deleted / data.length) * 100), 'Menghapus', `Memproses...`, deleted, data.length);
            await delay(20);
        } catch (e) {
            console.error('Gagal hapus:', e);
        }
    }
    
    progress.update(100, 'Selesai', `Berhasil menghapus ${deleted} data`, deleted, data.length);
    showNotifTop(`✅ ${deleted} data berhasil dihapus`);
    setTimeout(() => progress.hide(), 2000);
    
    if (loadFunction) await loadFunction();
}

async function deleteSelectedProduk() {
    const selectedIds = Array.from(selectedProdukIds.keys());
    if (selectedIds.length === 0) {
        showNotifTop('⚠️ Tidak ada produk yang dipilih', true);
        return;
    }
    
    if (!confirm(`Hapus ${selectedIds.length} produk yang dipilih?`)) return;
    
    const progress = showFloatingProgress('🗑️ Menghapus Produk', selectedIds.length);
    let deleted = 0;
    
    for (const id of selectedIds) {
        try {
            await window.db.from('produk').delete().eq('id', id);
            selectedProdukIds.delete(id);
            const index = produkData.findIndex(p => p.id === id);
            if (index !== -1) produkData.splice(index, 1);
            deleted++;
            progress.update(Math.floor((deleted / selectedIds.length) * 100), 'Menghapus', `Memproses...`, deleted, selectedIds.length);
            await delay(30);
        } catch (e) {
            console.error(`Gagal hapus ${id}:`, e);
        }
    }
    
    renderProdukList();
    progress.update(100, 'Selesai', `Berhasil menghapus ${selectedIds.length} produk`, selectedIds.length, selectedIds.length);
    showNotifTop(`✅ ${selectedIds.length} produk berhasil dihapus`);
    setTimeout(() => progress.hide(), 2000);
}

async function deleteAllProduk() {
    if (!confirm('⚠️ Hapus SEMUA data Produk? Tidak bisa dibatalkan!')) return;
    
    const { data, error } = await window.db.from('produk').select('id');
    if (error) {
        showNotifTop('❌ Gagal: ' + error.message, true);
        return;
    }
    
    const progress = showFloatingProgress('🗑️ Menghapus Semua Produk', data.length);
    let deleted = 0;
    
    for (const item of data) {
        try {
            await window.db.from('produk').delete().eq('id', item.id);
            deleted++;
            progress.update(Math.floor((deleted / data.length) * 100), 'Menghapus', `Memproses...`, deleted, data.length);
            await delay(20);
        } catch (e) {
            console.error('Gagal hapus:', e);
        }
    }
    
    selectedProdukIds.clear();
    produkData = [];
    renderProdukList();
    progress.update(100, 'Selesai', `Berhasil menghapus ${deleted} data`, deleted, data.length);
    showNotifTop(`✅ ${deleted} data Produk berhasil dihapus`);
    setTimeout(() => progress.hide(), 2000);
}

// ========== DELETE FULL MODE FUNCTIONS ==========
async function deleteSelectedFullFollowup() {
    if (currentUserRole !== 'owner') {
        showNotifTop('⚠️ Hanya Owner yang dapat menghapus massal!', true);
        return;
    }
    
    const selectedIds = Array.from(selectedFullFollowupIds.keys());
    if (selectedIds.length === 0) {
        showNotifTop('⚠️ Tidak ada data yang dipilih', true);
        return;
    }
    
    if (!confirm(`Hapus ${selectedIds.length} data customer?`)) return;
    
    const progress = showFloatingProgress('🗑️ Menghapus Data', selectedIds.length);
    let deleted = 0;
    const deletedIds = [];
    
    for (const id of selectedIds) {
        try {
            // ===== AMBIL DATA CUSTOMER SEBELUM DIHAPUS =====
            const { data: customer } = await window.db
                .from('customers')
                .select('agent_id')
                .eq('id', id)
                .single();
            
            // ===== HAPUS CUSTOMER =====
            await window.db.from('customers').delete().eq('id', id);
            
            // ===== SIMPAN AGENT_ID UNTUK RESTORE =====
            if (customer && customer.agent_id) {
                deletedIds.push(customer.agent_id);
            }
            
            selectedFullFollowupIds.delete(id);
            deleted++;
            progress.update(Math.floor((deleted / selectedIds.length) * 100), 'Menghapus', `Memproses...`, deleted, selectedIds.length);
            await delay(30);
        } catch (e) {
            console.error(`Gagal hapus ${id}:`, e);
        }
    }
    
    // ===== RESTORE STATUS TRANSAKSI =====
    if (deletedIds.length > 0) {
        try {
            for (const agentId of deletedIds) {
                await window.db
                    .from('db_transaksi')
                    .update({ 
                        status: 'pending_import',
                        updated_at: new Date().toISOString()
                    })
                    .eq('agent_id', agentId)
                    .eq('status', 'imported');
            }
            showNotifTop(`🔄 ${deletedIds.length} data di DB Transaksi dikembalikan ke Pending`);
        } catch (e) {
            console.warn('Gagal restore transaksi:', e);
        }
    }
    
    progress.update(100, 'Selesai', `Berhasil menghapus ${deleted} data`, deleted, selectedIds.length);
    showNotifTop(`✅ ${deleted} data berhasil dihapus`);
    setTimeout(() => progress.hide(), 2000);
    
    await loadCustomers();
    await loadDbTransaksi(); // Refresh db_transaksi
    renderFullFollowupKanban();
}

// ========== RESTORE TRANSAKSI STATUS MASSAL ==========
async function restoreTransaksiStatusForDeletedCustomers(deletedCustomerIds) {
    if (!deletedCustomerIds || deletedCustomerIds.length === 0) return;
    
    try {
        // Ambil semua customer yang dihapus
        const { data: deletedCustomers } = await window.db
            .from('customers')
            .select('agent_id')
            .in('id', deletedCustomerIds);
        
        if (!deletedCustomers || deletedCustomers.length === 0) return;
        
        const agentIds = deletedCustomers.map(c => c.agent_id).filter(id => id);
        
        if (agentIds.length === 0) return;
        
        // Update db_transaksi dengan agent_id yang sesuai
        for (const agentId of agentIds) {
            await window.db
                .from('db_transaksi')
                .update({ 
                    status: 'pending_import',
                    updated_at: new Date().toISOString()
                })
                .eq('agent_id', agentId)
                .eq('status', 'imported');
        }
        
        if (DEBUG) console.log(`✅ Restored ${agentIds.length} transaksi status to pending`);
        
    } catch (err) {
        console.error('Error restoring transaksi status:', err);
    }
}

async function deleteSelectedFullProspek() {
    if (currentUserRole !== 'owner') {
        showNotifTop('⚠️ Hanya Owner yang dapat menghapus massal!', true);
        return;
    }
    
    const selectedIds = Array.from(selectedFullProspekIds.keys());
    if (selectedIds.length === 0) {
        showNotifTop('⚠️ Tidak ada data yang dipilih', true);
        return;
    }
    
    if (!confirm(`Hapus ${selectedIds.length} data prospek?`)) return;
    
    const progress = showFloatingProgress('🗑️ Menghapus Data Prospek', selectedIds.length);
    let deleted = 0;
    
    for (const id of selectedIds) {
        try {
            await window.db.from('prospek').delete().eq('id', id);
            selectedFullProspekIds.delete(id);
            deleted++;
            progress.update(Math.floor((deleted / selectedIds.length) * 100), 'Menghapus', `Memproses...`, deleted, selectedIds.length);
            await delay(30);
        } catch (e) {
            console.error(`Gagal hapus ${id}:`, e);
        }
    }
    
    progress.update(100, 'Selesai', `Berhasil menghapus ${deleted} data`, deleted, selectedIds.length);
    showNotifTop(`✅ ${deleted} data berhasil dihapus`);
    setTimeout(() => progress.hide(), 2000);
    
    await loadProspek();
    renderFullProspekKanban();
}

async function deleteAllFullFollowup() {
    if (currentUserRole !== 'owner') {
        showNotifTop('⚠️ Hanya Owner yang dapat menghapus semua data!', true);
        return;
    }
    
    if (!confirm('⚠️ PERINGATAN! Anda akan menghapus SEMUA data Followup Agen. Tidak bisa dibatalkan!')) return;
    
    const progress = showFloatingProgress('🗑️ Menghapus Semua Followup', 0);
    progress.update(0, 'Menghapus', 'Mengambil data...');
    
    let query = window.db.from('customers').select('id');
    if (currentUserRole !== 'owner') query = query.eq('user_id', currentUser.id);
    
    const { data, error } = await query;
    if (error) {
        showNotifTop('❌ Gagal: ' + error.message, true);
        progress.hide();
        return;
    }
    
    const totalData = data.length;
    progress.setTotal(totalData);
    
    if (totalData === 0) {
        showNotifTop('📭 Tidak ada data untuk dihapus', true);
        progress.hide();
        return;
    }
    
    let deleted = 0;
    for (const item of data) {
        try {
            await window.db.from('customers').delete().eq('id', item.id);
            deleted++;
            progress.update(Math.floor((deleted / totalData) * 100), 'Menghapus', `Memproses...`, deleted, totalData);
            await delay(20);
        } catch (e) {
            console.error('Gagal hapus:', e);
        }
    }
    
    selectedFullFollowupIds.clear();
    progress.update(100, 'Selesai', `Berhasil menghapus ${deleted} data`, deleted, totalData);
    showNotifTop(`✅ ${deleted} data Followup berhasil dihapus`);
    setTimeout(() => progress.hide(), 2000);
    
    await loadCustomers();
    renderFullFollowupKanban();
}

async function deleteAllFullProspek() {
    if (currentUserRole !== 'owner') {
        showNotifTop('⚠️ Hanya Owner yang dapat menghapus semua data!', true);
        return;
    }
    
    if (!confirm('⚠️ PERINGATAN! Anda akan menghapus SEMUA data Prospek Agen. Tidak bisa dibatalkan!')) return;
    
    const progress = showFloatingProgress('🗑️ Menghapus Semua Prospek', 0);
    progress.update(0, 'Menghapus', 'Mengambil数据...');
    
    let query = window.db.from('prospek').select('id');
    if (currentUserRole !== 'owner') query = query.eq('user_id', currentUser.id);
    
    const { data, error } = await query;
    if (error) {
        showNotifTop('❌ Gagal: ' + error.message, true);
        progress.hide();
        return;
    }
    
    const totalData = data.length;
    progress.setTotal(totalData);
    
    if (totalData === 0) {
        showNotifTop('📭 Tidak ada data untuk dihapus', true);
        progress.hide();
        return;
    }
    
    let deleted = 0;
    for (const item of data) {
        try {
            await window.db.from('prospek').delete().eq('id', item.id);
            deleted++;
            progress.update(Math.floor((deleted / totalData) * 100), 'Menghapus', `Memproses...`, deleted, totalData);
            await delay(20);
        } catch (e) {
            console.error('Gagal hapus:', e);
        }
    }
    
    selectedFullProspekIds.clear();
    progress.update(100, 'Selesai', `Berhasil menghapus ${deleted} data`, deleted, totalData);
    showNotifTop(`✅ ${deleted} data Prospek berhasil dihapus`);
    setTimeout(() => progress.hide(), 2000);
    
    await loadProspek();
    renderFullProspekKanban();
}

// ========== CLEAR ALL RIWAYAT (GLOBAL) ==========
async function clearAllRiwayat() {
    if (!confirm('⚠️ Hapus SEMUA riwayat transaksi? Tidak bisa dibatalkan!')) return;
    
    try {
        const { error } = await window.db
            .from('riwayat_transaksi_bulanan')
            .delete()
            .eq('user_id', currentUser.id);
        
        if (error) {
            showNotifTop('❌ Gagal hapus: ' + error.message, true);
            return;
        }
        
        showNotifTop('🗑️ Semua riwayat berhasil dihapus');
        await loadRiwayatTransaksi();
        
    } catch (err) {
        console.error('Error clear riwayat:', err);
        showNotifTop('❌ Error: ' + err.message, true);
    }
}

// Pastikan fungsi ini global
window.clearAllRiwayat = clearAllRiwayat;

// ========== FULL MODE SELECTION ==========
function initFullModeSelection() {
    if (currentUserRole !== 'owner') {
        const followupSelectBtn = document.getElementById('selectAllFullFollowup');
        const followupDeleteBtn = document.getElementById('deleteSelectedFullFollowup');
        const followupDeleteAllBtn = document.getElementById('deleteAllFullFollowup');
        const prospekSelectBtn = document.getElementById('selectAllFullProspek');
        const prospekDeleteBtn = document.getElementById('deleteSelectedFullProspek');
        const prospekDeleteAllBtn = document.getElementById('deleteAllFullProspek');
        
        if (followupSelectBtn) followupSelectBtn.style.display = 'none';
        if (followupDeleteBtn) followupDeleteBtn.style.display = 'none';
        if (followupDeleteAllBtn) followupDeleteAllBtn.style.display = 'none';
        if (prospekSelectBtn) prospekSelectBtn.style.display = 'none';
        if (prospekDeleteBtn) prospekDeleteBtn.style.display = 'none';
        if (prospekDeleteAllBtn) prospekDeleteAllBtn.style.display = 'none';
        return;
    }
    
    const followupSelectBtn = document.getElementById('selectAllFullFollowup');
    const followupDeleteBtn = document.getElementById('deleteSelectedFullFollowup');
    const followupDeleteAllBtn = document.getElementById('deleteAllFullFollowup');
    const prospekSelectBtn = document.getElementById('selectAllFullProspek');
    const prospekDeleteBtn = document.getElementById('deleteSelectedFullProspek');
    const prospekDeleteAllBtn = document.getElementById('deleteAllFullProspek');
    
    if (followupSelectBtn) {
        followupSelectBtn.style.display = 'inline-block';
        followupSelectBtn.onclick = () => toggleSelectAllFullFollowup();
    }
    if (followupDeleteBtn) {
        followupDeleteBtn.style.display = 'inline-block';
        followupDeleteBtn.onclick = () => deleteSelectedFullFollowup();
    }
    if (followupDeleteAllBtn) {
        followupDeleteAllBtn.style.display = 'inline-block';
        followupDeleteAllBtn.onclick = () => deleteAllFullFollowup();
    }
    if (prospekSelectBtn) {
        prospekSelectBtn.style.display = 'inline-block';
        prospekSelectBtn.onclick = () => toggleSelectAllFullProspek();
    }
    if (prospekDeleteBtn) {
        prospekDeleteBtn.style.display = 'inline-block';
        prospekDeleteBtn.onclick = () => deleteSelectedFullProspek();
    }
    if (prospekDeleteAllBtn) {
        prospekDeleteAllBtn.style.display = 'inline-block';
        prospekDeleteAllBtn.onclick = () => deleteAllFullProspek();
    }
}

// ========== INIT BADGES ==========
function initBadges() {
    // Deadline badge
    const deadlineBadge = document.getElementById('deadlineCount');
    if (deadlineBadge) {
        const count = parseInt(deadlineBadge.innerText) || 0;
        if (count === 0) {
            deadlineBadge.classList.add('badge-zero');
        } else {
            deadlineBadge.classList.add('badge-active');
        }
    }
    
    // Pesan badge
    const pesanBadge = document.getElementById('pesanCount');
    if (pesanBadge) {
        const count = parseInt(pesanBadge.innerText) || 0;
        if (count === 0) {
            pesanBadge.classList.add('badge-zero');
        } else {
            pesanBadge.classList.add('badge-active');
        }
    }
}

// ======================================================================
// ========== DARK MODE OBSERVER ==========
// ======================================================================
function initDarkModeObserver() {
    // ===== PERBAIKAN: Cek apakah observer sudah ada =====
    if (window._darkModeObserver) {
        window._darkModeObserver.disconnect();
    }
    
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                // Update charts saat dark mode berubah
                setTimeout(() => {
                    try {
                        updateChartsForDarkMode();
                        
                        // Force update chart background
                        const isDark = document.body.classList.contains('dark-mode');
                        if (chartCustomer) {
                            chartCustomer.options.backgroundColor = isDark ? '#0f172a' : '#ffffff';
                            chartCustomer.update();
                        }
                        if (chartProspek) {
                            chartProspek.options.backgroundColor = isDark ? '#0f172a' : '#ffffff';
                            chartProspek.update();
                        }
                        if (targetChart) {
                            targetChart.options.backgroundColor = isDark ? '#0f172a' : '#ffffff';
                            targetChart.update();
                        }
                        if (trendChart) {
                            trendChart.options.backgroundColor = isDark ? '#0f172a' : '#ffffff';
                            trendChart.update();
                        }
                    } catch (e) {
                        console.warn('Dark mode observer error:', e);
                    }
                }, 100);
            }
        });
    });
    
    observer.observe(document.body, { attributes: true });
    window._darkModeObserver = observer; // Simpan referensi global
    return observer;
}

// Inisialisasi observer setelah DOM siap
let darkModeObserver = null;

// ======================================================================

// ========== INIT EVENT LISTENERS ==========
function initEventListeners() {
    initSidebarHover();
    initProfilePhoto();
    
    // Save profile
    document.getElementById('saveProfileBtn')?.addEventListener('click', saveUserProfile);

    // ===== PERBAIKAN: HANYA 1 EVENT LISTENER UNTUK SELECT ALL =====
    {
        const selectAllBtn = document.getElementById('selectAllTransaksi');
        if (selectAllBtn) {
            const newSelectAll = selectAllBtn.cloneNode(true);
            selectAllBtn.parentNode.replaceChild(newSelectAll, selectAllBtn);
            document.getElementById('selectAllTransaksi')?.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (DEBUG) console.log('Select All clicked!');
                toggleSelectAllTransaksi();
            });
        }
    }
    
    // ===== PERBAIKAN: HANYA 1 EVENT LISTENER UNTUK DELETE SELECTED =====
    {
        const deleteSelectedBtn = document.getElementById('deleteSelectedTransaksi');
        if (deleteSelectedBtn) {
            const newDeleteSelected = deleteSelectedBtn.cloneNode(true);
            deleteSelectedBtn.parentNode.replaceChild(newDeleteSelected, deleteSelectedBtn);
            document.getElementById('deleteSelectedTransaksi')?.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                deleteSelectedTransaksi();
            });
        }
    }
    
    // ===== PERBAIKAN: HANYA 1 EVENT LISTENER UNTUK MOVE SELECTED =====
    {
        const moveSelectedBtn = document.getElementById('moveSelectedToFollowupBtn');
        if (moveSelectedBtn) {
            const newMoveSelected = moveSelectedBtn.cloneNode(true);
            moveSelectedBtn.parentNode.replaceChild(newMoveSelected, moveSelectedBtn);
            document.getElementById('moveSelectedToFollowupBtn')?.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                moveSelectedToFollowup();
            });
        }
    }
    
    // ===== PERBAIKAN: HANYA 1 EVENT LISTENER UNTUK RIWAYAT =====
    {
        const historyBtn = document.getElementById('viewTransaksiHistoryBtn');
        if (historyBtn) {
            const newHistoryBtn = historyBtn.cloneNode(true);
            historyBtn.parentNode.replaceChild(newHistoryBtn, historyBtn);
            document.getElementById('viewTransaksiHistoryBtn')?.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                loadRiwayatTransaksi();
                showModal('riwayatTransaksiModal');
            });
        }
    }
    
    // Transaksi filters - setup sekali
    setupTransaksiFilters();
    
    let isSubmittingCustomer = false;
    let isSubmittingProspek = false;
    
    // Add customer
    document.getElementById('addCustomerBtn')?.addEventListener('click', () => {
        document.getElementById('customerDate').value = getTodayDate();
        document.getElementById('customerId').value = '';
        document.getElementById('customerName').value = '';
        document.getElementById('customerPhone').value = '';
        document.getElementById('customerApk').value = '';
        document.getElementById('customerUpline').value = '';
        showModal('customerModal');
    });
    
    document.getElementById('addCustomerFullBtn')?.addEventListener('click', () => {
        document.getElementById('customerDate').value = getTodayDate();
        document.getElementById('customerId').value = '';
        document.getElementById('customerName').value = '';
        document.getElementById('customerPhone').value = '';
        document.getElementById('customerApk').value = '';
        document.getElementById('customerUpline').value = '';
        showModal('customerModal');
    });
    
    document.getElementById('saveCustomerBtn')?.addEventListener('click', async function(e) {
        if (this.disabled) {
            showNotifTop('⏳ Mohon tunggu, data sedang diproses...', true);
            return;
        }
        
        this.disabled = true;
        const originalText = this.textContent;
        this.textContent = '⏳ Menyimpan...';
        
        try {
            const agentId = document.getElementById('customerId').value;
            const nama = document.getElementById('customerName').value;
            let hp = document.getElementById('customerPhone').value;
            const apk = document.getElementById('customerApk').value;
            const upline = document.getElementById('customerUpline').value;
            const deadline = document.getElementById('customerDate').value;
            
            if (!agentId || !nama) {
                showNotifTop('⚠️ ID Agent dan Nama wajib diisi!', true);
                return;
            }
            
            hp = hp.replace(/[^\d]/g, '');
            if (hp.startsWith('0')) hp = hp.substring(1);
            
            const success = await addCustomer(agentId, nama, hp, apk, upline, deadline);
            if (success) {
                closeModal('customerModal');
                document.getElementById('customerId').value = '';
                document.getElementById('customerName').value = '';
                document.getElementById('customerPhone').value = '';
                document.getElementById('customerApk').value = '';
                document.getElementById('customerUpline').value = '';
            }
        } catch (err) {
            console.error('Error:', err);
            showNotifTop('❌ Gagal: ' + err.message, true);
        } finally {
            this.disabled = false;
            this.textContent = originalText;
        }
    });
    
    // Add prospek
    document.getElementById('addProspekBtn')?.addEventListener('click', () => {
        document.getElementById('prospekDeadline').value = getTodayDate();
        document.getElementById('prospekName').value = '';
        document.getElementById('prospekPhone').value = '';
        showModal('prospekModal');
    });
    
    document.getElementById('addProspekFullBtn')?.addEventListener('click', () => {
        document.getElementById('prospekDeadline').value = getTodayDate();
        document.getElementById('prospekName').value = '';
        document.getElementById('prospekPhone').value = '';
        showModal('prospekModal');
    });
    
    document.getElementById('saveProspekBtn')?.addEventListener('click', async function(e) {
        if (this.disabled) {
            showNotifTop('⏳ Mohon tunggu, data sedang diproses...', true);
            return;
        }
        
        this.disabled = true;
        const originalText = this.textContent;
        this.textContent = '⏳ Menyimpan...';
        
        try {
            const nama = document.getElementById('prospekName').value;
            let hp = document.getElementById('prospekPhone').value;
            const deadline = document.getElementById('prospekDeadline').value;
            const tipeAgent = document.getElementById('prospekTipe').value;
            
            if (!nama) {
                showNotifTop('⚠️ Nama wajib diisi!', true);
                return;
            }
            
            hp = hp.replace(/[^\d]/g, '');
            if (hp.startsWith('0')) hp = hp.substring(1);
            
            const success = await addProspek(nama, hp, deadline, tipeAgent);
            if (success) {
                closeModal('prospekModal');
                document.getElementById('prospekName').value = '';
                document.getElementById('prospekPhone').value = '';
                document.getElementById('prospekTipe').value = 'AGENT';
            }
        } catch (err) {
            console.error('Error:', err);
            showNotifTop('❌ Gagal: ' + err.message, true);
        } finally {
            this.disabled = false;
            this.textContent = originalText;
        }
    });
    
    // Reminder
    document.getElementById('addReminderBtn')?.addEventListener('click', () => {
        document.getElementById('reminderTitle').value = '';
        document.getElementById('reminderDesc').value = '';
        document.getElementById('reminderDateTime').value = '';
        showModal('reminderModal');
    });
    document.getElementById('saveReminderBtn')?.addEventListener('click', async () => {
        const title = document.getElementById('reminderTitle').value;
        const description = document.getElementById('reminderDesc').value;
        const datetime = document.getElementById('reminderDateTime').value;
        
        if (!title) {
            showNotifTop('⚠️ Judul pengingat wajib diisi!', true);
            return;
        }
        
        await window.db.from('reminders').insert({
            title: title,
            description: description,
            datetime: datetime,
            user_id: currentUser.id,
            user_name: currentUserName,
            created_at: new Date().toISOString()
        });
        
        showNotifTop('✅ Pengingat berhasil ditambahkan');
        closeModal('reminderModal');
        await loadReminders();
    });
    
    // Pesan
    document.getElementById('addPesanBtn')?.addEventListener('click', async () => {
        await loadUsersForSelect();
        showModal('pesanModal');
    });
    document.getElementById('savePesanBtn')?.addEventListener('click', async () => {
        const toId = document.getElementById('pesanTo').value;
        const message = document.getElementById('pesanMessage').value;
        
        if (!toId || !message) {
            showNotifTop('⚠️ Lengkapi data!', true);
            return;
        }
        
        await sendPesan(toId, message);
        closeModal('pesanModal');
        document.getElementById('pesanTo').value = '';
        document.getElementById('pesanMessage').value = '';
        
        // ===== TAMBAHKAN INI =====
        // Refresh pesan page jika sedang aktif
        if (document.getElementById('pesanPage')?.style.display !== 'none') {
            if (typeof loadPesanUsers === 'function') {
                loadPesanUsers();
            }
            if (pesanCurrentChatId && typeof loadPesanMessages === 'function') {
                loadPesanMessages(pesanCurrentChatId);
            }
        }
    });

    // ===== TAMBAH AGENT =====
    document.getElementById('addAgentBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showAddAgentModal();
    });
        
    // ===== TARGET MANAGEMENT EVENT LISTENERS =====
    document.getElementById('manageTargetBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // ===== PERBAIKAN: Cek role sebelum membuka modal =====
        if (currentUserRole !== 'owner') {
            showNotifTop('⚠️ Hanya Owner yang dapat mengelola target!', true);
            return;
        }
        
        document.getElementById('targetAgentInput').value = targetData.agent || 0;
        document.getElementById('targetUplineInput').value = targetData.upline || 0;
        document.getElementById('targetTransaksiInput').value = targetData.transaksi || 0;
        document.getElementById('targetSelisihInput').value = targetData.selisih || 0;
        showModal('manageTargetModal');
    });

    document.getElementById('saveTargetBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // ===== PERBAIKAN: Cek role sebelum menyimpan =====
        if (currentUserRole !== 'owner') {
            showNotifTop('⚠️ Hanya Owner yang dapat mengubah target!', true);
            return;
        }
        
        saveTargetData();
    });

    document.getElementById('cancelTargetBtn')?.addEventListener('click', () => closeModal('manageTargetModal'));
    
    // Transaksi
    document.getElementById('saveTransaksiBtn')?.addEventListener('click', async () => {
        const nominal = document.getElementById('transaksiNominal').value;
        const keterangan = document.getElementById('transaksiKeterangan').value;
        const tanggal = document.getElementById('transaksiTanggal').value;
        await saveTransaksiGlobal(nominal, keterangan, tanggal, currentTransaksiId);
        closeModal('inputTransaksiModal');
        currentTransaksiId = null;
    });
    document.getElementById('cancelTransaksiBtn')?.addEventListener('click', () => closeModal('inputTransaksiModal'));
    
    // Info modal
    document.getElementById('infoBtn')?.addEventListener('click', () => showModal('infoModal'));
    document.getElementById('infoModalClose')?.addEventListener('click', () => closeModal('infoModal'));
    
    // Deadline notification
    {
        const deadlineBtn = document.getElementById('deadlineNotifBtn');
        if (deadlineBtn) {
            const newDeadlineBtn = deadlineBtn.cloneNode(true);
            deadlineBtn.parentNode.replaceChild(newDeadlineBtn, deadlineBtn);
            const freshDeadlineBtn = document.getElementById('deadlineNotifBtn');
            if (freshDeadlineBtn) {
                freshDeadlineBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    showDeadlinePopup();
                });
            }
        }
    }
    
    // ===== Pesan Notification =====
    {
        const pesanBtn = document.getElementById('pesanNotifBtn');
        if (pesanBtn) {
            const newPesanBtn = pesanBtn.cloneNode(true);
            pesanBtn.parentNode.replaceChild(newPesanBtn, pesanBtn);
            const freshPesanBtn = document.getElementById('pesanNotifBtn');
            if (freshPesanBtn) {
                freshPesanBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    navigateTo('pesan');
                });
            }
        }
    }
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    
    // ===== NAVIGATION MENU (HANYA 1 LISTENER) =====
    document.querySelectorAll('.menu-item[data-page]').forEach(item => {
        // Hapus listener lama dengan clone
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        const freshItem = document.querySelector(`.menu-item[data-page="${item.dataset.page}"]`);
        if (freshItem) {
            freshItem.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const page = this.dataset.page;
                navigateTo(page);
                if (isMobile()) document.getElementById('sidebar')?.classList.remove('active');
                updateSidebarBodyClass();
            });
        }
    });
    
    // Password toggle
    document.getElementById('togglePasswordBtn')?.addEventListener('click', () => {
        const input = document.getElementById('loginPassword');
        input.type = input.type === 'password' ? 'text' : 'password';
    });
    
    // Search
    document.getElementById('searchBtn')?.addEventListener('click', performSearch);
    document.getElementById('clearSearchBtn')?.addEventListener('click', clearSearch);
    document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    // Close modal buttons
    document.querySelectorAll('.closeModalBtn').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.modal));
    });
    
    // Auto format inputs
    const customerId = document.getElementById('customerId');
    const customerName = document.getElementById('customerName');
    const customerPhone = document.getElementById('customerPhone');
    const prospekName = document.getElementById('prospekName');
    const prospekPhone = document.getElementById('prospekPhone');
    const profilePhone = document.getElementById('profilePhone');
    
    if (customerId) customerId.addEventListener('input', function() { formatAgentIdAuto(this); });
    if (customerName) customerName.addEventListener('input', function() { formatNamaAuto(this); });
    if (customerPhone) customerPhone.addEventListener('input', function() { formatPhoneAuto(this); });
    if (prospekName) prospekName.addEventListener('input', function() { formatNamaAuto(this); });
    if (prospekPhone) prospekPhone.addEventListener('input', function() { formatPhoneAuto(this); });
    if (profilePhone) profilePhone.addEventListener('input', function() { formatPhone(this); });
    
    // Modal click outside
    const modals = ['customerModal', 'prospekModal', 'profileModal', 'detailModal', 'infoModal', 
                    'manageTargetModal', 'inputTransaksiModal', 'transaksiListModal', 'reminderModal', 
                    'pesanModal', 'addCsModal', 'pilihNomorModal', 'editDeadlineModal', 'previewPhotoModal',
                    'followupConfirmModal', 'prospekDihubungiModal', 'prospekNegosiasiModal', 'convertModal'];
    modals.forEach(id => setupModalClickOutside(id));

    // ===== SELECT ALL AGENT =====
    setupSelectAll('selectAllAgent', '#dbAgentList', selectedAgentIds, '.db-item-checkbox-agent');
    
    // ================================================================
    // ========== BROADCAST EVENT LISTENERS ==========
    // ================================================================
    
    // Source type change
    document.querySelectorAll('input[name="sourceType"]').forEach(radio => {
        radio.addEventListener('change', loadBroadcastNumbers);
    });
    
    // Customer filter checkboxes
    document.querySelectorAll('#customerFilterCard input').forEach(cb => {
        cb.addEventListener('change', loadBroadcastNumbers);
    });
    
    // Prospek filter checkboxes
    document.querySelectorAll('#prospekFilterCard input').forEach(cb => {
        cb.addEventListener('change', loadBroadcastNumbers);
    });
    
    // Custom numbers input
    document.getElementById('customNumbers')?.addEventListener('input', loadBroadcastNumbers);
    
    // Refresh numbers
    document.getElementById('refreshNumbersBtn')?.addEventListener('click', loadBroadcastNumbers);
    
    // Template functions
    document.getElementById('templateSelect')?.addEventListener('change', loadBroadcastTemplate);
    document.getElementById('saveTemplateBtn')?.addEventListener('click', saveBroadcastTemplate);
    document.getElementById('deleteTemplateBtn')?.addEventListener('click', deleteBroadcastTemplate);
    
    // Send broadcast
    document.getElementById('sendBroadcastBtn')?.addEventListener('click', sendBroadcast);
    
// ================================================================
// ========== BROADCAST UPLINE EVENT LISTENERS ==========
// ================================================================
function initBroadcastUplineListeners() {
    document.querySelectorAll('input[name="uplineSourceType"]').forEach(radio => {
        radio.addEventListener('change', loadUplineNumbers);
    });
    
    document.querySelectorAll('#uplineCustomerFilter input').forEach(cb => {
        cb.addEventListener('change', loadUplineNumbers);
    });
    
    document.getElementById('uplineCustomNumbers')?.addEventListener('input', loadUplineNumbers);
    
    document.getElementById('refreshUplineBtn')?.addEventListener('click', loadUplineNumbers);
    
    document.getElementById('uplineTemplateSelect')?.addEventListener('change', loadUplineTemplate);
    document.getElementById('uplineSaveTemplateBtn')?.addEventListener('click', saveUplineTemplate);
    document.getElementById('uplineDeleteTemplateBtn')?.addEventListener('click', deleteUplineTemplate);
    
    document.getElementById('sendUplineBroadcastBtn')?.addEventListener('click', sendUplineBroadcast);
}
    
    // ================================================================
    // ========== LOAD ALL TEMPLATES & HISTORY ==========
    // ================================================================
    
    loadAllTemplates();
    
    // ================================================================
    // ========== KODE LAINNYA (DATABASE BUTTONS, ETC) ==========
    // ================================================================
    
    // ===== DATABASE BUTTONS =====
    // Select All buttons
    setupSelectAll('selectAllClosing', '#dbClosingList', selectedClosingIds);
    setupSelectAll('selectAllTidak', '#dbTidakList', selectedTidakIds);
    setupSelectAll('selectAllNomorSalah', '#dbNomorSalahList', selectedNomorSalahIds);
    setupSelectAll('selectAllCommitment', '#dbCommitmentList', selectedCommitmentIds);
    setupSelectAll('selectAllAgent', '#dbAgentList', selectedAgentIds, '.db-item-checkbox-agent');
    setupSelectAll('selectAllProduk', '#produkList', selectedProdukIds);
    
    // ===== DELETE BUTTONS =====
    document.getElementById('deleteSelectedClosing')?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        deleteSelectedDBItems('db_closing', selectedClosingIds, loadDBClosing);
    });
    document.getElementById('deleteAllClosing')?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        deleteAllDBItems('db_closing', loadDBClosing);
    });
    
    document.getElementById('deleteSelectedTidak')?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        deleteSelectedDBItems('db_tidak_tertarik', selectedTidakIds, loadDBTidak);
    });
    document.getElementById('deleteAllTidak')?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        deleteAllDBItems('db_tidak_tertarik', loadDBTidak);
    });
    
    document.getElementById('deleteSelectedNomorSalah')?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        deleteSelectedDBItems('nomor_salah', selectedNomorSalahIds, loadDBNomorSalah);
    });
    document.getElementById('deleteAllNomorSalah')?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        deleteAllDBItems('nomor_salah', loadDBNomorSalah);
    });
    
    document.getElementById('deleteSelectedCommitment')?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        deleteSelectedDBItems('db_commitment', selectedCommitmentIds, loadDBCommitment);
    });
    document.getElementById('deleteAllCommitment')?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        deleteAllDBItems('db_commitment', loadDBCommitment);
    });
    
    document.getElementById('deleteSelectedProduk')?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        deleteSelectedProduk();
    });
    document.getElementById('deleteAllProduk')?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        deleteAllProduk();
    });
    
    // ===== DELETE SELECTED AGENT =====
    document.getElementById('deleteSelectedAgent')?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const selectedIds = Array.from(selectedAgentIds.keys());
        if (selectedIds.length === 0) {
            showNotifTop('⚠️ Tidak ada data yang dipilih', true);
            return;
        }
        if (!confirm(`Hapus ${selectedIds.length} data agent?`)) return;
        
        const progress = showFloatingProgress('🗑️ Menghapus Agent', selectedIds.length);
        let deleted = 0;
        
        selectedIds.forEach(async (id) => {
            try {
                await window.db.from('db_agent').delete().eq('id', id);
                selectedAgentIds.delete(id);
                deleted++;
                progress.update(Math.floor((deleted / selectedIds.length) * 100), 'Menghapus', `Memproses...`, deleted, selectedIds.length);
                if (deleted === selectedIds.length) {
                    progress.update(100, 'Selesai', `Berhasil menghapus ${deleted} data`, deleted, selectedIds.length);
                    showNotifTop(`✅ ${deleted} data berhasil dihapus`);
                    setTimeout(() => progress.hide(), 1000);
                    await loadDatabaseAgent();
                }
            } catch (e) {
                console.error('Gagal hapus:', e);
            }
        });
    });

    // ===== DELETE ALL AGENT =====
    document.getElementById('deleteAllAgent')?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('⚠️ Hapus SEMUA data Agent? Tidak bisa dibatalkan!')) return;
        
        deleteAllDBItems('db_agent', loadDatabaseAgent);
    });
    
    // ===== TRANSAKSI BUTTONS =====
    document.getElementById('deleteSelectedTransaksi')?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        deleteSelectedTransaksi();
    });
    
    // Hapus Semua - DISEMBUNYIKAN
    const deleteAllTransaksiBtn = document.getElementById('deleteAllTransaksiBtn');
    if (deleteAllTransaksiBtn) {
        deleteAllTransaksiBtn.style.display = 'none';
    }
    
    // Import
    setupImportExcel();
    setupAgentImport();
    setupProdukImport();
    
    // Agent filters
    setupAgentFilters();
    
    // Export buttons
    document.getElementById('exportAgentExcelBtn')?.addEventListener('click', exportAgentToExcel);
    document.getElementById('exportProdukExcelBtn')?.addEventListener('click', exportProdukToExcel);

    // ===== DOWNLOAD CONTOH AGENT =====
    document.getElementById('downloadAgentExampleBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        downloadAgentExample();
    });
    
    // Tarif Admin
    document.getElementById('manageTarifAdminBtn')?.addEventListener('click', () => {
        loadTarifAdmin();
        showModal('tarifAdminModal');
    });
    document.getElementById('saveTarifAdminBtn')?.addEventListener('click', async () => {
        const cid = document.getElementById('tarifCid').value;
        const pospaid = document.getElementById('tarifPospaid').value;
        const prepaid = document.getElementById('tarifPrepaid').value;
        const nontaglis = document.getElementById('tarifNontaglis').value;
        await saveTarifAdmin(cid, pospaid, prepaid, nontaglis, currentEditTarifId);
        clearTarifForm();
    });
    document.getElementById('clearTarifFormBtn')?.addEventListener('click', clearTarifForm);
    document.getElementById('closeTarifAdminModal')?.addEventListener('click', () => closeModal('tarifAdminModal'));
    document.getElementById('exportTarifExcelBtn')?.addEventListener('click', () => {
        if (tarifAdminData.length === 0) {
            showNotifTop('Tidak ada data untuk diexport', true);
            return;
        }
        const exportData = tarifAdminData.map(item => ({
            'CID': item.cid,
            'PLN Pospaid': item.admin_pospaid || 0,
            'PLN Prepaid': item.admin_prepaid || 0,
            'PLN Nontaglis': item.admin_nontaglis || 0
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Admin per CID');
        XLSX.writeFile(wb, `tarif_admin_${new Date().toISOString().split('T')[0]}.xlsx`);
        showNotifTop('✅ Export data berhasil!');
    });
    document.getElementById('downloadTarifExampleBtn')?.addEventListener('click', () => {
        const data = [{ cid: '5213247', pospaid: 7200, prepaid: 7200, nontaglis: 7200 }];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Admin per CID');
        XLSX.writeFile(wb, 'contoh_tarif_admin.xlsx');
        showNotifTop('📋 Contoh file Excel berhasil diunduh');
    });
    
// ===== ADD CS =====
document.getElementById('addCsBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Reset form
    document.getElementById('csEmail').value = '';
    document.getElementById('csPassword').value = '';
    document.getElementById('csName').value = '';
    document.getElementById('csPhone').value = '';
    document.getElementById('csRole').value = 'cs';
    
    // Hide password result
    const passwordResult = document.getElementById('passwordResult');
    if (passwordResult) passwordResult.style.display = 'none';
    
    // Reset password visibility
    const passwordInput = document.getElementById('csPassword');
    const toggleBtn = document.getElementById('toggleCsPasswordBtn');
    if (passwordInput) passwordInput.type = 'password';
    if (toggleBtn) toggleBtn.textContent = '👁️';
    
    // Enable save button
    const saveBtn = document.getElementById('saveCsBtn');
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Simpan';
        saveBtn.style.opacity = '1';
    }
    
    showModal('addCsModal');
});

document.getElementById('saveCsBtn')?.addEventListener('click', async function() {
    // Cegah multiple click
    if (this.disabled) {
        showNotifTop('⏳ Mohon tunggu, sedang diproses...', true);
        return;
    }
    
    const email = document.getElementById('csEmail').value.trim();
    const password = document.getElementById('csPassword').value.trim();
    const nama = document.getElementById('csName').value.trim();
    let hp = document.getElementById('csPhone').value.trim();
    const role = document.getElementById('csRole').value;
    
    // ===== VALIDASI =====
    if (!email) {
        showNotifTop('⚠️ Email wajib diisi!', true);
        document.getElementById('csEmail').focus();
        return;
    }
    
    if (!password || password.length < 6) {
        showNotifTop('⚠️ Password minimal 6 karakter!', true);
        document.getElementById('csPassword').focus();
        return;
    }
    
    if (!nama) {
        showNotifTop('⚠️ Nama Lengkap wajib diisi!', true);
        document.getElementById('csName').focus();
        return;
    }
    
    // ===== FORMAT HP =====
    if (hp) {
        hp = hp.replace(/[^\d]/g, '');
        if (hp.startsWith('0')) hp = hp.substring(1);
        if (hp && !hp.startsWith('62')) hp = '62' + hp;
        hp = '+' + hp;
    }
    
    // ===== DISABLE BUTTON =====
    this.disabled = true;
    const originalText = this.textContent;
    this.textContent = '⏳ Memproses...';
    this.style.opacity = '0.6';
    
    try {
        // ===== 1. REGISTER KE SUPABASE AUTH =====
        const { data: userCredential, error: signUpError } = await window.db.auth.signUp({
            email: email,
            password: password
        });
        
        if (signUpError) {
            if (signUpError.message.includes('already registered')) {
                showNotifTop(`⚠️ Email "${email}" sudah terdaftar!`, true);
            } else {
                showNotifTop('❌ Gagal register: ' + signUpError.message, true);
            }
            return;
        }
        
        if (!userCredential.user) {
            showNotifTop('❌ Gagal membuat user!', true);
            return;
        }
        
        // ===== 2. INSERT KE TABEL USERS =====
        const { error: insertError } = await window.db.from('users').insert({
            id: userCredential.user.id,
            nama: nama,
            email: email,
            hp: hp || null,
            role: role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
        
        if (insertError) {
            // Jika gagal insert, hapus user dari auth
            try {
                await window.db.auth.admin.deleteUser(userCredential.user.id);
            } catch (e) {
                console.warn('Gagal hapus user dari auth:', e);
            }
            showNotifTop('❌ Gagal menyimpan data: ' + insertError.message, true);
            return;
        }
        
        // ===== 3. TAMPILKAN PASSWORD =====
        const roleLabel = role === 'owner' ? '👑 Owner' : '👤 CS Agent';
        const passwordResult = document.getElementById('passwordResult');
        const passwordResultText = document.getElementById('passwordResultText');
        
        if (passwordResult && passwordResultText) {
            passwordResultText.textContent = password;
            passwordResult.style.display = 'block';
            
            // Scroll ke password result
            passwordResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // ===== 4. RESET FORM (kecuali password result) =====
        document.getElementById('csEmail').value = '';
        document.getElementById('csPassword').value = '';
        document.getElementById('csName').value = '';
        document.getElementById('csPhone').value = '';
        // Role tetap di posisi terakhir yang dipilih
        
        showNotifTop(`✅ ${roleLabel} "${nama}" berhasil ditambahkan!`);
        
        // ===== 5. RELOAD DATA =====
        await loadUsersList();
        
        // ===== 6. UPDATE MENU JIKA ROLE OWNER =====
        if (role === 'owner' && currentUserRole === 'owner') {
            // Refresh menu untuk menampilkan owner baru
            // Owner baru akan muncul di daftar user
        }
        
    } catch (err) {
        console.error('Error:', err);
        showNotifTop('❌ Gagal: ' + err.message, true);
    } finally {
        // ===== ENABLE BUTTON =====
        this.disabled = false;
        this.textContent = originalText;
        this.style.opacity = '1';
    }
});

// ===== TOGGLE PASSWORD VISIBILITY =====
document.getElementById('toggleCsPasswordBtn')?.addEventListener('click', function() {
    const input = document.getElementById('csPassword');
    if (input.type === 'password') {
        input.type = 'text';
        this.textContent = '🙈';
    } else {
        input.type = 'password';
        this.textContent = '👁️';
    }
});

// ===== COPY PASSWORD =====
document.getElementById('copyPasswordBtn')?.addEventListener('click', function() {
    const passwordText = document.getElementById('passwordResultText');
    if (!passwordText) return;
    
    const password = passwordText.textContent;
    if (!password) return;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(password).then(() => {
            showNotifTop('📋 Password berhasil dicopy!');
            this.textContent = '✅ Copied!';
            setTimeout(() => {
                this.textContent = '📋 Copy';
            }, 2000);
        }).catch(() => {
            // Fallback
            copyPasswordFallback(password);
        });
    } else {
        // Fallback
        copyPasswordFallback(password);
    }
});

// ===== FALLBACK COPY PASSWORD =====
function copyPasswordFallback(password) {
    const textArea = document.createElement('textarea');
    textArea.value = password;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showNotifTop('📋 Password berhasil dicopy!');
        const btn = document.getElementById('copyPasswordBtn');
        if (btn) {
            btn.textContent = '✅ Copied!';
            setTimeout(() => {
                btn.textContent = '📋 Copy';
            }, 2000);
        }
    } catch (e) {
        showNotifTop('❌ Gagal copy password', true);
    }
    textArea.remove();
}
    
    // Edit deadline
    document.getElementById('saveDeadlineBtn')?.addEventListener('click', saveDeadline);
    document.getElementById('cancelDeadlineBtn')?.addEventListener('click', () => closeModal('editDeadlineModal'));
    
    // Add product
    document.getElementById('addProdukBtn')?.addEventListener('click', () => {
        document.getElementById('produkMasterNama').value = '';
        document.getElementById('produkMasterHpp').value = '';
        document.getElementById('produkMasterHargaJual').value = '';
        document.getElementById('produkMasterKeterangan').value = '';
        document.getElementById('produkMasterTitle').innerText = '🏷️ Tambah Produk';
        showModal('produkMasterModal');
    });
    document.getElementById('saveProdukMasterBtn')?.addEventListener('click', async () => {
        const nama = document.getElementById('produkMasterNama').value;
        const hpp = document.getElementById('produkMasterHpp').value;
        const keterangan = document.getElementById('produkMasterKeterangan').value;
        const jenisProduk = document.getElementById('produkMasterJenis').value;
        let hargaJual = 0;
        let adminDefault = 0;
        let cidBased = 'no';
        if (jenisProduk === 'tanpa_admin') {
            hargaJual = document.getElementById('produkMasterHargaJual').value;
        } else {
            adminDefault = document.getElementById('produkMasterAdminDefault').value;
            cidBased = document.getElementById('produkMasterCidBased').value;
        }
        await saveProduk(nama, hpp, hargaJual, keterangan, adminDefault, jenisProduk, cidBased, currentEditProdukId);
        closeModal('produkMasterModal');
    });
    document.getElementById('cancelProdukMasterBtn')?.addEventListener('click', () => closeModal('produkMasterModal'));
    document.getElementById('produkMasterJenis')?.addEventListener('change', function() {
        const tanpaAdminFields = document.getElementById('tanpaAdminFields');
        const beradminFields = document.getElementById('beradminFields');
        if (this.value === 'tanpa_admin') {
            tanpaAdminFields.style.display = 'block';
            beradminFields.style.display = 'none';
        } else {
            tanpaAdminFields.style.display = 'none';
            beradminFields.style.display = 'block';
        }
    });
}

// ===== MOVING SELECTED TO FOLLOWUP =====
// ===== TOMBOL PINDAH KE FOLLOWUP =====
document.getElementById('moveSelectedToFollowupBtn')?.addEventListener('click', async function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (currentUserRole !== 'owner') {
        showNotifTop('⚠️ Hanya Owner yang dapat memindahkan data!', true);
        return;
    }
    
    const selectedIds = Array.from(selectedTransaksiIds.keys());
    if (selectedIds.length === 0) {
        showNotifTop('⚠️ Tidak ada data yang dipilih!', true);
        return;
    }
    
    // Simpan ID yang dipilih
    selectedTransaksiIdsForMove = selectedIds;
    
    // ===== LOAD CS LIST =====
    const csList = await loadCsList();
    if (csList.length === 0) {
        showNotifTop('⚠️ Tidak ada CS Agent selain Anda! Tambahkan CS terlebih dahulu.', true);
        return;
    }
    
    // ===== RENDER CS CHECKBOX =====
    renderCsCheckboxList(csList);
    
    // ===== UPDATE PREVIEW =====
    updatePreviewDataTransaksi();
    
    // ===== TAMPILKAN MODAL =====
    showModal('pilihCsTransaksiModal');
});

// ===== KONFIRMASI PINDAH =====
document.getElementById('confirmPindahKeCsTransaksiBtn')?.addEventListener('click', async function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (this.disabled) {
        showNotifTop('⏳ Proses sedang berjalan...', true);
        return;
    }
    
    const csIds = getSelectedCsTransaksi();
    if (csIds.length === 0) {
        showNotifTop('⚠️ Pilih minimal satu CS tujuan!', true);
        return;
    }
    
    const metode = document.getElementById('metodePembagianTransaksi').value;
    const totalData = selectedTransaksiIdsForMove.length;
    
    // Konfirmasi
    let confirmMsg = `📋 Pindahkan ${totalData} data ke ${csIds.length} CS?\n\n`;
    if (metode === 'rata') {
        const perCs = Math.floor(totalData / csIds.length);
        const sisa = totalData - (perCs * csIds.length);
        confirmMsg += `Metode: Bagikan rata\n`;
        confirmMsg += `Masing-masing: ~${perCs} data${sisa > 0 ? `, ${sisa} CS mendapat +1 data` : ''}\n\n`;
    } else {
        const csName = csListData.find(c => c.id === csIds[0])?.nama || 'CS';
        confirmMsg += `Metode: Kirim ke satu CS (${csName})\n\n`;
    }
    confirmMsg += `Lanjutkan?`;
    
    if (!confirm(confirmMsg)) return;
    
    // Disable button
    this.disabled = true;
    this.textContent = '⏳ Memproses...';
    this.style.opacity = '0.6';
    
    try {
        await distributeDataToCs(selectedTransaksiIdsForMove, csIds, metode);
        
        // Reset
        selectedTransaksiIdsForMove = [];
        selectedTransaksiIds.clear();
        closeModal('pilihCsTransaksiModal');
        await loadDbTransaksi();
        await loadCustomers();
        
    } catch (err) {
        console.error('Error:', err);
        showNotifTop('❌ Gagal: ' + err.message, true);
    } finally {
        this.disabled = false;
        this.textContent = '✅ Konfirmasi Pindah';
        this.style.opacity = '1';
    }
});

// ===== BATAL =====
document.getElementById('batalPindahKeCsTransaksiBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    selectedTransaksiIdsForMove = [];
    closeModal('pilihCsTransaksiModal');
});

// ===== METODE PEMBAGIAN CHANGE =====
document.getElementById('metodePembagianTransaksi')?.addEventListener('change', function() {
    const metode = this.value;
    const satuCsGroup = document.getElementById('satuCsGroup');
    const rataCsGroup = document.getElementById('rataCsGroup');
    
    if (metode === 'satu') {
        // Hanya pilih satu CS
        const checkboxes = document.querySelectorAll('.cs-checkbox-transaksi');
        checkboxes.forEach(cb => {
            cb.checked = false;
            cb.disabled = true;
        });
        // Aktifkan yang pertama
        if (checkboxes.length > 0) {
            checkboxes[0].disabled = false;
            checkboxes[0].checked = true;
        }
    } else {
        const checkboxes = document.querySelectorAll('.cs-checkbox-transaksi');
        checkboxes.forEach(cb => {
            cb.disabled = false;
        });
    }
    
    updatePreviewDataTransaksi();
});

// ===== LOGIN =====
document.getElementById('loginBtn')?.addEventListener('click', async function(e) {
    e.preventDefault();
    e.stopPropagation();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorEl = document.getElementById('loginError');
    if (!email || !password) { errorEl.textContent = '⚠️ Email dan password wajib diisi!'; return; }
    showLoading('⏳ Memproses login...', true);
    updateLoadingStep(0);
    this.disabled = true;
    this.textContent = '⏳ Memproses...';
    errorEl.textContent = '';
    try {
        const { data, error } = await window.db.auth.signInWithPassword({ email, password });
        if (error) { errorEl.textContent = '❌ ' + error.message; hideLoading(); this.disabled = false; this.textContent = 'Masuk'; return; }
        if (data.user) {
            currentUser = data.user;
            updateLoadingStep(1);
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('app').style.display = 'block';
            updateLoadingStep(2);
            const { data: userData } = await window.db.from('users').select('*').eq('id', currentUser.id).single();
            if (userData) {
                currentUserName = userData.nama || currentUser.email;
                currentUserRole = userData.role || 'cs';
                document.getElementById('topUserName').innerText = currentUserName;
                document.getElementById('profileImg').src = userData.foto || 'https://i.pravatar.cc/40';
                updateLogoUser(currentUserName);
            }
            updateLoadingStep(3);
            // ===== PARALEL LOADING =====
            await Promise.all([
                loadCustomers(),
                loadProspek(),
                loadDatabaseAgent(),
                loadProduk(),
                loadDbTransaksi(),
                loadDBClosing(),
                loadDBTidak(),
                loadDBNomorSalah(),
                loadDBCommitment(),
                loadReminders(),
                loadMessages(),
                loadTarifAdmin(),
                loadTransaksiGlobal()
            ]);
            updateLoadingStep(4);
            await loadTargetData();
            updateTrendChart();
            await updateTargetDisplay();
            updateLoadingStep(5);
            if (currentUserRole === 'owner') {
                document.getElementById('ownerMenu').style.display = 'block';
                document.getElementById('menuDbAgent').style.display = 'flex';
                document.getElementById('menuDbTransaksi').style.display = 'flex';
                document.getElementById('menuImport').style.display = 'flex';
            } else {
                document.getElementById('ownerMenu').style.display = 'none';
                document.getElementById('menuDbAgent').style.display = 'none';
                document.getElementById('menuDbTransaksi').style.display = 'none';
                document.getElementById('menuImport').style.display = 'none';
            }
            navigateTo('dashboard');
            setTimeout(() => { initBadges(); initDarkMode(); initDarkModeObserver(); }, 100);
            setTimeout(hideLoading, 500);
            showNotifTop('✅ Selamat datang, ' + currentUserName + '!');
        }
    } catch (err) {
        errorEl.textContent = '❌ ' + err.message;
        console.error('Login error:', err);
        hideLoading();
    } finally {
        this.disabled = false;
        this.textContent = 'Masuk';
    }
});

// ===== ENTER KEY UNTUK LOGIN =====
document.getElementById('loginPassword')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('loginBtn').click();
    }
});

document.getElementById('loginEmail')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('loginPassword').focus();
    }
});

// ================================================================
// ========== AKHIR FILE ==========
// ================================================================

console.log('✅ PROSPEKTA script loaded successfully');
