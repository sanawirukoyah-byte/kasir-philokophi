const K_PRODUK = 'kasir.produk.v3';
const K_TRX = 'kasir.transaksi.v2';
const K_KERANJANG = 'kasir.keranjang.v3';

function loadState(kunci, cadangan) {
  try {
    const mentah = localStorage.getItem(kunci);
    if (!mentah) return cadangan;
    const data = JSON.parse(mentah);
    return data === null || data === undefined ? cadangan : data;
  } catch (e) {
    if (typeof toast === 'function') toast('Data lokal tidak terbaca — memakai data awal.');
    return cadangan;
  }
}

function saveState(kunci, nilai) {
  try {
    localStorage.setItem(kunci, JSON.stringify(nilai));
    return true;
  } catch (e) {
    if (typeof toast === 'function') {
      const penuh = e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014);
      toast(penuh
        ? 'Penyimpanan browser penuh — perubahan terakhir tidak tersimpan. Hapus riwayat lama.'
        : 'Gagal menyimpan ke penyimpanan browser.');
    }
    return false;
  }
}

const salin = v => JSON.parse(JSON.stringify(v));

// Gabung tiga arah per id: data terbaru di storage + perubahan lokal sejak
// sinkron terakhir + penghapusan lokal. Dua tab tidak saling menimpa.
function mergeTigaArah(lokal, dasar, diDisk) {
  const D = new Map(dasar.map(x => [x.id, x]));
  const S = new Map(diDisk.map(x => [x.id, x]));
  const L = new Map(lokal.map(x => [x.id, x]));
  const hasil = new Map();

  S.forEach((v, id) => {
    const l = L.get(id);
    if (l !== undefined) {
      const d = D.get(id);
      const lokalTakBerubah = d !== undefined && JSON.stringify(d) === JSON.stringify(l);
      hasil.set(id, lokalTakBerubah ? v : l); // lokal berubah → lokal menang
    } else if (!D.has(id)) {
      hasil.set(id, v); // penambahan dari tab lain
    }
    // ada di dasar, hilang dari lokal = dihapus lokal → jangan dihidupkan lagi
  });

  L.forEach((v, id) => {
    if (!S.has(id) && !D.has(id)) hasil.set(id, v); // penambahan lokal yang belum tersimpan
  });

  return [...hasil.values()];
}

function angka(v, min = 0) {
  const n = Number(v);
  return Number.isFinite(n) && n >= min ? n : min;
}

