--- src/components/InvestmentStreaksCalendar.tsx (原始)


+++ src/components/InvestmentStreaksCalendar.tsx (修改后)
// Investment Streaks Calendar - Monthly tracking visualization
import React, { useMemo } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Calendar, Flame } from 'lucide-react';

interface InvestmentStreaksCalendarProps {
  monthsToShow?: number;
}

export function InvestmentStreaksCalendar({ monthsToShow = 12 }: InvestmentStreaksCalendarProps) {
  const { investments, investmentTransactions } = useDatabase();

  const streakData = useMemo(() => {
    const now = new Date();
    const months: { month: string; label: string; hasActivity: boolean; transactionCount: number }[] = [];

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });

      // Check if there were any investment transactions this month
      const monthTransactions = investmentTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.getFullYear() === date.getFullYear() && txDate.getMonth() === date.getMonth();
      });

      months.push({
        month: monthKey,
        label: monthLabel,
        hasActivity: monthTransactions.length > 0,
        transactionCount: monthTransactions.length,
      });
    }

    return months;
  }, [investmentTransactions, monthsToShow]);

  // Calculate current streak
  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = streakData.length - 1; i >= 0; i--) {
      if (streakData[i].hasActivity) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [streakData]);

  // Calculate longest streak
  const longestStreak = useMemo(() => {
    let longest = 0;
    let current = 0;
    for (const month of streakData) {
      if (month.hasActivity) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }
    return longest;
  }, [streakData]);

  const totalTransactions = streakData.reduce((sum, m) => sum + m.transactionCount, 0);

  return (
    <div className="mx-4 mt-3 p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-[#22C55E]" />
          <h3 className="text-sm font-semibold text-[#F5F5F5]">Investment Streaks</h3>
        </div>
        <div className="flex items-center gap-1">
          <Flame size={16} className="text-[#FB923C]" />
          <span className="text-sm font-bold text-[#FB923C]">{currentStreak}</span>
          <span className="text-xs text-[#9CA3AF]">bulan</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-6 gap-2 mb-4">
        {streakData.map((month, index) => (
          <div
            key={month.month}
            className="flex flex-col items-center gap-1"
            title={`${month.label}: ${month.transactionCount} transaksi`}
          >
            <div
              className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${
                month.hasActivity
                  ? 'bg-[#22C55E]/20 border border-[#22C55E]/30'
                  : 'bg-[#262626] border border-[#2C2C2E]'
              }`}
            >
              {month.hasActivity && (
                <Flame size={16} className="text-[#22C55E]" />
              )}
            </div>
            <span className="text-[9px] text-[#9CA3AF]">{month.label}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 rounded-lg bg-[#262626]">
          <p className="text-lg font-bold text-[#22C55E]">{currentStreak}</p>
          <p className="text-[10px] text-[#9CA3AF]">Streak Saat Ini</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-[#262626]">
          <p className="text-lg font-bold text-[#FB923C]">{longestStreak}</p>
          <p className="text-[10px] text-[#9CA3AF]">Streak Terpanjang</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-[#262626]">
          <p className="text-lg font-bold text-[#3B82F6]">{totalTransactions}</p>
          <p className="text-[10px] text-[#9CA3AF]">Total Transaksi</p>
        </div>
      </div>
    </div>
  );
}
