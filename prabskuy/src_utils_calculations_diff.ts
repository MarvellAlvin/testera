--- src/utils/calculations.ts (原始)


+++ src/utils/calculations.ts (修改后)
// Business logic calculations
// Follows LAMPIRAN B: all rules must be preserved

import { Transaction, Account, Category, Budget, Goal, GoalDeposit, HabitLog } from '../db/types';

// Q1: Account balance calculation (SQL-equivalent in JS)
export interface AccountBalance {
  id: string;
  name: string;
  icon: string;
  openingBalance: number;
  balance: number;
  isSavings: boolean;
}

export function calculateAccountBalances(accounts: Account[], transactions: Transaction[]): AccountBalance[] {
  return accounts.map(account => {
    const income = transactions
      .filter(t => t.type === 'income' && t.accountId === account.id)
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter(t => t.type === 'expense' && t.accountId === account.id)
      .reduce((sum, t) => sum + t.amount, 0);
    const transferIn = transactions
      .filter(t => t.type === 'transfer' && t.toAccountId === account.id)
      .reduce((sum, t) => sum + t.amount, 0);
    const transferOut = transactions
      .filter(t => t.type === 'transfer' && t.accountId === account.id)
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = account.openingBalance + income + transferIn - expense - transferOut;
    return {
      id: account.id,
      name: account.name,
      icon: account.icon,
      openingBalance: account.openingBalance,
      balance,
      isSavings: account.isSavings,
    };
  });
}

// Q2: Summary by type for date range
export interface PeriodSummary {
  income: number;
  expense: number;
  net: number;
}

export function calculatePeriodSummary(transactions: Transaction[], from: string, to: string): PeriodSummary {
  const filtered = transactions.filter(t => t.date >= from && t.date <= to && t.type !== 'transfer');
  const income = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  return { income, expense, net: income - expense };
}

// Q3: Top categories
export interface CategoryTotal {
  id: string;
  name: string;
  icon: string;
  total: number;
  percentage: number;
}

