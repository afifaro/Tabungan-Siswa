// main.js — using window.FB (compat)
const { auth, db, storage } = window.FB;

const ADMIN_WA = "6282319001945";
const DEFAULT_QUOTE = "Anak hebat selalu menyisihkan uang jajannya untuk ditabung";
const DEFAULT_SCHOOL = "SDN NAGREG";
const DEFAULT_LOGO = "assets/logo.png";

// UI elements
const schoolNameEl = document.getElementById("schoolName");
const schoolLogoEl = document.getElementById("schoolLogo");
const runningQuoteEl = document.getElementById("runningQuote");
const studentEnterBtn = document.getElementById("studentEnter");
const modalOverlay = document.getElementById("modalOverlay");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const guruLoginBtn = document.getElementById("guruLoginBtn");
const adminUserInput = document.getElementById("adminUser");
const adminPassInput = document.getElementById("adminPass");
const guruUserInput = document.getElementById("guruUser");
const guruPassInput = document.getElementById("guruPass");
const adminForgotBtn = document.getElementById("adminForgotBtn");
const guruForgotBtn = document.getElementById("guruForgotBtn");
const closeModalBtn = document.getElementById("closeModal");
const themeToggle = document.getElementById("themeToggle");
const metaThemeColor = document.getElementById("metaThemeColor");

const dashboard = document.getElementById("dashboard");
const dashMenu = document.getElementById("dashMenu");
const dashContent = document.getElementById("dashContent");
const dashTitle = document.getElementById("dashTitle");
const dashSchoolName = document.getElementById("dashSchoolName");
const dashLogo = document.getElementById("dashLogo");
const dashUserInfo = document.getElementById("dashUserInfo");
const logoutBtn = document.getElementById("logoutBtn");

let tapCount = 0;
let tapTimer = null;
let currentUser = null;
let currentProfile = null;

// load settings (settings/meta)
async function loadSettings(){
  try {
    const metaRef = db.collection('settings').doc('meta');
    const snap = await metaRef.get();
    if(snap.exists){
      const s = snap.data();
      document.title = `Tabungan Siswa — ${s.schoolName || DEFAULT_SCHOOL}`;
      schoolNameEl.textContent = s.schoolName || DEFAULT_SCHOOL;
      dashSchoolName.textContent = s.schoolName || DEFAULT_SCHOOL;
      runningQuoteEl.textContent = s.runningQuote || DEFAULT_QUOTE;
      document.getElementById('namaSekolahTitle').textContent = s.schoolName || DEFAULT_SCHOOL;
      document.getElementById('quoteMotivasi').textContent = s.runningQuote || DEFAULT_QUOTE;
      schoolLogoEl.src = s.logoURL || DEFAULT_LOGO;
      dashLogo.src = s.logoURL || DEFAULT_LOGO;
      document.getElementById('logoSekolah').src = s.logoURL || DEFAULT_LOGO;
      applyTheme(s.theme || 'light');
    } else {
      await metaRef.set({
        schoolName: DEFAULT_SCHOOL,
        runningQuote: DEFAULT_QUOTE,
        logoURL: DEFAULT_LOGO,
        theme: 'light',
        adminWhatsApp: ADMIN_WA
      });
      loadSettings();
    }
  } catch (e) {
    console.warn("loadSettings err", e);
    document.title = `Tabungan Siswa — ${DEFAULT_SCHOOL}`;
    schoolNameEl.textContent = DEFAULT_SCHOOL;
    runningQuoteEl.textContent = DEFAULT_QUOTE;
    schoolLogoEl.src = DEFAULT_LOGO;
  }
}
loadSettings();

// theme
function applyTheme(t){
  document.documentElement.setAttribute("data-theme", t === "dark" ? "dark" : "light");
  metaThemeColor.setAttribute("content", t === "dark" ? "#0b1220" : "#007bff");
}
themeToggle.addEventListener("click", async ()=>{
  const metaRef = db.collection('settings').doc('meta');
  const snap = await metaRef.get();
  const meta = snap.exists ? snap.data() : {};
  const next = (meta.theme === 'dark') ? 'light' : 'dark';
  await metaRef.set({...meta, theme: next});
  applyTheme(next);
});

// secret tap 5x
schoolNameEl.addEventListener("click", ()=>{
  tapCount++;
  if(tapTimer) clearTimeout(tapTimer);
  tapTimer = setTimeout(()=>{ tapCount = 0; }, 1200);
  if(tapCount >= 5){
    tapCount = 0;
    openModal();
  }
});
function openModal(){ modalOverlay.classList.remove("hidden"); adminPassInput.value=""; guruPassInput.value=""; }
closeModalBtn.addEventListener("click", ()=> modalOverlay.classList.add("hidden"));

