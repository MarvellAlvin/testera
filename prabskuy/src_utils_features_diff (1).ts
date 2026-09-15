--- src/utils/features.ts (原始)
// Features utilities: CSV export/import, recurring engine, challenges, tips, undo

import { db, Transaction, Account, Category, Budget, Goal, GoalDeposit, Recurring, ChallengeState } from '../db/dexie';

// ===== CSV EXPORT =====
export function exportToCSV(transactions: Transaction[], accounts: Account[], categories: Category[]): string {
  const BOM = '\uFEFF';
  const header = 'Tanggal;Catatan;Jenis;Kategori;Akun;Nominal\n';

  const accMap = new Map(accounts.map(a => [a.uid, a.name]));
  const catMap = new Map(categories.map(c => [c.uid, c.name]));

  const rows = transactions.map(tx => {
    const date = tx.date;
    const note = `"${tx.note.replace(/"/g, '""')}"`;
    const type = tx.type === 'income' ? 'Pemasukan' : tx.type === 'expense' ? 'Pengeluaran' : 'Transfer';
    const category = tx.categoryId ? (catMap.get(tx.categoryId) || '-') : '-';
    const account = accMap.get(tx.accountId) || '-';
    const toAccount = tx.toAccountId ? ` → ${accMap.get(tx.toAccountId) || '-'}` : '';
    const amount = tx.amount;

    return `${date};${note};${type};${category};${account}${toAccount};${amount}`;
  }).join('\n');

  return BOM + header + rows;
}

export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ===== JSON BACKUP =====
export async function exportBackup(): Promise<string> {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    accounts: await db.accounts.toArray(),
    transactions: await db.transactions.toArray(),
    budgets: await db.budgets.toArray(),
    goals: await db.goals.toArray(),
    goalDeposits: await db.goalDeposits.toArray(),
    recurrings: await db.recurrings.toArray(),
    habitLog: await db.habitLog.toArray(),
    templates: await db.templates.toArray(),
    settings: await db.settings.toArray(),
    challengeState: await db.challengeState.toArray(),
  };
  return JSON.stringify(backup, null, 2);
}

export function downloadBackup(content: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString);

    await db.transaction('rw',
      [db.accounts, db.transactions, db.budgets, db.goals, db.goalDeposits, db.recurrings, db.habitLog, db.templates],
      async () => {
        if (data.accounts) { await db.accounts.clear(); await db.accounts.bulkAdd(data.accounts); }
        if (data.transactions) { await db.transactions.clear(); await db.transactions.bulkAdd(data.transactions); }
        if (data.budgets) { await db.budgets.clear(); await db.budgets.bulkAdd(data.budgets); }
        if (data.goals) { await db.goals.clear(); await db.goals.bulkAdd(data.goals); }
        if (data.goalDeposits) { await db.goalDeposits.clear(); await db.goalDeposits.bulkAdd(data.goalDeposits); }
        if (data.recurrings) { await db.recurrings.clear(); await db.recurrings.bulkAdd(data.recurrings); }
        if (data.habitLog) { await db.habitLog.clear(); await db.habitLog.bulkAdd(data.habitLog); }
        if (data.templates) { await db.templates.clear(); await db.templates.bulkAdd(data.templates); }
      }
    );

    return true;
  } catch (e) {
    console.error('[IMPORT] Error:', e);
    return false;
  }
}

