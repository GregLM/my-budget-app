import React from 'react';
import { Drawer } from 'vaul';
import { useForm } from 'react-hook-form';
import { TransactionType } from '@/types';
import { Plus, X } from 'lucide-react';

interface AddTransactionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: any) => void;
}

export function AddTransactionDrawer({ open, onOpenChange, onAdd }: AddTransactionDrawerProps) {
  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      amount: '',
      description: '',
      category: 'Alimentation',
      type: 'expense' as TransactionType,
      date: new Date().toISOString().split('T')[0],
    }
  });

  const type = watch('type');

  const onSubmit = (data: any) => {
    onAdd({
      ...data,
      amount: parseFloat(data.amount),
      date: new Date(data.date).toISOString(),
    });
    reset();
    onOpenChange(false);
  };

  const categories = type === 'income' 
    ? ['Salaire', 'Freelance', 'Remboursement', 'Autre']
    : ['Alimentation', 'Logement', 'Transport', 'Loisirs', 'Santé', 'Autre'];

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="bg-white flex flex-col rounded-t-[32px] mt-24 h-[90vh] fixed bottom-0 left-0 right-0 z-50 outline-none max-w-md mx-auto">
          <div className="p-4 bg-white rounded-t-[32px] flex-1">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-8" />
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Nouvelle opération</h2>
              <button onClick={() => onOpenChange(false)} className="p-2 bg-gray-100 rounded-full">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
              
              {/* Type Selector */}
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setValue('type', 'expense')}
                  className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${
                    type === 'expense' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                  }`}
                >
                  Dépense
                </button>
                <button
                  type="button"
                  onClick={() => setValue('type', 'income')}
                  className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${
                    type === 'income' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                  }`}
                >
                  Revenu
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Montant</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('amount', { required: true })}
                    className="block w-full rounded-2xl border-gray-200 bg-gray-50 p-4 text-3xl font-bold focus:border-blue-500 focus:ring-blue-500 outline-none"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">€</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  placeholder="Ex: Courses, Loyer..."
                  {...register('description', { required: true })}
                  className="block w-full rounded-xl border-gray-200 bg-gray-50 p-4 focus:border-blue-500 focus:ring-blue-500 outline-none font-medium"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setValue('category', cat)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        watch('category') === cat 
                          ? 'bg-black text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

               {/* Date */}
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  {...register('date', { required: true })}
                  className="block w-full rounded-xl border-gray-200 bg-gray-50 p-4 focus:border-blue-500 focus:ring-blue-500 outline-none font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg mt-4 shadow-lg shadow-blue-200 active:scale-95 transition-transform"
              >
                Ajouter
              </button>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
