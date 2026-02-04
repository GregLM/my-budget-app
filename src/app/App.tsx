import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Home, PieChart, Settings, Wallet, Target, Hourglass } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { BalanceCard } from '@/app/components/BalanceCard';
import { CategoryChart } from '@/app/components/CategoryChart';
import { TransactionList } from '@/app/components/TransactionList';
import { AddTransactionDrawer } from '@/app/components/AddTransactionDrawer';
import { CategoryDetailsDrawer } from '@/app/components/CategoryDetailsDrawer';
import { SimulatorDrawer } from '@/app/components/SimulatorDrawer';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewCategory, setViewCategory] = useState<string | null>(null);
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
    
    // FONCTION DE SÉCURITÉ MATHÉMATIQUE
    // Elle garantit que : Dépense = Négatif, Revenu = Positif.
    const getAmount = (t: any) => {
       const val = parse(t.amount);
       // Si c'est une dépense, on renvoie -Abs(valeur), sinon Abs(valeur)
       return t.type === 'expense' ? -Math.abs(val) : Math.abs(val);
    };

    const balInit = parse(startingBalance);
    
    // 1. Solde Actuel : Solde Départ + Toutes les transactions pointées (passées)
    // On fait une simple SOMME car getAmount gère le signe négatif des dépenses
    const clearedTransactions = transactions.filter(t => !t.isFixed || t.isCleared);
    const totalCleared = clearedTransactions.reduce((acc, t) => acc + getAmount(t), 0);
    
    const currentBal = balInit + totalCleared;

    // 2. Reste à venir (Fixe non pointé)
    const pendingFixed = transactions.filter(t => t.isFixed && !t.isCleared);
    const totalPending = pendingFixed.reduce((acc, t) => acc + getAmount(t), 0);

    // 3. Budgets restants (Enveloppes)
    const envs = envelopes.map(e => {
      // On calcule ce qui a déjà été dépensé/gagné dans cette catégorie
      const actual = transactions
        .filter(t => t.category === e.name)
        .reduce((acc, t) => acc + getAmount(t), 0);
      
      const target = parse(e.amount); // Le budget prévu (ex: 600)
      
      // Calcul du reste à faire (Target - Ce qui est fait)
      // Attention : pour les dépenses, "actual" est négatif. 
      // Si Budget=600 et Dépense=-100. Reste = 600 - 100 = 500.
      // Si Budget=Revenu=2000 et Reçu=1500. Reste = 2000 - 1500 = 500.
      
      const isRev = e.name.toLowerCase().includes('revenu') || (e.type === 'income');
      
      let rem = 0;
      if (isRev) {
         // Pour un revenu : Reste = Objectif - Reçu
         rem = Math.max(0, target - actual);
      } else {
         // Pour une dépense : Reste = Objectif - |Dépensé|
         rem = Math.max(0, target - Math.abs(actual));
      }

      return { ...e, real: actual, rem, isRev, target, pct: target > 0 ? (Math.abs(actual) / target) * 100 : 0 };
    });

    // On calcule le poids financier de ce qu'il reste à dépenser dans les enveloppes
    const totalRemBudgetExpenses = envs.filter(e => !e.isRev).reduce((acc, e) => acc + e.rem, 0);
    const totalRemBudgetIncome = envs.filter(e => e.isRev).reduce((acc, e) => acc + e.rem, 0);

    // 4. Atterrissage Prévu
    // = Solde Actuel + (Flux fixes à venir) - (Budgets variables restants à dépenser) + (Budgets revenus restants à recevoir)
    const forecastTarget = currentBal + totalPending - totalRemBudgetExpenses + totalRemBudgetIncome;
    
    // 5. Atterrissage Réel (Basé uniquement sur ce qu'on sait : Solde + Flux fixes futurs connus)
    const forecastReal = currentBal + totalPending;

    // Données pour le graph (Dépenses pointées uniquement)
    const expensesList = clearedTransactions.filter(t => t.type === 'expense');
    const incomeList = clearedTransactions.filter(t => t.type === 'income');

    const chartData = Object.entries(expensesList.reduce((acc: any, t) => { 
        const cat = t.category || 'Autre';
        acc[cat] = (acc[cat] || 0) + Math.abs(getAmount(t)); 
        return acc; 
      }, {})).map(([name, value], i) => ({ 
        name, value: Number(value), color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'][i % 7] 
      })).sort((a, b) => b.value - a.value);

    return { 
      balance: currentBal,
      forecastReal,
      forecastTarget,
      envs,
      income: incomeList.reduce((acc, t) => acc + getAmount(t), 0),
      expenses: Math.abs(expensesList.reduce((acc, t) => acc + getAmount(t), 0)), // On renvoie la valeur absolue pour l'affichage
      chart: chartData,
      upcomingTransactions: pendingFixed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
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
              <div className="space-y-1"><p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Atterrissage Réel</p><p className="text-2xl font-black">{stats.forecastReal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p></div>
              <Wallet className="text-blue-500 opacity-40" size={32} />
            </div>

            <div className="bg-card p-6 rounded-[32px] border border-border shadow-sm"><CategoryChart data={stats.chart} /></div>

            {stats.upcomingTransactions.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Hourglass size={14} className="text-blue-500" />
                  <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Mouvements à venir ({stats.upcomingTransactions.length})</h3>
                </div>
                <TransactionList 
                  transactions={stats.upcomingTransactions} 
                  onEdit={setEditingItem} 
                  onToggleCheck={(t) => handleSave({ ...t, isCleared: !t.isCleared })} 
                  onDelete={handleDelete} 
                  onDuplicate={handleDuplicate}
                  onCategoryClick={(cat) => setViewCategory(cat)} 
                />
                <div className="h-px bg-border my-8 w-1/2 mx-auto" />
              </div>
            )}

            <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4 px-2">Derniers flux</h3>
            <TransactionList 
                transactions={transactions.filter(t => !t.isFixed || t.isCleared)} 
                onEdit={setEditingItem} 
                onToggleCheck={(t) => handleSave({ ...t, isCleared: !t.isCleared })} 
                onDelete={handleDelete} 
                onDuplicate={handleDuplicate}
                onCategoryClick={(cat) => setViewCategory(cat)}
            />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            <h2 className="text-3xl font-black italic uppercase">Analyses</h2>
            {stats.envs.map(s => (
              <div key={s.id} className="bg-card p-6 rounded-[32px] border border-border space-y-3">
                <div className="flex justify-between font-black uppercase text-sm"><span>{s.name} {s.isRev && "🟢"}</span><span>{Math.abs(s.real).toFixed(0)}€ / {s.target}€</span></div>
                <div className="h-3 bg-muted rounded-full overflow-hidden"><div className={`h-full ${s.isRev ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(s.pct, 100)}%` }} /></div>
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
            {/* Reste des settings identique... */}
             <div className="p-6 bg-card rounded-[32px] border border-border space-y-2 shadow-sm">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Solde de départ</label>
              <input type="text" inputMode="decimal" value={startingBalance.replace('.', ',')} onChange={e => setStartingBalance(e.target.value.replace(',', '.'))} className="w-full bg-muted p-4 rounded-2xl font-black text-2xl outline-none" />
            </div>
            <div className="p-6 bg-card rounded-[32px] border border-border space-y-2 shadow-sm">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Seuil d'alerte (Atterrissage)</label>
              <input type="number" value={alertThreshold} onChange={e => setAlertThreshold(Number(e.target.value))} className="w-full bg-muted p-4 rounded-2xl font-black text-2xl outline-none" />
            </div>
            {/* Liste Enveloppes simplifiée pour la réponse... */}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border h-20 z-50">
        <div className="max-w-md mx-auto h-full flex items-center justify-between px-8 relative">
          <div className="flex items-center gap-8 w-1/3">
            <button onClick={() => setActiveTab('dashboard')}><Home size={24} className={activeTab === 'dashboard' ? 'text-blue-600' : 'text-muted-foreground'} /></button>
            <button onClick={() => setActiveTab('stats')}><PieChart size={24} className={activeTab === 'stats' ? 'text-blue-600' : 'text-muted-foreground'} /></button>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -top-6">
            <button onClick={() => { setEditingItem(null); setIsDrawerOpen(true); }} className="bg-blue-600 text-white p-4 rounded-full shadow-2xl border-8 border-background active:scale-90 transition-all">
              <Plus size={32} strokeWidth={3} />
            </button>
          </div>
          <div className="flex items-center justify-end gap-6 w-1/3">
             <button onClick={() => setIsSimulatorOpen(true)} className="bg-emerald-500 text-white p-2.5 rounded-full shadow-lg active:scale-90 transition-all">
              <Target size={20} />
            </button>
            <button onClick={() => setActiveTab('settings')}><Settings size={24} className={activeTab === 'settings' ? 'text-blue-600' : 'text-muted-foreground'} /></button>
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

      <SimulatorDrawer 
        open={isSimulatorOpen} 
        onOpenChange={setIsSimulatorOpen}
        currentForecast={stats.forecastTarget} 
        alertThreshold={alertThreshold}        
      />

    </div>
  );
}