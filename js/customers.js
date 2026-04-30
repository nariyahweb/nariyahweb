// Semua fungsi terkait customer
window.openModal = () => {
    closeAllModal();
    modal.style.display = "flex";
}

window.closeModal = () => modal.style.display = "none";

window.saveCustomer = function() {
    // ... kode saveCustomer ...
}

window.openFU = function(id) {
    closeAllModal();
    currentCustomer = id;
    modalFU.style.display = "flex";
}

window.saveFU = function() {
    // ... kode saveFU ...
}

window.deleteCustomer = function(id) {
    if(confirm("Yakin mau hapus customer ini?")) {
        db.collection("customers").doc(id).delete();
    }
}

window.openDetailCustomer = function(id) {
    // ... kode detail customer ...
}
