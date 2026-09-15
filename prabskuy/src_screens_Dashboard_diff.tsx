--- src/screens/Dashboard.tsx (原始)


+++ src/screens/Dashboard.tsx (修改后)
// Dashboard Screen
// Shows: total balance, income/expense summary, cashflow chart, top categories, recent transactions, habit

import React, { useMemo } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { calculateAccountBalances, calculatePeriodSummary, calculateTopCategories, calculateCashflowBuckets, getRecentTransactions, calculateHabitStatus } from '../utils/calculations';
import { formatCurrency, getMonthRange, formatDate } from '../utils/formatters';
import { TrendingUp, TrendingDown, Wallet, Plus, Sparkles } from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  onAddTransaction: () => void;
  onLoadDummy: () => void;
  onNavigateAccounts: () => void;
}

export function Dashboard({ onNavigate, onAddTransaction, onLoadDummy, onNavigateAccounts }: DashboardProps) {
  const { db } = useDatabase();
  const { from, to } = useMemo(() => getMonthRange(), []);

  const accountBalances = useMemo(() => calculateAccountBalances(db.accounts, db.transactions), [db.accounts, db.transactions]);
  const summary = useMemo(() => calculatePeriodSummary(db.transactions, from, to), [db.transactions, from, to]);
  const topCategories = useMemo(() => calculateTopCategories(db.transactions, db.categories, from, to), [db.transactions, db.categories, from, to]);
  const buckets = useMemo(() => calculateCashflowBuckets(db.transactions, from, to), [db.transactions, from, to]);
  const recent = useMemo(() => getRecentTransactions(db.transactions, 8), [db.transactions]);
  const habit = useMemo(() => calculateHabitStatus(db.habitLog, db.transactions), [db.habitLog, db.transactions]);

  const totalBalance = accountBalances.reduce((sum, a) => sum + a.balance, 0);
  const hasAccounts = db.accounts.length > 0;
  const hasTransactions = db.transactions.length > 0;

  // Empty state: no accounts
  if (!hasAccounts) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#22C55E]/10 flex items-center justify-center mb-6">
          <Wallet size={40} className="text-[#22C55E]" />
        </div>
        <h2 className="text-xl font-bold text-[#F5F5F5] mb-2">Selamat Datang!</h2>
        <p className="text-[#9CA3AF] mb-8 text-sm leading-relaxed">
          Mulai kelola keuanganmu dengan menambahkan akun dan saldo awal.
        </p>
        <button
          onClick={onNavigateAccounts}
          className="w-full max-w-xs py-4 rounded-xl bg-[#22C55E] text-white font-semibold text-base mb-4 active:scale-[0.98] transition-transform"
        >
          Atur Akun & Saldo Awal
        </button>
        <button
          onClick={onLoadDummy}
          className="text-[#22C55E] text-sm underline underline-offset-2"
        >
          atau coba dengan data contoh
        </button>
      </div>
    );
  }

  // Empty state: has accounts but no transactions
  if (!hasTransactions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#22C55E]/10 flex items-center justify-center mb-6">
          <Sparkles size={40} className="text-[#22C55E]" />
        </div>
        <h2 className="text-xl font-bold text-[#F5F5F5] mb-2">Catat Transaksi Pertamamu</h2>
        <p className="text-[#9CA3AF] mb-8 text-sm leading-relaxed">
          Mulai catat pemasukan dan pengeluaran untuk melihat ringkasan keuanganmu.
        </p>
        <button
          onClick={onAddTransaction}
          className="w-full max-w-xs py-4 rounded-xl bg-[#22C55E] text-white font-semibold text-base mb-4 active:scale-[0.98] transition-transform"
        >
          Catat Transaksi
        </button>
        <button
          onClick={onLoadDummy}
          className="text-[#22C55E] text-sm underline underline-offset-2"
        >
          atau coba dengan data contoh
        </button>
      </div>
    );
  }

  // Full dashboard
  const maxBucket = Math.max(...buckets.map(b => Math.max(b.income, b.expense)), 1);

  return (
    <div className="pb-4 space-y-5">
      {/* Balance Card */}
      <div className="mx-4 mt-4 p-5 rounded-2xl bg-gradient-to-br from-[#22C55E]/20 to-[#22C55E]/5 border border-[#22C55E]/20">
        <p className="text-[#9CA3AF] text-xs mb-1">Total Saldo</p>
        <p className="text-2xl font-bold text-[#F5F5F5]">{formatCurrency(totalBalance, db.settings.currency)}</p>
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#22C55E]/20 flex items-center justify-center">
              <TrendingUp size={14} className="text-[#22C55E]" />
            </div>
            <div>
              <p className="text-[10px] text-[#9CA3AF]">Pemasukan</p>
              <p className="text-sm font-semibold text-[#22C55E]">{formatCurrency(summary.income, db.settings.currency)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FB923C]/20 flex items-center justify-center">
              <TrendingDown size={14} className="text-[#FB923C]" />
            </div>
            <div>
              <p className="text-[10px] text-[#9CA3AF]">Pengeluaran</p>
              <p className="text-sm font-semibold text-[#FB923C]">{formatCurrency(summary.expense, db.settings.currency)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cashflow Chart */}
      <div className="mx-4 p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
        <h3 className="text-sm font-semibold text-[#F5F5F5] mb-3">Arus Kas Bulan Ini</h3>
        {buckets.length > 0 ? (
          <div className="flex items-end gap-[2px] h-28 overflow-x-auto">
            {buckets.slice(-14).map((bucket, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5 min-w-[16px] flex-1">
                <div className="flex gap-[1px] items-end w-full h-24">
                  <div
                    className="flex-1 rounded-t bg-[#22C55E]/70 transition-all duration-300"
                    style={{ height: `${(bucket.income / maxBucket) * 100}%`, minHeight: bucket.income > 0 ? '2px' : '0' }}
                  />
                  <div
                    className="flex-1 rounded-t bg-[#FB923C]/70 transition-all duration-300"
                    style={{ height: `${(bucket.expense / maxBucket) * 100}%`, minHeight: bucket.expense > 0 ? '2px' : '0' }}
                  />
                </div>
                <span className="text-[8px] text-[#9CA3AF]">{bucket.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-28 flex items-center justify-center">
            <p className="text-[#9CA3AF] text-sm">Belum ada data</p>
          </div>
        )}
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#22C55E]/70" />
            <span className="text-[10px] text-[#9CA3AF]">Masuk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#FB923C]/70" />
            <span className="text-[10px] text-[#9CA3AF]">Keluar</span>
          </div>
        </div>
      </div>

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className="mx-4 p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
          <h3 className="text-sm font-semibold text-[#F5F5F5] mb-3">Kategori Teratas</h3>
          <div className="space-y-3">
            {topCategories.slice(0, 4).map(cat => (
              <div key={cat.id} className="flex items-center gap-3">
                <span className="text-lg">{cat.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-[#F5F5F5]">{cat.name}</span>
                    <span className="text-xs font-semibold text-[#FB923C]">{formatCurrency(cat.total, db.settings.currency)}</span>
                  </div>
                  <div className="h-1.5 bg-[#2C2C2E] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FB923C] rounded-full transition-all duration-500"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Habit Plant */}
      <div className="mx-4 p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-[#F5F5F5]">Habit Plant</h3>
          <span className="text-lg">{habit.stageEmoji}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="h-2 bg-[#2C2C2E] rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-[#22C55E] rounded-full transition-all duration-500"
                style={{ width: `${habit.consistencyPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-[#9CA3AF]">{habit.stage} • {Math.round(habit.consistencyPercent)}% konsistensi</p>
          </div>
          {habit.streak > 0 && (
            <div className="text-center">
              <p className="text-lg font-bold text-[#EAB308]">🔥{habit.streak}</p>
              <p className="text-[8px] text-[#9CA3AF]">streak</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      {recent.length > 0 && (
        <div className="mx-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#F5F5F5]">Transaksi Terbaru</h3>
            <button onClick={() => onNavigate('detail')} className="text-xs text-[#22C55E]">
              Lihat Semua
            </button>
          </div>
          <div className="space-y-2">
            {recent.slice(0, 5).map(tx => {
              const cat = db.categories.find(c => c.id === tx.categoryId);
              const account = db.accounts.find(a => a.id === tx.accountId);
              return (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
                  <div className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center text-lg">
                    {cat?.icon || (tx.type === 'transfer' ? '🔄' : '💸')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#F5F5F5] truncate">{tx.note}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{account?.name} • {formatDate(tx.date, db.settings.language)}</p>
                  </div>
                  <p className={`text-sm font-semibold ${
                    tx.type === 'income' ? 'text-[#22C55E]' : tx.type === 'expense' ? 'text-[#FB923C]' : 'text-[#3B82F6]'
                  }`}>
                    {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatCurrency(tx.amount, db.settings.currency)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Accounts Summary */}
      <div className="mx-4">
        <h3 className="text-sm font-semibold text-[#F5F5F5] mb-3">Akun</h3>
        <div className="grid grid-cols-2 gap-2">
          {accountBalances.map(acc => (
            <div key={acc.id} className="p-3 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{acc.icon}</span>
                <span className="text-xs text-[#9CA3AF] truncate">{acc.name}</span>
              </div>
              <p className="text-sm font-semibold text-[#F5F5F5]">{formatCurrency(acc.balance, db.settings.currency)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
