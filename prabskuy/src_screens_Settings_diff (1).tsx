--- src/screens/Settings.tsx (原始)
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


+++ src/screens/Settings.tsx (修改后)
// Settings Screen - Theme, accounts, export/backup, reset
import React, { useState, useRef } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { formatCurrency } from '../utils/formatters';
import { exportToCSV, downloadCSV, exportBackup, downloadBackup, importBackup, CURRENCIES } from '../utils/features';
import { hapticFeedback, showToast } from '../components/UI';
import { Plus, Trash2, X, AlertTriangle, Moon, Sun, Globe, Database, Wallet, Download, Upload, Palette } from 'lucide-react';

interface SettingsProps { onReset: () => void; onLoadDummy: () => void; }

export function Settings({ onReset, onLoadDummy }: SettingsProps) {
  const { accounts, transactions, categories, settings, addAccount, deleteAccount, updateSettings, resetAll, loadDummy } = useDatabase();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showResetConfirm1, setShowResetConfirm1] = useState(false);
  const [showResetConfirm2, setShowResetConfirm2] = useState(false);
  const [showDummyConfirm, setShowDummyConfirm] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState<string | null>(null);
  const [accName, setAccName] = useState('');
  const [accIcon, setAccIcon] = useState('💵');
  const [accBalance, setAccBalance] = useState('');
  const [accIsSavings, setAccIsSavings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currency = settings?.currency || 'IDR';
  const theme = settings?.theme || 'dark';
  const amoledMode = settings?.amoledMode || false;
  const accentColor = settings?.accentColor || '#22C55E';

  const handleAddAccount = () => {
    if (!accName || !accBalance) return;
    addAccount({ name: accName, icon: accIcon, openingBalance: parseFloat(accBalance), isSavings: accIsSavings, currency, sortOrder: 0 });
    setShowAddAccount(false); setAccName(''); setAccBalance(''); setAccIcon('💵'); setAccIsSavings(false);
    hapticFeedback('light');
    showToast({ message: 'Akun ditambahkan', type: 'success' });
  };

  const handleReset = async () => {
    await resetAll();
    setShowResetConfirm2(false);
    hapticFeedback('heavy');
    showToast({ message: 'Semua data direset', type: 'info' });
    onReset();
  };

  const handleLoadDummy = async () => {
    await loadDummy();
    setShowDummyConfirm(false);
    hapticFeedback('medium');
    showToast({ message: 'Data contoh dimuat', type: 'success' });
    onLoadDummy();
  };

  const handleExportCSV = () => {
    const csv = exportToCSV(transactions, accounts, categories);
    downloadCSV(`transaksi-${new Date().toISOString().split('T')[0]}.csv`, csv);
    hapticFeedback('light');
    showToast({ message: 'CSV berhasil diexport', type: 'success' });
  };

  const handleExportBackup = async () => {
    const backup = await exportBackup();
    downloadBackup(backup);
    hapticFeedback('light');
    showToast({ message: 'Backup berhasil diexport', type: 'success' });
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const success = await importBackup(text);
    if (success) {
      hapticFeedback('medium');
      showToast({ message: 'Backup berhasil diimport', type: 'success' });
    } else {
      showToast({ message: 'Gagal import backup', type: 'error' });
    }
    e.target.value = '';
  };

  const getAccountTxCount = (accountId: string) => transactions.filter(t => t.accountId === accountId || t.toAccountId === accountId).length;
  const accountIcons = ['💵', '🏦', '📱', '💳', '🪙', '💰', '🏧', '👛'];
  const accentColors = ['#22C55E', '#3B82F6', '#A855F7', '#FB923C', '#EF4444', '#EAB308', '#06B6D4', '#F97316'];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
      {/* Appearance */}
      <section>
        <h3 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Tampilan</h3>
        <div className="space-y-2">
          {/* Theme */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon size={18} className="text-[#9CA3AF]" /> : <Sun size={18} className="text-[#9CA3AF]" />}
              <div><p className="text-sm text-[#F5F5F5]">Tema</p><p className="text-[10px] text-[#9CA3AF]">{theme === 'dark' ? 'Gelap' : 'Terang'}</p></div>
            </div>
            <button onClick={() => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' })} className="px-3 py-1.5 rounded-lg bg-[#262626] text-xs text-[#F5F5F5]">
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>

          {/* AMOLED */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
            <div className="flex items-center gap-3"><Moon size={18} className="text-[#9CA3AF]" /><div><p className="text-sm text-[#F5F5F5]">Mode AMOLED</p><p className="text-[10px] text-[#9CA3AF]">Latar belakang hitam pekat</p></div></div>
            <button onClick={() => updateSettings({ amoledMode: !amoledMode })} className={`w-12 h-7 rounded-full transition-colors relative ${amoledMode ? 'bg-[#22C55E]' : 'bg-[#2C2C2E]'}`}>
              <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-transform ${amoledMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Accent Color */}
          <div className="p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
            <div className="flex items-center gap-3 mb-3"><Palette size={18} className="text-[#9CA3AF]" /><p className="text-sm text-[#F5F5F5]">Warna Aksen</p></div>
            <div className="flex gap-2 flex-wrap">
              {accentColors.map(color => (
                <button key={color} onClick={() => updateSettings({ accentColor: color })}
                  className={`w-8 h-8 rounded-full transition-transform ${accentColor === color ? 'scale-110 ring-2 ring-white/30' : ''}`}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
            <div className="flex items-center gap-3"><Globe size={18} className="text-[#9CA3AF]" /><div><p className="text-sm text-[#F5F5F5]">Bahasa</p><p className="text-[10px] text-[#9CA3AF]">{settings?.language === 'id' ? 'Indonesia' : 'English'}</p></div></div>
            <button onClick={() => updateSettings({ language: settings?.language === 'id' ? 'en' : 'id' })} className="px-3 py-1.5 rounded-lg bg-[#262626] text-xs text-[#F5F5F5]">{settings?.language === 'id' ? 'ID' : 'EN'}</button>
          </div>

          {/* Currency */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
            <div className="flex items-center gap-3"><span className="text-[#9CA3AF]">💱</span><div><p className="text-sm text-[#F5F5F5]">Mata Uang</p><p className="text-[10px] text-[#9CA3AF]">{currency}</p></div></div>
            <select value={currency} onChange={(e) => updateSettings({ currency: e.target.value })} className="px-3 py-1.5 rounded-lg bg-[#262626] text-xs text-[#F5F5F5] border-none focus:outline-none">
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.symbol}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Accounts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider">Akun</h3>
          <button onClick={() => setShowAddAccount(true)} className="flex items-center gap-1 text-xs text-[#22C55E]"><Plus size={14} /> Tambah</button>
        </div>
        {accounts.length === 0 ? <div className="text-center py-6"><Wallet size={32} className="text-[#9CA3AF] mx-auto mb-2" /><p className="text-[#9CA3AF] text-sm">Belum ada akun</p></div> :
          <div className="space-y-2">{accounts.map(acc => (
            <div key={acc.uid} className="flex items-center justify-between p-3 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
              <div className="flex items-center gap-3"><span className="text-xl">{acc.icon}</span><div><p className="text-sm text-[#F5F5F5]">{acc.name}</p><p className="text-[10px] text-[#9CA3AF]">Saldo awal: {formatCurrency(acc.openingBalance, currency)}</p></div></div>
              <button onClick={() => setShowDeleteAccount(acc.uid)} className="p-2 rounded-lg hover:bg-[#2C2C2E]"><Trash2 size={14} className="text-[#9CA3AF]" /></button>
            </div>
          ))}</div>}
      </section>

      {/* Data */}
      <section>
        <h3 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Data</h3>
        <div className="space-y-2">
          <button onClick={handleExportCSV} className="w-full flex items-center justify-between p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] active:bg-[#262626]">
            <div className="flex items-center gap-3"><Download size={18} className="text-[#22C55E]" /><div className="text-left"><p className="text-sm text-[#F5F5F5]">Export CSV</p><p className="text-[10px] text-[#9CA3AF]">Download semua transaksi</p></div></div>
          </button>
          <button onClick={handleExportBackup} className="w-full flex items-center justify-between p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] active:bg-[#262626]">
            <div className="flex items-center gap-3"><Database size={18} className="text-[#3B82F6]" /><div className="text-left"><p className="text-sm text-[#F5F5F5]">Backup Data</p><p className="text-[10px] text-[#9CA3AF]">Simpan semua data (JSON)</p></div></div>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] active:bg-[#262626]">
            <div className="flex items-center gap-3"><Upload size={18} className="text-[#A855F7]" /><div className="text-left"><p className="text-sm text-[#F5F5F5]">Import Backup</p><p className="text-[10px] text-[#9CA3AF]">Restore dari file backup</p></div></div>
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          <button onClick={() => setShowDummyConfirm(true)} className="w-full flex items-center justify-between p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] active:bg-[#262626]">
            <div className="flex items-center gap-3"><Database size={18} className="text-[#3B82F6]" /><div className="text-left"><p className="text-sm text-[#F5F5F5]">Load Dummy Data</p><p className="text-[10px] text-[#9CA3AF]">Muat data contoh untuk mencoba</p></div></div>
          </button>
          <button onClick={() => setShowResetConfirm1(true)} className="w-full flex items-center justify-between p-4 rounded-xl bg-[#1C1C1E] border border-[#EF4444]/20 active:bg-[#262626]">
            <div className="flex items-center gap-3"><AlertTriangle size={18} className="text-[#EF4444]" /><div className="text-left"><p className="text-sm text-[#EF4444]">Reset Semua Data</p><p className="text-[10px] text-[#9CA3AF]">Hapus semua data dan mulai dari awal</p></div></div>
          </button>
        </div>
      </section>

      <section className="text-center py-4">
        <p className="text-[10px] text-[#9CA3AF]">Finance Tracker v2.0</p>
        <p className="text-[10px] text-[#22C55E]">✓ IndexedDB • ✓ Export/Import • ✓ Undo</p>
      </section>

      {/* Dialogs */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#2C2C2E]">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-[#F5F5F5]">Tambah Akun</h3><button onClick={() => setShowAddAccount(false)}><X size={20} className="text-[#9CA3AF]" /></button></div>
            <div className="space-y-3">
              <input type="text" value={accName} onChange={(e) => setAccName(e.target.value)} placeholder="Nama akun" className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none" />
              <div className="flex gap-2 flex-wrap">{accountIcons.map(icon => (<button key={icon} onClick={() => setAccIcon(icon)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-colors ${accIcon === icon ? 'bg-[#22C55E]/20 border border-[#22C55E]/30' : 'bg-[#262626] border border-[#2C2C2E]'}`}>{icon}</button>))}</div>
              <input type="number" value={accBalance} onChange={(e) => setAccBalance(e.target.value)} placeholder="Saldo awal" className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none" />
              <label className="flex items-center gap-2 text-sm text-[#9CA3AF]"><input type="checkbox" checked={accIsSavings} onChange={(e) => setAccIsSavings(e.target.checked)} className="rounded" />Akun tabungan</label>
              <button onClick={handleAddAccount} disabled={!accName || !accBalance} className="w-full py-3 rounded-xl bg-[#22C55E] text-white font-semibold text-sm disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAccount && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#2C2C2E]">
            <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">Hapus Akun?</h3>
            <p className="text-sm text-[#9CA3AF] mb-6">{(() => { const txCount = getAccountTxCount(showDeleteAccount); return txCount > 0 ? `Akun ini memiliki ${txCount} transaksi. Semua transaksi terkait juga akan dihapus.` : 'Akun ini akan dihapus permanen.'; })()}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteAccount(null)} className="flex-1 py-3 rounded-xl bg-[#262626] text-[#F5F5F5] font-medium text-sm">Batal</button>
              <button onClick={() => { deleteAccount(showDeleteAccount); setShowDeleteAccount(null); hapticFeedback('medium'); }} className="flex-1 py-3 rounded-xl bg-[#EF4444] text-white font-medium text-sm">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {showDummyConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#2C2C2E]">
            <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">Load Dummy Data?</h3>
            <p className="text-sm text-[#9CA3AF] mb-6">Data saat ini akan DIGANTI dengan data contoh.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDummyConfirm(false)} className="flex-1 py-3 rounded-xl bg-[#262626] text-[#F5F5F5] font-medium text-sm">Batal</button>
              <button onClick={handleLoadDummy} className="flex-1 py-3 rounded-xl bg-[#3B82F6] text-white font-medium text-sm">Load</button>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm1 && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#EF4444]/20">
            <div className="flex items-center gap-2 mb-3"><AlertTriangle size={20} className="text-[#EF4444]" /><h3 className="text-lg font-bold text-[#EF4444]">Reset Semua Data?</h3></div>
            <p className="text-sm text-[#9CA3AF] mb-6">SEMUA data akan dihapus permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowResetConfirm1(false)} className="flex-1 py-3 rounded-xl bg-[#262626] text-[#F5F5F5] font-medium text-sm">Batal</button>
              <button onClick={() => { setShowResetConfirm1(false); setShowResetConfirm2(true); }} className="flex-1 py-3 rounded-xl bg-[#EF4444] text-white font-medium text-sm">Lanjut</button>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm2 && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#EF4444]/20">
            <h3 className="text-lg font-bold text-[#EF4444] mb-2">Konfirmasi Terakhir</h3>
            <p className="text-sm text-[#9CA3AF] mb-6">Apakah kamu YAKIN? Tindakan ini TIDAK BISA dibatalkan.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowResetConfirm2(false)} className="flex-1 py-3 rounded-xl bg-[#262626] text-[#F5F5F5] font-medium text-sm">Batal</button>
              <button onClick={handleReset} className="flex-1 py-3 rounded-xl bg-[#EF4444] text-white font-medium text-sm">Ya, Hapus Semua</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
