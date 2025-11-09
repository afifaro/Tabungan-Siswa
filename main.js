// === Firebase Authentication & Firestore ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

import { firebaseConfig } from "./firebase.js";

// --- Inisialisasi Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Elemen DOM ---
const adminSection = document.getElementById("adminSection");
const siswaSection = document.getElementById("siswaSection");
const loginModal = document.getElementById("loginModal");
const namaSekolah = document.getElementById("namaSekolah");

// --- Variabel login tersembunyi ---
let tapCount = 0;
namaSekolah.addEventListener("click", () => {
  tapCount++;
  if (tapCount >= 5) {
    tapCount = 0;
    loginModal.style.display = "flex";
  }
  setTimeout(() => (tapCount = 0), 2000);
});

// --- Tombol Login Admin ---
document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login berhasil!");
    loginModal.style.display = "none";
    adminSection.style.display = "block";
    siswaSection.style.display = "none";
  } catch (error) {
    alert("Login gagal: " + error.message);
  }
});

// --- Tombol Logout ---
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  adminSection.style.display = "none";
  siswaSection.style.display = "block";
});

// === CRUD Data Siswa ===
async function loadSiswa() {
  const siswaList = document.getElementById("siswaList");
  siswaList.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "siswa"));
  querySnapshot.forEach((docItem) => {
    const data = docItem.data();
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data.nama}</td>
      <td>${data.kelas}</td>
      <td>${data.saldo}</td>
      <td>
        <button class="edit" data-id="${docItem.id}">Edit</button>
        <button class="hapus" data-id="${docItem.id}">Hapus</button>
      </td>
    `;
    siswaList.appendChild(row);
  });
}

// --- Tambah Data Siswa ---
document.getElementById("tambahSiswaForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nama = document.getElementById("namaSiswa").value;
  const kelas = document.getElementById("kelasSiswa").value;
  const saldo = parseInt(document.getElementById("saldoAwal").value || 0);

  try {
    await addDoc(collection(db, "siswa"), { nama, kelas, saldo });
    alert("Data siswa berhasil ditambahkan!");
    e.target.reset();
    loadSiswa();
  } catch (error) {
    alert("Gagal menambah data: " + error.message);
  }
});

// --- Hapus & Edit Siswa ---
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("hapus")) {
    const id = e.target.dataset.id;
    await deleteDoc(doc(db, "siswa", id));
    alert("Data berhasil dihapus!");
    loadSiswa();
  }

  if (e.target.classList.contains("edit")) {
    const id = e.target.dataset.id;
    const newSaldo = prompt("Masukkan saldo baru:");
    if (newSaldo !== null) {
      await updateDoc(doc(db, "siswa", id), { saldo: parseInt(newSaldo) });
      alert("Saldo berhasil diperbarui!");
      loadSiswa();
    }
  }
});

// --- Muat Data Siswa Saat Halaman Dibuka ---
loadSiswa();
