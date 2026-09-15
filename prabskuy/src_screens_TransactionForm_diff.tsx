--- src/screens/TransactionForm.tsx (原始)


+++ src/screens/TransactionForm.tsx (修改后)
// Transaction Form - Add/Edit transaction
// Spec: Keypad left-to-right without precedence

import React, { useState, useMemo } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { X, Calculator } from 'lucide-react';

interface TransactionFormProps {
  onClose: () => void;
  editTransactionId?: string;
}

export function TransactionForm({ onClose, editTransactionId }: TransactionFormProps) {
  const { db, addTransaction, updateTransaction } = useDatabase();
  const existingTx = editTransactionId ? db.transactions.find(t => t.id === editTransactionId) : null;

  const [type, setType] = useState<'income' | 'expense' | 'transfer'>(existingTx?.type || 'expense');
  const [note, setNote] = useState(existingTx?.note || '');
  const [amount, setAmount] = useState(existingTx?.amount?.toString() || '');
  const [date, setDate] = useState(existingTx?.date || new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(existingTx?.accountId || (db.accounts[0]?.id || ''));
  const [toAccountId, setToAccountId] = useState(existingTx?.toAccountId || '');
  const [categoryId, setCategoryId] = useState(existingTx?.categoryId || '');
  const [showKeypad, setShowKeypad] = useState(false);
  const [keypadExpr, setKeypadExpr] = useState('');

  const filteredCategories = useMemo(() => {
    if (type === 'transfer') return [];
    return db.categories.filter(c => c.type === type || c.type === 'system');
  }, [type, db.categories]);

  const handleKeypadInput = (char: string) => {
    if (char === '=') {
      // Evaluate expression
      try {
        const result = evaluateKeypad(keypadExpr);
        if (!isNaN(result) && result >= 0) {
          setAmount(result.toString());
          setKeypadExpr('');
          setShowKeypad(false);
        }
      } catch {
        // Division by zero - show error
      }
    } else if (char === 'C') {
      setKeypadExpr('');
    } else if (char === '⌫') {
      setKeypadExpr(prev => prev.slice(0, -1));
    } else {
      setKeypadExpr(prev => prev + char);
    }
  };

  const evaluateKeypad = (expr: string): number => {
    if (!expr) return 0;
    // Left-to-right evaluation, no precedence
    const tokens = expr.match(/(\d+\.?\d*)|([+\-x÷])/g);
    if (!tokens) return 0;

    let result = parseFloat(tokens[0]);
    let currentOp = '';

    for (let i = 1; i < tokens.length; i++) {
      const token = tokens[i];
      if (['+', '-', 'x', '÷'].includes(token)) {
        currentOp = token;
      } else {
        const num = parseFloat(token);
        switch (currentOp) {
          case '+': result += num; break;
          case '-': result -= num; break;
          case 'x': result *= num; break;
          case '÷':
            if (num === 0) return NaN;
            result /= num;
            break;
        }
      }
    }
    return result;
  };

  const handleSave = () => {
    const amountNum = parseFloat(amount);
    if (!note || !amountNum || !accountId) return;
    if (type === 'transfer' && !toAccountId) return;

    const txData = {
      type,
      note,
      amount: amountNum,
      date,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      categoryId: type !== 'transfer' ? categoryId : undefined,
    };

    if (editTransactionId) {
      updateTransaction(editTransactionId, txData);
    } else {
      addTransaction(txData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#121212] z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#2C2C2E]">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#262626]">
          <X size={20} className="text-[#9CA3AF]" />
        </button>
        <h2 className="text-base font-semibold text-[#F5F5F5]">
          {editTransactionId ? 'Edit Transaksi' : 'Transaksi Baru'}
        </h2>
        <button
          onClick={handleSave}
          disabled={!note || !amount || !accountId || (type === 'transfer' && !toAccountId)}
          className="px-4 py-2 rounded-xl bg-[#22C55E] text-white text-sm font-semibold disabled:opacity-50"
        >
          Simpan
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Type selector */}
        <div className="flex gap-2">
          {(['expense', 'income', 'transfer'] as const).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                type === t
                  ? t === 'expense' ? 'bg-[#FB923C]/20 text-[#FB923C] border border-[#FB923C]/30'
                    : t === 'income' ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30'
                    : 'bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30'
                  : 'bg-[#1C1C1E] text-[#9CA3AF] border border-[#2C2C2E]'
              }`}
            >
              {t === 'expense' ? 'Pengeluaran' : t === 'income' ? 'Pemasukan' : 'Transfer'}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="relative">
          <label className="text-xs text-[#9CA3AF] mb-1 block">Jumlah</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="flex-1 py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-lg font-bold text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#22C55E]/50"
            />
            <button
              onClick={() => setShowKeypad(!showKeypad)}
              className={`px-4 rounded-xl border transition-colors ${
                showKeypad ? 'bg-[#22C55E]/10 border-[#22C55E]/30' : 'bg-[#1C1C1E] border-[#2C2C2E]'
              }`}
            >
              <Calculator size={18} className={showKeypad ? 'text-[#22C55E]' : 'text-[#9CA3AF]'} />
            </button>
          </div>
        </div>

        {/* Keypad */}
        {showKeypad && (
          <div className="p-3 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] space-y-2">
            <div className="text-center text-lg font-mono text-[#F5F5F5] min-h-[32px]">
              {keypadExpr || '0'}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['7', '8', '9', '÷', '4', '5', '6', 'x', '1', '2', '3', '-', '0', '00', '.', '+'].map(btn => (
                <button
                  key={btn}
                  onClick={() => handleKeypadInput(btn)}
                  className="py-3 rounded-lg bg-[#262626] text-[#F5F5F5] text-sm font-medium active:bg-[#2C2C2E]"
                >
                  {btn}
                </button>
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
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Deskripsi transaksi"
            className="w-full py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#22C55E]/50"
          />
        </div>

        {/* Date */}
        <div>
          <label className="text-xs text-[#9CA3AF] mb-1 block">Tanggal</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none focus:border-[#22C55E]/50"
          />
        </div>

        {/* Account */}
        <div>
          <label className="text-xs text-[#9CA3AF] mb-1 block">
            {type === 'transfer' ? 'Dari Akun' : 'Akun'}
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none"
          >
            <option value="">Pilih akun</option>
            {db.accounts.map(a => (
              <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
            ))}
          </select>
        </div>

        {/* To Account (transfer only) */}
        {type === 'transfer' && (
          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Ke Akun</label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none"
            >
              <option value="">Pilih akun tujuan</option>
              {db.accounts.filter(a => a.id !== accountId).map(a => (
                <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Category (not for transfer) */}
        {type !== 'transfer' && (
          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Kategori</label>
            <div className="grid grid-cols-4 gap-2">
              {filteredCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-colors ${
                    categoryId === cat.id
                      ? 'bg-[#22C55E]/10 border border-[#22C55E]/30'
                      : 'bg-[#1C1C1E] border border-[#2C2C2E]'
                  }`}
                >
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