export function calculateTopCategories(transactions: Transaction[], categories: Category[], from: string, to: string, limit: number = 6): CategoryTotal[] {
  const filtered = transactions.filter(t => t.date >= from && t.date <= to && t.type === 'expense' && t.categoryId);
  const catMap = new Map(categories.map(c => [c.id, c]));

  const totals = new Map<string, number>();
  filtered.forEach(t => {
    if (t.categoryId) {
      totals.set(t.categoryId, (totals.get(t.categoryId) || 0) + t.amount);
    }
  });

  const totalExpense = filtered.reduce((sum, t) => sum + t.amount, 0);

  return Array.from(totals.entries())
    .map(([catId, total]) => {
      const cat = catMap.get(catId);
      return {
        id: catId,
        name: cat?.name || 'Unknown',
        icon: cat?.icon || '📦',
        total,
        percentage: totalExpense > 0 ? (total / totalExpense) * 100 : 0,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

// Q4: Cashflow buckets (daily or monthly)
export interface BarBucket {
  label: string;
  date: string;
  income: number;
  expense: number;
}

export function calculateCashflowBuckets(transactions: Transaction[], from: string, to: string): BarBucket[] {
  const filtered = transactions.filter(t => t.date >= from && t.date <= to && t.type !== 'transfer');

  // Calculate date range
  const fromDate = new Date(from + 'T00:00:00');
  const toDate = new Date(to + 'T00:00:00');
  const dayDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

  const useMonthly = dayDiff > 31;

  const buckets = new Map<string, { income: number; expense: number }>();

  filtered.forEach(t => {
    const key = useMonthly ? t.date.substring(0, 7) : t.date;
    const existing = buckets.get(key) || { income: 0, expense: 0 };
    if (t.type === 'income') existing.income += t.amount;
    else if (t.type === 'expense') existing.expense += t.amount;
    buckets.set(key, existing);
  });

  // Generate all dates/months in range
  const result: BarBucket[] = [];
  if (useMonthly) {
    let current = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    const end = new Date(toDate.getFullYear(), toDate.getMonth() + 1, 1);
    while (current < end) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      const data = buckets.get(key) || { income: 0, expense: 0 };
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      result.push({ label: months[current.getMonth()], date: key, ...data });
      current.setMonth(current.getMonth() + 1);
    }
  } else {
    let current = new Date(fromDate);
    while (current <= toDate) {
      const key = current.toISOString().split('T')[0];
      const data = buckets.get(key) || { income: 0, expense: 0 };
      result.push({ label: String(current.getDate()), date: key, ...data });
      current.setDate(current.getDate() + 1);
    }
  }

  return result;
}

// Q5: Recent transactions
export function getRecentTransactions(transactions: Transaction[], limit: number = 8): Transaction[] {
  return [...transactions]
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, limit);
}

// Budget calculation
export interface BudgetStatus {
  budget: Budget;
  spent: number;
  percentage: number;
  remaining: number;
  isOver: boolean;
  overAmount: number;
}

export function calculateBudgetStatus(budget: Budget, transactions: Transaction[], category: Category | undefined): BudgetStatus {
  const today = new Date();
  const currentDay = today.getDate();
  const startDay = budget.startDay;

  let cycleStart: Date;
  let cycleEnd: Date;

  if (currentDay >= startDay) {
    cycleStart = new Date(today.getFullYear(), today.getMonth(), startDay);
    cycleEnd = new Date(today.getFullYear(), today.getMonth() + 1, startDay);
  } else {
    cycleStart = new Date(today.getFullYear(), today.getMonth() - 1, startDay);
    cycleEnd = new Date(today.getFullYear(), today.getMonth(), startDay);
  }

  const from = cycleStart.toISOString().split('T')[0];
  const to = cycleEnd.toISOString().split('T')[0];

  const spent = transactions
    .filter(t => t.type === 'expense' && t.categoryId === budget.categoryId && t.date >= from && t.date < to)
    .reduce((sum, t) => sum + t.amount, 0);

  const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const remaining = budget.amount - spent;
  const isOver = spent > budget.amount;
  const overAmount = isOver ? spent - budget.amount : 0;

  return { budget, spent, percentage, remaining, isOver, overAmount };
}

// Goal calculation
export interface GoalStatus {
  goal: Goal;
  percentage: number;
  estimatedMonthsLeft: number;
  monthlyNeeded: number;
  isLate: boolean;
  lateDays: number;
}

export function calculateGoalStatus(goal: Goal, deposits: GoalDeposit[]): GoalStatus {
  const totalDeposits = deposits
    .filter(d => d.goalId === goal.id)
    .reduce((sum, d) => sum + d.amount, 0);

  const currentAmount = goal.currentAmount + totalDeposits;
  const percentage = goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0;
  const remaining = goal.targetAmount - currentAmount;

  const createdAt = new Date(goal.createdAt);
  const deadline = new Date(createdAt);
  deadline.setMonth(deadline.getMonth() + goal.deadlineMonths);

  const now = new Date();
  const monthsElapsed = (now.getFullYear() - createdAt.getFullYear()) * 12 + (now.getMonth() - createdAt.getMonth());
  const monthsLeft = Math.max(0, goal.deadlineMonths - monthsElapsed);
  const monthlyNeeded = monthsLeft > 0 ? Math.ceil(remaining / monthsLeft) : remaining;

  const isLate = now > deadline && remaining > 0;
  const lateDays = isLate ? Math.ceil((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return { goal, percentage: Math.min(percentage, 100), estimatedMonthsLeft: monthsLeft, monthlyNeeded, isLate, lateDays };
}

// Habit calculation
export interface HabitStatus {
  consistencyPercent: number;
  streak: number;
  stage: string;
  stageEmoji: string;
  todayLogged: boolean;
}

export function calculateHabitStatus(habitLog: HabitLog[], transactions: Transaction[]): HabitStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if logged today via transactions or habit log
  const todayStr = today.toISOString().split('T')[0];
  const todayLogged = habitLog.some(h => h.date === todayStr) ||
    transactions.some(t => t.date === todayStr && t.type === 'expense');

  // Calculate 30-day consistency
  const last30Days: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last30Days.push(d.toISOString().split('T')[0]);
  }

  const loggedDates = new Set(habitLog.map(h => h.date));
  const loggedDays = last30Days.filter(d => loggedDates.has(d)).length;
  const consistencyPercent = (loggedDays / 30) * 100;

  // Calculate streak
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (loggedDates.has(dateStr) || transactions.some(t => t.date === dateStr && t.type === 'expense')) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  // Stage determination
  let stage: string;
  let stageEmoji: string;
  if (consistencyPercent < 20) { stage = 'Benih'; stageEmoji = '🌰'; }
  else if (consistencyPercent < 40) { stage = 'Tunas'; stageEmoji = '🌱'; }
  else if (consistencyPercent < 60) { stage = 'Pucuk'; stageEmoji = '🌿'; }
  else if (consistencyPercent < 80) { stage = 'Pohon Muda'; stageEmoji = '🪴'; }
  else { stage = 'Pohon'; stageEmoji = '🌳'; }

  return { consistencyPercent, streak, stage, stageEmoji, todayLogged };
}

// Keypad calculator (left-to-right, no precedence)
// Spec: 10.000+5.000x2 = 30.000 (no eval, no precedence)
export function calculateKeypad(expression: string): number {
  if (!expression) return 0;

  // Parse: number, then operator+number pairs
  const parts = expression.match(/(\d+\.?\d*)([+\-x*/]?)/g);
  if (!parts) return 0;

  let result = 0;
  let currentOp = '+';

  for (const part of parts) {
    const match = part.match(/^(\d+\.?\d*)(.*)/);
    if (!match) continue;

    const num = parseFloat(match[1]);
    const op = match[2] || '';

    switch (currentOp) {
      case '+': result += num; break;
      case '-': result -= num; break;
      case 'x': result *= num; break;
      case '*': result *= num; break;
      case '/':
        if (num === 0) return NaN; // divide by zero = error
        result /= num;
        break;
      default: result = num; break;
    }

    currentOp = op;
  }

  return result;
}
