import React from 'react';
import { X } from 'lucide-react';
import { getCategoryStyle } from '@/app/utils/categories';

interface ArchiveDetailsDrawerProps {
  archive: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ArchiveDetailsDrawer({ archive, isOpen, onClose }: ArchiveDetailsDrawerProps) {
  // Si le tiroir est fermé ou qu'aucune archive n'est sélectionnée, on ne rend rien
  if (!isOpen || !archive) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-md animate-in slide-in-from-bottom-full duration-300">
      
      {/* --- EN-TÊTE FIXE --- */}
      <div className="flex items-center justify-between p-6 border-b border-border bg-card">
        <h2 className="text-2xl font-black italic uppercase">Archive : {archive.month}</h2>
        <button onClick={onClose} className="p-2 bg-muted rounded-full active:scale-90 transition-transform">
          <X size={24} />
        </button>
      </div>

      {/* --- CONTENU SCROLLABLE --- */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        
        {/* BLOC 1 : LES SOLDES */}
        <div className="flex gap-4">
            <div className="flex-1 bg-muted p-5 rounded-3xl border border-border">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Solde Initial</p>
                <p className="text-xl font-black mt-1">{parseFloat(archive.startingBalance).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
            </div>
            <div className="flex-1 bg-blue-100 dark:bg-blue-900/30 p-5 rounded-3xl border border-blue-200 dark:border-blue-900/50">
                <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest">Atterrissage</p>
                <p className="text-xl font-black mt-1 text-blue-700 dark:text-blue-300">{archive.finalBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
            </div>
        </div>

        {/* BLOC 2 : LES BUDGETS RÉALISÉS (Figés) */}
        <div>
            <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4 px-2">Budgets Réalisés</h3>
            <div className="space-y-4">
                {archive.envs?.map((s: any) => {
                    const style = getCategoryStyle(s.name);
                    const real = Math.abs(s.real);
                    // On recalcule le pourcentage pour la barre de progression
                    const pct = s.target > 0 ? (real / s.target) * 100 : 0;
                    return (
                        <div key={s.id} className="bg-card p-5 rounded-[24px] border border-border space-y-2">
                            <div className="flex justify-between font-black uppercase text-xs">
                                <span className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: style.color }} />
                                    {s.name}
                                </span>
                                <span>{real.toFixed(0)}€ / {s.target}€</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                    className="h-full transition-all duration-500" 
                                    style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: style.color }} 
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* BLOC 3 : LE GRAND LIVRE (Mouvements) */}
        <div>
            <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4 px-2">Mouvements du mois</h3>
            <div className="space-y-3">
                {/* On trie les transactions par date (de la plus récente à la plus ancienne) */}
                {archive.transactions?.sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t: any) => {
                     const style = getCategoryStyle(t.category || '');
                     return (
                        <div key={t.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-[24px]">
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className={`text-sm font-bold truncate ${t.isCleared ? 'text-muted-foreground line-through' : ''}`}>
                                  {t.description || "Sans description"}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-tighter shrink-0 ${style.bg} ${style.text}`}>
                                      {t.category || "Général"}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-medium">
                                      {t.date ? new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : ''}
                                    </span>
                                </div>
                            </div>
                            <div className={`font-black text-sm whitespace-nowrap ml-3 ${t.type === 'income' ? 'text-emerald-600' : 'text-foreground'}`}>
                                {t.type === 'income' ? '+' : '-'}{Math.abs(Number(t.amount)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                            </div>
                        </div>
                     )
                })}
            </div>
        </div>

      </div>
    </div>
  );
}