--- src/utils/export.ts (原始)


+++ src/utils/export.ts (修改后)
// Export & Sharing utilities - CSV, JSON, QR Code, Calendar Sync
import { db } from '../db/dexie';
import { formatCurrency } from './formatters';

// ===== CSV EXPORT =====
export async function exportInvestmentsToCSV(): Promise<string> {
  const investments = await db.investments.toArray();
  const transactions = await db.investmentTransactions.toArray();

  const BOM = '\uFEFF';
  const header = 'Tanggal;Jenis Investasi;Nama Aset;Jenis Transaksi;Jumlah;Harga;Total;Catatan\n';

  const rows = transactions.map(tx => {
    const asset = investments.find(i => i.uid === tx.assetUid);
    const type = asset?.type || 'lainnya';
    const txType = tx.type === 'buy' ? 'Beli' : tx.type === 'sell' ? 'Jual' : tx.type === 'dividend' ? 'Dividen' : tx.type === 'interest' ? 'Bunga' : 'Perpanjangan';

    return `${tx.date};${type};${asset?.name || '-'};${txType};${tx.quantity};${tx.pricePerUnit};${tx.totalAmount};"${tx.notes || ''}"`;
  }).join('\n');

  return BOM + header + rows;
}

export async function exportInvestmentsToJSON(): Promise<string> {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    investments: await db.investments.toArray(),
    transactions: await db.investmentTransactions.toArray(),
    journals: await db.investmentJournals.toArray(),
    achievements: await db.achievements.toArray(),
    streaks: await db.investmentStreaks.toArray(),
  };
  return JSON.stringify(data, null, 2);
}

export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ===== QR CODE GENERATION =====
export function generateQRCode( string): string {
  // Simple QR code using Google Charts API
  return `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(data)}`;
}

export async function generatePortfolioQR(): Promise<string> {
  const investments = await db.investments.toArray();
  const total = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const data = JSON.stringify({
    type: 'portfolio',
    total,
    assets: investments.length,
    date: new Date().toISOString(),
  });
  return generateQRCode(data);
}

// ===== CALENDAR SYNC =====
export async function exportToCalendar(): Promise<string> {
  const investments = await db.investments.toArray();
  const deposits = investments.filter(i => i.type === 'deposito' && i.maturityDate);

  let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Finance Tracker//ID\n';

  deposits.forEach(dep => {
    const startDate = dep.maturityDate!.replace(/-/g, '');
    ics += `BEGIN:VEVENT\n`;
    ics += `DTSTART;VALUE=DATE:${startDate}\n`;
    ics += `DTEND;VALUE=DATE:${startDate}\n`;
    ics += `SUMMARY:Deposito Jatuh Tempo - ${dep.name}\n`;
    ics += `DESCRIPTION:Bunga: ${dep.interestPercent || 0}%\\nDurasi: ${dep.depositDuration || 0} hari\\nAuto-renew: ${dep.autoRenew ? 'Ya' : 'Tidak'}\n`;
    ics += `END:VEVENT\n`;
  });

  ics += 'END:VCALENDAR';
  return ics;
}

// ===== DATA DELETION =====
export async function deleteAllInvestmentData(): Promise<void> {
  await db.investments.clear();
  await db.investmentTransactions.clear();
  await db.investmentJournals.clear();
  await db.investmentStreaks.clear();
  await db.achievements.clear();
}

export async function deleteAllData(): Promise<void> {
  await db.accounts.clear();
  await db.transactions.clear();
  await db.budgets.clear();
  await db.goals.clear();
  await db.goalDeposits.clear();
  await db.recurrings.clear();
  await db.habitLog.clear();
  await db.templates.clear();
  await db.customCategories.clear();
  await db.budgetWarnings.clear();
  await deleteAllInvestmentData();
}

// ===== PRIVACY MODE =====
export function maskValue(value: string): string {
  if (!value) return '';
  return value.replace(/[0-9]/g, '•');
}

export function maskCurrency(amount: number, currency: string = 'IDR'): string {
  const formatted = formatCurrency(amount, currency);
  return maskValue(formatted);
}
