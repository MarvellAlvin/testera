--- src/components/DCACalculator.tsx (原始)


+++ src/components/DCACalculator.tsx (修改后)
// DCA Calculator - Dollar Cost Averaging simulation
import React, { useState, useMemo } from 'react';
import { FormattedNumberInput, formattedToNumber } from './FormattedNumberInput';
import { formatCurrency } from '../utils/formatters';
import { LineChart } from './Charts';
import { X, Calculator } from 'lucide-react';

interface DCACalculatorProps {
  onClose: () => void;
  currency?: string;
}

export function DCACalculator({ onClose, currency = 'IDR' }: DCACalculatorProps) {
  const [monthlyAmount, setMonthlyAmount] = useState('500000');
  const [years, setYears] = useState('5');
  const [returnRate, setReturnRate] = useState('10');
  const [inflationRate, setInflationRate] = useState('5');

  const simulation = useMemo(() => {
    const monthly = formattedToNumber(monthlyAmount);
    const yearsNum = parseInt(years) || 0;
    const annualReturn = parseFloat(returnRate) || 0;
    const annualInflation = parseFloat(inflationRate) || 0;

    const monthlyReturn = annualReturn / 100 / 12;
    const monthlyInflation = annualInflation / 100 / 12;
    const totalMonths = yearsNum * 12;

    let balance = 0;
    let totalInvested = 0;
    const  { label: string; value: number; invested: number }[] = [];

    for (let month = 1; month <= totalMonths; month++) {
      balance = (balance + monthly) * (1 + monthlyReturn);
      totalInvested += monthly;

      // Show data point every 12 months or at start/end
      if (month % 12 === 0 || month === 1 || month === totalMonths) {
        const realValue = balance / Math.pow(1 + monthlyInflation, month);
        data.push({
          label: `${Math.floor(month / 12)}y`,
          value: Math.round(balance),
          invested: totalInvested,
        });
      }
    }

    const totalReturn = balance - totalInvested;
    const returnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
    const realValue = balance / Math.pow(1 + monthlyInflation, totalMonths);

    return {
      finalBalance: balance,
      totalInvested,
      totalReturn,
      returnPercent,
      realValue,
      data,
    };
  }, [monthlyAmount, years, returnRate, inflationRate]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-md w-full border border-[#2C2C2E] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calculator size={20} className="text-[#22C55E]" />
            <h3 className="text-lg font-bold text-[#F5F5F5]">DCA Calculator</h3>
          </div>
          <button onClick={onClose}><X size={20} className="text-[#9CA3AF]" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Investasi per Bulan</label>
            <FormattedNumberInput value={monthlyAmount} onChange={setMonthlyAmount} placeholder="500000" prefix="Rp" />
          </div>

          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Durasi (Tahun)</label>
            <input
              type="number"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              placeholder="5"
              min="1"
              max="50"
              className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Expected Return per Tahun (%)</label>
            <input
              type="number"
              value={returnRate}
              onChange={(e) => setReturnRate(e.target.value)}
              placeholder="10"
              step="0.1"
              className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Inflasi per Tahun (%)</label>
            <input
              type="number"
              value={inflationRate}
              onChange={(e) => setInflationRate(e.target.value)}
              placeholder="5"
              step="0.1"
              className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none"
            />
          </div>
        </div>

        {/* Results */}
        <div className="mt-6 space-y-3">
          <div className="p-4 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20">
            <p className="text-xs text-[#9CA3AF] mb-1">Nilai Akhir (Nominal)</p>
            <p className="text-xl font-bold text-[#22C55E]">{formatCurrency(simulation.finalBalance, currency)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#262626]">
              <p className="text-[10px] text-[#9CA3AF] mb-1">Total Invested</p>
              <p className="text-sm font-semibold text-[#F5F5F5]">{formatCurrency(simulation.totalInvested, currency)}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#262626]">
              <p className="text-[10px] text-[#9CA3AF] mb-1">Total Return</p>
              <p className={`text-sm font-semibold ${simulation.totalReturn >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {simulation.totalReturn >= 0 ? '+' : ''}{formatCurrency(simulation.totalReturn, currency)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#262626]">
              <p className="text-[10px] text-[#9CA3AF] mb-1">Return %</p>
              <p className={`text-sm font-semibold ${simulation.returnPercent >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {simulation.returnPercent >= 0 ? '+' : ''}{simulation.returnPercent.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#262626]">
              <p className="text-[10px] text-[#9CA3AF] mb-1">Nilai Real (Inflasi)</p>
              <p className="text-sm font-semibold text-[#F5F5F5]">{formatCurrency(simulation.realValue, currency)}</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        {simulation.data.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-[#9CA3AF] mb-2">Proyeksi Pertumbuhan</p>
            <LineChart data={simulation.data.map(d => ({ label: d.label, value: d.value }))} height={120} color="#22C55E" />
          </div>
        )}
      </div>
    </div>
  );
}
