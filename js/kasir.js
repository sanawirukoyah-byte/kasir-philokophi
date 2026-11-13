let kataCari = '';
let kategori = 'Semua';
let strukAktif = null;
let drawerOpen = false;

const elKasir = {};

function initElKasir() {
  ['cari', 'chips', 'grid', 'gridEmpty', 'countKecil', 'bukaKeranjang', 'tutupKeranjang', 'keranjang',
    'cartList', 'cartSub', 'cartFoot', 'kosongkan', 'diskon', 'cashWrap', 'tunai', 'sumSubtotal', 'rowSubtotal',
    'rowDiskon', 'sumDiskon', 'sumTotal', 'rowBayar', 'sumBayar', 'rowKembali', 'sumKembali',
    'bayar', 'bayarHint', 'strukBody', 'cetakStruk', 'atasNama'].forEach(id => { elKasir[id] = document.getElementById(id); });
}

function daftarKategori() {
  return ['Semua', ...new Set(state.produk.map(p => p.kategori).filter(Boolean))];
}

function itemsAktif() {
  const buang = [];
  const out = [];
  let kotor = false;
  state.keranjang.forEach(ci => {
    const p = state.produk.find(x => x.id === ci.id);
    if (!p || p.stok <= 0) { buang.push(ci.id); return; }
    const qty = Math.min(ci.qty, p.stok);
    if (qty !== ci.qty) { ci.qty = qty; kotor = true; }
    out.push({ p, qty });
  });
  if (buang.length) {
    const nama = state.produk.find(p => buang.includes(p.id));
    state.keranjang = state.keranjang.filter(c => !buang.includes(c.id));
    kotor = true;
    if (nama) toast(`Stok ${nama.nama} habis — item dikeluarkan dari keranjang`);
  }
  if (kotor) simpanKeranjang();
  return out;
}

function totalQty(items) {
  return items.reduce((a, i) => a + i.qty, 0);
}

function renderChips() {
  elKasir.chips.innerHTML = daftarKategori()
    .map(k => `<button class="chip${k === kategori ? ' is-active' : ''}" type="button" data-kategori="${escapeHtml(k)}">${escapeHtml(k)}</button>`)
    .join('');
}

function renderGrid() {
  const q = kataCari.trim().toLowerCase();
  const list = state.produk.filter(p => {
    const cocokKategori = kategori === 'Semua' || p.kategori === kategori;
    const cocokCari = !q || p.nama.toLowerCase().includes(q) || p.kategori.toLowerCase().includes(q);
    return cocokKategori && cocokCari;
  });
  elKasir.grid.innerHTML = list.map(p => {
    const habis = p.stok <= 0;
    const stokTeks = habis ? 'Stok habis' : p.stok <= 5 ? `Stok tersisa ${p.stok}` : `Stok ${formatRibuan(p.stok)}`;
    return `<button class="card${p.featured ? ' featured' : ''}" type="button" data-id="${p.id}"${habis ? ' disabled' : ''}>
      <span class="thumb">${inisial(p.nama)}</span>
      <span class="card-body">
        <span class="nama">${escapeHtml(p.nama)}</span>
        <span class="harga">${formatRupiah(p.jual)}</span>
        <span class="stok">${stokTeks}</span>
      </span>
      ${habis ? '<span class="badge-habis">Habis</span>' : ''}
    </button>`;
  }).join('');
  const kosong = list.length === 0;
  elKasir.gridEmpty.hidden = !kosong;
  if (kosong) {
    elKasir.gridEmpty.textContent = kataCari.trim()
      ? 'Tidak ada produk yang cocok dengan pencarian ini.'
      : `Belum ada produk pada kategori ${kategori}.`;
  }
}

function renderCart() {
  const items = itemsAktif();
  const jumlah = totalQty(items);
  elKasir.cartSub.textContent = `${jumlah} item`;
  elKasir.countKecil.textContent = jumlah;
  elKasir.kosongkan.disabled = jumlah === 0;

  if (!items.length) {
    elKasir.cartList.innerHTML = `<div class="empty-cart">
      <span class="empty-ring">${icon('receipt')}</span>
      <p>Keranjang masih kosong — pilih produk di samping</p>
    </div>`;
    return;
  }

  elKasir.cartList.innerHTML = items.map(({ p, qty }) => `
    <div class="ci" data-id="${p.id}">
      <div>
        <p class="ci-nama">${escapeHtml(p.nama)}</p>
        <p class="ci-harga">${formatRupiah(p.jual)} / item · stok ${formatRibuan(p.stok)}</p>
      </div>
      <p class="ci-sub">${formatRupiah(p.jual * qty)}</p>
      <div class="ci-tools">
        <div class="stepper">
          <button class="step" type="button" data-act="dec" aria-label="Kurangi jumlah"${qty <= 1 ? ' disabled' : ''}>${icon('minus')}</button>
          <span class="qty${qty >= p.stok ? ' max' : ''}">${qty}</span>
          <button class="step" type="button" data-act="inc" aria-label="Tambah jumlah"${qty >= p.stok ? ' disabled' : ''}>${icon('plus')}</button>
        </div>
        <button class="icon-btn" type="button" data-act="del" aria-label="Hapus ${escapeHtml(p.nama)} dari keranjang">${icon('trash')}</button>
      </div>
    </div>`).join('');
}

