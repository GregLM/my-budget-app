import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Home, PieChart, Settings, Wallet, Trash2, PlusCircle, Moon, Sun } from 'lucide-react';
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
  const [startingBalance, setStartingBalance] = useState<string>("1000");
  const [envelopes, setEnvelopes] = useState<any[]>([
    { id: '1', name: 'Revenu', amount: "0" },
    { id: '2', name: 'Alim.', amount: "500" }
  ]);

  useEffect(() => {
    const saved = localStorage.getItem('eco_budget_final');
    if (saved) {
      const p = JSON.parse(saved);
      setTransactions(p.transactions || []);
      setStartingBalance(p.startingBalance || "1000");
      setEnvelopes(p.envelopes || []);
      setIsDark(p.isDark || false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('eco_budget_final', JSON.stringify({ transactions, startingBalance, envelopes, isDark }));
    document.documentElement.classList.toggle('dark', isDark);
  }, [transactions, startingBalance, envelopes, isDark]);

  const stats = useMemo(() => {
    // Fonction de nettoyage ultra-robuste pour iPhone (gère espaces, virgules, etc.)
    const parse = (v: any) => parseFloat(v?.toString().replace(/\s/g, '').replace(',', '.') || "0") || 0;
    const balInit = parse(startingBalance);
    
    // 1. SOLDE RÉEL (Ce qui est déjà passé en banque)
    const expPointes = transactions.filter(t => t.type === 'expense' && (!t.isFixed || t.isCleared));
    const incPointes = transactions.filter(t => t.type === 'income' && (!t.isFixed || t.isCleared));
    const currentBal = balInit + incPointes.reduce((a, b) => a + parse(b.amount), 0) - expPointes.reduce((a, b) => a + parse(b.amount), 0);
  
    // 2. FLUX FIXES À VENIR (Non pointés)
    const remFixedExp = transactions.filter(t => t.isFixed && !t.isCleared && t.type === 'expense').reduce((a, b) => a + parse(b.amount), 0);
    const remFixedInc = transactions.filter(t => t.isFixed && !t.isCleared && t.type === 'income').reduce((a, b) => a + parse(b.amount), 0);
  
    // 3. ENVELOPPES (Reste à dépenser / Reste à percevoir)
    const envs = envelopes.map(e => {
      const isRev = e.name.toLowerCase().includes('revenu') || (e.type === 'income');
      const actual = transactions.filter(t => t.category === e.name && (isRev ? t.type === 'income' : t.type === 'expense')).reduce((a, b) => a + parse(b.amount), 0);
      const target = parse(e.amount);
      return { ...e, real: actual, rem: Math.max(0, target - actual), isRev, target, pct: target > 0 ? (actual / target) * 100 : 0 };
    });
  
    const remExpBudget = envs.filter(e => !e.isRev).reduce((a, b) => a + b.rem, 0);
    const remIncBudget = envs.filter(e => e.isRev).reduce((a, b) => a + b.rem, 0);
  
    return { 
      balance: currentBal,
      forecastReal: currentBal + remFixedInc - remFixedExp,
      forecastTarget: (currentBal + remFixedInc - remFixedExp) - remExpBudget + remIncBudget,
      envs,
      income: incPointes.reduce((a, b) => a + parse(b.amount), 0),
      expenses: expPointes.reduce((a, b) => a + parse(b.amount), 0),
      chart: Object.entries(expPointes.reduce((acc: any, t) => { 
        acc[t.category] = (acc[t.category] || 0) + parse(t.amount); 
        return acc; 
      }, {})).map(([name, value], i) => ({ 
        name, value: Number(value), color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5] 
      }))
    };
  }, [transactions, startingBalance, envelopes]);

  const handleSave = (d: any) => {
    setTransactions(prev => {
      const newD = { ...d, id: d.id || uuidv4() };
      return prev.find(t => t.id === newD.id) ? prev.map(t => t.id === newD.id ? newD : t) : [newD, ...prev];
    });
    setIsDrawerOpen(false);
  };

  const handleDelete = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleDuplicate = (t: any) => {
    const duplicatedAction = {
      ...t,
      id: undefined, // On retire l'ID pour que handleSave en génère un nouveau
      isCleared: false, // Un nouveau flux n'est pas encore pointé
      date: new Date().toISOString().split('T')[0] // On propose la date du jour par défaut
    };
    setEditingItem(duplicatedAction);
    setIsDrawerOpen(true);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <main className="flex-1 overflow-y-auto px-6 pt-12 pb-32">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <BalanceCard 
              balance={stats.balance} 
              forecast={stats.forecastTarget} 
              income={stats.income} 
              expenses={stats.expenses} 
              backgroundImage="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000" 
            />
            <div className="bg-muted p-5 rounded-3xl flex justify-between items-center border border-border">
              <div className="space-y-1"><p className="text-muted-foreground text-[10px] font-black uppercase">Atterrissage Réel</p><p className="text-2xl font-black">{stats.forecastReal.toFixed(2)} €</p></div>
              <Wallet className="text-blue-500 opacity-40" size={32} />
            </div>
            <div className="bg-card p-6 rounded-[32px] border border-border"><CategoryChart data={stats.chart} /></div>
            <TransactionList transactions={transactions} onEdit={(t) => { setEditingItem(t); setIsDrawerOpen(true); }} 
            onToggleCheck={(t) => handleSave({ ...t, isCleared: !t.isCleared })} 
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            <h2 className="text-3xl font-black italic uppercase">Analyses</h2>
            {stats.envs.map(s => (
              <div key={s.id} className="bg-card p-6 rounded-[32px] border border-border space-y-3">
                <div className="flex justify-between font-black uppercase text-sm"><span>{s.name} {s.isRev && "🟢"}</span><span>{s.real.toFixed(0)}€ / {s.target}€</span></div>
                <div className="h-3 bg-muted rounded-full overflow-hidden"><div className={`h-full ${s.isRev ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${s.pct}%` }} /></div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-card p-5 rounded-[32px] border border-border">
              <span className="font-bold">Mode Sombre</span>
              <button onClick={() => setIsDark(!isDark)} className={`w-14 h-8 rounded-full relative transition-colors ${isDark ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${isDark ? 'translate-x-6' : ''}`} /></button>
            </div>
            <div className="p-6 bg-card rounded-[32px] border border-border space-y-2 shadow-sm">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Solde de départ</label>
              <input type="text" inputMode="decimal" value={startingBalance.replace('.', ',')} onChange={e => setStartingBalance(e.target.value.replace(',', '.'))} className="w-full bg-muted p-4 rounded-2xl font-black text-2xl outline-none" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center px-2"><h3 className="font-black uppercase text-xs text-muted-foreground">Enveloppes</h3><button onClick={() => setEnvelopes([...envelopes, {id: uuidv4(), name: 'Nouveau', amount: "0"}])}><PlusCircle className="text-blue-600" size={24}/></button></div>
              {envelopes.map(env => (
                <div key={env.id} className="flex gap-3 p-4 bg-card rounded-3xl border border-border shadow-sm">
                  <input value={env.name} onChange={e => setEnvelopes(envelopes.map(x => x.id === env.id ? {...x, name: e.target.value} : x))} className="flex-1 font-bold outline-none bg-transparent" />
                  <input type="text" inputMode="decimal" value={env.amount.toString().replace('.', ',')} onChange={e => setEnvelopes(envelopes.map(x => x.id === env.id ? {...x, amount: e.target.value.replace(',', '.')} : x))} className="w-24 text-right font-black bg-muted p-2 rounded-xl outline-none" />
                  <button onClick={() => setEnvelopes(envelopes.filter(x => x.id !== env.id))}><Trash2 className="text-red-400" size={20} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border px-8 pt-4 pb-10 flex justify-between items-center z-50">
        <button onClick={() => setActiveTab('dashboard')}><Home className={activeTab === 'dashboard' ? 'text-blue-600' : 'text-muted-foreground'} size={28}/></button>
        <button onClick={() => setActiveTab('stats')}><PieChart className={activeTab === 'stats' ? 'text-blue-600' : 'text-muted-foreground'} size={28}/></button>
        <button onClick={() => { setEditingItem(null); setIsDrawerOpen(true); }} className="bg-blue-600 text-white p-4 h-14 w-14 rounded-full -mt-12 shadow-xl border-8 border-background"><Plus size={32} strokeWidth={3}/></button>
        <div className="w-8" /><button onClick={() => setActiveTab('settings')}><Settings className={activeTab === 'settings' ? 'text-blue-600' : 'text-muted-foreground'} size={28}/></button>
      </nav>
      <AddTransactionDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} onAdd={handleSave} initialData={editingItem} categories={envelopes.map(e => e.name)} onDelete={id => {setTransactions(transactions.filter(t => t.id !== id)); setIsDrawerOpen(false);}} />
    </div>
  );
}