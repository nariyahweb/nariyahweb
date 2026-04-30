// ========== PROFILE dengan UPLOAD FOTO ==========
const profileImg = document.getElementById('profileImg');
if (profileImg) {
    profileImg.addEventListener('click', () => {
        const profileModal = document.getElementById('profileModal');
        if (profileModal) profileModal.style.display = 'flex';
        
        // Load data terbaru
        db.collection('users').doc(currentUser.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                if (data.nama) document.getElementById('profileName').value = data.nama;
                if (data.hp) document.getElementById('profilePhone').value = data.hp;
                if (data.foto) {
                    document.getElementById('previewFoto').src = data.foto;
                    document.getElementById('topProfileImg').src = data.foto;
                }
            }
        });
    });
}

const previewFotoEl = document.getElementById('previewFoto');
if (previewFotoEl) {
    previewFotoEl.addEventListener('click', () => {
        const profileFotoInput = document.getElementById('profileFoto');
        if (profileFotoInput) profileFotoInput.click();
    });
}

const profileFotoInput = document.getElementById('profileFoto');
if (profileFotoInput) {
    profileFotoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            if (file.size > 1024 * 1024) {
                showNotif('Ukuran foto maksimal 1MB', true);
                return;
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('previewFoto');
                const topImg = document.getElementById('topProfileImg');
                if (preview) preview.src = e.target.result;
                if (topImg) topImg.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            showNotif('Pilih file gambar yang valid', true);
        }
    });
}

const saveProfileBtn = document.getElementById('saveProfileBtn');
if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', async () => {
        const nama = document.getElementById('profileName').value;
        const hp = document.getElementById('profilePhone').value;
        const foto = document.getElementById('previewFoto').src;
        
        if (!nama) {
            showNotif('Nama wajib diisi', true);
            return;
        }
        
        try {
            await db.collection('users').doc(currentUser.uid).set({
                nama: nama,
                hp: hp,
                foto: foto,
                email: currentUser.email
            }, { merge: true });
            
            const topUserName = document.getElementById('topUserName');
            const topProfileImg = document.getElementById('topProfileImg');
            if (topUserName) topUserName.innerText = nama;
            if (topProfileImg) topProfileImg.src = foto;
            closeModal('profileModal');
            showNotif('Profile tersimpan');
        } catch (e) {
            showNotif('Gagal: ' + e.message, true);
        }
    });
}
