--- src/screens/Detail.tsx (原始)


+++ src/screens/Detail.tsx (修改后)
// Detail Screen - List mode with search, filter, and bulk actions
// Spec: row 72dp, search debounce 200ms, filter chips, keyset pagination

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Search, Filter, Trash2, ChevronUp, MoreVertical, Edit3, Copy, X, Table, List } from 'lucide-react';

interface DetailProps {
  onAddTransaction: () => void;
}

export function Detail({ onAddTransaction }: DetailProps) {
  const { db, deleteTransaction, deleteTransactions } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterAccount, setFilterAccount] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string[] | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const scrollRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced search
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  // Scroll detection
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      setShowScrollTop(el.scrollTop > 300);
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // Filtered transactions (simulating SQL filter)
  const filteredTransactions = useMemo(() => {
    let result = [...db.transactions];

    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(t => t.note.toLowerCase().includes(q));
    }
    if (filterType) {
      result = result.filter(t => t.type === filterType);
    }
    if (filterCategory) {
      result = result.filter(t => t.categoryId === filterCategory);
    }
    if (filterAccount) {
      result = result.filter(t => t.accountId === filterAccount || t.toAccountId === filterAccount);
    }

    // Sort by date desc, then createdAt desc
    result.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    });

    return result;
  }, [db.transactions, debouncedQuery, filterType, filterCategory, filterAccount]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkDelete = () => {
    if (selectedIds.size > 0) {
      deleteTransactions(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setFilterType(null);
    setFilterCategory(null);
    setFilterAccount(null);
    setSearchQuery('');
    setDebouncedQuery('');
  };

  const hasActiveFilters = filterType || filterCategory || filterAccount || debouncedQuery;

  if (db.transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="text-5xl mb-4">📋</div>
        <h2 className="text-lg font-bold text-[#F5F5F5] mb-2">Belum Ada Transaksi</h2>
        <p className="text-[#9CA3AF] text-sm mb-6">
          Transaksi yang kamu catat akan muncul di sini.
        </p>
        <button
          onClick={onAddTransaction}
          className="py-3 px-6 rounded-xl bg-[#22C55E] text-white font-semibold text-sm active:scale-[0.98] transition-transform"
        >
          Catat Transaksi Pertama
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-4 py-3 space-y-2">
        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#22C55E]/50"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setDebouncedQuery(''); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={14} className="text-[#9CA3AF]" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition-colors ${showFilters || hasActiveFilters ? 'bg-[#22C55E]/10 border-[#22C55E]/30' : 'bg-[#1C1C1E] border-[#2C2C2E]'}`}
          >
            <Filter size={16} className={hasActiveFilters ? 'text-[#22C55E]' : 'text-[#9CA3AF]'} />
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'table' : 'list')}
            className="p-2.5 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]"
          >
            {viewMode === 'list' ? <Table size={16} className="text-[#9CA3AF]" /> : <List size={16} className="text-[#9CA3AF]" />}
          </button>
        </div>

        {/* Filter chips */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 py-2">
            {/* Type filter */}
            {['income', 'expense', 'transfer'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(filterType === type ? null : type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filterType === type
                    ? 'bg-[#22C55E] text-white'
                    : 'bg-[#262626] text-[#9CA3AF] border border-[#2C2C2E]'
                }`}
              >
                {type === 'income' ? 'Masuk' : type === 'expense' ? 'Keluar' : 'Transfer'}
              </button>
            ))}
            {/* Category filter */}
            {db.categories.filter(c => c.type !== 'system').slice(0, 6).map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filterCategory === cat.id
                    ? 'bg-[#22C55E] text-white'
                    : 'bg-[#262626] text-[#9CA3AF] border border-[#2C2C2E]'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
            {hasActiveFilters && (
              <button onClick={resetFilters} className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20">
                Reset
              </button>
            )}
          </div>
        )}

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-[#9CA3AF]">{selectedIds.size} dipilih</span>
            <div className="flex gap-2">
              <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 rounded-lg text-xs text-[#9CA3AF] bg-[#262626]">
                Batal
              </button>
              <button
                onClick={() => setDeleteConfirm(Array.from(selectedIds))}
                className="px-3 py-1.5 rounded-lg text-xs text-[#EF4444] bg-[#EF4444]/10 flex items-center gap-1"
              >
                <Trash2 size={12} /> Hapus ({selectedIds.size})
              </button>
            </div>
          </div>
        )}

        {/* Count */}
        <p className="text-[10px] text-[#9CA3AF]">
          {filteredTransactions.length} dari {db.transactions.length} transaksi
        </p>
      </div>

      {/* Transaction List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4">
        {viewMode === 'list' ? (
          <div className="space-y-1.5">
            {filteredTransactions.map(tx => {
              const cat = db.categories.find(c => c.id === tx.categoryId);
              const account = db.accounts.find(a => a.id === tx.accountId);
              const isSelected = selectedIds.has(tx.id);

              return (
                <div
                  key={tx.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#22C55E]/10 border-[#22C55E]/30'
                      : 'bg-[#1C1C1E] border-[#2C2C2E] active:bg-[#262626]'
                  }`}
                  style={{ height: '72px' }}
                  onClick={() => {
                    if (selectedIds.size > 0) {
                      toggleSelect(tx.id);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    toggleSelect(tx.id);
                  }}
                >
                  {/* Select checkbox when in bulk mode */}
                  {selectedIds.size > 0 && (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'bg-[#22C55E] border-[#22C55E]' : 'border-[#9CA3AF]'
                    }`}>
                      {isSelected && <span className="text-white text-xs">✓</span>}
                    </div>
                  )}

                  <div className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center text-lg shrink-0">
                    {cat?.icon || (tx.type === 'transfer' ? '🔄' : '💸')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#F5F5F5] truncate">{tx.note}</p>
                    <p className="text-[10px] text-[#9CA3AF]">
                      {account?.name} • {formatDate(tx.date, db.settings.language)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${
                      tx.type === 'income' ? 'text-[#22C55E]' : tx.type === 'expense' ? 'text-[#FB923C]' : 'text-[#3B82F6]'
                    }`}>
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatCurrency(tx.amount, db.settings.currency)}
                    </p>
                    {selectedIds.size === 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === tx.id ? null : tx.id); }}
                        className="p-1 rounded-lg hover:bg-[#2C2C2E]"
                      >
                        <MoreVertical size={14} className="text-[#9CA3AF]" />
                      </button>
                    )}
                  </div>

                  {/* Action menu */}
                  {actionMenu === tx.id && (
                    <div className="absolute right-4 top-full mt-1 z-10 bg-[#262626] border border-[#2C2C2E] rounded-xl shadow-xl py-1 min-w-[140px]">
                      <button
                        onClick={() => { setActionMenu(null); }}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#F5F5F5] w-full hover:bg-[#2C2C2E]"
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => { setActionMenu(null); }}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#F5F5F5] w-full hover:bg-[#2C2C2E]"
                      >
                        <Copy size={14} /> Duplikat
                      </button>
                      <button
                        onClick={() => { deleteTransaction(tx.id); setActionMenu(null); }}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#EF4444] w-full hover:bg-[#2C2C2E]"
                      >
                        <Trash2 size={14} /> Hapus
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Table view */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-xs">
              <thead>
                <tr className="text-[#9CA3AF] border-b border-[#2C2C2E]">
                  <th className="text-left py-2 px-2 w-[88px]">Tgl</th>
                  <th className="text-left py-2 px-2 w-[140px]">Catatan</th>
                  <th className="text-left py-2 px-2 w-[100px]">Kategori</th>
                  <th className="text-left py-2 px-2 w-[90px]">Akun</th>
                  <th className="text-left py-2 px-2 w-[80px]">Jenis</th>
                  <th className="text-right py-2 px-2 w-[110px]">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(tx => {
                  const cat = db.categories.find(c => c.id === tx.categoryId);
                  const account = db.accounts.find(a => a.id === tx.accountId);
                  return (
                    <tr key={tx.id} className="border-b border-[#2C2C2E]/50 hover:bg-[#262626]">
                      <td className="py-2.5 px-2 text-[#F5F5F5]">{formatDate(tx.date, db.settings.language)}</td>
                      <td className="py-2.5 px-2 text-[#F5F5F5] truncate max-w-[140px]">{tx.note}</td>
                      <td className="py-2.5 px-2 text-[#9CA3AF]">{cat?.icon} {cat?.name}</td>
                      <td className="py-2.5 px-2 text-[#9CA3AF]">{account?.name}</td>
                      <td className="py-2.5 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          tx.type === 'income' ? 'bg-[#22C55E]/10 text-[#22C55E]' :
                          tx.type === 'expense' ? 'bg-[#FB923C]/10 text-[#FB923C]' :
                          'bg-[#3B82F6]/10 text-[#3B82F6]'
                        }`}>
                          {tx.type === 'income' ? 'Masuk' : tx.type === 'expense' ? 'Keluar' : 'Transfer'}
                        </span>
                      </td>
                      <td className={`py-2.5 px-2 text-right font-semibold ${
                        tx.type === 'income' ? 'text-[#22C55E]' : tx.type === 'expense' ? 'text-[#FB923C]' : 'text-[#3B82F6]'
                      }`}>
                        {formatCurrency(tx.amount, db.settings.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredTransactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-[#9CA3AF] text-sm">Tidak ada transaksi yang cocok</p>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="mt-2 text-[#22C55E] text-sm">
                Reset filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 w-10 h-10 rounded-full bg-[#22C55E] flex items-center justify-center shadow-lg z-40 transition-opacity"
        >
          <ChevronUp size={20} className="text-white" />
        </button>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#2C2C2E]">
            <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">Hapus Transaksi?</h3>
            <p className="text-sm text-[#9CA3AF] mb-6">
              {deleteConfirm.length === 1
                ? 'Transaksi ini akan dihapus permanen.'
                : `${deleteConfirm.length} transaksi akan dihapus permanen.`
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl bg-[#262626] text-[#F5F5F5] font-medium text-sm"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteTransactions(deleteConfirm);
                  setDeleteConfirm(null);
                  setSelectedIds(new Set());
                }}
                className="flex-1 py-3 rounded-xl bg-[#EF4444] text-white font-medium text-sm"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
