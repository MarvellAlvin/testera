--- src/db/database.ts (原始)
// Database layer - localStorage persistence simulating Room
// KEY RULE: No auto-seeding. Empty database is valid state. (R11)
// appInitialized flag prevents re-seed after reset (R12)

import { Database, Transaction, Account, Budget, Goal, GoalDeposit, Recurring, ChatMessage, HabitLog, ChallengeState, AppSettings } from './types';
import { CATEGORY_DEFAULTS, DUMMY_ACCOUNTS, DUMMY_TRANSACTIONS } from './seed';

const DB_KEY = 'finance_tracker_db';

function getDefaultChallengeState(): ChallengeState {
  return {
    activeChallengeId: null,
    status: 'IDLE',
    startedAt: null,
    endsAt: null,
    rejectionsLeft: 3,
    xp: 0,
    recentIds: [],
    nextPopupAt: new Date().toISOString().split('T')[0],
  };
}

function getDefaultSettings(): AppSettings {
  return { currency: 'IDR', language: 'id', amoledMode: false };
}

function createEmptyDatabase(): Database {
  return {
    accounts: [],
    categories: [...CATEGORY_DEFAULTS], // Only categories on first run
    transactions: [],
    budgets: [],
    goals: [],
    goalDeposits: [],
    recurrings: [],
    chatMessages: [],
    habitLog: [],
    challengeState: getDefaultChallengeState(),
    settings: getDefaultSettings(),
    appInitialized: true, // R12: once true, never back to false
  };
}

// Load database from localStorage
export function loadDatabase(): Database {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      // First run - create empty database with only categories
      console.log('[SEED] source=first_run_categories_only');
      const db = createEmptyDatabase();
      saveDatabase(db);
      return db;
    }
    return JSON.parse(raw) as Database;
  } catch {
    console.log('[SEED] source=first_run_categories_only (recovery)');
    const db = createEmptyDatabase();
    saveDatabase(db);
    return db;
  }
}

// Save database to localStorage
export function saveDatabase(db: Database): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// Reset all data - atomic operation
// Follows spec: clear all user data, re-insert categories, keep appInitialized=true
export function resetDatabase(): Database {
  console.log('[RESET] tables cleared, appInitialized=true retained');
  const db: Database = {
    accounts: [],
    categories: [...CATEGORY_DEFAULTS],
    transactions: [],
    budgets: [],
    goals: [],
    goalDeposits: [],
    recurrings: [],
    chatMessages: [],
    habitLog: [],
    challengeState: getDefaultChallengeState(),
    settings: getDefaultSettings(),
    appInitialized: true, // R12: NEVER reset to false
  };
  saveDatabase(db);
  return db;
}

// Load dummy data - ONLY via explicit user action (button)
// NEVER auto-called. Follows R-D2.
export function loadDummyData(): Database {
  console.log('[SEED] source=button');
  const db = loadDatabase();
  db.accounts = [...DUMMY_ACCOUNTS];
  db.transactions = [...DUMMY_TRANSACTIONS];
  saveDatabase(db);
  return db;
}

// ===== CRUD Operations =====