// ===== RECURRING ENGINE =====
export async function processRecurring(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const recurrings = await db.recurrings.where('nextDue').belowOrEqual(today).toArray();
  let postedCount = 0;

  for (const rec of recurrings) {
    if (!rec.autoPost) continue;
    if (rec.lastPosted === today) continue; // Idempotent

    // Create transaction
    await db.transactions.add({
      uid: `rec-${rec.uid}-${rec.nextDue}`,
      type: rec.type,
      note: `[Auto] ${rec.note}`,
      amount: rec.amount,
      date: rec.nextDue,
      accountId: rec.accountId,
      categoryId: rec.categoryId,
      createdAt: new Date().toISOString(),
    });

    // Calculate next due date
    const nextDate = new Date(rec.nextDue + 'T00:00:00');
    switch (rec.frequency) {
      case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
      case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
      case 'monthly':
        // Anchor day: keep same day of month, clamp to month end
        const anchorDay = nextDate.getDate();
        nextDate.setMonth(nextDate.getMonth() + 1);
        const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
        nextDate.setDate(Math.min(anchorDay, lastDayOfMonth));
        break;
    }

    // Update recurring
    await db.recurrings.where('uid').equals(rec.uid).modify({
      nextDue: nextDate.toISOString().split('T')[0],
      lastPosted: today,
    });

    postedCount++;
  }

  if (postedCount > 0) {
    console.log(`[RECURRING] Posted ${postedCount} transactions`);
  }

  return postedCount;
}

// ===== CHALLENGE SYSTEM =====
export const CHALLENGES = [
  { id: 'ch-001', name: 'Hemat Jajan', description: 'Batasi jajan max Rp4.000/hari', tier: 1, xp: 25, type: 'DailyMax', param: 4000 },
  { id: 'ch-002', name: 'No Coffee', description: 'Tidak beli kopi 3 hari', tier: 1, xp: 25, type: 'NoSpend', param: 'cat_makan', days: 3 },
  { id: 'ch-003', name: 'Tabung Rp50rb', description: 'Tabung minimal Rp50.000 minggu ini', tier: 2, xp: 50, type: 'SaveMin', param: 50000 },
  { id: 'ch-004', name: 'Zero Spend Day', description: 'Satu hari tanpa pengeluaran', tier: 2, xp: 50, type: 'Zero', param: 1 },
  { id: 'ch-005', name: 'Kurangi 20%', description: 'Kurangi pengeluaran makan 20% dari rata-rata', tier: 3, xp: 75, type: 'ReducePercent', param: 20 },
  { id: 'ch-006', name: 'Akumulasi Rp500rb', description: 'Kumpulkan Rp500.000 dalam 2 minggu', tier: 3, xp: 75, type: 'Accumulate', param: 500000, days: 14 },
  { id: 'ch-007', name: 'Minggu Hemat', description: 'Total pengeluaran < Rp200rb/minggu', tier: 4, xp: 150, type: 'WeeklyMax', param: 200000 },
  { id: 'ch-008', name: 'Investor Muda', description: 'Transfer ke tabungan 5x bulan ini', tier: 4, xp: 150, type: 'CountMax', param: 5, category: 'cat_tabungan' },
];