// student quick view (no auth)
studentEnterBtn.addEventListener("click", async ()=>{
  const nis = prompt("Masukkan NIS (contoh: 1001) untuk melihat info siswa:");
  if(!nis) return;
  const sdoc = await db.collection('siswa').doc(nis).get();
  if(!sdoc.exists) return alert("Siswa tidak ditemukan.");
  const s = sdoc.data();
  const contact = s.guardianPhone || (await getAnyGuruPhone()) || "";
  if(contact){
    const text = encodeURIComponent(`Halo, saya/wali ${s.name} ingin konfirmasi akun Tabungan Siswa (NIS:${nis}).`);
    if(confirm(`${s.name}\nKelas: ${s.kelas}\nKontak WA: ${contact}\n\nBuka chat WhatsApp?`)){
      window.open(`https://wa.me/${contact.replace(/[^0-9]/g,'')}?text=${text}`, "_blank");
    }
  } else {
    alert("Kontak belum diset. Hubungi admin sekolah.");
  }
});
async function getAnyGuruPhone(){
  const q = await db.collection('gurus').limit(1).get();
  if(q.empty) return null;
  return q.docs[0].data().phone || null;
}

// auth handlers
adminLoginBtn.addEventListener("click", async ()=>{
  const email = adminUserInput.value.trim();
  const pass = adminPassInput.value;
  try {
    const cred = await auth.signInWithEmailAndPassword(email, pass);
    currentUser = cred.user;
    await loadProfileAndOpen();
    modalOverlay.classList.add("hidden");
  } catch (e) {
    alert("Login admin gagal: " + (e.message || e));
  }
});
guruLoginBtn.addEventListener("click", async ()=>{
  const email = guruUserInput.value.trim();
  const pass = guruPassInput.value;
  try {
    const cred = await auth.signInWithEmailAndPassword(email, pass);
    currentUser = cred.user;
    await loadProfileAndOpen();
    modalOverlay.classList.add("hidden");
  } catch (e) {
    alert("Login guru gagal: " + (e.message || e));
  }
});

// forgot password -> WA (admin/guru)
adminForgotBtn.addEventListener("click", async ()=>{
  const meta = await db.collection('settings').doc('meta').get();
  const phone = meta.exists ? (meta.data().adminWhatsApp || ADMIN_WA) : ADMIN_WA;
  const text = encodeURIComponent(`Halo Admin ${DEFAULT_SCHOOL}, saya lupa password akun Tabungan Siswa.`);
  window.open(`https://wa.me/${phone.replace(/[^0-9]/g,'')}?text=${text}`, "_blank");
});
guruForgotBtn.addEventListener("click", async ()=>{
  const email = guruUserInput.value.trim();
  if(!email) return alert("Masukkan email guru terlebih dahulu.");
  const q = await db.collection('gurus').where('email','==',email).limit(1).get();
  if(q.empty) return alert("Guru dengan email tersebut tidak ditemukan atau WA guru belum diset.");
  const phone = q.docs[0].data().phone || "";
  const text = encodeURIComponent(`Halo, saya lupa password akun guru (${email}). Mohon bantu.`);
  window.open(`https://wa.me/${phone.replace(/[^0-9]/g,'')}?text=${text}`, "_blank");
});

// load profile and open dashboard
async function loadProfileAndOpen(){
  if(!currentUser) return;
  const uid = currentUser.uid;
  const up = await db.collection('users').doc(uid).get();
  if(!up.exists){
    await db.collection('users').doc(uid).set({ role: 'guru', name: currentUser.displayName || currentUser.email, email: currentUser.email });
    currentProfile = { role: 'guru', name: currentUser.displayName || currentUser.email };
  } else {
    currentProfile = up.data();
  }
  openDashboard();
}

// auth state
auth.onAuthStateChanged(async (u)=>{
  currentUser = u;
  if(u){
    const up = await db.collection('users').doc(u.uid).get();
    if(up.exists) currentProfile = up.data();
    else currentProfile = null;
  } else currentProfile = null;
});

// logout
logoutBtn.addEventListener("click", async ()=> {
  await auth.signOut();
  currentUser = null;
  currentProfile = null;
  dashboard.classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
});

