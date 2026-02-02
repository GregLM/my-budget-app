import React, { useState } from 'react';
import { CheckCircle2, Circle, Trash2 } from 'lucide-react';

interface TransactionListProps {
  transactions: any[];
  onEdit: (t: any) => void;
  onToggleCheck: (t: any) => void;
  onDelete: (id: string) => void;
}

// Mapping des couleurs pastel par catégorie
const getCategoryStyle = (cat: string) => {
  const c = cat.toLowerCase();
  if (c.includes('alim')) return 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
  if (c.includes('loisir') || c.includes('sort')) return 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400';
  if (c.includes('revenu') || c.includes('salair')) return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (c.includes('transp') || c.includes('auto')) return 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
  if (c.includes('loyer') || c.includes('logem')) return 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400';
  if (c.includes('santé')) return 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400';
  return 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
};

export function TransactionList({ transactions, onEdit, onToggleCheck, onDelete }: TransactionListProps) {
  const [displayCount, setDisplayCount] = useState(5); // On limite à 5 par défaut
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState(0);

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/50 rounded-[32px] border border-dashed border-border">
        <p className="text-muted-foreground font-medium italic text-sm">Aucun mouvement</p>
      </div>
    );
  }

  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const visible = sorted.slice(0, displayCount);

  // Gestion du Swipe
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent, id: string) => {
    const touchEnd = e.targetTouches[0].clientX;
    if (touchStart - touchEnd > 70) setSwipedId(id); // Swipe à gauche
    if (touchEnd - touchStart > 70) setSwipedId(null); // Swipe à droite (annuler)
  };

  return (
    <div className="flex flex-col gap-3 pb-10">
      {visible.map((t) => (
        <div key={t.id} className="relative overflow-hidden rounded-[24px]">
          {/* Bouton Corbeille en arrière-plan */}
          <button 
            onClick={() => { onDelete(t.id); setSwipedId(null); }}
            className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 text-white flex items-center justify-center transition-opacity"
          >
            <Trash2 size={24} />
          </button>

          {/* Carte de Transaction */}
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={(e) => handleTouchMove(e, t.id)}
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
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-tighter shrink-0 ${getCategoryStyle(t.category || '')}`}>
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
        </div>
      ))}

      {transactions.length > displayCount && (
        <button 
          onClick={() => setDisplayCount(prev => prev + 20)}
          className="mt-2 py-4 w-full text-blue-600 font-black text-[10px] uppercase tracking-widest italic"
        >
          Voir plus de mouvements...
        </button>
      )}
    </div>
  );
}