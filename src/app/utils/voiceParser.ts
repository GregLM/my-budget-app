export const parseVoiceTransaction = (text: string, categories: string[]) => {
  let cleanText = text.toLowerCase(); 
  
  let amount = '';
  let category = '';
  let type = 'expense'; 
  let isFixed = false;
  let dateObj = new Date(); 

  // --- 1. DÉTECTION DU MONTANT ---
  const amountMatch = cleanText.match(/(\d+([.,]\d+)?)\s*(?:euros?|€)/);
  if (amountMatch) {
    let main = amountMatch[1].replace(',', '.');
    amount = main;
    cleanText = cleanText.replace(amountMatch[0], ''); 
  }

  // --- 2. DÉTECTION DE LA DATE ---
  const months = {
    'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
    'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
  };

  const dateSpecificMatch = cleanText.match(/le\s+(\d{1,2})\s*(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)?/);

  if (dateSpecificMatch) {
    const day = parseInt(dateSpecificMatch[1]);
    const monthName = dateSpecificMatch[2];

    if (monthName && months[monthName as keyof typeof months] !== undefined) {
      dateObj.setMonth(months[monthName as keyof typeof months]);
      dateObj.setDate(day);
    } else {
      dateObj.setDate(day);
    }
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

  // --- 4. DÉTECTION DE LA CATÉGORIE ---
  const normalize = (str: string) => str.toLowerCase().replace(/\./g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // A. EXPLICITE
  const normalizedCats = categories.map(c => ({ original: c, normalized: normalize(c) })).sort((a, b) => b.normalized.length - a.normalized.length);

  for (const { original, normalized } of normalizedCats) {
    if (cleanText.includes(`catégorie ${normalized}`) || cleanText.includes(`dans ${normalized}`) || cleanText.includes(`en ${normalized}`)) {
      category = original;
      cleanText = cleanText.replace(new RegExp(`(dans la|en)?\\s*catégorie\\s*${normalized}`, 'gi'), '');
      cleanText = cleanText.replace(new RegExp(`(dans|en)\\s*${normalized}`, 'gi'), '');
      break;
    }
  }

  // B. IMPLICITE
  if (!category && type === 'expense') {
    if (cleanText.includes('mcdo') || cleanText.includes('burger') || cleanText.includes('courses') || cleanText.includes('leclerc') || cleanText.includes('carrefour') || cleanText.includes('lidl') || cleanText.includes('auchan') || cleanText.includes('intermarché')) {
        category = 'Alim.';
    }
    else if (cleanText.includes('essence') || cleanText.includes('péage') || cleanText.includes('parking') || cleanText.includes('carburant')) {
        category = 'Transport';
    }
    else if (cleanText.includes('edf') || cleanText.includes('électricité') || cleanText.includes('eau') || cleanText.includes('gaz')) {
        category = 'Energie';
    }
    else if (cleanText.includes('internet') || cleanText.includes('téléphone') || cleanText.includes('box') || cleanText.includes('forfait')) {
        category = 'Abo. et Tel';
    }
  }
  
  if (type === 'income' && !category) category = 'Revenus';

  // --- 5. NETTOYAGE FINAL DE LA DESCRIPTION ---
  // On supprime les verbes de commande ET les prépositions (de, à, chez...)
  // \b permet de ne matcher que les mots entiers (évite de casser "Demain" en supprimant "De")
  let description = cleanText
    .replace(/\b(ajoute|ajouter|crée|créer|mets|mettre|une|un|le|la|les|dépense|de|du|d'|à|a|au|aux|chez|pour|par)\b/gi, '')
    .replace(/\s+/g, ' ') // Réduit les espaces multiples
    .trim();

  description = description.charAt(0).toUpperCase() + description.slice(1);
  if (!description || description.length < 2) description = "Opération vocale";

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  return { amount, category, description, date: dateStr, type, isFixed };
};