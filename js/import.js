function selectType(type) {
    importType = type;
    document.querySelectorAll(".radio-box").forEach(el => {
        el.classList.remove("active");
    });
    event.currentTarget.classList.add("active");
}

function formatNomor(nomor) {
    // ... kode format nomor ...
}

window.importExcel = async function() {
    // ... kode import excel ...
}

// Event listener untuk file upload
document.getElementById("excelFile").addEventListener("change", function() {
    let file = this.files[0];
    if(!file) return;
    
    document.getElementById("fileInfo").innerHTML = 
        "📄 " + file.name + "<br>📦 " + (file.size / 1024).toFixed(1) + " KB";
    
    let box = document.getElementById("dropBox");
    box.style.border = "2px solid #7c3aed";
    box.style.background = "#ede9fe";
    document.getElementById("uploadText").innerText = "✅ File siap diimport";
});
