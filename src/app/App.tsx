import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Home, PieChart, Settings, Wallet, Target, Hourglass, Trash2, Download, Upload, Mic } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { BalanceCard } from '@/app/components/BalanceCard';
import { CategoryChart } from '@/app/components/CategoryChart';
import { TransactionList } from '@/app/components/TransactionList';
import { AddTransactionDrawer } from '@/app/components/AddTransactionDrawer';
import { CategoryDetailsDrawer } from '@/app/components/CategoryDetailsDrawer';
import { SimulatorDrawer } from '@/app/components/SimulatorDrawer';
import { getCategoryStyle } from '@/app/utils/categories';
// Assure-toi que ce nom correspond bien à ton fichier voiceParser.ts
import { parseVoiceTransaction } from '@/app/utils/voiceParser';

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- LOGIQUE VOCALE ---
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false); // Pour savoir si on a fait un long press

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
    const getAmount = (t: any) => {
       const val = parse(t.amount);
       return t.type === 'expense' ? -Math.abs(val) : Math.abs(val);
    };
    const balInit = parse(startingBalance);
    
    const clearedTransactions = transactions.filter(t => t.isCleared);
    const totalCleared = clearedTransactions.reduce((acc, t) => acc + getAmount(t), 0);
    const currentBal = balInit + totalCleared;

    const pendingTransactions = transactions.filter(t => !t.isCleared);
    const totalPending = pendingTransactions.reduce((acc, t) => acc + getAmount(t), 0);

    const envs = envelopes.map(e => {
      const actual = transactions
        .filter(t => t.category === e.name)
        .reduce((acc, t) => acc + getAmount(t), 0);
      const target = parse(e.amount);
      const isRev = e.name.toLowerCase().includes('revenu') || (e.type === 'income');
      let rem = 0;
      if (isRev) rem = Math.max(0, target - actual);
      else rem = Math.max(0, target - Math.abs(actual));

      return { ...e, real: actual, rem, isRev, target, pct: target > 0 ? (Math.abs(actual) / target) * 100 : 0 };
    });

    const totalRemBudgetExpenses = envs.filter(e => !e.isRev).reduce((acc, e) => acc + e.rem, 0);
    const totalRemBudgetIncome = envs.filter(e => e.isRev).reduce((acc, e) => acc + e.rem, 0);

    const forecastTarget = currentBal + totalPending - totalRemBudgetExpenses + totalRemBudgetIncome;
    const forecastReal = currentBal + totalPending;

    const expensesList = clearedTransactions.filter(t => t.type === 'expense');
    const incomeList = clearedTransactions.filter(t => t.type === 'income');

    const chartData = Object.entries(expensesList.reduce((acc: any, t) => { 
        const cat = t.category || 'Autre';
        acc[cat] = (acc[cat] || 0) + Math.abs(getAmount(t)); 
        return acc; 
      }, {})).map(([name, value]) => ({ 
        name, 
        value: Number(value), 
        color: getCategoryStyle(name).color 
      })).sort((a, b) => b.value - a.value);

    return { 
      balance: currentBal,
      forecastReal,
      forecastTarget,
      envs,
      income: incomeList.reduce((acc, t) => acc + getAmount(t), 0),
      expenses: Math.abs(expensesList.reduce((acc, t) => acc + getAmount(t), 0)),
      chart: chartData,
      upcomingTransactions: pendingTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      isAlert: forecastTarget < alertThreshold
    };
  }, [transactions, startingBalance, envelopes, alertThreshold]);

  const handleSave = (d: any) => {
    setTransactions(prev => {
      const newD = { 
        ...d, 
        id: d.id || uuidv4(),
        isCleared: d.isCleared !== undefined ? d.isCleared : false 
      };
      const exists = prev.find(t => t.id === newD.id);
      return exists ? prev.map(t => t.id === newD.id ? newD : t) : [newD, ...prev];
    });
    setIsDrawerOpen(false);
  };

  const handleDelete = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));

  const handleEdit = (t: any) => {
    setEditingItem(t);
    setIsDrawerOpen(true);
  };

  const handleDuplicate = (t: any) => {
    setEditingItem({ ...t, id: undefined, isCleared: false, date: new Date().toISOString().split('T')[0] });
    setIsDrawerOpen(true);
  };

  const addOneMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  };

  const handleCloseMonth = () => {
    if (!window.confirm("Es-tu sûr de vouloir clôturer le mois ?")) return;
    const newStartingBalance = stats.forecastReal.toFixed(2);
    const nextMonthTransactions = transactions
      .filter(t => !t.isCleared)
      .map(t => ({
        ...t,
        id: uuidv4(),
        date: t.isFixed ? addOneMonth(t.date) : t.date
      }));
    setStartingBalance(newStartingBalance);
    setTransactions(nextMonthTransactions);
    setActiveTab('dashboard');
  };

  const handleExport = () => {
    const dataStr = JSON.stringify({ transactions, startingBalance, envelopes, isDark, alertThreshold }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_eco_budget_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.transactions && json.envelopes) {
            if(window.confirm("Importer écrasera les données actuelles. Continuer ?")) {
                setTransactions(json.transactions);
                setStartingBalance(json.startingBalance);
                setEnvelopes(json.envelopes);
                setIsDark(json.isDark || false);
                setAlertThreshold(json.alertThreshold || 100);
                alert("Données restaurées !");
            }
        } else { alert("Fichier invalide."); }
      } catch (error) { alert("Erreur fichier."); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- FONCTIONS VOCALES ---
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Ton navigateur ne supporte pas la reconnaissance vocale.");
      return;
    }
    setIsListening(true);
    const recognition = new (window as any).webkitSpeechRecognition();
    recognitionRef.current = recognition; 
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      recognition.abort(); // Coupe le micro
      setIsListening(false);

      const data = parseVoiceTransaction(transcript, envelopes.map(e => e.name));
      const newTransaction = {
        amount: data.amount,
        description: data.description,
        category: data.category || (data.type === 'income' ? 'Revenus' : (envelopes[0]?.name || 'Divers')),
        date: data.date,
        type: data.type,
        isFixed: data.isFixed,
        isCleared: false
      };
      setEditingItem(newTransaction);
      setIsDrawerOpen(true);
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
          alert("Erreur vocale : " + event.error);
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleTouchStart = () => {
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
        isLongPress.current = true;
        if (navigator.vibrate) navigator.vibrate(50);
        startListening();
    }, 600); // 600ms appui long
  };

  const handleTouchEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (pressTimer.current) clearTimeout(pressTimer.current);
    
    // Si ce n'était pas un appui long, on ouvre le tiroir normalement
    if (!isLongPress.current && !isListening) {
        setEditingItem(null); 
        setIsDrawerOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors relative">
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
                  <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Opérations en attente ({stats.upcomingTransactions.length})</h3>
                </div>
                <TransactionList 
                  transactions={stats.upcomingTransactions} 
                  onEdit={handleEdit} 
                  onToggleCheck={(t) => handleSave({ ...t, isCleared: !t.isCleared })} 
                  onDelete={handleDelete} 
                  onDuplicate={handleDuplicate}
                  onCategoryClick={(cat) => setViewCategory(cat)} 
                />
                <div className="h-px bg-border my-8 w-1/2 mx-auto" />
              </div>
            )}

            <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4 px-2">Historique Pointé</h3>
            <TransactionList 
                transactions={transactions.filter(t => t.isCleared)} 
                onEdit={handleEdit} 
                onToggleCheck={(t) => handleSave({ ...t, isCleared: !t.isCleared })} 
                onDelete={handleDelete} 
                onDuplicate={handleDuplicate}
                onCategoryClick={(cat) => setViewCategory(cat)}
            />
          </div>
        )}

        {/* ... Autres onglets ... */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <h2 className="text-3xl font-black italic uppercase">Analyses</h2>
            {stats.envs.map(s => {
               const style = getCategoryStyle(s.name);
               return (
                  <div key={s.id} className="bg-card p-6 rounded-[32px] border border-border space-y-3">
                    <div className="flex justify-between font-black uppercase text-sm">
                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: style.color }} />{s.name}</span>
                        <span>{Math.abs(s.real).toFixed(0)}€ / {s.target}€</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden"><div className="h-full transition-all duration-500" style={{ width: `${Math.min(s.pct, 100)}%`, backgroundColor: style.color }} /></div>
                  </div>
               );
            })}
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
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Seuil d'alerte</label>
              <input type="number" value={alertThreshold} onChange={e => setAlertThreshold(Number(e.target.value))} className="w-full bg-muted p-4 rounded-2xl font-black text-2xl outline-none" />
            </div>
            <div className="space-y-3">
               <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-2">Budgets Mensuels</h3>
               {envelopes.map((env, i) => (
                 <div key={env.id} className="flex gap-2">
                   <input type="text" value={env.name} onChange={e => {const n = [...envelopes]; n[i].name = e.target.value; setEnvelopes(n)}} className="bg-card p-4 rounded-2xl font-bold text-sm w-1/2 border border-border" />
                   <input type="text" inputMode="decimal" value={env.amount} onChange={e => {const n = [...envelopes]; n[i].amount = e.target.value; setEnvelopes(n)}} className="bg-card p-4 rounded-2xl font-bold text-sm w-1/2 border border-border text-right" />
                 </div>
               ))}
               <button onClick={() => setEnvelopes([...envelopes, { id: uuidv4(), name: 'Nouveau', amount: '0' }])} className="w-full py-4 rounded-2xl border-2 border-dashed border-border text-muted-foreground font-black uppercase text-xs">Ajouter une catégorie</button>
            </div>
            <div className="pt-4">
                <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-2 mb-3">Sauvegarde & Données</h3>
                <div className="flex gap-3">
                    <button onClick={handleExport} className="flex-1 py-4 rounded-[24px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-bold text-xs uppercase tracking-wider flex flex-col items-center gap-2 active:scale-95 transition-all"><Download size={20} />Exporter</button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-4 rounded-[24px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider flex flex-col items-center gap-2 active:scale-95 transition-all"><Upload size={20} />Importer</button>
                    <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                </div>
            </div>
            <div className="pt-8 pb-4">
              <div className="h-px bg-border mb-8" />
              <button onClick={handleCloseMonth} className="w-full py-5 rounded-[24px] bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-black uppercase text-xs tracking-widest border border-red-200 dark:border-red-900/50 active:scale-95 transition-all flex items-center justify-center gap-3"><Trash2 size={18} />Clôturer le mois & Reporter</button>
            </div>
          </div>
        )}

        {/* --- OVERLAY ECRAN NOIR POUR L'ÉCOUTE --- */}
        {isListening && (
          <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-sm animate-in fade-in duration-200">
              <div className="animate-pulse bg-red-500 rounded-full p-8 mb-6 shadow-[0_0_50px_rgba(239,68,68,0.5)]">
                <Mic size={48} />
              </div>
              <p className="text-2xl font-black">Je t'écoute...</p>
              <p className="text-slate-400 mt-2 text-sm">"Burger King 15 euros 20"</p>
              <button 
                onClick={() => {
                    if (recognitionRef.current) recognitionRef.current.abort();
                    setIsListening(false);
                }} 
                className="mt-12 px-8 py-3 border border-white/20 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all"
              >
                Annuler
              </button>
          </div>
        )}

      </main>

      {/* --- BARRE DE NAVIGATION --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border h-20 z-50">
        <div className="max-w-md mx-auto h-full flex items-center justify-between px-8 relative">
          <div className="flex items-center gap-8 w-1/3">
            <button onClick={() => setActiveTab('dashboard')}><Home size={24} className={activeTab === 'dashboard' ? 'text-blue-600' : 'text-muted-foreground'} /></button>
            <button onClick={() => setActiveTab('stats')}><PieChart size={24} className={activeTab === 'stats' ? 'text-blue-600' : 'text-muted-foreground'} /></button>
          </div>
          
          <div className="absolute left-1/2 -translate-x-1/2 -top-6">
            <button 
                onMouseDown={handleTouchStart}
                onMouseUp={handleTouchEnd}
                onMouseLeave={() => pressTimer.current && clearTimeout(pressTimer.current)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className={`text-white p-4 rounded-full shadow-2xl border-8 border-background active:scale-90 transition-all ${isListening ? 'bg-red-500 scale-110' : 'bg-blue-600'}`}
            >
              {isListening ? <Mic size={32} strokeWidth={3} className="animate-pulse" /> : <Plus size={32} strokeWidth={3} />}
            </button>
          </div>

          <div className="flex items-center justify-end gap-6 w-1/3">
             <button onClick={() => setIsSimulatorOpen(true)} className="bg-emerald-500 text-white p-2.5 rounded-full shadow-lg active:scale-90 transition-all"><Target size={20} /></button>
            <button onClick={() => setActiveTab('settings')}><Settings size={24} className={activeTab === 'settings' ? 'text-blue-600' : 'text-muted-foreground'} /></button>
          </div>
        </div>
      </nav>

      <AddTransactionDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} onAdd={handleSave} initialData={editingItem} categories={envelopes.map(e => e.name)} onDelete={id => {setTransactions(transactions.filter(t => t.id !== id)); setIsDrawerOpen(false);}} />
      <CategoryDetailsDrawer category={viewCategory} isOpen={!!viewCategory} onClose={() => setViewCategory(null)} transactions={transactions} onEdit={(t) => { setViewCategory(null); handleEdit(t); }} onDelete={handleDelete} onDuplicate={handleDuplicate} onToggleCheck={(t) => handleSave({ ...t, isCleared: !t.isCleared })}/>
      <SimulatorDrawer open={isSimulatorOpen} onOpenChange={setIsSimulatorOpen} currentForecast={stats.forecastTarget} alertThreshold={alertThreshold} />
    </div>
  );
}