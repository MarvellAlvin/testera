--- src/components/InvestmentSimulator.tsx (原始)


+++ src/components/InvestmentSimulator.tsx (修改后)
// Investment Simulator - What-if scenarios & Monte Carlo simulation
import React, { useState, useMemo } from 'react';
import { FormattedNumberInput, formattedToNumber } from './FormattedNumberInput';
import { formatCurrency } from '../utils/formatters';
import { LineChart } from './Charts';
import { X, TrendingUp, BarChart3 } from 'lucide-react';

interface InvestmentSimulatorProps {
  onClose: () => void;
  currency?: string;
}

export function InvestmentSimulator({ onClose, currency = 'IDR' }: InvestmentSimulatorProps) {
  const [initialInvestment, setInitialInvestment] = useState('10000000');
  const [monthlyAddition, setMonthlyAddition] = useState('1000000');
  const [years, setYears] = useState('10');
  const [expectedReturn, setExpectedReturn] = useState('12');
  const [volatility, setVolatility] = useState('15');
  const [scenario, setScenario] = useState<'optimistic' | 'realistic' | 'pessimistic'>('realistic');

  const simulation = useMemo(() => {
    const initial = formattedToNumber(initialInvestment);
    const monthly = formattedToNumber(monthlyAddition);
    const yearsNum = parseInt(years) || 0;
    const annualReturn = parseFloat(expectedReturn) || 0;
    const annualVolatility = parseFloat(volatility) || 0;

    // Adjust return based on scenario
    let adjustedReturn = annualReturn;
    if (scenario === 'optimistic') adjustedReturn *= 1.3;
    else if (scenario === 'pessimistic') adjustedReturn *= 0.5;

    const monthlyReturn = adjustedReturn / 100 / 12;
    const totalMonths = yearsNum * 12;

    let balance = initial;
    let totalInvested = initial;
    const  { label: string; value: number; invested: number }[] = [];

    for (let month = 1; month <= totalMonths; month++) {
      if (month > 1) {
        balance += monthly;
        totalInvested += monthly;
      }

      // Apply monthly return with some randomness for realism
      const randomFactor = 1 + (Math.random() - 0.5) * (annualVolatility / 100 / 12);
      balance = balance * (1 + monthlyReturn) * randomFactor;

      // Show data point every 12 months
      if (month % 12 === 0 || month === 1) {
        data.push({
          label: `${Math.floor(month / 12)}y`,
          value: Math.round(balance),
          invested: totalInvested,
        });
      }
    }

    const totalReturn = balance - totalInvested;
    const returnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    // Monte Carlo: Run 100 simulations
    const monteCarloResults: number[] = [];
    for (let i = 0; i < 100; i++) {
      let simBalance = initial;
      for (let month = 1; month <= totalMonths; month++) {
        if (month > 1) simBalance += monthly;
        const randomReturn = (annualReturn / 100 / 12) + (Math.random() - 0.5) * (annualVolatility / 100 / 12);
        simBalance = simBalance * (1 + randomReturn);
      }
      monteCarloResults.push(simBalance);
    }

    monteCarloResults.sort((a, b) => a - b);
    const percentile10 = monteCarloResults[Math.floor(monteCarloResults.length * 0.1)];
    const percentile50 = monteCarloResults[Math.floor(monteCarloResults.length * 0.5)];
    const percentile90 = monteCarloResults[Math.floor(monteCarloResults.length * 0.9)];

    return {
      finalBalance: balance,
      totalInvested,
      totalReturn,
      returnPercent,
      data,
      monteCarlo: {
        pessimistic: percentile10,
        expected: percentile50,
        optimistic: percentile90,
      },
    };
  }, [initialInvestment, monthlyAddition, years, expectedReturn, volatility, scenario]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-md w-full border border-[#2C2C2E] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={20} className="text-[#3B82F6]" />
            <h3 className="text-lg font-bold text-[#F5F5F5]">Investment Simulator</h3>
          </div>
          <button onClick={onClose}><X size={20} className="text-[#9CA3AF]" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Investasi Awal</label>
            <FormattedNumberInput value={initialInvestment} onChange={setInitialInvestment} placeholder="10000000" prefix="Rp" />
          </div>

          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Investasi Bulanan</label>
            <FormattedNumberInput value={monthlyAddition} onChange={setMonthlyAddition} placeholder="1000000" prefix="Rp" />
          </div>

          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Durasi (Tahun)</label>
            <input
              type="number"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              placeholder="10"
              min="1"
              max="50"
              className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Expected Return per Tahun (%)</label>
            <input
              type="number"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
              placeholder="12"
              step="0.1"
              className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Volatilitas (%)</label>
            <input
              type="number"
              value={volatility}
              onChange={(e) => setVolatility(e.target.value)}
              placeholder="15"
              step="0.1"
              className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-[#9CA3AF] mb-2 block">Skenario</label>
            <div className="grid grid-cols-3 gap-2">
              {(['optimistic', 'realistic', 'pessimistic'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setScenario(s)}
                  className={`py-2 rounded-xl text-xs font-medium ${
                    scenario === s
                      ? s === 'optimistic' ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30'
                        : s === 'realistic' ? 'bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30'
                        : 'bg-[#FB923C]/20 text-[#FB923C] border border-[#FB923C]/30'
                      : 'bg-[#262626] text-[#9CA3AF]'
                  }`}
                >
                  {s === 'optimistic' ? 'Optimis' : s === 'realistic' ? 'Realistis' : 'Pesimis'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mt-6 space-y-3">
          <div className="p-4 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20">
            <p className="text-xs text-[#9CA3AF] mb-1">Nilai Akhir (Skenario {scenario === 'optimistic' ? 'Optimis' : scenario === 'realistic' ? 'Realistis' : 'Pesimis'})</p>
            <p className="text-xl font-bold text-[#3B82F6]">{formatCurrency(simulation.finalBalance, currency)}</p>
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

          {/* Monte Carlo Results */}
          <div className="p-4 rounded-xl bg-[#262626]">
            <p className="text-xs text-[#9CA3AF] mb-2">Monte Carlo Simulation (100 scenarios)</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#FB923C]">10th Percentile (Pesimis)</span>
                <span className="text-[#F5F5F5] font-semibold">{formatCurrency(simulation.monteCarlo.pessimistic, currency)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#3B82F6]">50th Percentile (Expected)</span>
                <span className="text-[#F5F5F5] font-semibold">{formatCurrency(simulation.monteCarlo.expected, currency)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#22C55E]">90th Percentile (Optimis)</span>
                <span className="text-[#F5F5F5] font-semibold">{formatCurrency(simulation.monteCarlo.optimistic, currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        {simulation.data.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-[#9CA3AF] mb-2">Proyeksi Pertumbuhan</p>
            <LineChart data={simulation.data.map(d => ({ label: d.label, value: d.value }))} height={120} color="#3B82F6" />
          </div>
        )}
      </div>
    </div>
  );
}
