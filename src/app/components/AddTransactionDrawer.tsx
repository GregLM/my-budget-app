import React, { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { useForm } from 'react-hook-form';
import { X, Trash2, Check, Delete, Calendar, Tag, Type } from 'lucide-react';

export function AddTransactionDrawer({ open, onOpenChange, onAdd, initialData, onDelete, categories = [] }: any) {
  const { register, handleSubmit, reset, watch, setValue } = useForm();
  
  // On gère le montant comme une simple chaîne de caractères (comme le simulateur)
  const [amountString, setAmountString] = useState('');

  // Chargement des données (Mode Création ou Édition)
  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({ ...initialData });
        // On initialise le montant visuel
        setAmountString(Math.abs(initialData.amount).toString());
      } else {
        reset({ description: '', category: categories[0], type: 'expense', isFixed: false, date: new Date().toISOString().split('T')[0] });
        setAmountString('');
      }
    }
  }, [initialData, reset, open, categories]);

  // Synchronisation : Quand la string change, on met à jour le formulaire caché
  useEffect(() => {
    const val = parseFloat(amountString || '0');
    setValue('amount', val);
  }, [amountString, setValue]);

  const onSubmit = (data: any) => {
    // Sécurité : Si pas de montant, on bloque ou on met 0
    if (!amountString) return;
    
    const finalAmount = parseFloat(amountString);
    // Gestion du signe selon le type (Dépense = négatif)
    const signedAmount = data.type === 'expense' ? -Math.abs(finalAmount) : Math.abs(finalAmount);
    
    onAdd({ ...data, amount: signedAmount });
    onOpenChange(false);
  };

  // Logique du Pavé Numérique
  const handlePress = (val: string) => {
    if (val === '.' && amountString.includes('.')) return;
    if (amountString.length > 8) return; // Limite de sécurité visuelle
    setAmountString(prev => prev + val);
  };

  const handleDeleteDigit = () => {
    setAmountString(prev => prev.slice(0, -1));
  };

  const type = watch('type');

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
        <Drawer.Content className="bg-background flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 z-50 outline-none max-h-[96dvh] h-auto border-t border-border shadow-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}>
          
          {/* HEADER & CONTENU SCROLLABLE */}
          <div className="flex-1 overflow-y-auto p-5 pb-0">
            <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-6" />
            
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              
              {/* 1. SÉLECTEUR DE TYPE */}
              <div className="flex bg-muted p-1 rounded-2xl h-12 shrink-0">
                <button type="button" onClick={() => setValue('type', 'expense')} className={`flex-1 rounded-xl text-xs font-black uppercase transition-all ${type === 'expense' ? 'bg-background shadow-sm text-red-500' : 'text-muted-foreground'}`}>Dépense</button>
                <button type="button" onClick={() => setValue('type', 'income')} className={`flex-1 rounded-xl text-xs font-black uppercase transition-all ${type === 'income' ? 'bg-background shadow-sm text-emerald-500' : 'text-muted-foreground'}`}>Revenu</button>
              </div>

              {/* 2. AFFICHAGE DU MONTANT (Pas d'input) */}
              <div className="flex flex-col items-center justify-center py-2">
                 <div className="flex items-end">
                    <span className={`text-6xl font-black tracking-tighter ${!amountString ? 'opacity-20' : 'opacity-100'} ${type === 'income' ? 'text-emerald-500' : 'text-foreground'}`}>
                      {amountString || "0"}
                    </span>
                    <span className={`text-3xl font-black mb-2 ml-1 ${type === 'income' ? 'text-emerald-500/50' : 'text-muted-foreground/50'}`}>€</span>
                 </div>
                 {initialData?.id && <span className="text-[10px] font-bold uppercase text-blue-500 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded mt-2">Modification</span>}
              </div>

              {/* 3. CHAMPS TEXTE (Libellé & Date) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-2xl p-3 flex items-center gap-2 border border-transparent focus-within:border-blue-500 transition-colors">
                    <Type size={16} className="text-muted-foreground opacity-50" />
                    <input 
                        type="text" 
                        {...register('description', { required: true })} 
                        placeholder="Quoi ?" 
                        className="bg-transparent font-bold text-sm outline-none w-full placeholder:text-muted-foreground/50" 
                        autoComplete="off"
                    />
                </div>
                <div className="bg-muted rounded-2xl p-3 flex items-center gap-2">
                    <Calendar size={16} className="text-muted-foreground opacity-50" />
                    <input 
                        type="date" 
                        {...register('date', { required: true })} 
                        className="bg-transparent font-bold text-xs outline-none w-full text-muted-foreground uppercase" 
                    />
                </div>
              </div>

              {/* 4. OPTION RÉCURRENT */}
              <div className="flex items-center justify-between px-2">
                 <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">C'est récurrent ?</span>
                 <input type="checkbox" {...register('isFixed')} className="w-5 h-5 accent-blue-600 rounded" />
              </div>

              {/* 5. CATÉGORIES (Grille compacte) */}
              <div>
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 block px-2">Catégorie</span>
                <div className="grid grid-cols-4 gap-2">
                    {categories.map((cat: string) => (
                    <button 
                        key={cat} 
                        type="button" 
                        onClick={() => setValue('category', cat)} 
                        className={`py-2 rounded-xl text-[9px] font-black uppercase border truncate transition-all ${watch('category') === cat ? 'bg-foreground border-foreground text-background scale-105 shadow-lg' : 'border-muted text-muted-foreground hover:bg-muted'}`}
                    >
                        {cat.substring(0, 8)}
                    </button>
                    ))}
                </div>
              </div>

            </form>
          </div>

          {/* ZONE CLAVIER FIXE EN BAS */}
          <div className="p-5 pt-2 bg-background pb-8">
            <div className="grid grid-cols-4 gap-3">
                {/* Chiffres 1-9 */}
                {[1, 2, 3].map(n => <NumBtn key={n} val={n} onClick={handlePress} />)}
                <NumBtn val={4} onClick={handlePress} />
                <NumBtn val={5} onClick={handlePress} />
                <NumBtn val={6} onClick={handlePress} />
                
                {/* Bouton Supprimer (Rouge si suppression d'opération existante, sinon delete digit) */}
                <div className="row-span-2 flex flex-col gap-3">
                   <button onClick={handleDeleteDigit} className="flex-1 bg-muted rounded-2xl flex items-center justify-center active:scale-95 transition-all text-foreground"><Delete size={20}/></button>
                   {initialData?.id ? (
                     <button type="button" onClick={() => onDelete(initialData.id)} className="flex-1 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center active:scale-95 transition-all"><Trash2 size={20}/></button>
                   ) : (
                     <div className="flex-1" /> // Espace vide si pas d'édition
                   )}
                </div>

                <NumBtn val={7} onClick={handlePress} />
                <NumBtn val={8} onClick={handlePress} />
                <NumBtn val={9} onClick={handlePress} />

                <NumBtn val={'.'} onClick={handlePress} />
                <NumBtn val={0} onClick={handlePress} />
                
                {/* GROS BOUTON VALIDER (Vert) */}
                <button 
                    onClick={handleSubmit(onSubmit)} 
                    disabled={!amountString}
                    className={`rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90 ${!amountString ? 'bg-muted text-muted-foreground' : 'bg-blue-600 text-white shadow-blue-500/30'}`}
                >
                    <Check size={28} strokeWidth={3} />
                </button>
            </div>
          </div>

        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// Petit composant helper pour les boutons chiffres
function NumBtn({ val, onClick }: { val: number | string, onClick: (v: string) => void }) {
    return (
        <button 
            type="button"
            onClick={() => onClick(val.toString())}
            className="h-14 bg-muted/50 hover:bg-muted rounded-2xl font-black text-xl text-foreground flex items-center justify-center active:scale-95 transition-all"
        >
            {val}
        </button>
    )
}