// Dashboard & Menu
function buildMenuByRole(){
  dashMenu.innerHTML = "";
  const role = (currentProfile && currentProfile.role) || 'guest';
  const items = [];
  if(role === "admin"){
    items.push({id:"home",label:"Beranda"});
    items.push({id:"manage_guru",label:"Manajemen Guru"});
    items.push({id:"manage_kelas",label:"Manajemen Kelas"});
    items.push({id:"manage_siswa",label:"Manajemen Siswa"});
    items.push({id:"transaksi",label:"Transaksi & Rekap"});
    items.push({id:"settings",label:"Pengaturan & Ubah Password"});
  } else if(role === "guru"){
    items.push({id:"home",label:"Beranda"});
    items.push({id:"my_students",label:"Siswa Saya"});
    items.push({id:"transaksi",label:"Catat Transaksi"});
    items.push({id:"settings",label:"Pengaturan (Lupa Password WA)"});
  } else {
    items.push({id:"student_view",label:"Lihat Saldo & Riwayat"});
    items.push({id:"student_profile",label:"Profil & Kontak Guru"});
  }
  items.forEach(it=>{
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.textContent = it.label;
    btn.addEventListener("click", ()=> handleMenuClick(it.id));
    li.appendChild(btn);
    dashMenu.appendChild(li);
  });
  dashUserInfo.textContent = `${currentProfile ? `${currentProfile.name} (${currentProfile.role})` : currentUser ? currentUser.email : 'Tamu'}`;
}

function openDashboard(){
  document.getElementById("app").classList.add("hidden");
  dashboard.classList.remove("hidden");
  buildMenuByRole();
  renderDashHome();
}

function handleMenuClick(id){
  if(id==="home") renderDashHome();
  else if(id==="manage_guru") renderManageGuru();
  else if(id==="manage_kelas") renderManageKelas();
  else if(id==="manage_siswa") renderManageSiswa();
  else if(id==="transaksi") renderTransaksi();
  else if(id==="settings") renderSettings();
  else if(id==="my_students") renderMyStudents();
  else if(id==="student_view") renderStudentView();
  else if(id==="student_profile") renderStudentProfile();
}

// views
function renderDashHome(){
  dashTitle.textContent = "Dashboard";
  dashContent.innerHTML = `
    <div class="card">
      <h3>Selamat datang, ${currentProfile ? currentProfile.name : 'Pengguna'}</h3>
      <p>Nama Sekolah: <strong id="sName">${DEFAULT_SCHOOL}</strong></p>
      <p>Quote: <em id="sQuote">${DEFAULT_QUOTE}</em></p>
      <div style="margin-top:0.8rem"><button id="editVisuals">Edit Logo & Quote</button></div>
    </div>
  `;
  document.getElementById("editVisuals").addEventListener("click", ()=> renderEditVisuals());
}

async function renderEditVisuals(){
  dashTitle.textContent = "Edit Logo & Quote";
  const metaRef = db.collection('settings').doc('meta');
  const snap = await metaRef.get();
  const meta = snap.exists ? snap.data() : {};
  dashContent.innerHTML = `
    <div class="card">
      <label>Upload Logo: <input id="logoUpload" type="file" accept="image/*"></label>
      <div style="margin-top:0.6rem"><img id="previewLogo" src="${meta.logoURL || DEFAULT_LOGO}" style="max-width:200px;border-radius:8px;border:1px solid #ccc"/></div>
      <label style="margin-top:0.8rem">Quote Motivasi: <input id="newQuote" type="text" value="${meta.runningQuote || DEFAULT_QUOTE}" /></label>
      <div style="margin-top:0.6rem">
        <button id="saveVisualsBtn">Simpan</button>
      </div>
    </div>
  `;
  document.getElementById("logoUpload").addEventListener("change", e=>{
    const f = e.target.files[0];
    if(!f) return;
    const r = new FileReader();
    r.onload = function(ev){
      document.getElementById("previewLogo").src = ev.target.result;
    };
    r.readAsDataURL(f);
  });
  document.getElementById("saveVisualsBtn").addEventListener("click", async ()=>{
    const q = document.getElementById("newQuote").value.trim();
    const imgEl = document.getElementById("previewLogo");
    const metaData = snap.exists ? snap.data() : {};
    // if uploaded image is dataURL then upload to storage and save URL
    const src = imgEl.src || "";
    let finalURL = src;
    if(src.startsWith("data:")){
      // upload to storage
      const blob = dataURLtoBlob(src);
      const fname = "logo-" + Date.now() + ".png";
      const storageRef = storage.ref().child("logo-sekolah/" + fname);
      await storageRef.put(blob);
      finalURL = await storageRef.getDownloadURL();
    }
    await metaRef.set({
      schoolName: metaData.schoolName || DEFAULT_SCHOOL,
      runningQuote: q || DEFAULT_QUOTE,
      logoURL: finalURL,
      theme: metaData.theme || 'light',
      adminWhatsApp: metaData.adminWhatsApp || ADMIN_WA
    });
    alert("Logo & quote disimpan.");
    loadSettings();
    renderDashHome();
  });
}

