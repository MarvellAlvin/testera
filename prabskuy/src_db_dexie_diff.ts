--- src/db/dexie.ts (原始)


+++ src/db/dexie.ts (修改后)
// IndexedDB database layer using Dexie.js
// Replaces localStorage for better performance and capacity

import Dexie, { type EntityTable } from 'dexie';

// ===== Types =====
export interface Account {
  id?: number;
  uid: string;
  name: string;
  icon: string;
  openingBalance: number;
  isSavings: boolean;
  currency: string;
  createdAt: string;
  sortOrder: number;
}

export interface Category {
  id?: number;
  uid: string;
  name: string;
  icon: string;
  type: 'expense' | 'income' | 'system';
  sortOrder: number;
}

export interface Transaction {
  id?: number;
  uid: string;
  type: 'income' | 'expense' | 'transfer';
  note: string;
  amount: number;
  date: string;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  tags?: string[];
  createdAt: string;
}

export interface Budget {
  id?: number;
  uid: string;
  categoryId: string;
  amount: number;
  startDay: number;
  alertPercent: number;
}

export interface Goal {
  id?: number;
  uid: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadlineMonths: number;
  icon: string;
  createdAt: string;
}

export interface GoalDeposit {
  id?: number;
  uid: string;
  goalId: string;
  amount: number;
  date: string;
}

export interface Recurring {
  id?: number;
  uid: string;
  type: 'income' | 'expense';
  note: string;
  amount: number;
  accountId: string;
  categoryId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextDue: string;
  autoPost: boolean;
  lastPosted?: string;
  createdAt: string;
}

export interface HabitLog {
  id?: number;
  uid: string;
  date: string;
  loggedAt: string;
}

export interface ChallengeState {
  id?: number;
  uid: string;
  activeChallengeId: string | null;
  status: 'IDLE' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  startedAt: string | null;
  endsAt: string | null;
  rejectionsLeft: number;
  xp: number;
  level: number;
  recentIds: string;
  nextPopupAt: string;
  completedChallenges: string;
}

export interface TxTemplate {
  id?: number;
  uid: string;
  name: string;
  type: 'income' | 'expense';
  note: string;
  amount: number;
  accountId: string;
  categoryId: string;
  icon: string;
}

export interface AppSettings {
  id?: number;
  uid: string;
  currency: string;
  language: 'id' | 'en';
  amoledMode: boolean;
  theme: 'dark' | 'light';
  accentColor: string;
  roundUpEnabled: boolean;
  roundUpAccountId: string;
  notificationsEnabled: boolean;
  firstRunDate: string;
  appInitialized: boolean;
}

// ===== Database Schema =====
class FinanceDB extends Dexie {
  accounts!: EntityTable<Account, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  transactions!: EntityTable<Transaction, 'id'>;
  budgets!: EntityTable<Budget, 'id'>;
  goals!: EntityTable<Goal, 'id'>;
  goalDeposits!: EntityTable<GoalDeposit, 'id'>;
  recurrings!: EntityTable<Recurring, 'id'>;
  habitLog!: EntityTable<HabitLog, 'id'>;
  challengeState!: EntityTable<ChallengeState, 'id'>;
  templates!: EntityTable<TxTemplate, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;

  constructor() {
    super('FinanceTrackerDB');

    this.version(1).stores({
      accounts: '++id, &uid, name, sortOrder',
      categories: '++id, &uid, type, sortOrder',
      transactions: '++id, &uid, type, date, accountId, toAccountId, categoryId, [date+uid], [type+date]',
      budgets: '++id, &uid, categoryId',
      goals: '++id, &uid, createdAt',
      goalDeposits: '++id, &uid, goalId, date',
      recurrings: '++id, &uid, nextDue, frequency',
      habitLog: '++id, &uid, date',
      challengeState: '++id, &uid',
      templates: '++id, &uid, name',
      settings: '++id, &uid',
    });
  }
}

export const db = new FinanceDB();

