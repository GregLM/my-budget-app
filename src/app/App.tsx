import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Home, PieChart, Settings, User } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Composants importés de ton projet Figma
import { BalanceCard } from '@/app/components/BalanceCard';
import { CategoryChart } from '@/app/components/CategoryChart';
import { TransactionList } from '@/app/components/TransactionList';
import { AddTransactionDrawer } from '@/app/components/AddTransactionDrawer';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/app/components/ui/accordion";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Transaction, FixedCharge } from '@/types';

export default function App() {
  // --- ÉTAT & PERSISTANCE ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedCharges, setFixedCharges] = useState<FixedCharge[]>([
    { id: 'f1', name: 'Loyer', amount: 850, isCleared: false, type: 'expense', category: 'Logement' },
    { id: 'f2', name: 'Salaire', amount: 2500, isCleared: true, type: 'income', category: 'Salaire' },
    { id: 'f3', name: 'EDF', amount: 60, isCleared: false, type: 'expense', category: 'Logement' },
  ]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Charger les données au démarrage
  useEffect(() => {
    const savedTx = localStorage.getItem('budget_tx');
    const savedFixed = localStorage.getItem('budget_fixed');
    if (savedTx) setTransactions(JSON.parse(savedTx));
    if (savedFixed) setFixedCharges(JSON.parse(savedFixed));
  }, []);

  // Sauvegarder à chaque modification
  useEffect(() => {
    localStorage.setItem('budget_tx', JSON.stringify(transactions));
    localStorage.setItem('budget_fixed', JSON.stringify(fixedCharges));
  }, [transactions, fixedCharges]);

  // --- LOGIQUE MÉTIER ---
  const { balance, forecastPessimistic, forecastReal, income, expenses, categoryData } = useMemo(() => {
    const STARTING_BALANCE = 1000; // À rendre configurable plus tard
    
    const totalInc = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const totalExp = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
    const currentBalance = STARTING_BALANCE + totalInc - totalExp;

    // Calcul Charges Fixes restantes (non pointées)
    const remainingFixed = fixedCharges
      .filter(c => !c.isCleared && c.type === 'expense')
      .reduce((a, b) => a + b.amount, 0);

    // Calcul Enveloppes Variables (Budget estimé à 500€ dans cet exemple)
    const VAR_BUDGET = 500;
    const spentInVar = transactions
      .filter(t => ['Alimentation', 'Loisirs', 'Transport'].includes(t.category))
      .reduce((a, b) => a + b.amount, 0);
    const remainingEnvelopes = Math.max(0, VAR_BUDGET - spentInVar);

    // Vision A : Réel (Si arrêt des dépenses variables maintenant)
    const fReal = currentBalance - remainingFixed;
    // Vision B : Pessimiste (Si enveloppes consommées au max)
    const fPessimistic = currentBalance - remainingFixed - remainingEnvelopes;

    // Graphique
    const chartData = Object.entries(
      transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value], i) => ({
      name, value, color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'][i % 4]
    }));

    return { 
        balance: currentBalance, 
        forecastPessimistic: fPessimistic, 
        forecastReal: fReal,
        income: totalInc, 
        expenses: totalExp, 
        categoryData: chartData 
    };
  }, [transactions, fixedCharges]);

  const handleAddTransaction = (data: any) => {
    setTransactions(prev => [{ id: uuidv4(), ...data }, ...prev]);
  };

  const toggleFixed = (id: string) => {
    setFixedCharges(prev => prev.map(c => c.id === id ? { ...c, isCleared: !c.isCleared } : c));
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24 text-slate-900">
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl relative overflow-hidden flex flex-col">
        
        <header className="pt-12 px-6 pb-4 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <h1 className="text-gray-500 text-sm font-medium">Tableau de bord</h1>
          <h2 className="text-2xl font-bold">Mon Pilotage</h2>
        </header>

        <div className="px-6 flex-1 overflow-y-auto">
          <BalanceCard 
            balance={balance} 
            forecast={forecastPessimistic}
            income={income}
            expenses={expenses}
            backgroundImage="https://images.unsplash.com/photo-1579546929662-711aa81148cf?q=80&w=1080"
          />

          {/* Double Vision Badge */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl mb-8 flex justify-between items-center">
            <div>
              <p className="text-slate-400 text-xs uppercase font-bold">Atterrissage Réel</p>
              <p className="text-xl font-bold">{forecastReal.toFixed(2)} €</p>
            </div>
            <div className="text-right">
                <span className="text-[10px] bg-slate-700 px-2 py-1 rounded-full text-slate-300">Estimation</span>
            </div>
          </div>

          {/* Section Pointage des Fixes */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">Charges & Revenus Fixes</h3>
            <Accordion type="single" collapsible className="w-full bg-gray-50 rounded-3xl border border-gray-100 px-4">
              <AccordionItem value="item-1" className="border-none">
                <AccordionTrigger className="text-sm font-semibold py-4">Détails à pointer</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-3 pb-4">
                  {fixedCharges.map(charge => (
                    <div key={charge.id} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={charge.isCleared} onCheckedChange={() => toggleFixed(charge.id)} />
                        <span className={`text-sm ${charge.isCleared ? 'line-through text-gray-400' : 'font-medium'}`}>{charge.name}</span>
                      </div>
                      <span className="text-sm font-bold">{charge.type === 'income' ? '+' : '-'}{charge.amount} €</span>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">Répartition</h3>
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm"><CategoryChart data={categoryData} /></div>
          </div>

          <div className="pb-24">
            <h3 className="text-lg font-bold mb-4">Transactions</h3>
            <TransactionList transactions={transactions} />
          </div>
        </div>

        {/* Floating Button */}
        <div className="absolute bottom-24 right-6 z-30">
          <button onClick={() => setIsDrawerOpen(true)} className="h-14 w-14 bg-black text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all"><Plus size={32} /></button>
        </div>

        <nav className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 px-8 py-4 flex justify-between z-20">
          <button className="flex flex-col items-center gap-1 text-black"><Home size={24} /><span className="text-[10px] font-bold">Flux</span></button>
          <button className="flex flex-col items-center gap-1 text-gray-400"><PieChart size={24} /><span className="text-[10px] font-bold">Analyse</span></button>
          <button className="flex flex-col items-center gap-1 text-gray-400"><Settings size={24} /><span className="text-[10px] font-bold">Réglages</span></button>
        </nav>

        <AddTransactionDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} onAdd={handleAddTransaction} />
      </div>
    </div>
  );
}