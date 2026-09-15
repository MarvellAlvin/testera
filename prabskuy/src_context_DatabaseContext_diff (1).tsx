--- src/context/DatabaseContext.tsx (原始)
// Database context - provides reactive state to all components
// Simulates ViewModel pattern from spec

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { Database, Transaction, Account, Budget, Goal, GoalDeposit, Recurring, ChatMessage, HabitLog, AppSettings, ChallengeState } from '../db/types';
import * as db from '../db/database';

type Action =
  | { type: 'SET_DB'; payload: Database }
  | { type: 'RESET' };

function reducer(state: Database, action: Action): Database {
  switch (action.type) {
    case 'SET_DB':
      return action.payload;
    case 'RESET':
      return db.resetDatabase();
    default:
      return state;
  }
}

interface DatabaseContextType {
  db: Database;
  refresh: () => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  deleteTransactions: (ids: string[]) => void;
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  deleteBudget: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  deleteGoal: (id: string) => void;
  addGoalDeposit: (deposit: Omit<GoalDeposit, 'id'>) => void;
  addRecurring: (recurring: Omit<Recurring, 'id'>) => void;
  deleteRecurring: (id: string) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChatMessages: () => void;
  addHabitLog: (date: string) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateChallengeState: (updates: Partial<ChallengeState>) => void;
  resetAll: () => void;
  loadDummy: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [database, dispatch] = useReducer(reducer, null as unknown as Database, () => db.loadDatabase());

  const refresh = useCallback(() => {
    dispatch({ type: 'SET_DB', payload: db.loadDatabase() });
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const updated = db.addTransaction(db.loadDatabase(), tx);
    dispatch({ type: 'SET_DB', payload: updated });
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    const updated = db.updateTransaction(db.loadDatabase(), id, updates);
    dispatch({ type: 'SET_DB', payload: updated });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    const updated = db.deleteTransaction(db.loadDatabase(), id);
    dispatch({ type: 'SET_DB', payload: updated });
  }, []);

  const deleteTransactions = useCallback((ids: string[]) => {
    const updated = db.deleteTransactions(db.loadDatabase(), ids);
    dispatch({ type: 'SET_DB', payload: updated });
  }, []);

  const addAccount = useCallback((account: Omit<Account, 'id' | 'createdAt'>) => {
    const updated = db.addAccount(db.loadDatabase(), account);
    dispatch({ type: 'SET_DB', payload: updated });
  }, []);

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    const updated = db.updateAccount(db.loadDatabase(), id, updates);
    dispatch({ type: 'SET_DB', payload: updated });
  }, []);

  const deleteAccount = useCallback((id: string) => {
    const updated = db.deleteAccount(db.loadDatabase(), id);
    dispatch({ type: 'SET_DB', payload: updated });
  }, []);

  const addBudget = useCallback((budget: Omit<Budget, 'id'>) => {
    const updated = db.addBudget(db.loadDatabase(), budget);
    dispatch({ type: 'SET_DB', payload: updated });
  }, []);

  const deleteBudget = useCallback((id: string) => {
    const updated = db.deleteBudget(db.loadDatabase(), id);
    dispatch({ type: 'SET_DB', payload: updated });
  }, []);

  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'createdAt'>) => {
    const updated = db.addGoal(db.loadDatabase(), goal);
    dispatch({ type: 'SET_DB', payload: updated });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    const updated = db.deleteGoal(db.loadDatabase(), id);
    dispatch({ type: 'SET_DB', payload: updated });
  }, []);

  const addGoalDeposit = useCallback((deposit: Omit<GoalDeposit, 'id'>) => {
    const updated = db.addGoalDeposit(db.loadDatabase(), deposit);
    dispatch({ type: 'SET_DB', payload: updated });
  }, []);

  const addRecurring = useCallback((recurring: Omit<Recurring, 'id'>) => {
    const updated = db.addRecurring(db.loadDatabase(), recurring);
    dispatch({ type: 'SET_DB', payload: updated });
  }, []);

  const deleteRecurring = useCallback((id: string) => {
    const updated = db.deleteRecurring(db.loadDatabase(), id);
    dispatch({ type: 'SET_DB', payload: updated });
  }, []);

  const addChatMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const updated = db.addChatMessage(db.loadDatabase(), message);
    dispatch({ type: 'SET_DB', payload: updated });
  }, []);

  const clearChatMessages = useCallback(() => {
    const updated = db.clearChatMessages(db.loadDatabase());
    dispatch({ type: 'SET_DB', payload: updated });
  }, []);

  const addHabitLog = useCallback((date: string) => {
    const updated = db.addHabitLog(db.loadDatabase(), date);
    dispatch({ type: 'SET_DB', payload: updated });
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    const updated = db.updateSettings(db.loadDatabase(), updates);
    dispatch({ type: 'SET_DB', payload: updated });
  }, []);

  const updateChallengeState = useCallback((updates: Partial<ChallengeState>) => {
    const updated = db.updateChallengeState(db.loadDatabase(), updates);
    dispatch({ type: 'SET_DB', payload: updated });
  }, []);

  const resetAll = useCallback(() => {
    const updated = db.resetDatabase();
    dispatch({ type: 'SET_DB', payload: updated });
  }, []);

  const loadDummy = useCallback(() => {
    const updated = db.loadDummyData();
    dispatch({ type: 'SET_DB', payload: updated });
  }, []);

  const value: DatabaseContextType = {
    db: database,
    refresh,
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
    addChatMessage,
    clearChatMessages,
    addHabitLog,
    updateSettings,
    updateChallengeState,
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
