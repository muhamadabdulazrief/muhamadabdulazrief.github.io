// ============================================================
//  Dashboard Pribadi — app.js
//  Semua teks & komentar dalam Bahasa Indonesia
//  Semua 5 tantangan aktif:
//    1. Mode Gelap / Terang
//    2. Nama kustom pada sapaan
//    3. Ubah waktu Pomodoro
//    4. Cegah tugas duplikat
//    5. Urutkan tugas
// ============================================================

/* ===== UTILITAS: Local Storage ===== */
const simpan = {
  ambil: (kunci, cadangan = null) => {
    try {
      const val = localStorage.getItem(kunci);
      return val !== null ? JSON.parse(val) : cadangan;
    } catch {
      return cadangan;
    }
  },
  set: (kunci, nilai) => {
    localStorage.setItem(kunci, JSON.stringify(nilai));
  },
};

/* ===== DOM REFERENCES ===== */
const elWaktu         = document.getElementById('time');
const elTanggal       = document.getElementById('date');
const elSapaan        = document.getElementById('greeting');
const toggleGelap     = document.getElementById('darkToggle');
const elTimer         = document.getElementById('timerDisplay');
const elProgressBar   = document.getElementById('timerProgressBar');
const btnMulai        = document.getElementById('startBtn');
const btnBerhenti     = document.getElementById('stopBtn');
const btnReset        = document.getElementById('resetBtn');
const inputDurasi     = document.getElementById('pomoDuration');
const btnTerapkan     = document.getElementById('applyPomoBtn');
const inputTugas      = document.getElementById('taskInput');
const btnTambahTugas  = document.getElementById('addTaskBtn');
const elDaftarTugas   = document.getElementById('taskList');
const selectUrut      = document.getElementById('sortSelect');
const inputNamaTautan = document.getElementById('linkName');
const inputUrlTautan  = document.getElementById('linkUrl');
const btnTambahTautan = document.getElementById('addLinkBtn');
const elGridTautan    = document.getElementById('linksGrid');
const modalNama       = document.getElementById('nameModal');
const inputModalNama  = document.getElementById('nameModalInput');
const btnSimpanNama   = document.getElementById('nameSaveBtn');
const btnBatalNama    = document.getElementById('nameCancelBtn');
const btnUbahNama     = document.getElementById('changeNameBtn');
const modalEdit       = document.getElementById('editModal');
const inputEditTugas  = document.getElementById('editTaskInput');
const btnSimpanEdit   = document.getElementById('editSaveBtn');
const btnBatalEdit    = document.getElementById('editCancelBtn');
const elToast         = document.getElementById('toast');
const btnBiodata      = document.getElementById('biodataBtn');
const modalBiodata    = document.getElementById('biodataModal');
const btnTutupBiodata = document.getElementById('biodataCloseBtn');

/* ===== STATUS APLIKASI ===== */
let intervalTimer   = null;
let timerBerjalan   = false;
let totalDetik      = 0;
let totalDetikAwal  = 0;
let idEditTugas     = null;

// Muat data tersimpan
let daftarTugas  = simpan.ambil('tugas', []);
let daftarTautan = simpan.ambil('tautan', []);
let namaUser     = simpan.ambil('namaUser', '');
let durasiPomo   = simpan.ambil('durasiPomo', 25);
let modeGelap    = simpan.ambil('modeGelap', false);

// ============================================================
//  MODAL BIODATA PEMBUAT
// ============================================================

btnBiodata.addEventListener('click', () => {
  modalBiodata.classList.add('aktif');
});

btnTutupBiodata.addEventListener('click', () => {
  modalBiodata.classList.remove('aktif');
});

// Klik overlay gelap untuk tutup
modalBiodata.addEventListener('click', (e) => {
  if (e.target === modalBiodata) modalBiodata.classList.remove('aktif');
});

// Tekan Escape untuk tutup
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') modalBiodata.classList.remove('aktif');
});

// ============================================================
//  FUNGSI TOAST (notifikasi dalam halaman)
// ============================================================
let toastTimeout = null;

function tampilkanToast(pesan) {
  elToast.textContent = pesan;
  elToast.classList.add('tampil');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    elToast.classList.remove('tampil');
  }, 3000);
}

// ============================================================
//  1. JAM & SAPAAN
// ============================================================

