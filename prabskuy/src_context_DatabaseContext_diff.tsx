--- src/context/DatabaseContext.tsx (原始)


+++ src/context/DatabaseContext.tsx (修改后)
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
