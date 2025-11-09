// Inisialisasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD6h40vY7anmvLPHwnL-zQFGYmHvXXFvhA",
  authDomain: "tabungasiswa.firebaseapp.com",
  projectId: "tabungasiswa",
  storageBucket: "tabungasiswa.firebasestorage.app",
  messagingSenderId: "419761759477",
  appId: "1:419761759477:web:3d38545ab3b7b06e8f11bc",
  measurementId: "G-E0FD1K3QB3"
};

// Pastikan Firebase tidak diinisialisasi dua kali
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app(); // gunakan app yang sudah ada
}

// Shortcut biar mudah diakses di file lain
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// 🔐 Fungsi login
async function loginUser(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error) {
    alert("Login gagal: " + error.message);
    throw error;
  }
}

// 🔐 Fungsi ubah password (untuk admin)
async function updatePassword(newPassword) {
  const user = auth.currentUser;
  if (user) {
    await user.updatePassword(newPassword);
    alert("Password berhasil diubah.");
  } else {
    alert("Silakan login terlebih dahulu.");
  }
}

// 🔐 Fungsi lupa password
async function forgotPassword(email) {
  try {
    await auth.sendPasswordResetEmail(email);
    alert("Email reset password telah dikirim ke: " + email);
  } catch (error) {
    alert("Gagal mengirim email reset: " + error.message);
  }
}

// 🔥 Contoh fungsi tambah data siswa
async function tambahSiswa(nama, kelas, saldoAwal) {
  try {
    await db.collection("siswa").add({
      nama: nama,
      kelas: kelas,
      saldo: saldoAwal,
      tanggal: new Date()
    });
    alert("Siswa berhasil ditambahkan!");
  } catch (error) {
    alert("Gagal menambah siswa: " + error.message);
  }
}

// Export agar bisa dipakai di file HTML lain
export { auth, db, storage, loginUser, updatePassword, forgotPassword, tambahSiswa };
