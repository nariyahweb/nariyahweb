// Fungsi utama dan utilities
function closeAllModal() {
    document.querySelectorAll(".modal").forEach(m => {
        m.style.display = "none";
    });
}

function loadData() {
    loadProspek();
    loadCustomers();
}

function loadCustomers() {
    db.collection("customers")
        .where("user_id", "==", auth.currentUser.uid)
        .onSnapshot(snap => {
            // ... kode load customers ...
            updateNotifCount();
            checkReminder();
            setTimeout(initDrag, 300);
        });
}

window.openWA = function(hp) {
    if(!hp) {
        alert("Nomor tidak tersedia");
        return;
    }
    let nomor = hp.replace("+", "");
    if(nomor.startsWith("0")) nomor = "62" + nomor.substring(1);
    window.open("https://wa.me/" + nomor, "_blank");
}

function validasiNomor(nomor) {
    // ... kode validasi nomor ...
}

// Sidebar logic
let sidebar = document.querySelector(".sidebar");
let hoverZone = document.getElementById("hoverZone");

function isMobile() {
    return window.innerWidth <= 768;
}

hoverZone.addEventListener("mouseenter", () => {
    if(!isMobile()) sidebar.classList.add("active");
});

sidebar.addEventListener("mouseleave", () => {
    if(!isMobile()) {
        setTimeout(() => sidebar.classList.remove("active"), 200);
    }
});

function toggleSidebar() {
    sidebar.classList.toggle("active");
}

// Close modal ketika klik di luar
document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", function(e) {
        if(e.target === modal) modal.style.display = "none";
    });
});

// Close sidebar & notif ketika klik di luar
document.addEventListener("click", function(e) {
    if(!e.target.closest(".sidebar") && !e.target.closest(".toggle-btn")) {
        sidebar.classList.remove("active");
    }
    if(!e.target.closest(".notif")) {
        document.getElementById("notifDropdown").style.display = "none";
    }
});

// Database archive functions
window.openDBClosing = function() {
    // ... kode open DB closing ...
}

window.openDBTidak = function() {
    // ... kode open DB tidak tertarik ...
}

function saveToClosingDB(id) {
    // ... kode save ke closing DB ...
}

function saveToTidakTertarikDB(id) {
    // ... kode save ke tidak tertarik DB ...
}

// Input validation for phone numbers
["hp", "p_hp"].forEach(id => {
    let input = document.getElementById(id);
    input.addEventListener("input", function() {
        if(!this.value.startsWith("+62")) this.value = "+62";
        this.value = "+62" + this.value.replace(/\D/g,'').replace(/^62/, '').slice(0,13);
    });
});
