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
      <div className="text-center py-12 bg-muted/50 rounded-[32px] border border-dashed border-border">
        <p className="text-muted-foreground font-medium italic text-sm">Aucun mouvement à afficher</p>
      </div>
    );
  }

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
          className={`flex items-center justify-between p-4 bg-card rounded-[24px] border transition-all active:scale-[0.98] cursor-pointer shadow-sm
            ${t.isFixed && !t.isCleared 
              ? 'border-dashed border-blue-400 bg-blue-500/5' 
              : 'border-border'}`}
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {t.isFixed ? (
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleCheck(t); }}
                className="shrink-0 focus:outline-none"
              >
                {t.isCleared ? (
                  <CheckCircle2 className="text-emerald-500" size={26} strokeWidth={2.5} />
                ) : (
                  <Circle className="text-muted-foreground/30" size={26} strokeWidth={2.5} />
                )}
              </button>
            ) : (
              <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center font-black text-muted-foreground text-[10px] uppercase shrink-0">
                {t.category ? t.category.substring(0, 2) : '??'}
              </div>
            )}
            
            <div className="flex flex-col min-w-0">
              <span className={`text-sm font-bold truncate ${t.isCleared ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                {t.description || "Sans description"}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-md tracking-tighter shrink-0">
                  {t.category || "Général"}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">
                   {t.date ? new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : ''}
                </span>
              </div>
            </div>
          </div>

          <div className={`font-black text-sm whitespace-nowrap ml-3 ${t.type === 'income' ? 'text-emerald-600' : 'text-foreground'}`}>
            {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </div>
        </div>
      ))}
    </div>
  );
}