--- src/screens/ChatBot.tsx (原始)


+++ src/screens/ChatBot.tsx (修改后)
// Chat Bot Screen - Rule-based parser
// Spec: keyword, nominal rb/k/jt/m, verb belanja, follow-up, ConfirmCard

import React, { useState, useRef, useEffect } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Send, Bot, User, Trash2 } from 'lucide-react';

interface ChatBotProps {
  onTransactionSaved: () => void;
}

interface ParsedTransaction {
  type: 'income' | 'expense';
  note: string;
  amount: number;
  accountId?: string;
  categoryId?: string;
}

function parseAmount(text: string): number {
  // Match patterns like: 25rb, 25k, 1.5jt, 1.5j, 2m, 25000
  const patterns = [
    /(\d+\.?\d*)\s*m(?:iliar|iliard)?/i, // millions (miliar)
    /(\d+\.?\d*)\s*jt/i, // millions (juta)
    /(\d+\.?\d*)\s*j(?:uta)?/i, // juta
    /(\d+\.?\d*)\s*rb/i, // thousands (ribu)
    /(\d+\.?\d*)\s*k/i, // thousands
    /(\d+(?:\.\d{3})+)/, // formatted number 25.000
    /(\d+)/, // plain number
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const num = parseFloat(match[1].replace(/\./g, ''));
      if (pattern.source.includes('m')) return num * 1000000;
      if (pattern.source.includes('jt') || pattern.source.includes('j(?:uta)')) return num * 1000000;
      if (pattern.source.includes('rb') || pattern.source.includes('k')) return num * 1000;
      if (match[1].includes('.') && match[1].length > 5) return num; // formatted
      return num;
    }
  }
  return 0;
}

function parseChatMessage(text: string, accounts: { id: string; name: string }[], categories: { id: string; name: string; type: string }[]): ParsedTransaction | null {
  const lower = text.toLowerCase();

  // Determine type
  const incomeKeywords = ['gaji', 'bonus', 'dapat', 'terima', 'income', 'masuk', 'pendapatan'];
  const expenseKeywords = ['beli', 'belanja', 'bayar', 'makan', 'minum', 'beli', 'expense', 'keluar', 'jajan', 'beli'];

  let type: 'income' | 'expense' = 'expense';
  if (incomeKeywords.some(k => lower.includes(k))) type = 'income';
  else if (expenseKeywords.some(k => lower.includes(k))) type = 'expense';

  // Parse amount
  const amount = parseAmount(text);
  if (amount === 0) return null;

  // Parse note (remove amount parts and keywords)
  let note = text
    .replace(/(\d+\.?\d*\s*(?:rb|k|jt|j|m|ribu|juta|miliar))/gi, '')
    .replace(/(\d+(?:\.\d{3})+)/g, '')
    .replace(/(beli|belanja|bayar|makan|minum|gaji|bonus|dapat|terima|jajan)/gi, '')
    .trim();

  if (!note) note = type === 'income' ? 'Pemasukan' : 'Pengeluaran';

  // Try to match account
  let accountId: string | undefined;
  for (const acc of accounts) {
    if (lower.includes(acc.name.toLowerCase())) {
      accountId = acc.id;
      break;
    }
  }

  // Try to match category
  let categoryId: string | undefined;
  for (const cat of categories) {
    if (cat.type === type && lower.includes(cat.name.toLowerCase())) {
      categoryId = cat.id;
      break;
    }
  }
  // Fallback category
  if (!categoryId) {
    const defaultCat = categories.find(c => c.type === type);
    if (defaultCat) categoryId = defaultCat.id;
  }

  return { type, note, amount, accountId, categoryId };
}

