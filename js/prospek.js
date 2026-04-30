// Semua fungsi terkait prospek
window.openProspek = () => {
    closeAllModal();
    modalProspek.style.display = "flex";
}

window.closeProspek = () => modalProspek.style.display = "none";

window.saveProspek = function() {
    // ... kode saveProspek ...
}

window.updateProspek = function(id, status) {
    db.collection("prospek").doc(id).update({ status: status });
}

window.deleteProspek = function(id) {
    if(confirm("Hapus prospek ini?")) {
        db.collection("prospek").doc(id).delete();
    }
}

window.convertToCustomer = function(id) {
    // ... kode convert ke customer ...
}

function loadProspek() {
    // ... kode load prospek ...
}