function dataURLtoBlob(dataurl) {
  var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--){ u8arr[n] = bstr.charCodeAt(n); }
  return new Blob([u8arr], {type:mime});
}

// Manage Guru
async function renderManageGuru(){
  dashTitle.textContent = "Manajemen Guru";
  const q = await db.collection('gurus').get();
  let html = `<div class="card"><button id="addGuruBtn">Tambah Guru</button><div id="guruList" style="margin-top:1rem"></div></div>`;
  dashContent.innerHTML = html;
  document.getElementById("addGuruBtn").addEventListener("click", async ()=>{
    const kode = prompt("Masukkan kode unik guru (contoh: guru002):");
    if(!kode) return;
    const name = prompt("Nama guru:");
    const email = prompt("Email guru (digunakan untuk login):");
    const phone = prompt("Nomor WA guru (opsional):");
    const pass = prompt("Password awal guru (misal: guru123):", "guru123");
    try {
      const userCred = await auth.createUserWithEmailAndPassword(email, pass);
      const uid = userCred.user.uid;
      await db.collection('users').doc(uid).set({ role: 'guru', name, email, phone, username: kode });
      await db.collection('gurus').doc(kode).set({ name, email, phone, uid });
      alert("Guru ditambahkan dan akun dibuat.");
      renderManageGuru();
    } catch (e) {
      alert("Gagal membuat akun guru: " + e.message);
    }
  });
  const listEl = document.getElementById("guruList");
  listEl.innerHTML = "";
  q.forEach(doc=>{
    const g = doc.data();
    const kode = doc.id;
    const div = document.createElement("div");
    div.style.padding = "0.4rem 0";
    div.innerHTML = `<strong>${g.name}</strong> (${kode}) - WA: ${g.phone || "-"} - Email: ${g.email || "-"}
      <button data-k="${kode}" class="editg">Edit</button> <button data-k="${kode}" class="delg">Hapus</button>`;
    listEl.appendChild(div);
  });
  listEl.querySelectorAll(".editg").forEach(b=>{ b.addEventListener("click", async ()=>{
    const k = b.dataset.k;
    const doc = await db.collection('gurus').doc(k).get();
    if(!doc.exists) return alert("Guru tidak ditemukan.");
    const g = doc.data();
    const name = prompt("Nama:", g.name);
    const phone = prompt("Nomor WA:", g.phone);
    await db.collection('gurus').doc(k).update({ name, phone });
    if(g.uid) await db.collection('users').doc(g.uid).update({ name, phone });
    renderManageGuru();
  })});
  listEl.querySelectorAll(".delg").forEach(b=>{ b.addEventListener("click", async ()=>{
    const k = b.dataset.k;
    if(!confirm("Hapus guru "+k+"?")) return;
    await db.collection('gurus').doc(k).delete();
    renderManageGuru();
  })});
}

// Manage Kelas
async function renderManageKelas(){
  dashTitle.textContent = "Manajemen Kelas";
  const q = await db.collection('kelas').get();
  dashContent.innerHTML = `<div class="card"><button id="addKelas">Tambah Kelas</button><div id="listK" style="margin-top:1rem"></div></div>`;
  document.getElementById("addKelas").addEventListener("click", async ()=>{
    const id = prompt("ID kelas (contoh: 2B):");
    if(!id) return;
    const name = prompt("Nama kelas:", id);
    await db.collection('kelas').doc(id).set({ name: name || id });
    renderManageKelas();
  });
  const listEl = document.getElementById("listK");
  listEl.innerHTML = "";
  q.forEach(doc=>{
    const id = doc.id;
    const k = doc.data();
    const div = document.createElement("div");
    div.innerHTML = `<strong>${k.name}</strong> (${id}) <button data-id="${id}" class="editk">Edit</button> <button data-id="${id}" class="delk">Hapus</button>`;
    listEl.appendChild(div);
  });
  listEl.querySelectorAll(".editk").forEach(b=>{ b.addEventListener("click", async ()=> {
    const id = b.dataset.id;
    const name = prompt("Nama kelas:");
    if(name) await db.collection('kelas').doc(id).update({ name });
    renderManageKelas();
  })});
  listEl.querySelectorAll(".delk").forEach(b=>{ b.addEventListener("click", async ()=> {
    const id = b.dataset.id;
    if(confirm("Hapus kelas "+id+"?")){ await db.collection('kelas').doc(id).delete(); renderManageKelas(); }
  })});
}

