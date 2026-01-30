import React, { useEffect } from 'react';
import { Drawer } from 'vaul';
import { useForm } from 'react-hook-form';
import { X, Trash2, Repeat } from 'lucide-react';

export function AddTransactionDrawer({ open, onOpenChange, onAdd, initialData, onDelete }: any) {
  const { register, handleSubmit, reset, watch, setValue } = useForm();

  useEffect(() => {
    if (initialData) {
      reset({ ...initialData, amount: Math.abs(initialData.amount) });
    } else {
      reset({ amount: '', description: '', category: 'Alimentation', type: 'expense', isFixed: false, date: new Date().toISOString().split('T')[0] });
    }
  }, [initialData, reset, open]);

  const onSubmit = (data: any) => {
    onAdd({ ...data, amount: Number(data.amount) });
    onOpenChange(false);
  };

  const isFixed = watch('isFixed');

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
        <Drawer.Content className="bg-white flex flex-col rounded-t-[40px] fixed bottom-0 left-0 right-0 z-50 outline-none max-w-md mx-auto h-[92vh]">
          <div className="p-6 bg-white rounded-t-[40px] flex-1 overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 rounded-full bg-slate-200 mb-8" />
            
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">
                {initialData?.id ? 'Modifier' : isFixed ? 'Nouveau Fixe' : 'Ajouter'}
              </h2>
              <div className="flex gap-2">
                {initialData?.id && (
                  <button onClick={() => { onDelete(initialData.id); onOpenChange(false); }} className="p-3 bg-red-50 rounded-2xl text-red-500 active:scale-90 transition-transform">
                    <Trash2 size={20} />
                  </button>
                )}
                <button onClick={() => onOpenChange(false)} className="p-3 bg-slate-100 rounded-2xl text-slate-500"><X size={20} /></button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 pb-40">
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button type="button" onClick={() => setValue('type', 'expense')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest ${watch('type') === 'expense' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>Dépense</button>
                <button type="button" onClick={() => setValue('type', 'income')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest ${watch('type') === 'income' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>Revenu</button>
              </div>

              <input type="number" step="0.01" {...register('amount', { required: true })} className="w-full text-6xl font-black text-center py-6 outline-none placeholder:text-slate-200" placeholder="0.00" autoFocus />

              <input type="text" {...register('description', { required: true })} placeholder="Libellé (Loyer, Courses...)" className="w-full bg-slate-50 p-5 rounded-2xl border-none font-bold outline-none" />

              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isFixed ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <Repeat size={18} />
                  </div>
                  <span className="text-sm font-bold">Charge fixe récurrente</span>
                </div>
                <input type="checkbox" {...register('isFixed')} className="w-6 h-6 rounded-lg accent-blue-600" />
              </div>

              <div className="flex flex-wrap gap-2">
                {['Alimentation', 'Logement', 'Transport', 'Loisirs', 'Santé', 'Salaire'].map(cat => (
                  <button key={cat} type="button" onClick={() => setValue('category', cat)} className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${watch('category') === cat ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-100 text-slate-400'}`}>{cat}</button>
                ))}
              </div>

              {/* BOUTON DE VALIDATION FIXÉ EN BAS DU TIROIR */}
              <div className="fixed bottom-10 left-6 right-6 max-w-md mx-auto">
                <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-blue-200 active:scale-95 transition-all">
                  {initialData?.id ? 'Enregistrer' : 'Valider'}
                </button>
              </div>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}