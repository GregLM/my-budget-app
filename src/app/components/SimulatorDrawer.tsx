import React, { useState } from 'react';
import { Drawer } from 'vaul';
import { Target, AlertTriangle, PartyPopper, ArrowRight } from 'lucide-react';

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

  // Messages contextuels "Vibe"
  const getMessage = () => {
    if (!amount) return "Combien veux-tu dépenser ?";
    if (isNegative) return "Impossible, tu passes dans le rouge !";
    if (isDanger) return "Aïe, tu passes sous ton seuil de sécurité.";
    return "C'est large ! Fais-toi plaisir.";
  };

  return (
    <Drawer.Root open={open} onOpenChange={(o) => { onOpenChange(o); if(!o) setAmount(''); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
        <Drawer.Content className={`flex flex-col rounded-t-[40px] fixed bottom-0 left-0 right-0 z-50 h-[85dvh] outline-none transition-colors duration-500 ${isDanger && amount ? 'bg-red-950 text-red-100' : 'bg-background text-foreground'}`}>
          
          <div className="p-8 flex-1 flex flex-col items-center">
            <div className="w-12 h-1.5 rounded-full bg-muted/20 mb-10" />
            
            {/* Icône d'état animée */}
            <div className={`p-6 rounded-full mb-6 transition-all duration-500 ${isDanger && amount ? 'bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)]' : 'bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.4)]'}`}>
               {isDanger && amount ? <AlertTriangle size={40} className="text-white animate-pulse" /> : <Target size={40} className="text-white" />}
            </div>

            <h2 className="text-center font-black text-2xl uppercase mb-2 transition-all">{getMessage()}</h2>
            
            {/* Input Géant */}
            <div className="relative w-full max-w-[280px] my-8">
              <input 
                type="number" 
                inputMode="decimal"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                autoFocus
                className={`w-full bg-transparent text-center font-black text-7xl outline-none placeholder:opacity-20 transition-colors ${isDanger ? 'text-red-100 placeholder:text-red-100' : 'text-foreground placeholder:text-foreground'}`}
              />
              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-2xl font-black opacity-50">€</span>
            </div>

            {/* Carte de Résultat Avant / Après */}
            <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 backdrop-blur-md">
                <div className="flex justify-between items-center opacity-60">
                    <span className="text-[10px] font-black uppercase tracking-widest">Atterrissage Actuel</span>
                    <span className="font-bold line-through">{currentForecast.toFixed(2)} €</span>
                </div>
                
                <div className="h-px bg-white/10 w-full" />

                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest">Nouvel Atterrissage</span>
                    <div className="flex items-center gap-2">
                        <ArrowRight size={16} />
                        <span className={`text-2xl font-black ${isDanger ? 'text-red-400' : 'text-emerald-400'}`}>
                            {newForecast.toFixed(2)} €
                        </span>
                    </div>
                </div>
            </div>

            {/* Indicateur Seuil */}
            <p className="mt-6 text-[10px] uppercase font-bold opacity-40 tracking-widest text-center">
                Ton seuil de sécurité est fixé à {alertThreshold} €
            </p>

          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}