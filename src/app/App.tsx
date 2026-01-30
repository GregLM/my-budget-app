import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Home, PieChart, Settings, User, Wallet, CheckCircle2, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Imports de tes composants
import { BalanceCard } from '@/app/components/BalanceCard';
import { CategoryChart } from '@/app/components/CategoryChart';
import { TransactionList } from '@/app/components/TransactionList';
import { AddTransactionDrawer } from '@/app/components/AddTransactionDrawer';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/app/components/ui/accordion";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Transaction, FixedCharge } from '@/types';

export default function App() {
  // --- ÉTATS ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedCharges, setFixedCharges] = useState<FixedCharge[]>([
    { id: 'f1', name: 'Loyer', amount: 850, isCleared: false, type: 'expense', category: 'Logement' },
    { id: 'f2', name: 'Salaire', amount: 2500, isCleared: true, type: 'income', category: 'Salaire' }
  ]);
  const [startingBalance, setStartingBalance] = useState(1000);
  const [monthlyBudget, setMonthlyBudget] = useState(500); // Enveloppe variable globale
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // --- PERSISTANCE ---
  useEffect(() => {
    const data = {
      transactions: localStorage.getItem('btx'),
      fixed: localStorage.getItem('bfix'),
      start: localStorage.getItem('bstart'),
      mbudget: localStorage.getItem('bmbudget')
    };
    if (data.transactions) setTransactions(JSON.parse(data.transactions));
    if (data.fixed) setFixedCharges(JSON.parse(data.fixed));
    if (data.start) setStartingBalance(Number(data.start));
    if (data.mbudget) setMonthlyBudget(Number(data.mbudget));
  }, []);

  useEffect(() => {
    localStorage.setItem('btx', JSON.stringify(transactions));
    localStorage.setItem('bfix', JSON.stringify(fixedCharges));
    localStorage.setItem('bstart', startingBalance.toString());
    localStorage.setItem('bmbudget', monthlyBudget.toString());
  }, [transactions, fixedCharges, startingBalance, monthlyBudget]);

  // --- CALCULS ---
  const stats = useMemo(() => {
    const totalInc = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const totalExp = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
    const balance = startingBalance + totalInc - totalExp;

    const remainingFixed = fixedCharges
      .filter(c => !c.isCleared && c.type === 'expense')
      .reduce((a, b) => a + b.amount, 0);

    const spentInVar = transactions
      .filter(t => t.type === 'expense' && !fixedCharges.some(fc => fc.name === t.description))
      .reduce((a, b) => a + b.amount, 0);
    
    const remainingVar = Math.max(0, monthlyBudget - spentInVar);

    return {
      balance,
      forecastReal: balance - remainingFixed,
      forecastPessimistic: balance - remainingFixed - remainingVar,
      income: totalInc,
      expenses: totalExp,
      categoryData: Object.entries(
        transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>)
      ).map(([name, value], i) => ({
        name, value, color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'][i % 4]
      }))
    };
  }, [transactions, fixedCharges, startingBalance, monthlyBudget]);

  // --- ACTIONS ---
  const handleAddOrEdit = (data: any) => {
    if (editingTransaction) {
      setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? { ...editingTransaction, ...data, amount: Number(data.amount) } : t));
      setEditingTransaction(null);
    } else {
      setTransactions(prev => [{ id: uuidv4(), ...data, amount: Number(data.amount) }, ...prev]);
    }
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setEditingTransaction(null);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-safe font-sans text-slate-900">
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl relative flex flex-col">
        
        {/* HEADER */}
        <header className="pt-12 px-6 pb-4 bg-white/80 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center">
          <div>
            <h1 className="text-gray-500 text-xs font-bold uppercase tracking-widest">
              {activeTab === 'dashboard' ? 'Vue d\'ensemble' : activeTab === 'analysis' ? 'Analyses' : 'Configuration'}
            </h1>
            <h2 className="text-2xl font-black italic">ECO.BUDGET</h2>
          </div>
          <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
             <User size={20} className="text-slate-600" />
          </div>
        </header>

        {/* CONTENT */}
        <main className="px-6 flex-1 overflow-y-auto pb-32">
          {activeTab === 'dashboard' && (
            <>
              <BalanceCard 
                balance={stats.balance} 
                forecast={stats.forecastPessimistic}
                income={stats.income}
                expenses={stats.expenses}
                backgroundImage="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000"
              />

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-900 p-4 rounded-3xl text-white shadow-lg">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Atterrissage Réel</p>
                  <p className="text-xl font-black">{stats.forecastReal.toFixed(2)} €</p>
                </div>
                <div className="bg-blue-600 p-4 rounded-3xl text-white shadow-lg">
                  <p className="text-[10px] text-blue-200 font-bold uppercase">Reste Enveloppes</p>
                  <p className="text-xl font-black">{(monthlyBudget - (stats.expenses - stats.income + stats.balance)).toFixed(0)} €</p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Wallet size={18}/> Pointage Fixe</h3>
                <Accordion type="single" collapsible className="bg-slate-50 rounded-3xl px-4 border border-slate-100">
                  <AccordionItem value="fixes" className="border-none">
                    <AccordionTrigger className="text-sm font-bold">Voir mes prélèvements</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-3 pb-4">
                      {fixedCharges.map(charge => (
                        <div key={charge.id} className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                          <div className="flex items-center gap-3">
                            <Checkbox checked={charge.isCleared} onCheckedChange={() => {
                              setFixedCharges(prev => prev.map(c => c.id === charge.id ? {...c, isCleared: !c.isCleared} : c))
                            }} />
                            <span className={`text-sm ${charge.isCleared ? 'line-through text-slate-400' : 'font-bold'}`}>{charge.name}</span>
                          </div>
                          <span className="text-sm font-black">{charge.amount} €</span>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-bold mb-4 italic">Flux récents</h3>
                <TransactionList 
                  transactions={transactions} 
                  onEdit={(t) => { setEditingTransaction(t); setIsDrawerOpen(true); }}
                />
              </div>
            </>
          )}

          {activeTab === 'analysis' && (
            <div className="py-4">
              <h3 className="text-lg font-bold mb-6">Répartition Mensuelle</h3>
              <div className="bg-white p-6 rounded-[40px] shadow-xl border border-slate-50 mb-8">
                <CategoryChart data={stats.categoryData} />
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="py-4 flex flex-col gap-8">
              <section>
                <h3 className="text-sm font-black text-slate-400 uppercase mb-4 tracking-tighter">Paramètres Généraux</h3>
                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex flex-col gap-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">Solde de départ (€)</label>
                    <input 
                      type="number" 
                      value={startingBalance} 
                      onChange={(e) => setStartingBalance(Number(e.target.value))}
                      className="w-full bg-white p-4 rounded-2xl border-none font-black text-xl shadow-inner outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">Budget Enveloppes Mensuel (€)</label>
                    <input 
                      type="number" 
                      value={monthlyBudget} 
                      onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                      className="w-full bg-white p-4 rounded-2xl border-none font-black text-xl shadow-inner outline-none"
                    />
                  </div>
                </div>
              </section>
              
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                <AlertCircle className="text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 font-medium">Les modifications sont enregistrées instantanément sur votre iPhone.</p>
              </div>
            </div>
          )}
        </main>

        {/* FAB */}
        <div className="fixed bottom-28 right-6 z-40">
          <button 
            onClick={() => { setEditingTransaction(null); setIsDrawerOpen(true); }}
            className="h-16 w-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-400 active:scale-90 transition-transform"
          >
            <Plus size={32} strokeWidth={3} />
          </button>
        </div>

        {/* NAV BAR */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-10 py-6 flex justify-between items-center z-30 pb-10">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}>
            <Home size={24} strokeWidth={activeTab === 'dashboard' ? 3 : 2} />
            <span className="text-[10px] font-black uppercase italic">Flux</span>
          </button>
          <button onClick={() => setActiveTab('analysis')} className={`flex flex-col items-center gap-1 ${activeTab === 'analysis' ? 'text-blue-600' : 'text-slate-400'}`}>
            <PieChart size={24} strokeWidth={activeTab === 'analysis' ? 3 : 2} />
            <span className="text-[10px] font-black uppercase italic">Stats</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-400'}`}>
            <Settings size={24} strokeWidth={activeTab === 'settings' ? 3 : 2} />
            <span className="text-[10px] font-black uppercase italic">Config</span>
          </button>
        </nav>

        <AddTransactionDrawer 
          open={isDrawerOpen} 
          onOpenChange={setIsDrawerOpen}
          onAdd={handleAddOrEdit}
          initialData={editingTransaction}
          onDelete={editingTransaction ? () => deleteTransaction(editingTransaction.id) : undefined}
        />
      </div>
    </div>
  );
}