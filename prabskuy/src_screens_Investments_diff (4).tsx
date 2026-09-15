--- src/screens/Investments.tsx (原始)
// Investment Screen - Track investment assets separately from cash
import React, { useState, useMemo } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { formatCurrency } from '../utils/formatters';
import { FormattedNumberInput, formattedToNumber } from '../components/FormattedNumberInput';
import { PieChart } from '../components/Charts';
import { hapticFeedback, showToast, Confetti } from '../components/UI';
import { EmojiPicker } from '../components/EmojiPicker';
import { Plus, Trash2, X, TrendingUp, TrendingDown, PieChart as PieIcon, Edit3, Smile, History } from 'lucide-react';
import type { InvestmentAsset } from '../db/dexie';

type InvestmentType = 'saham' | 'saham_id' | 'etf' | 'reksadana' | 'obligasi' | 'crypto' | 'emas' | 'properti' | 'deposito' | 'lainnya';

const INVESTMENT_TYPES: { type: InvestmentType; label: string; icon: string; group: string }[] = [
  { type: 'saham_id', label: 'Saham ID', icon: '🇮🇩', group: 'Saham' },
  { type: 'saham', label: 'Saham US', icon: '🇺🇸', group: 'Saham' },
  { type: 'etf', label: 'ETF', icon: '📊', group: 'Saham' },
  { type: 'reksadana', label: 'Reksadana', icon: '💼', group: 'Saham' },
  { type: 'obligasi', label: 'Obligasi', icon: '📜', group: 'Pendapatan Tetap' },
  { type: 'crypto', label: 'Crypto', icon: '₿', group: 'Digital' },
  { type: 'emas', label: 'Emas', icon: '🥇', group: 'Komoditas' },
  { type: 'properti', label: 'Properti', icon: '🏠', group: 'Properti' },
  { type: 'deposito', label: 'Deposito', icon: '🏦', group: 'Perbankan' },
  { type: 'lainnya', label: 'Lainnya', icon: '💎', group: 'Lainnya' },
];

const TYPE_COLORS: Record<InvestmentType, string> = {
  saham: '#22C55E',
  saham_id: '#EF4444',
  etf: '#3B82F6',
  reksadana: '#A855F7',
  obligasi: '#FB923C',
  crypto: '#EAB308',
  emas: '#F59E0B',
  properti: '#DC2626',
  deposito: '#06B6D4',
  lainnya: '#6B7280',
};

// Get unit label based on investment type
function getUnitLabel(type: InvestmentType): string {
  switch (type) {
    case 'saham_id': return 'lot';
    case 'emas': return 'gram';
    case 'crypto': return 'koin';
    default: return 'unit';
  }
}

// Calculate effective total for different types
function getEffectiveTotal(asset: InvestmentAsset): number {
  if (asset.type === 'saham_id') {
    return asset.quantity * 100; // 1 lot = 100 lembar
  }
  return asset.quantity;
}

