function showNotif(text) {
    let div = document.createElement("div");
    div.innerText = text;
    div.style.background = "#7c3aed";
    div.style.color = "white";
    div.style.padding = "10px";
    div.style.marginBottom = "10px";
    div.style.borderRadius = "8px";
    document.getElementById("notifBox").appendChild(div);
    setTimeout(() => div.remove(), 4000);
}

function updateNotifCount() {
    db.collection("followups").get().then(snap => {
        let now = new Date();
        let count = 0;
        let html = "";
        
        snap.forEach(doc => {
            let d = doc.data();
            if(d.reminder) {
                let t = new Date(d.reminder);
                if(t <= now && !d.notified) {
                    count++;
                    html += `<div class="notif-item"><b>Follow Up</b><br>${d.jenis_respon || '-'}</div>`;
                }
            }
        });
        
        document.getElementById("notifCount").innerText = count;
        document.getElementById("notifDropdown").innerHTML = html || "<div class='notif-item'>Tidak ada notifikasi</div>";
    });
}

function toggleNotif() {
    let el = document.getElementById("notifDropdown");
    el.style.display = el.style.display === "block" ? "none" : "block";
}

function checkReminder() {
    // ... kode check reminder ...
}
