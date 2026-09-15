--- src/db/seed.ts (原始)


+++ src/db/seed.ts (修改后)
// Default categories - the ONLY data inserted on first run
// This follows the spec: "CategoryDefaults = HANYA kategori referensi"
import { Category } from './types';

export const CATEGORY_DEFAULTS: Category[] = [
  // Expense categories
  { id: 'cat_makan', name: 'Makanan & Minuman', icon: '🍔', type: 'expense' },
  { id: 'cat_transport', name: 'Transportasi', icon: '🚗', type: 'expense' },
  { id: 'cat_belanja', name: 'Belanja', icon: '🛍️', type: 'expense' },
  { id: 'cat_tagihan', name: 'Tagihan & Utilitas', icon: '💡', type: 'expense' },
  { id: 'cat_kesehatan', name: 'Kesehatan', icon: '💊', type: 'expense' },
  { id: 'cat_hiburan', name: 'Hiburan', icon: '🎬', type: 'expense' },
  { id: 'cat_pendidikan', name: 'Pendidikan', icon: '📚', type: 'expense' },
  { id: 'cat_lainnya', name: 'Lainnya', icon: '📦', type: 'expense' },
  // Income categories
  { id: 'cat_gaji', name: 'Gaji', icon: '💰', type: 'income' },
  { id: 'cat_bonus', name: 'Bonus', icon: '🎁', type: 'income' },
  { id: 'cat_investasi', name: 'Investasi', icon: '📈', type: 'income' },
  { id: 'cat_lainnya_in', name: 'Lainnya', icon: '💵', type: 'income' },
  // System
  { id: 'cat_tabungan', name: 'Tabungan', icon: '🏦', type: 'system' },
];

// Dummy data - ONLY loaded via explicit user action (button)
// NEVER auto-seeded. Follows R11: "Database kosong adalah state yang valid"
export const DUMMY_ACCOUNTS = [
  { id: 'acc_cash', name: 'Cash', icon: '💵', openingBalance: 500000, isSavings: false, createdAt: '2024-01-01' },
  { id: 'acc_bca', name: 'BCA', icon: '🏦', openingBalance: 5000000, isSavings: false, createdAt: '2024-01-01' },
  { id: 'acc_gopay', name: 'GoPay', icon: '📱', openingBalance: 250000, isSavings: false, createdAt: '2024-01-01' },
];

export const DUMMY_TRANSACTIONS = [
  { id: 'tx_d1', type: 'expense' as const, note: 'Makan siang', amount: 25000, date: getToday(), accountId: 'acc_gopay', categoryId: 'cat_makan', createdAt: getToday() },
  { id: 'tx_d2', type: 'expense' as const, note: 'Grab ke kantor', amount: 15000, date: getToday(), accountId: 'acc_gopay', categoryId: 'cat_transport', createdAt: getToday() },
  { id: 'tx_d3', type: 'expense' as const, note: 'Beli kopi', amount: 28000, date: getToday(), accountId: 'acc_cash', categoryId: 'cat_makan', createdAt: getToday() },
  { id: 'tx_d4', type: 'income' as const, note: 'Gaji bulanan', amount: 8000000, date: getDateOffset(-5), accountId: 'acc_bca', categoryId: 'cat_gaji', createdAt: getDateOffset(-5) },
  { id: 'tx_d5', type: 'expense' as const, note: 'Listrik', amount: 350000, date: getDateOffset(-3), accountId: 'acc_bca', categoryId: 'cat_tagihan', createdAt: getDateOffset(-3) },
  { id: 'tx_d6', type: 'expense' as const, note: 'Belanja bulanan', amount: 450000, date: getDateOffset(-2), accountId: 'acc_bca', categoryId: 'cat_belanja', createdAt: getDateOffset(-2) },
  { id: 'tx_d7', type: 'expense' as const, note: 'Nonton bioskop', amount: 75000, date: getDateOffset(-1), accountId: 'acc_cash', categoryId: 'cat_hiburan', createdAt: getDateOffset(-1) },
  { id: 'tx_d8', type: 'transfer' as const, note: 'Pindah ke tabungan', amount: 1000000, date: getDateOffset(-1), accountId: 'acc_bca', toAccountId: 'acc_cash', createdAt: getDateOffset(-1) },
];

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
