export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
  isFixed: boolean; // Nouveau : pour savoir si c'est une charge fixe
  isCleared?: boolean; // Pour le pointage
}

export interface CategoryBudget {
  name: string;
  limit: number;
}