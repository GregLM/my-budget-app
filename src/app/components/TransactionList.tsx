import React, { useState } from 'react';
import { CheckCircle2, Circle, Trash2 } from 'lucide-react';

interface TransactionListProps {
  transactions: any[];
  onEdit: (t: any) => void;
  onToggleCheck: (t: any) => void;
  onDelete: (id: string) => void;
}

export function TransactionList({ transactions, onEdit, onToggleCheck, onDelete }: TransactionListProps) {
  const [displayCount, setDisplayCount] = useState(5);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);

  // CONFIGURATION DES COULEURS PASTEL
  const getPastelTag = (category: string) => {
    const name = category.toLowerCase();
    const pastels: Record<string, string> = {
      'emprunt': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      'alim': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'abo': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
      'energie': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      'transport': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
      'loisir': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
      'epargne': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      'impots': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      'santé': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
      'assurance': 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      'enfant': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      'revenu': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    };

    const match = Object.keys(pastels).find(key => name.includes(key));
    return match ? pastels[match] : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  };

  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const visible = sorted.slice(0, displayCount);

  return (
    <div className="flex flex-col gap-3 pb-10">
      {visible.map((t) => (
        <div key={t.id} className="relative overflow-hidden rounded-[24px]">
          {/* ZONE DE SUPPRESSION (Arrière-plan) */}
          <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-6 rounded-[24px]">
            <Trash2 className="text-white" size={24} />
          </div>

          {/* CARTE TRANSACTION */}
          <div 
            onTouchStart={(e) => setStartX(e.touches[0].clientX)}
            onTouchMove={(e) => {
              const diff = startX - e.touches[0].clientX;
              if (diff > 50) setSwipedId(t.id);
              if (diff < -50) setSwipedId(null);
            }}
            onClick={() => swipedId === t.id ? setSwipedId(null) : onEdit(t)}
            style={{ transform: swipedId === t.id ? 'translateX(-80px)' : 'translateX(0)' }}
            className={`flex items-center justify-between p-4 bg-card border transition-transform duration-300 ease-out cursor-pointer shadow-sm relative z-10 rounded-[24px]
              ${t.isFixed && !t.isCleared ? 'border-dashed border-blue-400 bg-blue-500/5' : 'border-border'}`}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {t.isFixed ? (
                <button onClick={(e) => { e.stopPropagation(); onToggleCheck(t); }} className="shrink-0">
                  {t.isCleared ? <CheckCircle2 className="text-emerald-500" size={26} /> : <Circle className="text-muted-foreground/30" size={26} />}
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
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-tighter shrink-0 ${getPastelTag(t.category || '')}`}>
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

            {swipedId === t.id && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                className="absolute inset-0 bg-red-500 z-20 flex items-center justify-center text-white font-black uppercase text-xs tracking-widest"
              >
                Confirmer la suppression
              </button>
            )}
          </div>
        </div>
      ))}

      {transactions.length > displayCount && (
        <button 
          onClick={() => setDisplayCount(prev => prev + 15)}
          className="mt-2 py-4 w-full text-blue-600 font-black text-[10px] uppercase tracking-widest italic"
        >
          Afficher plus de mouvements...
        </button>
      )}
    </div>
  );
}