export function getLevelFromXP(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function getXPForNextLevel(xp: number): { current: number; needed: number } {
  const level = getLevelFromXP(xp);
  const currentLevelXP = (level - 1) * 100;
  return { current: xp - currentLevelXP, needed: 100 };
}

export function getRandomChallenge(completedIds: string[]): typeof CHALLENGES[0] | null {
  const available = CHALLENGES.filter(c => !completedIds.includes(c.id));
  if (available.length === 0) return null;

  // Weighted random: tier 1=40%, tier 2=30%, tier 3=20%, tier 4=10%
  const weights: Record<number, number> = { 1: 40, 2: 30, 3: 20, 4: 10 };
  const totalWeight = available.reduce((sum, c) => sum + (weights[c.tier] || 10), 0);
  let random = Math.random() * totalWeight;

  for (const challenge of available) {
    random -= weights[challenge.tier] || 10;
    if (random <= 0) return challenge;
  }

  return available[0];
}

// ===== DAILY TIPS =====
export const DAILY_TIPS = [
  { icon: '💡', text: 'Catat setiap pengeluaran, sekecil apapun. Kebocoran kecil bisa jadi banjir.' },
  { icon: '🎯', text: 'Tetapkan target tabungan minimal 20% dari penghasilan.' },
  { icon: '📊', text: 'Review pengeluaran mingguan setiap hari Minggu malam.' },
  { icon: '🏦', text: 'Pisahkan rekening untuk kebutuhan dan keinginan.' },
  { icon: '⏰', text: 'Terapkan aturan 24 jam sebelum pembelian impulsif.' },
  { icon: '📱', text: 'Batasi langganan aplikasi yang jarang dipakai.' },
  { icon: '🍳', text: 'Masak sendiri bisa hemat 50-70% dibanding beli.' },
  { icon: '🚶', text: 'Untuk jarak < 2km, jalan kaki lebih sehat dan hemat.' },
  { icon: '💳', text: 'Hindari minimum payment kartu kredit. Bayar full setiap bulan.' },
  { icon: '📈', text: 'Mulai investasi dari yang kecil. Konsistensi > jumlah.' },
  { icon: '🎁', text: 'Budget untuk hiburan itu penting. Jangan pelit pada diri sendiri.' },
  { icon: '📝', text: 'Buat daftar belanja sebelum ke supermarket.' },
  { icon: '🏠', text: 'Biaya rumah idealnya < 30% dari penghasilan.' },
  { icon: '🚗', text: 'Gunakan transportasi umum untuk hemat dan ramah lingkungan.' },
  { icon: '💰', text: 'Dana darurat idealnya 3-6 bulan pengeluaran.' },
  { icon: '🔄', text: 'Automasi tabungan. Set auto-transfer setiap gajian.' },
  { icon: '📉', text: 'Cek langganan bulanan. Batalkan yang tidak dipakai.' },
  { icon: '🎓', text: 'Investasi pada diri sendiri (buku, kursus) selalu worth it.' },
  { icon: '🤝', text: 'Diskusikan keuangan dengan pasangan secara rutin.' },
  { icon: '📅', text: 'Set budget bulanan di awal bulan, bukan akhir.' },
  { icon: '🛡️', text: 'Asuransi itu penting. Jangan tunggu sampai sakit.' },
  { icon: '🎪', text: 'Cari hiburan gratis: taman, museum, event komunitas.' },
  { icon: '💡', text: 'Matikan lampu dan cabut charger yang tidak dipakai.' },
  { icon: '📦', text: 'Beli dalam jumlah besar untuk barang yang sering dipakai.' },
  { icon: '🏃', text: 'Olahraga di rumah = hemat gym + sehat.' },
  { icon: '☕', text: 'Bawa tumblr sendiri. Hemat 15rb/hari = 450rb/bulan.' },
  { icon: '📲', text: 'Gunakan cashback dan promo yang memang sudah rencanakan beli.' },
  { icon: '🎯', text: 'Visualisasikan tujuan finansialmu. Tempel di tempat terlihat.' },
  { icon: '🧮', text: 'Hitung biaya per penggunaan. Mahal tapi sering dipakai = murah.' },
  { icon: '🌟', text: 'Rayakan pencapaian kecil. Progress > perfection.' },
  { icon: '💎', text: 'Kualitas > kuantitas. Beli sekali yang bagus, lebih hemat.' },
];

export function getDailyTip(): { icon: string; text: string } {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}

// ===== UNDO SYSTEM =====
export interface UndoAction {
  id: string;
  type: 'delete_transaction' | 'delete_account' | 'delete_budget' | 'delete_goal';
   any;
  timestamp: number;
  label: string;
}

const undoStack: UndoAction[] = [];
const MAX_UNDO = 10;
const UNDO_TIMEOUT = 5000; // 5 seconds

export function pushUndo(action: UndoAction): void {
  undoStack.push(action);
  if (undoStack.length > MAX_UNDO) undoStack.shift();
}

export function popUndo(): UndoAction | undefined {
  const now = Date.now();
  // Remove expired actions
  while (undoStack.length > 0 && now - undoStack[0].timestamp > UNDO_TIMEOUT) {
    undoStack.shift();
  }
  return undoStack.pop();
}

export function getLatestUndo(): UndoAction | undefined {
  const now = Date.now();
  while (undoStack.length > 0 && now - undoStack[0].timestamp > UNDO_TIMEOUT) {
    undoStack.shift();
  }
  return undoStack.length > 0 ? undoStack[undoStack.length - 1] : undefined;
}

export async function executeUndo(): Promise<boolean> {
  const action = popUndo();
  if (!action) return false;

  try {
    switch (action.type) {
      case 'delete_transaction':
        await db.transactions.add(action.data);
        break;
      case 'delete_account':
        await db.accounts.add(action.data);
        break;
      case 'delete_budget':
        await db.budgets.add(action.data);
        break;
      case 'delete_goal':
        await db.goals.add(action.data);
        break;
    }
    return true;
  } catch (e) {
    console.error('[UNDO] Error:', e);
    return false;
  }
}

// ===== ROUND-UP FEATURE =====
export function calculateRoundUp(amount: number): number {
  const rounded = Math.ceil(amount / 1000) * 1000;
  return rounded - amount;
}

// ===== WEEKEND vs WEEKDAY ANALYSIS =====
export interface DayAnalysis {
  weekdayAvg: number;
  weekendAvg: number;
  weekdayCount: number;
  weekendCount: number;
  weekdayTotal: number;
  weekendTotal: number;
}

export function analyzeByDayType(transactions: Transaction[]): DayAnalysis {
  const expenses = transactions.filter(t => t.type === 'expense');

  let weekdayTotal = 0, weekendTotal = 0;
  let weekdayCount = 0, weekendCount = 0;
  const weekdayDates = new Set<string>();
  const weekendDates = new Set<string>();

  expenses.forEach(tx => {
    const date = new Date(tx.date + 'T00:00:00');
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      weekendTotal += tx.amount;
      weekendDates.add(tx.date);
    } else {
      weekdayTotal += tx.amount;
      weekdayDates.add(tx.date);
    }
  });

  weekdayCount = weekdayDates.size || 1;
  weekendCount = weekendDates.size || 1;

  return {
    weekdayAvg: weekdayTotal / weekdayCount,
    weekendAvg: weekendTotal / weekendCount,
    weekdayCount: weekdayDates.size,
    weekendCount: weekendDates.size,
    weekdayTotal,
    weekendTotal,
  };
}

