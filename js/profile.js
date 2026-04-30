window.openProfileModal = function() {
    // ... kode open profile ...
}

window.saveProfile = async function() {
    // ... kode save profile ...
}

window.closeProfile = function() {
    modalProfile.style.display = "none";
}

async function compressImage(file) {
    // ... kode compress image ...
}

// Event listener untuk foto profile
document.getElementById("previewFoto").addEventListener("click", function(e) {
    e.stopPropagation();
    document.getElementById("profile_foto").click();
});

document.getElementById("profile_foto").addEventListener("change", function() {
    // ... kode handle foto ...
});
