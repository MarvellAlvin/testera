--- src/components/BottomNav.tsx (原始)
// Bottom Navigation Bar - Material 3 style
// Spec: 80dp height, bg #1C1C1E, 5 items, green active #22C55E

import React from 'react';
import { LayoutGrid, FileText, MessageCircle, Clock, Settings } from 'lucide-react';

export type TabRoute = 'dashboard' | 'detail' | 'chatbot' | 'plans' | 'settings';

interface BottomNavProps {
  activeTab: TabRoute;
  onTabChange: (tab: TabRoute) => void;
}

const tabs: { route: TabRoute; label: string; icon: React.ReactNode }[] = [
  { route: 'dashboard', label: 'Dashboard', icon: <LayoutGrid size={22} /> },
  { route: 'detail', label: 'Detail', icon: <FileText size={22} /> },
  { route: 'chatbot', label: 'Chat Bot', icon: <MessageCircle size={22} /> },
  { route: 'plans', label: 'Plans', icon: <Clock size={22} /> },
  { route: 'settings', label: 'Settings', icon: <Settings size={22} /> },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 flex items-center justify-around px-2 z-50"
      style={{ backgroundColor: '#1C1C1E' }}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.route;
        return (
          <button
            key={tab.route}
            onClick={() => onTabChange(tab.route)}
            className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-150 min-w-[60px]"
            style={{
              transform: isActive ? 'scale(1)' : 'scale(0.92)',
            }}
          >
            <div className={`relative flex items-center justify-center w-10 h-8 rounded-full transition-colors duration-150 ${
              isActive ? 'bg-[#22C55E]/20' : ''
            }`}>
              <span style={{ color: isActive ? '#22C55E' : '#9CA3AF' }}>
                {tab.icon}
              </span>
            </div>
            <span
              className="text-[10px] font-medium transition-colors duration-150"
              style={{ color: isActive ? '#22C55E' : '#9CA3AF' }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}


+++ src/components/BottomNav.tsx (修改后)
// Bottom Navigation Bar - 4 tabs (chatbot removed)
import React from 'react';
import { LayoutGrid, FileText, Clock, Settings } from 'lucide-react';

export type TabRoute = 'dashboard' | 'detail' | 'plans' | 'settings';

interface BottomNavProps {
  activeTab: TabRoute;
  onTabChange: (tab: TabRoute) => void;
}

const tabs: { route: TabRoute; label: string; icon: React.ReactNode }[] = [
  { route: 'dashboard', label: 'Dashboard', icon: <LayoutGrid size={22} /> },
  { route: 'detail', label: 'Detail', icon: <FileText size={22} /> },
  { route: 'plans', label: 'Plans', icon: <Clock size={22} /> },
  { route: 'settings', label: 'Settings', icon: <Settings size={22} /> },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 flex items-center justify-around px-2 z-50"
      style={{ backgroundColor: '#1C1C1E' }}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.route;
        return (
          <button
            key={tab.route}
            onClick={() => onTabChange(tab.route)}
            className="flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-all duration-150 min-w-[70px]"
            style={{ transform: isActive ? 'scale(1)' : 'scale(0.92)' }}
          >
            <div className={`relative flex items-center justify-center w-10 h-8 rounded-full transition-colors duration-150 ${
              isActive ? 'bg-[#22C55E]/20' : ''
            }`}>
              <span style={{ color: isActive ? '#22C55E' : '#9CA3AF' }}>
                {tab.icon}
              </span>
            </div>
            <span className="text-[10px] font-medium transition-colors duration-150"
              style={{ color: isActive ? '#22C55E' : '#9CA3AF' }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
