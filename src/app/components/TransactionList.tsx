import React from 'react';
import { Transaction } from '@/types';
import { ArrowUpRight, ArrowDownLeft, ShoppingBag, Coffee, Home, Car, Zap, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TransactionListProps {
  transactions: Transaction[];
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'alimentation': return <ShoppingBag className="h-5 w-5 text-orange-500" />;
    case 'logement': return <Home className="h-5 w-5 text-blue-500" />;
    case 'transport': return <Car className="h-5 w-5 text-indigo-500" />;
    case 'loisirs': return <Coffee className="h-5 w-5 text-pink-500" />;
    case 'salaire': 
    case 'revenus': return <Briefcase className="h-5 w-5 text-emerald-500" />;
    default: return <Zap className="h-5 w-5 text-gray-500" />;
  }
};

const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
    case 'alimentation': return 'bg-orange-100';
    case 'logement': return 'bg-blue-100';
    case 'transport': return 'bg-indigo-100';
    case 'loisirs': return 'bg-pink-100';
    case 'salaire': 
    case 'revenus': return 'bg-emerald-100';
    default: return 'bg-gray-100';
  }
}

export function TransactionList({ transactions, onEdit }: { transactions: any[], onEdit: (t: any) => void }) {
  if (!transactions || transactions.length === 0) {
    return <div className="text-center py-8 text-gray-400">Rien à signaler</div>;
  }

  // Tri par date décroissante
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((t) => (
        <div 
          key={t.id} 
          onClick={() => onEdit(t)} 
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 active:scale-95 transition-transform cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
              {/* Vous pouvez remettre votre logique d'icônes ici */}
              {t.category[0]}
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900">{t.description}</div>
              <div className="text-xs text-gray-400">{t.category}</div>
            </div>
          </div>
          <div className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
            {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString('fr-FR')} €
          </div>
        </div>
      ))}
    </div>
  );
}
