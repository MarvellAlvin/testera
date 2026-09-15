--- src/context/DatabaseContext.tsx (原始)
// Database context using Dexie (IndexedDB)
// Live queries with useLiveQuery for automatic reactivity

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db, initializeDatabase, migrateFromLocalStorage,
  loadDummyData as dexieLoadDummy, resetAllData as dexieResetAll,
  Account, Transaction, Budget, Goal, GoalDeposit, Recurring, HabitLog, ChallengeState, AppSettings, Category,
  TxTemplate,
} from '../db/dexie';
import { pushUndo } from '../utils/features';

interface DatabaseContextType {
  // Data (live queries)
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  goalDeposits: GoalDeposit[];
  recurrings: Recurring[];
  habitLog: HabitLog[];
    challengeState: ChallengeState | undefined;
  settings: AppSettings | undefined;  templates: TxTemplate[];
  isLoading: boolean;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'uid' | 'createdAt'>) => Promise<void>;
  updateTransaction: (uid: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (uid: string) => Promise<void>;
  deleteTransactions: (uids: string[]) => Promise<void>;
  addAccount: (account: Omit<Account, 'id' | 'uid' | 'createdAt'>) => Promise<void>;
  updateAccount: (uid: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (uid: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id' | 'uid'>) => Promise<void>;
  deleteBudget: (uid: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'uid' | 'createdAt'>) => Promise<void>;
  deleteGoal: (uid: string) => Promise<void>;
  addGoalDeposit: (deposit: Omit<GoalDeposit, 'id' | 'uid'>) => Promise<void>;
  addRecurring: (recurring: Omit<Recurring, 'id' | 'uid' | 'createdAt'>) => Promise<void>;
  deleteRecurring: (uid: string) => Promise<void>;
  addHabitLog: (date: string) => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  updateChallengeState: (updates: Partial<ChallengeState>) => Promise<void>;
  addTemplate: (template: Omit<TxTemplate, 'id' | 'uid'>) => Promise<void>;
  deleteTemplate: (uid: string) => Promise<void>;
  resetAll: () => Promise<void>;
  loadDummy: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  // Initialize database on mount
  useEffect(() => {
    (async () => {
      await initializeDatabase();
      // Try migration from localStorage
      await migrateFromLocalStorage();
      setIsReady(true);
    })();
  }, []);

  // Live queries
  const accounts = useLiveQuery(() => db.accounts.orderBy('sortOrder').toArray(), [], []) || [];
  const categories = useLiveQuery(() => db.categories.orderBy('sortOrder').toArray(), [], []) || [];
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), [], []) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray(), [], []) || [];
  const goals = useLiveQuery(() => db.goals.toArray(), [], []) || [];
  const goalDeposits = useLiveQuery(() => db.goalDeposits.toArray(), [], []) || [];
  const recurrings = useLiveQuery(() => db.recurrings.toArray(), [], []) || [];
  const habitLog = useLiveQuery(() => db.habitLog.toArray(), [], []) || [];
  const challengeState = useLiveQuery(() => db.challengeState.where('uid').equals('challenge_main').first(), [], undefined) as ChallengeState | undefined;
  const settings = useLiveQuery(() => db.settings.where('uid').equals('settings_main').first(), [], undefined) as AppSettings | undefined;
  const templates = useLiveQuery(() => db.templates.toArray(), [], []) || [];

  // Actions
  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'uid' | 'createdAt'>) => {
    await db.transactions.add({
      ...tx,
      uid: `tx-${uid()}`,
      createdAt: new Date().toISOString(),
    });
  }, []);

  const updateTransaction = useCallback(async (txUid: string, updates: Partial<Transaction>) => {
    await db.transactions.where('uid').equals(txUid).modify(updates);
  }, []);

  const deleteTransaction = useCallback(async (txUid: string) => {
    const tx = await db.transactions.where('uid').equals(txUid).first();
    if (tx) {
      pushUndo({
        id: `undo-${Date.now()}`,
        type: 'delete_transaction',
         tx,
        timestamp: Date.now(),
        label: `Transaksi "${tx.note}" dihapus`,
      });
      await db.transactions.where('uid').equals(txUid).delete();
    }
  }, []);

  const deleteTransactions = useCallback(async (uids: string[]) => {
    await db.transactions.where('uid').anyOf(uids).delete();
  }, []);

  const addAccount = useCallback(async (account: Omit<Account, 'id' | 'uid' | 'createdAt'>) => {
    const count = await db.accounts.count();
    await db.accounts.add({
      ...account,
      uid: `acc-${uid()}`,
      createdAt: new Date().toISOString(),
      sortOrder: count,
    });
  }, []);

  const updateAccount = useCallback(async (accUid: string, updates: Partial<Account>) => {
    await db.accounts.where('uid').equals(accUid).modify(updates);
  }, []);

  const deleteAccount = useCallback(async (accUid: string) => {
    const acc = await db.accounts.where('uid').equals(accUid).first();
    if (acc) {
      pushUndo({
        id: `undo-${Date.now()}`,
        type: 'delete_account',
         acc,
        timestamp: Date.now(),
        label: `Akun "${acc.name}" dihapus`,
      });
      await db.accounts.where('uid').equals(accUid).delete();
      // Delete related transactions
      await db.transactions.where('accountId').equals(accUid).delete();
      await db.transactions.where('toAccountId').equals(accUid).delete();
    }
  }, []);

  const addBudget = useCallback(async (budget: Omit<Budget, 'id' | 'uid'>) => {
    await db.budgets.add({
      ...budget,
      uid: `bud-${uid()}`,
    });
  }, []);

  const deleteBudget = useCallback(async (budUid: string) => {
    const bud = await db.budgets.where('uid').equals(budUid).first();
    if (bud) {
      pushUndo({
        id: `undo-${Date.now()}`,
        type: 'delete_budget',
         bud,
        timestamp: Date.now(),
        label: 'Budget dihapus',
      });
      await db.budgets.where('uid').equals(budUid).delete();
    }
  }, []);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'uid' | 'createdAt'>) => {
    await db.goals.add({
      ...goal,
      uid: `goal-${uid()}`,
      createdAt: new Date().toISOString(),
    });
  }, []);

  const deleteGoal = useCallback(async (goalUid: string) => {
    const goal = await db.goals.where('uid').equals(goalUid).first();
    if (goal) {
      pushUndo({
        id: `undo-${Date.now()}`,
        type: 'delete_goal',
         goal,
        timestamp: Date.now(),
        label: `Goal "${goal.name}" dihapus`,
      });
      await db.goals.where('uid').equals(goalUid).delete();
      await db.goalDeposits.where('goalId').equals(goalUid).delete();
    }
  }, []);

  const addGoalDeposit = useCallback(async (deposit: Omit<GoalDeposit, 'id' | 'uid'>) => {
    await db.goalDeposits.add({
      ...deposit,
      uid: `dep-${uid()}`,
    });
    // Update goal currentAmount
    const totalDeposits = await db.goalDeposits.where('goalId').equals(deposit.goalId).toArray();
    const total = totalDeposits.reduce((sum, d) => sum + d.amount, 0);
    await db.goals.where('uid').equals(deposit.goalId).modify({ currentAmount: total });
  }, []);

  const addRecurring = useCallback(async (recurring: Omit<Recurring, 'id' | 'uid' | 'createdAt'>) => {
    await db.recurrings.add({
      ...recurring,
      uid: `rec-${uid()}`,
      createdAt: new Date().toISOString(),
    });
  }, []);

  const deleteRecurring = useCallback(async (recUid: string) => {
    await db.recurrings.where('uid').equals(recUid).delete();
  }, []);

  const addHabitLog = useCallback(async (date: string) => {
    const existing = await db.habitLog.where('date').equals(date).first();
    if (!existing) {
      await db.habitLog.add({
        uid: `hab-${uid()}`,
        date,
        loggedAt: new Date().toISOString(),
      });
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    await db.settings.where('uid').equals('settings_main').modify(updates);
  }, []);

  const updateChallengeState = useCallback(async (updates: Partial<ChallengeState>) => {
    await db.challengeState.where('uid').equals('challenge_main').modify(updates);
  }, []);

  const addTemplate = useCallback(async (template: Omit<TxTemplate, 'id' | 'uid'>) => {
    await db.templates.add({
      ...template,
      uid: `tpl-${uid()}`,
    });
  }, []);

  const deleteTemplate = useCallback(async (tplUid: string) => {
    await db.templates.where('uid').equals(tplUid).delete();
  }, []);

  const resetAll = useCallback(async () => {
    await dexieResetAll();
  }, []);

  const loadDummy = useCallback(async () => {
    await dexieLoadDummy();
  }, []);

  const value: DatabaseContextType = {
    accounts,
    categories,
    transactions,
    budgets,
    goalDeposits,
    goals,
    recurrings,
    habitLog,
    challengeState,
    settings,
    templates,
    isLoading: !isReady,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteTransactions,
    addAccount,
    updateAccount,
    deleteAccount,
    addBudget,
    deleteBudget,
    addGoal,
    deleteGoal,
    addGoalDeposit,
    addRecurring,
    deleteRecurring,
    addHabitLog,
    updateSettings,
    updateChallengeState,
    addTemplate,
    deleteTemplate,
    resetAll,
    loadDummy,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): DatabaseContextType {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error('useDatabase must be used within DatabaseProvider');
  return ctx;
}


+++ src/context/DatabaseContext.tsx (修改后)
// Database context using Dexie (IndexedDB)
import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db, initializeDatabase, migrateFromLocalStorage,
  loadDummyData as dexieLoadDummy, resetAllData as dexieResetAll,
  Account, Transaction, Budget, Goal, GoalDeposit, Recurring, HabitLog, ChallengeState, AppSettings, Category,
  TxTemplate, InvestmentAsset, InvestmentTransaction,
} from '../db/dexie';
import { pushUndo } from '../utils/features';

