import React, { useState } from 'react';
import { Drawer } from 'vaul';
import { Target, AlertTriangle, ArrowRight } from 'lucide-react';

interface SimulatorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentForecast: number;
  alertThreshold: number;
}

export function SimulatorDrawer({ open, onOpenChange, currentForecast, alertThreshold }: SimulatorDrawerProps) {
  const [amount, setAmount] = useState('');

  const expense = parseFloat(amount.replace(',', '.') || "0");
  const newForecast = currentForecast - expense;
  const isDanger = newForecast < alertThreshold;
  const isNegative = newForecast < 0;

  const getMessage = () => {
    if (!amount) return "Combien ?"; // Texte raccourci pour gagner de la place
    if (isNegative) return "Impossible !";
    if (isDanger) return "Aïe, risqué...";
    return "C'est large !";
  };

  return (
    <Drawer.Root open={open} onOpenChange={(o) => { onOpenChange(o); if(!o) setAmount(''); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
        {/* Ajout de 'max-h-[96dvh]' pour éviter que ça ne sorte de l'écran */}
        <Drawer.Content className={`flex flex-col rounded-t-[40px] fixed bottom-0 left-0 right-0 z-50 max-h-[96dvh] h-auto outline-none transition-colors duration-500 ${isDanger && amount ? 'bg-red-950 text-red-100' : 'bg-background text-foreground'}`}>
          
          {/* Ajout de 'overflow-y-auto' pour permettre le scroll si le clavier mange l'écran */}
          <div className="p-6 flex-1 flex flex-col items-center overflow-y-auto">
            <div className="w-12 h-1.5 rounded-full bg-muted/20 mb-6 shrink-0" />
            
            <div className={`p-4 rounded-full mb-4 transition-all duration-500 shrink-0 ${isDanger && amount ? 'bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)]' : 'bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.4)]'}`}>
               {isDanger && amount ? <AlertTriangle size={32} className="text-white animate-pulse" /> : <Target size={32} className="text-white" />}
            </div>

            <h2 className="text-center font-black text-2xl uppercase mb-2 transition-all shrink-0">{getMessage()}</h2>
            
            {/* Input : autoFocus retiré et padding ajusté */}
            <div className="relative w-full max-w-[280px] my-4 shrink-0">
              <input 
                type="number" 
                inputMode="decimal"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                // autoFocus={true}  <-- RETIRÉ POUR ÉVITER LE SAUT CLAVIER
                className={`w-full bg-transparent text-center font-black text-7xl outline-none placeholder:opacity-20 transition-colors ${isDanger ? 'text-red-100 placeholder:text-red-100' : 'text-foreground placeholder:text-foreground'}`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-black opacity-50">€</span>
            </div>

            <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 space-y-3 backdrop-blur-md shrink-0">
                <div className="flex justify-between items-center opacity-60">
                    <span className="text-[10px] font-black uppercase tracking-widest">Actuel</span>
                    <span className="font-bold line-through">{currentForecast.toFixed(2)} €</span>
                </div>
                
                <div className="h-px bg-white/10 w-full" />

                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest">Prévu</span>
                    <div className="flex items-center gap-2">
                        <ArrowRight size={16} />
                        <span className={`text-2xl font-black ${isDanger ? 'text-red-400' : 'text-emerald-400'}`}>
                            {newForecast.toFixed(2)} €
                        </span>
                    </div>
                </div>
            </div>

            <p className="mt-6 mb-12 text-[10px] uppercase font-bold opacity-40 tracking-widest text-center shrink-0">
                Seuil sécurité : {alertThreshold} €
            </p>

          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}