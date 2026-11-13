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

document.getElementById('backdrop').addEventListener('click', () => {
  if (modalAktif()) tutupAtas();
  else if (drawerTerbuka()) setDrawer(false);
});

window.addEventListener('produk:ubah', () => renderKasir());

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
    if (tag === 'BUTTON' || tag === 'A' || tag === 'FORM') return;
    if (state.tab === 'kasir') {
      e.preventDefault();
      bayarSekarang();
    }
  }
});

setTab('kasir');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
