--- src/App.tsx (原始)
// Main App - Entry point with Bottom Navigation, FAB, keyboard shortcuts
import React, { useState, useCallback, useEffect } from 'react';
import { DatabaseProvider, useDatabase } from './context/DatabaseContext';
import { BottomNav, TabRoute } from './components/BottomNav';
import { Dashboard } from './screens/Dashboard';
import { Detail } from './screens/Detail';
import { Investments, InvestmentForm } from './screens/Investments';
import { Plans } from './screens/Plans';
import { Settings } from './screens/Settings';
import { TransactionForm } from './screens/TransactionForm';
import { ErrorBoundary, ToastContainer, useKeyboardShortcuts } from './components/UI';
import { processRecurring } from './utils/features';
import { Plus, Menu, X } from 'lucide-react';

function AppContent() {
  const { accounts, settings, updateSettings, isLoading } = useDatabase();
  const [activeTab, setActiveTab] = useState<TabRoute>('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  const bgColor = settings?.amoledMode ? '#000000' : settings?.theme === 'light' ? '#F5F5F5' : '#121212';
  const surfaceColor = settings?.amoledMode ? '#0A0A0A' : settings?.theme === 'light' ? '#FFFFFF' : '#1C1C1E';
  const textColor = settings?.theme === 'light' ? '#1C1C1E' : '#F5F5F5';

  // Process recurring transactions on app open
  useEffect(() => {
    if (!isLoading) {
      processRecurring().catch(console.error);
    }
  }, [isLoading]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'n', action: () => { if (accounts.length > 0) setShowForm(true); }, description: 'New transaction' },
    { key: '1', action: () => setActiveTab('dashboard'), description: 'Dashboard' },
    { key: '2', action: () => setActiveTab('detail'), description: 'Detail' },
    { key: '3', action: () => setActiveTab('investments'), description: 'Investasi' },
    { key: '4', action: () => setActiveTab('plans'), description: 'Plans' },
    { key: '5', action: () => setActiveTab('settings'), description: 'Settings' },
    { key: 'Escape', action: () => { setShowForm(false); setShowInvestmentForm(false); setShowDrawer(false); }, description: 'Close' },
  ]);

  const handleTabChange = useCallback((tab: TabRoute) => { setActiveTab(tab); }, []);

  const [showInvestmentForm, setShowInvestmentForm] = useState(false);

  const handleAddTransaction = useCallback(() => {
    // Contextual FAB: if on investments tab, add investment instead
    if (activeTab === 'investments') {
      setShowInvestmentForm(true);
      return;
    }
    if (accounts.length === 0) { setActiveTab('settings'); return; }
    setShowForm(true);
  }, [accounts.length, activeTab]);

  const handleLoadDummy = useCallback(() => {}, []);
  const handleNavigateAccounts = useCallback(() => { setActiveTab('settings'); }, []);

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={(tab) => setActiveTab(tab as TabRoute)} onAddTransaction={handleAddTransaction} onLoadDummy={handleLoadDummy} onNavigateAccounts={handleNavigateAccounts} />;
      case 'detail':
        return <Detail onAddTransaction={handleAddTransaction} />;
      case 'investments':
        return <Investments />;
      case 'plans':
        return <Plans />;
      case 'settings':
        return <Settings onReset={() => setActiveTab('dashboard')} onLoadDummy={() => setActiveTab('dashboard')} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">💰</div>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden transition-colors duration-200" style={{ backgroundColor: bgColor }}>
      {/* Header */}
      {!showForm && (
        <header className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ backgroundColor: surfaceColor, borderColor: '#2C2C2E' }}>
          <button onClick={() => setShowDrawer(!showDrawer)} className="p-2 rounded-xl hover:bg-[#262626] transition-colors">
            <Menu size={20} style={{ color: textColor }} />
          </button>
          <h1 className="text-base font-bold" style={{ color: textColor }}>
            {activeTab === 'dashboard' && '💰 Finance Tracker'}
            {activeTab === 'detail' && '📋 Detail Transaksi'}
            {activeTab === 'investments' && '📈 Investasi'}
            {activeTab === 'plans' && '📅 Plans'}
            {activeTab === 'settings' && '⚙️ Settings'}
          </h1>
          <div className="w-10" />
        </header>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20" style={{ backgroundColor: bgColor }}>
        <ErrorBoundary>
          <div className="transition-opacity duration-180">{renderScreen()}</div>
        </ErrorBoundary>
      </main>

      {/* FAB */}
      {!showForm && (
        <button onClick={handleAddTransaction}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40 active:scale-[0.92] transition-transform"
          style={{ backgroundColor: settings?.accentColor || '#22C55E', boxShadow: `0 4px 14px ${settings?.accentColor || '#22C55E'}40` }}>
          <Plus size={24} className="text-white" />
        </button>
      )}

      {/* Bottom Navigation */}
      {!showForm && <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />}

      {/* Drawer */}
      {showDrawer && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowDrawer(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-72 z-50 p-4 flex flex-col animate-slide-in" style={{ backgroundColor: surfaceColor }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${settings?.accentColor || '#22C55E'}20` }}>
                  <span className="text-lg">💰</span>
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: textColor }}>Finance Tracker</p>
                  <p className="text-[10px] font-medium" style={{ color: settings?.accentColor || '#22C55E' }}>
                    v2.0 • IndexedDB
                  </p>
                </div>
              </div>
              <button onClick={() => setShowDrawer(false)} className="p-2 rounded-lg hover:bg-[#262626]">
                <X size={18} className="text-[#9CA3AF]" />
              </button>
            </div>

            <nav className="space-y-1">
              <DrawerItem icon="📊" label="Dashboard" onClick={() => { setShowDrawer(false); setActiveTab('dashboard'); }} />
              <DrawerItem icon="📋" label="Detail Transaksi" onClick={() => { setShowDrawer(false); setActiveTab('detail'); }} />
              <DrawerItem icon="📈" label="Investasi" onClick={() => { setShowDrawer(false); setActiveTab('investments'); }} />
              <DrawerItem icon="📅" label="Plans" onClick={() => { setShowDrawer(false); setActiveTab('plans'); }} />
              <DrawerItem icon="⚙️" label="Settings" onClick={() => { setShowDrawer(false); setActiveTab('settings'); }} />
            </nav>

            <div className="mt-6">
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-2">Keyboard Shortcuts</p>
              <div className="space-y-1">
                <ShortcutHint keys="N" label="Transaksi baru" />
                <ShortcutHint keys="1-5" label="Pindah tab" />
                <ShortcutHint keys="Esc" label="Tutup" />
              </div>
            </div>

            <div className="mt-auto">
              <div className="p-3 rounded-xl bg-[#262626] border border-[#2C2C2E]">
                <p className="text-[10px] text-[#9CA3AF]">Fitur v2.1</p>
                <p className="text-xs text-[#22C55E] font-medium">✓ IndexedDB (Dexie)</p>
                <p className="text-xs text-[#22C55E] font-medium">✓ Auto-format angka (titik)</p>
                <p className="text-xs text-[#22C55E] font-medium">✓ Investasi terpisah</p>
                <p className="text-xs text-[#22C55E] font-medium">✓ Charts distribusi aset</p>
                <p className="text-xs text-[#22C55E] font-medium">✓ Export/Import CSV & JSON</p>
                <p className="text-xs text-[#22C55E] font-medium">✓ Undo/Redo & Templates</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Transaction Form */}
      {showForm && <TransactionForm onClose={() => setShowForm(false)} />}

      {/* Investment Form (contextual FAB on investment tab) */}
      {showInvestmentForm && <InvestmentForm onClose={() => setShowInvestmentForm(false)} />}

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}

