// Drag & Drop initialization
let isDragInit = false;
let isProspekDragInit = false;

function initDrag() {
    ["baru", "followup", "pending", "closing"].forEach(status => {
        let el = document.getElementById(status);
        if(el.sortableInstance) el.sortableInstance.destroy();
        
        el.sortableInstance = new Sortable(el, {
            group: "shared",
            animation: 150,
            draggable: ".mini-card",
            onAdd: function(evt) {
                let id = evt.item.getAttribute("data-id");
                let newStatus = evt.to.id;
                
                if(newStatus === "closing") {
                    evt.from.appendChild(evt.item);
                    openClosingChoice(id);
                    return;
                }
                
                db.collection("customers").doc(id).update({ status: newStatus });
            }
        });
    });
}

function initProspekDrag() {
    const mapStatus = {
        prospekBaru: "Baru",
        prospekHubungi: "Sudah Dihubungi",
        prospekTertarik: "Tertarik",
        prospekTidak: "Tidak Tertarik"
    };
    
    Object.keys(mapStatus).forEach(colId => {
        let el = document.getElementById(colId);
        if(el.sortableInstance) el.sortableInstance.destroy();
        
        el.sortableInstance = new Sortable(el, {
            group: "prospek",
            animation: 150,
            draggable: ".mini-card",
            onAdd: function(evt) {
                let id = evt.item.getAttribute("data-id");
                let newStatus = mapStatus[evt.to.id];
                
                if(newStatus === "Tidak Tertarik") {
                    evt.from.appendChild(evt.item);
                    openTidakTertarikChoice(id);
                    return;
                }
                
                db.collection("prospek").doc(id).update({ status: newStatus });
            }
        });
    });
}
