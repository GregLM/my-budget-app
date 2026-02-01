import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface TransactionListProps {
  transactions: any[];
  onEdit: (t: any) => void;
  onToggleCheck: (t: any) => void;
}

export function TransactionList({ transactions, onEdit, onToggleCheck }: TransactionListProps) {
  const [displayCount, setDisplayCount] = React.useState(20);

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800">
        <p className="text-slate-400 dark:text-slate-500 font-medium italic text-sm">Aucun mouvement à afficher</p>
      </div>
    );
  }

  // Tri par date : du plus récent au plus ancien
  const sortedTransactions = [...transactions].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const visibleTransactions = sortedTransactions.slice(0, displayCount);

  return (
    <div className="flex flex-col gap-3 pb-10">
      {visibleTransactions.map((t) => (
        <div 
          key={t.id} 
          onClick={() => onEdit(t)} 
          className={`flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-[24px] border transition-all active:scale-[0.98] cursor-pointer shadow-sm
            ${t.isFixed && !t.isCleared 
              ? 'border-dashed border-blue-300 bg-blue-50/10 dark:border-blue-500/30 dark:bg-blue-500/5' 
              : 'border-slate-100 dark:border-slate-800'}`}
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {t.isFixed ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCheck(t);
                }}
                className="shrink-0 focus:outline-none"
              >
                {t.isCleared ? (
                  <CheckCircle2 className="text-emerald-500" size={26} strokeWidth={2.5} />
                ) : (
                  <Circle className="text-slate-200 dark:text-slate-700" size={26} strokeWidth={2.5} />
                )}
              </button>
            ) : (
              <div className="h-11 w-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 dark:text-slate-500 text-[10px] uppercase shrink-0">
                {t.category ? t.category.substring(0, 2) : '??'}
              </div>
            )}
            
            <div className="flex flex-col min-w-0">
              <span className={`text-sm font-bold truncate ${t.isCleared ? 'text-slate-300 dark:text-slate-600 line-through' : 'text-slate-900 dark:text-white'}`}>
                {t.description || "Sans description"}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md tracking-tighter shrink-0">
                  {t.category || "Général"}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                   {t.date ? new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : ''}
                </span>
              </div>
            </div>
          </div>

          <div className={`font-black text-sm whitespace-nowrap ml-3 ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
            {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </div>
        </div>
      ))}

      {transactions.length > displayCount && (
        <button 
          onClick={() => setDisplayCount(prev => prev + 20)}
          className="mt-4 py-4 w-full text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-widest italic"
        >
          Voir les 20 mouvements suivants...
        </button>
      )}
    </div>
  );
}