// ===== Default Categories =====
export const CATEGORY_DEFAULTS: Omit<Category, 'id'>[] = [
  { uid: 'cat_makan', name: 'Makanan & Minuman', icon: '🍔', type: 'expense', sortOrder: 1 },
  { uid: 'cat_transport', name: 'Transportasi', icon: '🚗', type: 'expense', sortOrder: 2 },
  { uid: 'cat_belanja', name: 'Belanja', icon: '🛍️', type: 'expense', sortOrder: 3 },
  { uid: 'cat_tagihan', name: 'Tagihan & Utilitas', icon: '💡', type: 'expense', sortOrder: 4 },
  { uid: 'cat_kesehatan', name: 'Kesehatan', icon: '💊', type: 'expense', sortOrder: 5 },
  { uid: 'cat_hiburan', name: 'Hiburan', icon: '🎬', type: 'expense', sortOrder: 6 },
  { uid: 'cat_pendidikan', name: 'Pendidikan', icon: '📚', type: 'expense', sortOrder: 7 },
  { uid: 'cat_rumah', name: 'Rumah Tangga', icon: '🏠', type: 'expense', sortOrder: 8 },
  { uid: 'cat_lainnya', name: 'Lainnya', icon: '📦', type: 'expense', sortOrder: 9 },
  { uid: 'cat_gaji', name: 'Gaji', icon: '💰', type: 'income', sortOrder: 1 },
  { uid: 'cat_bonus', name: 'Bonus', icon: '🎁', type: 'income', sortOrder: 2 },
  { uid: 'cat_investasi', name: 'Investasi', icon: '📈', type: 'income', sortOrder: 3 },
  { uid: 'cat_lainnya_in', name: 'Lainnya', icon: '💵', type: 'income', sortOrder: 4 },
  { uid: 'cat_tabungan', name: 'Tabungan', icon: '🏦', type: 'system', sortOrder: 1 },
];

// ===== Initialization =====
export async function initializeDatabase(): Promise<void> {
  const settings = await db.settings.toArray();

  if (settings.length === 0) {
    console.log('[SEED] source=first_run_categories_only');

    // Insert default categories
    await db.categories.bulkAdd(CATEGORY_DEFAULTS);

    // Create default settings
    await db.settings.add({
      uid: 'settings_main',
      currency: 'IDR',
      language: 'id',
      amoledMode: false,
      theme: 'dark',
      accentColor: '#22C55E',
      roundUpEnabled: false,
      roundUpAccountId: '',
      notificationsEnabled: true,
      firstRunDate: new Date().toISOString(),
      appInitialized: true,
    });

    // Create default challenge state
    await db.challengeState.add({
      uid: 'challenge_main',
      activeChallengeId: null,
      status: 'IDLE',
      startedAt: null,
      endsAt: null,
      rejectionsLeft: 3,
      xp: 0,
      level: 1,
      recentIds: '[]',
      nextPopupAt: new Date().toISOString().split('T')[0],
      completedChallenges: '[]',
    });
  }
}

