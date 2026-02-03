import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Home, PieChart, Settings, Wallet, Trash2, PlusCircle, Moon, Sun, Target, Hourglass } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { BalanceCard } from '@/app/components/BalanceCard';
import { CategoryChart } from '@/app/components/CategoryChart';
import { TransactionList } from '@/app/components/TransactionList';
import { AddTransactionDrawer } from '@/app/components/AddTransactionDrawer';
import { CategoryDetailsDrawer } from '@/app/components/CategoryDetailsDrawer';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDark, setIsDark] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [startingBalance, setStartingBalance] = useState<string>("1000");
  const [alertThreshold, setAlertThreshold] = useState<number>(100);
  const [envelopes, setEnvelopes] = useState<any[]>([
    { id: '1', name: 'Emprunt', amount: "1484.84" },
    { id: '2', name: 'Alim.', amount: "600" },
    { id: '3', name: 'Abo. et Tel', amount: "300" },
    { id: '4', name: 'Energie', amount: "300" },
    { id: '5', name: 'Transport', amount: "120" },
    { id: '6', name: 'Loisirs', amount: "200" },
    { id: '7', name: 'Epargne', amount: "400" },
    { id: '8', name: 'Impots et taxes', amount: "80" },
    { id: '9', name: 'Santé', amount: "0" },
    { id: '10', name: 'Assurance', amount: "167.48" },
    { id: '11', name: 'Enfant', amount: "1400" },
    { id: '12', name: 'Revenus', amount: "1097.83" }
  ]);
  const [viewCategory, setViewCategory] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('eco_budget_final');
    if (saved) {
      const p = JSON.parse(saved);
      setTransactions(p.transactions || []);
      setStartingBalance(p.startingBalance || "1000");
      setEnvelopes(p.envelopes || []);
      setIsDark(p.isDark || false);
      setAlertThreshold(p.alertThreshold || 100);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('eco_budget_final', JSON.stringify({ transactions, startingBalance, envelopes, isDark, alertThreshold }));
    document.documentElement.classList.toggle('dark', isDark);
  }, [transactions, startingBalance, envelopes, isDark, alertThreshold]);

  const stats = useMemo(() => {
    const parse = (v: any) => parseFloat(v?.toString().replace(/\s/g, '').replace(',', '.') || "0") || 0;
    const balInit = parse(startingBalance);
    
    const expPointes = transactions.filter(t => t.type === 'expense' && (!t.isFixed || t.isCleared));
    const incPointes = transactions.filter(t => t.type === 'income' && (!t.isFixed || t.isCleared));
    const currentBal = balInit + incPointes.reduce((a, b) => a + parse(b.amount), 0) - expPointes.reduce((a, b) => a + parse(b.amount), 0);
  
    const remFixedExp = transactions.filter(t => t.isFixed && !t.isCleared && t.type === 'expense').reduce((a, b) => a + parse(b.amount), 0);
    const remFixedInc = transactions.filter(t => t.isFixed && !t.isCleared && t.type === 'income').reduce((a, b) => a + parse(b.amount), 0);
  
    const envs = envelopes.map(e => {
      const isRev = e.name.toLowerCase().includes('revenu') || (e.type === 'income');
      const actual = transactions.filter(t => t.category === e.name && (isRev ? t.type === 'income' : t.type === 'expense')).reduce((a, b) => a + parse(b.amount), 0);
      const target = parse(e.amount);
      return { ...e, real: actual, rem: Math.max(0, target - actual), isRev, target, pct: target > 0 ? (actual / target) * 100 : 0 };
    });
  
    const remExpBudget = envs.filter(e => !e.isRev).reduce((a, b) => a + b.rem, 0);
    const remIncBudget = envs.filter(e => e.isRev).reduce((a, b) => a + b.rem, 0);

    const forecastTarget = (currentBal + remFixedInc - remFixedExp) - remExpBudget + remIncBudget;
    const upcomingTransactions = transactions
      .filter(t => t.isFixed && !t.isCleared)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return { 
      balance: currentBal,
      forecastReal: currentBal + remFixedInc - remFixedExp,
      forecastTarget,
      envs,
      income: incPointes.reduce((a, b) => a + parse(b.amount), 0),
      expenses: expPointes.reduce((a, b) => a + parse(b.amount), 0),
      chart: Object.entries(expPointes.reduce((acc: any, t) => { 
        acc[t.category] = (acc[t.category] || 0) + parse(t.amount); 
        return acc; 
      }, {})).map(([name, value], i) => ({ 
        name, value: Number(value), color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5] 
      })).sort((a, b) => b.value - a.value),
      upcomingTransactions,
      isAlert: forecastTarget < alertThreshold
    };
  }, [transactions, startingBalance, envelopes, alertThreshold]);

  const handleSave = (d: any) => {
    setTransactions(prev => {
      const newD = { ...d, id: d.id || uuidv4() };
      const exists = prev.find(t => t.id === newD.id);
      return exists ? prev.map(t => t.id === newD.id ? newD : t) : [newD, ...prev];
    });
    setIsDrawerOpen(false);
  };

  const handleDelete = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));

  const handleDuplicate = (t: any) => {
    setEditingItem({ ...t, id: undefined, isCleared: false, date: new Date().toISOString().split('T')[0] });
    setIsDrawerOpen(true);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <main className="flex-1 overflow-y-auto px-6 pt-12 pb-32">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <BalanceCard balance={stats.balance} forecast={stats.forecastTarget} income={stats.income} expenses={stats.expenses} isAlert={stats.isAlert} backgroundImage="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000" />
            
            <div className="bg-muted p-5 rounded-3xl flex justify-between items-center border border-border">
              <div className="space-y-1"><p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Atterrissage Réel</p><p className="text-2xl font-black">{stats.forecastReal.toFixed(2)} €</p></div>
              <Wallet className="text-blue-500 opacity-40" size={32} />
            </div>

            <div className="bg-card p-6 rounded-[32px] border border-border shadow-sm"><CategoryChart data={stats.chart} /></div>

            {stats.upcomingTransactions.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Hourglass size={14} className="text-blue-500" />
                  <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Mouvements à venir ({stats.upcomingTransactions.length})</h3>
                </div>
                <TransactionList transactions={stats.upcomingTransactions} onEdit={setEditingItem} onToggleCheck={(t) => handleSave({ ...t, isCleared: !t.isCleared })} onDelete={handleDelete} onDuplicate={handleDuplicate} onCategoryClick={(cat) => setViewCategory(cat)} />
                <div className="h-px bg-border my-8 w-1/2 mx-auto" />
              </div>
            )}

            <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4 px-2">Derniers flux</h3>
            <TransactionList transactions={transactions.filter(t => !t.isFixed || t.isCleared)} onEdit={setEditingItem} onToggleCheck={(t) => handleSave({ ...t, isCleared: !t.isCleared })} onDelete={handleDelete} onDuplicate={handleDuplicate} />
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
            <div className="flex justify-between items-center bg-card p-5 rounded-[32px] border border-border shadow-sm">
              <span className="font-bold">Mode Sombre</span>
              <button onClick={() => setIsDark(!isDark)} className={`w-14 h-8 rounded-full relative transition-colors ${isDark ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${isDark ? 'translate-x-6' : ''}`} /></button>
            </div>
            <div className="p-6 bg-card rounded-[32px] border border-border space-y-2 shadow-sm">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Solde de départ</label>
              <input type="text" inputMode="decimal" value={startingBalance.replace('.', ',')} onChange={e => setStartingBalance(e.target.value.replace(',', '.'))} className="w-full bg-muted p-4 rounded-2xl font-black text-2xl outline-none" />
            </div>
            <div className="p-6 bg-card rounded-[32px] border border-border space-y-2 shadow-sm">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Seuil d'alerte (Atterrissage)</label>
              <input type="number" value={alertThreshold} onChange={e => setAlertThreshold(Number(e.target.value))} className="w-full bg-muted p-4 rounded-2xl font-black text-2xl outline-none" />
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

      {/* NAV CENTRAGE ABSOLU - App.tsx */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border h-20 z-50">
        <div className="max-w-md mx-auto h-full flex items-center justify-between px-8 relative">
          
          {/* Groupe Gauche (2 icônes) */}
          <div className="flex items-center gap-8 w-1/3">
            <button onClick={() => setActiveTab('dashboard')}>
              <Home size={24} className={activeTab === 'dashboard' ? 'text-blue-600' : 'text-muted-foreground'} />
            </button>
            <button onClick={() => setActiveTab('stats')}>
              <PieChart size={24} className={activeTab === 'stats' ? 'text-blue-600' : 'text-muted-foreground'} />
            </button>
          </div>

          {/* BLOC CENTRAL (Le bouton +) */}
          {/* On le garde en absolute pour qu'il puisse "déborder" vers le haut sans déformer la barre */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6">
            <button 
              onClick={() => { setEditingItem(null); setIsDrawerOpen(true); }} 
              className="bg-blue-600 text-white p-4 rounded-full shadow-2xl border-8 border-background active:scale-90 transition-all"
            >
              <Plus size={32} strokeWidth={3} />
            </button>
          </div>

          {/* Groupe Droite (2 icônes dont le simulateur) */}
          <div className="flex items-center justify-end gap-6 w-1/3">
            <button 
              onClick={() => alert("Simulateur bientôt disponible !")} 
              className="bg-emerald-500 text-white p-2.5 rounded-full shadow-lg active:scale-90 transition-all"
            >
              <Target size={20} />
            </button>
            <button onClick={() => setActiveTab('settings')}>
              <Settings size={24} className={activeTab === 'settings' ? 'text-blue-600' : 'text-muted-foreground'} />
            </button>
          </div>

        </div>
      </nav>
      <AddTransactionDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} onAdd={handleSave} initialData={editingItem} categories={envelopes.map(e => e.name)} onDelete={id => {setTransactions(transactions.filter(t => t.id !== id)); setIsDrawerOpen(false);}} />
      <CategoryDetailsDrawer 
        category={viewCategory}
        isOpen={!!viewCategory}
        onClose={() => setViewCategory(null)}
        transactions={transactions}
        onEdit={(t) => { setViewCategory(null); setEditingItem(t); setIsDrawerOpen(true); }}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onToggleCheck={(t) => handleSave({ ...t, isCleared: !t.isCleared })}
      />
    </div>
  );
}