// ===== MULTI-CURRENCY =====
export const CURRENCIES = [
  { code: 'IDR', symbol: 'Rp', name: 'Rupiah Indonesia', decimals: 0 },
  { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2 },
  { code: 'MYR', symbol: 'RM', name: 'Ringgit Malaysia', decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0 },
];

// Simple exchange rates (approximate, for demo)
export const EXCHANGE_RATES: Record<string, number> = {
  IDR: 1,
  USD: 0.000064,
  EUR: 0.000059,
  SGD: 0.000086,
  MYR: 0.00029,
  JPY: 0.0096,
};


+++ src/utils/features.ts (修改后)
// Features utilities: CSV export/import, recurring engine, challenges, tips, undo

import { db, Transaction, Account, Category, Budget, Goal, GoalDeposit, Recurring, ChallengeState } from '../db/dexie';

// ===== CSV EXPORT =====
export function exportToCSV(transactions: Transaction[], accounts: Account[], categories: Category[]): string {
  const BOM = '\uFEFF';
  const header = 'Tanggal;Catatan;Jenis;Kategori;Akun;Nominal\n';

  const accMap = new Map(accounts.map(a => [a.uid, a.name]));
  const catMap = new Map(categories.map(c => [c.uid, c.name]));

  const rows = transactions.map(tx => {
    const date = tx.date;
    const note = `"${tx.note.replace(/"/g, '""')}"`;
    const type = tx.type === 'income' ? 'Pemasukan' : tx.type === 'expense' ? 'Pengeluaran' : 'Transfer';
    const category = tx.categoryId ? (catMap.get(tx.categoryId) || '-') : '-';
    const account = accMap.get(tx.accountId) || '-';
    const toAccount = tx.toAccountId ? ` → ${accMap.get(tx.toAccountId) || '-'}` : '';
    const amount = tx.amount;

    return `${date};${note};${type};${category};${account}${toAccount};${amount}`;
  }).join('\n');

  return BOM + header + rows;
}

