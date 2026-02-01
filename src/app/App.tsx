import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Home, PieChart, Settings, Wallet, CheckCircle2, Circle, Trash2, PlusCircle } from 'lucide-react';
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

  // --- ÉTATS ---
  const [transactions, setTransactions] = useState<any[]>([]);
  const [startingBalance, setStartingBalance] = useState(1000);
  const [envelopes, setEnvelopes] = useState<{id: string, name: string, amount: number}[]>([
    { id: '1', name: 'Alimentation', amount: 500 },
    { id: '2', name: 'Loisirs', amount: 200 }
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

  // --- CALCULS ---
  const stats = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense' && (!t.isFixed || t.isCleared));
    const income = transactions.filter(t => t.type === 'income' && (!t.isFixed || t.isCleared));
    
    const totalExp = expenses.reduce((a, b) => a + Number(b.amount), 0);
    const totalInc = income.reduce((a, b) => a + Number(b.amount), 0);
    const balance = startingBalance + totalInc - totalExp;

    const remainingFixed = transactions
      .filter(t => t.isFixed && !t.isCleared && t.type === 'expense')
      .reduce((a, b) => a + Number(b.amount), 0);

    const remainingEnvelopes = envelopes.reduce((acc, env) => {
      const spent = transactions
        .filter(t => t.category === env.name && t.type === 'expense')
        .reduce((a, b) => a + Number(b.amount), 0);
      return acc + Math.max(0, env.amount - spent);
    }, 0);

    const chartData = Object.entries(
      expenses.reduce((acc: any, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {})
    ).map(([name, value], i) => ({ 
      name, 
      value: Number(value), 
      color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i % 4] 
    }));

    return { 
      balance, income: totalInc, expenses: totalExp, 
      forecastReal: balance - remainingFixed,
      forecastPessimistic: balance - remainingFixed - remainingEnvelopes,
      chartData 
    };
  }, [transactions, startingBalance, envelopes]);

  const handleSave = (data: any) => {
    setTransactions(prev => {
      // Si l'id existe déjà, c'est une modification ou un pointage
      const exists = prev.find(t => t.id === data.id);
      
      if (exists || data.id) {
        return prev.map(t => t.id === data.id ? { ...data } : t);
      } else {
        // Sinon c'est une création
        return [{ ...data, id: uuidv4() }, ...prev];
      }
    });
    
    setEditingItem(null);
    setIsDrawerOpen(false);
  };

  // Pour le pointage rapide dans l'accordéon
  const toggleCheck = (t: any) => {
    handleSave({ ...t, isCleared: !t.isCleared });
  };

  return (
    <div className="bg-white min-h-screen flex flex-col font-sans overflow-x-hidden">
      <main className="flex-1 overflow-y-auto px-6 pt-12 pb-40">
        {activeTab === 'dashboard' && (
          <>
            <BalanceCard 
              balance={stats.balance} 
              forecast={stats.forecastPessimistic} 
              income={stats.income} 
              expenses={stats.expenses}
              backgroundImage="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000"
            />

            <div className="bg-[#030213] p-5 rounded-3xl mb-8 shadow-figma text-white flex justify-between items-center">
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
                  <AccordionTrigger className="px-5 py-4 text-sm font-bold">Voir mes prélèvements</AccordionTrigger>
                  <AccordionContent className="px-3 pb-4 space-y-2">
                    {transactions.filter(t => t.isFixed).map(t => (
                      <div key={t.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 flex-1" onClick={() => { setEditingItem(t); setIsDrawerOpen(true); }}>
                          <Checkbox checked={t.isCleared} onCheckedChange={() => handleSave({ ...t, isCleared: !t.isCleared })} onClick={(e) => e.stopPropagation()}/>
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

            <h3 className="font-bold mb-4 italic uppercase text-[10px] tracking-widest text-slate-400">Flux récents</h3>
            <TransactionList transactions={transactions.filter(t => !t.isFixed)} onEdit={(t) => { setEditingItem(t); setIsDrawerOpen(true); }} />
          </>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 pb-20">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Configuration</h2>
            
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                Solde de départ au 1er du mois
              </label>
              <input 
                type="text" 
                inputMode="decimal" 
                placeholder="0,00"
                // On affiche une chaîne vide si c'est 0 pour ne pas gêner la saisie
                value={startingBalance === 0 ? '' : startingBalance.toString().replace('.', ',')} 
                onChange={(e) => {
                  // On remplace la virgule par un point pour que le code comprenne le nombre
                  const val = e.target.value.replace(',', '.');
                  // On n'autorise que les chiffres et un seul point
                  if (/^\d*\.?\d*$/.test(val)) {
                    setStartingBalance(val === '' ? 0 : Number(val));
                  }
                }}
                className="w-full p-5 rounded-2xl border-none font-black text-2xl shadow-sm focus:ring-2 ring-blue-500 outline-none" 
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="font-black italic uppercase text-sm">Enveloppes de dépenses</h3>
                <button onClick={() => setEnvelopes([...envelopes, {id: uuidv4(), name: 'Nouvelle', amount: 0}])} className="text-blue-600"><PlusCircle size={24}/></button>
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
                      value={env.amount} 
                      onChange={(e) => setEnvelopes(envelopes.map(x => x.id === env.id ? {...x, amount: Number(e.target.value)} : x))}
                      className="w-20 text-right font-black outline-none bg-slate-50 p-2 rounded-xl"
                    />
                    <button onClick={() => setEnvelopes(envelopes.filter(x => x.id !== env.id))} className="text-red-400 ml-2"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            </div>
            <button 
              onClick={() => { 
                if (window.confirm("⚠️ Attention : Cela va supprimer définitivement toutes vos transactions et réglages. Continuer ?")) {
                  localStorage.clear(); 
                  window.location.reload(); 
                }
              }} 
              className="w-full p-4 bg-red-100 text-red-600 rounded-2xl font-bold active:scale-95 transition-transform"
            >
              Réinitialiser toutes les données
            </button>
          </div>
        )}
      </main>

      {/* BARRE NAVIGATION FIXÉE */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-10 pt-4 pb-10 flex justify-between items-center z-50">
        <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-300'}>
          <Home size={28} strokeWidth={activeTab === 'dashboard' ? 3 : 2} />
        </button>
        <button 
          onClick={() => { setEditingItem(null); setIsDrawerOpen(true); }} 
          className="bg-blue-600 text-white p-5 rounded-full -mt-14 shadow-2xl shadow-blue-400 active:scale-90 transition-transform border-8 border-white"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
        <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'text-blue-600' : 'text-slate-300'}>
          <Settings size={28} strokeWidth={activeTab === 'settings' ? 3 : 2} />
        </button>
      </nav>

      <AddTransactionDrawer 
        open={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen} 
        onAdd={handleSave} 
        initialData={editingItem}
        onDelete={(id: string) => {
          setTransactions(prev => prev.filter(t => t.id !== id));
          setIsDrawerOpen(false);
        }}
      />
    </div>
  );
}