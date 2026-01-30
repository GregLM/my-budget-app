export type TransactionType = 'income' | 'expense' | 'other';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string; // ISO date string
}

export interface BudgetState {
  balance: number;
  forecastBalance: number;
  transactions: Transaction[];
}