// ===== Migration from localStorage =====
export async function migrateFromLocalStorage(): Promise<boolean> {
  const raw = localStorage.getItem('finance_tracker_db');
  if (!raw) return false;

  try {
    const oldDb = JSON.parse(raw);

    // Check if already migrated
    const existingAccounts = await db.accounts.count();
    if (existingAccounts > 0) return false;

    console.log('[MIGRATE] Migrating from localStorage to IndexedDB');

    // Migrate accounts
    if (oldDb.accounts?.length > 0) {
      await db.accounts.bulkAdd(oldDb.accounts.map((a: any, i: number) => ({
        uid: a.id,
        name: a.name,
        icon: a.icon,
        openingBalance: a.openingBalance,
        isSavings: a.isSavings || false,
        currency: 'IDR',
        createdAt: a.createdAt || new Date().toISOString(),
        sortOrder: i,
      })));
    }

    // Migrate transactions
    if (oldDb.transactions?.length > 0) {
      await db.transactions.bulkAdd(oldDb.transactions.map((t: any) => ({
        uid: t.id,
        type: t.type,
        note: t.note,
        amount: t.amount,
        date: t.date,
        accountId: t.accountId,
        toAccountId: t.toAccountId,
        categoryId: t.categoryId,
        createdAt: t.createdAt || new Date().toISOString(),
      })));
    }

    // Migrate budgets
    if (oldDb.budgets?.length > 0) {
      await db.budgets.bulkAdd(oldDb.budgets.map((b: any) => ({
        uid: b.id,
        categoryId: b.categoryId,
        amount: b.amount,
        startDay: b.startDay || 1,
        alertPercent: 80,
      })));
    }

    // Migrate goals
    if (oldDb.goals?.length > 0) {
      await db.goals.bulkAdd(oldDb.goals.map((g: any) => ({
        uid: g.id,
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount || 0,
        deadlineMonths: g.deadlineMonths || 12,
        icon: '🎯',
        createdAt: g.createdAt || new Date().toISOString(),
      })));
    }

    // Migrate goal deposits
    if (oldDb.goalDeposits?.length > 0) {
      await db.goalDeposits.bulkAdd(oldDb.goalDeposits.map((d: any) => ({
        uid: d.id,
        goalId: d.goalId,
        amount: d.amount,
        date: d.date,
      })));
    }

    // Migrate recurrings
    if (oldDb.recurrings?.length > 0) {
      await db.recurrings.bulkAdd(oldDb.recurrings.map((r: any) => ({
        uid: r.id,
        type: r.type,
        note: r.note,
        amount: r.amount,
        accountId: r.accountId,
        categoryId: r.categoryId,
        frequency: r.frequency,
        nextDue: r.nextDue,
        autoPost: r.autoPost || false,
        createdAt: new Date().toISOString(),
      })));
    }

    // Migrate habit log
    if (oldDb.habitLog?.length > 0) {
      await db.habitLog.bulkAdd(oldDb.habitLog.map((h: any) => ({
        uid: h.id,
        date: h.date,
        loggedAt: h.loggedAt,
      })));
    }

    // Migrate settings
    if (oldDb.settings) {
      await db.settings.where('uid').equals('settings_main').modify({
        currency: oldDb.settings.currency || 'IDR',
        language: oldDb.settings.language || 'id',
        amoledMode: oldDb.settings.amoledMode || false,
      });
    }

    // Migrate challenge state
    if (oldDb.challengeState) {
      await db.challengeState.where('uid').equals('challenge_main').modify({
        xp: oldDb.challengeState.xp || 0,
        rejectionsLeft: oldDb.challengeState.rejectionsLeft ?? 3,
        status: oldDb.challengeState.status || 'IDLE',
      });
    }

    console.log('[MIGRATE] Migration complete');
    return true;
  } catch (e) {
    console.error('[MIGRATE] Error:', e);
    return false;
  }
}

// ===== Dummy Data =====
export const DUMMY_ACCOUNTS: Omit<Account, 'id'>[] = [
  { uid: 'acc_cash', name: 'Cash', icon: '💵', openingBalance: 500000, isSavings: false, currency: 'IDR', createdAt: '2024-01-01', sortOrder: 0 },
  { uid: 'acc_bca', name: 'BCA', icon: '🏦', openingBalance: 5000000, isSavings: false, currency: 'IDR', createdAt: '2024-01-01', sortOrder: 1 },
  { uid: 'acc_gopay', name: 'GoPay', icon: '📱', openingBalance: 250000, isSavings: false, currency: 'IDR', createdAt: '2024-01-01', sortOrder: 2 },
  { uid: 'acc_tabungan', name: 'Tabungan', icon: '🏦', openingBalance: 10000000, isSavings: true, currency: 'IDR', createdAt: '2024-01-01', sortOrder: 3 },
];

function getDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export const DUMMY_TRANSACTIONS: Omit<Transaction, 'id'>[] = [
  { uid: 'tx_d1', type: 'expense', note: 'Makan siang padang', amount: 25000, date: getDateOffset(0), accountId: 'acc_gopay', categoryId: 'cat_makan', createdAt: getDateOffset(0) },
  { uid: 'tx_d2', type: 'expense', note: 'Grab ke kantor', amount: 15000, date: getDateOffset(0), accountId: 'acc_gopay', categoryId: 'cat_transport', createdAt: getDateOffset(0) },
  { uid: 'tx_d3', type: 'expense', note: 'Kopi starbucks', amount: 48000, date: getDateOffset(-1), accountId: 'acc_cash', categoryId: 'cat_makan', createdAt: getDateOffset(-1) },
  { uid: 'tx_d4', type: 'income', note: 'Gaji bulanan', amount: 8000000, date: getDateOffset(-5), accountId: 'acc_bca', categoryId: 'cat_gaji', createdAt: getDateOffset(-5) },
  { uid: 'tx_d5', type: 'expense', note: 'Listrik PLN', amount: 350000, date: getDateOffset(-3), accountId: 'acc_bca', categoryId: 'cat_tagihan', createdAt: getDateOffset(-3) },
  { uid: 'tx_d6', type: 'expense', note: 'Belanja bulanan', amount: 450000, date: getDateOffset(-2), accountId: 'acc_bca', categoryId: 'cat_belanja', createdAt: getDateOffset(-2) },
  { uid: 'tx_d7', type: 'expense', note: 'Nonton bioskop', amount: 75000, date: getDateOffset(-1), accountId: 'acc_cash', categoryId: 'cat_hiburan', createdAt: getDateOffset(-1) },
  { uid: 'tx_d8', type: 'transfer', note: 'Pindah ke tabungan', amount: 1000000, date: getDateOffset(-1), accountId: 'acc_bca', toAccountId: 'acc_tabungan', createdAt: getDateOffset(-1) },
  { uid: 'tx_d9', type: 'expense', note: 'Internet WiFi', amount: 400000, date: getDateOffset(-7), accountId: 'acc_bca', categoryId: 'cat_tagihan', createdAt: getDateOffset(-7) },
  { uid: 'tx_d10', type: 'expense', note: 'Bensin motor', amount: 50000, date: getDateOffset(-4), accountId: 'acc_cash', categoryId: 'cat_transport', createdAt: getDateOffset(-4) },
  { uid: 'tx_d11', type: 'income', note: 'Freelance project', amount: 2500000, date: getDateOffset(-10), accountId: 'acc_bca', categoryId: 'cat_bonus', createdAt: getDateOffset(-10) },
  { uid: 'tx_d12', type: 'expense', note: 'Obat flu', amount: 35000, date: getDateOffset(-6), accountId: 'acc_gopay', categoryId: 'cat_kesehatan', createdAt: getDateOffset(-6) },
];

export async function loadDummyData(): Promise<void> {
  console.log('[SEED] source=button');

  // Clear existing user data
  await db.accounts.clear();
  await db.transactions.clear();

  // Insert dummy data
  await db.accounts.bulkAdd(DUMMY_ACCOUNTS);
  await db.transactions.bulkAdd(DUMMY_TRANSACTIONS);
}

export async function resetAllData(): Promise<void> {
  console.log('[RESET] tables cleared, appInitialized=true retained');

  await db.accounts.clear();
  await db.transactions.clear();
  await db.budgets.clear();
  await db.goals.clear();
  await db.goalDeposits.clear();
  await db.recurrings.clear();
  await db.habitLog.clear();
  await db.templates.clear();

  // Reset challenge state
  await db.challengeState.where('uid').equals('challenge_main').modify({
    activeChallengeId: null,
    status: 'IDLE',
    startedAt: null,
    endsAt: null,
    rejectionsLeft: 3,
    xp: 0,
    level: 1,
    recentIds: '[]',
    nextPopupAt: new Date().toISOString().split('T')[0],
    completedChallenges: '[]',
  });

  // Reset settings to defaults (keep appInitialized)
  await db.settings.where('uid').equals('settings_main').modify({
    currency: 'IDR',
    language: 'id',
    amoledMode: false,
    theme: 'dark',
    accentColor: '#22C55E',
    roundUpEnabled: false,
    roundUpAccountId: '',
  });
}
