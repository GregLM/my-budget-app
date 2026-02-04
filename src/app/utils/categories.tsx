// src/app/utils/categories.ts

export const CATEGORY_STYLES: Record<string, { color: string, bg: string, text: string }> = {
    'Emprunt':   { color: '#8b5cf6', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300' },
    'Alim.':     { color: '#3b82f6', bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-700 dark:text-blue-300' },
    'Abo. et Tel': { color: '#6366f1', bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300' },
    'Energie':   { color: '#f59e0b', bg: 'bg-amber-100 dark:bg-amber-900/30',   text: 'text-amber-700 dark:text-amber-300' },
    'Transport': { color: '#0ea5e9', bg: 'bg-sky-100 dark:bg-sky-900/30',       text: 'text-sky-700 dark:text-sky-300' },
    'Loisirs':   { color: '#ec4899', bg: 'bg-pink-100 dark:bg-pink-900/30',     text: 'text-pink-700 dark:text-pink-300' },
    'Epargne':   { color: '#10b981', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
    'Impots et taxes': { color: '#ef4444', bg: 'bg-red-100 dark:bg-red-900/30',     text: 'text-red-700 dark:text-red-300' },
    'Santé':     { color: '#f43f5e', bg: 'bg-rose-100 dark:bg-rose-900/30',     text: 'text-rose-700 dark:text-rose-300' },
    'Assurance': { color: '#64748b', bg: 'bg-slate-200 dark:bg-slate-800',      text: 'text-slate-700 dark:text-slate-300' },
    'Enfant':    { color: '#f97316', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
    'Revenus':   { color: '#22c55e', bg: 'bg-green-100 dark:bg-green-900/40',   text: 'text-green-700 dark:text-green-300' },
  };
  
  // Fallback pour les catégories inconnues (ex: "Divers")
  export const DEFAULT_STYLE = { color: '#94a3b8', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' };
  
  export const getCategoryStyle = (name: string) => {
      // Recherche partielle (ex: "Alimentation" trouvera "Alim.")
      const key = Object.keys(CATEGORY_STYLES).find(k => name.toLowerCase().includes(k.toLowerCase()));
      return key ? CATEGORY_STYLES[key] : DEFAULT_STYLE;
  };