import { Transaction } from './types';
import { subDays } from 'date-fns';

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    amount: 2500,
    type: 'income',
    category: 'Salaire',
    description: 'Salaire mensuel',
    date: subDays(new Date(), 2).toISOString(),
  },
  {
    id: '2',
    amount: 850,
    type: 'expense',
    category: 'Logement',
    description: 'Loyer',
    date: subDays(new Date(), 5).toISOString(),
  },
  {
    id: '3',
    amount: 120,
    type: 'expense',
    category: 'Alimentation',
    description: 'Courses hebdo',
    date: subDays(new Date(), 1).toISOString(),
  },
  {
    id: '4',
    amount: 45,
    type: 'expense',
    category: 'Transport',
    description: 'Essence',
    date: subDays(new Date(), 3).toISOString(),
  },
  {
    id: '5',
    amount: 60,
    type: 'expense',
    category: 'Loisirs',
    description: 'Restaurant',
    date: subDays(new Date(), 0).toISOString(),
  },
    {
    id: '6',
    amount: 300,
    type: 'income',
    category: 'Freelance',
    description: 'Projet design',
    date: subDays(new Date(), 10).toISOString(),
  },
];