// Manage Siswa
async function renderManageSiswa(){
  dashTitle.textContent = "Manajemen Siswa";
  dashContent.innerHTML = `<div class="card"><button id="addSiswa">Tambah Siswa</button><div id="sList" style="margin-top:1rem"></div></div>`;
  document.getElementById("addSiswa").addEventListener("click", async ()=>{
    const nis = prompt("NIS (unik):");
    if(!nis) return;
    const name = prompt("Nama siswa:");
    const kelas = prompt("Kelas (contoh: 1A):");
    const phone = prompt("Nomor WA wali (opsional):");
    const pass = prompt("Password awal siswa (opsional):", "siswa123");
    await db.collection('siswa').doc(nis).set({ name: name||nis, kelas: kelas||"", guardianPhone: phone||"", password: pass||"siswa123" });
    renderManageSiswa();
  });
  const sList = document.getElementById("sList");
  const q = await db.collection('siswa').get();
  sList.innerHTML = "";
  q.forEach(doc=>{
    const nis = doc.id;
    const s = doc.data();
    const div = document.createElement("div");
    div.innerHTML = `<strong>${s.name}</strong> (NIS:${nis}) - Kelas: ${s.kelas || "-"} - WA wali: ${s.guardianPhone || "-"}
      <button data-n="${nis}" class="edits">Edit</button> <button data-n="${nis}" class="dels">Hapus</button>`;
    sList.appendChild(div);
  });
  sList.querySelectorAll(".edits").forEach(b=>{ b.addEventListener("click", async ()=> {
    const n = b.dataset.n;
    const sdoc = await db.collection('siswa').doc(n).get();
    if(!sdoc.exists) return;
    const s = sdoc.data();
    const name = prompt("Nama:", s.name);
    const kelas = prompt("Kelas:", s.kelas);
    const phone = prompt("Nomor WA wali:", s.guardianPhone);
    const pass = prompt("Password (kosong = tidak diubah):","");
    const upd = {};
    if(name) upd.name = name;
    if(kelas) upd.kelas = kelas;
    if(phone) upd.guardianPhone = phone;
    if(pass) upd.password = pass;
    await db.collection('siswa').doc(n).update(upd);
    renderManageSiswa();
  })});
  sList.querySelectorAll(".dels").forEach(b=>{ b.addEventListener("click", async ()=> {
    const n = b.dataset.n;
    if(confirm("Hapus siswa NIS "+n+"?")){ await db.collection('siswa').doc(n).delete(); renderManageSiswa(); }
  })});
}

// Transaksi & rekap
async function renderTransaksi(){
  dashTitle.textContent = "Transaksi & Rekap";
  dashContent.innerHTML = `<div class="card">
    <h4>Catat Transaksi</h4>
    <label>NIS: <input id="t_nis" /></label>
    <label>Jenis: <select id="t_type"><option value="setor">Setor</option><option value="tarik">Tarik</option></select></label>
    <label>Jumlah: <input id="t_amount" type="number" /></label>
    <label>Catatan: <input id="t_note" /></label>
    <div style="margin-top:0.6rem"><button id="saveTrans">Simpan Transaksi</button></div>
    <hr/>
    <h4>Rekap Terakhir</h4>
    <div id="transList"></div>
  </div>`;
  document.getElementById("saveTrans").addEventListener("click", async ()=>{
    const nis = document.getElementById("t_nis").value.trim();
    const type = document.getElementById("t_type").value;
    const amount = parseFloat(document.getElementById("t_amount").value) || 0;
    const note = document.getElementById("t_note").value || "";
    if(!nis || amount <= 0) return alert("Isi NIS dan jumlah yang valid.");
    const t = { nis, amount, type, note, date: firebase.firestore.FieldValue.serverTimestamp(), createdBy: currentUser ? currentUser.uid : 'unknown' };
    await db.collection('transaksi').add(t);
    alert("Transaksi disimpan.");
    renderTransaksi();
  });
  const r = await db.collection('transaksi').orderBy('date','desc').limit(50).get();
  const list = document.getElementById("transList");
  let html = `<table style="width:100%"><thead><tr><th>Tgl</th><th>NIS</th><th>Jenis</th><th>Jumlah</th><th>Catatan</th></tr></thead><tbody>`;
  r.forEach(doc=>{
    const d = doc.data();
    const dt = d.date && d.date.toDate ? d.date.toDate().toLocaleString() : '-';
    html += `<tr><td>${dt}</td><td>${d.nis}</td><td>${d.type}</td><td>${d.amount}</td><td>${d.note||''}</td></tr>`;
  });
  html += `</tbody></table>`;
  list.innerHTML = html;
}

