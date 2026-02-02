import React, { useEffect } from 'react';
import { Drawer } from 'vaul';
import { useForm } from 'react-hook-form';
import { X, Trash2, Repeat } from 'lucide-react';

export function AddTransactionDrawer({ open, onOpenChange, onAdd, initialData, onDelete, categories = [] }: any) {
  const { register, handleSubmit, reset, watch, setValue } = useForm();

  useEffect(() => {
    if (open) {
      if (initialData) reset({ ...initialData, amount: Math.abs(initialData.amount) });
      else reset({ amount: '', description: '', category: categories[0], type: 'expense', isFixed: false, date: new Date().toISOString().split('T')[0] });
    }
  }, [initialData, reset, open, categories]);

  const onSubmit = (data: any) => { onAdd(data); onOpenChange(false); };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
        <Drawer.Content className="bg-background flex flex-col rounded-t-[40px] fixed bottom-0 left-0 right-0 z-50 outline-none max-w-md mx-auto h-[96vh] border-t border-border shadow-2xl">
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-8" />
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
              <div className="flex bg-muted p-1 rounded-2xl h-12">
                <button type="button" onClick={() => setValue('type', 'expense')} className={`flex-1 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${watch('type') === 'expense' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>Dépense</button>
                <button type="button" onClick={() => setValue('type', 'income')} className={`flex-1 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${watch('type') === 'income' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>Revenu</button>
              </div>

              <input type="number" step="0.01" inputMode="decimal" {...register('amount', { required: true })} className="w-full text-6xl font-black text-center py-4 bg-transparent text-foreground outline-none" placeholder="0.00" autoFocus />

              <div className="grid grid-cols-2 gap-3">
                <input type="text" {...register('description', { required: true })} placeholder="Libellé" className="bg-muted p-5 rounded-2xl font-bold text-sm outline-none text-foreground" />
                <input type="date" {...register('date', { required: true })} className="bg-muted p-5 rounded-2xl text-xs font-bold outline-none text-foreground" />
              </div>

              <div className="flex items-center justify-between p-5 bg-muted rounded-2xl">
                <span className="text-[10px] font-black uppercase opacity-40 text-foreground">Charge fixe récurrente</span>
                <input type="checkbox" {...register('isFixed')} className="w-6 h-6 accent-blue-600 rounded-lg" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat: string) => (
                  <button key={cat} type="button" onClick={() => setValue('category', cat)} className={`py-3 px-1 rounded-xl text-[10px] font-black uppercase border transition-all truncate ${watch('category') === cat ? 'bg-foreground border-foreground text-background shadow-lg scale-105' : 'border-muted text-muted-foreground'}`}>
                    {cat}
                  </button>
                ))}
              </div>

              <div className="pt-4 pb-12">
                <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                  Valider le mouvement
                </button>
                {initialData?.id && (
                  <button type="button" onClick={() => onDelete(initialData.id)} className="w-full mt-4 text-red-500 font-bold text-xs uppercase opacity-50">Supprimer l'opération</button>
                )}
              </div>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}