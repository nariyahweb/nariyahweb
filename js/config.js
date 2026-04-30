// Konfigurasi Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCfj2Xdj6et3fThyA2gg-GWG8yZOhoqREA",
    authDomain: "floupyud.firebaseapp.com",
    projectId: "floupyud"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);

// Export variabel global
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

let currentCustomer = null;
let currentRole = null;
let importType = "prospek";
let chartCustomer = null;
let chartProspek = null;
