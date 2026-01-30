import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Home, PieChart, Settings, Wallet, PlusCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { BalanceCard } from '@/app/components/BalanceCard';
import { CategoryChart } from '@/app/components/CategoryChart';
import { TransactionList } from '@/app/components/TransactionList';
import { AddTransactionDrawer } from '@/app/components/AddTransactionDrawer';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/app/components/ui/accordion";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Transaction, FixedCharge } from '@/types';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedCharges, setFixedCharges] = useState<FixedCharge[]>([]);
  const [startingBalance, setStartingBalance] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // --- PERSISTANCE ---
  useEffect(() => {
    const saved = localStorage.getItem('budget_master_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      setTransactions(parsed.transactions || []);
      setFixedCharges(parsed.fixedCharges || []);
      setStartingBalance(parsed.startingBalance || 0);
    }
  }, []);

  useEffect(() => {
    const data = { transactions, fixedCharges, startingBalance };
    localStorage.setItem('budget_master_data', JSON.stringify(data));
  }, [transactions, fixedCharges, startingBalance]);

  // --- CALCULS ---
  const stats = useMemo(() => {
    // 1. Réel (Transactions + Fixes POINTÉS)
    const tInc = transactions.filter(t => t.type === 'income').reduce((a, b) => a + Number(b.amount), 0);
    const tExp = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + Number(b.amount), 0);
    
    const fPointedInc = fixedCharges.filter(c => c.isCleared && c.type === 'income').reduce((a, b) => a + Number(b.amount), 0);
    const fPointedExp = fixedCharges.filter(c => c.isCleared && c.type === 'expense').reduce((a, b) => a + Number(b.amount), 0);

    const totalInc = tInc + fPointedInc;
    const totalExp = tExp + fPointedExp;
    const currentBalance = startingBalance + totalInc - totalExp;

    // 2. Prévisionnel (Réel - Fixes NON POINTÉS)
    const remainingFixed = fixedCharges.filter(c => !c.isCleared && c.type === 'expense').reduce((a, b) => a + Number(b.amount), 0);

    return {
      balance: currentBalance,
      income: totalInc,
      expenses: totalExp,
      forecast: currentBalance - remainingFixed,
      categoryData: Object.entries(transactions.reduce((acc, t) => {
        if(t.type === 'expense') acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as any)).map(([name, value]) => ({ name, value, color: '#030213' }))
    };
  }, [transactions, fixedCharges, startingBalance]);

  // --- ACTIONS ---
  const handleSave = (formData: any) => {
    if (formData.isFixed) {
      if (editingItem?.id) {
        setFixedCharges(prev => prev.map(c => c.id === editingItem.id ? { ...c, ...formData } : c));
      } else {
        setFixedCharges(prev => [...prev, { ...formData, id: uuidv4(), isCleared: false }]);
      }
    } else {
      if (editingItem?.id) {
        setTransactions(prev => prev.map(t => t.id === editingItem.id ? { ...t, ...formData } : t));
      } else {
        setTransactions(prev => [{ ...formData, id: uuidv4() }, ...prev]);
      }
    }
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setFixedCharges(prev => prev.filter(c => c.id !== id));
    setEditingItem(null);
  };

  return (
    <div className="bg-white min-h-screen flex flex-col font-sans">
      <main className="flex-1 overflow-y-auto px-6 pt-12 pb-40">
        
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in duration-500">
            <BalanceCard 
              balance={stats.balance} 
              forecast={stats.forecast} 
              income={stats.income} 
              expenses={stats.expenses} 
              backgroundImage="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000" 
            />

            {/* SECTION CHARGES FIXES */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black italic flex items-center gap-2 text-lg">
                  <Wallet size={20}/> POINTAGE FIXE
                </h3>
                <button 
                  onClick={() => { setEditingItem({ isFixed: true }); setIsDrawerOpen(true); }}
                  className="bg-slate-100 p-2 rounded-full text-blue-600 active:scale-90 transition-transform"
                >
                  <PlusCircle size={24}/>
                </button>
              </div>

              <Accordion type="single" collapsible className="bg-slate-50 rounded-[24px] border border-slate-100 overflow-hidden shadow-sm">
                <AccordionItem value="fixes" className="border-none">
                  <AccordionTrigger className="px-5 py-4 text-sm font-bold hover:no-underline">
                    Gérer mes prélèvements
                  </AccordionTrigger>
                  <AccordionContent className="flex flex-col gap-2 px-3 pb-4">
                    {fixedCharges.length === 0 && <p className="text-center text-slate-400 py-4 text-xs">Aucune charge fixe</p>}
                    {fixedCharges.map(charge => (
                      <div key={charge.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm active:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 flex-1" onClick={() => { setEditingItem(charge); setIsDrawerOpen(true); }}>
                          <Checkbox 
                            checked={charge.isCleared} 
                            onCheckedChange={() => {
                              setFixedCharges(prev => prev.map(c => c.id === charge.id ? {...c, isCleared: !c.isCleared} : c))
                            }} 
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className={`text-sm ${charge.isCleared ? 'line-through text-slate-400' : 'font-bold'}`}>
                            {charge.name || charge.description}
                          </span>
                        </div>
                        <span className="font-black text-sm">{charge.amount}€</span>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <h3 className="font-black italic mb-4 text-lg uppercase tracking-tighter">Flux récents</h3>
            <TransactionList 
              transactions={transactions} 
              onEdit={(t) => { setEditingItem(t); setIsDrawerOpen(true); }} 
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Réglages</h2>
            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-6 shadow-inner">
               <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Solde de départ au 1er du mois</label>
                 <input 
                   type="number" 
                   value={startingBalance} 
                   onChange={(e) => setStartingBalance(Number(e.target.value))} 
                   className="w-full p-5 rounded-2xl border-none font-black text-2xl shadow-sm focus:ring-2 ring-blue-500 outline-none" 
                   placeholder="0.00 €"
                 />
               </div>
            </div>
          </div>
        )}
      </main>

      {/* NAVIGATION CORRIGÉE POUR IPHONE */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-10 pt-6 pb-10 flex justify-around items-center z-40">
        <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}>
          <Home size={28} strokeWidth={activeTab === 'dashboard' ? 3 : 2} />
        </button>
        <button 
          onClick={() => { setEditingItem(null); setIsDrawerOpen(true); }} 
          className="bg-blue-600 text-white p-4 rounded-full -mt-16 shadow-2xl shadow-blue-400 active:scale-90 transition-transform border-4 border-white"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
        <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'text-blue-600' : 'text-slate-400'}>
          <Settings size={28} strokeWidth={activeTab === 'settings' ? 3 : 2} />
        </button>
      </nav>

      <AddTransactionDrawer 
        open={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen} 
        onAdd={handleSave} 
        initialData={editingItem}
        onDelete={handleDelete}
      />
    </div>
  );
}