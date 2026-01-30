import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Home, PieChart, Settings, Wallet } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { AddTransactionDrawer } from '@/app/components/AddTransactionDrawer';
import { TransactionList } from '@/app/components/TransactionList';
import { BalanceCard } from '@/app/components/BalanceCard';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/app/components/ui/accordion";
import { Checkbox } from "@/app/components/ui/checkbox";

export default function App() {
  const [tab, setTab] = useState('home');
  const [data, setData] = useState({ transactions: [], startBalance: 1000, envelopes: [] });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Persistence (LocalStorage)
  useEffect(() => {
    const saved = localStorage.getItem('eco_budget_data');
    if (saved) setData(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('eco_budget_data', JSON.stringify(data));
  }, [data]);

  // Calculs intelligents
  const stats = useMemo(() => {
    const tx = data.transactions;
    // Revenus = Transactions revenus + Charges fixes de type revenu POINTÉES
    const inc = tx.filter(t => t.type === 'income' && (!t.isFixed || t.isCleared)).reduce((a, b) => a + Number(b.amount), 0);
    const exp = tx.filter(t => t.type === 'expense' && (!t.isFixed || t.isCleared)).reduce((a, b) => a + Number(b.amount), 0);
    
    const balance = data.startBalance + inc - exp;
    const remainingFixed = tx.filter(t => t.isFixed && !t.isCleared && t.type === 'expense').reduce((a, b) => a + Number(b.amount), 0);

    return { balance, inc, exp, forecast: balance - remainingFixed };
  }, [data]);

  const handleSave = (form) => {
    if (editingItem) {
      setData(d => ({ ...d, transactions: d.transactions.map(t => t.id === editingItem.id ? { ...form, id: t.id } : t) }));
    } else {
      setData(d => ({ ...d, transactions: [{ ...form, id: uuidv4() }, ...d.transactions] }));
    }
    setIsDrawerOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-white">
      <main className="flex-1 overflow-y-auto p-6 pb-32">
        {tab === 'home' && (
          <>
            <BalanceCard balance={stats.balance} forecast={stats.forecast} income={stats.inc} expenses={stats.exp} />
            
            <Accordion type="single" collapsible className="mb-8">
              <AccordionItem value="fixed">
                <AccordionTrigger className="font-bold">Pointage Fixe</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  {data.transactions.filter(t => t.isFixed).map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={t.isCleared} onCheckedChange={() => handleSave({ ...t, isCleared: !t.isCleared })} />
                        <span onClick={() => { setEditingItem(t); setIsDrawerOpen(true); }} className="text-sm font-medium">{t.description}</span>
                      </div>
                      <span className="font-bold">{t.amount}€</span>
                    </div>
                  ))}
                  <button onClick={() => setIsDrawerOpen(true)} className="w-full p-3 border-2 border-dashed rounded-xl text-gray-400 text-sm font-bold">+ Ajouter une charge</button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <TransactionList transactions={data.transactions.filter(t => !t.isFixed)} onEdit={(t) => { setEditingItem(t); setIsDrawerOpen(true); }} />
          </>
        )}

        {tab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Réglages</h2>
            <div className="p-4 bg-gray-50 rounded-2xl">
              <label className="text-xs font-bold text-gray-400 uppercase">Solde de départ</label>
              <input type="number" value={data.startBalance} onChange={(e) => setData(d => ({...d, startBalance: Number(e.target.value)}))} className="w-full text-2xl font-bold bg-transparent outline-none" />
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center p-4 pb-safe">
        <button onClick={() => setTab('home')} className={tab === 'home' ? 'text-blue-600' : 'text-gray-400'}><Home /></button>
        <button onClick={() => { setEditingItem(null); setIsDrawerOpen(true); }} className="bg-blue-600 text-white p-4 rounded-full -mt-12 shadow-xl shadow-blue-200"><Plus size={32}/></button>
        <button onClick={() => setTab('settings')} className={tab === 'settings' ? 'text-blue-600' : 'text-gray-400'}><Settings /></button>
      </nav>

      <AddTransactionDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} onAdd={handleSave} initialData={editingItem} onDelete={(id) => setData(d => ({ ...d, transactions: d.transactions.filter(t => t.id !== id) }))} />
    </div>
  );
}