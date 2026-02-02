import React, { useEffect } from 'react';
import { Drawer } from 'vaul';
import { useForm } from 'react-hook-form';
import { X, Trash2, Repeat, Calendar } from 'lucide-react';

export function AddTransactionDrawer({ open, onOpenChange, onAdd, initialData, onDelete, categories = [] }: any) {
  const { register, handleSubmit, reset, watch, setValue } = useForm();

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({ ...initialData, amount: Math.abs(initialData.amount) });
      } else {
        reset({ 
          amount: '', 
          description: '', 
          category: categories[0] || 'Alimentation', 
          type: 'expense', 
          isFixed: false, 
          date: new Date().toISOString().split('T')[0] 
        });
      }
    }
  }, [initialData, reset, open, categories]);

  const onSubmit = (data: any) => {
    onAdd({ ...data, amount: Number(data.amount) });
    onOpenChange(false);
  };

  const isFixed = watch('isFixed');
  const currentType = watch('type');

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
        <Drawer.Content className="bg-background flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 z-50 outline-none max-w-md mx-auto h-[85vh] border-t border-border">
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="mx-auto w-12 h-1 rounded-full bg-muted mb-6" />
            
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {/* Sélecteur Type & Montant ultra-compact */}
              <div className="flex bg-muted p-1 rounded-xl h-10">
                <button type="button" onClick={() => setValue('type', 'expense')} className={`flex-1 rounded-lg text-[10px] font-black uppercase ${currentType === 'expense' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>Dépense</button>
                <button type="button" onClick={() => setValue('type', 'income')} className={`flex-1 rounded-lg text-[10px] font-black uppercase ${currentType === 'income' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>Revenu</button>
              </div>

              <input 
                type="number" step="0.01" inputMode="decimal"
                {...register('amount', { required: true })} 
                className="w-full text-5xl font-black text-center py-2 bg-transparent text-foreground placeholder:text-muted outline-none" 
                placeholder="0.00" 
              />

              <input 
                type="text" {...register('description', { required: true })} 
                placeholder="Libellé" 
                className="w-full bg-muted p-4 rounded-xl border-none font-bold text-sm outline-none" 
              />

              {/* Date et Fixe sur la même ligne pour gagner 60px de hauteur */}
              <div className="grid grid-cols-2 gap-3">
                <input type="date" {...register('date', { required: true })} className="bg-muted p-4 rounded-xl text-xs font-bold outline-none" />
                <div className="flex items-center justify-between px-4 bg-muted rounded-xl">
                  <span className="text-[10px] font-bold uppercase">Fixe</span>
                  <input type="checkbox" {...register('isFixed')} className="w-5 h-5 accent-blue-600" />
                </div>
              </div>

              {/* Catégories en grille de 3 pour éviter de scroller */}
              <div className="grid grid-cols-3 gap-2 py-2">
                {categories.map((cat: string) => (
                  <button 
                    key={cat} type="button" onClick={() => setValue('category', cat)} 
                    className={`py-2 rounded-xl text-[10px] font-bold border truncate ${watch('category') === cat ? 'bg-foreground border-foreground text-background' : 'border-muted text-muted-foreground'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-md shadow-lg active:scale-95 transition-all">
                Valider le mouvement
              </button>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}