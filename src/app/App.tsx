import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Home, PieChart, Settings, Wallet, CheckCircle2, Circle } from 'lucide-react';
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
  const [categoryBudgets, setCategoryBudgets] = useState({
    Alimentation: 500,
    Loisirs: 200,
    Transport: 100
  });

  // --- PERSISTANCE ---
  useEffect(() => {
    const saved = localStorage.getItem('budget_data_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      setTransactions(parsed.transactions || []);
      setStartingBalance(parsed.startingBalance || 1000);
      setCategoryBudgets(parsed.categoryBudgets || { Alimentation: 500, Loisirs: 200, Transport: 100 });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('budget_data_v2', JSON.stringify({ transactions, startingBalance, categoryBudgets }));
  }, [transactions, startingBalance, categoryBudgets]);

  // --- CALCULS ---
  const stats = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense' && (!t.isFixed || t.isCleared));
    const income = transactions.filter(t => t.type === 'income' && (!t.isFixed || t.isCleared));
    
    const totalExp = expenses.reduce((a, b) => a + Number(b.amount), 0);
    const totalInc = income.reduce((a, b) => a + Number(b.amount), 0);
    const balance = startingBalance + totalInc - totalExp;

    // Calcul reste à payer (fixes non cochés)
    const remainingFixed = transactions
      .filter(t => t.isFixed && !t.isCleared && t.type === 'expense')
      .reduce((a, b) => a + Number(b.amount), 0);

    // Calcul enveloppes variables (Budgets - Dépenses déjà faites)
    const remainingEnvelopes = Object.entries(categoryBudgets).reduce((acc, [cat, limit]) => {
      const spent = transactions
        .filter(t => t.category === cat && t.type === 'expense')
        .reduce((a, b) => a + Number(b.amount), 0);
      return acc + Math.max(0, limit - spent);
    }, 0);

    const chartData = Object.entries(
      expenses.reduce((acc: any, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value, color: '#3b82f6' }));

    return { 
      balance, 
      income: totalInc, 
      expenses: totalExp, 
      forecastReal: balance - remainingFixed,
      forecastPessimistic: balance - remainingFixed - remainingEnvelopes,
      chartData 
    };
  }, [transactions, startingBalance, categoryBudgets]);

  const handleSave = (data: any) => {
    if (editingItem?.id) {
      setTransactions(prev => prev.map(t => t.id === editingItem.id ? { ...data, id: t.id } : t));
    } else {
      setTransactions(prev => [{ ...data, id: uuidv4() }, ...prev]);
    }
    setEditingItem(null);
  };

  return (
    <div className="bg-white min-h-screen flex flex-col font-sans">
      <main className="flex-1 overflow-y-auto px-6 pt-12 pb-32">
        {activeTab === 'dashboard' && (
          <>
            <BalanceCard 
              balance={stats.balance} 
              forecast={stats.forecastPessimistic} 
              income={stats.income} 
              expenses={stats.expenses} 
            />

            <div className="bg-blue-50 p-4 rounded-2xl mb-8 border border-blue-100">
               <p className="text-blue-700 text-[10px] font-black uppercase tracking-wider">Atterrissage Réel</p>
               <p className="text-2xl font-black text-blue-900">{stats.forecastReal.toFixed(2)} €</p>
            </div>

            <div className="mb-8">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Wallet size={18}/> Pointage Fixe</h3>
              <Accordion type="single" collapsible className="bg-slate-50 rounded-2xl border px-4">
                <AccordionItem value="fixes" className="border-none">
                  <AccordionTrigger className="text-sm font-bold">Détail du mois</AccordionTrigger>
                  <AccordionContent className="flex flex-col gap-2 pb-2">
                    {transactions.filter(t => t.isFixed).map(t => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
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

            <h3 className="font-bold mb-4">Répartition</h3>
            <div className="bg-white p-4 rounded-3xl border mb-8 shadow-sm">
              <CategoryChart data={stats.chartData} />
            </div>

            <h3 className="font-bold mb-4 italic uppercase text-xs tracking-widest text-slate-400">Flux récents</h3>
            <TransactionList transactions={transactions.filter(t => !t.isFixed)} onEdit={(t) => { setEditingItem(t); setIsDrawerOpen(true); }} />
          </>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black italic">CONFIG</h2>
            <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
               <label className="text-xs font-black text-slate-400 uppercase">Solde de départ</label>
               <input type="number" value={startingBalance} onChange={(e) => setStartingBalance(Number(e.target.value))} className="w-full p-4 rounded-2xl border-none font-black text-xl shadow-inner" />
            </div>

            <h3 className="font-bold">Enveloppes mensuelles</h3>
            <div className="space-y-3">
              {Object.entries(categoryBudgets).map(([cat, val]) => (
                <div key={cat} className="flex items-center justify-between p-4 bg-white rounded-2xl border">
                  <span className="font-bold text-sm">{cat}</span>
                  <input 
                    type="number" 
                    value={val} 
                    onChange={(e) => setCategoryBudgets(prev => ({ ...prev, [cat]: Number(e.target.value) }))}
                    className="w-20 text-right font-black outline-none" 
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* NAVIGATION BAR : Le bouton "+" est maintenant ici */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-8 pt-4 pb-10 flex justify-between items-center z-50">
        <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}>
          <Home size={28} />
        </button>
        <button 
          onClick={() => { setEditingItem(null); setIsDrawerOpen(true); }} 
          className="bg-blue-600 text-white p-4 rounded-full -mt-12 shadow-xl shadow-blue-200 active:scale-95 transition-transform"
        >
          <Plus size={32} />
        </button>
        <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'text-blue-600' : 'text-slate-400'}>
          <Settings size={28} />
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