export function addTransaction(db: Database, tx: Omit<Transaction, 'id' | 'createdAt'>): Database {
  const newTx: Transaction = {
    ...tx,
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  db.transactions = [newTx, ...db.transactions];
  saveDatabase(db);
  return db;
}

export function updateTransaction(db: Database, id: string, updates: Partial<Transaction>): Database {
  db.transactions = db.transactions.map(tx => tx.id === id ? { ...tx, ...updates } : tx);
  saveDatabase(db);
  return db;
}

export function deleteTransaction(db: Database, id: string): Database {
  db.transactions = db.transactions.filter(tx => tx.id !== id);
  saveDatabase(db);
  return db;
}

export function deleteTransactions(db: Database, ids: string[]): Database {
  db.transactions = db.transactions.filter(tx => !ids.includes(tx.id));
  saveDatabase(db);
  return db;
}

export function addAccount(db: Database, account: Omit<Account, 'id' | 'createdAt'>): Database {
  const newAccount: Account = {
    ...account,
    id: `acc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  db.accounts = [...db.accounts, newAccount];
  saveDatabase(db);
  return db;
}

export function updateAccount(db: Database, id: string, updates: Partial<Account>): Database {
  db.accounts = db.accounts.map(a => a.id === id ? { ...a, ...updates } : a);
  saveDatabase(db);
  return db;
}

export function deleteAccount(db: Database, id: string): Database {
  db.accounts = db.accounts.filter(a => a.id !== id);
  // Also delete related transactions
  db.transactions = db.transactions.filter(tx => tx.accountId !== id && tx.toAccountId !== id);
  saveDatabase(db);
  return db;
}

export function addBudget(db: Database, budget: Omit<Budget, 'id'>): Database {
  const newBudget: Budget = {
    ...budget,
    id: `bud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  db.budgets = [...db.budgets, newBudget];
  saveDatabase(db);
  return db;
}

export function deleteBudget(db: Database, id: string): Database {
  db.budgets = db.budgets.filter(b => b.id !== id);
  saveDatabase(db);
  return db;
}

export function addGoal(db: Database, goal: Omit<Goal, 'id' | 'createdAt'>): Database {
  const newGoal: Goal = {
    ...goal,
    id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  db.goals = [...db.goals, newGoal];
  saveDatabase(db);
  return db;
}

export function deleteGoal(db: Database, id: string): Database {
  db.goals = db.goals.filter(g => g.id !== id);
  db.goalDeposits = db.goalDeposits.filter(d => d.goalId !== id);
  saveDatabase(db);
  return db;
}

export function addGoalDeposit(db: Database, deposit: Omit<GoalDeposit, 'id'>): Database {
  const newDeposit: GoalDeposit = {
    ...deposit,
    id: `dep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  db.goalDeposits = [...db.goalDeposits, newDeposit];
  // Update goal currentAmount
  db.goals = db.goals.map(g => {
    if (g.id === deposit.goalId) {
      const totalDeposits = [...db.goalDeposits, newDeposit]
        .filter(d => d.goalId === g.id)
        .reduce((sum, d) => sum + d.amount, 0);
      return { ...g, currentAmount: totalDeposits };
    }
    return g;
  });
  saveDatabase(db);
  return db;
}

export function addRecurring(db: Database, recurring: Omit<Recurring, 'id'>): Database {
  const newRecurring: Recurring = {
    ...recurring,
    id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  db.recurrings = [...db.recurrings, newRecurring];
  saveDatabase(db);
  return db;
}

export function deleteRecurring(db: Database, id: string): Database {
  db.recurrings = db.recurrings.filter(r => r.id !== id);
  saveDatabase(db);
  return db;
}

export function addChatMessage(db: Database, message: Omit<ChatMessage, 'id' | 'timestamp'>): Database {
  const newMsg: ChatMessage = {
    ...message,
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
  db.chatMessages = [...db.chatMessages, newMsg];
  saveDatabase(db);
  return db;
}

export function clearChatMessages(db: Database): Database {
  db.chatMessages = [];
  saveDatabase(db);
  return db;
}

export function addHabitLog(db: Database, date: string): Database {
  if (db.habitLog.some(h => h.date === date)) return db;
  const log: HabitLog = {
    id: `hab-${Date.now()}`,
    date,
    loggedAt: new Date().toISOString(),
  };
  db.habitLog = [...db.habitLog, log];
  saveDatabase(db);
  return db;
}

export function updateSettings(db: Database, updates: Partial<AppSettings>): Database {
  db.settings = { ...db.settings, ...updates };
  saveDatabase(db);
  return db;
}

export function updateChallengeState(db: Database, updates: Partial<ChallengeState>): Database {
  db.challengeState = { ...db.challengeState, ...updates };
  saveDatabase(db);
  return db;
}


+++ src/db/database.ts (修改后)
