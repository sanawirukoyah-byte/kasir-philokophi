const K_PRODUK = 'kasir.produk.v2';
const K_TRX = 'kasir.transaksi.v2';
const K_KERANJANG = 'kasir.keranjang.v2';

function loadState(kunci, cadangan) {
  try {
    const mentah = localStorage.getItem(kunci);
    if (!mentah) return cadangan;
    const data = JSON.parse(mentah);
    return data === null || data === undefined ? cadangan : data;
  } catch (e) {
    return cadangan;
  }
}

function saveState(kunci, nilai) {
  try {
    localStorage.setItem(kunci, JSON.stringify(nilai));
  } catch (e) {
  }
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

function bersihProduk(raw) {
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
  return list.length ? list : benih();
}

function shiftDariJam(jam) {
  const j = Number.isFinite(jam) ? jam : new Date().getHours();
  return j >= 6 && j < 18 ? 'siang' : 'malam';
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

const state = {
  produk: bersihProduk(loadState(K_PRODUK, null)),
  transaksi: [],
  keranjang: [],
  diskon: 0,
  metode: 'tunai',
  shift: shiftDariJam(),
  tunai: 0,
  tab: 'kasir',
};

state.transaksi = bersihTrx(loadState(K_TRX, []));

const rawKeranjang = loadState(K_KERANJANG, []);
state.keranjang = Array.isArray(rawKeranjang)
  ? rawKeranjang
      .filter(i => i && state.produk.some(p => p.id === i.id))
      .map(i => {
        const p = state.produk.find(x => x.id === i.id);
        const qty = Math.max(1, Math.round(angka(i.qty, 1)));
        return p.stok > 0 ? { id: p.id, qty: Math.min(qty, p.stok) } : null;
      })
      .filter(Boolean)
  : [];

function simpanProduk() {
  saveState(K_PRODUK, state.produk);
}

function simpanTransaksi() {
  saveState(K_TRX, state.transaksi);
}

function simpanKeranjang() {
  saveState(K_KERANJANG, state.keranjang);
}
