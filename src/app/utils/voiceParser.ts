export const parseVoiceTransaction = (text: string, categories: string[]) => {
  let cleanText = text.toLowerCase(); // On travaille sur une copie qu'on va "nettoyer" au fur et à mesure
  
  let amount = '';
  let category = '';
  let type = 'expense'; 
  let isFixed = false;
  let dateObj = new Date(); // Par défaut aujourd'hui

  // --- 1. DÉTECTION DU MONTANT ---
  // On l'extrait tout de suite pour ne pas qu'il interfère avec les dates (ex: "le 10" vs "10 euros")
  const amountMatch = cleanText.match(/(\d+([.,]\d+)?)\s*(?:euros?|€)/);
  if (amountMatch) {
    let main = amountMatch[1].replace(',', '.');
    amount = main;
    // On retire le montant du texte pour ne pas le confondre avec un jour du mois
    cleanText = cleanText.replace(amountMatch[0], ''); 
  }

  // --- 2. DÉTECTION DE LA DATE (La partie complexe) ---
  const months = {
    'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
    'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
  };

  // Regex pour "le 12 février" ou "le 12"
  const dateSpecificMatch = cleanText.match(/le\s+(\d{1,2})\s*(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)?/);

  if (dateSpecificMatch) {
    const day = parseInt(dateSpecificMatch[1]);
    const monthName = dateSpecificMatch[2];

    if (monthName && months[monthName as keyof typeof months] !== undefined) {
      // Cas "le 12 février"
      dateObj.setMonth(months[monthName as keyof typeof months]);
      dateObj.setDate(day);
    } else {
      // Cas "le 12" (mois en cours)
      dateObj.setDate(day);
      // Si on est le 25 et qu'on dit "le 2", c'est probablement le mois prochain ? 
      // Pour l'instant on reste simple : c'est le 2 du mois courant.
    }
    // On retire la date du texte
    cleanText = cleanText.replace(dateSpecificMatch[0], '');
  } 
  else if (cleanText.includes('hier')) {
    dateObj.setDate(dateObj.getDate() - 1);
    cleanText = cleanText.replace('hier', '');
  } 
  else if (cleanText.includes('demain')) {
    dateObj.setDate(dateObj.getDate() + 1);
    cleanText = cleanText.replace('demain', '');
  }

  // --- 3. DÉTECTION DU TYPE & RÉCURRENCE ---
  if (['revenu', 'salaire', 'encaissement'].some(k => cleanText.includes(k))) type = 'income';
  if (['fixe', 'abonnement', 'mensuel', 'loyer'].some(k => cleanText.includes(k))) isFixed = true;

  // --- 4. DÉTECTION DE LA CATÉGORIE (Explicite VS Implicite) ---
  
  // A. RECHERCHE EXPLICITE ("Dans la catégorie X", "En X")
  // On trie les catégories par longueur pour matcher "Alimentation" avant "Alim" si les deux existent
  const sortedCats = [...categories].sort((a, b) => b.length - a.length);
  
  for (const cat of sortedCats) {
    const catLower = cat.toLowerCase();
    // On cherche "catégorie [Nom]" ou "dans [Nom]"
    if (cleanText.includes(`catégorie ${catLower}`) || cleanText.includes(`dans ${catLower}`) || cleanText.includes(`en ${catLower}`)) {
      category = cat;
      // On nettoie pour ne pas garder "catégorie alimentation" dans le titre
      cleanText = cleanText.replace(new RegExp(`(dans la|en)?\\s*catégorie\\s*${catLower}`, 'gi'), '');
      cleanText = cleanText.replace(new RegExp(`(dans|en)\\s*${catLower}`, 'gi'), '');
      break; // On a trouvé, on arrête
    }
  }

  // B. RECHERCHE IMPLICITE (Si pas trouvé en explicite)
  if (!category && type === 'expense') {
    // Mapping manuel de secours
    if (cleanText.includes('mcdo') || cleanText.includes('burger') || cleanText.includes('courses') || cleanText.includes('leclerc')) category = 'Alim.';
    else if (cleanText.includes('essence') || cleanText.includes('péage')) category = 'Transport';
    else if (cleanText.includes('edf')) category = 'Energie';
    else if (cleanText.includes('loyer')) category = 'Loyer'; // Exemple
  }
  
  // Si revenu, catégorie par défaut
  if (type === 'income' && !category) category = 'Revenus';

  // --- 5. NETTOYAGE FINAL DE LA DESCRIPTION ---
  let description = cleanText
    .replace(/ajoute|crée|mets|une|un|dépense/gi, '') // Verbes de commande
    .replace(/\s+/g, ' ') // Espaces doubles
    .trim();

  // Majuscule
  description = description.charAt(0).toUpperCase() + description.slice(1);
  if (!description || description.length < 2) description = "Opération vocale";

  // Formatage final de la date YYYY-MM-DD
  // Attention au décalage horaire UTC, on force le local
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  return { amount, category, description, date: dateStr, type, isFixed };
};