const TABS = ['kasir', 'riwayat', 'produk', 'laporan'];

function drawerTerbuka() {
  return document.getElementById('keranjang').classList.contains('is-open');
}

function setTab(tab) {
  if (!TABS.includes(tab)) return;
  state.tab = tab;

  document.querySelectorAll('.nav-item').forEach(b => {
    const aktif = b.dataset.tab === tab;
    b.classList.toggle('is-active', aktif);
    if (aktif) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });

  TABS.forEach(t => { document.getElementById('view-' + t).hidden = t !== tab; });

  if (tab === 'kasir') renderKasir();
  if (tab === 'riwayat') renderRiwayat();
  if (tab === 'produk') renderProduk();
  if (tab === 'laporan') renderLaporan();
}

initUi();
initKasir();
initProduk();
initRiwayat();
initLaporan();

document.querySelectorAll('.nav-item').forEach(b => {
  b.addEventListener('click', () => setTab(b.dataset.tab));
});

renderShift();
setInterval(sinkronShift, 30000);
window.addEventListener('focus', sinkronShift);
document.addEventListener('visibilitychange', () => { if (!document.hidden) sinkronShift(); });

// Pilihan shift manual: berlaku selama sesi ini, sinkron otomatis tidak menimpanya
document.querySelectorAll('[data-shift]').forEach(b => {
  b.addEventListener('click', () => {
    const pilihan = b.dataset.shift;
    if (state.shift === pilihan && state.shiftManual) return;
    state.shift = pilihan;
    state.shiftManual = true;
    renderShift();
    toast(`Shift dipilih manual: ${labelShift(pilihan)}`);
  });
});

// Di ≥1024px keranjang menempel sebagai kolom dan tombol close disembunyikan CSS,
// jadi paksa tutup drawer supaya backdrop tidak menutupi layar setelah resize
const mqDesktop = window.matchMedia('(min-width: 1024px)');
function tutupDrawerDiDesktop() {
  if (mqDesktop.matches && drawerTerbuka()) setDrawer(false);
}
mqDesktop.addEventListener('change', tutupDrawerDiDesktop);
tutupDrawerDiDesktop();

document.getElementById('backdrop').addEventListener('click', () => {
  if (modalAktif()) tutupAtas();
  else if (drawerTerbuka()) setDrawer(false);
});

window.addEventListener('produk:ubah', () => renderKasir());

// Dua tab pada satu perangkat: terima perubahan tab lain, render ulang tab aktif
window.addEventListener('storage', e => {
  if (e.storageArea && e.storageArea !== localStorage) return;
  if (terimaStorage(e.key)) setTab(state.tab);
});

document.addEventListener('modal:tutup', e => {
  if (e.detail.id === 'modalStruk' && state.tab === 'kasir') fokusCari();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (modalAktif()) { tutupAtas(); return; }
    if (drawerTerbuka()) setDrawer(false);
    return;
  }

  if (modalAktif()) return;

  const tag = e.target ? e.target.tagName : '';

  if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
    e.preventDefault();
    setTab('kasir');
    fokusCari();
    return;
  }

  if (e.key === 'Enter') {
    // Enter hanya memicu bayar saat fokus bukan di kolom isian/form apa pun
    if (tag === 'BUTTON' || tag === 'A' || tag === 'FORM' ||
        tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (state.tab === 'kasir') {
      e.preventDefault();
      bayarSekarang();
    }
  }
});

setTab('kasir');

if (location.protocol !== 'file:' && 'serviceWorker' in navigator) {
  const mf = document.createElement('link');
  mf.rel = 'manifest';
  mf.href = 'manifest.json';
  document.head.appendChild(mf);
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').then(reg => {
      reg.update().catch(() => {});
    }).catch(() => {});
  });
}