// Settings
async function renderSettings(){
  dashTitle.textContent = "Pengaturan & Ubah Password";
  const metaDoc = await db.collection('settings').doc('meta').get();
  const meta = metaDoc.exists ? metaDoc.data() : {};
  dashContent.innerHTML = `<div class="card">
    <h4>Kontak WA</h4>
    <label>Nomor WA Admin: <input id="adminPhone" value="${meta.adminWhatsApp||ADMIN_WA}" /></label>
    <h4>Ganti password admin</h4>
    <label>Password baru admin: <input id="newAdminPass" type="password" /></label>
    <h4>Ganti password guru</h4>
    <label>Kode Guru: <input id="chgGuruCode" /></label>
    <label>Password guru baru: <input id="chgGuruPass" /></label>
    <div style="margin-top:0.6rem"><button id="saveSettingsBtn">Simpan</button></div>
  </div>`;
  document.getElementById("saveSettingsBtn").addEventListener("click", async ()=>{
    const adminPhone = document.getElementById("adminPhone").value.trim();
    const newAdminPass = document.getElementById("newAdminPass").value;
    const code = document.getElementById("chgGuruCode").value.trim();
    const newGuruPass = document.getElementById("chgGuruPass").value;
    await db.collection('settings').doc('meta').set({ ...(meta || {}), adminWhatsApp: adminPhone });
    if(newAdminPass && currentProfile && currentProfile.role === 'admin'){
      await currentUser.updatePassword(newAdminPass);
      alert("Password admin diubah.");
    }
    if(code && newGuruPass){
      const gDoc = await db.collection('gurus').doc(code).get();
      if(!gDoc.exists){
        alert("Guru tidak ditemukan. Gunakan reset email.");
      } else {
        const g = gDoc.data();
        if(g.email){
          await auth.sendPasswordResetEmail(g.email);
          alert("Email reset password dikirim ke guru.");
        } else {
          alert("Email guru belum diset.");
        }
      }
    }
    loadSettings();
  });
}

// other views
async function renderMyStudents(){
  dashTitle.textContent = "Siswa Saya";
  const q = await db.collection('siswa').get();
  let html = `<div class="card"><h4>Daftar Siswa</h4><table><thead><tr><th>NIS</th><th>Nama</th><th>Kelas</th><th>WA</th><th>Saldo</th></tr></thead><tbody>`;
  const transSnap = await db.collection('transaksi').get();
  const saldoMap = {};
  transSnap.forEach(doc=>{
    const t = doc.data();
    saldoMap[t.nis] = saldoMap[t.nis] || 0;
    saldoMap[t.nis] += (t.type === 'setor') ? t.amount : -t.amount;
  });
  q.forEach(doc=>{
    const s = doc.data();
    const nis = doc.id;
    const saldo = saldoMap[nis] || 0;
    html += `<tr><td>${nis}</td><td>${s.name}</td><td>${s.kelas}</td><td>${s.guardianPhone||'-'}</td><td>${saldo}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  dashContent.innerHTML = html;
}

async function renderStudentView(){
  dashTitle.textContent = "Lihat Saldo & Riwayat";
  dashContent.innerHTML = `<div class="card"><p>Untuk melihat saldo otomatis, guru/admin bisa mencatat transaksi. Login siswa (NIS) akan ditambahkan jika diminta.</p></div>`;
}

async function renderStudentProfile(){
  dashTitle.textContent = "Profil & Kontak Guru";
  const q = await db.collection('gurus').get();
  let html = `<div class="card"><h4>Informasi Guru</h4><table><thead><tr><th>Kode</th><th>Nama</th><th>WA</th></tr></thead><tbody>`;
  q.forEach(doc=>{
    const g = doc.data();
    html += `<tr><td>${doc.id}</td><td>${g.name}</td><td>${g.phone||'-'}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  dashContent.innerHTML = html;
}

// initial
