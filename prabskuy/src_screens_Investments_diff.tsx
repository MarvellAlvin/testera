--- src/screens/Investments.tsx (原始)


+++ src/screens/Investments.tsx (修改后)
// Investment Screen - Track investment assets separately from cash
import React, { useState, useMemo } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { formatCurrency } from '../utils/formatters';
import { FormattedNumberInput, formattedToNumber } from '../components/FormattedNumberInput';
import { PieChart, LineChart } from '../components/Charts';
import { hapticFeedback, showToast, Confetti } from '../components/UI';
import { Plus, Trash2, X, TrendingUp, TrendingDown, PieChart as PieIcon } from 'lucide-react';

type InvestmentType = 'saham' | 'reksadana' | 'obligasi' | 'crypto' | 'emas' | 'properti' | 'deposito' | 'lainnya';

const INVESTMENT_TYPES: { type: InvestmentType; label: string; icon: string }[] = [
  { type: 'saham', label: 'Saham', icon: '📈' },
  { type: 'reksadana', label: 'Reksadana', icon: '📊' },
  { type: 'obligasi', label: 'Obligasi', icon: '📜' },
  { type: 'crypto', label: 'Crypto', icon: '₿' },
  { type: 'emas', label: 'Emas', icon: '🥇' },
  { type: 'properti', label: 'Properti', icon: '🏠' },
  { type: 'deposito', label: 'Deposito', icon: '🏦' },
  { type: 'lainnya', label: 'Lainnya', icon: '💎' },
];

const TYPE_COLORS: Record<InvestmentType, string> = {
  saham: '#22C55E',
  reksadana: '#3B82F6',
  obligasi: '#A855F7',
  crypto: '#FB923C',
  emas: '#EAB308',
  properti: '#EF4444',
  deposito: '#06B6D4',
  lainnya: '#6B7280',
};