function renderRingkasan() {
  const items = itemsAktif();
  const subtotal = items.reduce((a, i) => a + i.p.jual * i.qty, 0);
  const persen = state.diskon;
  const diskon = persen > 0 ? Math.round((subtotal * persen) / 100) : 0;
  const total = subtotal - diskon;
  const pakaiTunai = state.metode === 'tunai';
  const tunai = pakaiTunai ? state.tunai : 0;
  const kembalian = tunai - total;

  elKasir.cartFoot.hidden = !items.length;
  elKasir.sumSubtotal.textContent = formatRupiah(subtotal);
  elKasir.rowSubtotal.hidden = diskon <= 0;
  elKasir.rowDiskon.hidden = !items.length;
  elKasir.sumDiskon.hidden = diskon <= 0;
  elKasir.sumDiskon.textContent = '−' + formatRupiah(diskon);
  elKasir.sumTotal.textContent = formatRupiah(total);
  elKasir.cashWrap.hidden = !pakaiTunai;

  elKasir.rowBayar.hidden = !(pakaiTunai && tunai > 0 && items.length);
  elKasir.sumBayar.textContent = formatRupiah(tunai);
  elKasir.rowKembali.hidden = !(pakaiTunai && tunai > 0 && total > 0 && kembalian >= 0);
  elKasir.sumKembali.textContent = formatRupiah(Math.max(0, kembalian));

  elKasir.bayar.textContent = items.length ? `Bayar ${formatRupiah(total)}` : 'Bayar';
  elKasir.bayarHint.classList.remove('warn');

  if (!items.length) {
    elKasir.bayar.disabled = true;
    elKasir.bayarHint.hidden = false;
    elKasir.bayarHint.textContent = 'Pilih produk untuk memulai transaksi';
    return;
  }
  if (pakaiTunai && tunai < total) {
    elKasir.bayar.disabled = true;
    elKasir.bayarHint.hidden = false;
    elKasir.bayarHint.classList.add('warn');
    elKasir.bayarHint.textContent = `Uang tunai kurang ${formatRupiah(total - tunai)}`;
    return;
  }
  elKasir.bayar.disabled = false;
  if (pakaiTunai) {
    elKasir.bayarHint.hidden = true;
  } else {
    elKasir.bayarHint.hidden = false;
    elKasir.bayarHint.textContent = `Siap dibayar lewat ${state.metode === 'qris' ? 'QRIS' : 'Debit'}`;
  }
}

function renderKasir() {
  renderChips();
  renderGrid();
  renderCart();
  renderRingkasan();
}

function tambah(id) {
  const p = state.produk.find(x => x.id === id);
  if (!p) return;
  if (p.stok <= 0) { toast('Stok habis'); return; }
  const ci = state.keranjang.find(c => c.id === id);
  const kini = ci ? ci.qty : 0;
  if (kini >= p.stok) { toast(`Stok tersisa ${p.stok}`); return; }
  if (ci) ci.qty += 1;
  else state.keranjang.push({ id: p.id, qty: 1 });
  simpanKeranjang();
  renderKasir();
}

function ubahQty(id, delta) {
  const p = state.produk.find(x => x.id === id);
  const ci = state.keranjang.find(c => c.id === id);
  if (!p || !ci) return;
  const baru = ci.qty + delta;
  if (baru < 1) return;
  if (baru > p.stok) { toast(`Stok tersisa ${p.stok}`); return; }
  ci.qty = baru;
  simpanKeranjang();
  renderKasir();
}

function hapusItem(id) {
  const p = state.produk.find(x => x.id === id);
  state.keranjang = state.keranjang.filter(c => c.id !== id);
  simpanKeranjang();
  renderKasir();
  if (p) toast(`${p.nama} dihapus dari keranjang`);
}

function kosongkan() {
  if (!state.keranjang.length) return;
  state.keranjang = [];
  simpanKeranjang();
  renderKasir();
  toast('Keranjang dikosongkan');
}

function nomorStruk() {
  const key = tanggalKey(Date.now());
  const n = state.transaksi.filter(t => tanggalKey(t.waktu) === key).length + 1;
  return 'TK-' + key.replace(/-/g, '') + '-' + String(n).padStart(4, '0');
}