export function Investments() {
  const { accounts, investments, investmentTransactions, settings, addInvestment, updateInvestment, deleteInvestment, addInvestmentTransaction } = useDatabase();
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [editingAsset, setEditingAsset] = useState<InvestmentAsset | null>(null);
  const [showUpdateValue, setShowUpdateValue] = useState<string | null>(null);
  const [showAddTransaction, setShowAddTransaction] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<InvestmentType>('saham_id');
  const [formPurchasePrice, setFormPurchasePrice] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formCurrentValue, setFormCurrentValue] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formIcon, setFormIcon] = useState('💎');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Deposito-specific fields
  const [formInterestPercent, setFormInterestPercent] = useState('');
  const [formDepositDuration, setFormDepositDuration] = useState('');
  const [formMaturityDate, setFormMaturityDate] = useState('');
  const [formAutoRenew, setFormAutoRenew] = useState(false);

  // Reksadana-specific fields
  const [formReturnPercent, setFormReturnPercent] = useState('');

  const [newValue, setNewValue] = useState('');
  const [txType, setTxType] = useState<'buy' | 'sell' | 'dividend' | 'interest' | 'renew'>('buy');
  const [txQuantity, setTxQuantity] = useState('');
  const [txPrice, setTxPrice] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [showConfetti, setShowConfetti] = useState(false);
  const currency = settings?.currency || 'IDR';

  // Calculate totals - including gain/loss
  const totalInvestment = useMemo(() => {
    return investments.reduce((sum, inv) => {
      const dividendGain = investmentTransactions
        .filter(t => t.assetUid === inv.uid && (t.type === 'dividend' || t.type === 'interest'))
        .reduce((s, t) => s + t.totalAmount, 0);
      return sum + inv.currentValue + dividendGain;
    }, 0);
  }, [investments, investmentTransactions]);

  const totalCash = useMemo(() => accounts.reduce((sum, acc) => sum + acc.openingBalance, 0), [accounts]);
  const totalWealth = totalCash + totalInvestment;

  // Calculate gains/losses
  const totalCostBasis = useMemo(() => {
    return investments.reduce((sum, inv) => {
      if (inv.type === 'saham_id') {
        return sum + (inv.purchasePrice * inv.quantity * 100);
      }
      return sum + (inv.purchasePrice * inv.quantity);
    }, 0);
  }, [investments]);

  const totalGainLoss = totalInvestment - totalCostBasis;
  const gainLossPercent = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

  // Investment breakdown by type
  const pieData = useMemo(() => {
    const byType = new Map<InvestmentType, number>();
    investments.forEach(inv => {
      const dividendGain = investmentTransactions
        .filter(t => t.assetUid === inv.uid && (t.type === 'dividend' || t.type === 'interest'))
        .reduce((s, t) => s + t.totalAmount, 0);
      byType.set(inv.type, (byType.get(inv.type) || 0) + inv.currentValue + dividendGain);
    });
    return Array.from(byType.entries()).map(([type, value]) => ({
      label: INVESTMENT_TYPES.find(t => t.type === type)?.label || type,
      value,
      color: TYPE_COLORS[type],
      icon: INVESTMENT_TYPES.find(t => t.type === type)?.icon,
    }));
  }, [investments, investmentTransactions]);

  // Group investments by type
  const investmentsByType = useMemo(() => {
    const groups = new Map<InvestmentType, typeof investments>();
    investments.forEach(inv => {
      const existing = groups.get(inv.type) || [];
      groups.set(inv.type, [...existing, inv]);
    });
    return groups;
  }, [investments]);

  const resetForm = () => {
    setFormName(''); setFormType('saham_id'); setFormPurchasePrice('');
    setFormQuantity(''); setFormCurrentValue(''); setFormNotes('');
    setFormPurchaseDate(new Date().toISOString().split('T')[0]);
    setFormIcon('💎'); setShowEmojiPicker(false);
    setFormInterestPercent(''); setFormDepositDuration('');
    setFormMaturityDate(''); setFormAutoRenew(false);
    setFormReturnPercent('');
  };

  const openEditForm = (asset: InvestmentAsset) => {
    setEditingAsset(asset);
    setFormName(asset.name);
    setFormType(asset.type);
    setFormPurchasePrice(asset.purchasePrice.toString());
    setFormQuantity(asset.quantity.toString());
    setFormCurrentValue(asset.currentValue.toString());
    setFormPurchaseDate(asset.purchaseDate);
    setFormNotes(asset.notes || '');
    setFormIcon(asset.icon);
    setFormInterestPercent(asset.interestPercent?.toString() || '');
    setFormDepositDuration(asset.depositDuration?.toString() || '');
    setFormMaturityDate(asset.maturityDate || '');
    setFormAutoRenew(asset.autoRenew || false);
    setFormReturnPercent(asset.returnPercent?.toString() || '');
    setShowAddAsset(true);
  };

  const handleSaveAsset = async () => {
    if (!formName || !formCurrentValue) return;

    // Parse values - handle decimals for gold and crypto
    let currentVal: number;
    let purchasePrice: number;
    let quantity: number;

    if (formType === 'emas' || formType === 'crypto') {
      // Allow decimals for gold (grams) and crypto
      currentVal = parseFloat(formCurrentValue) || 0;
      purchasePrice = parseFloat(formPurchasePrice) || currentVal;
      quantity = parseFloat(formQuantity) || 1;
    } else {
      currentVal = formattedToNumber(formCurrentValue);
      purchasePrice = formattedToNumber(formPurchasePrice) || currentVal;
      quantity = formattedToNumber(formQuantity) || 1;
    }

    const isIDX = formType === 'saham_id';

    const assetData: any = {
      name: formName,
      type: formType,
      icon: formIcon,
      purchasePrice,
      quantity,
      currentValue: currentVal,
      purchaseDate: formPurchaseDate,
      notes: formNotes || undefined,
      market: isIDX ? 'IDX' : 'GLOBAL',
    };

    // Add type-specific fields
    if (formType === 'deposito') {
      assetData.interestPercent = parseFloat(formInterestPercent) || 0;
      assetData.depositDuration = parseInt(formDepositDuration) || 0;
      assetData.maturityDate = formMaturityDate || undefined;
      assetData.autoRenew = formAutoRenew;
    }

    if (formType === 'reksadana') {
      assetData.returnPercent = parseFloat(formReturnPercent) || 0;
    }

    if (editingAsset) {
      await updateInvestment(editingAsset.uid, assetData);
      showToast({ message: 'Investasi diperbarui', type: 'success' });
    } else {
      await addInvestment(assetData);
      showToast({ message: 'Aset investasi ditambahkan', type: 'success' });
    }

    setShowAddAsset(false);
    setEditingAsset(null);
    resetForm();
    hapticFeedback('medium');
  };

  const handleUpdateValue = async (assetUid: string) => {
    let val: number;
    const asset = investments.find(i => i.uid === assetUid);

    if (asset && (asset.type === 'emas' || asset.type === 'crypto')) {
      val = parseFloat(newValue) || 0;
    } else {
      val = formattedToNumber(newValue);
    }

    if (!val) return;
    await updateInvestment(assetUid, { currentValue: val });
    setShowUpdateValue(null);
    setNewValue('');
    hapticFeedback('light');
    showToast({ message: 'Nilai aset diperbarui', type: 'success' });
  };

  const handleAddTransaction = async (assetUid: string) => {
    let qty: number;
    let price: number;
    const asset = investments.find(i => i.uid === assetUid);

    if (asset && (asset.type === 'emas' || asset.type === 'crypto')) {
      qty = parseFloat(txQuantity) || 0;
      price = parseFloat(txPrice) || 0;
    } else {
      qty = formattedToNumber(txQuantity);
      price = formattedToNumber(txPrice);
    }

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
    if (txType === 'dividend' || txType === 'interest') setShowConfetti(true);
    showToast({ message: `Transaksi ${txType} dicatat`, type: 'success' });
  };

  const handleDeleteAsset = async (uid: string) => {
    await deleteInvestment(uid);
    hapticFeedback('medium');
    showToast({ message: 'Aset dihapus', type: 'info' });
  };

  // Format quantity display based on type
  const formatQuantity = (asset: InvestmentAsset): string => {
    if (asset.type === 'emas') {
      return `${asset.quantity.toFixed(3)} gram`;
    }
    if (asset.type === 'crypto') {
      return `${asset.quantity.toFixed(8)} koin`;
    }
    if (asset.type === 'saham_id') {
      return `${asset.quantity} lot (${asset.quantity * 100} lembar)`;
    }
    return `${asset.quantity} ${getUnitLabel(asset.type)}`;
  };

  return (
    <div className="flex-1 overflow-y-auto pb-4">
      {/* Total Wealth Card */}
      <div className="mx-4 mt-2 p-5 rounded-2xl bg-gradient-to-br from-[#3B82F6]/20 to-[#22C55E]/10 border border-[#3B82F6]/20">
        <p className="text-[#9CA3AF] text-xs mb-1">Total Kekayaan</p>
        <p className="text-2xl font-bold text-[#F5F5F5]">{formatCurrency(totalWealth, currency)}</p>
        <p className="text-[10px] text-[#9CA3AF] mt-1">Termasuk gain/loss investasi</p>
        <div className="flex gap-3 mt-3">
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

      {/* Investment History */}
      {investmentTransactions.length > 0 && (
        <div className="mx-4 mt-3">
          <h3 className="text-sm font-semibold text-[#F5F5F5] mb-2 flex items-center gap-2">
            <History size={14} /> Riwayat Investasi
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {investmentTransactions.slice(0, 20).map(tx => {
              const asset = investments.find(i => i.uid === tx.assetUid);
              return (
                <div key={tx.uid} className="p-3 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#F5F5F5]">{asset?.name || 'Unknown'}</p>
                      <p className="text-[10px] text-[#9CA3AF]">
                        {tx.type === 'buy' && 'Beli'}
                        {tx.type === 'sell' && 'Jual'}
                        {tx.type === 'dividend' && 'Dividen'}
                        {tx.type === 'interest' && 'Bunga'}
                        {tx.type === 'renew' && 'Perpanjangan'}
                        {' • '}{tx.date}
                      </p>
                    </div>
                    <p className={`text-sm font-bold ${
                      tx.type === 'buy' ? 'text-[#FB923C]' :
                      tx.type === 'sell' ? 'text-[#3B82F6]' :
                      'text-[#22C55E]'
                    }`}>
                      {tx.type === 'buy' ? '-' : '+'}{formatCurrency(tx.totalAmount, currency)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
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
          <button onClick={() => { resetForm(); setEditingAsset(null); setShowAddAsset(true); }} className="flex items-center gap-1 text-xs text-[#22C55E]">
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
                </div>
                {assets.map(inv => {
                  const isIDX = inv.type === 'saham_id';
                  const costBasis = isIDX ? (inv.purchasePrice * inv.quantity * 100) : (inv.purchasePrice * inv.quantity);
                  const dividendGain = investmentTransactions
                    .filter(t => t.assetUid === inv.uid && (t.type === 'dividend' || t.type === 'interest'))
                    .reduce((s, t) => s + t.totalAmount, 0);
                  const gainLoss = (inv.currentValue + dividendGain) - costBasis;
                  const glPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

                  return (
                    <div key={inv.uid} className="p-3 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] mb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[#F5F5F5]">{inv.name}</p>
                            {isIDX && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#EF4444]/10 text-[#EF4444]">IDX</span>}
                          </div>
                          <p className="text-[10px] text-[#9CA3AF]">{formatQuantity(inv)}</p>
                          {inv.type === 'deposito' && inv.maturityDate && (
                            <p className="text-[10px] text-[#06B6D4]">Jatuh tempo: {inv.maturityDate}</p>
                          )}
                          {inv.notes && <p className="text-[10px] text-[#9CA3AF] italic mt-0.5">"{inv.notes}"</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#F5F5F5]">{formatCurrency(inv.currentValue + dividendGain, currency)}</p>
                          <p className={`text-[10px] font-medium ${gainLoss >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                            {gainLoss >= 0 ? '+' : ''}{glPercent.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => openEditForm(inv)}
                          className="flex-1 py-1.5 rounded-lg bg-[#262626] text-[10px] text-[#9CA3AF] flex items-center justify-center gap-1">
                          <Edit3 size={10} /> Edit
                        </button>
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

      {/* Add/Edit Asset Dialog */}
      {showAddAsset && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#2C2C2E] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#F5F5F5]">{editingAsset ? 'Edit Investasi' : 'Tambah Investasi'}</h3>
              <button onClick={() => { setShowAddAsset(false); setEditingAsset(null); resetForm(); }}><X size={20} className="text-[#9CA3AF]" /></button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nama aset"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none" />
                <button onClick={() => setShowEmojiPicker(true)} className="px-3 rounded-xl bg-[#262626] border border-[#2C2C2E]">
                  <Smile size={16} className="text-[#9CA3AF]" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9CA3AF]">Icon:</span>
                <button onClick={() => setShowEmojiPicker(true)} className="text-2xl p-2 rounded-lg bg-[#262626] border border-[#2C2C2E]">
                  {formIcon}
                </button>
              </div>

              <div>
                <label className="text-xs text-[#9CA3AF] mb-2 block">Jenis Investasi</label>
                <div className="grid grid-cols-5 gap-2">
                  {INVESTMENT_TYPES.map(t => (
                    <button key={t.type} onClick={() => setFormType(t.type)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl text-center ${formType === t.type ? 'bg-[#22C55E]/10 border border-[#22C55E]/30' : 'bg-[#262626] border border-[#2C2C2E]'}`}>
                      <span className="text-lg">{t.icon}</span>
                      <span className="text-[8px] text-[#9CA3AF]">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {formType === 'saham_id' && (
                <div className="p-3 rounded-xl bg-[#EF4444]/5 border border-[#EF4444]/20">
                  <p className="text-[10px] text-[#EF4444] font-medium mb-1">🇮🇩 Saham Indonesia (IDX)</p>
                  <p className="text-[10px] text-[#9CA3AF]">1 lot = 100 lembar</p>
                </div>
              )}

              {formType === 'emas' && (
                <div className="p-3 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/20">
                  <p className="text-[10px] text-[#F59E0B] font-medium mb-1">🥇 Emas</p>
                  <p className="text-[10px] text-[#9CA3AF]">Satuan dalam gram (bisa desimal, contoh: 0.5 gram)</p>
                </div>
              )}

              {formType === 'crypto' && (
                <div className="p-3 rounded-xl bg-[#EAB308]/5 border border-[#EAB308]/20">
                  <p className="text-[10px] text-[#EAB308] font-medium mb-1">₿ Crypto</p>
                  <p className="text-[10px] text-[#9CA3AF]">Bisa input desimal (contoh: 0.0001 BTC)</p>
                </div>
              )}

              <div>
                <label className="text-xs text-[#9CA3AF] mb-1 block">
                  Harga per {formType === 'saham_id' ? 'Lembar' : formType === 'emas' ? 'Gram' : formType === 'crypto' ? 'Koin' : 'Unit'}
                </label>
                <input
                  type="number"
                  step={formType === 'emas' || formType === 'crypto' ? '0.0001' : '1'}
                  value={formPurchasePrice}
                  onChange={(e) => setFormPurchasePrice(e.target.value)}
                  placeholder="0"
                  className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-[#9CA3AF] mb-1 block">
                  Jumlah {getUnitLabel(formType).charAt(0).toUpperCase() + getUnitLabel(formType).slice(1)}
                </label>
                <input
                  type="number"
                  step={formType === 'emas' || formType === 'crypto' ? '0.0001' : '1'}
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(e.target.value)}
                  placeholder="1"
                  className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
                />
                {formType === 'saham_id' && formQuantity && (
                  <p className="text-[10px] text-[#9CA3AF] mt-1">= {parseFloat(formQuantity) * 100} lembar</p>
                )}
              </div>

              <div>
                <label className="text-xs text-[#9CA3AF] mb-1 block">Nilai Saat Ini (Total)</label>
                <input
                  type="number"
                  step={formType === 'emas' || formType === 'crypto' ? '0.01' : '1'}
                  value={formCurrentValue}
                  onChange={(e) => setFormCurrentValue(e.target.value)}
                  placeholder="0"
                  className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
                />
              </div>

              {/* Deposito-specific fields */}
              {formType === 'deposito' && (
                <>
                  <div>
                    <label className="text-xs text-[#9CA3AF] mb-1 block">Bunga per Tahun (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formInterestPercent}
                      onChange={(e) => setFormInterestPercent(e.target.value)}
                      placeholder="5.00"
                      className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#9CA3AF] mb-1 block">Lama Deposito (hari)</label>
                    <input
                      type="number"
                      value={formDepositDuration}
                      onChange={(e) => setFormDepositDuration(e.target.value)}
                      placeholder="30"
                      className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#9CA3AF] mb-1 block">Tanggal Jatuh Tempo</label>
                    <input
                      type="date"
                      value={formMaturityDate}
                      onChange={(e) => setFormMaturityDate(e.target.value)}
                      className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                    <input type="checkbox" checked={formAutoRenew} onChange={(e) => setFormAutoRenew(e.target.checked)} className="rounded" />
                    Auto perpanjang saat jatuh tempo
                  </label>
                </>
              )}

              {/* Reksadana-specific fields */}
              {formType === 'reksadana' && (
                <div>
                  <label className="text-xs text-[#9CA3AF] mb-1 block">Return (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formReturnPercent}
                    onChange={(e) => setFormReturnPercent(e.target.value)}
                    placeholder="10.00"
                    className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
                  />
                </div>
              )}

              <input type="date" value={formPurchaseDate} onChange={(e) => setFormPurchaseDate(e.target.value)}
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none" />

              <input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Catatan (opsional)"
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none" />

              <button onClick={handleSaveAsset} disabled={!formName || !formCurrentValue}
                className="w-full py-3 rounded-xl bg-[#22C55E] text-white font-semibold text-sm disabled:opacity-50">
                {editingAsset ? 'Simpan Perubahan' : 'Tambah Aset'}
              </button>
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
              <input
                type="number"
                step="0.01"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="0"
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
                autoFocus
              />
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
              <div className="flex gap-2 flex-wrap">
                {(['buy', 'sell', 'dividend', 'interest', 'renew'] as const).map(t => (
                  <button key={t} onClick={() => setTxType(t)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium ${txType === t ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30' : 'bg-[#262626] text-[#9CA3AF]'}`}>
                    {t === 'buy' ? 'Beli' : t === 'sell' ? 'Jual' : t === 'dividend' ? 'Dividen' : t === 'interest' ? 'Bunga' : 'Perpanjang'}
                  </button>
                ))}
              </div>
              {(txType === 'buy' || txType === 'sell') && (
                <>
                  <div>
                    <label className="text-xs text-[#9CA3AF] mb-1 block">Jumlah</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={txQuantity}
                      onChange={(e) => setTxQuantity(e.target.value)}
                      placeholder="0"
                      className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#9CA3AF] mb-1 block">Harga per Unit</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={txPrice}
                      onChange={(e) => setTxPrice(e.target.value)}
                      placeholder="0"
                      className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
                    />
                  </div>
                </>
              )}
              {(txType === 'dividend' || txType === 'interest' || txType === 'renew') && (
                <div>
                  <label className="text-xs text-[#9CA3AF] mb-1 block">Jumlah</label>
                  <input
                    type="number"
                    step="0.01"
                    value={txPrice}
                    onChange={(e) => setTxPrice(e.target.value)}
                    placeholder="0"
                    className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
                  />
                </div>
              )}
              <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)}
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none" />
              <button onClick={() => handleAddTransaction(showAddTransaction)}
                disabled={(txType === 'buy' || txType === 'sell') ? (!txQuantity || !txPrice) : !txPrice}
                className="w-full py-3 rounded-xl bg-[#22C55E] text-white font-semibold text-sm disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <EmojiPicker
          onSelect={(emoji) => setFormIcon(emoji)}
          onClose={() => setShowEmojiPicker(false)}
          currentEmoji={formIcon}
        />
      )}

      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  );
}

// Standalone Investment Form (used by FAB when on investment tab)
export function InvestmentForm({ onClose }: { onClose: () => void }) {
  return <Investments />;
}


+++ src/screens/Investments.tsx (修改后)
// Investment Screen - Track investment assets separately from cash
import React, { useState, useMemo } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { formatCurrency } from '../utils/formatters';
import { FormattedNumberInput, formattedToNumber } from '../components/FormattedNumberInput';
import { PieChart } from '../components/Charts';
import { hapticFeedback, showToast, Confetti } from '../components/UI';
import { EmojiPicker } from '../components/EmojiPicker';
import { Plus, Trash2, X, TrendingUp, TrendingDown, PieChart as PieIcon, Edit3, Smile, History } from 'lucide-react';
import type { InvestmentAsset } from '../db/dexie';

type InvestmentType = 'saham' | 'saham_id' | 'etf' | 'reksadana' | 'obligasi' | 'crypto' | 'emas' | 'properti' | 'deposito' | 'lainnya';

const INVESTMENT_TYPES: { type: InvestmentType; label: string; icon: string; group: string }[] = [
  { type: 'saham_id', label: 'Saham ID', icon: '🇮🇩', group: 'Saham' },
  { type: 'saham', label: 'Saham US', icon: '🇺🇸', group: 'Saham' },
  { type: 'etf', label: 'ETF', icon: '📊', group: 'Saham' },
  { type: 'reksadana', label: 'Reksadana', icon: '💼', group: 'Saham' },
  { type: 'obligasi', label: 'Obligasi', icon: '📜', group: 'Pendapatan Tetap' },
  { type: 'crypto', label: 'Crypto', icon: '₿', group: 'Digital' },
  { type: 'emas', label: 'Emas', icon: '🥇', group: 'Komoditas' },
  { type: 'properti', label: 'Properti', icon: '🏠', group: 'Properti' },
  { type: 'deposito', label: 'Deposito', icon: '🏦', group: 'Perbankan' },
  { type: 'lainnya', label: 'Lainnya', icon: '💎', group: 'Lainnya' },
];

const TYPE_COLORS: Record<InvestmentType, string> = {
  saham: '#22C55E',
  saham_id: '#EF4444',
  etf: '#3B82F6',
  reksadana: '#A855F7',
  obligasi: '#FB923C',
  crypto: '#EAB308',
  emas: '#F59E0B',
  properti: '#DC2626',
  deposito: '#06B6D4',
  lainnya: '#6B7280',
};

// Get unit label based on investment type
function getUnitLabel(type: InvestmentType): string {
  switch (type) {
    case 'saham_id': return 'lot';
    case 'emas': return 'gram';
    case 'crypto': return 'koin';
    default: return 'unit';
  }
}

// Calculate effective total for different types
function getEffectiveTotal(asset: InvestmentAsset): number {
  if (asset.type === 'saham_id') {
    return asset.quantity * 100; // 1 lot = 100 lembar
  }
  return asset.quantity;
}

export function Investments() {
  const { accounts, investments, investmentTransactions, settings, addInvestment, updateInvestment, deleteInvestment, addInvestmentTransaction } = useDatabase();
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [editingAsset, setEditingAsset] = useState<InvestmentAsset | null>(null);
  const [showUpdateValue, setShowUpdateValue] = useState<string | null>(null);
  const [showAddTransaction, setShowAddTransaction] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<InvestmentType>('saham_id');
  const [formPurchasePrice, setFormPurchasePrice] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formCurrentValue, setFormCurrentValue] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formIcon, setFormIcon] = useState('💎');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Deposito-specific fields
  const [formInterestPercent, setFormInterestPercent] = useState('');
  const [formDepositDuration, setFormDepositDuration] = useState('');
  const [formMaturityDate, setFormMaturityDate] = useState('');
  const [formAutoRenew, setFormAutoRenew] = useState(false);

  // Reksadana-specific fields
  const [formReturnPercent, setFormReturnPercent] = useState('');

  const [newValue, setNewValue] = useState('');
  const [txType, setTxType] = useState<'buy' | 'sell' | 'dividend' | 'interest' | 'renew'>('buy');
  const [txQuantity, setTxQuantity] = useState('');
  const [txPrice, setTxPrice] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [showConfetti, setShowConfetti] = useState(false);
  const currency = settings?.currency || 'IDR';

  // Calculate totals - including gain/loss
  const totalInvestment = useMemo(() => {
    return investments.reduce((sum, inv) => {
      const dividendGain = investmentTransactions
        .filter(t => t.assetUid === inv.uid && (t.type === 'dividend' || t.type === 'interest'))
        .reduce((s, t) => s + t.totalAmount, 0);
      return sum + inv.currentValue + dividendGain;
    }, 0);
  }, [investments, investmentTransactions]);

  const totalCash = useMemo(() => accounts.reduce((sum, acc) => sum + acc.openingBalance, 0), [accounts]);
  const totalWealth = totalCash + totalInvestment;

  // Calculate gains/losses
  const totalCostBasis = useMemo(() => {
    return investments.reduce((sum, inv) => {
      if (inv.type === 'saham_id') {
        return sum + (inv.purchasePrice * inv.quantity * 100);
      }
      return sum + (inv.purchasePrice * inv.quantity);
    }, 0);
  }, [investments]);

  const totalGainLoss = totalInvestment - totalCostBasis;
  const gainLossPercent = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

  // Investment breakdown by type
  const pieData = useMemo(() => {
    const byType = new Map<InvestmentType, number>();
    investments.forEach(inv => {
      const dividendGain = investmentTransactions
        .filter(t => t.assetUid === inv.uid && (t.type === 'dividend' || t.type === 'interest'))
        .reduce((s, t) => s + t.totalAmount, 0);
      byType.set(inv.type, (byType.get(inv.type) || 0) + inv.currentValue + dividendGain);
    });
    return Array.from(byType.entries()).map(([type, value]) => ({
      label: INVESTMENT_TYPES.find(t => t.type === type)?.label || type,
      value,
      color: TYPE_COLORS[type],
      icon: INVESTMENT_TYPES.find(t => t.type === type)?.icon,
    }));
  }, [investments, investmentTransactions]);

  // Group investments by type
  const investmentsByType = useMemo(() => {
    const groups = new Map<InvestmentType, typeof investments>();
    investments.forEach(inv => {
      const existing = groups.get(inv.type) || [];
      groups.set(inv.type, [...existing, inv]);
    });
    return groups;
  }, [investments]);

  const resetForm = () => {
    setFormName(''); setFormType('saham_id'); setFormPurchasePrice('');
    setFormQuantity(''); setFormCurrentValue(''); setFormNotes('');
    setFormPurchaseDate(new Date().toISOString().split('T')[0]);
    setFormIcon('💎'); setShowEmojiPicker(false);
    setFormInterestPercent(''); setFormDepositDuration('');
    setFormMaturityDate(''); setFormAutoRenew(false);
    setFormReturnPercent('');
  };

  const openEditForm = (asset: InvestmentAsset) => {
    setEditingAsset(asset);
    setFormName(asset.name);
    setFormType(asset.type);
    setFormPurchasePrice(asset.purchasePrice.toString());
    setFormQuantity(asset.quantity.toString());
    setFormCurrentValue(asset.currentValue.toString());
    setFormPurchaseDate(asset.purchaseDate);
    setFormNotes(asset.notes || '');
    setFormIcon(asset.icon);
    setFormInterestPercent(asset.interestPercent?.toString() || '');
    setFormDepositDuration(asset.depositDuration?.toString() || '');
    setFormMaturityDate(asset.maturityDate || '');
    setFormAutoRenew(asset.autoRenew || false);
    setFormReturnPercent(asset.returnPercent?.toString() || '');
    setShowAddAsset(true);
  };

  const handleSaveAsset = async () => {
    if (!formName || !formCurrentValue) return;

    // Parse values - handle decimals for gold and crypto
    let currentVal: number;
    let purchasePrice: number;
    let quantity: number;

    if (formType === 'emas' || formType === 'crypto') {
      // Allow decimals for gold (grams) and crypto
      currentVal = parseFloat(formCurrentValue) || 0;
      purchasePrice = parseFloat(formPurchasePrice) || currentVal;
      quantity = parseFloat(formQuantity) || 1;
    } else {
      currentVal = formattedToNumber(formCurrentValue);
      purchasePrice = formattedToNumber(formPurchasePrice) || currentVal;
      quantity = formattedToNumber(formQuantity) || 1;
    }

    const isIDX = formType === 'saham_id';

    const assetData: any = {
      name: formName,
      type: formType,
      icon: formIcon,
      purchasePrice,
      quantity,
      currentValue: currentVal,
      purchaseDate: formPurchaseDate,
      notes: formNotes || undefined,
      market: isIDX ? 'IDX' : 'GLOBAL',
    };

    // Add type-specific fields
    if (formType === 'deposito') {
      assetData.interestPercent = parseFloat(formInterestPercent) || 0;
      assetData.depositDuration = parseInt(formDepositDuration) || 0;
      assetData.maturityDate = formMaturityDate || undefined;
      assetData.autoRenew = formAutoRenew;
    }

    if (formType === 'reksadana') {
      assetData.returnPercent = parseFloat(formReturnPercent) || 0;
    }

    if (editingAsset) {
      await updateInvestment(editingAsset.uid, assetData);
      showToast({ message: 'Investasi diperbarui', type: 'success' });
    } else {
      await addInvestment(assetData);
      showToast({ message: 'Aset investasi ditambahkan', type: 'success' });
    }

    setShowAddAsset(false);
    setEditingAsset(null);
    resetForm();
    hapticFeedback('medium');
  };

  const handleUpdateValue = async (assetUid: string) => {
    let val: number;
    const asset = investments.find(i => i.uid === assetUid);

    if (asset && (asset.type === 'emas' || asset.type === 'crypto')) {
      val = parseFloat(newValue) || 0;
    } else {
      val = formattedToNumber(newValue);
    }

    if (!val) return;
    await updateInvestment(assetUid, { currentValue: val });
    setShowUpdateValue(null);
    setNewValue('');
    hapticFeedback('light');
    showToast({ message: 'Nilai aset diperbarui', type: 'success' });
  };

  const handleAddTransaction = async (assetUid: string) => {
    let qty: number;
    let price: number;
    const asset = investments.find(i => i.uid === assetUid);

    if (asset && (asset.type === 'emas' || asset.type === 'crypto')) {
      qty = parseFloat(txQuantity) || 0;
      price = parseFloat(txPrice) || 0;
    } else {
      qty = formattedToNumber(txQuantity);
      price = formattedToNumber(txPrice);
    }

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
    if (txType === 'dividend' || txType === 'interest') setShowConfetti(true);
    showToast({ message: `Transaksi ${txType} dicatat`, type: 'success' });
  };

  const handleDeleteAsset = async (uid: string) => {
    await deleteInvestment(uid);
    hapticFeedback('medium');
    showToast({ message: 'Aset dihapus', type: 'info' });
  };

  // Format quantity display based on type
  const formatQuantity = (asset: InvestmentAsset): string => {
    if (asset.type === 'emas') {
      return `${asset.quantity.toFixed(3)} gram`;
    }
    if (asset.type === 'crypto') {
      return `${asset.quantity.toFixed(8)} koin`;
    }
    if (asset.type === 'saham_id') {
      return `${asset.quantity} lot (${asset.quantity * 100} lembar)`;
    }
    return `${asset.quantity} ${getUnitLabel(asset.type)}`;
  };

  return (
    <div className="flex-1 overflow-y-auto pb-4">
      {/* Total Wealth + Gain/Loss Card */}
      <div className="mx-4 mt-2 p-5 rounded-2xl bg-gradient-to-br from-[#3B82F6]/20 to-[#22C55E]/10 border border-[#3B82F6]/20">
        <p className="text-[#9CA3AF] text-xs mb-1">Total Kekayaan</p>
        <p className="text-2xl font-bold text-[#F5F5F5]">{formatCurrency(totalWealth, currency)}</p>
        <p className="text-[10px] text-[#9CA3AF] mt-1">Termasuk gain/loss investasi</p>
        <div className="flex gap-3 mt-3">
          <div className="flex-1 p-2 rounded-lg bg-[#22C55E]/10">
            <p className="text-[10px] text-[#9CA3AF]">Uang Tunai</p>
            <p className="text-sm font-semibold text-[#22C55E]">{formatCurrency(totalCash, currency)}</p>
          </div>
          <div className="flex-1 p-2 rounded-lg bg-[#3B82F6]/10">
            <p className="text-[10px] text-[#9CA3AF]">Investasi</p>
            <p className="text-sm font-semibold text-[#3B82F6]">{formatCurrency(totalInvestment, currency)}</p>
          </div>
        </div>

        {/* Gain/Loss Section */}
        {investments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#2C2C2E]">
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
      </div>

      {/* Investment History Table */}
      {investmentTransactions.length > 0 && (
        <div className="mx-4 mt-3">
          <h3 className="text-sm font-semibold text-[#F5F5F5] mb-2 flex items-center gap-2">
            <History size={14} /> Riwayat Investasi
          </h3>
          <div className="rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-5 gap-2 px-3 py-2 bg-[#262626] text-[10px] font-semibold text-[#9CA3AF] border-b border-[#2C2C2E]">
              <div>Tanggal</div>
              <div>Jenis</div>
              <div>Nama Aset</div>
              <div className="text-right">Jumlah</div>
              <div className="text-right">Harga</div>
            </div>

            {/* Table Body - Scrollable */}
            <div className="max-h-80 overflow-y-auto">
              {investmentTransactions.map(tx => {
                const asset = investments.find(i => i.uid === tx.assetUid);
                const assetType = asset?.type || 'lainnya';

                // Format quantity based on asset type
                const formatQuantity = () => {
                  if (assetType === 'saham_id' || assetType === 'saham') {
                    return `${tx.quantity} lot`;
                  } else if (assetType === 'etf') {
                    return `${tx.quantity} shares`;
                  } else if (assetType === 'crypto') {
                    return `${tx.quantity.toFixed(8)} coin`;
                  } else if (assetType === 'emas') {
                    return `${tx.quantity.toFixed(3)} gram`;
                  } else if (assetType === 'reksadana' || assetType === 'deposito') {
                    return formatCurrency(tx.totalAmount, currency);
                  }
                  return `${tx.quantity} unit`;
                };

                return (
                  <div key={tx.uid} className="grid grid-cols-5 gap-2 px-3 py-2.5 border-b border-[#2C2C2E] hover:bg-[#262626] transition-colors">
                    <div className="text-[11px] text-[#9CA3AF]">{tx.date}</div>
                    <div className="text-[11px]">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                        tx.type === 'buy' ? 'bg-[#FB923C]/10 text-[#FB923C]' :
                        tx.type === 'sell' ? 'bg-[#3B82F6]/10 text-[#3B82F6]' :
                        tx.type === 'dividend' ? 'bg-[#22C55E]/10 text-[#22C55E]' :
                        tx.type === 'interest' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' :
                        'bg-[#A855F7]/10 text-[#A855F7]'
                      }`}>
                        {tx.type === 'buy' ? 'Beli' :
                         tx.type === 'sell' ? 'Jual' :
                         tx.type === 'dividend' ? 'Dividen' :
                         tx.type === 'interest' ? 'Bunga' :
                         'Perpanjang'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#F5F5F5] truncate">{asset?.name || '-'}</div>
                    <div className="text-[11px] text-[#F5F5F5] text-right">{formatQuantity()}</div>
                    <div className="text-[11px] text-[#F5F5F5] text-right">{formatCurrency(tx.pricePerUnit, currency)}</div>
                  </div>
                );
              })}
            </div>
          </div>
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
          <button onClick={() => { resetForm(); setEditingAsset(null); setShowAddAsset(true); }} className="flex items-center gap-1 text-xs text-[#22C55E]">
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
                </div>
                {assets.map(inv => {
                  const isIDX = inv.type === 'saham_id';
                  const costBasis = isIDX ? (inv.purchasePrice * inv.quantity * 100) : (inv.purchasePrice * inv.quantity);
                  const dividendGain = investmentTransactions
                    .filter(t => t.assetUid === inv.uid && (t.type === 'dividend' || t.type === 'interest'))
                    .reduce((s, t) => s + t.totalAmount, 0);
                  const gainLoss = (inv.currentValue + dividendGain) - costBasis;
                  const glPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

                  return (
                    <div key={inv.uid} className="p-3 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] mb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[#F5F5F5]">{inv.name}</p>
                            {isIDX && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#EF4444]/10 text-[#EF4444]">IDX</span>}
                          </div>
                          <p className="text-[10px] text-[#9CA3AF]">{formatQuantity(inv)}</p>
                          {inv.type === 'deposito' && inv.maturityDate && (
                            <p className="text-[10px] text-[#06B6D4]">Jatuh tempo: {inv.maturityDate}</p>
                          )}
                          {inv.notes && <p className="text-[10px] text-[#9CA3AF] italic mt-0.5">"{inv.notes}"</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#F5F5F5]">{formatCurrency(inv.currentValue + dividendGain, currency)}</p>
                          <p className={`text-[10px] font-medium ${gainLoss >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                            {gainLoss >= 0 ? '+' : ''}{glPercent.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => openEditForm(inv)}
                          className="flex-1 py-1.5 rounded-lg bg-[#262626] text-[10px] text-[#9CA3AF] flex items-center justify-center gap-1">
                          <Edit3 size={10} /> Edit
                        </button>
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

      {/* Add/Edit Asset Dialog */}
      {showAddAsset && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#2C2C2E] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#F5F5F5]">{editingAsset ? 'Edit Investasi' : 'Tambah Investasi'}</h3>
              <button onClick={() => { setShowAddAsset(false); setEditingAsset(null); resetForm(); }}><X size={20} className="text-[#9CA3AF]" /></button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nama aset"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none" />
                <button onClick={() => setShowEmojiPicker(true)} className="px-3 rounded-xl bg-[#262626] border border-[#2C2C2E]">
                  <Smile size={16} className="text-[#9CA3AF]" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9CA3AF]">Icon:</span>
                <button onClick={() => setShowEmojiPicker(true)} className="text-2xl p-2 rounded-lg bg-[#262626] border border-[#2C2C2E]">
                  {formIcon}
                </button>
              </div>

              <div>
                <label className="text-xs text-[#9CA3AF] mb-2 block">Jenis Investasi</label>
                <div className="grid grid-cols-5 gap-2">
                  {INVESTMENT_TYPES.map(t => (
                    <button key={t.type} onClick={() => setFormType(t.type)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl text-center ${formType === t.type ? 'bg-[#22C55E]/10 border border-[#22C55E]/30' : 'bg-[#262626] border border-[#2C2C2E]'}`}>
                      <span className="text-lg">{t.icon}</span>
                      <span className="text-[8px] text-[#9CA3AF]">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {formType === 'saham_id' && (
                <div className="p-3 rounded-xl bg-[#EF4444]/5 border border-[#EF4444]/20">
                  <p className="text-[10px] text-[#EF4444] font-medium mb-1">🇮🇩 Saham Indonesia (IDX)</p>
                  <p className="text-[10px] text-[#9CA3AF]">1 lot = 100 lembar</p>
                </div>
              )}

              {formType === 'emas' && (
                <div className="p-3 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/20">
                  <p className="text-[10px] text-[#F59E0B] font-medium mb-1">🥇 Emas</p>
                  <p className="text-[10px] text-[#9CA3AF]">Satuan dalam gram (bisa desimal, contoh: 0.5 gram)</p>
                </div>
              )}

              {formType === 'crypto' && (
                <div className="p-3 rounded-xl bg-[#EAB308]/5 border border-[#EAB308]/20">
                  <p className="text-[10px] text-[#EAB308] font-medium mb-1">₿ Crypto</p>
                  <p className="text-[10px] text-[#9CA3AF]">Bisa input desimal (contoh: 0.0001 BTC)</p>
                </div>
              )}

              <div>
                <label className="text-xs text-[#9CA3AF] mb-1 block">
                  Harga per {formType === 'saham_id' ? 'Lembar' : formType === 'emas' ? 'Gram' : formType === 'crypto' ? 'Koin' : 'Unit'}
                </label>
                <input
                  type="number"
                  step={formType === 'emas' || formType === 'crypto' ? '0.0001' : '1'}
                  value={formPurchasePrice}
                  onChange={(e) => setFormPurchasePrice(e.target.value)}
                  placeholder="0"
                  className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-[#9CA3AF] mb-1 block">
                  Jumlah {getUnitLabel(formType).charAt(0).toUpperCase() + getUnitLabel(formType).slice(1)}
                </label>
                <input
                  type="number"
                  step={formType === 'emas' || formType === 'crypto' ? '0.0001' : '1'}
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(e.target.value)}
                  placeholder="1"
                  className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
                />
                {formType === 'saham_id' && formQuantity && (
                  <p className="text-[10px] text-[#9CA3AF] mt-1">= {parseFloat(formQuantity) * 100} lembar</p>
                )}
              </div>

              <div>
                <label className="text-xs text-[#9CA3AF] mb-1 block">Nilai Saat Ini (Total)</label>
                <input
                  type="number"
                  step={formType === 'emas' || formType === 'crypto' ? '0.01' : '1'}
                  value={formCurrentValue}
                  onChange={(e) => setFormCurrentValue(e.target.value)}
                  placeholder="0"
                  className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
                />
              </div>

              {/* Deposito-specific fields */}
              {formType === 'deposito' && (
                <>
                  <div>
                    <label className="text-xs text-[#9CA3AF] mb-1 block">Bunga per Tahun (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formInterestPercent}
                      onChange={(e) => setFormInterestPercent(e.target.value)}
                      placeholder="5.00"
                      className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#9CA3AF] mb-1 block">Lama Deposito (hari)</label>
                    <input
                      type="number"
                      value={formDepositDuration}
                      onChange={(e) => setFormDepositDuration(e.target.value)}
                      placeholder="30"
                      className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#9CA3AF] mb-1 block">Tanggal Jatuh Tempo</label>
                    <input
                      type="date"
                      value={formMaturityDate}
                      onChange={(e) => setFormMaturityDate(e.target.value)}
                      className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                    <input type="checkbox" checked={formAutoRenew} onChange={(e) => setFormAutoRenew(e.target.checked)} className="rounded" />
                    Auto perpanjang saat jatuh tempo
                  </label>
                </>
              )}

              {/* Reksadana-specific fields */}
              {formType === 'reksadana' && (
                <div>
                  <label className="text-xs text-[#9CA3AF] mb-1 block">Return (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formReturnPercent}
                    onChange={(e) => setFormReturnPercent(e.target.value)}
                    placeholder="10.00"
                    className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
                  />
                </div>
              )}

              <input type="date" value={formPurchaseDate} onChange={(e) => setFormPurchaseDate(e.target.value)}
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none" />

              <input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Catatan (opsional)"
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none" />

              <button onClick={handleSaveAsset} disabled={!formName || !formCurrentValue}
                className="w-full py-3 rounded-xl bg-[#22C55E] text-white font-semibold text-sm disabled:opacity-50">
                {editingAsset ? 'Simpan Perubahan' : 'Tambah Aset'}
              </button>
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
              <input
                type="number"
                step="0.01"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="0"
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
                autoFocus
              />
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
              <div className="flex gap-2 flex-wrap">
                {(['buy', 'sell', 'dividend', 'interest', 'renew'] as const).map(t => (
                  <button key={t} onClick={() => setTxType(t)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium ${txType === t ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30' : 'bg-[#262626] text-[#9CA3AF]'}`}>
                    {t === 'buy' ? 'Beli' : t === 'sell' ? 'Jual' : t === 'dividend' ? 'Dividen' : t === 'interest' ? 'Bunga' : 'Perpanjang'}
                  </button>
                ))}
              </div>
              {(txType === 'buy' || txType === 'sell') && (
                <>
                  <div>
                    <label className="text-xs text-[#9CA3AF] mb-1 block">Jumlah</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={txQuantity}
                      onChange={(e) => setTxQuantity(e.target.value)}
                      placeholder="0"
                      className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#9CA3AF] mb-1 block">Harga per Unit</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={txPrice}
                      onChange={(e) => setTxPrice(e.target.value)}
                      placeholder="0"
                      className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
                    />
                  </div>
                </>
              )}
              {(txType === 'dividend' || txType === 'interest' || txType === 'renew') && (
                <div>
                  <label className="text-xs text-[#9CA3AF] mb-1 block">Jumlah</label>
                  <input
                    type="number"
                    step="0.01"
                    value={txPrice}
                    onChange={(e) => setTxPrice(e.target.value)}
                    placeholder="0"
                    className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
                  />
                </div>
              )}
              <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)}
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none" />
              <button onClick={() => handleAddTransaction(showAddTransaction)}
                disabled={(txType === 'buy' || txType === 'sell') ? (!txQuantity || !txPrice) : !txPrice}
                className="w-full py-3 rounded-xl bg-[#22C55E] text-white font-semibold text-sm disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <EmojiPicker
          onSelect={(emoji) => setFormIcon(emoji)}
          onClose={() => setShowEmojiPicker(false)}
          currentEmoji={formIcon}
        />
      )}

      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  );
}

// Standalone Investment Form (used by FAB when on investment tab)
export function InvestmentForm({ onClose }: { onClose: () => void }) {
  const { addInvestment } = useDatabase();
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<InvestmentType>('saham_id');
  const [formPurchasePrice, setFormPurchasePrice] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formCurrentValue, setFormCurrentValue] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formIcon, setFormIcon] = useState('💎');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [formInterestPercent, setFormInterestPercent] = useState('');
  const [formDepositDuration, setFormDepositDuration] = useState('');
  const [formMaturityDate, setFormMaturityDate] = useState('');
  const [formAutoRenew, setFormAutoRenew] = useState(false);
  const [formReturnPercent, setFormReturnPercent] = useState('');

  const handleSave = async () => {
    if (!formName || !formCurrentValue) return;

    let currentVal: number;
    let purchasePrice: number;
    let quantity: number;

    if (formType === 'emas' || formType === 'crypto') {
      currentVal = parseFloat(formCurrentValue) || 0;
      purchasePrice = parseFloat(formPurchasePrice) || currentVal;
      quantity = parseFloat(formQuantity) || 1;
    } else {
      currentVal = formattedToNumber(formCurrentValue);
      purchasePrice = formattedToNumber(formPurchasePrice) || currentVal;
      quantity = formattedToNumber(formQuantity) || 1;
    }

    const isIDX = formType === 'saham_id';

    const assetData: any = {
      name: formName,
      type: formType,
      icon: formIcon,
      purchasePrice,
      quantity,
      currentValue: currentVal,
      purchaseDate: formPurchaseDate,
      notes: formNotes || undefined,
      market: isIDX ? 'IDX' : 'GLOBAL',
    };

    if (formType === 'deposito') {
      assetData.interestPercent = parseFloat(formInterestPercent) || 0;
      assetData.depositDuration = parseInt(formDepositDuration) || 0;
      assetData.maturityDate = formMaturityDate || undefined;
      assetData.autoRenew = formAutoRenew;
    }

    if (formType === 'reksadana') {
      assetData.returnPercent = parseFloat(formReturnPercent) || 0;
    }

    await addInvestment(assetData);
    hapticFeedback('medium');
    showToast({ message: 'Aset investasi ditambahkan', type: 'success' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#121212] z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#2C2C2E]">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#262626]"><X size={20} className="text-[#9CA3AF]" /></button>
        <h2 className="text-base font-semibold text-[#F5F5F5]">📈 Tambah Investasi</h2>
        <button onClick={handleSave} disabled={!formName || !formCurrentValue}
          className="px-4 py-2 rounded-xl bg-[#22C55E] text-white text-sm font-semibold disabled:opacity-50">Simpan</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="flex gap-2">
          <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nama aset (misal: BBCA, AAPL)"
            className="flex-1 py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none" autoFocus />
          <button onClick={() => setShowEmojiPicker(true)} className="px-3 rounded-xl bg-[#262626] border border-[#2C2C2E]" title="Pilih emoji">
            <Smile size={16} className="text-[#9CA3AF]" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#9CA3AF]">Icon:</span>
          <button onClick={() => setShowEmojiPicker(true)} className="text-2xl p-2 rounded-lg bg-[#1C1C1E] border border-[#2C2C2E]">
            {formIcon}
          </button>
        </div>

        <div>
          <label className="text-xs text-[#9CA3AF] mb-2 block">Jenis Investasi</label>
          <div className="grid grid-cols-5 gap-2">
            {INVESTMENT_TYPES.map(t => (
              <button key={t.type} onClick={() => setFormType(t.type)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-center ${formType === t.type ? 'bg-[#22C55E]/10 border border-[#22C55E]/30' : 'bg-[#1C1C1E] border border-[#2C2C2E]'}`}>
                <span className="text-lg">{t.icon}</span>
                <span className="text-[8px] text-[#9CA3AF]">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {formType === 'saham_id' && (
          <div className="p-3 rounded-xl bg-[#EF4444]/5 border border-[#EF4444]/20">
            <p className="text-[10px] text-[#EF4444] font-medium mb-1">🇮🇩 Saham Indonesia (IDX)</p>
            <p className="text-[10px] text-[#9CA3AF]">1 lot = 100 lembar. Masukkan jumlah dalam lot, harga per lembar.</p>
          </div>
        )}

        {formType === 'emas' && (
          <div className="p-3 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/20">
            <p className="text-[10px] text-[#F59E0B] font-medium mb-1">🥇 Emas</p>
            <p className="text-[10px] text-[#9CA3AF]">Satuan dalam gram (bisa desimal, contoh: 0.5 gram)</p>
          </div>
        )}

        {formType === 'crypto' && (
          <div className="p-3 rounded-xl bg-[#EAB308]/5 border border-[#EAB308]/20">
            <p className="text-[10px] text-[#EAB308] font-medium mb-1">₿ Crypto</p>
            <p className="text-[10px] text-[#9CA3AF]">Bisa input desimal (contoh: 0.0001 BTC)</p>
          </div>
        )}

        <div>
          <label className="text-xs text-[#9CA3AF] mb-1 block">
            Harga {formType === 'saham_id' ? 'per Lembar' : formType === 'emas' ? 'per Gram' : formType === 'crypto' ? 'per Koin' : 'per Unit'}
          </label>
          <input
            type="number"
            step={formType === 'emas' || formType === 'crypto' ? '0.0001' : '1'}
            value={formPurchasePrice}
            onChange={(e) => setFormPurchasePrice(e.target.value)}
            placeholder="0"
            className="w-full py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-[#9CA3AF] mb-1 block">
            Jumlah {formType === 'saham_id' ? 'Lot' : formType === 'emas' ? 'Gram' : formType === 'crypto' ? 'Koin' : 'Unit'}
          </label>
          <input
            type="number"
            step={formType === 'emas' || formType === 'crypto' ? '0.0001' : '1'}
            value={formQuantity}
            onChange={(e) => setFormQuantity(e.target.value)}
            placeholder="1"
            className="w-full py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
          />
          {formType === 'saham_id' && formQuantity && (
            <p className="text-[10px] text-[#9CA3AF] mt-1">= {parseFloat(formQuantity) * 100} lembar</p>
          )}
        </div>

        <div>
          <label className="text-xs text-[#9CA3AF] mb-1 block">Nilai Saat Ini (Total)</label>
          <input
            type="number"
            step={formType === 'emas' || formType === 'crypto' ? '0.01' : '1'}
            value={formCurrentValue}
            onChange={(e) => setFormCurrentValue(e.target.value)}
            placeholder="0"
            className="w-full py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
          />
        </div>

        {formType === 'deposito' && (
          <>
            <div>
              <label className="text-xs text-[#9CA3AF] mb-1 block">Bunga per Tahun (%)</label>
              <input type="number" step="0.01" value={formInterestPercent} onChange={(e) => setFormInterestPercent(e.target.value)} placeholder="5.00"
                className="w-full py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#9CA3AF] mb-1 block">Lama Deposito (hari)</label>
              <input type="number" value={formDepositDuration} onChange={(e) => setFormDepositDuration(e.target.value)} placeholder="30"
                className="w-full py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#9CA3AF] mb-1 block">Tanggal Jatuh Tempo</label>
              <input type="date" value={formMaturityDate} onChange={(e) => setFormMaturityDate(e.target.value)}
                className="w-full py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none" />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#9CA3AF]">
              <input type="checkbox" checked={formAutoRenew} onChange={(e) => setFormAutoRenew(e.target.checked)} className="rounded" />
              Auto perpanjang saat jatuh tempo
            </label>
          </>
        )}

        {formType === 'reksadana' && (
          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Return (%)</label>
            <input type="number" step="0.01" value={formReturnPercent} onChange={(e) => setFormReturnPercent(e.target.value)} placeholder="10.00"
              className="w-full py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none" />
          </div>
        )}

        <div>
          <label className="text-xs text-[#9CA3AF] mb-1 block">Tanggal Beli</label>
          <input type="date" value={formPurchaseDate} onChange={(e) => setFormPurchaseDate(e.target.value)}
            className="w-full py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none" />
        </div>

        <div>
          <label className="text-xs text-[#9CA3AF] mb-1 block">Catatan (opsional)</label>
          <input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Catatan tambahan"
            className="w-full py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none" />
        </div>
      </div>

      {showEmojiPicker && (
        <EmojiPicker
          onSelect={(emoji) => setFormIcon(emoji)}
          onClose={() => setShowEmojiPicker(false)}
          currentEmoji={formIcon}
        />
      )}
    </div>
  );
}