export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ===== JSON BACKUP =====
export async function exportBackup(): Promise<string> {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    accounts: await db.accounts.toArray(),
    transactions: await db.transactions.toArray(),
    budgets: await db.budgets.toArray(),
    goals: await db.goals.toArray(),
    goalDeposits: await db.goalDeposits.toArray(),
    recurrings: await db.recurrings.toArray(),
    habitLog: await db.habitLog.toArray(),
    templates: await db.templates.toArray(),
    settings: await db.settings.toArray(),
    challengeState: await db.challengeState.toArray(),
  };
  return JSON.stringify(backup, null, 2);
}

export function downloadBackup(content: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString);

    await db.transaction('rw',
      [db.accounts, db.transactions, db.budgets, db.goals, db.goalDeposits, db.recurrings, db.habitLog, db.templates],
      async () => {
        if (data.accounts) { await db.accounts.clear(); await db.accounts.bulkAdd(data.accounts); }
        if (data.transactions) { await db.transactions.clear(); await db.transactions.bulkAdd(data.transactions); }
        if (data.budgets) { await db.budgets.clear(); await db.budgets.bulkAdd(data.budgets); }
        if (data.goals) { await db.goals.clear(); await db.goals.bulkAdd(data.goals); }
        if (data.goalDeposits) { await db.goalDeposits.clear(); await db.goalDeposits.bulkAdd(data.goalDeposits); }
        if (data.recurrings) { await db.recurrings.clear(); await db.recurrings.bulkAdd(data.recurrings); }
        if (data.habitLog) { await db.habitLog.clear(); await db.habitLog.bulkAdd(data.habitLog); }
        if (data.templates) { await db.templates.clear(); await db.templates.bulkAdd(data.templates); }
      }
    );

    return true;
  } catch (e) {
    console.error('[IMPORT] Error:', e);
    return false;
  }
}

// ===== DEPOSITO AUTO-RENEW ENGINE =====
export async function processDepositRenewals(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const investments = await db.investments.where('type').equals('deposito').toArray();
  let renewedCount = 0;

  for (const inv of investments) {
    if (!inv.autoRenew || !inv.maturityDate) continue;
    if (inv.maturityDate > today) continue; // Not yet matured

    // Calculate interest earned
    const principal = inv.currentValue;
    const interestRate = inv.interestPercent || 0;
    const duration = inv.depositDuration || 0;
    const interest = (principal * interestRate * duration) / (100 * 365);

    // Create interest transaction
    await db.investmentTransactions.add({
      uid: `invtx-interest-${inv.uid}-${today}`,
      assetUid: inv.uid,
      type: 'interest',
      quantity: 0,
      pricePerUnit: 0,
      totalAmount: interest,
      date: today,
      notes: `Bunga deposito ${interestRate}%`,
      createdAt: new Date().toISOString(),
    });

    // Create renewal transaction
    await db.investmentTransactions.add({
      uid: `invtx-renew-${inv.uid}-${today}`,
      assetUid: inv.uid,
      type: 'renew',
      quantity: 0,
      pricePerUnit: 0,
      totalAmount: principal + interest,
      date: today,
      notes: `Perpanjangan otomatis deposito`,
      createdAt: new Date().toISOString(),
    });

    // Update investment with new maturity date
    const newMaturity = new Date(today + 'T00:00:00');
    newMaturity.setDate(newMaturity.getDate() + duration);

    await db.investments.where('uid').equals(inv.uid).modify({
      currentValue: principal + interest,
      purchaseDate: today,
      maturityDate: newMaturity.toISOString().split('T')[0],
    });

    renewedCount++;
  }

  if (renewedCount > 0) {
    console.log(`[DEPOSITO] Renewed ${renewedCount} deposits`);
  }

  return renewedCount;
}

