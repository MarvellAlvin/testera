--- src/components/InvestmentFeatures.tsx (原始)


+++ src/components/InvestmentFeatures.tsx (修改后)
// Investment Features - Notes, Journal, Achievements, Onboarding
import React, { useState, useEffect } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { formatCurrency } from '../utils/formatters';
import { getAchievements, initializeAchievements, checkAndUnlockAchievements } from '../utils/achievements';
import { db } from '../db/dexie';
import { X, BookOpen, Trophy, Sparkles, ChevronRight } from 'lucide-react';
import type { Achievement, InvestmentJournal } from '../db/dexie';

// ===== INVESTMENT NOTES & RESEARCH =====
interface InvestmentNotesProps {
  assetUid: string;
  onClose: () => void;
}

export function InvestmentNotes({ assetUid, onClose }: InvestmentNotesProps) {
  const { investments, updateInvestment } = useDatabase();
  const asset = investments.find(i => i.uid === assetUid);
  const [notes, setNotes] = useState(asset?.notes || '');
  const [research, setResearch] = useState(asset?.research || '');
  const [targetPrice, setTargetPrice] = useState(asset?.targetPrice?.toString() || '');
  const [stopLoss, setStopLoss] = useState(asset?.stopLoss?.toString() || '');
  const [tags, setTags] = useState(asset?.tags || '');

  const handleSave = async () => {
    await updateInvestment(assetUid, {
      notes,
      research,
      targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      tags,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-md w-full border border-[#2C2C2E] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-[#22C55E]" />
            <h3 className="text-lg font-bold text-[#F5F5F5]">Notes & Research</h3>
          </div>
          <button onClick={onClose}><X size={20} className="text-[#9CA3AF]" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Catatan Pribadi</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tentang aset ini..."
              rows={3}
              className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Research & Analisis</label>
            <textarea
              value={research}
              onChange={(e) => setResearch(e.target.value)}
              placeholder="Analisis fundamental, teknikal, thesis investasi..."
              rows={5}
              className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#9CA3AF] mb-1 block">Target Price</label>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="0"
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[#9CA3AF] mb-1 block">Stop Loss</label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="0"
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Tags (pisahkan dengan koma)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="long-term, dividend, growth"
              className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
            />
          </div>

          <button onClick={handleSave} className="w-full py-3 rounded-xl bg-[#22C55E] text-white font-semibold text-sm">
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== INVESTMENT JOURNAL =====
export function InvestmentJournalModal({ onClose }: { onClose: () => void }) {
  const { investments, investmentTransactions } = useDatabase();
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
  const [reflection, setReflection] = useState('');
  const [lessons, setLessons] = useState('');
  const [goals, setGoals] = useState('');

  useEffect(() => {
    (async () => {
      const journal = await db.investmentJournals.where('month').equals(month).first();
      if (journal) {
        setReflection(journal.reflection);
        setLessons(journal.lessons);
        setGoals(journal.goals);
      }
    })();
  }, [month]);

  const handleSave = async () => {
    const existing = await db.investmentJournals.where('month').equals(month).first();
    if (existing) {
      await db.investmentJournals.where('uid').equals(existing.uid).modify({
        reflection, lessons, goals,
      });
    } else {
      await db.investmentJournals.add({
        uid: `journal-${month}`,
        month,
        reflection,
        lessons,
        goals,
        createdAt: new Date().toISOString(),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-md w-full border border-[#2C2C2E] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-[#A855F7]" />
            <h3 className="text-lg font-bold text-[#F5F5F5]">Investment Journal</h3>
          </div>
          <button onClick={onClose}><X size={20} className="text-[#9CA3AF]" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Bulan</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Refleksi Bulan Ini</label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Apa yang terjadi dengan investasimu bulan ini?"
              rows={4}
              className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Pelajaran yang Dipetik</label>
            <textarea
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              placeholder="Apa yang kamu pelajari bulan ini?"
              rows={3}
              className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">Goals Bulan Depan</label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="Apa target investasimu bulan depan?"
              rows={3}
              className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none resize-none"
            />
          </div>

          <button onClick={handleSave} className="w-full py-3 rounded-xl bg-[#A855F7] text-white font-semibold text-sm">
            Simpan Jurnal
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== ACHIEVEMENTS DISPLAY =====
export function AchievementsModal({ onClose }: { onClose: () => void }) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    (async () => {
      await initializeAchievements();
      const achs = await getAchievements();
      setAchievements(achs);
    })();
  }, []);

  const categories = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
  const categoryLabels = {
    beginner: '🌱 Pemula',
    intermediate: '🌿 Menengah',
    advanced: '🌳 Lanjutan',
    expert: '👑 Ahli',
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-md w-full border border-[#2C2C2E] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-[#EAB308]" />
            <h3 className="text-lg font-bold text-[#F5F5F5]">Achievements</h3>
          </div>
          <button onClick={onClose}><X size={20} className="text-[#9CA3AF]" /></button>
        </div>

        <div className="space-y-4">
          {categories.map(cat => {
            const catAchievements = achievements.filter(a => a.category === cat);
            const unlocked = catAchievements.filter(a => a.unlockedAt).length;

            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-[#F5F5F5]">{categoryLabels[cat]}</h4>
                  <span className="text-xs text-[#9CA3AF]">{unlocked}/{catAchievements.length}</span>
                </div>
                <div className="space-y-2">
                  {catAchievements.map(ach => (
                    <div key={ach.uid} className={`p-3 rounded-xl border ${ach.unlockedAt ? 'bg-[#22C55E]/5 border-[#22C55E]/20' : 'bg-[#262626] border-[#2C2C2E] opacity-60'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{ach.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#F5F5F5]">{ach.title}</p>
                          <p className="text-[10px] text-[#9CA3AF]">{ach.description}</p>
                        </div>
                        {ach.unlockedAt && <span className="text-[#22C55E]">✓</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===== ONBOARDING TOUR =====
export function OnboardingTour({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  const steps = [
    { icon: '👋', title: 'Selamat Datang!', desc: 'Finance Tracker akan membantumu mengelola keuangan dan investasi dengan mudah.' },
    { icon: '💰', title: 'Dashboard', desc: 'Lihat ringkasan keuanganmu, total saldo, dan performa investasi.' },
    { icon: '📈', title: 'Investasi', desc: 'Catat semua aset investasimu: saham, crypto, emas, deposito, dan lainnya.' },
    { icon: '📊', title: 'Analisis', desc: 'Pantau gain/loss, riwayat transaksi, dan breakdown portfolio.' },
    { icon: '🎯', title: 'Achievements', desc: 'Dapatkan achievement saat mencapai milestone investasi!' },
    { icon: '🚀', title: 'Mulai!', desc: 'Siap mengelola keuanganmu? Let\'s go!' },
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <div className="bg-[#1C1C1E] rounded-2xl p-8 max-w-sm w-full border border-[#2C2C2E] text-center">
        <div className="text-6xl mb-4">{current.icon}</div>
        <h2 className="text-xl font-bold text-[#F5F5F5] mb-2">{current.title}</h2>
        <p className="text-sm text-[#9CA3AF] mb-6">{current.desc}</p>

        <div className="flex gap-2 mb-4">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-[#22C55E]' : 'bg-[#2C2C2E]'}`} />
          ))}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 py-3 rounded-xl bg-[#262626] text-[#F5F5F5] font-medium text-sm">
              Kembali
            </button>
          )}
          <button
            onClick={() => step < steps.length - 1 ? setStep(step + 1) : onComplete()}
            className="flex-1 py-3 rounded-xl bg-[#22C55E] text-white font-semibold text-sm"
          >
            {step < steps.length - 1 ? 'Lanjut' : 'Mulai!'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== MILESTONE CELEBRATION =====
interface MilestoneCelebrationProps {
  title: string;
  description: string;
  icon: string;
  onClose: () => void;
}

export function MilestoneCelebration({ title, description, icon, onClose }: MilestoneCelebrationProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <div className="bg-gradient-to-br from-[#22C55E]/20 to-[#EAB308]/20 rounded-2xl p-8 max-w-sm w-full border border-[#22C55E]/30 text-center animate-scale-in">
        <div className="text-7xl mb-4 animate-bounce">{icon}</div>
        <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">{title}</h2>
        <p className="text-sm text-[#9CA3AF] mb-6">{description}</p>
        <button onClick={onClose} className="w-full py-3 rounded-xl bg-[#22C55E] text-white font-semibold text-sm">
          <Sparkles size={16} className="inline mr-2" />
          Terima Kasih!
        </button>
      </div>
    </div>
  );
}
