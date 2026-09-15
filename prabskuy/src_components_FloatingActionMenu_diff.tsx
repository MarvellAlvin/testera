--- src/components/FloatingActionMenu.tsx (原始)


+++ src/components/FloatingActionMenu.tsx (修改后)
// Floating Action Menu - Expandable FAB with multiple actions
import React, { useState } from 'react';
import { Plus, X, TrendingUp, Receipt, Target, Calculator } from 'lucide-react';

interface FloatingActionMenuProps {
  onAddTransaction: () => void;
  onAddInvestment: () => void;
  onAddGoal: () => void;
  onOpenCalculator: () => void;
  accentColor?: string;
}

export function FloatingActionMenu({
  onAddTransaction,
  onAddInvestment,
  onAddGoal,
  onOpenCalculator,
  accentColor = '#22C55E'
}: FloatingActionMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    { icon: <Receipt size={20} />, label: 'Transaksi', onClick: onAddTransaction, color: '#FB923C' },
    { icon: <TrendingUp size={20} />, label: 'Investasi', onClick: onAddInvestment, color: '#3B82F6' },
    { icon: <Target size={20} />, label: 'Goal', onClick: onAddGoal, color: '#A855F7' },
    { icon: <Calculator size={20} />, label: 'Kalkulator', onClick: onOpenCalculator, color: '#EAB308' },
  ];

  const handleAction = (onClick: () => void) => {
    setIsExpanded(false);
    setTimeout(onClick, 200); // Delay to allow close animation
  };

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/30 z-40 animate-fade-in"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Action Buttons */}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col-reverse items-center gap-3">
        {/* Main FAB */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 active:scale-95"
          style={{
            backgroundColor: accentColor,
            transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
            boxShadow: `0 4px 14px ${accentColor}40`
          }}
          aria-label={isExpanded ? 'Close menu' : 'Open menu'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? <X size={24} className="text-white" /> : <Plus size={24} className="text-white" />}
        </button>

        {/* Action Items */}
        {actions.map((action, index) => (
          <div
            key={action.label}
            className="flex items-center gap-3 transition-all duration-300"
            style={{
              opacity: isExpanded ? 1 : 0,
              transform: isExpanded ? 'translateY(0)' : 'translateY(20px)',
              transitionDelay: isExpanded ? `${index * 50}ms` : '0ms',
              pointerEvents: isExpanded ? 'auto' : 'none',
            }}
          >
            <div className="bg-[#1C1C1E] px-3 py-1.5 rounded-lg shadow-lg border border-[#2C2C2E]">
              <span className="text-xs text-[#F5F5F5] font-medium">{action.label}</span>
            </div>
            <button
              onClick={() => handleAction(action.onClick)}
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
              style={{
                backgroundColor: action.color,
                boxShadow: `0 4px 14px ${action.color}40`
              }}
              aria-label={action.label}
            >
              {action.icon}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
