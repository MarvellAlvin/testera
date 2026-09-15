--- src/screens/Settings.tsx (原始)


+++ src/screens/Settings.tsx (修改后)
// Settings Screen - App settings, accounts management, reset data

import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { formatCurrency } from '../utils/formatters';
import { Plus, Trash2, X, AlertTriangle, Moon, Globe, Database, Wallet } from 'lucide-react';

interface SettingsProps {
  onReset: () => void;
  onLoadDummy: () => void;
}

export function Settings({ onReset, onLoadDummy }: SettingsProps) {
  const { db, updateSettings, addAccount, deleteAccount, updateAccount, resetAll, loadDummy } = useDatabase();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showResetConfirm1, setShowResetConfirm1] = useState(false);
  const [showResetConfirm2, setShowResetConfirm2] = useState(false);
  const [showDummyConfirm, setShowDummyConfirm] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState<string | null>(null);

  // Account form
  const [accName, setAccName] = useState('');
  const [accIcon, setAccIcon] = useState('💵');
  const [accBalance, setAccBalance] = useState('');
  const [accIsSavings, setAccIsSavings] = useState(false);

  const handleAddAccount = () => {
    if (!accName || !accBalance) return;
    addAccount({
      name: accName,
      icon: accIcon,
      openingBalance: parseFloat(accBalance),
      isSavings: accIsSavings,
    });
    setShowAddAccount(false);
    setAccName('');
    setAccBalance('');
    setAccIcon('💵');
    setAccIsSavings(false);
  };

  const handleReset = () => {
    resetAll();
    setShowResetConfirm2(false);
    onReset();
  };

  const handleLoadDummy = () => {
    loadDummy();
    setShowDummyConfirm(false);
    onLoadDummy();
  };

  const accountIcons = ['💵', '🏦', '📱', '💳', '🪙', '💰', '🏧', '👛'];

  // Count transactions per account for delete warning
  const getAccountTxCount = (accountId: string) => {
    return db.transactions.filter(t => t.accountId === accountId || t.toAccountId === accountId).length;
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
      {/* Appearance */}
      <section>
        <h3 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Tampilan</h3>
        <div className="space-y-2">
          {/* AMOLED Mode */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
            <div className="flex items-center gap-3">
              <Moon size={18} className="text-[#9CA3AF]" />
              <div>
                <p className="text-sm text-[#F5F5F5]">Mode AMOLED</p>
                <p className="text-[10px] text-[#9CA3AF]">Latar belakang hitam pekat</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ amoledMode: !db.settings.amoledMode })}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                db.settings.amoledMode ? 'bg-[#22C55E]' : 'bg-[#2C2C2E]'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-transform ${
                db.settings.amoledMode ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-[#9CA3AF]" />
              <div>
                <p className="text-sm text-[#F5F5F5]">Bahasa</p>
                <p className="text-[10px] text-[#9CA3AF]">{db.settings.language === 'id' ? 'Indonesia' : 'English'}</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ language: db.settings.language === 'id' ? 'en' : 'id' })}
              className="px-3 py-1.5 rounded-lg bg-[#262626] text-xs text-[#F5F5F5]"
            >
              {db.settings.language === 'id' ? 'ID' : 'EN'}
            </button>
          </div>
        </div>
      </section>

      {/* Accounts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider">Akun</h3>
          <button
            onClick={() => setShowAddAccount(true)}
            className="flex items-center gap-1 text-xs text-[#22C55E]"
          >
            <Plus size={14} /> Tambah
          </button>
        </div>
        {db.accounts.length === 0 ? (
          <div className="text-center py-6">
            <Wallet size={32} className="text-[#9CA3AF] mx-auto mb-2" />
            <p className="text-[#9CA3AF] text-sm">Belum ada akun</p>
          </div>
        ) : (
          <div className="space-y-2">
            {db.accounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between p-3 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{acc.icon}</span>
                  <div>
                    <p className="text-sm text-[#F5F5F5]">{acc.name}</p>
                    <p className="text-[10px] text-[#9CA3AF]">Saldo awal: {formatCurrency(acc.openingBalance, db.settings.currency)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteAccount(acc.id)}
                  className="p-2 rounded-lg hover:bg-[#2C2C2E]"
                >
                  <Trash2 size={14} className="text-[#9CA3AF]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Data */}
      <section>
        <h3 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Data</h3>
        <div className="space-y-2">
          <button
            onClick={() => setShowDummyConfirm(true)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] active:bg-[#262626]"
          >
            <div className="flex items-center gap-3">
              <Database size={18} className="text-[#3B82F6]" />
              <div className="text-left">
                <p className="text-sm text-[#F5F5F5]">Load Dummy Data</p>
                <p className="text-[10px] text-[#9CA3AF]">Muat data contoh untuk mencoba</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowResetConfirm1(true)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-[#1C1C1E] border border-[#EF4444]/20 active:bg-[#262626]"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-[#EF4444]" />
              <div className="text-left">
                <p className="text-sm text-[#EF4444]">Reset Semua Data</p>
                <p className="text-[10px] text-[#9CA3AF]">Hapus semua data dan mulai dari awal</p>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* About */}
      <section className="text-center py-4">
        <p className="text-[10px] text-[#9CA3AF]">Finance Tracker v1.0</p>
        <p className="text-[10px] text-[#9CA3AF]">Data integrity guaranteed ✓</p>
      </section>

      {/* Add Account Dialog */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#2C2C2E]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#F5F5F5]">Tambah Akun</h3>
              <button onClick={() => setShowAddAccount(false)}><X size={20} className="text-[#9CA3AF]" /></button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                placeholder="Nama akun"
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
              />
              <div className="flex gap-2 flex-wrap">
                {accountIcons.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setAccIcon(icon)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-colors ${
                      accIcon === icon ? 'bg-[#22C55E]/20 border border-[#22C55E]/30' : 'bg-[#262626] border border-[#2C2C2E]'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={accBalance}
                onChange={(e) => setAccBalance(e.target.value)}
                placeholder="Saldo awal"
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
              />
              <label className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                <input
                  type="checkbox"
                  checked={accIsSavings}
                  onChange={(e) => setAccIsSavings(e.target.checked)}
                  className="rounded"
                />
                Akun tabungan
              </label>
              <button
                onClick={handleAddAccount}
                disabled={!accName || !accBalance}
                className="w-full py-3 rounded-xl bg-[#22C55E] text-white font-semibold text-sm disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Dialog */}
      {showDeleteAccount && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#2C2C2E]">
            <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">Hapus Akun?</h3>
            {(() => {
              const txCount = getAccountTxCount(showDeleteAccount);
              return (
                <p className="text-sm text-[#9CA3AF] mb-6">
                  {txCount > 0
                    ? `Akun ini memiliki ${txCount} transaksi. Semua transaksi terkait juga akan dihapus.`
                    : 'Akun ini akan dihapus permanen.'
                  }
                </p>
              );
            })()}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAccount(null)}
                className="flex-1 py-3 rounded-xl bg-[#262626] text-[#F5F5F5] font-medium text-sm"
              >
                Batal
              </button>
              <button
                onClick={() => { deleteAccount(showDeleteAccount); setShowDeleteAccount(null); }}
                className="flex-1 py-3 rounded-xl bg-[#EF4444] text-white font-medium text-sm"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dummy Data Confirmation */}
      {showDummyConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#2C2C2E]">
            <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">Load Dummy Data?</h3>
            <p className="text-sm text-[#9CA3AF] mb-6">
              Data saat ini akan DIGANTI dengan data contoh. Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDummyConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-[#262626] text-[#F5F5F5] font-medium text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleLoadDummy}
                className="flex-1 py-3 rounded-xl bg-[#3B82F6] text-white font-medium text-sm"
              >
                Load
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation 1 */}
      {showResetConfirm1 && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#EF4444]/20">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={20} className="text-[#EF4444]" />
              <h3 className="text-lg font-bold text-[#EF4444]">Reset Semua Data?</h3>
            </div>
            <p className="text-sm text-[#9CA3AF] mb-6">
              SEMUA data akan dihapus permanen: akun, transaksi, budget, goals, recurring, chat, dan habit.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm1(false)}
                className="flex-1 py-3 rounded-xl bg-[#262626] text-[#F5F5F5] font-medium text-sm"
              >
                Batal
              </button>
              <button
                onClick={() => { setShowResetConfirm1(false); setShowResetConfirm2(true); }}
                className="flex-1 py-3 rounded-xl bg-[#EF4444] text-white font-medium text-sm"
              >
                Lanjut
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation 2 */}
      {showResetConfirm2 && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#EF4444]/20">
            <h3 className="text-lg font-bold text-[#EF4444] mb-2">Konfirmasi Terakhir</h3>
            <p className="text-sm text-[#9CA3AF] mb-6">
              Apakah kamu YAKIN ingin menghapus semua data? Tindakan ini TIDAK BISA dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm2(false)}
                className="flex-1 py-3 rounded-xl bg-[#262626] text-[#F5F5F5] font-medium text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl bg-[#EF4444] text-white font-medium text-sm"
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
