import React, { useEffect } from 'react';
import { Drawer } from 'vaul';
import { useForm } from 'react-hook-form';
import { X, Trash2 } from 'lucide-react';

export function AddTransactionDrawer({ open, onOpenChange, onAdd, initialData, onDelete }: any) {
  const { register, handleSubmit, reset, watch, setValue } = useForm();

  // Remplit le formulaire si on est en mode édition
  useEffect(() => {
    if (initialData) reset(initialData);
    else reset({ amount: '', description: '', category: 'Alimentation', type: 'expense', isFixed: false, date: new Date().toISOString().split('T')[0] });
  }, [initialData, open, reset]);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" />
        <Drawer.Content className="bg-white flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 z-50 outline-none max-w-md mx-auto h-[90vh]">
          <div className="p-6 overflow-y-auto flex-1">
            <div className="mx-auto w-12 h-1.5 rounded-full bg-gray-200 mb-8" />
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{initialData ? 'Modifier' : 'Opération'}</h2>
              <div className="flex gap-2">
                {initialData && (
                  <button onClick={() => { onDelete(initialData.id); onOpenChange(false); }} className="p-2 bg-red-50 text-red-500 rounded-full">
                    <Trash2 size={20} />
                  </button>
                )}
                <button onClick={() => onOpenChange(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onAdd)} className="space-y-6 pb-32">
              <div className="flex bg-gray-100 p-1 rounded-xl">
                {['expense', 'income'].map((t) => (
                  <button key={t} type="button" onClick={() => setValue('type', t)} className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize ${watch('type') === t ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
                    {t === 'expense' ? 'Dépense' : 'Revenu'}
                  </button>
                ))}
              </div>

              <input type="number" step="0.01" {...register('amount', { required: true })} className="w-full text-5xl font-bold text-center outline-none" placeholder="0.00" />
              
              <input type="text" {...register('description', { required: true })} placeholder="Description" className="w-full p-4 bg-gray-50 rounded-2xl outline-none" />

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="text-sm font-medium">Charge Fixe ?</span>
                <input type="checkbox" {...register('isFixed')} className="w-6 h-6 rounded-md" />
              </div>

              <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t pb-safe z-50">
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg">
                  {initialData ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}