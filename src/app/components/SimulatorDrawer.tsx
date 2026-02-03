import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { Target, AlertTriangle, ArrowRight, Delete, X } from 'lucide-react';

interface SimulatorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentForecast: number;
  alertThreshold: number;
}

export function SimulatorDrawer({ open, onOpenChange, currentForecast, alertThreshold }: SimulatorDrawerProps) {
  const [amountString, setAmountString] = useState('');

  // Reset à l'ouverture/fermeture
  useEffect(() => {
    if (!open) setAmountString('');
  }, [open]);

  const expense = parseFloat(amountString || "0");
  const newForecast = currentForecast - expense;
  const isDanger = newForecast < alertThreshold;
  const isNegative = newForecast < 0;

  // Gestion du pavé numérique
  const handlePress = (val: string) => {
    // Évite les multiples virgules
    if (val === '.' && amountString.includes('.')) return;
    // Limite la longueur pour pas casser l'affichage (ex: 7 chiffres max)
    if (amountString.length > 7) return;
    setAmountString(prev => prev + val);
  };

  const handleDelete = () => {
    setAmountString(prev => prev.slice(0, -1));
  };

  const getMessage = () => {
    if (!amountString) return "Combien ?";
    if (isNegative) return "Impossible !";
    if (isDanger) return "Attention...";
    return "C'est large !";
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
        <Drawer.Content className={`flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 z-50 outline-none transition-colors duration-500 h-auto max-h-[96vh] ${isDanger && amountString ? 'bg-red-950 text-red-100' : 'bg-background text-foreground'}`}>
          
          <div className="p-5 flex flex-col items-center pb-8">
            {/* Handle pour fermer */}
            <div className="w-12 h-1.5 rounded-full bg-muted/20 mb-4 shrink-0" />
            
            {/* Icône et Message */}
            <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-full transition-all duration-500 ${isDanger && amountString ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]'}`}>
                    {isDanger && amountString ? <AlertTriangle size={24} className="text-white animate-pulse" /> : <Target size={24} className="text-white" />}
                </div>
                <h2 className="font-black text-xl uppercase tracking-tight">{getMessage()}</h2>
            </div>

            {/* Affichage du Montant (Gros chiffres) */}
            <div className="relative mb-6">
                <span className={`text-6xl font-black transition-colors ${!amountString ? 'opacity-20' : ''}`}>
                    {amountString || "0"}
                </span>
                <span className="text-2xl font-black opacity-50 ml-1">€</span>
            </div>

            {/* Carte Résultat Compacte */}
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 backdrop-blur-md">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Prévu</span>
                    <div className="flex items-center gap-2">
                        <ArrowRight size={14} className="opacity-50"/>
                        <span className={`text-xl font-black ${isDanger ? 'text-red-400' : 'text-emerald-400'}`}>
                            {newForecast.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </span>
                    </div>
                </div>
            </div>

            {/* PAVÉ NUMÉRIQUE INTÉGRÉ */}
            <div className="w-full max-w-[320px] grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button 
                        key={num} 
                        onClick={() => handlePress(num.toString())}
                        className={`h-14 rounded-2xl font-black text-2xl active:scale-95 transition-all ${isDanger && amountString ? 'bg-red-900/40 hover:bg-red-900/60' : 'bg-muted hover:bg-muted/80'}`}
                    >
                        {num}
                    </button>
                ))}
                <button 
                    onClick={() => handlePress('.')}
                    className={`h-14 rounded-2xl font-black text-2xl active:scale-95 transition-all ${isDanger && amountString ? 'bg-red-900/40' : 'bg-muted'}`}
                >
                    .
                </button>
                <button 
                    onClick={() => handlePress('0')}
                    className={`h-14 rounded-2xl font-black text-2xl active:scale-95 transition-all ${isDanger && amountString ? 'bg-red-900/40' : 'bg-muted'}`}
                >
                    0
                </button>
                <button 
                    onClick={handleDelete}
                    className={`h-14 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${isDanger && amountString ? 'bg-red-900/40 text-red-200' : 'bg-muted text-foreground'}`}
                >
                    <Delete size={24} />
                </button>
            </div>

          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}