function perbaruiJam() {
  const skrg  = new Date();
  const jam   = String(skrg.getHours()).padStart(2, '0');
  const menit = String(skrg.getMinutes()).padStart(2, '0');
  const detik = String(skrg.getSeconds()).padStart(2, '0');
  elWaktu.textContent = `${jam}:${menit}:${detik}`;

  const hariArr  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const bulanArr = ['Januari','Februari','Maret','April','Mei','Juni',
                    'Juli','Agustus','September','Oktober','November','Desember'];

  const hari   = hariArr[skrg.getDay()];
  const tgl    = skrg.getDate();
  const bulan  = bulanArr[skrg.getMonth()];
  const tahun  = skrg.getFullYear();
  elTanggal.textContent = `${hari}, ${tgl} ${bulan} ${tahun}`;

  const h = skrg.getHours();
  let kataSapa;
  if (h >= 5  && h < 12) kataSapa = 'Selamat Pagi';
  else if (h >= 12 && h < 15) kataSapa = 'Selamat Siang';
  else if (h >= 15 && h < 18) kataSapa = 'Selamat Sore';
  else if (h >= 18 && h < 21) kataSapa = 'Selamat Malam';
  else                         kataSapa = 'Selamat Istirahat';

  const bagianNama = namaUser ? `, ${namaUser}` : '';
  elSapaan.textContent = `${kataSapa}${bagianNama} 👋`;
}

setInterval(perbaruiJam, 1000);
perbaruiJam();

// ============================================================
//  2. TANTANGAN: Nama Kustom pada Sapaan
// ============================================================

btnUbahNama.addEventListener('click', () => {
  inputModalNama.value = namaUser;
  modalNama.classList.add('aktif');
  inputModalNama.focus();
});

btnSimpanNama.addEventListener('click', simpanNama);
inputModalNama.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') simpanNama();
  if (e.key === 'Escape') tutupModalNama();
});
btnBatalNama.addEventListener('click', tutupModalNama);
modalNama.addEventListener('click', (e) => {
  if (e.target === modalNama) tutupModalNama();
});

function simpanNama() {
  const val = inputModalNama.value.trim();
  namaUser = val;
  simpan.set('namaUser', namaUser);
  perbaruiJam();
  tutupModalNama();
  tampilkanToast(namaUser ? `✅ Halo, ${namaUser}!` : '✅ Nama berhasil dihapus.');
}

function tutupModalNama() {
  modalNama.classList.remove('aktif');
}

// ============================================================
//  3. TANTANGAN: Mode Gelap / Terang
// ============================================================

function terapkanTema() {
  document.body.classList.toggle('gelap', modeGelap);
  toggleGelap.checked = modeGelap;
}

toggleGelap.addEventListener('change', () => {
  modeGelap = toggleGelap.checked;
  simpan.set('modeGelap', modeGelap);
  terapkanTema();
  tampilkanToast(modeGelap ? '🌙 Mode gelap aktif' : '☀️ Mode terang aktif');
});

terapkanTema();

// ============================================================
//  4. TIMER FOKUS + TANTANGAN: Ubah Waktu Pomodoro
// ============================================================

function formatDetik(d) {
  const m = String(Math.floor(d / 60)).padStart(2, '0');
  const s = String(d % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function perbaruiProgressBar() {
  const persen = totalDetikAwal > 0
    ? (totalDetik / totalDetikAwal) * 100
    : 100;
  elProgressBar.style.width = persen + '%';
}

function inisialisasiTimer() {
  totalDetik      = durasiPomo * 60;
  totalDetikAwal  = totalDetik;
  elTimer.textContent = formatDetik(totalDetik);
  inputDurasi.value   = durasiPomo;
  elProgressBar.style.width = '100%';
}

function mulaiTimer() {
  if (timerBerjalan) return;
  timerBerjalan = true;
  elTimer.classList.add('berjalan');

  intervalTimer = setInterval(() => {
    if (totalDetik <= 0) {
      clearInterval(intervalTimer);
      timerBerjalan = false;
      elTimer.classList.remove('berjalan');
      elTimer.textContent = '00:00';
      elProgressBar.style.width = '0%';
      tampilkanToast('⏰ Sesi fokus selesai! Waktunya istirahat.');
      return;
    }
    totalDetik--;
    elTimer.textContent = formatDetik(totalDetik);
    perbaruiProgressBar();
  }, 1000);
}

function berhentiTimer() {
  clearInterval(intervalTimer);
  timerBerjalan = false;
  elTimer.classList.remove('berjalan');
}

function resetTimer() {
  berhentiTimer();
  inisialisasiTimer();
}

btnMulai.addEventListener('click', mulaiTimer);
btnBerhenti.addEventListener('click', berhentiTimer);
btnReset.addEventListener('click', resetTimer);

// Tombol Terapkan durasi baru
btnTerapkan.addEventListener('click', terapkanDurasi);
inputDurasi.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') terapkanDurasi();
});

