--- src/components/LevelUpSystem.tsx (原始)


+++ src/components/LevelUpSystem.tsx (修改后)
// Level Up System - Visual growth representation
import React from 'react';
import { TrendingUp, Award, Star } from 'lucide-react';

interface LevelUpSystemProps {
  xp: number;
  level: number;
  totalTransactions: number;
  totalInvestments: number;
}

export function LevelUpSystem({ xp, level, totalTransactions, totalInvestments }: LevelUpSystemProps) {
  // Calculate progress to next level (100 XP per level)
  const currentLevelXP = (level - 1) * 100;
  const xpInCurrentLevel = xp - currentLevelXP;
  const progressToNextLevel = (xpInCurrentLevel / 100) * 100;

  // Determine level tier and icon
  const getLevelInfo = (level: number) => {
    if (level < 5) return { tier: 'Pemula', icon: '🌱', color: '#22C55E' };
    if (level < 10) return { tier: 'Menengah', icon: '🌿', color: '#3B82F6' };
    if (level < 20) return { tier: 'Berpengalaman', icon: '🌳', color: '#A855F7' };
    if (level < 50) return { tier: 'Ahli', icon: '⭐', color: '#EAB308' };
    return { tier: 'Master', icon: '👑', color: '#FB923C' };
  };

  const levelInfo = getLevelInfo(level);

  // Calculate growth visualization
  const growthStages = [
    { threshold: 0, label: 'Benih', icon: '🌰' },
    { threshold: 10, label: 'Tunas', icon: '🌱' },
    { threshold: 25, label: 'Pucuk', icon: '🌿' },
    { threshold: 50, label: 'Pohon Muda', icon: '🪴' },
    { threshold: 100, label: 'Pohon', icon: '🌳' },
  ];

  const currentGrowth = growthStages.reduce((prev, stage) => {
    return level >= stage.threshold ? stage : prev;
  }, growthStages[0]);

  return (
    <div className="mx-4 mt-3 p-4 rounded-xl bg-gradient-to-br from-[#22C55E]/10 to-[#3B82F6]/10 border border-[#22C55E]/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award size={18} className={levelInfo.color} />
          <h3 className="text-sm font-semibold text-[#F5F5F5]">Level & Pertumbuhan</h3>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-2xl">{levelInfo.icon}</span>
          <span className="text-lg font-bold" style={{ color: levelInfo.color }}>
            Lv.{level}
          </span>
        </div>
      </div>

      {/* Level Tier */}
      <div className="mb-3">
        <p className="text-xs text-[#9CA3AF] mb-1">{levelInfo.tier}</p>
        <div className="h-2 bg-[#2C2C2E] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressToNextLevel}%`,
              backgroundColor: levelInfo.color,
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-[#9CA3AF]">{xpInCurrentLevel} XP</span>
          <span className="text-[10px] text-[#9CA3AF]">{100 - xpInCurrentLevel} XP ke Lv.{level + 1}</span>
        </div>
      </div>

      {/* Growth Visualization */}
      <div className="mb-3">
        <p className="text-xs text-[#9CA3AF] mb-2">Perjalanan Investasi</p>
        <div className="flex items-center justify-between">
          {growthStages.map((stage, index) => (
            <React.Fragment key={stage.threshold}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    level >= stage.threshold
                      ? 'bg-[#22C55E]/20 border-2 border-[#22C55E]/50 scale-110'
                      : 'bg-[#262626] border-2 border-[#2C2C2E] opacity-50'
                  }`}
                >
                  <span className="text-lg">{stage.icon}</span>
                </div>
                <span className="text-[9px] text-[#9CA3AF] text-center">{stage.label}</span>
              </div>
              {index < growthStages.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 ${
                    level >= growthStages[index + 1].threshold ? 'bg-[#22C55E]' : 'bg-[#2C2C2E]'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-2 rounded-lg bg-[#262626]">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-[#22C55E]" />
            <span className="text-xs text-[#9CA3AF]">Total XP</span>
          </div>
          <p className="text-lg font-bold text-[#F5F5F5]">{xp}</p>
        </div>
        <div className="p-2 rounded-lg bg-[#262626]">
          <div className="flex items-center gap-2 mb-1">
            <Star size={14} className="text-[#EAB308]" />
            <span className="text-xs text-[#9CA3AF]">Transaksi</span>
          </div>
          <p className="text-lg font-bold text-[#F5F5F5]">{totalTransactions}</p>
        </div>
      </div>
    </div>
  );
}