interface DatabaseContextType {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  goalDeposits: GoalDeposit[];
  recurrings: Recurring[];
  habitLog: HabitLog[];
  challengeState: ChallengeState | undefined;
  settings: AppSettings | undefined;
  templates: TxTemplate[];
  investments: InvestmentAsset[];
  investmentTransactions: InvestmentTransaction[];
  isLoading: boolean;
  addTransaction: (tx: Omit<Transaction, 'id' | 'uid' | 'createdAt'>) => Promise<void>;
  updateTransaction: (uid: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (uid: string) => Promise<void>;
  deleteTransactions: (uids: string[]) => Promise<void>;
  addAccount: (account: Omit<Account, 'id' | 'uid' | 'createdAt'>) => Promise<void>;
  updateAccount: (uid: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (uid: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id' | 'uid'>) => Promise<void>;
  deleteBudget: (uid: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'uid' | 'createdAt'>) => Promise<void>;
  deleteGoal: (uid: string) => Promise<void>;
  addGoalDeposit: (deposit: Omit<GoalDeposit, 'id' | 'uid'>) => Promise<void>;
  addRecurring: (recurring: Omit<Recurring, 'id' | 'uid' | 'createdAt'>) => Promise<void>;
  deleteRecurring: (uid: string) => Promise<void>;
  addHabitLog: (date: string) => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  updateChallengeState: (updates: Partial<ChallengeState>) => Promise<void>;
  addTemplate: (template: Omit<TxTemplate, 'id' | 'uid'>) => Promise<void>;
  deleteTemplate: (uid: string) => Promise<void>;
  addInvestment: (inv: Omit<InvestmentAsset, 'id' | 'uid' | 'createdAt'>) => Promise<void>;
  updateInvestment: (uid: string, updates: Partial<InvestmentAsset>) => Promise<void>;
  deleteInvestment: (uid: string) => Promise<void>;
  addInvestmentTransaction: (tx: Omit<InvestmentTransaction, 'id' | 'uid' | 'createdAt'>) => Promise<void>;
  resetAll: () => Promise<void>;
  loadDummy: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      await initializeDatabase();
      await migrateFromLocalStorage();
      setIsReady(true);
    })();
  }, []);

  // Live queries
  const accounts = useLiveQuery(() => db.accounts.orderBy('sortOrder').toArray(), [], []) || [];
  const categories = useLiveQuery(() => db.categories.orderBy('sortOrder').toArray(), [], []) || [];
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), [], []) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray(), [], []) || [];
  const goals = useLiveQuery(() => db.goals.toArray(), [], []) || [];
  const goalDeposits = useLiveQuery(() => db.goalDeposits.toArray(), [], []) || [];
  const recurrings = useLiveQuery(() => db.recurrings.toArray(), [], []) || [];
  const habitLog = useLiveQuery(() => db.habitLog.toArray(), [], []) || [];
  const challengeState = useLiveQuery(() => db.challengeState.where('uid').equals('challenge_main').first(), [], undefined) as ChallengeState | undefined;
  const settings = useLiveQuery(() => db.settings.where('uid').equals('settings_main').first(), [], undefined) as AppSettings | undefined;
  const templates = useLiveQuery(() => db.templates.toArray(), [], []) || [];
  const investments = useLiveQuery(() => db.investments.toArray(), [], []) || [];
  const investmentTransactions = useLiveQuery(() => db.investmentTransactions.orderBy('date').reverse().toArray(), [], []) || [];

  // Transaction actions
  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'uid' | 'createdAt'>) => {
    await db.transactions.add({ ...tx, uid: `tx-${uid()}`, createdAt: new Date().toISOString() });
  }, []);

  const updateTransaction = useCallback(async (txUid: string, updates: Partial<Transaction>) => {
    await db.transactions.where('uid').equals(txUid).modify(updates);
  }, []);

  const deleteTransaction = useCallback(async (txUid: string) => {
    const tx = await db.transactions.where('uid').equals(txUid).first();
    if (tx) {
      pushUndo({ id: `undo-${Date.now()}`, type: 'delete_transaction',  tx, timestamp: Date.now(), label: `Transaksi "${tx.note}" dihapus` });
      await db.transactions.where('uid').equals(txUid).delete();
    }
  }, []);

  const deleteTransactions = useCallback(async (uids: string[]) => {
    await db.transactions.where('uid').anyOf(uids).delete();
  }, []);

  const addAccount = useCallback(async (account: Omit<Account, 'id' | 'uid' | 'createdAt'>) => {
    const count = await db.accounts.count();
    await db.accounts.add({ ...account, uid: `acc-${uid()}`, createdAt: new Date().toISOString(), sortOrder: count });
  }, []);

  const updateAccount = useCallback(async (accUid: string, updates: Partial<Account>) => {
    await db.accounts.where('uid').equals(accUid).modify(updates);
  }, []);

  const deleteAccount = useCallback(async (accUid: string) => {
    const acc = await db.accounts.where('uid').equals(accUid).first();
    if (acc) {
      pushUndo({ id: `undo-${Date.now()}`, type: 'delete_account',  acc, timestamp: Date.now(), label: `Akun "${acc.name}" dihapus` });
      await db.accounts.where('uid').equals(accUid).delete();
      await db.transactions.where('accountId').equals(accUid).delete();
      await db.transactions.where('toAccountId').equals(accUid).delete();
    }
  }, []);

  const addBudget = useCallback(async (budget: Omit<Budget, 'id' | 'uid'>) => {
    await db.budgets.add({ ...budget, uid: `bud-${uid()}` });
  }, []);

  const deleteBudget = useCallback(async (budUid: string) => {
    const bud = await db.budgets.where('uid').equals(budUid).first();
    if (bud) {
      pushUndo({ id: `undo-${Date.now()}`, type: 'delete_budget',  bud, timestamp: Date.now(), label: 'Budget dihapus' });
      await db.budgets.where('uid').equals(budUid).delete();
    }
  }, []);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'uid' | 'createdAt'>) => {
    await db.goals.add({ ...goal, uid: `goal-${uid()}`, createdAt: new Date().toISOString() });
  }, []);

  const deleteGoal = useCallback(async (goalUid: string) => {
    const goal = await db.goals.where('uid').equals(goalUid).first();
    if (goal) {
      pushUndo({ id: `undo-${Date.now()}`, type: 'delete_goal',  goal, timestamp: Date.now(), label: `Goal "${goal.name}" dihapus` });
      await db.goals.where('uid').equals(goalUid).delete();
      await db.goalDeposits.where('goalId').equals(goalUid).delete();
    }
  }, []);

  const addGoalDeposit = useCallback(async (deposit: Omit<GoalDeposit, 'id' | 'uid'>) => {
    await db.goalDeposits.add({ ...deposit, uid: `dep-${uid()}` });
    const totalDeposits = await db.goalDeposits.where('goalId').equals(deposit.goalId).toArray();
    const total = totalDeposits.reduce((sum, d) => sum + d.amount, 0);
    await db.goals.where('uid').equals(deposit.goalId).modify({ currentAmount: total });
  }, []);

  const addRecurring = useCallback(async (recurring: Omit<Recurring, 'id' | 'uid' | 'createdAt'>) => {
    await db.recurrings.add({ ...recurring, uid: `rec-${uid()}`, createdAt: new Date().toISOString() });
  }, []);

  const deleteRecurring = useCallback(async (recUid: string) => {
    await db.recurrings.where('uid').equals(recUid).delete();
  }, []);

  const addHabitLog = useCallback(async (date: string) => {
    const existing = await db.habitLog.where('date').equals(date).first();
    if (!existing) {
      await db.habitLog.add({ uid: `hab-${uid()}`, date, loggedAt: new Date().toISOString() });
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    await db.settings.where('uid').equals('settings_main').modify(updates);
  }, []);

  const updateChallengeState = useCallback(async (updates: Partial<ChallengeState>) => {
    await db.challengeState.where('uid').equals('challenge_main').modify(updates);
  }, []);

  const addTemplate = useCallback(async (template: Omit<TxTemplate, 'id' | 'uid'>) => {
    await db.templates.add({ ...template, uid: `tpl-${uid()}` });
  }, []);

  const deleteTemplate = useCallback(async (tplUid: string) => {
    await db.templates.where('uid').equals(tplUid).delete();
  }, []);

  // Investment actions
  const addInvestment = useCallback(async (inv: Omit<InvestmentAsset, 'id' | 'uid' | 'createdAt'>) => {
    await db.investments.add({ ...inv, uid: `inv-${uid()}`, createdAt: new Date().toISOString() });
  }, []);

  const updateInvestment = useCallback(async (invUid: string, updates: Partial<InvestmentAsset>) => {
    await db.investments.where('uid').equals(invUid).modify(updates);
  }, []);

  const deleteInvestment = useCallback(async (invUid: string) => {
    const inv = await db.investments.where('uid').equals(invUid).first();
    if (inv) {
      pushUndo({ id: `undo-${Date.now()}`, type: 'delete_transaction',  inv, timestamp: Date.now(), label: `Investasi "${inv.name}" dihapus` });
      await db.investments.where('uid').equals(invUid).delete();
      await db.investmentTransactions.where('assetUid').equals(invUid).delete();
    }
  }, []);

  const addInvestmentTransaction = useCallback(async (tx: Omit<InvestmentTransaction, 'id' | 'uid' | 'createdAt'>) => {
    await db.investmentTransactions.add({ ...tx, uid: `invtx-${uid()}`, createdAt: new Date().toISOString() });
    // Update asset currentValue based on transactions
    const allTx = await db.investmentTransactions.where('assetUid').equals(tx.assetUid).toArray();
    let totalQuantity = 0;
    let totalCost = 0;
    allTx.forEach(t => {
      if (t.type === 'buy') { totalQuantity += t.quantity; totalCost += t.totalAmount; }
      else if (t.type === 'sell') { totalQuantity -= t.quantity; }
    });
    const avgPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;
    await db.investments.where('uid').equals(tx.assetUid).modify({ quantity: totalQuantity, purchasePrice: avgPrice });
  }, []);

  const resetAll = useCallback(async () => { await dexieResetAll(); }, []);
  const loadDummy = useCallback(async () => { await dexieLoadDummy(); }, []);

  const value: DatabaseContextType = {
    accounts, categories, transactions, budgets, goalDeposits, goals, recurrings, habitLog,
    challengeState, settings, templates, investments, investmentTransactions, isLoading: !isReady,
    addTransaction, updateTransaction, deleteTransaction, deleteTransactions,
    addAccount, updateAccount, deleteAccount,
    addBudget, deleteBudget, addGoal, deleteGoal, addGoalDeposit,
    addRecurring, deleteRecurring, addHabitLog,
    updateSettings, updateChallengeState, addTemplate, deleteTemplate,
    addInvestment, updateInvestment, deleteInvestment, addInvestmentTransaction,
    resetAll, loadDummy,
  };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase(): DatabaseContextType {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error('useDatabase must be used within DatabaseProvider');
  return ctx;
}
