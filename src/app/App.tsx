import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Home, PieChart, Settings, Wallet, CheckCircle2, Trash2, PlusCircle, Moon, Sun, Target } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { BalanceCard } from '@/app/components/BalanceCard';
import { CategoryChart } from '@/app/components/CategoryChart';
import { TransactionList } from '@/app/components/TransactionList';
import { AddTransactionDrawer } from '@/app/components/AddTransactionDrawer';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDark, setIsDark] = useState(false);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [startingBalance, setStartingBalance] = useState<number | string>(1000);
  const [envelopes, setEnvelopes] = useState<{id: string, name: string, amount: number}[]>([
    { id: '1', name: 'Revenus', amount: 0 },
    { id: '2', name: 'Alim.', amount: 500 },
    { id: '3', name: 'Loisirs', amount: 200 }
  ]);

  useEffect(() => {
    const saved = localStorage.getItem('eco_budget_final');
    if (saved) {
      const parsed = JSON.parse(saved);
      setTransactions(parsed.transactions || []);
      setStartingBalance(parsed.startingBalance || 1000);
      setEnvelopes(parsed.envelopes || []);
      setIsDark(parsed.isDark || false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('eco_budget_final', JSON.stringify({ transactions, startingBalance, envelopes, isDark }));
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [transactions, startingBalance, envelopes, isDark]);

  const stats = useMemo(() => {
    const numBalance = parseFloat((startingBalance || "0").toString().replace(',', '.')) || 0;
    
    // Transactions réelles (déjà pointées ou non-fixes)
    const expenses = transactions.filter(t => t.type === 'expense' && (!t.isFixed || t.isCleared));
    const incomes = transactions.filter(t => t.type === 'income' && (!t.isFixed || t.isCleared));
    
    const totalExp = expenses.reduce((a, b) => a + Number(b.amount), 0);
    const totalInc = incomes.reduce((a, b) => a + Number(b.amount), 0);
    const currentBalance = numBalance + totalInc - totalExp;

    // Charges fixes non encore prélevées
    const remainingFixed = transactions
      .filter(t => t.isFixed && !t.isCleared && t.type === 'expense')
      .reduce((a, b) => a + Number(b.amount), 0);

    // Calcul des enveloppes
    const envStats = envelopes.map(env => {
      const isRevenue = env.name.toLowerCase().includes('revenu');
      const actual = transactions
        .filter(t => t.category === env.name && (isRevenue ? t.type === 'income' : t.type === 'expense'))
        .reduce((acc, t) => acc + Number(t.amount), 0);
      
      const remaining = Math.max(0, env.amount - actual);
      return { 
        ...env, 
        actual, 
        remaining, 
        isRevenue, 
        percentage: env.amount > 0 ? Math.min((actual / env.amount) * 100, 100) : 0 
      };
    });

    const remExpenses = envStats.filter(e => !e.isRevenue).reduce((a, b) => a + b.remaining, 0);
    const remRevenues = envStats.filter(e => e.isRevenue).reduce((a, b) => a + b.remaining, 0);

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
      forecastReal: currentBalance - remainingFixed, // Ce qu'il y a vraiment sur le compte après les prélèvements prévus
      forecastTarget: currentBalance - remainingFixed - remExpenses + remRevenues, // L'objectif de fin de mois
      income: totalInc,
      expenses: totalExp,
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
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden bg-background">
      <main className="flex-1 overflow-y-auto px-6 pt-12 pb-40">
        
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in duration-500">
            <BalanceCard 
              balance={stats.balance} 
              forecast={stats.forecastTarget} 
              income={stats.income} 
              expenses={stats.expenses}
              backgroundImage="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000"
            />

            <div className="bg-muted dark:bg-slate-900 p-5 rounded-3xl mb-8 shadow-xl text-foreground dark:text-white flex justify-between items-center border border-border">
               <div>
                 <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Atterrissage Réel</p>
                 <p className="text-2xl font-black">{stats.forecastReal.toFixed(2)} €</p>
               </div>
               <Wallet className="text-blue-500 opacity-40" size={32} />
            </div>

            <h3 className="font-bold mb-4 italic uppercase text-sm dark:text-white">Répartition</h3>
            <div className="bg-card p-6 rounded-[32px] border border-border mb-8 shadow-sm">
              <CategoryChart data={stats.chartData} />
            </div>

            <div className="flex justify-between items-center mb-4 text-muted-foreground uppercase text-[10px] font-black tracking-widest">
              <h3>Mouvements récents</h3>
              <div className="flex gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full border border-dashed border-blue-400" /> Prévi
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-muted border border-border" /> Réel
                </div>
              </div>
            </div>

            <TransactionList 
              transactions={transactions} 
              onEdit={(t) => { setEditingItem(t); setIsDrawerOpen(true); }}
              onToggleCheck={(t) => handleSave({ ...t, isCleared: !t.isCleared })}
            />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase dark:text-white">Analyses</h2>
            <div className="grid grid-cols-1 gap-4">
              {stats.envStats.map(stat => (
                <div key={stat.id} className="bg-card p-6 rounded-[32px] border border-border shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-black uppercase text-sm truncate">{stat.name}</h4>
                        {stat.isRevenue && <span className="text-[8px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black uppercase">Revenu</span>}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        {stat.isRevenue ? `${stat.percentage.toFixed(0)}% perçu` : `${stat.percentage.toFixed(0)}% consommé`}
                      </p>
                    </div>
                    <span className="font-black text-lg ml-4">
                      {stat.actual.toFixed(0)}€ <span className="text-muted-foreground/30 text-xs">/ {stat.amount}€</span>
                    </span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${stat.isRevenue ? 'bg-emerald-500' : stat.percentage > 90 ? 'bg-red-500' : 'bg-blue-600'}`}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 pb-20 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase dark:text-white">Configuration</h2>
            
            <div className="flex items-center justify-between p-5 bg-card rounded-[32px] border border-border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  {isDark ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <span className="font-bold text-sm">Mode Sombre</span>
              </div>
              <button 
                onClick={() => setIsDark(!isDark)}
                className={`w-14 h-8 rounded-full transition-colors relative ${isDark ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${isDark ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            <div className="p-6 bg-card rounded-[32px] border border-border space-y-4 shadow-sm">
               <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Solde de départ</label>
               <input 
                 type="text" inputMode="decimal"
                 value={startingBalance === 0 ? '' : startingBalance.toString().replace('.', ',')} 
                 onChange={(e) => {
                   const val = e.target.value.replace(',', '.');
                   if (/^[0-9.]*$/.test(val)) setStartingBalance(val);
                 }} 
                 className="w-full bg-muted p-5 rounded-2xl border-none font-black text-3xl outline-none"
               />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="font-black italic uppercase text-xs tracking-widest text-muted-foreground">Enveloppes & Budgets</h3>
                <button onClick={() => setEnvelopes([...envelopes, {id: uuidv4(), name: 'Nouveau', amount: 0}])} className="text-blue-600">
                  <PlusCircle size={24}/>
                </button>
              </div>
              <div className="space-y-3">
                {envelopes.map((env) => (
                  <div key={env.id} className="flex items-center gap-3 p-4 bg-card rounded-3xl border border-border shadow-sm">
                    <input 
                      value={env.name} 
                      onChange={(e) => setEnvelopes(envelopes.map(x => x.id === env.id ? {...x, name: e.target.value} : x))}
                      className="flex-1 font-bold text-sm outline-none bg-transparent"
                    />
                    <input 
                      type="number" step="0.01" inputMode="decimal"
                      value={env.amount} 
                      onChange={(e) => setEnvelopes(envelopes.map(x => x.id === env.id ? {...x, amount: Number(e.target.value)} : x))}
                      className="w-20 text-right font-black outline-none bg-muted p-2 rounded-xl"
                    />
                    <button onClick={() => setEnvelopes(envelopes.filter(x => x.id !== env.id))} className="text-red-400 ml-2">
                      <Trash2 size={18}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => { if (window.confirm("⚠️ Tout supprimer ?")) { localStorage.clear(); window.location.reload(); } }} 
              className="w-full p-4 bg-red-500/10 text-red-500 rounded-2xl font-bold active:scale-95 transition-transform mt-10 uppercase text-[10px] tracking-widest"
            >
              Réinitialiser les données
            </button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border px-8 pt-4 pb-10 flex justify-between items-center z-50">
        <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-blue-600' : 'text-muted-foreground'}>
          <Home size={28} strokeWidth={activeTab === 'dashboard' ? 3 : 2} />
        </button>
        <button onClick={() => setActiveTab('stats')} className={activeTab === 'stats' ? 'text-blue-600' : 'text-muted-foreground'}>
          <PieChart size={28} strokeWidth={activeTab === 'stats' ? 3 : 2} />
        </button>
        <button 
          onClick={() => { setEditingItem(null); setIsDrawerOpen(true); }} 
          className="bg-blue-600 text-white p-5 rounded-full -mt-14 shadow-2xl shadow-blue-400 active:scale-90 transition-transform border-8 border-background"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
        <div className="w-8" />
        <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'text-blue-600' : 'text-muted-foreground'}>
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