function uid(h = 'x') {
  return h + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function benih() {
  return SEED_PRODUCTS.map(p => ({ ...p }));
}

// izinKosong: daftar kosong yang tersimpan dibiarkan kosong (mis. semua produk
// dihapus). Tanpa flag ini, list kosong selalu diganti seed — dipakai saat
// load pertama (belum pernah ada data).
function bersihProduk(raw, izinKosong = false) {
  if (!Array.isArray(raw)) return benih();
  const list = raw
    .filter(p => p && typeof p.nama === 'string' && p.nama.trim().length)
    .map(p => ({
      id: String(p.id || uid('p')),
      nama: p.nama.trim().slice(0, 60),
      kategori: String(p.kategori || 'Lainnya').trim().slice(0, 30) || 'Lainnya',
      beli: angka(p.beli),
      jual: angka(p.jual),
      stok: Math.round(angka(p.stok)),
      featured: Boolean(p.featured),
    }));
  return list.length || izinKosong ? list : benih();
}

function shiftDariJam(jam) {
  const j = Number.isFinite(jam) ? jam : new Date().getHours();
  return j >= 6 && j < 18 ? 'siang' : 'malam';
}

function labelShift(s) {
  return s === 'malam' ? 'Malam' : 'Siang';
}

function renderShift() {
  const wrap = document.querySelector('.shift');
  if (wrap) wrap.setAttribute('aria-label', 'Shift aktif: ' + labelShift(state.shift));
  document.querySelectorAll('[data-shift]').forEach(b => {
    const aktif = b.dataset.shift === state.shift;
    b.classList.toggle('is-active', aktif);
    b.setAttribute('aria-pressed', String(aktif));
  });
}

// Samakan shift dengan jam sekarang: siang 06.00–17.59, malam di luar itu
function sinkronShift() {
  if (state.shiftManual) return; // pilihan manual berlaku selama sesi ini
  const zona = shiftDariJam();
  if (state.shift === zona) return;
  state.shift = zona;
  renderShift();
  toast(`Shift otomatis: ${labelShift(zona)}`);
}

function bersihTrx(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(t => t && typeof t.no === 'string' && Array.isArray(t.items) && t.items.length && Number.isFinite(Number(t.total)))
    .map(t => {
      const waktu = Number(t.waktu) || Date.now();
      return {
        id: String(t.id || uid('t')),
        no: String(t.no),
        waktu,
        metode: ['tunai', 'qris', 'debit'].includes(t.metode) ? t.metode : 'tunai',
        shift: ['siang', 'malam'].includes(t.shift) ? t.shift : shiftDariJam(new Date(waktu).getHours()),
        atasNama: String(t.atasNama || '').trim().slice(0, 40),
        items: t.items
          .filter(i => i && Number.isFinite(Number(i.harga)) && Number.isFinite(Number(i.qty)))
          .map(i => ({ nama: String(i.nama || ''), harga: angka(i.harga), qty: Math.max(1, Math.round(angka(i.qty, 1))) })),
        subtotal: angka(t.subtotal),
        diskonPersen: Math.min(100, angka(t.diskonPersen)),
        diskonNilai: angka(t.diskonNilai),
        total: angka(t.total),
        bayar: angka(t.bayar),
        kembalian: angka(t.kembalian),
      };
    })
    .filter(t => t.items.length);
}

// Muat keranjang dari storage, buang item yang produknya sudah tidak ada /
// stok habis, dan batasi qty sesuai stok. Dipakai saat load awal, simpan,
// dan saat menerima perubahan dari tab lain.
function muatKeranjang() {
  const raw = loadState(K_KERANJANG, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(i => i && state.produk.some(p => p.id === i.id))
    .map(i => {
      const p = state.produk.find(x => x.id === i.id);
      const qty = Math.max(1, Math.round(angka(i.qty, 1)));
      return p.stok > 0 ? { id: p.id, qty: Math.min(qty, p.stok) } : null;
    })
    .filter(Boolean);
}

const state = {
  produk: bersihProduk(loadState(K_PRODUK, null), true),
  transaksi: [],
  keranjang: [],
  diskon: 0,
  metode: 'tunai',
  shift: shiftDariJam(),
  shiftManual: false,
  tunai: 0,
  tab: 'kasir',
};

state.transaksi = bersihTrx(loadState(K_TRX, []));
state.keranjang = muatKeranjang();

// Snapshot terakhir yang diketahui ada di storage — dasar merge tiga arah
let dasarProduk = salin(state.produk);
let dasarTrx = salin(state.transaksi);
let dasarKeranjang = salin(state.keranjang);

function simpanProduk() {
  const diDisk = bersihProduk(loadState(K_PRODUK, null), true);
  const gabung = mergeTigaArah(state.produk, dasarProduk, diDisk);
  state.produk = gabung;
  if (saveState(K_PRODUK, gabung)) dasarProduk = salin(gabung);
}

if (!loadState(K_PRODUK, null)) {
  simpanProduk();
}

function simpanTransaksi() {
  const diDisk = bersihTrx(loadState(K_TRX, []));
  const gabung = mergeTigaArah(state.transaksi, dasarTrx, diDisk)
    .sort((a, b) => b.waktu - a.waktu);
  state.transaksi = gabung;
  if (saveState(K_TRX, gabung)) dasarTrx = salin(gabung);
}

function simpanKeranjang() {
  const diDisk = muatKeranjang();
  const gabung = mergeTigaArah(state.keranjang, dasarKeranjang, diDisk);
  state.keranjang = gabung;
  if (saveState(K_KERANJANG, gabung)) dasarKeranjang = salin(gabung);
}

// Tab lain menulis ke localStorage → muat ulang bagiannya dan jadikan dasar
// sinkron berikutnya. Return true kalau ada yang berubah.
function terimaStorage(kunci) {
  if (kunci !== null && kunci !== K_PRODUK && kunci !== K_TRX && kunci !== K_KERANJANG) return false;
  if (kunci === null || kunci === K_PRODUK) {
    state.produk = bersihProduk(loadState(K_PRODUK, null), true);
    dasarProduk = salin(state.produk);
  }
  if (kunci === null || kunci === K_TRX) {
    state.transaksi = bersihTrx(loadState(K_TRX, []));
    dasarTrx = salin(state.transaksi);
  }
  if (kunci === null || kunci === K_KERANJANG) {
    state.keranjang = muatKeranjang();
    dasarKeranjang = salin(state.keranjang);
  }
  return true;
}