function bayarSekarang() {
  const items = itemsAktif();
  if (!items.length) { toast('Keranjang masih kosong'); return; }

  const subtotal = items.reduce((a, i) => a + i.p.jual * i.qty, 0);
  const persen = state.diskon;
  const diskonNilai = persen > 0 ? Math.round((subtotal * persen) / 100) : 0;
  const total = subtotal - diskonNilai;
  let bayar = total;
  let kembalian = 0;

  if (state.metode === 'tunai') {
    if (state.tunai < total) { toast(`Uang tunai kurang ${formatRupiah(total - state.tunai)}`); return; }
    bayar = state.tunai;
    kembalian = state.tunai - total;
  }

  const tx = {
    id: uid('t'),
    no: nomorStruk(),
    waktu: Date.now(),
    metode: state.metode,
    shift: state.shift,
    atasNama: (elKasir.atasNama.value || '').trim().slice(0, 40) || 'Umum',
    items: items.map(({ p, qty }) => ({ nama: p.nama, harga: p.jual, qty })),
    subtotal,
    diskonPersen: persen,
    diskonNilai,
    total,
    bayar,
    kembalian,
  };

  items.forEach(({ p, qty }) => { p.stok = Math.max(0, p.stok - qty); });
  state.transaksi.unshift(tx);
  state.keranjang = [];
  state.diskon = 0;
  state.tunai = 0;
  simpanProduk();
  simpanTransaksi();
  simpanKeranjang();

  elKasir.diskon.value = '0';
  elKasir.tunai.value = '';
  elKasir.atasNama.value = '';
  renderKasir();

  strukAktif = tx;
  elKasir.strukBody.innerHTML = strukHtml(tx);
  bukaModal('modalStruk');
}

function setDrawer(buka) {
  drawerOpen = Boolean(buka);
  elKasir.keranjang.classList.toggle('is-open', drawerOpen);
  document.dispatchEvent(new CustomEvent('keranjang:state', { detail: { buka: drawerOpen } }));
}

function fokusCari() {
  elKasir.cari.focus();
  elKasir.cari.select();
}

function initKasir() {
  initElKasir();

  elKasir.cari.addEventListener('input', () => { kataCari = elKasir.cari.value; renderGrid(); });

  elKasir.chips.addEventListener('click', e => {
    const chip = e.target.closest('[data-kategori]');
    if (!chip) return;
    kategori = chip.dataset.kategori;
    renderChips();
    renderGrid();
  });

  elKasir.grid.addEventListener('click', e => {
    const card = e.target.closest('.card');
    if (card && !card.disabled) tambah(card.dataset.id);
  });

  elKasir.cartList.addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const ci = btn.closest('.ci');
    if (!ci) return;
    const id = ci.dataset.id;
    if (btn.dataset.act === 'inc') ubahQty(id, 1);
    if (btn.dataset.act === 'dec') ubahQty(id, -1);
    if (btn.dataset.act === 'del') hapusItem(id);
  });

  elKasir.kosongkan.addEventListener('click', kosongkan);

  elKasir.diskon.addEventListener('input', () => {
    let v = Math.round(Number(elKasir.diskon.value));
    if (!Number.isFinite(v) || v < 0) v = 0;
    if (v > 100) { v = 100; elKasir.diskon.value = '100'; }
    state.diskon = v;
    renderRingkasan();
  });

  document.querySelectorAll('.method').forEach(btn => {
    btn.addEventListener('click', () => {
      state.metode = btn.dataset.metode;
      document.querySelectorAll('.method').forEach(b => b.classList.toggle('is-active', b === btn));
      renderRingkasan();
    });
  });

  elKasir.tunai.addEventListener('input', () => {
    const digit = elKasir.tunai.value.replace(/\D/g, '').slice(0, 12);
    const v = Number(digit || 0);
    state.tunai = v;
    const teks = digit ? Number(digit).toLocaleString('id-ID') : '';
    if (elKasir.tunai.value !== teks) elKasir.tunai.value = teks;
    renderRingkasan();
  });

  document.querySelectorAll('[data-uang]').forEach(btn => {
    btn.addEventListener('click', () => {
      const items = itemsAktif();
      const subtotal = items.reduce((a, i) => a + i.p.jual * i.qty, 0);
      const total = subtotal - Math.round((subtotal * state.diskon) / 100);
      let v = btn.dataset.uang === 'pas' ? total : Number(btn.dataset.uang);
      if (!Number.isFinite(v) || v < 0) v = 0;
      state.tunai = v;
      elKasir.tunai.value = v ? v.toLocaleString('id-ID') : '';
      renderRingkasan();
    });
  });

  elKasir.bayar.addEventListener('click', bayarSekarang);
  elKasir.cetakStruk.addEventListener('click', () => cetak(strukAktif));
  elKasir.bukaKeranjang.addEventListener('click', () => setDrawer(true));
  elKasir.tutupKeranjang.addEventListener('click', () => setDrawer(false));

  document.addEventListener('modal:tutup', e => {
    if (e.detail.id === 'modalStruk') { strukAktif = null; elKasir.strukBody.innerHTML = ''; }
  });

  renderKasir();
}


