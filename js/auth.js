// LOGIN
window.login = function() {
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    
    auth.signInWithEmailAndPassword(email.value, password.value)
        .then((res) => {
            console.log("Login sukses:", res.user.uid);
        })
        .catch(e => {
            alert("ERROR: " + e.message);
        });
}

// LOGOUT
window.logout = function() { 
    auth.signOut(); 
}

// State listener
const loginPage = document.getElementById("loginPage");
const app = document.getElementById("app");

auth.onAuthStateChanged(user => {
    if(user) {
        loginPage.style.display = "none";
        app.style.display = "flex";
        
        // Load user profile
        db.collection("users").doc(user.uid).get().then(doc => {
            let nama = "CS Agent";
            let foto = "https://i.pravatar.cc/40";
            
            if(doc.exists) {
                let d = doc.data();
                if(d.nama && d.nama.trim() !== "") nama = d.nama;
                else if(d.role) nama = d.role.toUpperCase();
                if(d.foto) foto = d.foto;
            }
            
            document.getElementById("topCenterName").innerText = nama;
            document.getElementById("topProfileImg").src = foto;
            document.getElementById("previewFoto").src = foto;
        });
        
        loadData(); // dari main.js
    } else {
        loginPage.style.display = "flex";
        app.style.display = "none";
    }
});
