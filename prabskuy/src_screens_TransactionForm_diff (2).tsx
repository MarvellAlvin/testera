--- src/screens/TransactionForm.tsx (原始)
// Transaction Form - Enhanced with templates and round-up
import React, { useState, useMemo } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { calculateRoundUp } from '../utils/features';
import { hapticFeedback, showToast } from '../components/UI';
import { X, Calculator, Bookmark } from 'lucide-react';

interface TransactionFormProps { onClose: () => void; }

export function TransactionForm({ onClose }: TransactionFormProps) {
  const { accounts, categories, settings, templates, addTransaction, addTemplate, deleteTemplate } = useDatabase();
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.uid || '');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showKeypad, setShowKeypad] = useState(false);
  const [keypadExpr, setKeypadExpr] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const currency = settings?.currency || 'IDR';

  const filteredCategories = useMemo(() => {
    if (type === 'transfer') return [];
    return categories.filter(c => c.type === type || c.type === 'system');
  }, [type, categories]);

  const handleKeypadInput = (char: string) => {
    if (char === '=') {
      try {
        const result = evaluateKeypad(keypadExpr);
        if (!isNaN(result) && result >= 0) { setAmount(result.toString()); setKeypadExpr(''); setShowKeypad(false); }
      } catch { /* divide by zero */ }
    } else if (char === 'C') setKeypadExpr('');
    else if (char === '⌫') setKeypadExpr(prev => prev.slice(0, -1));
    else setKeypadExpr(prev => prev + char);
  };

  const evaluateKeypad = (expr: string): number => {
    if (!expr) return 0;
    const tokens = expr.match(/(\d+\.?\d*)|([+\-x÷])/g);
    if (!tokens) return 0;
    let result = parseFloat(tokens[0]);
    let currentOp = '';
    for (let i = 1; i < tokens.length; i++) {
      const token = tokens[i];
      if (['+', '-', 'x', '÷'].includes(token)) { currentOp = token; }
      else {
        const num = parseFloat(token);
        switch (currentOp) { case '+': result += num; break; case '-': result -= num; break; case 'x': result *= num; break; case '÷': if (num === 0) return NaN; result /= num; break; }
      }
    }
    return result;
  };

  const handleSave = async () => {
    let amountNum = parseFloat(amount);
    if (!note || !amountNum || !accountId) return;
    if (type === 'transfer' && !toAccountId) return;

    // Round-up feature
    if (settings?.roundUpEnabled && type === 'expense' && settings.roundUpAccountId) {
      const roundUp = calculateRoundUp(amountNum);
      if (roundUp > 0) {
        // Add round-up as separate transaction to savings
        await addTransaction({
          type: 'transfer',
          note: 'Round-up tabungan',
          amount: roundUp,
          date,
          accountId,
          toAccountId: settings.roundUpAccountId,
        });
      }
    }

    await addTransaction({ type, note, amount: amountNum, date, accountId, toAccountId: type === 'transfer' ? toAccountId : undefined, categoryId: type !== 'transfer' ? categoryId : undefined });
    hapticFeedback('medium');
    showToast({ message: 'Transaksi tersimpan!', type: 'success' });
    onClose();
  };

  const handleSaveAsTemplate = () => {
    if (!note || !amount || !categoryId) return;
    addTemplate({ name: note, type: type as 'income' | 'expense', note, amount: parseFloat(amount), accountId, categoryId, icon: categories.find(c => c.uid === categoryId)?.icon || '💸' });
    showToast({ message: 'Template disimpan', type: 'success' });
    setShowTemplates(false);
  };

  const handleUseTemplate = (tpl: typeof templates[0]) => {
    setType(tpl.type);
    setNote(tpl.note);
    setAmount(tpl.amount.toString());
    setAccountId(tpl.accountId);
    setCategoryId(tpl.categoryId);
    setShowTemplates(false);
  };

  return (
    <div className="fixed inset-0 bg-[#121212] z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#2C2C2E]">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#262626]"><X size={20} className="text-[#9CA3AF]" /></button>
        <h2 className="text-base font-semibold text-[#F5F5F5]">Transaksi Baru</h2>
        <button onClick={handleSave} disabled={!note || !amount || !accountId || (type === 'transfer' && !toAccountId)}
          className="px-4 py-2 rounded-xl bg-[#22C55E] text-white text-sm font-semibold disabled:opacity-50">Simpan</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Type selector */}
        <div className="flex gap-2">
          {(['expense', 'income', 'transfer'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${type === t ? t === 'expense' ? 'bg-[#FB923C]/20 text-[#FB923C] border border-[#FB923C]/30' : t === 'income' ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30' : 'bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30' : 'bg-[#1C1C1E] text-[#9CA3AF] border border-[#2C2C2E]'}`}>
              {t === 'expense' ? 'Pengeluaran' : t === 'income' ? 'Pemasukan' : 'Transfer'}
            </button>
          ))}
        </div>

        {/* Templates */}
        {templates.length > 0 && type !== 'transfer' && (
          <div>
            <button onClick={() => setShowTemplates(!showTemplates)} className="flex items-center gap-2 text-xs text-[#22C55E] mb-2">
              <Bookmark size={12} /> Template ({templates.length})
            </button>
            {showTemplates && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {templates.map(tpl => (
                  <button key={tpl.uid} onClick={() => handleUseTemplate(tpl)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] shrink-0">
                    <span>{tpl.icon}</span><span className="text-xs text-[#F5F5F5]">{tpl.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="text-xs text-[#9CA3AF] mb-1 block">Jumlah</label>
          <div className="flex gap-2">
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
              className="flex-1 py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-lg font-bold text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#22C55E]/50" />
            <button onClick={() => setShowKeypad(!showKeypad)}
              className={`px-4 rounded-xl border transition-colors ${showKeypad ? 'bg-[#22C55E]/10 border-[#22C55E]/30' : 'bg-[#1C1C1E] border-[#2C2C2E]'}`}>
              <Calculator size={18} className={showKeypad ? 'text-[#22C55E]' : 'text-[#9CA3AF]'} />
            </button>
          </div>
        </div>

        {/* Keypad */}
        {showKeypad && (
          <div className="p-3 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] space-y-2">
            <div className="text-center text-lg font-mono text-[#F5F5F5] min-h-[32px]">{keypadExpr || '0'}</div>
            <div className="grid grid-cols-4 gap-2">
              {['7', '8', '9', '÷', '4', '5', '6', 'x', '1', '2', '3', '-', '0', '00', '.', '+'].map(btn => (
                <button key={btn} onClick={() => handleKeypadInput(btn)} className="py-3 rounded-lg bg-[#262626] text-[#F5F5F5] text-sm font-medium active:bg-[#2C2C2E]">{btn}</button>
              ))}
              <button onClick={() => handleKeypadInput('C')} className="py-3 rounded-lg bg-[#EF4444]/10 text-[#EF4444] text-sm font-medium">C</button>
              <button onClick={() => handleKeypadInput('⌫')} className="py-3 rounded-lg bg-[#262626] text-[#F5F5F5] text-sm font-medium">⌫</button>
              <button onClick={() => handleKeypadInput('=')} className="col-span-2 py-3 rounded-lg bg-[#22C55E] text-white text-sm font-bold">=</button>
            </div>
          </div>
        )}

        {/* Note */}
        <div>
          <label className="text-xs text-[#9CA3AF] mb-1 block">Catatan</label>
          <div className="flex gap-2">
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Deskripsi transaksi"
              className="flex-1 py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#22C55E]/50" />
            {note && amount && categoryId && (
              <button onClick={handleSaveAsTemplate} className="px-3 rounded-xl bg-[#262626] border border-[#2C2C2E]" title="Simpan sebagai template">
                <Bookmark size={16} className="text-[#9CA3AF]" />
              </button>
            )}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="text-xs text-[#9CA3AF] mb-1 block">Tanggal</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none focus:border-[#22C55E]/50" />
        </div>

        {/* Account */}
        <div>
          <label className="text-xs text-[#9CA3AF] mb-1 block">{type === 'transfer' ? 'Dari Akun' : 'Akun'}</label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
            className="w-full py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none">
            <option value="">Pilih akun</option>
            {accounts.map(a => <option key={a.uid} value={a.uid}>{a.icon} {a.name}</option>)}
          </select>
        </div>

        {/* To Account */}
        {type === 'transfer' && (
          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Ke Akun</label>
            <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}
              className="w-full py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none">
              <option value="">Pilih akun tujuan</option>
              {accounts.filter(a => a.uid !== accountId).map(a => <option key={a.uid} value={a.uid}>{a.icon} {a.name}</option>)}
            </select>
          </div>
        )}

        {/* Category */}
        {type !== 'transfer' && (
          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Kategori</label>
            <div className="grid grid-cols-4 gap-2">
              {filteredCategories.map(cat => (
                <button key={cat.uid} onClick={() => setCategoryId(cat.uid)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-colors ${categoryId === cat.uid ? 'bg-[#22C55E]/10 border border-[#22C55E]/30' : 'bg-[#1C1C1E] border border-[#2C2C2E]'}`}>
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-[9px] text-[#9CA3AF] text-center leading-tight">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


+++ src/screens/TransactionForm.tsx (修改后)
// Transaction Form - Enhanced with templates and round-up
import React, { useState, useMemo } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { calculateRoundUp } from '../utils/features';
import { hapticFeedback, showToast } from '../components/UI';
import { FormattedNumberInput, formattedToNumber } from '../components/FormattedNumberInput';
import { X, Calculator, Bookmark } from 'lucide-react';

interface TransactionFormProps { onClose: () => void; }

export function TransactionForm({ onClose }: TransactionFormProps) {
  const { accounts, categories, settings, templates, addTransaction, addTemplate, deleteTemplate } = useDatabase();
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.uid || '');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showKeypad, setShowKeypad] = useState(false);
  const [keypadExpr, setKeypadExpr] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const currency = settings?.currency || 'IDR';

  const filteredCategories = useMemo(() => {
    if (type === 'transfer') return [];
    return categories.filter(c => c.type === type || c.type === 'system');
  }, [type, categories]);

  const handleKeypadInput = (char: string) => {
    if (char === '=') {
      try {
        const result = evaluateKeypad(keypadExpr);
        if (!isNaN(result) && result >= 0) { setAmount(result.toString()); setKeypadExpr(''); setShowKeypad(false); }
      } catch { /* divide by zero */ }
    } else if (char === 'C') setKeypadExpr('');
    else if (char === '⌫') setKeypadExpr(prev => prev.slice(0, -1));
    else setKeypadExpr(prev => prev + char);
  };

  const evaluateKeypad = (expr: string): number => {
    if (!expr) return 0;
    const tokens = expr.match(/(\d+\.?\d*)|([+\-x÷])/g);
    if (!tokens) return 0;
    let result = parseFloat(tokens[0]);
    let currentOp = '';
    for (let i = 1; i < tokens.length; i++) {
      const token = tokens[i];
      if (['+', '-', 'x', '÷'].includes(token)) { currentOp = token; }
      else {
        const num = parseFloat(token);
        switch (currentOp) { case '+': result += num; break; case '-': result -= num; break; case 'x': result *= num; break; case '÷': if (num === 0) return NaN; result /= num; break; }
      }
    }
    return result;
  };

  const handleSave = async () => {
    let amountNum = formattedToNumber(amount);
    if (!note || !amountNum || !accountId) return;
    if (type === 'transfer' && !toAccountId) return;

    // Round-up feature
    if (settings?.roundUpEnabled && type === 'expense' && settings.roundUpAccountId) {
      const roundUp = calculateRoundUp(amountNum);
      if (roundUp > 0) {
        // Add round-up as separate transaction to savings
        await addTransaction({
          type: 'transfer',
          note: 'Round-up tabungan',
          amount: roundUp,
          date,
          accountId,
          toAccountId: settings.roundUpAccountId,
        });
      }
    }

    await addTransaction({ type, note, amount: amountNum, date, accountId, toAccountId: type === 'transfer' ? toAccountId : undefined, categoryId: type !== 'transfer' ? categoryId : undefined });
    hapticFeedback('medium');
    showToast({ message: 'Transaksi tersimpan!', type: 'success' });
    onClose();
  };

  const handleSaveAsTemplate = () => {
    if (!note || !amount || !categoryId) return;
    addTemplate({ name: note, type: type as 'income' | 'expense', note, amount: formattedToNumber(amount), accountId, categoryId, icon: categories.find(c => c.uid === categoryId)?.icon || '💸' });
    showToast({ message: 'Template disimpan', type: 'success' });
    setShowTemplates(false);
  };

  const handleUseTemplate = (tpl: typeof templates[0]) => {
    setType(tpl.type);
    setNote(tpl.note);
    setAmount(tpl.amount.toString());
    setAccountId(tpl.accountId);
    setCategoryId(tpl.categoryId);
    setShowTemplates(false);
  };

  return (
    <div className="fixed inset-0 bg-[#121212] z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#2C2C2E]">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#262626]"><X size={20} className="text-[#9CA3AF]" /></button>
        <h2 className="text-base font-semibold text-[#F5F5F5]">Transaksi Baru</h2>
        <button onClick={handleSave} disabled={!note || !amount || !accountId || (type === 'transfer' && !toAccountId)}
          className="px-4 py-2 rounded-xl bg-[#22C55E] text-white text-sm font-semibold disabled:opacity-50">Simpan</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Type selector */}
        <div className="flex gap-2">
          {(['expense', 'income', 'transfer'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${type === t ? t === 'expense' ? 'bg-[#FB923C]/20 text-[#FB923C] border border-[#FB923C]/30' : t === 'income' ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30' : 'bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30' : 'bg-[#1C1C1E] text-[#9CA3AF] border border-[#2C2C2E]'}`}>
              {t === 'expense' ? 'Pengeluaran' : t === 'income' ? 'Pemasukan' : 'Transfer'}
            </button>
          ))}
        </div>

        {/* Templates */}
        {templates.length > 0 && type !== 'transfer' && (
          <div>
            <button onClick={() => setShowTemplates(!showTemplates)} className="flex items-center gap-2 text-xs text-[#22C55E] mb-2">
              <Bookmark size={12} /> Template ({templates.length})
            </button>
            {showTemplates && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {templates.map(tpl => (
                  <button key={tpl.uid} onClick={() => handleUseTemplate(tpl)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] shrink-0">
                    <span>{tpl.icon}</span><span className="text-xs text-[#F5F5F5]">{tpl.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="text-xs text-[#9CA3AF] mb-1 block">Jumlah</label>
          <div className="flex gap-2">
            <FormattedNumberInput value={amount} onChange={setAmount} placeholder="0" prefix="Rp" className="flex-1" />
            <button onClick={() => setShowKeypad(!showKeypad)}
              className={`px-4 rounded-xl border transition-colors ${showKeypad ? 'bg-[#22C55E]/10 border-[#22C55E]/30' : 'bg-[#1C1C1E] border-[#2C2C2E]'}`}>
              <Calculator size={18} className={showKeypad ? 'text-[#22C55E]' : 'text-[#9CA3AF]'} />
            </button>
          </div>
        </div>

        {/* Keypad */}
        {showKeypad && (
          <div className="p-3 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] space-y-2">
            <div className="text-center text-lg font-mono text-[#F5F5F5] min-h-[32px]">{keypadExpr || '0'}</div>
            <div className="grid grid-cols-4 gap-2">
              {['7', '8', '9', '÷', '4', '5', '6', 'x', '1', '2', '3', '-', '0', '00', '.', '+'].map(btn => (
                <button key={btn} onClick={() => handleKeypadInput(btn)} className="py-3 rounded-lg bg-[#262626] text-[#F5F5F5] text-sm font-medium active:bg-[#2C2C2E]">{btn}</button>
              ))}
              <button onClick={() => handleKeypadInput('C')} className="py-3 rounded-lg bg-[#EF4444]/10 text-[#EF4444] text-sm font-medium">C</button>
              <button onClick={() => handleKeypadInput('⌫')} className="py-3 rounded-lg bg-[#262626] text-[#F5F5F5] text-sm font-medium">⌫</button>
              <button onClick={() => handleKeypadInput('=')} className="col-span-2 py-3 rounded-lg bg-[#22C55E] text-white text-sm font-bold">=</button>
            </div>
          </div>
        )}

        {/* Note */}
        <div>
          <label className="text-xs text-[#9CA3AF] mb-1 block">Catatan</label>
          <div className="flex gap-2">
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Deskripsi transaksi"
              className="flex-1 py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#22C55E]/50" />
            {note && amount && categoryId && (
              <button onClick={handleSaveAsTemplate} className="px-3 rounded-xl bg-[#262626] border border-[#2C2C2E]" title="Simpan sebagai template">
                <Bookmark size={16} className="text-[#9CA3AF]" />
              </button>
            )}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="text-xs text-[#9CA3AF] mb-1 block">Tanggal</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none focus:border-[#22C55E]/50" />
        </div>

        {/* Account */}
        <div>
          <label className="text-xs text-[#9CA3AF] mb-1 block">{type === 'transfer' ? 'Dari Akun' : 'Akun'}</label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
            className="w-full py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none">
            <option value="">Pilih akun</option>
            {accounts.map(a => <option key={a.uid} value={a.uid}>{a.icon} {a.name}</option>)}
          </select>
        </div>

        {/* To Account */}
        {type === 'transfer' && (
          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Ke Akun</label>
            <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}
              className="w-full py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none">
              <option value="">Pilih akun tujuan</option>
              {accounts.filter(a => a.uid !== accountId).map(a => <option key={a.uid} value={a.uid}>{a.icon} {a.name}</option>)}
            </select>
          </div>
        )}

        {/* Category */}
        {type !== 'transfer' && (
          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Kategori</label>
            <div className="grid grid-cols-4 gap-2">
              {filteredCategories.map(cat => (
                <button key={cat.uid} onClick={() => setCategoryId(cat.uid)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-colors ${categoryId === cat.uid ? 'bg-[#22C55E]/10 border border-[#22C55E]/30' : 'bg-[#1C1C1E] border border-[#2C2C2E]'}`}>
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-[9px] text-[#9CA3AF] text-center leading-tight">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
