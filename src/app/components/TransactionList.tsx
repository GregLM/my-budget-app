import React, { useState } from 'react';
import { CheckCircle2, Circle, Trash2, Copy } from 'lucide-react'; // Ajout de Copy

interface TransactionListProps {
  transactions: any[];
  onEdit: (t: any) => void;
  onToggleCheck: (t: any) => void;
  onDelete: (id: string) => void;
  onDuplicate: (t: any) => void; // Nouvelle prop
}

export function TransactionList({ transactions, onEdit, onToggleCheck, onDelete, onDuplicate }: TransactionListProps) {
  const [displayCount, setDisplayCount] = useState(5);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [swipedDir, setSwipedDir] = useState<'left' | 'right' | null>(null);
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
      'divers': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
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
          
          {/* ARRIÈRE-PLAN : SUPPRESSION (À droite) */}
          <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-6 rounded-[24px]">
            <Trash2 className="text-white" size={24} />
          </div>

          {/* ARRIÈRE-PLAN : DUPLICATION (À gauche) */}
          <div className="absolute inset-0 bg-blue-500 flex items-center justify-start px-6 rounded-[24px]">
            <Copy className="text-white" size={24} />
          </div>

          {/* CARTE TRANSACTION */}
          <div 
            onTouchStart={(e) => setStartX(e.touches[0].clientX)}
            onTouchMove={(e) => {
              const diff = startX - e.touches[0].clientX;
              if (diff > 50) { setSwipedId(t.id); setSwipedDir('left'); }
              if (diff < -50) { setSwipedId(t.id); setSwipedDir('right'); }
              if (Math.abs(diff) < 10 && swipedId === t.id) { setSwipedId(null); setSwipedDir(null); }
            }}
            onClick={() => {
              if (swipedId === t.id) { setSwipedId(null); setSwipedDir(null); }
              else onEdit(t);
            }}
            style={{ 
              transform: swipedId === t.id 
                ? (swipedDir === 'left' ? 'translateX(-80px)' : 'translateX(80px)') 
                : 'translateX(0)' 
            }}
            className={`flex items-center justify-between p-4 bg-card border transition-transform duration-300 ease-out cursor-pointer shadow-sm relative z-10 rounded-[24px]
              ${t.isFixed && !t.isCleared ? 'border-dashed border-blue-400 bg-blue-500/5' : 'border-border'}`}
          >
            {/* ... (Contenu de la carte identique) ... */}
            
            {/* BOUTONS D'ACTION RAPIDE LORS DU SWIPE */}
            {swipedId === t.id && swipedDir === 'left' && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                className="absolute inset-0 bg-red-500 z-20 flex items-center justify-center text-white font-black uppercase text-xs tracking-widest"
              >
                Confirmer la suppression
              </button>
            )}

            {swipedId === t.id && swipedDir === 'right' && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDuplicate(t); setSwipedId(null); }}
                className="absolute inset-0 bg-blue-500 z-20 flex items-center justify-center text-white font-black uppercase text-xs tracking-widest"
              >
                Dupliquer ce mouvement
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