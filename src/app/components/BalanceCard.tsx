import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { clsx } from 'clsx';

interface BalanceCardProps {
  balance: number;
  forecast: number;
  income: number;
  expenses: number;
  backgroundImage: string;
}

export function BalanceCard({ balance, forecast, income, expenses, backgroundImage }: BalanceCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl text-white shadow-xl mb-6">
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-0" />
      
      <div className="relative z-10 p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-white/80 text-sm font-medium mb-1">Solde Actuel</h2>
          <div className="text-4xl font-bold tracking-tight">
            {balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }).replace('EUR', '€')}
          </div>
        </div>

        <div className="flex items-center justify-between bg-white/10 rounded-2xl p-4 backdrop-blur-md">
           <div>
            <div className="text-white/70 text-xs mb-1">Atterrissage prévu</div>
            <div className="text-xl font-semibold">
              {forecast.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }).replace('EUR', '€')}
            </div>
           </div>
           <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
             <Wallet className="h-5 w-5 text-white" />
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-500/20 rounded-2xl p-3 flex items-center gap-3 border border-emerald-500/30">
            <div className="bg-emerald-500/20 p-2 rounded-full">
              <TrendingUp className="h-4 w-4 text-emerald-300" />
            </div>
            <div>
              <div className="text-xs text-emerald-100">Revenus</div>
              <div className="font-semibold text-emerald-50">+{income.toLocaleString('fr-FR')} €</div>
            </div>
          </div>
          <div className="bg-rose-500/20 rounded-2xl p-3 flex items-center gap-3 border border-rose-500/30">
            <div className="bg-rose-500/20 p-2 rounded-full">
              <TrendingDown className="h-4 w-4 text-rose-300" />
            </div>
            <div>
              <div className="text-xs text-rose-100">Dépenses</div>
              <div className="font-semibold text-rose-50">-{expenses.toLocaleString('fr-FR')} €</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