// ===== RECURRING ENGINE =====
export async function processRecurring(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const recurrings = await db.recurrings.where('nextDue').belowOrEqual(today).toArray();
  let postedCount = 0;

  for (const rec of recurrings) {
    if (!rec.autoPost) continue;
    if (rec.lastPosted === today) continue; // Idempotent

    // Create transaction
    await db.transactions.add({
      uid: `rec-${rec.uid}-${rec.nextDue}`,
      type: rec.type,
      note: `[Auto] ${rec.note}`,
      amount: rec.amount,
      date: rec.nextDue,
      accountId: rec.accountId,
      categoryId: rec.categoryId,
      createdAt: new Date().toISOString(),
    });

    // Calculate next due date
    const nextDate = new Date(rec.nextDue + 'T00:00:00');
    switch (rec.frequency) {
      case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
      case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
      case 'monthly':
        // Anchor day: keep same day of month, clamp to month end
        const anchorDay = nextDate.getDate();
        nextDate.setMonth(nextDate.getMonth() + 1);
        const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
        nextDate.setDate(Math.min(anchorDay, lastDayOfMonth));
        break;
      case 'yearly':
        // Keep same month and day, handle leap year (Feb 29 -> Feb 28)
        const origMonth = nextDate.getMonth();
        const origDay = nextDate.getDate();
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        // If we rolled over to next month (e.g., Feb 29 -> Mar 1), clamp to last day of Feb
        if (nextDate.getMonth() !== origMonth) {
          nextDate.setMonth(origMonth + 1, 0); // Last day of original month
        }
        break;
    }

    // Update recurring
    await db.recurrings.where('uid').equals(rec.uid).modify({
      nextDue: nextDate.toISOString().split('T')[0],
      lastPosted: today,
    });

    postedCount++;
  }

  if (postedCount > 0) {
    console.log(`[RECURRING] Posted ${postedCount} transactions`);
  }

  return postedCount;
}

// ===== CHALLENGE SYSTEM =====
export const CHALLENGES = [
  { id: 'ch-001', name: 'Hemat Jajan', description: 'Batasi jajan max Rp4.000/hari', tier: 1, xp: 25, type: 'DailyMax', param: 4000 },
  { id: 'ch-002', name: 'No Coffee', description: 'Tidak beli kopi 3 hari', tier: 1, xp: 25, type: 'NoSpend', param: 'cat_makan', days: 3 },
  { id: 'ch-003', name: 'Tabung Rp50rb', description: 'Tabung minimal Rp50.000 minggu ini', tier: 2, xp: 50, type: 'SaveMin', param: 50000 },
  { id: 'ch-004', name: 'Zero Spend Day', description: 'Satu hari tanpa pengeluaran', tier: 2, xp: 50, type: 'Zero', param: 1 },
  { id: 'ch-005', name: 'Kurangi 20%', description: 'Kurangi pengeluaran makan 20% dari rata-rata', tier: 3, xp: 75, type: 'ReducePercent', param: 20 },
  { id: 'ch-006', name: 'Akumulasi Rp500rb', description: 'Kumpulkan Rp500.000 dalam 2 minggu', tier: 3, xp: 75, type: 'Accumulate', param: 500000, days: 14 },
  { id: 'ch-007', name: 'Minggu Hemat', description: 'Total pengeluaran < Rp200rb/minggu', tier: 4, xp: 150, type: 'WeeklyMax', param: 200000 },
  { id: 'ch-008', name: 'Investor Muda', description: 'Transfer ke tabungan 5x bulan ini', tier: 4, xp: 150, type: 'CountMax', param: 5, category: 'cat_tabungan' },
];