function terapkanDurasi() {
  const val = parseInt(inputDurasi.value, 10);
  if (isNaN(val) || val < 1) {
    inputDurasi.value = durasiPomo;
    tampilkanToast('⚠️ Masukkan durasi yang valid (1–120 menit).');
    return;
  }
  durasiPomo = Math.min(val, 120);
  simpan.set('durasiPomo', durasiPomo);
  if (!timerBerjalan) inisialisasiTimer();
  tampilkanToast(`✅ Durasi diubah menjadi ${durasiPomo} menit.`);
}

inisialisasiTimer();

// ============================================================
//  5. DAFTAR TUGAS + TANTANGAN: Cegah Duplikat & Urutkan
// ============================================================

function buatId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function simpanTugas() {
  simpan.set('tugas', daftarTugas);
}

function dapatkanTugasTerurut() {
  const terurut = [...daftarTugas];
  const mode = selectUrut.value;
  if (mode === 'az') {
    terurut.sort((a, b) => a.teks.localeCompare(b.teks, 'id'));
  } else if (mode === 'za') {
    terurut.sort((a, b) => b.teks.localeCompare(a.teks, 'id'));
  } else if (mode === 'active') {
    terurut.sort((a, b) => Number(a.selesai) - Number(b.selesai));
  } else if (mode === 'done') {
    terurut.sort((a, b) => Number(b.selesai) - Number(a.selesai));
  }
  return terurut;
}

function renderTugas() {
  const terurut = dapatkanTugasTerurut();
  elDaftarTugas.innerHTML = '';

  if (terurut.length === 0) {
    elDaftarTugas.innerHTML =
      '<p class="task-empty">Belum ada tugas. Tambahkan di atas!</p>';
    return;
  }

  terurut.forEach(tugas => {
    const item = document.createElement('div');
    item.className = 'task-item' + (tugas.selesai ? ' selesai' : '');
    item.dataset.id = tugas.id;

    // Checkbox
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = tugas.selesai;
    cb.setAttribute('aria-label', `Tandai "${tugas.teks}" sebagai selesai`);
    cb.addEventListener('change', () => toggleTugas(tugas.id));

    // Label teks
    const label = document.createElement('span');
    label.className = 'task-label';
    label.textContent = tugas.teks;
    label.addEventListener('click', () => toggleTugas(tugas.id));

    // Tombol aksi
    const aksi = document.createElement('div');
    aksi.className = 'task-actions';

    const btnEdit = document.createElement('button');
    btnEdit.className = 'btn-edit';
    btnEdit.textContent = 'Ubah';
    btnEdit.addEventListener('click', () => bukaModalEdit(tugas.id));

    const btnHapus = document.createElement('button');
    btnHapus.className = 'btn btn-danger';
    btnHapus.textContent = 'Hapus';
    btnHapus.addEventListener('click', () => hapusTugas(tugas.id));

    aksi.appendChild(btnEdit);
    aksi.appendChild(btnHapus);
    item.appendChild(cb);
    item.appendChild(label);
    item.appendChild(aksi);
    elDaftarTugas.appendChild(item);
  });
}

function tambahTugas() {
  const teks = inputTugas.value.trim();
  if (!teks) {
    inputTugas.focus();
    return;
  }

  // Tantangan: Cegah duplikat (tidak peka huruf besar/kecil)
  const duplikat = daftarTugas.some(
    t => t.teks.toLowerCase() === teks.toLowerCase()
  );
  if (duplikat) {
    inputTugas.style.borderColor = 'var(--btn-danger)';
    tampilkanToast('⚠️ Tugas ini sudah ada dalam daftar!');
    setTimeout(() => { inputTugas.style.borderColor = ''; }, 1800);
    return;
  }

  daftarTugas.push({ id: buatId(), teks, selesai: false });
  simpanTugas();
  renderTugas();
  inputTugas.value = '';
  inputTugas.focus();
  tampilkanToast('✅ Tugas berhasil ditambahkan.');
}

function toggleTugas(id) {
  daftarTugas = daftarTugas.map(t =>
    t.id === id ? { ...t, selesai: !t.selesai } : t
  );
  simpanTugas();
  renderTugas();
}