export function ChatBot({ onTransactionSaved }: ChatBotProps) {
  const { db, addChatMessage, addTransaction, clearChatMessages } = useDatabase();
  const [input, setInput] = useState('');
  const [pendingTx, setPendingTx] = useState<ParsedTransaction | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [db.chatMessages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');

    // Add user message
    addChatMessage({ role: 'user', text });

    // Check for greetings
    const greetings = ['halo', 'hai', 'hi', 'hello', 'hey'];
    if (greetings.some(g => text.toLowerCase().includes(g)) && text.length < 10) {
      addChatMessage({
        role: 'bot',
        text: 'Halo! 👋 Aku bisa membantumu mencatat keuangan. Coba ketik seperti:\n\n• "makan siang 25rb pakai gopay"\n• "gaji 5jt"\n• "beli kopi 28rb cash"',
      });
      return;
    }

    // Parse transaction
    const parsed = parseChatMessage(text, db.accounts, db.categories);

    if (!parsed) {
      addChatMessage({
        role: 'bot',
        text: 'Maaf, aku belum mengerti. Coba sertakan jumlah (misal: 25rb, 50k, 1jt) dan deskripsi.',
      });
      return;
    }

    // If no account found and there are multiple accounts, ask
    if (!parsed.accountId && db.accounts.length > 1) {
      setPendingTx(parsed);
      const accountList = db.accounts.map(a => `${a.icon} ${a.name}`).join(', ');
      addChatMessage({
        role: 'bot',
        text: `Oke, ${parsed.note} sebesar Rp${parsed.amount.toLocaleString('id-ID')}. Dari akun mana?\n\n${accountList}`,
        transactionData: parsed as any,
      });
      return;
    }

    // Auto-assign first account if only one
    if (!parsed.accountId && db.accounts.length === 1) {
      parsed.accountId = db.accounts[0].id;
    }

    if (!parsed.accountId) {
      addChatMessage({
        role: 'bot',
        text: 'Kamu belum punya akun. Silakan tambahkan akun di Settings terlebih dahulu.',
      });
      return;
    }

    // Show confirmation
    setPendingTx(parsed);
    const account = db.accounts.find(a => a.id === parsed.accountId);
    const category = db.categories.find(c => c.id === parsed.categoryId);
    addChatMessage({
      role: 'bot',
      text: `Konfirmasi:\n\n📝 ${parsed.note}\n💰 Rp${parsed.amount.toLocaleString('id-ID')}\n📂 ${category?.name || '-'}\n🏦 ${account?.name || '-'}\n\nKetik "ya" untuk simpan atau "batal" untuk batalkan.`,
      transactionData: parsed as any,
    });
  };

  const pendingTxRef = React.useRef(pendingTx);
  pendingTxRef.current = pendingTx;

  const doConfirm = React.useCallback(() => {
    const tx = pendingTxRef.current;
    if (!tx || !tx.accountId) return;

    addTransaction({
      type: tx.type,
      note: tx.note,
      amount: tx.amount,
      date: new Date().toISOString().split('T')[0],
      accountId: tx.accountId,
      categoryId: tx.categoryId,
    });

    addChatMessage({
      role: 'bot',
      text: '✅ Transaksi tersimpan!',
    });
    setPendingTx(null);
    onTransactionSaved();
  }, [addTransaction, addChatMessage, onTransactionSaved]);

  const doCancel = React.useCallback(() => {
    addChatMessage({
      role: 'bot',
      text: '❌ Dibatalkan.',
    });
    setPendingTx(null);
  }, [addChatMessage]);

  // Handle "ya" / "batal" responses
  useEffect(() => {
    const lastMsg = db.chatMessages[db.chatMessages.length - 1];
    if (pendingTx && lastMsg?.role === 'user') {
      const response = lastMsg.text.toLowerCase().trim();
      if (response === 'ya' || response === 'yes' || response === 'y') {
        doConfirm();
      } else if (response === 'batal' || response === 'no' || response === 'n' || response === 'cancel') {
        doCancel();
      } else {
        // Try to parse as account selection
        const account = db.accounts.find(a => lastMsg.text.toLowerCase().includes(a.name.toLowerCase()));
        if (account) {
          setPendingTx({ ...pendingTx, accountId: account.id });
          const category = db.categories.find(c => c.id === pendingTx.categoryId);
          addChatMessage({
            role: 'bot',
            text: `Oke dari ${account.icon} ${account.name}. Konfirmasi:\n\n📝 ${pendingTx.note}\n💰 Rp${pendingTx.amount.toLocaleString('id-ID')}\n📂 ${category?.name || '-'}\n\nKetik "ya" untuk simpan.`,
          });
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.chatMessages.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2C2C2E]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#22C55E]/20 flex items-center justify-center">
            <Bot size={16} className="text-[#22C55E]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#F5F5F5]">Finance Bot</p>
            <p className="text-[10px] text-[#9CA3AF]">Catat keuangan dengan chat</p>
          </div>
        </div>
        {db.chatMessages.length > 0 && (
          <button onClick={clearChatMessages} className="p-2 rounded-lg hover:bg-[#262626]">
            <Trash2 size={16} className="text-[#9CA3AF]" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {db.chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-[#F5F5F5] font-medium mb-1">Mulai Chat</p>
            <p className="text-xs text-[#9CA3AF] mb-4">
              Ketik transaksi untuk dicatat otomatis
            </p>
            <div className="space-y-2 w-full max-w-xs">
              <button
                onClick={() => setInput('makan siang 25rb pakai gopay')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#9CA3AF] text-left"
              >
                "makan siang 25rb pakai gopay"
              </button>
              <button
                onClick={() => setInput('gaji 5jt')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#9CA3AF] text-left"
              >
                "gaji 5jt"
              </button>
              <button
                onClick={() => setInput('beli kopi 28rb cash')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#9CA3AF] text-left"
              >
                "beli kopi 28rb cash"
              </button>
            </div>
          </div>
        )}

        {db.chatMessages.map(msg => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'bot' && (
              <div className="w-7 h-7 rounded-full bg-[#22C55E]/20 flex items-center justify-center shrink-0 mt-1">
                <Bot size={12} className="text-[#22C55E]" />
              </div>
            )}
            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-line ${
              msg.role === 'user'
                ? 'bg-[#22C55E] text-white rounded-br-sm'
                : 'bg-[#1C1C1E] text-[#F5F5F5] border border-[#2C2C2E] rounded-bl-sm'
            }`}>
              {msg.text}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-[#262626] flex items-center justify-center shrink-0 mt-1">
                <User size={12} className="text-[#9CA3AF]" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#2C2C2E]">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ketik transaksi..."
            className="flex-1 py-3 px-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#22C55E]/50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-11 h-11 rounded-xl bg-[#22C55E] flex items-center justify-center disabled:opacity-30 active:scale-[0.95] transition-transform"
          >
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
