const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const PATHS = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  trash: '<path d="M4 7h16M9.5 7V4.5h5V7M7 7l1 13h8l1-13"/>',
  print: '<path d="M7 9V4h10v5"/><path d="M5 9h14v7h-3v4H8v-4H5z"/>',
  bag: '<path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9.5 8a2.5 2.5 0 0 1 5 0"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 1.8"/>',
  box: '<path d="M4 8h16v12H4z"/><path d="M4 8l2-4h12l2 4M12 8v12"/>',
  chart: '<path d="M5 19v-7M12 19V5M19 19v-6"/>',
  calendar: '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 4v4M16 4v4M4 11h16"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  receipt: '<path d="M6 4h12v16l-3-2-3 2-3-2-3 2z"/><path d="M9 9h6M9 13h6"/>',
};

function icon(nama) {
  return `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[nama] || ''}</svg>`;
}

function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => {
    el.innerHTML = icon(el.dataset.icon);
    el.removeAttribute('data-icon');
  });
}

function formatRupiah(n) {
  const v = Number.isFinite(Number(n)) ? Math.round(Number(n)) : 0;
  return 'Rp ' + v.toLocaleString('id-ID');
}

function formatRibuan(n) {
  const v = Number.isFinite(Number(n)) ? Math.round(Number(n)) : 0;
  return v.toLocaleString('id-ID');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function inisial(nama) {
  const bagian = String(nama).trim().split(/\s+/).filter(Boolean);
  if (!bagian.length) return '?';
  const a = bagian[0][0] || '';
  const b = bagian[1] ? bagian[1][0] : bagian[0][1] || '';
  return (a + b).toUpperCase();
}

const dua = n => String(n).padStart(2, '0');

function formatWaktu(ts) {
  const d = new Date(ts);
  return `${dua(d.getDate())} ${BULAN[d.getMonth()]} ${d.getFullYear()}, ${dua(d.getHours())}:${dua(d.getMinutes())}`;
}

function formatJam(ts) {
  const d = new Date(ts);
  return `${dua(d.getHours())}:${dua(d.getMinutes())}`;
}

function tanggalKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`;
}

function tanggalPanjang(ts) {
  const d = new Date(ts);
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

function labelMetode(k) {
  return METODE[k] || METODE.tunai;
}

let toastTimer;
function toast(pesan) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = pesan;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2400);
}

const stack = [];
let backdrop;
let drawerAktif = false;

function sinkronBackdrop() {
  if (!backdrop) backdrop = document.getElementById('backdrop');
  if (stack.length || drawerAktif) {
    backdrop.hidden = false;
    requestAnimationFrame(() => backdrop.classList.add('is-open'));
  } else {
    backdrop.classList.remove('is-open');
    setTimeout(() => {
      if (!stack.length && !drawerAktif) backdrop.hidden = true;
    }, 170);
  }
}

function modalAktif() {
  return stack.length > 0;
}

function bukaModal(id) {
  const el = document.getElementById(id);
  if (!el || stack.includes(el)) return;
  stack.push(el);
  el.hidden = false;
  sinkronBackdrop();
  requestAnimationFrame(() => el.classList.add('is-open'));
  const f = el.querySelector('[data-autofocus]') || el.querySelector('button, input, select, textarea');
  if (f) setTimeout(() => f.focus(), 70);
}

function tutupModal(id) {
  const idx = stack.findIndex(el => el.id === id);
  if (idx === -1) return;
  const el = stack[idx];
  stack.splice(idx, 1);
  el.classList.remove('is-open');
  setTimeout(() => {
    if (!stack.includes(el)) el.hidden = true;
  }, 170);
  sinkronBackdrop();
  document.dispatchEvent(new CustomEvent('modal:tutup', { detail: { id } }));
}

function tutupAtas() {
  const el = stack[stack.length - 1];
  if (el) tutupModal(el.id);
}

let konfirmasiResolve = null;

function konfirmasi(judul, pesan, labelOke) {
  return new Promise(resolve => {
    konfirmasiResolve = resolve;
    document.getElementById('konfirmasiJudul').textContent = judul;
    document.getElementById('konfirmasiPesan').textContent = pesan;
    document.getElementById('konfirmasiOke').textContent = labelOke || 'Hapus';
    bukaModal('modalKonfirmasi');
  });
}

function selesaikanKonfirmasi(nilai) {
  const r = konfirmasiResolve;
  konfirmasiResolve = null;
  tutupModal('modalKonfirmasi');
  if (r) r(nilai);
}

function initUi() {
  hydrateIcons();

  document.addEventListener('keranjang:state', e => {
    drawerAktif = Boolean(e.detail && e.detail.buka);
    sinkronBackdrop();
  });

  document.getElementById('backdrop').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('backdrop:click'));
  });

  document.addEventListener('click', e => {
    const tutup = e.target.closest('[data-tutup]');
    if (tutup) {
      const modal = tutup.closest('.modal');
      if (modal) tutupModal(modal.id);
    }
  });

  document.getElementById('konfirmasiBatal').addEventListener('click', () => selesaikanKonfirmasi(false));
  document.getElementById('konfirmasiOke').addEventListener('click', () => selesaikanKonfirmasi(true));
  document.addEventListener('modal:tutup', e => {
    if (e.detail.id === 'modalKonfirmasi' && konfirmasiResolve) {
      const r = konfirmasiResolve;
      konfirmasiResolve = null;
      r(false);
    }
  });
}

function strukHtml(tx) {
  const item = tx.items
    .map(
      i => `<li><span class="q">${i.qty}×</span><span class="n">${escapeHtml(i.nama)}</span><span class="v">${formatRupiah(i.qty * i.harga)}</span></li>`
    )
    .join('');
  const diskonLine =
    tx.diskonNilai > 0
      ? `<div class="line"><span>Diskon ${tx.diskonPersen}%</span><span>−${formatRupiah(tx.diskonNilai)}</span></div>`
      : '';
  return `<div class="struk">
    <header class="struk-head">
      <p class="toko">${escapeHtml(TOKO.nama)}</p>
      <p class="alamat">${escapeHtml(TOKO.alamat)}</p>
    </header>
    <div class="struk-meta">
      <div class="full"><span>Atas nama</span><b>${escapeHtml(tx.atasNama || 'Umum')}</b></div>
      <div><span>No. struk</span><b>${escapeHtml(tx.no)}</b></div>
      <div><span>Waktu</span><b>${formatWaktu(tx.waktu)}</b></div>
      <div><span>Kasir</span><b>Shift ${tx.shift === 'malam' ? 'Malam' : 'Siang'}</b></div>
      <div><span>Metode</span><b>${labelMetode(tx.metode)}</b></div>
    </div>
    <ul class="struk-items">${item}</ul>
    <div class="struk-sum">
      <div class="line"><span>Subtotal</span><span>${formatRupiah(tx.subtotal)}</span></div>
      ${diskonLine}
      <div class="line grand"><span>Total</span><span>${formatRupiah(tx.total)}</span></div>
      <div class="line"><span>Bayar</span><span>${formatRupiah(tx.bayar)}</span></div>
      <div class="line"><span>Kembalian</span><span>${formatRupiah(tx.kembalian)}</span></div>
    </div>
    <footer class="struk-foot">Terima kasih. Barang yang sudah dibeli tidak dapat ditukar.</footer>
  </div>`;
}

function cetak(tx) {
  if (!tx) return;
  const area = document.getElementById('printArea');
  area.innerHTML = strukHtml(tx);
  window.print();
  setTimeout(() => { area.innerHTML = ''; }, 800);
}
