import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Target, AlertTriangle } from 'lucide-react';

export function BalanceCard({ balance, forecast, income, expenses, backgroundImage, isAlert }: any) {
  return (
    <div className="relative overflow-hidden rounded-[40px] p-8 text-white shadow-2xl mb-8 min-h-[280px] flex flex-col justify-between">
      <div className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000" style={{ backgroundImage: `url(${backgroundImage})` }} />
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-blue-900/80 to-black/60 dark:from-black/90 dark:to-blue-950/80" />

      <div className="relative z-20">
        <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Solde Actuel</p>
        <h2 className="text-5xl font-black tracking-tighter mb-6">{balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</h2>
        
        <div className={`backdrop-blur-md rounded-3xl p-5 border flex justify-between items-center transition-all duration-500 ${
          isAlert ? 'bg-red-500/40 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-white/10 border-white/10'
        }`}>
          <div>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${isAlert ? 'text-white' : 'text-blue-200'}`}>
              Atterrissage prévu {isAlert && "⚠️"}
            </p>
            <p className="text-xl font-black">{forecast.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
          </div>
          <div className={`p-3 rounded-2xl ${isAlert ? 'bg-red-500 text-white animate-pulse' : 'bg-white/20'}`}>
            {isAlert ? <AlertTriangle size={20} /> : <Target size={20} />}
          </div>
        </div>
      </div>

      <div className="relative z-20 flex gap-3 mt-6">
        <div className="flex-1 bg-emerald-500/20 backdrop-blur-md rounded-[24px] p-4 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-1"><ArrowUpRight size={14} className="text-emerald-400" /><span className="text-[9px] font-black uppercase text-emerald-100">Revenus</span></div>
          <p className="font-black text-sm">+{income.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
        </div>
        <div className="flex-1 bg-rose-500/20 backdrop-blur-md rounded-[24px] p-4 border border-rose-500/20">
          <div className="flex items-center gap-2 mb-1"><ArrowDownLeft size={14} className="text-rose-400" /><span className="text-[9px] font-black uppercase text-rose-100">Dépenses</span></div>
          <p className="font-black text-sm">-{expenses.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
        </div>
      </div>
    </div>
  );
}