function DrawerItem({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-[#262626] transition-colors text-left">
      <span className="text-lg">{icon}</span>
      <span className="text-sm text-[#F5F5F5] flex-1">{label}</span>
    </button>
  );
}

function ShortcutHint({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <kbd className="px-1.5 py-0.5 rounded bg-[#2C2C2E] text-[10px] text-[#9CA3AF] font-mono">{keys}</kbd>
      <span className="text-[10px] text-[#9CA3AF]">{label}</span>
    </div>
  );
}

function App() {
  return (
    <DatabaseProvider>
      <AppContent />
    </DatabaseProvider>
  );
}

export default App;


+++ src/App.tsx (修改后)
// Main App - Entry point with Bottom Navigation, FAB, keyboard shortcuts
import React, { useState, useCallback, useEffect } from 'react';
import { DatabaseProvider, useDatabase } from './context/DatabaseContext';
import { BottomNav, TabRoute } from './components/BottomNav';
import { Dashboard } from './screens/Dashboard';
import { Detail } from './screens/Detail';
import { Investments, InvestmentForm } from './screens/Investments';
import { Plans } from './screens/Plans';
import { Settings } from './screens/Settings';
import { TransactionForm } from './screens/TransactionForm';
import { ErrorBoundary, ToastContainer, useKeyboardShortcuts } from './components/UI';
import { processRecurring } from './utils/features';
import { Plus, Menu, X } from 'lucide-react';

function AppContent() {
  const { accounts, settings, updateSettings, isLoading } = useDatabase();
  const [activeTab, setActiveTab] = useState<TabRoute>('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  const bgColor = settings?.amoledMode ? '#000000' : settings?.theme === 'light' ? '#F5F5F5' : '#121212';
  const surfaceColor = settings?.amoledMode ? '#0A0A0A' : settings?.theme === 'light' ? '#FFFFFF' : '#1C1C1E';
  const textColor = settings?.theme === 'light' ? '#1C1C1E' : '#F5F5F5';

  // Process recurring transactions on app open
  useEffect(() => {
    if (!isLoading) {
      processRecurring().catch(console.error);
    }
  }, [isLoading]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'n', action: () => { if (accounts.length > 0) setShowForm(true); }, description: 'New transaction' },
    { key: '1', action: () => setActiveTab('dashboard'), description: 'Dashboard' },
    { key: '2', action: () => setActiveTab('detail'), description: 'Detail' },
    { key: '3', action: () => setActiveTab('investments'), description: 'Investasi' },
    { key: '4', action: () => setActiveTab('plans'), description: 'Plans' },
    { key: '5', action: () => setActiveTab('settings'), description: 'Settings' },
    { key: 'Escape', action: () => { setShowForm(false); setShowInvestmentForm(false); setShowDrawer(false); }, description: 'Close' },
  ]);

  const handleTabChange = useCallback((tab: TabRoute) => { setActiveTab(tab); }, []);

  const [showInvestmentForm, setShowInvestmentForm] = useState(false);

  const handleAddTransaction = useCallback(() => {
    // Contextual FAB: if on investments tab, add investment instead
    if (activeTab === 'investments') {
      setShowInvestmentForm(true);
      return;
    }
    if (accounts.length === 0) { setActiveTab('settings'); return; }
    setShowForm(true);
  }, [accounts.length, activeTab]);

  const handleLoadDummy = useCallback(() => {}, []);
  const handleNavigateAccounts = useCallback(() => { setActiveTab('settings'); }, []);

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={(tab) => setActiveTab(tab as TabRoute)} onAddTransaction={handleAddTransaction} onLoadDummy={handleLoadDummy} onNavigateAccounts={handleNavigateAccounts} />;
      case 'detail':
        return <Detail onAddTransaction={handleAddTransaction} />;
      case 'investments':
        return <Investments />;
      case 'plans':
        return <Plans />;
      case 'settings':
        return <Settings onReset={() => setActiveTab('dashboard')} onLoadDummy={() => setActiveTab('dashboard')} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">💰</div>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden transition-colors duration-200" style={{ backgroundColor: bgColor }}>
      {/* Header */}
      {!showForm && (
        <header className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ backgroundColor: surfaceColor, borderColor: '#2C2C2E' }}>
          <button onClick={() => setShowDrawer(!showDrawer)} className="p-2 rounded-xl hover:bg-[#262626] transition-colors">
            <Menu size={20} style={{ color: textColor }} />
          </button>
          <h1 className="text-base font-bold" style={{ color: textColor }}>
            {activeTab === 'dashboard' && '💰 Finance Tracker'}
            {activeTab === 'detail' && '📋 Detail Transaksi'}
            {activeTab === 'investments' && '📈 Investasi'}
            {activeTab === 'plans' && '📅 Plans'}
            {activeTab === 'settings' && '⚙️ Settings'}
          </h1>
          <div className="w-10" />
        </header>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20" style={{ backgroundColor: bgColor }}>
        <ErrorBoundary>
          <div className="transition-opacity duration-180">{renderScreen()}</div>
        </ErrorBoundary>
      </main>

      {/* FAB - Smaller on investments tab to avoid blocking content */}
      {!showForm && !showInvestmentForm && (
        <button onClick={handleAddTransaction}
          className={`fixed right-4 rounded-full flex items-center justify-center shadow-lg z-40 active:scale-[0.92] transition-all ${
            activeTab === 'investments'
              ? 'bottom-24 w-11 h-11'
              : 'bottom-24 w-14 h-14'
          }`}
          style={{ backgroundColor: settings?.accentColor || '#22C55E', boxShadow: `0 4px 14px ${settings?.accentColor || '#22C55E'}40` }}>
          <Plus size={activeTab === 'investments' ? 20 : 24} className="text-white" />
        </button>
      )}

      {/* Bottom Navigation */}
      {!showForm && <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />}

      {/* Drawer */}
      {showDrawer && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowDrawer(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-72 z-50 p-4 flex flex-col animate-slide-in" style={{ backgroundColor: surfaceColor }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${settings?.accentColor || '#22C55E'}20` }}>
                  <span className="text-lg">💰</span>
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: textColor }}>Finance Tracker</p>
                  <p className="text-[10px] font-medium" style={{ color: settings?.accentColor || '#22C55E' }}>
                    v2.0 • IndexedDB
                  </p>
                </div>
              </div>
              <button onClick={() => setShowDrawer(false)} className="p-2 rounded-lg hover:bg-[#262626]">
                <X size={18} className="text-[#9CA3AF]" />
              </button>
            </div>

            <nav className="space-y-1">
              <DrawerItem icon="📊" label="Dashboard" onClick={() => { setShowDrawer(false); setActiveTab('dashboard'); }} />
              <DrawerItem icon="📋" label="Detail Transaksi" onClick={() => { setShowDrawer(false); setActiveTab('detail'); }} />
              <DrawerItem icon="📈" label="Investasi" onClick={() => { setShowDrawer(false); setActiveTab('investments'); }} />
              <DrawerItem icon="📅" label="Plans" onClick={() => { setShowDrawer(false); setActiveTab('plans'); }} />
              <DrawerItem icon="⚙️" label="Settings" onClick={() => { setShowDrawer(false); setActiveTab('settings'); }} />
            </nav>

            <div className="mt-6">
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-2">Keyboard Shortcuts</p>
              <div className="space-y-1">
                <ShortcutHint keys="N" label="Transaksi baru" />
                <ShortcutHint keys="1-5" label="Pindah tab" />
                <ShortcutHint keys="Esc" label="Tutup" />
              </div>
            </div>

            <div className="mt-auto">
              <div className="p-3 rounded-xl bg-[#262626] border border-[#2C2C2E]">
                <p className="text-[10px] text-[#9CA3AF]">Fitur v2.1</p>
                <p className="text-xs text-[#22C55E] font-medium">✓ IndexedDB (Dexie)</p>
                <p className="text-xs text-[#22C55E] font-medium">✓ Auto-format angka (titik)</p>
                <p className="text-xs text-[#22C55E] font-medium">✓ Investasi terpisah</p>
                <p className="text-xs text-[#22C55E] font-medium">✓ Charts distribusi aset</p>
                <p className="text-xs text-[#22C55E] font-medium">✓ Export/Import CSV & JSON</p>
                <p className="text-xs text-[#22C55E] font-medium">✓ Undo/Redo & Templates</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Transaction Form */}
      {showForm && <TransactionForm onClose={() => setShowForm(false)} />}

      {/* Investment Form (contextual FAB on investment tab) */}
      {showInvestmentForm && <InvestmentForm onClose={() => setShowInvestmentForm(false)} />}

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}

function DrawerItem({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-[#262626] transition-colors text-left">
      <span className="text-lg">{icon}</span>
      <span className="text-sm text-[#F5F5F5] flex-1">{label}</span>
    </button>
  );
}

function ShortcutHint({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <kbd className="px-1.5 py-0.5 rounded bg-[#2C2C2E] text-[10px] text-[#9CA3AF] font-mono">{keys}</kbd>
      <span className="text-[10px] text-[#9CA3AF]">{label}</span>
    </div>
  );
}

function App() {
  return (
    <DatabaseProvider>
      <AppContent />
    </DatabaseProvider>
  );
}

export default App;
