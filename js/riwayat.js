const elRiwayat = {};
let filterTanggal = '';
let detailAktif = null;

function initElRiwayat() {
  ['filterTanggal', 'resetTanggal', 'riwayatSub', 'wrapRiwayat', 'tbodyRiwayat', 'riwayatEmpty',
    'detailBody', 'cetakUlang', 'judulDetail', 'hapusTrx'].forEach(id => { elRiwayat[id] = document.getElementById(id); });
}

function daftar() {
  if (!filterTanggal) return state.transaksi;
  return state.transaksi.filter(t => tanggalKey(t.waktu) === filterTanggal);
}

function renderRiwayat() {
  const list = daftar();
  const total = list.reduce((a, t) => a + t.total, 0);
  const item = list.reduce((a, t) => a + t.items.reduce((b, i) => b + i.qty, 0), 0);

  elRiwayat.riwayatSub.textContent = list.length
    ? `${list.length} transaksi · ${item} item · ${formatRupiah(total)}`
    : filterTanggal
      ? 'Tidak ada transaksi pada tanggal yang dipilih.'
      : 'Belum ada transaksi.';

  elRiwayat.tbodyRiwayat.innerHTML = list.map(t => {
    const jumlahItem = t.items.reduce((a, i) => a + i.qty, 0);
    return `<tr class="clickable" data-id="${t.id}" tabindex="0">
      <td>${formatWaktu(t.waktu)}</td>
      <td>${escapeHtml(t.no)}</td>
      <td>${escapeHtml(t.atasNama || 'Umum')}</td>
      <td>${labelMetode(t.metode)}</td>
      <td class="num">${formatRibuan(jumlahItem)}</td>
      <td class="num"><strong>${formatRupiah(t.total)}</strong></td>
    </tr>`;
  }).join('');

  const kosong = list.length === 0;
  elRiwayat.wrapRiwayat.hidden = kosong;
  elRiwayat.riwayatEmpty.hidden = !kosong;
}

function bukaDetail(id) {
  const tx = state.transaksi.find(t => t.id === id);
  if (!tx) { toast('Struk tidak ditemukan'); return; }
  detailAktif = tx;
  elRiwayat.judulDetail.textContent = tx.no;
  elRiwayat.detailBody.innerHTML = strukHtml(tx);
  bukaModal('modalDetail');
}

function initRiwayat() {
  initElRiwayat();

  elRiwayat.filterTanggal.addEventListener('change', () => {
    filterTanggal = elRiwayat.filterTanggal.value;
    renderRiwayat();
  });

  elRiwayat.resetTanggal.addEventListener('click', () => {
    filterTanggal = '';
    elRiwayat.filterTanggal.value = '';
    renderRiwayat();
  });

  elRiwayat.tbodyRiwayat.addEventListener('click', e => {
    const tr = e.target.closest('tr[data-id]');
    if (tr) bukaDetail(tr.dataset.id);
  });

  elRiwayat.tbodyRiwayat.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const tr = e.target.closest('tr[data-id]');
    if (tr) { e.preventDefault(); bukaDetail(tr.dataset.id); }
  });

  elRiwayat.cetakUlang.addEventListener('click', () => {
    if (detailAktif) { cetak(detailAktif); toast('Struk dikirim ke pencetak'); }
  });

  elRiwayat.hapusTrx.addEventListener('click', async () => {
    const tx = detailAktif;
    if (!tx) return;
    const setuju = await konfirmasi(
      'Hapus transaksi',
      `${tx.no} senilai ${formatRupiah(tx.total)} akan dihapus permanen. Laporan ikut menyesuaikan.`,
      'Hapus'
    );
    if (!setuju) return;
    state.transaksi = state.transaksi.filter(t => t.id !== tx.id);
    simpanTransaksi();
    tutupModal('modalDetail');
    renderRiwayat();
    toast(`Transaksi ${tx.no} dihapus`);
  });

  document.addEventListener('modal:tutup', e => {
    if (e.detail.id === 'modalDetail') { detailAktif = null; elRiwayat.detailBody.innerHTML = ''; }
  });
}
