import React from 'react';
import { Drawer } from 'vaul';
import { TransactionList } from './TransactionList';
import { X } from 'lucide-react';

interface CategoryDetailsDrawerProps {
  category: string | null;
  isOpen: boolean;
  onClose: () => void;
  transactions: any[];
  onEdit: (t: any) => void;
  onDelete: (id: string) => void;
  onDuplicate: (t: any) => void;
  onToggleCheck: (t: any) => void;
}

export function CategoryDetailsDrawer({ category, isOpen, onClose, transactions, onEdit, onDelete, onDuplicate, onToggleCheck }: CategoryDetailsDrawerProps) {
  // Filtrer uniquement si une catégorie est sélectionnée
  const filtered = category ? transactions.filter((t: any) => t.category === category) : [];
  
  // CORRECTION MATHÉMATIQUE ROBUSTE
  // On ignore le signe stocké en base, on recalcul proprement selon le type.
  const total = filtered.reduce((acc: number, t: any) => {
    const rawVal = parseFloat(t.amount);
    const absVal = Math.abs(rawVal); // On prend toujours la valeur positive (ex: |-20| = 20)
    
    // Si c'est un revenu, on ajoute. Si c'est une dépense, on soustrait.
    return t.type === 'income' ? acc + absVal : acc - absVal;
  }, 0);

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
        <Drawer.Content className="bg-muted flex flex-col rounded-t-[40px] fixed bottom-0 left-0 right-0 z-50 h-[85dvh] outline-none">
          
          {/* Header */}
          <div className="p-8 bg-background rounded-t-[40px] shadow-sm z-10 border-b border-border relative">
            <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-6" />
            <button onClick={onClose} className="absolute top-8 right-8 p-2 bg-muted rounded-full opacity-50 hover:opacity-100">
                <X size={20} />
            </button>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Détail Catégorie</p>
                <h2 className="text-3xl font-black uppercase tracking-tight text-blue-600">{category}</h2>
                <p className="text-xs text-muted-foreground font-bold mt-1">{filtered.length} mouvement(s)</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Bilan Période</p>
                {/* Couleur dynamique selon si le solde est positif ou négatif */}
                <p className={`text-3xl font-black ${total >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            </div>
          </div>

          {/* Liste Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 bg-muted">
             <TransactionList 
                transactions={filtered}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onToggleCheck={onToggleCheck}
             />
             <div className="h-20" />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}