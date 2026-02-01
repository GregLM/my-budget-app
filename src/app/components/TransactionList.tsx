import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export function TransactionList({ transactions, onEdit, onToggleCheck }: { transactions: any[], onEdit: (t: any) => void, onToggleCheck: (t: any) => void }) {
  const [displayCount, setDisplayCount] = React.useState(20);

  if (!transactions || transactions.length === 0) {
    return <div className="text-center py-8 text-slate-400">Aucun mouvement ce mois</div>;
  }

  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const visibleTransactions = sorted.slice(0, displayCount);

  return (
    <div className="flex flex-col gap-3">
      {visibleTransactions.map((t) => (
        <div 
          key={t.id} 
          onClick={() => onEdit(t)} 
          className={`flex items-center justify-between p-4 bg-white rounded-2xl border active:scale-95 transition-all ${t.isFixed && !t.isCleared ? 'border-dashed border-blue-300' : 'border-slate-100'}`}
        >
          <div className="flex items-center gap-4 flex-1">
            {t.isFixed ? (
              <div onClick={(e) => { e.stopPropagation(); onToggleCheck(t); }}>
                {t.isCleared ? <CheckCircle2 className="text-emerald-500" size={24} /> : <Circle className="text-slate-300" size={24} />}
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs uppercase">
                {/* SÉCURITÉ ICI : On vérifie que la catégorie existe avant le substring */}
                {t.category ? t.category.substring(0, 2) : '??'}
              </div>
            )}
            
            <div className="flex flex-col">
              <span className={`text-sm font-bold ${t.isCleared ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                {t.description || "Sans description"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {t.category || "Général"}
                </span>
                <span className="text-[10px] text-slate-400">
                   {t.date ? new Date(t.date).toLocaleDateString('fr-FR') : ''}
                </span>
              </div>
            </div>
          </div>

          <div className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
            {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString('fr-FR')} €
          </div>
        </div>
      ))}

      {transactions.length > displayCount && (
        <button onClick={() => setDisplayCount(prev => prev + 20)} className="py-4 text-blue-600 font-bold text-sm italic">
          Afficher plus de mouvements...
        </button>
      )}
    </div>
  );
}