--- src/utils/achievements.ts (原始)


+++ src/utils/achievements.ts (修改后)
// Achievement System - Gamification for investment tracking
import { db, Achievement } from '../db/dexie';

export const ACHIEVEMENT_DEFINITIONS = [
  // Beginner Achievements
  { key: 'first_investment', title: 'Investasi Pertama', description: 'Catat investasi pertamamu', icon: '🎯', category: 'beginner' as const },
  { key: 'three_assets', title: 'Diversifikasi Awal', description: 'Punya 3 jenis aset berbeda', icon: '🎨', category: 'beginner' as const },
  { key: 'five_assets', title: 'Portfolio Builder', description: 'Punya 5 aset investasi', icon: '🏗️', category: 'beginner' as const },
  { key: 'ten_assets', title: 'Investor Serius', description: 'Punya 10 aset investasi', icon: '💼', category: 'beginner' as const },
  { key: 'first_million', title: 'Jutaan Pertama', description: 'Total investasi mencapai Rp1.000.000', icon: '💰', category: 'beginner' as const },
  { key: 'ten_million', title: 'Sepuluh Juta', description: 'Total investasi mencapai Rp10.000.000', icon: '💎', category: 'beginner' as const },

  // Intermediate Achievements
  { key: 'hundred_million', title: 'Ratusan Juta', description: 'Total investasi mencapai Rp100.000.000', icon: '🏆', category: 'intermediate' as const },
  { key: 'streak_3_months', title: 'Konsisten 3 Bulan', description: 'Catat investasi 3 bulan berturut-turut', icon: '🔥', category: 'intermediate' as const },
  { key: 'streak_6_months', title: 'Konsisten 6 Bulan', description: 'Catat investasi 6 bulan berturut-turut', icon: '⚡', category: 'intermediate' as const },
  { key: 'streak_12_months', title: 'Setahun Penuh', description: 'Catat investasi 12 bulan berturut-turut', icon: '🌟', category: 'intermediate' as const },
  { key: 'all_types', title: 'Master Diversifikasi', description: 'Punya aset di semua jenis investasi', icon: '🎭', category: 'intermediate' as const },
  { key: 'profit_10_percent', title: 'Cuan 10%', description: 'Total profit mencapai 10%', icon: '📈', category: 'intermediate' as const },

  // Advanced Achievements
  { key: 'billion', title: 'Miliarder', description: 'Total investasi mencapai Rp1.000.000.000', icon: '👑', category: 'advanced' as const },
  { key: 'profit_50_percent', title: 'Cuan 50%', description: 'Total profit mencapai 50%', icon: '🚀', category: 'advanced' as const },
  { key: 'profit_100_percent', title: 'Double Your Money', description: 'Total profit mencapai 100%', icon: '💯', category: 'advanced' as const },
  { key: 'streak_24_months', title: '2 Tahun Berturut', description: 'Catat investasi 24 bulan berturut-turut', icon: '🎖️', category: 'advanced' as const },
  { key: 'fifty_transactions', title: 'Trader Aktif', description: 'Lakukan 50 transaksi investasi', icon: '⚡', category: 'advanced' as const },
  { key: 'hundred_transactions', title: 'Power Trader', description: 'Lakukan 100 transaksi investasi', icon: '💪', category: 'advanced' as const },

  // Expert Achievements
  { key: 'ten_billion', title: 'Sultan Investasi', description: 'Total investasi mencapai Rp10.000.000.000', icon: '🏰', category: 'expert' as const },
  { key: 'streak_36_months', title: '3 Tahun Berturut', description: 'Catat investasi 36 bulan berturut-turut', icon: '🎯', category: 'expert' as const },
  { key: 'streak_60_months', title: '5 Tahun Berturut', description: 'Catat investasi 60 bulan berturut-turut', icon: '🏅', category: 'expert' as const },
  { key: 'profit_200_percent', title: 'Triple Your Money', description: 'Total profit mencapai 200%', icon: '🌈', category: 'expert' as const },
  { key: 'five_hundred_transactions', title: 'Investment Master', description: 'Lakukan 500 transaksi investasi', icon: '🎓', category: 'expert' as const },
  { key: 'journal_12_months', title: 'Penulis Rajin', description: 'Tulis jurnal investasi 12 bulan', icon: '📚', category: 'expert' as const },
];

export async function initializeAchievements(): Promise<void> {
  const existing = await db.achievements.count();
  if (existing > 0) return;

  const achievements = ACHIEVEMENT_DEFINITIONS.map(def => ({
    uid: `ach-${def.key}`,
    key: def.key,
    title: def.title,
    description: def.description,
    icon: def.icon,
    progress: 0,
    category: def.category,
  }));

  await db.achievements.bulkAdd(achievements);
}

export async function checkAndUnlockAchievements(
  totalInvestment: number,
  totalAssets: number,
  assetTypes: Set<string>,
  monthlyStreak: number,
  totalTransactions: number,
  totalProfitPercent: number,
  journalMonths: number
): Promise<Achievement[]> {
  const unlocked: Achievement[] = [];

  const checks = [
    { key: 'first_investment', condition: totalAssets >= 1 },
    { key: 'three_assets', condition: totalAssets >= 3 },
    { key: 'five_assets', condition: totalAssets >= 5 },
    { key: 'ten_assets', condition: totalAssets >= 10 },
    { key: 'first_million', condition: totalInvestment >= 1000000 },
    { key: 'ten_million', condition: totalInvestment >= 10000000 },
    { key: 'hundred_million', condition: totalInvestment >= 100000000 },
    { key: 'billion', condition: totalInvestment >= 1000000000 },
    { key: 'ten_billion', condition: totalInvestment >= 10000000000 },
    { key: 'streak_3_months', condition: monthlyStreak >= 3 },
    { key: 'streak_6_months', condition: monthlyStreak >= 6 },
    { key: 'streak_12_months', condition: monthlyStreak >= 12 },
    { key: 'streak_24_months', condition: monthlyStreak >= 24 },
    { key: 'streak_36_months', condition: monthlyStreak >= 36 },
    { key: 'streak_60_months', condition: monthlyStreak >= 60 },
    { key: 'all_types', condition: assetTypes.size >= 10 },
    { key: 'profit_10_percent', condition: totalProfitPercent >= 10 },
    { key: 'profit_50_percent', condition: totalProfitPercent >= 50 },
    { key: 'profit_100_percent', condition: totalProfitPercent >= 100 },
    { key: 'profit_200_percent', condition: totalProfitPercent >= 200 },
    { key: 'fifty_transactions', condition: totalTransactions >= 50 },
    { key: 'hundred_transactions', condition: totalTransactions >= 100 },
    { key: 'five_hundred_transactions', condition: totalTransactions >= 500 },
    { key: 'journal_12_months', condition: journalMonths >= 12 },
  ];

  for (const check of checks) {
    if (check.condition) {
      const achievement = await db.achievements.where('key').equals(check.key).first();
      if (achievement && !achievement.unlockedAt) {
        await db.achievements.where('key').equals(check.key).modify({
          unlockedAt: new Date().toISOString(),
          progress: 100,
        });
        unlocked.push({ ...achievement, unlockedAt: new Date().toISOString(), progress: 100 });
      }
    }
  }

  return unlocked;
}

export async function getAchievements(): Promise<Achievement[]> {
  return await db.achievements.toArray();
}

export async function getUnlockedAchievements(): Promise<Achievement[]> {
  return await db.achievements.where('unlockedAt').above('').toArray();
}
