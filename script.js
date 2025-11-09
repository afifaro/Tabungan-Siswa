// Single-file app logic. Data stored in localStorage under keys:
// "ts_data" (object containing users, guru, siswa, kelas, adminPhone, runningQuote, logo, theme)

const DEFAULT_QUOTE = "Anak hebat selalu menyisihkan uang jajannya untuk ditabung";
const DEFAULT_SCHOOL = "SDN NAGREG";
const DEFAULT_LOGO = "assets/logo.png"; // keep a placeholder file in assets/
const STORAGE_KEY = "ts_data_v1";

// ---------- init data helpers ----------
function loadData(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw) return JSON.parse(raw);
  // default dataset
  const data = {
    schoolName: DEFAULT_SCHOOL,
    runningQuote: DEFAULT_QUOTE,
    logoData: DEFAULT_LOGO,
    theme: "light",
    admin: { username: "admin", password: "admin123", phone: "" }, // admin phone for WA
    gurus: {
      // example guru: kode_guru: {name, password, phone, allowedClasses: []}
      "guru001": { name: "Ibu Ani", password: "guru123", phone: "" }
    },
    kelas: {
      // kelasId: {name}
      "1A": { name: "Kelas 1A" }
    },
    siswa: {
      // nis: {name, kelas: "1A", guardianPhone: "", password: "siswa123"}
      "1001": { name: "Budi", kelas: "1A", guardianPhone: "", password: "siswa123" }
    },
    transaksi: {} // optional later
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}
function saveData(d){ localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

// ---------- UI elements ----------
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
const logoutBtn = document.getElementById("logoutBtn");

// tab switching
document.querySelectorAll(".tab").forEach(btn=>{
  btn.addEventListener("click", ()=> {
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tabcontent").forEach(tc=>tc.classList.add("hidden"));
    document.getElementById(btn.dataset.tab + "Tab").classList.remove("hidden");
  })
});

// ---------- app state ----------
let DATA = loadData();
let ROLE = null; // {role: 'admin'|'guru'|'siswa', id: '...'}
let tapCount = 0;
let tapTimer = null;

// ---------- initial render ----------
function renderApp(){
  document.title = `Tabungan Siswa — ${DATA.schoolName}`;
  schoolNameEl.textContent = DATA.schoolName;
  dashSchoolName.textContent = DATA.schoolName;
  runningQuoteEl.textContent = DATA.runningQuote || DEFAULT_QUOTE;
  schoolLogoEl.src = DATA.logoData || DEFAULT_LOGO;
  dashLogo.src = DATA.logoData || DEFAULT_LOGO;
  applyTheme(DATA.theme || "light");
}
renderApp();

// ---------- theme ----------
function applyTheme(t){
  document.documentElement.setAttribute("data-theme", t === "dark" ? "dark" : "light");
  metaThemeColor.setAttribute("content", t === "dark" ? "#0b1220" : "#007bff");
  DATA.theme = t;
  saveData(DATA);
}
themeToggle.addEventListener("click", ()=>{
  const next = DATA.theme === "dark" ? "light" : "dark";
  applyTheme(next);
});

// ---------- secret tap (5x) ----------
schoolNameEl.addEventListener("click", ()=>{
  tapCount++;
  if(tapTimer) clearTimeout(tapTimer);
  tapTimer = setTimeout(()=>{ tapCount=0; }, 1200);
  if(tapCount >= 5){
    tapCount = 0;
    openModal();
  }
});
function openModal(){ modalOverlay.classList.remove("hidden"); adminPassInput.value=""; guruPassInput.value=""; }
closeModalBtn.addEventListener("click", ()=> modalOverlay.classList.add("hidden"));

// ---------- student entry (no login) ----------
studentEnterBtn.addEventListener("click", ()=>{
  ROLE = { role: "siswa", id: null };
  showStudentPicker();
});

// ---------- login handlers ----------
adminLoginBtn.addEventListener("click", ()=>{
  const user = adminUserInput.value.trim();
  const pass = adminPassInput.value;
  if(user === DATA.admin.username && pass === DATA.admin.password){
    ROLE = { role: "admin", id: DATA.admin.username };
    modalOverlay.classList.add("hidden");
    openDashboard();
  } else {
    alert("Username atau password admin salah.");
  }
});
guruLoginBtn.addEventListener("click", ()=>{
  const kode = guruUserInput.value.trim();
  const pass = guruPassInput.value;
  if(DATA.gurus[kode] && DATA.gurus[kode].password === pass){
    ROLE = { role: "guru", id: kode };
    modalOverlay.classList.add("hidden");
    openDashboard();
  } else {
    alert("Akun guru tidak ditemukan atau password salah.");
  }
});

// ---------- forgot password: open WA chat (uses phone numbers in data) ----------
adminForgotBtn.addEventListener("click", ()=>{
  const phone = DATA.admin.phone || "";
  if(!phone) return alert("Nomor WhatsApp admin belum diset. Hubungi pihak sekolah langsung.");
  const text = encodeURIComponent(`Halo Admin ${DATA.schoolName}, saya lupa password admin. Mohon bantu reset.`);
  window.open(`https://wa.me/${phone.replace(/[^0-9]/g,'')}?text=${text}`, "_blank");
});
guruForgotBtn.addEventListener("click", ()=>{
  const kode = guruUserInput.value.trim();
  if(!kode || !DATA.gurus[kode] || !DATA.gurus[kode].phone) {
    return alert("Masukkan kode guru atau nomor WA guru belum diset.");
  }
  const phone = DATA.gurus[kode].phone;
  const text = encodeURIComponent(`Halo ${DATA.gurus[kode].name}, saya lupa password akun guru saya. Mohon bantu.`);
  window.open(`https://wa.me/${phone.replace(/[^0-9]/g,'')}?text=${text}`, "_blank");
});

// ---------- Dashboard ----------
function openDashboard(){
  // hide main app, show dashboard
  document.getElementById("app").classList.add("hidden");
  dashboard.classList.remove("hidden");
  buildMenuByRole();
  renderDashHome();
}
logoutBtn.addEventListener("click", ()=>{
  ROLE = null;
  dashboard.classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
});

// Build menu according to role
function buildMenuByRole(){
  dashMenu.innerHTML = "";
  const role = ROLE.role;
  const items = [];
  if(role === "admin"){
    items.push({id:"home",label:"Beranda"});
    items.push({id:"manage_guru",label:"Manajemen Guru"});
    items.push({id:"manage_kelas",label:"Manajemen Kelas"});
    items.push({id:"manage_siswa",label:"Manajemen Siswa"});
    items.push({id:"settings",label:"Pengaturan & Ubah Password"});
  } else if(role === "guru"){
    items.push({id:"home",label:"Beranda"});
    items.push({id:"my_students",label:"Siswa Saya"});
    items.push({id:"class_reports",label:"Rekap Kelas"});
    items.push({id:"settings",label:"Pengaturan (Lupa Password WA)"});
  } else { // siswa
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
}

function handleMenuClick(id){
  if(id==="home") renderDashHome();
  else if(id==="manage_guru") renderManageGuru();
  else if(id==="manage_kelas") renderManageKelas();
  else if(id==="manage_siswa") renderManageSiswa();
  else if(id==="settings") renderSettings();
  else if(id==="my_students") renderMyStudents();
  else if(id==="class_reports") renderClassReports();
  else if(id==="student_view") renderStudentView();
  else if(id==="student_profile") renderStudentProfile();
}

// ---------- dash contents ----------
function renderDashHome(){
  dashTitle.textContent = ROLE.role === "admin" ? "Dashboard Admin" : ROLE.role === "guru" ? "Dashboard Guru" : "Dashboard Siswa";
  dashContent.innerHTML = `
    <div class="card">
      <h3>Selamat datang, ${ROLE.role === "admin" ? "Admin Sekolah" : ROLE.role === "guru" ? DATA.gurus[ROLE.id].name : "Siswa"}</h3>
      <p>Nama Sekolah: <strong>${DATA.schoolName}</strong></p>
      <p>Quote: <em>${DATA.runningQuote}</em></p>
      <div style="margin-top:0.8rem"><button id="editVisuals">Edit Logo & Quote</button></div>
    </div>
  `;
  document.getElementById("editVisuals").addEventListener("click", ()=>{
    renderEditVisuals();
  });
}

function renderEditVisuals(){
  dashTitle.textContent = "Edit Logo & Quote";
  dashContent.innerHTML = `
    <div class="card">
      <label>Upload Logo: <input id="logoUpload" type="file" accept="image/*"></label>
      <div style="margin-top:0.6rem"><img id="previewLogo" src="${DATA.logoData}" style="max-width:200px;border-radius:8px;border:1px solid #ccc"/></div>
      <label style="margin-top:0.8rem">Quote Motivasi: <input id="newQuote" type="text" value="${DATA.runningQuote}" /></label>
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
  document.getElementById("saveVisualsBtn").addEventListener("click", ()=>{
    const q = document.getElementById("newQuote").value.trim();
    const imgEl = document.getElementById("previewLogo");
    DATA.runningQuote = q || DEFAULT_QUOTE;
    DATA.logoData = imgEl.src || DEFAULT_LOGO;
    saveData(DATA);
    renderApp();
    alert("Logo & quote disimpan.");
    renderDashHome();
  });
}

function renderManageGuru(){
  dashTitle.textContent = "Manajemen Guru";
  dashContent.innerHTML = `<div class="card"><button id="addGuruBtn">Tambah Guru</button><div id="guruList" style="margin-top:1rem"></div></div>`;
  document.getElementById("addGuruBtn").addEventListener("click", ()=>{
    const kode = prompt("Masukkan kode unik guru (contoh: guru002):");
    if(!kode) return;
    if(DATA.gurus[kode]) return alert("Kode guru sudah ada.");
    const name = prompt("Nama guru:");
    const phone = prompt("Nomor WA guru (opsional, gunakan format +62... atau 628...):");
    const pass = prompt("Password awal guru (misal: guru123):", "guru123");
    DATA.gurus[kode] = { name: name || kode, password: pass || "guru123", phone: phone || ""};
    saveData(DATA);
    renderManageGuru();
  });
  const listEl = document.getElementById("guruList");
  listEl.innerHTML = "";
  Object.entries(DATA.gurus).forEach(([kode,g])=>{
    const div = document.createElement("div");
    div.style.padding="0.4rem 0";
    div.innerHTML = `<strong>${g.name}</strong> (${kode}) - WA: ${g.phone || "-"} 
      <button data-k="${kode}" class="editg">Edit</button> <button data-k="${kode}" class="delg">Hapus</button>`;
    listEl.appendChild(div);
  });
  listEl.querySelectorAll(".editg").forEach(b=>{
    b.addEventListener("click", (e)=>{
      const k = b.dataset.k;
      const g = DATA.gurus[k];
      const name = prompt("Nama:", g.name);
      const phone = prompt("Nomor WA:", g.phone);
      const pass = prompt("Password (kosong = tidak diubah):", "");
      if(name) g.name = name;
      g.phone = phone || g.phone;
      if(pass) g.password = pass;
      DATA.gurus[k] = g;
      saveData(DATA);
      renderManageGuru();
    });
  });
  listEl.querySelectorAll(".delg").forEach(b=>{
    b.addEventListener("click", ()=>{
      const k = b.dataset.k;
      if(confirm("Hapus guru "+k+"?")){ delete DATA.gurus[k]; saveData(DATA); renderManageGuru(); }
    });
  });
}

function renderManageKelas(){
  dashTitle.textContent = "Manajemen Kelas";
  dashContent.innerHTML = `<div class="card"><button id="addKelas">Tambah Kelas</button><div id="listK" style="margin-top:1rem"></div></div>`;
  document.getElementById("addKelas").addEventListener("click", ()=>{
    const id = prompt("ID kelas (contoh: 2B):");
    if(!id) return;
    if(DATA.kelas[id]) return alert("Kelas sudah ada.");
    const name = prompt("Nama kelas:", id);
    DATA.kelas[id] = { name: name || id };
    saveData(DATA);
    renderManageKelas();
  });
  const listEl = document.getElementById("listK");
  listEl.innerHTML = "";
  Object.entries(DATA.kelas).forEach(([id,k])=>{
    const div = document.createElement("div");
    div.innerHTML = `<strong>${k.name}</strong> (${id}) <button data-id="${id}" class="editk">Edit</button> <button data-id="${id}" class="delk">Hapus</button>`;
    listEl.appendChild(div);
  });
  listEl.querySelectorAll(".editk").forEach(b=>{
    b.addEventListener("click", ()=> {
      const id = b.dataset.id;
      const name = prompt("Nama kelas:", DATA.kelas[id].name);
      if(name) DATA.kelas[id].name = name;
      saveData(DATA);
      renderManageKelas();
    });
  });
  listEl.querySelectorAll(".delk").forEach(b=>{
    b.addEventListener("click", ()=> {
      const id = b.dataset.id;
      if(confirm("Hapus kelas "+id+"?")){ delete DATA.kelas[id]; saveData(DATA); renderManageKelas(); }
    });
  });
}

function renderManageSiswa(){
  dashTitle.textContent = "Manajemen Siswa";
  dashContent.innerHTML = `<div class="card">
    <button id="addSiswa">Tambah Siswa</button>
    <div id="sList" style="margin-top:1rem"></div>
  </div>`;
  document.getElementById("addSiswa").addEventListener("click", ()=>{
    const nis = prompt("NIS (unik):");
    if(!nis) return;
    if(DATA.siswa[nis]) return alert("NIS sudah ada.");
    const name = prompt("Nama siswa:");
    const kelas = prompt("Kelas (contoh: 1A):");
    const phone = prompt("Nomor WA wali (opsional):");
    const pass = prompt("Password awal siswa:", "siswa123");
    DATA.siswa[nis] = { name: name||nis, kelas: kelas||"", guardianPhone: phone||"", password: pass||"siswa123" };
    saveData(DATA);
    renderManageSiswa();
  });
  const listEl = document.getElementById("sList");
  listEl.innerHTML = "";
  Object.entries(DATA.siswa).forEach(([nis,s])=>{
    const div = document.createElement("div");
    div.innerHTML = `<strong>${s.name}</strong> (NIS:${nis}) - Kelas: ${s.kelas || "-"} - WA wali: ${s.guardianPhone || "-"}
      <button data-n="${nis}" class="edits">Edit</button> <button data-n="${nis}" class="dels">Hapus</button>`;
    listEl.appendChild(div);
  });
  listEl.querySelectorAll(".edits").forEach(b=>{
    b.addEventListener("click", ()=> {
      const n = b.dataset.n;
      const s = DATA.siswa[n];
      const name = prompt("Nama:", s.name);
      const kelas = prompt("Kelas:", s.kelas);
      const phone = prompt("Nomor WA wali:", s.guardianPhone);
      const pass = prompt("Password (kosong = tidak diubah):","");
      if(name) s.name = name;
      s.kelas = kelas || s.kelas;
      s.guardianPhone = phone || s.guardianPhone;
      if(pass) s.password = pass;
      DATA.siswa[n] = s;
      saveData(DATA);
      renderManageSiswa();
    });
  });
  listEl.querySelectorAll(".dels").forEach(b=>{
    b.addEventListener("click", ()=> {
      const n = b.dataset.n;
      if(confirm("Hapus siswa NIS "+n+"?")){ delete DATA.siswa[n]; saveData(DATA); renderManageSiswa(); }
    });
  });
}

function renderSettings(){
  dashTitle.textContent = "Pengaturan & Ubah Password";
  dashContent.innerHTML = `<div class="card">
    <h4>Pengaturan Kontak WA</h4>
    <label>Nomor WA Admin: <input id="adminPhone" value="${DATA.admin.phone||''}" /></label>
    <h4>Ubah Password</h4>
    <label>Ubah password admin: <input id="newAdminPass" type="password" placeholder="kosong = tidak diubah" /></label>
    <label>Ubah password guru (kode guru): <input id="chgGuruCode" placeholder="kode_guru" /></label>
    <label>Password guru baru: <input id="chgGuruPass" placeholder="kosong = tidak diubah" /></label>
    <div style="margin-top:0.6rem"><button id="saveSettingsBtn">Simpan Pengaturan</button></div>
  </div>`;
  document.getElementById("saveSettingsBtn").addEventListener("click", ()=>{
    const adminPhone = document.getElementById("adminPhone").value.trim();
    const newAdminPass = document.getElementById("newAdminPass").value;
    const code = document.getElementById("chgGuruCode").value.trim();
    const newGuruPass = document.getElementById("chgGuruPass").value;
    DATA.admin.phone = adminPhone || DATA.admin.phone;
    if(newAdminPass) DATA.admin.password = newAdminPass;
    if(code && DATA.gurus[code] && newGuruPass) DATA.gurus[code].password = newGuruPass;
    saveData(DATA);
    alert("Pengaturan tersimpan.");
    renderSettings();
  });
}

function renderMyStudents(){
  dashTitle.textContent = "Siswa Saya";
  // For simplicity, show all students (later filter by kelas if needed)
  let html = `<div class="card"><h4>Daftar Siswa</h4><table><thead><tr><th>NIS</th><th>Nama</th><th>Kelas</th><th>Aksi</th></tr></thead><tbody>`;
  Object.entries(DATA.siswa).forEach(([nis,s])=>{
    html += `<tr><td>${nis}</td><td>${s.name}</td><td>${s.kelas}</td><td><button data-n="${nis}" class="viewS">Lihat</button></td></tr>`;
  });
  html += `</tbody></table></div>`;
  dashContent.innerHTML = html;
  dashContent.querySelectorAll(".viewS").forEach(b=>{
    b.addEventListener("click", ()=> {
      const n = b.dataset.n;
      const s = DATA.siswa[n];
      alert(`NIS:${n}\nNama:${s.name}\nKelas:${s.kelas}\nWA wali:${s.guardianPhone || "-"}`);
    });
  });
}

function renderClassReports(){
  dashTitle.textContent = "Rekap Kelas (sementara)";
  dashContent.innerHTML = `<div class="card"><p>Fitur rekap transaksi akan disediakan di versi selanjutnya. Saat ini data siswa & guru siap disimpan dan dikelola.</p></div>`;
}

function renderStudentView(){
  dashTitle.textContent = "Lihat Saldo & Riwayat";
  dashContent.innerHTML = `<div class="card"><p>Untuk demo ini, siswa tidak memiliki autentikasi. Nanti akan ditambahi login siswa berdasarkan NIS dan password.</p></div>`;
}

function renderStudentProfile(){
  dashTitle.textContent = "Profil & Kontak Guru";
  // let user pick nis
  let html = `<div class="card"><h4>Informasi Guru</h4><table><thead><tr><th>Kode</th><th>Nama</th><th>WA</th></tr></thead><tbody>`;
  Object.entries(DATA.gurus).forEach(([k,g])=>{
    html += `<tr><td>${k}</td><td>${g.name}</td><td>${g.phone || "-"}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  dashContent.innerHTML = html;
}

// ---------- student picker (simple search by NIS) ----------
function showStudentPicker(){
  // prompt for NIS to view profile (no auth)
  const nis = prompt("Masukkan NIS (contoh: 1001) untuk melihat info siswa (demo):");
  if(!nis) return;
  if(!DATA.siswa[nis]) return alert("NIS tidak ditemukan.");
  const s = DATA.siswa[nis];
  // show info with link to WA wali or to guru
  const guru = Object.values(DATA.gurus)[0] || null;
  const contact = s.guardianPhone || (guru && guru.phone) || "";
  if(contact){
    const text = encodeURIComponent(`Halo, saya (${s.name})/wali ${s.name} ingin konfirmasi lupa password akun siswa (NIS:${nis}).`);
    if(confirm(`${s.name}\nKelas: ${s.kelas}\nWA kontak: ${contact}\n\nBuka chat WhatsApp?`)){
      window.open(`https://wa.me/${contact.replace(/[^0-9]/g,'')}?text=${text}`, "_blank");
    }
  } else {
    alert(`${s.name}\nKelas: ${s.kelas}\nKontak WA wali/guru belum diset. Hubungi sekolah.`);
  }
}

// ---------- initial save if missing ----------
saveData(DATA);

// ---------- register service worker (optional PWA) ----------
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(e=>console.warn("sw failed", e));
  });
}