export function Investments() {
  const { accounts, investments, investmentTransactions, settings, addInvestment, updateInvestment, deleteInvestment, addInvestmentTransaction } = useDatabase();
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showUpdateValue, setShowUpdateValue] = useState<string | null>(null);
  const [showAddTransaction, setShowAddTransaction] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<InvestmentType>('saham');
  const [newPurchasePrice, setNewPurchasePrice] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newCurrentValue, setNewCurrentValue] = useState('');
  const [newPurchaseDate, setNewPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [newValue, setNewValue] = useState('');
  const [txType, setTxType] = useState<'buy' | 'sell' | 'dividend'>('buy');
  const [txQuantity, setTxQuantity] = useState('');
  const [txPrice, setTxPrice] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [showConfetti, setShowConfetti] = useState(false);
  const currency = settings?.currency || 'IDR';

  // Calculate totals
  const totalInvestment = useMemo(() => investments.reduce((sum, inv) => sum + inv.currentValue, 0), [investments]);
  const totalCash = useMemo(() => accounts.reduce((sum, acc) => {
    const income = 0; // simplified
    return sum + acc.openingBalance;
  }, 0), [accounts]);
  const totalWealth = totalCash + totalInvestment;

  // Calculate gains/losses
  const totalCostBasis = useMemo(() => investments.reduce((sum, inv) => sum + (inv.purchasePrice * inv.quantity), 0), [investments]);
  const totalGainLoss = totalInvestment - totalCostBasis;
  const gainLossPercent = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

  // Pie chart data
  const pieData = useMemo(() => {
    const byType = new Map<InvestmentType, number>();
    investments.forEach(inv => {
      byType.set(inv.type, (byType.get(inv.type) || 0) + inv.currentValue);
    });
    return Array.from(byType.entries()).map(([type, value]) => ({
      label: INVESTMENT_TYPES.find(t => t.type === type)?.label || type,
      value,
      color: TYPE_COLORS[type],
      icon: INVESTMENT_TYPES.find(t => t.type === type)?.icon,
    }));
  }, [investments]);

  // Wealth distribution (cash vs investment)
  const wealthDistribution = useMemo(() => {
    return [
      { label: 'Uang Tunai', value: totalCash, color: '#22C55E', icon: '💵' },
      { label: 'Investasi', value: totalInvestment, color: '#3B82F6', icon: '📈' },
    ].filter(d => d.value > 0);
  }, [totalCash, totalInvestment]);

  const handleAddAsset = () => {
    if (!newName || !newCurrentValue) return;
    const currentVal = formattedToNumber(newCurrentValue);
    const purchasePrice = formattedToNumber(newPurchasePrice) || currentVal;
    const quantity = formattedToNumber(newQuantity) || 1;
    addInvestment({
      name: newName,
      type: newType,
      icon: INVESTMENT_TYPES.find(t => t.type === newType)?.icon || '💎',
      purchasePrice,
      quantity,
      currentValue: currentVal,
      purchaseDate: newPurchaseDate,
    });
    setShowAddAsset(false);
    setNewName(''); setNewCurrentValue(''); setNewPurchasePrice(''); setNewQuantity('');
    hapticFeedback('medium');
    showToast({ message: 'Aset investasi ditambahkan', type: 'success' });
  };

  const handleUpdateValue = async (assetUid: string) => {
    const val = formattedToNumber(newValue);
    if (!val) return;
    await updateInvestment(assetUid, { currentValue: val });
    setShowUpdateValue(null);
    setNewValue('');
    hapticFeedback('light');
    showToast({ message: 'Nilai aset diperbarui', type: 'success' });
  };

  const handleAddTransaction = async (assetUid: string) => {
    const qty = formattedToNumber(txQuantity);
    const price = formattedToNumber(txPrice);
    if (!qty || !price) return;
    const totalAmount = qty * price;
    await addInvestmentTransaction({
      assetUid,
      type: txType,
      quantity: qty,
      pricePerUnit: price,
      totalAmount,
      date: txDate,
    });
    setShowAddTransaction(null);
    setTxQuantity(''); setTxPrice('');
    hapticFeedback('medium');
    if (txType === 'dividend') setShowConfetti(true);
    showToast({ message: `Transaksi ${txType} dicatat`, type: 'success' });
  };

  const handleDeleteAsset = async (uid: string) => {
    await deleteInvestment(uid);
    hapticFeedback('medium');
    showToast({ message: 'Aset dihapus', type: 'info' });
  };

  // Group investments by type
  const investmentsByType = useMemo(() => {
    const groups = new Map<InvestmentType, typeof investments>();
    investments.forEach(inv => {
      const existing = groups.get(inv.type) || [];
      groups.set(inv.type, [...existing, inv]);
    });
    return groups;
  }, [investments]);

  return (
    <div className="flex-1 overflow-y-auto pb-4">
      {/* Total Wealth Card */}
      <div className="mx-4 mt-2 p-5 rounded-2xl bg-gradient-to-br from-[#3B82F6]/20 to-[#22C55E]/10 border border-[#3B82F6]/20">
        <p className="text-[#9CA3AF] text-xs mb-1">Total Kekayaan</p>
        <p className="text-2xl font-bold text-[#F5F5F5]">{formatCurrency(totalWealth, currency)}</p>
        <div className="flex gap-4 mt-3">
          <div className="flex-1 p-2 rounded-lg bg-[#22C55E]/10">
            <p className="text-[10px] text-[#9CA3AF]">Uang Tunai</p>
            <p className="text-sm font-semibold text-[#22C55E]">{formatCurrency(totalCash, currency)}</p>
          </div>
          <div className="flex-1 p-2 rounded-lg bg-[#3B82F6]/10">
            <p className="text-[10px] text-[#9CA3AF]">Investasi</p>
            <p className="text-sm font-semibold text-[#3B82F6]">{formatCurrency(totalInvestment, currency)}</p>
          </div>
        </div>
      </div>

      {/* Gain/Loss Card */}
      {investments.length > 0 && (
        <div className="mx-4 mt-3 p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#9CA3AF]">Total Gain/Loss</p>
              <p className={`text-lg font-bold ${totalGainLoss >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss, currency)}
              </p>
            </div>
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${totalGainLoss >= 0 ? 'bg-[#22C55E]/10' : 'bg-[#EF4444]/10'}`}>
              {totalGainLoss >= 0 ? <TrendingUp size={14} className="text-[#22C55E]" /> : <TrendingDown size={14} className="text-[#EF4444]" />}
              <span className={`text-sm font-semibold ${totalGainLoss >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Wealth Distribution Pie */}
      {wealthDistribution.length > 0 && (
        <div className="mx-4 mt-3 p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
          <h3 className="text-sm font-semibold text-[#F5F5F5] mb-3 flex items-center gap-2">
            <PieIcon size={14} /> Distribusi Kekayaan
          </h3>
          <PieChart data={wealthDistribution} size={150} />
        </div>
      )}

      {/* Investment Breakdown Pie */}
      {pieData.length > 0 && (
        <div className="mx-4 mt-3 p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
          <h3 className="text-sm font-semibold text-[#F5F5F5] mb-3">Breakdown Investasi</h3>
          <PieChart data={pieData} size={150} />
        </div>
      )}

      {/* Investment Assets List */}
      <div className="mx-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#F5F5F5]">Aset Investasi</h3>
          <button onClick={() => setShowAddAsset(true)} className="flex items-center gap-1 text-xs text-[#22C55E]">
            <Plus size={14} /> Tambah
          </button>
        </div>

        {investments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📈</div>
            <p className="text-[#F5F5F5] font-medium mb-1">Belum Ada Investasi</p>
            <p className="text-xs text-[#9CA3AF] mb-4">Catat aset investasimu untuk memantau performa portofolio.</p>
            <button onClick={() => setShowAddAsset(true)} className="py-2.5 px-5 rounded-xl bg-[#22C55E] text-white text-sm font-semibold">
              Tambah Investasi Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {Array.from(investmentsByType.entries()).map(([type, assets]) => (
              <div key={type}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{INVESTMENT_TYPES.find(t => t.type === type)?.icon}</span>
                  <span className="text-xs font-medium text-[#9CA3AF] uppercase">{INVESTMENT_TYPES.find(t => t.type === type)?.label}</span>
                  <span className="text-[10px] text-[#9CA3AF]">
                    {formatCurrency(assets.reduce((s, a) => s + a.currentValue, 0), currency)}
                  </span>
                </div>
                {assets.map(inv => {
                  const costBasis = inv.purchasePrice * inv.quantity;
                  const gainLoss = inv.currentValue - costBasis;
                  const glPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
                  return (
                    <div key={inv.uid} className="p-3 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] mb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#F5F5F5]">{inv.name}</p>
                          <p className="text-[10px] text-[#9CA3AF]">
                            {inv.quantity} unit × {formatCurrency(inv.purchasePrice, currency)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#F5F5F5]">{formatCurrency(inv.currentValue, currency)}</p>
                          <p className={`text-[10px] font-medium ${gainLoss >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                            {gainLoss >= 0 ? '+' : ''}{glPercent.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => { setShowUpdateValue(inv.uid); setNewValue(inv.currentValue.toString()); }}
                          className="flex-1 py-1.5 rounded-lg bg-[#262626] text-[10px] text-[#9CA3AF]">Update Nilai</button>
                        <button onClick={() => setShowAddTransaction(inv.uid)}
                          className="flex-1 py-1.5 rounded-lg bg-[#262626] text-[10px] text-[#9CA3AF]">Transaksi</button>
                        <button onClick={() => handleDeleteAsset(inv.uid)}
                          className="py-1.5 px-2 rounded-lg bg-[#EF4444]/10 text-[#EF4444]"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Asset Dialog */}
      {showAddAsset && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#2C2C2E] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#F5F5F5]">Tambah Investasi</h3>
              <button onClick={() => setShowAddAsset(false)}><X size={20} className="text-[#9CA3AF]" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nama aset (misal: BBCA, Bitcoin)"
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none" />
              <div>
                <label className="text-xs text-[#9CA3AF] mb-2 block">Jenis Investasi</label>
                <div className="grid grid-cols-4 gap-2">
                  {INVESTMENT_TYPES.map(t => (
                    <button key={t.type} onClick={() => setNewType(t.type)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl text-center ${newType === t.type ? 'bg-[#22C55E]/10 border border-[#22C55E]/30' : 'bg-[#262626] border border-[#2C2C2E]'}`}>
                      <span className="text-lg">{t.icon}</span>
                      <span className="text-[9px] text-[#9CA3AF]">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9CA3AF] mb-1 block">Harga Beli per Unit</label>
                <FormattedNumberInput value={newPurchasePrice} onChange={setNewPurchasePrice} placeholder="0" prefix="Rp" />
              </div>
              <div>
                <label className="text-xs text-[#9CA3AF] mb-1 block">Jumlah Unit</label>
                <FormattedNumberInput value={newQuantity} onChange={setNewQuantity} placeholder="1" />
              </div>
              <div>
                <label className="text-xs text-[#9CA3AF] mb-1 block">Nilai Saat Ini (Total)</label>
                <FormattedNumberInput value={newCurrentValue} onChange={setNewCurrentValue} placeholder="0" prefix="Rp" autoFocus />
              </div>
              <input type="date" value={newPurchaseDate} onChange={(e) => setNewPurchaseDate(e.target.value)}
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none" />
              <button onClick={handleAddAsset} disabled={!newName || !newCurrentValue}
                className="w-full py-3 rounded-xl bg-[#22C55E] text-white font-semibold text-sm disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Update Value Dialog */}
      {showUpdateValue && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#2C2C2E]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#F5F5F5]">Update Nilai</h3>
              <button onClick={() => setShowUpdateValue(null)}><X size={20} className="text-[#9CA3AF]" /></button>
            </div>
            <div>
              <label className="text-xs text-[#9CA3AF] mb-1 block">Nilai Saat Ini</label>
              <FormattedNumberInput value={newValue} onChange={setNewValue} placeholder="0" prefix="Rp" autoFocus />
            </div>
            <button onClick={() => handleUpdateValue(showUpdateValue)} disabled={!newValue}
              className="w-full py-3 rounded-xl bg-[#22C55E] text-white font-semibold text-sm mt-4 disabled:opacity-50">Update</button>
          </div>
        </div>
      )}

      {/* Add Transaction Dialog */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#2C2C2E]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#F5F5F5]">Transaksi Investasi</h3>
              <button onClick={() => setShowAddTransaction(null)}><X size={20} className="text-[#9CA3AF]" /></button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                {(['buy', 'sell', 'dividend'] as const).map(t => (
                  <button key={t} onClick={() => setTxType(t)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium ${txType === t ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30' : 'bg-[#262626] text-[#9CA3AF]'}`}>
                    {t === 'buy' ? 'Beli' : t === 'sell' ? 'Jual' : 'Dividen'}
                  </button>
                ))}
              </div>
              {txType !== 'dividend' && (
                <>
                  <div>
                    <label className="text-xs text-[#9CA3AF] mb-1 block">Jumlah Unit</label>
                    <FormattedNumberInput value={txQuantity} onChange={setTxQuantity} placeholder="0" />
                  </div>
                  <div>
                    <label className="text-xs text-[#9CA3AF] mb-1 block">Harga per Unit</label>
                    <FormattedNumberInput value={txPrice} onChange={setTxPrice} placeholder="0" prefix="Rp" />
                  </div>
                </>
              )}
              {txType === 'dividend' && (
                <div>
                  <label className="text-xs text-[#9CA3AF] mb-1 block">Jumlah Dividen</label>
                  <FormattedNumberInput value={txPrice} onChange={setTxPrice} placeholder="0" prefix="Rp" />
                </div>
              )}
              <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)}
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none" />
              <button onClick={() => handleAddTransaction(showAddTransaction)}
                disabled={txType !== 'dividend' ? (!txQuantity || !txPrice) : !txPrice}
                className="w-full py-3 rounded-xl bg-[#22C55E] text-white font-semibold text-sm disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}

      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  );
}