function hapusTugas(id) {
  daftarTugas = daftarTugas.filter(t => t.id !== id);
  simpanTugas();
  renderTugas();
  tampilkanToast('🗑️ Tugas dihapus.');
}

function bukaModalEdit(id) {
  const tugas = daftarTugas.find(t => t.id === id);
  if (!tugas) return;
  idEditTugas = id;
  inputEditTugas.value = tugas.teks;
  modalEdit.classList.add('aktif');
  inputEditTugas.focus();
}

function simpanEditTugas() {
  const teks = inputEditTugas.value.trim();
  if (!teks || !idEditTugas) return;

  // Cegah duplikat saat mengedit (kecualikan tugas yang sedang diedit)
  const duplikat = daftarTugas.some(
    t => t.id !== idEditTugas && t.teks.toLowerCase() === teks.toLowerCase()
  );
  if (duplikat) {
    inputEditTugas.style.borderColor = 'var(--btn-danger)';
    tampilkanToast('⚠️ Tugas dengan nama ini sudah ada!');
    setTimeout(() => { inputEditTugas.style.borderColor = ''; }, 1800);
    return;
  }

  daftarTugas = daftarTugas.map(t =>
    t.id === idEditTugas ? { ...t, teks } : t
  );
  simpanTugas();
  renderTugas();
  tutupModalEdit();
  tampilkanToast('✅ Tugas berhasil diubah.');
}

function tutupModalEdit() {
  modalEdit.classList.remove('aktif');
  idEditTugas = null;
}

btnTambahTugas.addEventListener('click', tambahTugas);
inputTugas.addEventListener('keydown', (e) => { if (e.key === 'Enter') tambahTugas(); });
selectUrut.addEventListener('change', renderTugas);
btnSimpanEdit.addEventListener('click', simpanEditTugas);
btnBatalEdit.addEventListener('click', tutupModalEdit);
inputEditTugas.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') simpanEditTugas();
  if (e.key === 'Escape') tutupModalEdit();
});
modalEdit.addEventListener('click', (e) => {
  if (e.target === modalEdit) tutupModalEdit();
});

renderTugas();

// ============================================================
//  6. TAUTAN CEPAT
// ============================================================

function simpanTautan() {
  simpan.set('tautan', daftarTautan);
}

function renderTautan() {
  elGridTautan.innerHTML = '';

  if (daftarTautan.length === 0) {
    elGridTautan.innerHTML =
      '<span class="links-empty">Belum ada tautan tersimpan.</span>';
    return;
  }

  daftarTautan.forEach((tautan, indeks) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'link-btn-wrapper';

    const a = document.createElement('a');
    a.className = 'link-btn';
    a.textContent = tautan.nama;
    a.href = tautan.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    const btnHapus = document.createElement('button');
    btnHapus.className = 'link-remove-btn';
    btnHapus.textContent = '×';
    btnHapus.title = 'Hapus tautan';
    btnHapus.setAttribute('aria-label', `Hapus tautan ${tautan.nama}`);
    btnHapus.addEventListener('click', () => hapusTautan(indeks));

    wrapper.appendChild(a);
    wrapper.appendChild(btnHapus);
    elGridTautan.appendChild(wrapper);
  });
}

function tambahTautan() {
  const nama = inputNamaTautan.value.trim();
  let url    = inputUrlTautan.value.trim();

  if (!nama || !url) {
    if (!nama) inputNamaTautan.focus();
    else inputUrlTautan.focus();
    tampilkanToast('⚠️ Isi nama dan URL tautan terlebih dahulu.');
    return;
  }

  // Tambahkan https:// otomatis jika tidak ada
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  daftarTautan.push({ nama, url });
  simpanTautan();
  renderTautan();
  inputNamaTautan.value = '';
  inputUrlTautan.value  = '';
  inputNamaTautan.focus();
  tampilkanToast(`✅ Tautan "${nama}" ditambahkan.`);
}

function hapusTautan(indeks) {
  const nama = daftarTautan[indeks].nama;
  daftarTautan.splice(indeks, 1);
  simpanTautan();
  renderTautan();
  tampilkanToast(`🗑️ Tautan "${nama}" dihapus.`);
}

btnTambahTautan.addEventListener('click', tambahTautan);
inputUrlTautan.addEventListener('keydown', (e) => { if (e.key === 'Enter') tambahTautan(); });
inputNamaTautan.addEventListener('keydown', (e) => { if (e.key === 'Enter') inputUrlTautan.focus(); });

renderTautan();
