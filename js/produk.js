const elProduk = {};
let kataCariProduk = '';
let editingId = null;

function initElProduk() {
  ['cariProduk', 'tambahProduk', 'tbodyProduk', 'produkEmpty', 'produkSub', 'formProduk', 'fJudul',
    'fNama', 'fKategori', 'fBeli', 'fJual', 'fStok', 'daftarKategori', 'marginHint'].forEach(id => {
    elProduk[id] = document.getElementById(id);
  });
  ['Nama', 'Kategori', 'Beli', 'Jual', 'Stok'].forEach(k => { elProduk['err' + k] = document.getElementById('err' + k); });
}

function daftarFilter() {
  const q = kataCariProduk.trim().toLowerCase();
  return state.produk.filter(p => !q || p.nama.toLowerCase().includes(q) || p.kategori.toLowerCase().includes(q));
}

function renderProduk() {
  const list = daftarFilter();
  elProduk.produkSub.textContent = `${state.produk.length} produk terdaftar · tekan Ubah untuk mengubah data`;

  elProduk.tbodyProduk.innerHTML = list.map(p => {
    const stokKelas = p.stok <= 0 ? 'out' : p.stok <= 5 ? 'low' : '';
    const stokTeks = p.stok <= 0 ? 'Habis' : formatRibuan(p.stok);
    return `<tr data-id="${p.id}">
      <td>
        <div class="cell-nama">
          <span class="dot-thumb">${inisial(p.nama)}</span>
          <div><strong>${escapeHtml(p.nama)}</strong><span>${escapeHtml(p.kategori)}</span></div>
        </div>
      </td>
      <td class="num">${formatRupiah(p.beli)}</td>
      <td class="num">${formatRupiah(p.jual)}</td>
      <td class="num"><span class="pill ${stokKelas}">${stokTeks}</span></td>
      <td class="num">
        <div class="row-actions">
          <button class="text-btn" type="button" data-aksi="ubah">Ubah</button>
          <button class="text-btn danger" type="button" data-aksi="hapus">Hapus</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  const kosong = list.length === 0;
  elProduk.produkEmpty.hidden = !kosong;
  if (kosong) {
    elProduk.produkEmpty.textContent = kataCariProduk.trim()
      ? 'Tidak ada produk yang cocok dengan pencarian ini.'
      : 'Belum ada produk. Tambahkan produk pertama lewat tombol di atas.';
  }
}

function bersihError() {
  ['Nama', 'Kategori', 'Beli', 'Jual', 'Stok'].forEach(k => { elProduk['err' + k].hidden = true; });
  elProduk.marginHint.hidden = true;
}

function salah(field, pesan) {
  const e = elProduk['err' + field];
  e.textContent = pesan;
  e.hidden = false;
}

function parseAngka(v) {
  const s = String(v).replace(/[^\d.-]/g, '');
  if (!s.trim()) return NaN;
  return Number(s);
}

function hitungMargin() {
  const beli = parseAngka(elProduk.fBeli.value);
  const jual = parseAngka(elProduk.fJual.value);
  if (Number.isFinite(beli) && Number.isFinite(jual) && jual > 0 && beli >= 0) {
    const laba = jual - beli;
    const persen = Math.round((laba / jual) * 100);
    elProduk.marginHint.textContent = `Margin per item ${formatRupiah(laba)} (${persen}% dari harga jual)`;
    elProduk.marginHint.hidden = false;
  } else {
    elProduk.marginHint.hidden = true;
  }
}

function isiDatalist() {
  const kategori = [...new Set(state.produk.map(p => p.kategori).filter(Boolean))].sort();
  elProduk.daftarKategori.innerHTML = kategori.map(k => `<option value="${escapeHtml(k)}"></option>`).join('');
}

function bukaForm(id) {
  editingId = id || null;
  const p = id ? state.produk.find(x => x.id === id) : null;
  elProduk.fJudul.textContent = p ? 'Ubah produk' : 'Tambah produk';
  elProduk.fNama.value = p ? p.nama : '';
  elProduk.fKategori.value = p ? p.kategori : '';
  elProduk.fBeli.value = p ? p.beli : '';
  elProduk.fJual.value = p ? p.jual : '';
  elProduk.fStok.value = p ? p.stok : '';
  bersihError();
  isiDatalist();
  hitungMargin();
  bukaModal('modalProduk');
}

function simpan(e) {
  e.preventDefault();
  bersihError();

  const nama = elProduk.fNama.value.trim().slice(0, 60);
  const kategori = elProduk.fKategori.value.trim().slice(0, 30);
  const beli = parseAngka(elProduk.fBeli.value);
  const jual = parseAngka(elProduk.fJual.value);
  const stokRaw = parseAngka(elProduk.fStok.value);
  let valid = true;

  if (!nama) { salah('Nama', 'Nama produk wajib diisi.'); valid = false; }
  if (!kategori) { salah('Kategori', 'Kategori wajib diisi.'); valid = false; }
  if (!Number.isFinite(beli) || beli < 0) { salah('Beli', 'Harga beli tidak boleh negatif.'); valid = false; }
  if (!Number.isFinite(jual) || jual < 0) { salah('Jual', 'Harga jual tidak boleh negatif.'); valid = false; }
  if (Number.isFinite(beli) && Number.isFinite(jual) && jual < beli) {
    salah('Jual', 'Harga jual lebih rendah dari harga beli.');
    valid = false;
  }
  if (!Number.isFinite(stokRaw) || stokRaw < 0 || !Number.isInteger(stokRaw)) {
    salah('Stok', 'Stok berupa bilangan bulat dan tidak boleh negatif.');
    valid = false;
  }
  if (!valid) return;

  const data = { nama, kategori, beli: Math.round(beli), jual: Math.round(jual), stok: stokRaw };

  if (editingId) {
    const p = state.produk.find(x => x.id === editingId);
    if (!p) { toast('Produk tidak ditemukan'); return; }
    Object.assign(p, data);
    toast(`${nama} diperbarui`);
  } else {
    state.produk.push({ id: uid('p'), ...data });
    toast(`${nama} ditambahkan`);
  }

  simpanProduk();
  window.dispatchEvent(new Event('produk:ubah'));
  tutupModal('modalProduk');
  renderProduk();
}

async function hapus(id) {
  const p = state.produk.find(x => x.id === id);
  if (!p) return;
  const setuju = await konfirmasi(
    'Hapus produk',
    `${p.nama} akan dihapus dari daftar produk. Riwayat transaksi tidak ikut terhapus.`,
    'Hapus'
  );
  if (!setuju) return;
  state.produk = state.produk.filter(x => x.id !== id);
  state.keranjang = state.keranjang.filter(c => c.id !== id);
  simpanProduk();
  window.dispatchEvent(new Event('produk:ubah'));
  renderProduk();
  toast(`${p.nama} dihapus`);
}

function initProduk() {
  initElProduk();
  isiDatalist();

  elProduk.cariProduk.addEventListener('input', () => { kataCariProduk = elProduk.cariProduk.value; renderProduk(); });
  elProduk.tambahProduk.addEventListener('click', () => bukaForm(null));
  elProduk.formProduk.addEventListener('submit', simpan);
  elProduk.fBeli.addEventListener('input', hitungMargin);
  elProduk.fJual.addEventListener('input', hitungMargin);

  elProduk.tbodyProduk.addEventListener('click', e => {
    const btn = e.target.closest('[data-aksi]');
    if (!btn) return;
    const tr = btn.closest('tr');
    if (!tr) return;
    if (btn.dataset.aksi === 'ubah') bukaForm(tr.dataset.id);
    if (btn.dataset.aksi === 'hapus') hapus(tr.dataset.id);
  });
}
