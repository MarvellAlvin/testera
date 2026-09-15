--- src/db/types.ts (原始)


+++ src/db/types.ts (修改后)
// Types for the Finance Tracker database

export interface Account {
  id: string;
  name: string;
  icon: string;
  openingBalance: number;
  isSavings: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'expense' | 'income' | 'system';
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  note: string;
  amount: number;
  date: string; // ISO date YYYY-MM-DD
  accountId: string;
  toAccountId?: string; // for transfers
  categoryId?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  startDay: number; // day of month (1-28)
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadlineMonths: number;
  createdAt: string;
}

export interface GoalDeposit {
  id: string;
  goalId: string;
  amount: number;
  date: string;
}

export interface Recurring {
  id: string;
  type: 'income' | 'expense';
  note: string;
  amount: number;
  accountId: string;
  categoryId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextDue: string;
  autoPost: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: string;
  transactionData?: Partial<Transaction>;
}

export interface HabitLog {
  id: string;
  date: string;
  loggedAt: string;
}

export interface ChallengeState {
  activeChallengeId: string | null;
  status: 'IDLE' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  startedAt: string | null;
  endsAt: string | null;
  rejectionsLeft: number;
  xp: number;
  recentIds: string[];
  nextPopupAt: string;
}

export interface AppSettings {
  currency: string;
  language: 'id' | 'en';
  amoledMode: boolean;
}

export interface Database {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  goalDeposits: GoalDeposit[];
  recurrings: Recurring[];
  chatMessages: ChatMessage[];
  habitLog: HabitLog[];
  challengeState: ChallengeState;
  settings: AppSettings;
  appInitialized: boolean;
}