export function getLevelFromXP(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function getXPForNextLevel(xp: number): { current: number; needed: number } {
  const level = getLevelFromXP(xp);
  const currentLevelXP = (level - 1) * 100;
  return { current: xp - currentLevelXP, needed: 100 };
}

export function getRandomChallenge(completedIds: string[]): typeof CHALLENGES[0] | null {
  const available = CHALLENGES.filter(c => !completedIds.includes(c.id));
  if (available.length === 0) return null;

  // Weighted random: tier 1=40%, tier 2=30%, tier 3=20%, tier 4=10%
  const weights: Record<number, number> = { 1: 40, 2: 30, 3: 20, 4: 10 };
  const totalWeight = available.reduce((sum, c) => sum + (weights[c.tier] || 10), 0);
  let random = Math.random() * totalWeight;

  for (const challenge of available) {
    random -= weights[challenge.tier] || 10;
    if (random <= 0) return challenge;
  }

  return available[0];
}

// ===== DAILY TIPS =====
export const DAILY_TIPS = [
  { icon: '💡', text: 'Catat setiap pengeluaran, sekecil apapun. Kebocoran kecil bisa jadi banjir.' },
  { icon: '🎯', text: 'Tetapkan target tabungan minimal 20% dari penghasilan.' },
  { icon: '📊', text: 'Review pengeluaran mingguan setiap hari Minggu malam.' },
  { icon: '🏦', text: 'Pisahkan rekening untuk kebutuhan dan keinginan.' },
  { icon: '⏰', text: 'Terapkan aturan 24 jam sebelum pembelian impulsif.' },
  { icon: '📱', text: 'Batasi langganan aplikasi yang jarang dipakai.' },
  { icon: '🍳', text: 'Masak sendiri bisa hemat 50-70% dibanding beli.' },
  { icon: '🚶', text: 'Untuk jarak < 2km, jalan kaki lebih sehat dan hemat.' },
  { icon: '💳', text: 'Hindari minimum payment kartu kredit. Bayar full setiap bulan.' },
  { icon: '📈', text: 'Mulai investasi dari yang kecil. Konsistensi > jumlah.' },
  { icon: '🎁', text: 'Budget untuk hiburan itu penting. Jangan pelit pada diri sendiri.' },
  { icon: '📝', text: 'Buat daftar belanja sebelum ke supermarket.' },
  { icon: '🏠', text: 'Biaya rumah idealnya < 30% dari penghasilan.' },
  { icon: '🚗', text: 'Gunakan transportasi umum untuk hemat dan ramah lingkungan.' },
  { icon: '💰', text: 'Dana darurat idealnya 3-6 bulan pengeluaran.' },
  { icon: '🔄', text: 'Automasi tabungan. Set auto-transfer setiap gajian.' },
  { icon: '📉', text: 'Cek langganan bulanan. Batalkan yang tidak dipakai.' },
  { icon: '🎓', text: 'Investasi pada diri sendiri (buku, kursus) selalu worth it.' },
  { icon: '🤝', text: 'Diskusikan keuangan dengan pasangan secara rutin.' },
  { icon: '📅', text: 'Set budget bulanan di awal bulan, bukan akhir.' },
  { icon: '🛡️', text: 'Asuransi itu penting. Jangan tunggu sampai sakit.' },
  { icon: '🎪', text: 'Cari hiburan gratis: taman, museum, event komunitas.' },
  { icon: '💡', text: 'Matikan lampu dan cabut charger yang tidak dipakai.' },
  { icon: '📦', text: 'Beli dalam jumlah besar untuk barang yang sering dipakai.' },
  { icon: '🏃', text: 'Olahraga di rumah = hemat gym + sehat.' },
  { icon: '☕', text: 'Bawa tumblr sendiri. Hemat 15rb/hari = 450rb/bulan.' },
  { icon: '📲', text: 'Gunakan cashback dan promo yang memang sudah rencanakan beli.' },
  { icon: '🎯', text: 'Visualisasikan tujuan finansialmu. Tempel di tempat terlihat.' },
  { icon: '🧮', text: 'Hitung biaya per penggunaan. Mahal tapi sering dipakai = murah.' },
  { icon: '🌟', text: 'Rayakan pencapaian kecil. Progress > perfection.' },
  { icon: '💎', text: 'Kualitas > kuantitas. Beli sekali yang bagus, lebih hemat.' },
];

export function getDailyTip(): { icon: string; text: string } {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}

// ===== UNDO SYSTEM =====
export interface UndoAction {
  id: string;
  type: 'delete_transaction' | 'delete_account' | 'delete_budget' | 'delete_goal';
   any;
  timestamp: number;
  label: string;
}

const undoStack: UndoAction[] = [];
const MAX_UNDO = 10;
const UNDO_TIMEOUT = 5000; // 5 seconds

export function pushUndo(action: UndoAction): void {
  undoStack.push(action);
  if (undoStack.length > MAX_UNDO) undoStack.shift();
}

export function popUndo(): UndoAction | undefined {
  const now = Date.now();
  // Remove expired actions
  while (undoStack.length > 0 && now - undoStack[0].timestamp > UNDO_TIMEOUT) {
    undoStack.shift();
  }
  return undoStack.pop();
}

export function getLatestUndo(): UndoAction | undefined {
  const now = Date.now();
  while (undoStack.length > 0 && now - undoStack[0].timestamp > UNDO_TIMEOUT) {
    undoStack.shift();
  }
  return undoStack.length > 0 ? undoStack[undoStack.length - 1] : undefined;
}

export async function executeUndo(): Promise<boolean> {
  const action = popUndo();
  if (!action) return false;

  try {
    switch (action.type) {
      case 'delete_transaction':
        await db.transactions.add(action.data);
        break;
      case 'delete_account':
        await db.accounts.add(action.data);
        break;
      case 'delete_budget':
        await db.budgets.add(action.data);
        break;
      case 'delete_goal':
        await db.goals.add(action.data);
        break;
    }
    return true;
  } catch (e) {
    console.error('[UNDO] Error:', e);
    return false;
  }
}

// ===== ROUND-UP FEATURE =====
export function calculateRoundUp(amount: number): number {
  const rounded = Math.ceil(amount / 1000) * 1000;
  return rounded - amount;
}

// ===== WEEKEND vs WEEKDAY ANALYSIS =====
export interface DayAnalysis {
  weekdayAvg: number;
  weekendAvg: number;
  weekdayCount: number;
  weekendCount: number;
  weekdayTotal: number;
  weekendTotal: number;
}

export function analyzeByDayType(transactions: Transaction[]): DayAnalysis {
  const expenses = transactions.filter(t => t.type === 'expense');

  let weekdayTotal = 0, weekendTotal = 0;
  let weekdayCount = 0, weekendCount = 0;
  const weekdayDates = new Set<string>();
  const weekendDates = new Set<string>();

  expenses.forEach(tx => {
    const date = new Date(tx.date + 'T00:00:00');
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      weekendTotal += tx.amount;
      weekendDates.add(tx.date);
    } else {
      weekdayTotal += tx.amount;
      weekdayDates.add(tx.date);
    }
  });

  weekdayCount = weekdayDates.size || 1;
  weekendCount = weekendDates.size || 1;

  return {
    weekdayAvg: weekdayTotal / weekdayCount,
    weekendAvg: weekendTotal / weekendCount,
    weekdayCount: weekdayDates.size,
    weekendCount: weekendDates.size,
    weekdayTotal,
    weekendTotal,
  };
}

// ===== MULTI-CURRENCY =====
export const CURRENCIES = [
  { code: 'IDR', symbol: 'Rp', name: 'Rupiah Indonesia', decimals: 0 },
  { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2 },
  { code: 'MYR', symbol: 'RM', name: 'Ringgit Malaysia', decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0 },
];

// Simple exchange rates (approximate, for demo)
export const EXCHANGE_RATES: Record<string, number> = {
  IDR: 1,
  USD: 0.000064,
  EUR: 0.000059,
  SGD: 0.000086,
  MYR: 0.00029,
  JPY: 0.0096,
};
