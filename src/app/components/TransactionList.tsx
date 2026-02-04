import React, { useState, useRef } from 'react';
import { CheckCircle2, Circle, Trash2, Pencil } from 'lucide-react';
import { getCategoryStyle } from '@/app/utils/categories'; // Ton nouveau fichier de styles

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
  
  // États Swipe
  const [touchStart, setTouchStart] = useState(0);
  const [touchCurrent, setTouchCurrent] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Verrou Swipe vs Clic
  const isSwiping = useRef(false);

  const SWIPE_THRESHOLD = 150; 

  // NOTE : J'ai supprimé l'ancienne fonction getPastelTag ici
  // car nous utilisons désormais getCategoryStyle importé plus haut.

  const onTouchStart = (e: React.TouchEvent, id: string) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchCurrent(e.targetTouches[0].clientX);
    setActiveId(id);
    isSwiping.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const current = e.targetTouches[0].clientX;
    setTouchCurrent(current);
    if (Math.abs(current - touchStart) > 10) {
      isSwiping.current = true;
    }
  };

  const onTouchEnd = (t: any) => {
    const rawDistance = touchCurrent - touchStart;
    
    // Action Swipe uniquement si mouvement ample (> 150px)
    if (Math.abs(rawDistance) > SWIPE_THRESHOLD) {
      if (rawDistance > 0) {
        // SWIPE DROITE -> ÉDITION
        onEdit(t);
      } else {
        // SWIPE GAUCHE -> SUPPRESSION
        onDelete(t.id);
      }
    }

    setTouchStart(0);
    setTouchCurrent(0);
    setActiveId(null);
    setTimeout(() => { isSwiping.current = false; }, 100);
  };

  const handleSafeClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    if (isSwiping.current) return;
    action();
  };

  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const visible = sorted.slice(0, displayCount);

  return (
    <div className="flex flex-col gap-3 pb-10">
      {visible.map((t) => {
        const rawDistance = activeId === t.id ? touchCurrent - touchStart : 0;
        const distance = isSwiping.current ? rawDistance : 0;
        
        const isEditing = distance > 0;
        const isDeleting = distance < 0;
        const absDistance = Math.abs(distance);
        const opacity = Math.min(absDistance / 100, 1);

        // RÉCUPÉRATION DU STYLE HARMONISÉ
        const style = getCategoryStyle(t.category || '');

        return (
          <div key={t.id} className="relative overflow-hidden rounded-[24px] bg-slate-100 dark:bg-slate-900 select-none">
            {/* Background Actions */}
            <div className={`absolute inset-0 flex items-center px-6 transition-colors ${isEditing ? 'bg-blue-600 justify-start' : isDeleting ? 'bg-red-600 justify-end' : ''}`} style={{ opacity }}>
              {isEditing && <Pencil className="text-white" size={24} />}
              {isDeleting && <Trash2 className="text-white" size={24} />}
            </div>

            {/* Carte Principale */}
            <div 
              onTouchStart={(e) => onTouchStart(e, t.id)}
              onTouchMove={onTouchMove}
              onTouchEnd={() => onTouchEnd(t)}
              style={{ transform: `translateX(${distance}px)`, transition: activeId === t.id ? 'none' : 'transform 0.3s' }}
              className={`flex items-center justify-between p-4 bg-card border transition-all relative z-10 rounded-[24px] ${t.isFixed && !t.isCleared ? 'border-dashed border-blue-400 bg-blue-500/5' : 'border-border'}`}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {t.isFixed ? (
                  // ZONE CHECKBOX (Gauche) - Pointage
                  <div onClick={(e) => handleSafeClick(e, () => onToggleCheck(t))} className="shrink-0 cursor-pointer p-3 -m-3">
                    {t.isCleared ? <CheckCircle2 className="text-emerald-500" size={26} /> : <Circle className="text-muted-foreground/30" size={26} />}
                  </div>
                ) : (
                  <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center font-black text-muted-foreground text-[10px] uppercase shrink-0">
                    {t.category ? t.category.substring(0, 2) : '??'}
                  </div>
                )}
                
                {/* ZONE CENTRE (Texte) */}
                <div className="flex flex-col min-w-0" onClick={(e) => e.stopPropagation()}>
                  <span className={`text-sm font-bold truncate ${t.isCleared ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{t.description || "Sans description"}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {/* TAG CATÉGORIE (Filtre) AVEC NOUVEAUX STYLES */}
                    <button 
                        type="button" 
                        onClick={(e) => handleSafeClick(e, () => onCategoryClick && t.category && onCategoryClick(t.category))} 
                        onTouchStart={(e) => e.stopPropagation()} 
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-tighter shrink-0 ${style.bg} ${style.text} active:scale-95 transition-transform`}
                    >
                      {t.category || "Général"}
                    </button>
                    <span className="text-[10px] text-muted-foreground font-medium">{t.date ? new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : ''}</span>
                  </div>
                </div>
              </div>

              {/* ZONE MONTANT (Droite) */}
              <div className={`font-black text-sm whitespace-nowrap ml-3 p-2 -m-2 ${t.type === 'income' ? 'text-emerald-600' : 'text-foreground'}`}>
                {t.type === 'income' ? '+' : '-'}{Math.abs(Number(t.amount)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </div>
            </div>
          </div>
        );
      })}
      {transactions.length > displayCount && (
        <button onClick={() => setDisplayCount(prev => prev + 15)} className="mt-2 py-4 w-full text-blue-600 font-black text-[10px] uppercase tracking-widest italic">Afficher plus de mouvements...</button>
      )}
    </div>
  );
}