import React, { useState, useRef } from 'react';
import { CheckCircle2, Circle, Trash2, Copy } from 'lucide-react';

interface TransactionListProps {
  transactions: any[];
  onEdit: (t: any) => void;
  onToggleCheck: (t: any) => void;
  onDelete: (id: string) => void;
  onDuplicate: (t: any) => void;
  onCategoryClick?: (category: string) => void;
}

export function TransactionList({ transactions, onEdit, onToggleCheck, onDelete, onDuplicate, onCategoryClick }: TransactionListProps) {
  const [displayCount, setDisplayCount] = useState(20);
  
  // États visuels (Animation)
  const [touchStart, setTouchStart] = useState(0);
  const [touchCurrent, setTouchCurrent] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // LOGIQUE INTERNE INSTANTANÉE (useRef)
  // Permet de stocker la zone touchée sans attendre le re-render de React
  const hitTarget = useRef<'check' | 'amount' | null>(null);

  const SWIPE_THRESHOLD = 150; 
  const DEAD_ZONE = 50;        

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
      'impot': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      'santé': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
      'assurance': 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      'enfant': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      'revenu': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    };
    const match = Object.keys(pastels).find(key => name.includes(key));
    return match ? pastels[match] : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  };

  const onTouchStart = (e: React.TouchEvent, id: string) => {
    const startX = e.targetTouches[0].clientX;
    setTouchStart(startX);
    setTouchCurrent(startX);
    setActiveId(id);

    // Détection immédiate de la zone
    const target = e.target as HTMLElement;
    
    // On remonte l'arbre DOM pour trouver le rôle
    if (target.closest('[data-role="checkbox-zone"]')) {
      hitTarget.current = 'check';
    } else if (target.closest('[data-role="amount-zone"]')) {
      hitTarget.current = 'amount';
    } else {
      hitTarget.current = null; // Zone morte (Centre)
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchCurrent(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (t: any) => {
    const rawDistance = touchCurrent - touchStart;
    const absDistance = Math.abs(rawDistance);

    // 1. SWIPE (Prioritaire)
    if (rawDistance > SWIPE_THRESHOLD) {
      onDuplicate(t);
    } 
    else if (rawDistance < -SWIPE_THRESHOLD) {
      onDelete(t.id);
    }
    // 2. CLIC (Si pas de mouvement significatif)
    else if (absDistance < DEAD_ZONE) {
      
      // On lit la valeur INSTANTANÉE de la ref
      if (hitTarget.current === 'check') {
         if (t.isFixed) onToggleCheck(t);
      } 
      else if (hitTarget.current === 'amount') {
         onEdit(t);
      }
      // Si hitTarget.current est null (Centre) -> RIEN
    }

    // Reset
    setTouchStart(0);
    setTouchCurrent(0);
    setActiveId(null);
    hitTarget.current = null;
  };

  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const visible = sorted.slice(0, displayCount);

  return (
    <div className="flex flex-col gap-3 pb-10">
      {visible.map((t) => {
        const rawDistance = activeId === t.id ? touchCurrent - touchStart : 0;
        const distance = Math.abs(rawDistance) > DEAD_ZONE ? rawDistance : 0;
        const isDuplicating = distance > 0;
        const isDeleting = distance < 0;
        const absDistance = Math.abs(distance);
        const opacity = Math.min(absDistance / 100, 1);

        return (
          <div key={t.id} className="relative overflow-hidden rounded-[24px] bg-slate-100 dark:bg-slate-900 select-none">
            {/* Background Actions */}
            <div 
              className={`absolute inset-0 flex items-center px-6 transition-colors ${
                isDuplicating ? 'bg-blue-600 justify-start' : isDeleting ? 'bg-red-600 justify-end' : ''
              }`}
              style={{ opacity }}
            >
              {isDuplicating && <Copy className="text-white" size={24} style={{ transform: `scale(${Math.min(0.5 + absDistance/200, 1.2)})` }} />}
              {isDeleting && <Trash2 className="text-white" size={24} style={{ transform: `scale(${Math.min(0.5 + absDistance/200, 1.2)})` }} />}
            </div>

            {/* Carte Principale */}
            <div 
              onTouchStart={(e) => onTouchStart(e, t.id)}
              onTouchMove={onTouchMove}
              onTouchEnd={() => onTouchEnd(t)}
              style={{ 
                transform: `translateX(${distance}px)`,
                transition: activeId === t.id ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
              }}
              className={`flex items-center justify-between p-4 bg-card border transition-all relative z-10 rounded-[24px] active:scale-[0.99]
                ${t.isFixed && !t.isCleared ? 'border-dashed border-blue-400 bg-blue-500/5' : 'border-border'}`}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0 pointer-events-none">
                {t.isFixed ? (
                  // ZONE GAUCHE : CHECKBOX
                  <div data-role="checkbox-zone" className="shrink-0 pointer-events-auto cursor-pointer p-3 -m-3 rounded-full">
                    {t.isCleared ? <CheckCircle2 className="text-emerald-500" size={26} /> : <Circle className="text-muted-foreground/30" size={26} />}
                  </div>
                ) : (
                  <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center font-black text-muted-foreground text-[10px] uppercase shrink-0">
                    {t.category ? t.category.substring(0, 2) : '??'}
                  </div>
                )}
                
                {/* ZONE CENTRE : RIEN (Sauf Tag) */}
                <div className="flex flex-col min-w-0">
                  <span className={`text-sm font-bold truncate ${t.isCleared ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {t.description || "Sans description"}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5 pointer-events-auto">
                    {/* TAG CATÉGORIE : Clic autorisé, Swipe autorisé */}
                    <button 
                      type="button"
                      onClick={(e) => { 
                          e.stopPropagation(); // On arrête tout, c'est le filtre
                          onCategoryClick && t.category && onCategoryClick(t.category); 
                      }}
                      // On retire le stopPropagation du touchStart pour permettre le swipe même en partant du tag
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-tighter shrink-0 ${getPastelTag(t.category || '')} active:scale-95 transition-transform`}
                    >
                      {t.category || "Général"}
                    </button>
                    <span className="text-[10px] text-muted-foreground font-medium">
                       {t.date ? new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* ZONE DROITE : MONTANT */}
              <div 
                data-role="amount-zone"
                className={`font-black text-sm whitespace-nowrap ml-3 pointer-events-auto cursor-pointer p-2 -m-2 ${t.type === 'income' ? 'text-emerald-600' : 'text-foreground'}`}
              >
                {t.type === 'income' ? '+' : '-'}{Math.abs(Number(t.amount)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </div>
            </div>
          </div>
        );
      })}
      {transactions.length > displayCount && (
        <button onClick={() => setDisplayCount(prev => prev + 15)} className="mt-2 py-4 w-full text-blue-600 font-black text-[10px] uppercase tracking-widest italic">
          Afficher plus de mouvements...
        </button>
      )}
    </div>
  );
}