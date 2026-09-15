--- ALL_CODE_PART1.md (原始)


+++ ALL_CODE_PART1.md (修改后)
# 📝 SEMUA SOURCE CODE APLIKASI FINANCE TRACKER
## Versi Terakhir (Final Release v2.1.0)

**Total Source Files**: 33 files
**Total Lines**: ~15,000+ lines

---

## 📋 DAFTAR ISI

1. [Entry Points](#1-entry-points)
2. [Components](#2-components)
3. [Context](#3-context)
4. [Database](#4-database)
5. [Hooks](#5-hooks)
6. [Screens](#6-screens)
7. [Utils](#7-utils)

---

## 1. ENTRY POINTS

### 📄 src/main.tsx
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
```

### 📄 src/App.tsx
```tsx
// Main App - Entry point with Bottom Navigation, FAB, keyboard shortcuts, gestures
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DatabaseProvider, useDatabase } from './context/DatabaseContext';
import { BottomNav, TabRoute } from './components/BottomNav';
import { Dashboard } from './screens/Dashboard';
import { Detail } from './screens/Detail';
import { Investments, InvestmentForm } from './screens/Investments';
import { Plans } from './screens/Plans';
import { Settings } from './screens/Settings';
import { TransactionForm } from './screens/TransactionForm';
import { ErrorBoundary, ToastContainer, useKeyboardShortcuts } from './components/UI';
import { OnboardingTour } from './components/InvestmentFeatures';
import { FloatingActionMenu } from './components/FloatingActionMenu';
import { useGestures } from './hooks/useGestures';
import { processRecurring, processDepositRenewals } from './utils/features';
import { Menu, X } from 'lucide-react';

function AppContent() {
  const { accounts, settings, updateSettings, isLoading } = useDatabase();
  const [activeTab, setActiveTab] = useState<TabRoute>('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const bgColor = settings?.amoledMode ? '#000000' : settings?.theme === 'light' ? '#F5F5F5' : '#121212';
  const surfaceColor = settings?.amoledMode ? '#0A0A0A' : settings?.theme === 'light' ? '#FFFFFF' : '#1C1C1E';
  const textColor = settings?.theme === 'light' ? '#1C1C1E' : '#F5F5F5';

  // Show onboarding on first run
  useEffect(() => {
    if (!isLoading && settings && !settings.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [isLoading, settings]);

  const handleOnboardingComplete = async () => {
    await updateSettings({ onboardingCompleted: true });
    setShowOnboarding(false);
  };

  // Process recurring transactions and deposit renewals on app open
  useEffect(() => {
    if (!isLoading) {
      processRecurring().catch(console.error);
      processDepositRenewals().catch(console.error);
    }
  }, [isLoading]);

  const handleTabChange = useCallback((tab: TabRoute) => { setActiveTab(tab); }, []);

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

  // Gesture Navigation - Swipe to switch tabs
  const tabs: TabRoute[] = ['dashboard', 'detail', 'investments', 'plans', 'settings'];
  const { handlers: gestureHandlers } = useGestures({
    onSwipeLeft: () => {
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      }
    },
    onSwipeRight: () => {
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    },
    threshold: 50,
  });

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
    <div
      className="h-screen flex flex-col overflow-hidden transition-colors duration-200"
      style={{ backgroundColor: bgColor }}
      {...gestureHandlers}
    >
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

      {/* Floating Action Menu - Replace FAB */}
      {!showForm && !showInvestmentForm && (
        <FloatingActionMenu
          onAddTransaction={() => {
            if (accounts.length === 0) {
              setActiveTab('settings');
              return;
            }
            setShowForm(true);
          }}
          onAddInvestment={() => setShowInvestmentForm(true)}
          onAddGoal={() => setActiveTab('plans')}
          onOpenCalculator={() => {
            // TODO: Open DCA Calculator
            console.log('Open calculator');
          }}
          accentColor={settings?.accentColor || '#22C55E'}
        />
      )}

      {/* Bottom Navigation */}
      {!showForm && !showInvestmentForm && <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />}

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

      {/* Onboarding Tour */}
      {showOnboarding && <OnboardingTour onComplete={handleOnboardingComplete} />}

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
```

### 📄 src/index.css
```css
@import "tailwindcss";

@layer base {
  * {
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
  }

  html {
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #121212;
    color: #F5F5F5;
    overflow: hidden;
    overscroll-behavior: none;
    -webkit-overflow-scrolling: touch;
    touch-action: manipulation;
    user-select: none;
    -webkit-user-select: none;
  }

  /* Safe area padding for notched devices */
  .safe-top {
    padding-top: env(safe-area-inset-top);
  }

  .safe-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }

  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: #2C2C2E;
    border-radius: 4px;
  }

  /* Input styles */
  input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(1);
    opacity: 0.5;
  }

  select {
    appearance: none;
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
  }

  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type="number"] {
    -moz-appearance: textfield;
  }

  /* Prevent zoom on input focus (iOS) */
  input, select, textarea {
    font-size: 16px !important;
  }

  /* Smooth scrolling */
  * {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }

  /* Active state for buttons */
  button:active {
    transition: transform 0.1s ease-out;
  }

  /* Prevent text selection on interactive elements */
  button, a, [role="button"] {
    user-select: none;
    -webkit-user-select: none;
  }
}

@layer utilities {
  .animate-slide-in {
    animation: slideIn 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .animate-fade-in {
    animation: fadeIn 180ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .animate-scale-in {
    animation: scaleIn 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .animate-slide-up {
    animation: slideUp 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Micro-interactions */
  .animate-bounce-in {
    animation: bounceIn 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  .animate-pulse-soft {
    animation: pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .animate-shimmer {
    animation: shimmer 2s linear infinite;
  }

  /* Touch-friendly tap targets */
  .touch-target {
    min-height: 44px;
    min-width: 44px;
  }

  /* Prevent pull-to-refresh on scrollable containers */
  .no-pull-refresh {
    overscroll-behavior-y: contain;
  }

  /* Accessibility - Focus indicators */
  .focus-visible-ring:focus-visible {
    outline: 2px solid #22C55E;
    outline-offset: 2px;
  }

  /* Accessibility - Screen reader only */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .high-contrast-border {
      border-width: 2px;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .animate-slide-in,
    .animate-fade-in,
    .animate-scale-in,
    .animate-slide-up,
    .animate-bounce-in,
    .animate-pulse-soft,
    .animate-shimmer {
      animation: none;
    }
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.92);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes pulseSoft {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
```

---

**File ini terlalu besar untuk ditampilkan sekaligus.**

**Lanjutkan ke file berikutnya:** [ALL_CODE_PART2.md](./ALL_CODE_PART2.md)

Atau baca file asli di folder `src/` untuk melihat kode lengkap setiap file.
