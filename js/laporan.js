const elLaporan = {};
let dataJam = new Array(24).fill(0);
let hover = -1;
let pad = null;
let slot = 0;

function initElLaporan() {
  ['lapSub', 'omzetHariIni', 'jmlTransaksi', 'rataTransaksi', 'jmlItem', 'tagHari', 'grafik',
    'grafikEmpty', 'topProduk', 'topEmpty'].forEach(id => { elLaporan[id] = document.getElementById(id); });
}

function pendek(v) {
  const n = Math.round(v);
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace('.', ',') + ' M';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + ' jt';
  if (n >= 1e3) return Math.round(n / 1e3) + ' rb';
  return String(n);
}

function maksPantas(v) {
  if (v <= 0) return 1;
  const pangkat = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / pangkat;
  const n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return n * pangkat;
}

function bar(ctx, x, y, w, h, r) {
  const rr = Math.min(r, h, w / 2);
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
}

function gambar() {
  const canvas = elLaporan.grafik;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  pad = { l: 48, r: 8, t: 18, b: 26 };
  const lebar = w - pad.l - pad.r;
  const tinggi = h - pad.t - pad.b;
  slot = lebar / 24;
  const maks = maksPantas(Math.max(...dataJam));

  ctx.font = '12px "Instrument Sans", system-ui, sans-serif';
  ctx.textBaseline = 'middle';

  for (let i = 0; i <= 4; i++) {
    const nilai = (maks * i) / 4;
    const y = pad.t + tinggi - (tinggi * i) / 4;
    ctx.strokeStyle = i === 0 ? '#0A4E5C' : '#E7E5E4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, Math.round(y) + 0.5);
    ctx.lineTo(pad.l + lebar, Math.round(y) + 0.5);
    ctx.stroke();
    ctx.fillStyle = 'rgb(10 78 92 / .5)';
    ctx.textAlign = 'right';
    ctx.fillText(pendek(nilai), pad.l - 8, y);
  }

  const lebarBar = Math.min(slot * 0.6, 24);

  dataJam.forEach((v, i) => {
    const x = pad.l + slot * i + (slot - lebarBar) / 2;
    if (v > 0) {
      const tinggiBar = Math.max(2, (v / maks) * tinggi);
      const y = pad.t + tinggi - tinggiBar;
      ctx.fillStyle = i === hover ? '#0A4E5C' : '#0E7F97';
      bar(ctx, x, y, lebarBar, tinggiBar, 4);
    }
    if (i % 2 === 0) {
      ctx.fillStyle = i === hover ? '#0A4E5C' : 'rgb(10 78 92 / .5)';
      ctx.textAlign = 'center';
      ctx.fillText(String(i).padStart(2, '0'), pad.l + slot * i + slot / 2, h - pad.b / 2);
    }
  });

  if (hover >= 0 && dataJam[hover] > 0 && pad) {
    const teks = `${String(hover).padStart(2, '0')}:00 · ${formatRupiah(dataJam[hover])}`;
    ctx.font = '600 12px "Instrument Sans", system-ui, sans-serif';
    const tw = ctx.measureText(teks).width + 18;
    const cx = pad.l + slot * hover + slot / 2;
    const v = dataJam[hover];
    const yBar = pad.t + tinggi - Math.max(2, (v / maks) * tinggi);
    let tx = Math.min(Math.max(cx - tw / 2, pad.l), pad.l + lebar - tw);
    let ty = yBar - 30;
    if (ty < 2) ty = yBar + 8;
    ctx.fillStyle = '#0A4E5C';
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(tx, ty, tw, 22, 6);
      ctx.fill();
    } else {
      ctx.fillRect(tx, ty, tw, 22);
    }
    ctx.fillStyle = '#FAFAF9';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(teks, tx + tw / 2, ty + 11);
  }
}

function renderGrafik() {
  const adaData = dataJam.some(v => v > 0);
  elLaporan.grafik.hidden = !adaData;
  elLaporan.grafikEmpty.hidden = adaData;
  hover = -1;
  if (adaData) gambar();
}

function renderTop() {
  const map = new Map();
  state.transaksi.forEach(t => {
    t.items.forEach(i => {
      const cur = map.get(i.nama) || { qty: 0, omzet: 0 };
      cur.qty += i.qty;
      cur.omzet += i.qty * i.harga;
      map.set(i.nama, cur);
    });
  });
  const top = [...map.entries()].sort((a, b) => b[1].qty - a[1].qty || b[1].omzet - a[1].omzet).slice(0, 5);
  const maks = top.length ? top[0][1].qty : 1;

  elLaporan.topProduk.innerHTML = top.map(([nama, d], i) => `
    <li>
      <span class="rank">${i + 1}</span>
      <span class="top-nama">${escapeHtml(nama)}</span>
      <span class="top-angka">${d.qty} terjual · ${formatRupiah(d.omzet)}</span>
      <span class="bar"><i style="width:${Math.max(4, Math.round((d.qty / maks) * 100))}%"></i></span>
    </li>`).join('');

  const kosong = top.length === 0;
  elLaporan.topProduk.hidden = kosong;
  elLaporan.topEmpty.hidden = !kosong;
}

function renderLaporan() {
  const key = tanggalKey(Date.now());
  const hariIni = state.transaksi.filter(t => tanggalKey(t.waktu) === key);
  const omzet = hariIni.reduce((a, t) => a + t.total, 0);
  const jumlah = hariIni.length;
  const item = hariIni.reduce((a, t) => a + t.items.reduce((b, i) => b + i.qty, 0), 0);

  elLaporan.omzetHariIni.textContent = formatRupiah(omzet);
  elLaporan.jmlTransaksi.textContent = jumlah.toLocaleString('id-ID');
  elLaporan.rataTransaksi.textContent = formatRupiah(jumlah ? omzet / jumlah : 0);
  elLaporan.jmlItem.textContent = item.toLocaleString('id-ID');
  elLaporan.tagHari.textContent = tanggalPanjang(Date.now());
  elLaporan.lapSub.textContent = jumlah
    ? `${jumlah} transaksi hari ini · diperbarui ${formatJam(Date.now())}`
    : 'Belum ada transaksi hari ini.';

  dataJam = new Array(24).fill(0);
  hariIni.forEach(t => {
    const h = new Date(t.waktu).getHours();
    dataJam[h] += t.total;
  });

  renderGrafik();
  renderTop();
}

function initLaporan() {
  initElLaporan();

  elLaporan.grafik.addEventListener('mousemove', e => {
    if (!pad || !dataJam.some(v => v > 0)) return;
    const r = elLaporan.grafik.getBoundingClientRect();
    const x = e.clientX - r.left;
    const i = x < pad.l ? -1 : Math.min(23, Math.floor((x - pad.l) / slot));
    if (i !== hover) { hover = i; gambar(); }
  });

  elLaporan.grafik.addEventListener('mouseleave', () => {
    if (hover !== -1) { hover = -1; gambar(); }
  });

  window.addEventListener('resize', () => {
    if (state.tab === 'laporan' && !elLaporan.grafik.hidden) gambar();
  });
}
