import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Home, PieChart, Settings, Wallet, CheckCircle2, Trash2, PlusCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { BalanceCard } from '@/app/components/BalanceCard';
import { CategoryChart } from '@/app/components/CategoryChart';
import { TransactionList } from '@/app/components/TransactionList';
import { AddTransactionDrawer } from '@/app/components/AddTransactionDrawer';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/app/components/ui/accordion";
import { Checkbox } from "@/app/components/ui/checkbox";

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDark, setIsDark] = useState(false);

  // --- ÉTATS ---
  const [transactions, setTransactions] = useState<any[]>([]);
  const [startingBalance, setStartingBalance] = useState<number | string>(1000);
  const [envelopes, setEnvelopes] = useState<{id: string, name: string, amount: number}[]>([
    { id: '1', name: 'Revenus', amount: 0 },
    { id: '2', name: 'Emprunt', amount: 1484.84 },
    { id: '3', name: 'Alim.', amount: 600 },
    { id: '4', name: 'Abo. et Tel', amount: 300 },
    { id: '5', name: 'Energie', amount: 300 },  
    { id: '6', name: 'Transport', amount: 120 },
    { id: '7', name: 'Loisirs', amount: 200 },
    { id: '8', name: 'Epargne', amount: 400 },
    { id: '9', name: 'Impots/taxes', amount: 0 },
    { id: '10', name: 'Santé', amount: 0 },
    
  ]);

  // --- PERSISTANCE ---
  useEffect(() => {
    const saved = localStorage.getItem('eco_budget_final');
    if (saved) {
      const parsed = JSON.parse(saved);
      setTransactions(parsed.transactions || []);
      setStartingBalance(parsed.startingBalance || 1000);
      setEnvelopes(parsed.envelopes || []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('eco_budget_final', JSON.stringify({ transactions, startingBalance, envelopes }));
  }, [transactions, startingBalance, envelopes]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // --- CALCULS ---
  const stats = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense' && (!t.isFixed || t.isCleared));
    const income = transactions.filter(t => t.type === 'income' && (!t.isFixed || t.isCleared));
    
    // Conversion propre du solde (gestion virgule/point)
    const numBalance = typeof startingBalance === 'string' 
      ? parseFloat(startingBalance.replace(',', '.')) || 0 
      : startingBalance;

    const totalExp = expenses.reduce((a, b) => a + Number(b.amount), 0);
    const totalInc = income.reduce((a, b) => a + Number(b.amount), 0);
    const currentBalance = numBalance + totalInc - totalExp;

    const remainingFixed = transactions
      .filter(t => t.isFixed && !t.isCleared && t.type === 'expense')
      .reduce((a, b) => a + Number(b.amount), 0);

    // Stats des enveloppes (pour l'onglet Stats)
    const envStats = envelopes.map(env => {
      const spent = transactions
        .filter(t => t.category === env.name && t.type === 'expense')
        .reduce((acc, t) => acc + Number(t.amount), 0);
      const percentage = env.amount > 0 ? Math.min((spent / env.amount) * 100, 100) : 0;
      return { 
        ...env, 
        spent, 
        remaining: Math.max(0, env.amount - spent), 
        percentage 
      };
    });

    const remainingEnvelopes = envStats.reduce((acc, env) => acc + env.remaining, 0);

    const chartData = Object.entries(
      expenses.reduce((acc: any, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {})
    ).map(([name, value], i) => ({ 
      name, 
      value: Number(value), 
      color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5] 
    }));

    return { 
      balance: currentBalance, 
      income: totalInc, 
      expenses: totalExp, 
      forecastReal: currentBalance - remainingFixed,
      forecastPessimistic: currentBalance - remainingFixed - remainingEnvelopes,
      chartData,
      envStats
    };
  }, [transactions, startingBalance, envelopes]);

  const handleSave = (data: any) => {
    const cleanData = { ...data, amount: Number(data.amount), id: data.id || uuidv4() };
    setTransactions(prev => {
      const exists = prev.find(t => t.id === cleanData.id);
      if (exists) return prev.map(t => t.id === cleanData.id ? cleanData : t);
      return [cleanData, ...prev];
    });
    setEditingItem(null);
    setIsDrawerOpen(false);
  };

  return (
    <div className="bg-white min-h-screen flex flex-col font-sans overflow-x-hidden">
      <main className="flex-1 overflow-y-auto px-6 pt-12 pb-40">
        
        {/* --- ONGLET DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <>
            <BalanceCard 
              balance={stats.balance} 
              forecast={stats.forecastPessimistic} 
              income={stats.income} 
              expenses={stats.expenses}
              backgroundImage="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000"
            />

            <div className="bg-[#030213] p-5 rounded-3xl mb-8 shadow-xl text-white flex justify-between items-center">
               <div>
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Atterrissage Réel</p>
                 <p className="text-2xl font-black">{stats.forecastReal.toFixed(2)} €</p>
               </div>
               <Wallet className="text-blue-500 opacity-50" size={32} />
            </div>

            <div className="mb-8">
              <h3 className="font-bold mb-4 flex items-center gap-2 italic uppercase text-sm">Pointage Fixe</h3>
              <Accordion type="single" collapsible className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden">
                <AccordionItem value="fixes" className="border-none">
                  <AccordionTrigger className="px-5 py-4 text-sm font-bold">Détail des prélèvements</AccordionTrigger>
                  <AccordionContent className="px-3 pb-4 space-y-2">
                    {transactions.filter(t => t.isFixed).map(t => (
                      <div key={t.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 flex-1" onClick={() => { setEditingItem(t); setIsDrawerOpen(true); }}>
                          <Checkbox 
                            checked={t.isCleared} 
                            onCheckedChange={() => handleSave({ ...t, isCleared: !t.isCleared })} 
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className={`text-sm ${t.isCleared ? 'line-through text-slate-300' : 'font-bold'}`}>{t.description}</span>
                        </div>
                        <span className="font-black text-sm">{t.amount}€</span>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <h3 className="font-bold mb-4 italic uppercase text-sm">Répartition</h3>
            <div className="bg-white p-6 rounded-[32px] border border-slate-50 mb-8 shadow-sm">
              <CategoryChart data={stats.chartData} />
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black italic uppercase text-sm tracking-widest text-slate-400">Mouvements du mois</h3>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                  <div className="w-2 h-2 rounded-full border border-dashed border-blue-400" /> Prévi
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                  <div className="w-2 h-2 rounded-full bg-slate-200" /> Réel
                </div>
              </div>
            </div>

            <TransactionList 
              transactions={transactions} 
              onEdit={(t) => { setEditingItem(t); setIsDrawerOpen(true); }}
              onToggleCheck={(t) => {
                const updated = { ...t, isCleared: !t.isCleared };
                handleSave(updated); // On réutilise handleSave pour mettre à jour la liste
              }}
            />
          </>
        )}

        {/* --- ONGLET ANALYSES --- */}
        {activeTab === 'stats' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Analyses</h2>
            <div className="grid grid-cols-1 gap-6">
              {stats.envStats.map(stat => (
                <div key={stat.id} className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-black uppercase text-sm">{stat.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{stat.percentage.toFixed(0)}% consommé</p>
                    </div>
                    <span className="font-black text-lg">
                      {stat.spent.toFixed(0)}€ <span className="text-slate-300 text-xs">/ {stat.amount}€</span>
                    </span>
                  </div>
                  <div className="h-4 w-full bg-white rounded-full overflow-hidden border border-slate-100">
                    <div 
                      className={`h-full transition-all duration-700 ${stat.percentage > 90 ? 'bg-red-500' : 'bg-blue-600'}`}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-3">Reste : {stat.remaining.toFixed(2)}€</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ONGLET CONFIGURATION --- */}
        {activeTab === 'settings' && (
          <div className="space-y-8 pb-20">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Configuration</h2>
            
            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-4 shadow-inner">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Solde de départ</label>
               <input 
                 type="text" 
                 inputMode="decimal"
                 value={startingBalance === 0 ? '' : startingBalance.toString().replace('.', ',')} 
                 onChange={(e) => {
                   const val = e.target.value.replace(',', '.');
                   if (/^[0-9.]*$/.test(val)) setStartingBalance(val);
                 }} 
                 className="w-full bg-white p-5 rounded-2xl border-none font-black text-2xl shadow-sm outline-none"
                 placeholder="0,00"
               />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="font-black italic uppercase text-sm">Catégories & Budgets</h3>
                <button onClick={() => setEnvelopes([...envelopes, {id: uuidv4(), name: 'Nouveau', amount: 0}])} className="text-blue-600">
                  <PlusCircle size={24}/>
                </button>
              </div>
              <div className="space-y-3">
                {envelopes.map((env) => (
                  <div key={env.id} className="flex items-center gap-3 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <input 
                      value={env.name} 
                      onChange={(e) => setEnvelopes(envelopes.map(x => x.id === env.id ? {...x, name: e.target.value} : x))}
                      className="flex-1 font-bold text-sm outline-none bg-transparent"
                    />
                    <input 
                      type="number" 
                      step="0.01"
                      inputMode="decimal"
                      value={env.amount} 
                      onChange={(e) => setEnvelopes(envelopes.map(x => x.id === env.id ? {...x, amount: Number(e.target.value)} : x))}
                      className="w-20 text-right font-black outline-none bg-slate-50 p-2 rounded-xl"
                    />
                    <button onClick={() => setEnvelopes(envelopes.filter(x => x.id !== env.id))} className="text-red-400 ml-2">
                      <Trash2 size={18}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  {isDark ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <span className="font-bold text-sm">Mode Sombre</span>
              </div>
              <button 
                onClick={() => setIsDark(!isDark)}
                className={`w-14 h-8 rounded-full transition-colors relative ${isDark ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${isDark ? 'translate-x-6' : ''}`} />
              </button>
            </div>      
            <button 
              onClick={() => { if (window.confirm("⚠️ Tout supprimer ?")) { localStorage.clear(); window.location.reload(); } }} 
              className="w-full p-4 bg-red-100 text-red-600 rounded-2xl font-bold active:scale-95 transition-transform mt-10"
            >
              Réinitialiser toutes les données
            </button>
          </div>
        )}
      </main>

      {/* --- BARRE DE NAVIGATION --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 pt-4 pb-10 flex justify-between items-center z-50">
        <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-300'}>
          <Home size={28} strokeWidth={activeTab === 'dashboard' ? 3 : 2} />
        </button>
        <button onClick={() => setActiveTab('stats')} className={activeTab === 'stats' ? 'text-blue-600' : 'text-slate-300'}>
          <PieChart size={28} strokeWidth={activeTab === 'stats' ? 3 : 2} />
        </button>
        <button 
          onClick={() => { setEditingItem(null); setIsDrawerOpen(true); }} 
          className="bg-blue-600 text-white p-5 rounded-full -mt-14 shadow-2xl shadow-blue-400 active:scale-90 transition-transform border-8 border-white"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
        <div className="w-8" /> {/* Espaceur */}
        <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'text-blue-600' : 'text-slate-300'}>
          <Settings size={28} strokeWidth={activeTab === 'settings' ? 3 : 2} />
        </button>
      </nav>

      <AddTransactionDrawer 
        open={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen} 
        onAdd={handleSave} 
        initialData={editingItem}
        categories={envelopes.map(e => e.name)}
        onDelete={(id: string) => {
          setTransactions(prev => prev.filter(t => t.id !== id));
          setIsDrawerOpen(false);
        }}
      />
    </div>
  );
}