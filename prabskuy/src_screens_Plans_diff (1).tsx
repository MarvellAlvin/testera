--- src/screens/Plans.tsx (原始)
// Plans Screen - Budgets, Goals, Recurring transactions

import React, { useState, useMemo } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { calculateBudgetStatus, calculateGoalStatus } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import { Target, PiggyBank, Repeat, Plus, Trash2, X } from 'lucide-react';

type PlansTab = 'budgets' | 'goals' | 'recurring';

export function Plans() {
  const { db, addBudget, deleteBudget, addGoal, deleteGoal, addRecurring, deleteRecurring, addGoalDeposit } = useDatabase();
  const [activeTab, setActiveTab] = useState<PlansTab>('budgets');
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [showDeposit, setShowDeposit] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  // Budget form
  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetStartDay, setBudgetStartDay] = useState('1');

  // Goal form
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalMonths, setGoalMonths] = useState('12');

  // Recurring form
  const [recNote, setRecNote] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recFreq, setRecFreq] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [recAccount, setRecAccount] = useState('');
  const [recCategory, setRecCategory] = useState('');
  const [recType, setRecType] = useState<'income' | 'expense'>('expense');
  const [recAutoPost, setRecAutoPost] = useState(false);

  const budgetStatuses = useMemo(() => {
    return db.budgets.map(b => {
      const cat = db.categories.find(c => c.id === b.categoryId);
      return { ...calculateBudgetStatus(b, db.transactions, cat), category: cat };
    });
  }, [db.budgets, db.transactions, db.categories]);

  const goalStatuses = useMemo(() => {
    return db.goals.map(g => calculateGoalStatus(g, db.goalDeposits));
  }, [db.goals, db.goalDeposits]);

  const handleAddBudget = () => {
    if (!budgetCategory || !budgetAmount) return;
    addBudget({
      categoryId: budgetCategory,
      amount: parseFloat(budgetAmount),
      startDay: parseInt(budgetStartDay) || 1,
    });
    setShowAddBudget(false);
    setBudgetCategory('');
    setBudgetAmount('');
  };

  const handleAddGoal = () => {
    if (!goalName || !goalTarget) return;
    addGoal({
      name: goalName,
      targetAmount: parseFloat(goalTarget),
      currentAmount: 0,
      deadlineMonths: parseInt(goalMonths) || 12,
    });
    setShowAddGoal(false);
    setGoalName('');
    setGoalTarget('');
  };

  const handleAddRecurring = () => {
    if (!recNote || !recAmount || !recAccount || !recCategory) return;
    const today = new Date();
    const nextDue = new Date(today);
    if (recFreq === 'daily') nextDue.setDate(nextDue.getDate() + 1);
    else if (recFreq === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
    else nextDue.setMonth(nextDue.getMonth() + 1);

    addRecurring({
      type: recType,
      note: recNote,
      amount: parseFloat(recAmount),
      accountId: recAccount,
      categoryId: recCategory,
      frequency: recFreq,
      nextDue: nextDue.toISOString().split('T')[0],
      autoPost: recAutoPost,
    });
    setShowAddRecurring(false);
    setRecNote('');
    setRecAmount('');
  };

  const handleDeposit = (goalId: string) => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) return;
    addGoalDeposit({
      goalId,
      amount,
      date: new Date().toISOString().split('T')[0],
    });
    setShowDeposit(null);
    setDepositAmount('');
  };

  const tabs: { key: PlansTab; label: string; icon: React.ReactNode }[] = [
    { key: 'budgets', label: 'Budget', icon: <Target size={16} /> },
    { key: 'goals', label: 'Goals', icon: <PiggyBank size={16} /> },
    { key: 'recurring', label: 'Recurring', icon: <Repeat size={16} /> },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex gap-1 px-4 py-3">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20'
                : 'text-[#9CA3AF] hover:bg-[#262626]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Budgets */}
        {activeTab === 'budgets' && (
          <div className="space-y-3">
            {budgetStatuses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🎯</div>
                <p className="text-[#9CA3AF] text-sm mb-4">Belum ada budget</p>
              </div>
            ) : (
              budgetStatuses.map(bs => (
                <div key={bs.budget.id} className="p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{bs.category?.icon}</span>
                      <span className="text-sm font-medium text-[#F5F5F5]">{bs.category?.name}</span>
                    </div>
                    <button onClick={() => deleteBudget(bs.budget.id)} className="p-1 rounded hover:bg-[#2C2C2E]">
                      <Trash2 size={14} className="text-[#9CA3AF]" />
                    </button>
                  </div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#9CA3AF]">
                      {formatCurrency(bs.spent, db.settings.currency)} / {formatCurrency(bs.budget.amount, db.settings.currency)}
                    </span>
                    <span className={bs.isOver ? 'text-[#EF4444]' : 'text-[#9CA3AF]'}>
                      {Math.round(bs.percentage)}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#2C2C2E] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        bs.isOver ? 'bg-[#EF4444]' : bs.percentage > 80 ? 'bg-[#EAB308]' : 'bg-[#22C55E]'
                      }`}
                      style={{ width: `${Math.min(bs.percentage, 100)}%` }}
                    />
                  </div>
                  {bs.isOver && (
                    <p className="text-xs text-[#EF4444] mt-2">
                      Melebihi {formatCurrency(bs.overAmount, db.settings.currency)}
                    </p>
                  )}
                </div>
              ))
            )}
            <button
              onClick={() => setShowAddBudget(true)}
              className="w-full py-3 rounded-xl border border-dashed border-[#2C2C2E] text-[#9CA3AF] text-sm flex items-center justify-center gap-2 hover:border-[#22C55E]/30 hover:text-[#22C55E]"
            >
              <Plus size={16} /> Tambah Budget
            </button>
          </div>
        )}

        {/* Goals */}
        {activeTab === 'goals' && (
          <div className="space-y-3">
            {goalStatuses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🎯</div>
                <p className="text-[#9CA3AF] text-sm mb-4">Belum ada target tabungan</p>
              </div>
            ) : (
              goalStatuses.map(gs => (
                <div key={gs.goal.id} className="p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#F5F5F5]">{gs.goal.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowDeposit(gs.goal.id)}
                        className="px-2 py-1 rounded-lg bg-[#22C55E]/10 text-[#22C55E] text-xs"
                      >
                        + Setor
                      </button>
                      <button onClick={() => deleteGoal(gs.goal.id)} className="p-1 rounded hover:bg-[#2C2C2E]">
                        <Trash2 size={14} className="text-[#9CA3AF]" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#9CA3AF]">
                      {formatCurrency(gs.goal.currentAmount, db.settings.currency)} / {formatCurrency(gs.goal.targetAmount, db.settings.currency)}
                    </span>
                    <span className="text-[#22C55E]">{Math.round(gs.percentage)}%</span>
                  </div>
                  <div className="h-2 bg-[#2C2C2E] rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-[#22C55E] rounded-full transition-all duration-500" style={{ width: `${gs.percentage}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#9CA3AF]">
                    <span>Butuh {formatCurrency(gs.monthlyNeeded, db.settings.currency)}/bln</span>
                    {gs.isLate ? (
                      <span className="text-[#EF4444]">Terlambat {gs.lateDays} hari</span>
                    ) : (
                      <span>{gs.estimatedMonthsLeft} bulan lagi</span>
                    )}
                  </div>
                </div>
              ))
            )}
            <button
              onClick={() => setShowAddGoal(true)}
              className="w-full py-3 rounded-xl border border-dashed border-[#2C2C2E] text-[#9CA3AF] text-sm flex items-center justify-center gap-2 hover:border-[#22C55E]/30 hover:text-[#22C55E]"
            >
              <Plus size={16} /> Tambah Goal
            </button>
          </div>
        )}

        {/* Recurring */}
        {activeTab === 'recurring' && (
          <div className="space-y-3">
            {db.recurrings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🔄</div>
                <p className="text-[#9CA3AF] text-sm mb-4">Belum ada transaksi berulang</p>
              </div>
            ) : (
              db.recurrings.map(rec => {
                const cat = db.categories.find(c => c.id === rec.categoryId);
                const acc = db.accounts.find(a => a.id === rec.accountId);
                return (
                  <div key={rec.id} className="p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat?.icon}</span>
                        <span className="text-sm font-medium text-[#F5F5F5]">{rec.note}</span>
                      </div>
                      <button onClick={() => deleteRecurring(rec.id)} className="p-1 rounded hover:bg-[#2C2C2E]">
                        <Trash2 size={14} className="text-[#9CA3AF]" />
                      </button>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9CA3AF]">{acc?.name} • {rec.frequency}</span>
                      <span className={rec.type === 'income' ? 'text-[#22C55E]' : 'text-[#FB923C]'}>
                        {formatCurrency(rec.amount, db.settings.currency)}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#9CA3AF] mt-1">
                      Berikut: {rec.nextDue} {rec.autoPost && '• Auto-post'}
                    </p>
                  </div>
                );
              })
            )}
            <button
              onClick={() => setShowAddRecurring(true)}
              className="w-full py-3 rounded-xl border border-dashed border-[#2C2C2E] text-[#9CA3AF] text-sm flex items-center justify-center gap-2 hover:border-[#22C55E]/30 hover:text-[#22C55E]"
            >
              <Plus size={16} /> Tambah Recurring
            </button>
          </div>
        )}
      </div>

      {/* Add Budget Dialog */}
      {showAddBudget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#2C2C2E]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#F5F5F5]">Tambah Budget</h3>
              <button onClick={() => setShowAddBudget(false)}><X size={20} className="text-[#9CA3AF]" /></button>
            </div>
            <div className="space-y-3">
              <select
                value={budgetCategory}
                onChange={(e) => setBudgetCategory(e.target.value)}
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none"
              >
                <option value="">Pilih Kategori</option>
                {db.categories.filter(c => c.type === 'expense').map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
              <input
                type="number"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="Jumlah budget"
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
              />
              <input
                type="number"
                value={budgetStartDay}
                onChange={(e) => setBudgetStartDay(e.target.value)}
                placeholder="Hari mulai (1-28)"
                min="1"
                max="28"
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
              />
              <button
                onClick={handleAddBudget}
                disabled={!budgetCategory || !budgetAmount}
                className="w-full py-3 rounded-xl bg-[#22C55E] text-white font-semibold text-sm disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Dialog */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#2C2C2E]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#F5F5F5]">Tambah Goal</h3>
              <button onClick={() => setShowAddGoal(false)}><X size={20} className="text-[#9CA3AF]" /></button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="Nama goal (misal: Liburan)"
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
              />
              <input
                type="number"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                placeholder="Target jumlah"
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
              />
              <input
                type="number"
                value={goalMonths}
                onChange={(e) => setGoalMonths(e.target.value)}
                placeholder="Target bulan"
                min="1"
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
              />
              <button
                onClick={handleAddGoal}
                disabled={!goalName || !goalTarget}
                className="w-full py-3 rounded-xl bg-[#22C55E] text-white font-semibold text-sm disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Dialog */}
      {showDeposit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#2C2C2E]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#F5F5F5]">Setor Dana</h3>
              <button onClick={() => setShowDeposit(null)}><X size={20} className="text-[#9CA3AF]" /></button>
            </div>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Jumlah setor"
              className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none mb-4"
            />
            <button
              onClick={() => handleDeposit(showDeposit)}
              disabled={!depositAmount}
              className="w-full py-3 rounded-xl bg-[#22C55E] text-white font-semibold text-sm disabled:opacity-50"
            >
              Setor
            </button>
          </div>
        </div>
      )}

      {/* Add Recurring Dialog */}
      {showAddRecurring && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#2C2C2E] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#F5F5F5]">Tambah Recurring</h3>
              <button onClick={() => setShowAddRecurring(false)}><X size={20} className="text-[#9CA3AF]" /></button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setRecType('expense')}
                  className={`flex-1 py-2 rounded-xl text-sm ${recType === 'expense' ? 'bg-[#FB923C]/20 text-[#FB923C] border border-[#FB923C]/30' : 'bg-[#262626] text-[#9CA3AF]'}`}
                >
                  Pengeluaran
                </button>
                <button
                  onClick={() => setRecType('income')}
                  className={`flex-1 py-2 rounded-xl text-sm ${recType === 'income' ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30' : 'bg-[#262626] text-[#9CA3AF]'}`}
                >
                  Pemasukan
                </button>
              </div>
              <input
                type="text"
                value={recNote}
                onChange={(e) => setRecNote(e.target.value)}
                placeholder="Catatan"
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
              />
              <input
                type="number"
                value={recAmount}
                onChange={(e) => setRecAmount(e.target.value)}
                placeholder="Jumlah"
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
              />
              <select
                value={recAccount}
                onChange={(e) => setRecAccount(e.target.value)}
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none"
              >
                <option value="">Pilih Akun</option>
                {db.accounts.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
              </select>
              <select
                value={recCategory}
                onChange={(e) => setRecCategory(e.target.value)}
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none"
              >
                <option value="">Pilih Kategori</option>
                {db.categories.filter(c => c.type === recType).map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
              <select
                value={recFreq}
                onChange={(e) => setRecFreq(e.target.value as any)}
                className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none"
              >
                <option value="daily">Harian</option>
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                <input
                  type="checkbox"
                  checked={recAutoPost}
                  onChange={(e) => setRecAutoPost(e.target.checked)}
                  className="rounded"
                />
                Auto-post saat jatuh tempo
              </label>
              <button
                onClick={handleAddRecurring}
                disabled={!recNote || !recAmount || !recAccount || !recCategory}
                className="w-full py-3 rounded-xl bg-[#22C55E] text-white font-semibold text-sm disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


+++ src/screens/Plans.tsx (修改后)
// Plans Screen - Budgets, Goals, Recurring with improved features
import React, { useState, useMemo } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { calculateBudgetStatus, calculateGoalStatus } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import { hapticFeedback, showToast, Confetti } from '../components/UI';
import { Target, PiggyBank, Repeat, Plus, Trash2, X } from 'lucide-react';

type PlansTab = 'budgets' | 'goals' | 'recurring';

export function Plans() {
  const { accounts, categories, transactions, budgets, goals, goalDeposits, recurrings, settings, addBudget, deleteBudget, addGoal, deleteGoal, addRecurring, deleteRecurring, addGoalDeposit } = useDatabase();
  const [activeTab, setActiveTab] = useState<PlansTab>('budgets');
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [showDeposit, setShowDeposit] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const currency = settings?.currency || 'IDR';

  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetStartDay, setBudgetStartDay] = useState('1');
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalMonths, setGoalMonths] = useState('12');
  const [goalIcon, setGoalIcon] = useState('🎯');
  const [recNote, setRecNote] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recFreq, setRecFreq] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [recAccount, setRecAccount] = useState('');
  const [recCategory, setRecCategory] = useState('');
  const [recType, setRecType] = useState<'income' | 'expense'>('expense');
  const [recAutoPost, setRecAutoPost] = useState(false);

  const budgetStatuses = useMemo(() => budgets.map(b => ({ ...calculateBudgetStatus(b, transactions, categories.find(c => c.uid === b.categoryId)), category: categories.find(c => c.uid === b.categoryId) })), [budgets, transactions, categories]);
  const goalStatuses = useMemo(() => goals.map(g => calculateGoalStatus(g, goalDeposits)), [goals, goalDeposits]);

  const handleAddBudget = () => {
    if (!budgetCategory || !budgetAmount) return;
    addBudget({ categoryId: budgetCategory, amount: parseFloat(budgetAmount), startDay: parseInt(budgetStartDay) || 1, alertPercent: 80 });
    setShowAddBudget(false); setBudgetCategory(''); setBudgetAmount('');
    hapticFeedback('light');
  };

  const handleAddGoal = () => {
    if (!goalName || !goalTarget) return;
    addGoal({ name: goalName, targetAmount: parseFloat(goalTarget), currentAmount: 0, deadlineMonths: parseInt(goalMonths) || 12, icon: goalIcon });
    setShowAddGoal(false); setGoalName(''); setGoalTarget('');
    hapticFeedback('light');
  };

  const handleAddRecurring = () => {
    if (!recNote || !recAmount || !recAccount || !recCategory) return;
    const today = new Date(); const nextDue = new Date(today);
    if (recFreq === 'daily') nextDue.setDate(nextDue.getDate() + 1);
    else if (recFreq === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
    else nextDue.setMonth(nextDue.getMonth() + 1);
    addRecurring({ type: recType, note: recNote, amount: parseFloat(recAmount), accountId: recAccount, categoryId: recCategory, frequency: recFreq, nextDue: nextDue.toISOString().split('T')[0], autoPost: recAutoPost });
    setShowAddRecurring(false); setRecNote(''); setRecAmount('');
    hapticFeedback('light');
  };

  const handleDeposit = async (goalUid: string) => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) return;
    await addGoalDeposit({ goalId: goalUid, amount, date: new Date().toISOString().split('T')[0] });
    setShowDeposit(null); setDepositAmount('');
    hapticFeedback('medium');
    // Check if goal completed
    const goal = goals.find(g => g.uid === goalUid);
    if (goal) {
      const totalDeposits = goalDeposits.filter(d => d.goalId === goalUid).reduce((s, d) => s + d.amount, 0) + amount;
      if (totalDeposits >= goal.targetAmount) setShowConfetti(true);
    }
  };

  const tabs: { key: PlansTab; label: string; icon: React.ReactNode }[] = [
    { key: 'budgets', label: 'Budget', icon: <Target size={16} /> },
    { key: 'goals', label: 'Goals', icon: <PiggyBank size={16} /> },
    { key: 'recurring', label: 'Recurring', icon: <Repeat size={16} /> },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 px-4 py-3">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20' : 'text-[#9CA3AF] hover:bg-[#262626]'}`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeTab === 'budgets' && (
          <div className="space-y-3">
            {budgetStatuses.length === 0 ? <div className="text-center py-12"><div className="text-4xl mb-3">🎯</div><p className="text-[#9CA3AF] text-sm mb-4">Belum ada budget</p></div> :
              budgetStatuses.map(bs => (
                <div key={bs.budget.uid} className="p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><span className="text-lg">{bs.category?.icon}</span><span className="text-sm font-medium text-[#F5F5F5]">{bs.category?.name}</span></div>
                    <button onClick={() => deleteBudget(bs.budget.uid)} className="p-1 rounded hover:bg-[#2C2C2E]"><Trash2 size={14} className="text-[#9CA3AF]" /></button>
                  </div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#9CA3AF]">{formatCurrency(bs.spent, currency)} / {formatCurrency(bs.budget.amount, currency)}</span>
                    <span className={bs.isOver ? 'text-[#EF4444]' : 'text-[#9CA3AF]'}>{Math.round(bs.percentage)}%</span>
                  </div>
                  <div className="h-2 bg-[#2C2C2E] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${bs.isOver ? 'bg-[#EF4444]' : bs.percentage > 80 ? 'bg-[#EAB308]' : 'bg-[#22C55E]'}`} style={{ width: `${Math.min(bs.percentage, 100)}%` }} />
                  </div>
                  {bs.isOver && <p className="text-xs text-[#EF4444] mt-2">Melebihi {formatCurrency(bs.overAmount, currency)}</p>}
                </div>
              ))}
            <button onClick={() => setShowAddBudget(true)} className="w-full py-3 rounded-xl border border-dashed border-[#2C2C2E] text-[#9CA3AF] text-sm flex items-center justify-center gap-2 hover:border-[#22C55E]/30 hover:text-[#22C55E]"><Plus size={16} /> Tambah Budget</button>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-3">
            {goalStatuses.length === 0 ? <div className="text-center py-12"><div className="text-4xl mb-3">🎯</div><p className="text-[#9CA3AF] text-sm mb-4">Belum ada target tabungan</p></div> :
              goalStatuses.map(gs => (
                <div key={gs.goal.uid} className="p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><span className="text-lg">{gs.goal.icon}</span><span className="text-sm font-medium text-[#F5F5F5]">{gs.goal.name}</span></div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setShowDeposit(gs.goal.uid)} className="px-2 py-1 rounded-lg bg-[#22C55E]/10 text-[#22C55E] text-xs">+ Setor</button>
                      <button onClick={() => deleteGoal(gs.goal.uid)} className="p-1 rounded hover:bg-[#2C2C2E]"><Trash2 size={14} className="text-[#9CA3AF]" /></button>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#9CA3AF]">{formatCurrency(gs.goal.currentAmount, currency)} / {formatCurrency(gs.goal.targetAmount, currency)}</span>
                    <span className="text-[#22C55E]">{Math.round(gs.percentage)}%</span>
                  </div>
                  <div className="h-2 bg-[#2C2C2E] rounded-full overflow-hidden mb-2"><div className="h-full bg-[#22C55E] rounded-full transition-all duration-500" style={{ width: `${gs.percentage}%` }} /></div>
                  <div className="flex justify-between text-[10px] text-[#9CA3AF]">
                    <span>Butuh {formatCurrency(gs.monthlyNeeded, currency)}/bln</span>
                    {gs.isLate ? <span className="text-[#EF4444]">Terlambat {gs.lateDays} hari</span> : <span>{gs.estimatedMonthsLeft} bulan lagi</span>}
                  </div>
                </div>
              ))}
            <button onClick={() => setShowAddGoal(true)} className="w-full py-3 rounded-xl border border-dashed border-[#2C2C2E] text-[#9CA3AF] text-sm flex items-center justify-center gap-2 hover:border-[#22C55E]/30 hover:text-[#22C55E]"><Plus size={16} /> Tambah Goal</button>
          </div>
        )}

        {activeTab === 'recurring' && (
          <div className="space-y-3">
            {recurrings.length === 0 ? <div className="text-center py-12"><div className="text-4xl mb-3">🔄</div><p className="text-[#9CA3AF] text-sm mb-4">Belum ada transaksi berulang</p></div> :
              recurrings.map(rec => {
                const cat = categories.find(c => c.uid === rec.categoryId);
                const acc = accounts.find(a => a.uid === rec.accountId);
                return (
                  <div key={rec.uid} className="p-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E]">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2"><span className="text-lg">{cat?.icon}</span><span className="text-sm font-medium text-[#F5F5F5]">{rec.note}</span></div>
                      <button onClick={() => deleteRecurring(rec.uid)} className="p-1 rounded hover:bg-[#2C2C2E]"><Trash2 size={14} className="text-[#9CA3AF]" /></button>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9CA3AF]">{acc?.name} • {rec.frequency}</span>
                      <span className={rec.type === 'income' ? 'text-[#22C55E]' : 'text-[#FB923C]'}>{formatCurrency(rec.amount, currency)}</span>
                    </div>
                    <p className="text-[10px] text-[#9CA3AF] mt-1">Berikut: {rec.nextDue} {rec.autoPost && '• Auto-post'}</p>
                  </div>
                );
              })}
            <button onClick={() => setShowAddRecurring(true)} className="w-full py-3 rounded-xl border border-dashed border-[#2C2C2E] text-[#9CA3AF] text-sm flex items-center justify-center gap-2 hover:border-[#22C55E]/30 hover:text-[#22C55E]"><Plus size={16} /> Tambah Recurring</button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showAddBudget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#2C2C2E]">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-[#F5F5F5]">Tambah Budget</h3><button onClick={() => setShowAddBudget(false)}><X size={20} className="text-[#9CA3AF]" /></button></div>
            <div className="space-y-3">
              <select value={budgetCategory} onChange={(e) => setBudgetCategory(e.target.value)} className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none">
                <option value="">Pilih Kategori</option>
                {categories.filter(c => c.type === 'expense').map(c => <option key={c.uid} value={c.uid}>{c.icon} {c.name}</option>)}
              </select>
              <input type="number" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} placeholder="Jumlah budget" className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none" />
              <input type="number" value={budgetStartDay} onChange={(e) => setBudgetStartDay(e.target.value)} placeholder="Hari mulai (1-28)" min="1" max="28" className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none" />
              <button onClick={handleAddBudget} disabled={!budgetCategory || !budgetAmount} className="w-full py-3 rounded-xl bg-[#22C55E] text-white font-semibold text-sm disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {showAddGoal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#2C2C2E]">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-[#F5F5F5]">Tambah Goal</h3><button onClick={() => setShowAddGoal(false)}><X size={20} className="text-[#9CA3AF]" /></button></div>
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">{['🎯', '🏠', '🚗', '✈️', '📱', '💍', '🎓', '🏖️'].map(icon => (
                <button key={icon} onClick={() => setGoalIcon(icon)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${goalIcon === icon ? 'bg-[#22C55E]/20 border border-[#22C55E]/30' : 'bg-[#262626] border border-[#2C2C2E]'}`}>{icon}</button>
              ))}</div>
              <input type="text" value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="Nama goal" className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none" />
              <input type="number" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} placeholder="Target jumlah" className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none" />
              <input type="number" value={goalMonths} onChange={(e) => setGoalMonths(e.target.value)} placeholder="Target bulan" min="1" className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none" />
              <button onClick={handleAddGoal} disabled={!goalName || !goalTarget} className="w-full py-3 rounded-xl bg-[#22C55E] text-white font-semibold text-sm disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {showDeposit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#2C2C2E]">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-[#F5F5F5]">Setor Dana</h3><button onClick={() => setShowDeposit(null)}><X size={20} className="text-[#9CA3AF]" /></button></div>
            <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="Jumlah setor" className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none mb-4" />
            <button onClick={() => handleDeposit(showDeposit)} disabled={!depositAmount} className="w-full py-3 rounded-xl bg-[#22C55E] text-white font-semibold text-sm disabled:opacity-50">Setor</button>
          </div>
        </div>
      )}

      {showAddRecurring && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full border border-[#2C2C2E] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-[#F5F5F5]">Tambah Recurring</h3><button onClick={() => setShowAddRecurring(false)}><X size={20} className="text-[#9CA3AF]" /></button></div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button onClick={() => setRecType('expense')} className={`flex-1 py-2 rounded-xl text-sm ${recType === 'expense' ? 'bg-[#FB923C]/20 text-[#FB923C] border border-[#FB923C]/30' : 'bg-[#262626] text-[#9CA3AF]'}`}>Pengeluaran</button>
                <button onClick={() => setRecType('income')} className={`flex-1 py-2 rounded-xl text-sm ${recType === 'income' ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30' : 'bg-[#262626] text-[#9CA3AF]'}`}>Pemasukan</button>
              </div>
              <input type="text" value={recNote} onChange={(e) => setRecNote(e.target.value)} placeholder="Catatan" className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none" />
              <input type="number" value={recAmount} onChange={(e) => setRecAmount(e.target.value)} placeholder="Jumlah" className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none" />
              <select value={recAccount} onChange={(e) => setRecAccount(e.target.value)} className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none">
                <option value="">Pilih Akun</option>{accounts.map(a => <option key={a.uid} value={a.uid}>{a.icon} {a.name}</option>)}
              </select>
              <select value={recCategory} onChange={(e) => setRecCategory(e.target.value)} className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none">
                <option value="">Pilih Kategori</option>{categories.filter(c => c.type === recType).map(c => <option key={c.uid} value={c.uid}>{c.icon} {c.name}</option>)}
              </select>
              <select value={recFreq} onChange={(e) => setRecFreq(e.target.value as any)} className="w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] focus:outline-none">
                <option value="daily">Harian</option><option value="weekly">Mingguan</option><option value="monthly">Bulanan</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-[#9CA3AF]"><input type="checkbox" checked={recAutoPost} onChange={(e) => setRecAutoPost(e.target.checked)} className="rounded" />Auto-post saat jatuh tempo</label>
              <button onClick={handleAddRecurring} disabled={!recNote || !recAmount || !recAccount || !recCategory} className="w-full py-3 rounded-xl bg-[#22C55E] text-white font-semibold text-sm disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}

      <Confetti active={showConfetti} onComplete={() => { setShowConfetti(false); showToast({ message: '🎉 Goal tercapai!', type: 'success' }); }} />
    </div>
  );
}
