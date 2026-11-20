const TOKO = {
  nama: 'Philokophi Street',
  alamat: 'Depan Kampus 2 UIN Walisongo, Semarang',
};

const KATEGORI = ['Espresso Based', 'Philokophi Susu', 'Filter Coffee', 'Cold Brewed', 'Non Coffee'];

const METODE = { tunai: 'Tunai', qris: 'QRIS', debit: 'Debit' };

const SEED_PRODUCTS = [
  // Espresso Based
  { id: 'p01', nama: 'Longblack (Clasik Beans)', kategori: 'Espresso Based', beli: 10000, jual: 20000, stok: 25 },
  { id: 'p02', nama: 'Longblack (Eksperien Beans)', kategori: 'Espresso Based', beli: 12000, jual: 23000, stok: 25 },
  { id: 'p03', nama: 'On the Rock (Clasik Beans)', kategori: 'Espresso Based', beli: 9000, jual: 18000, stok: 20 },
  { id: 'p04', nama: 'On the Rock (Eksperien Beans)', kategori: 'Espresso Based', beli: 10000, jual: 20000, stok: 20 },
  { id: 'p05', nama: 'Coffee Latte (Clasik Beans)', kategori: 'Espresso Based', beli: 11000, jual: 21000, stok: 25, featured: true },
  { id: 'p06', nama: 'Coffee Latte (Eksperien Beans)', kategori: 'Espresso Based', beli: 12000, jual: 23000, stok: 25 },
  { id: 'p07', nama: 'Split Coffee (Clasik Beans)', kategori: 'Espresso Based', beli: 12000, jual: 24000, stok: 20 },
  { id: 'p08', nama: 'Split Coffee (Eksperien Beans)', kategori: 'Espresso Based', beli: 13000, jual: 26000, stok: 20 },

  // Philokophi Susu
  { id: 'p09', nama: 'Philo Aren', kategori: 'Philokophi Susu', beli: 10000, jual: 19000, stok: 30, featured: true },
  { id: 'p10', nama: 'Philo Banakis', kategori: 'Philokophi Susu', beli: 11000, jual: 20000, stok: 25 },
  { id: 'p11', nama: 'Philo Milkway', kategori: 'Philokophi Susu', beli: 9500, jual: 18000, stok: 25 },
  { id: 'p12', nama: 'Philo Butterscoth', kategori: 'Philokophi Susu', beli: 9500, jual: 18000, stok: 25 },

  // Filter Coffee (Line Up Tier 1, Tier 2, Tier 3)
  { id: 'p13', nama: 'Filter Coffee Tier 1', kategori: 'Filter Coffee', beli: 12000, jual: 23000, stok: 25, featured: true },
  { id: 'p14', nama: 'Filter Coffee Tier 2', kategori: 'Filter Coffee', beli: 13000, jual: 26000, stok: 25 },
  { id: 'p15', nama: 'Filter Coffee Tier 3', kategori: 'Filter Coffee', beli: 15000, jual: 29000, stok: 25 },

  // Cold Brewed Based
  { id: 'p16', nama: 'Mont Blanc', kategori: 'Cold Brewed', beli: 12000, jual: 24000, stok: 20 },

  // Non Coffee
  { id: 'p17', nama: 'Matcha Latte', kategori: 'Non Coffee', beli: 9500, jual: 18000, stok: 25 },
  { id: 'p18', nama: 'Choklatte', kategori: 'Non Coffee', beli: 9500, jual: 18000, stok: 25 },
];
