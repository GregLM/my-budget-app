export const parseVoiceTransaction = (text: string, categories: string[]) => {
  let cleanText = text.toLowerCase(); // On travaille sur une copie qu'on va "nettoyer" au fur et à mesure
  
  let amount = '';
  let category = '';
  let type = 'expense'; 
  let isFixed = false;
  let dateObj = new Date(); // Par défaut aujourd'hui

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

  // --- 4. DÉTECTION DE LA CATÉGORIE (Correction "Alim" vs "Alim.") ---
  
  // Fonction pour "normaliser" un texte (enlever points, accents, etc pour la comparaison)
  const normalize = (str: string) => str.toLowerCase().replace(/\./g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // A. RECHERCHE EXPLICITE
  // On prépare une liste d'objets { original, normalized } triée par longueur
  const normalizedCats = categories.map(c => ({
    original: c,
    normalized: normalize(c)
  })).sort((a, b) => b.normalized.length - a.normalized.length);

  for (const { original, normalized } of normalizedCats) {
    // On cherche le nom normalisé (ex: "alim") dans le texte
    // Regex pour "catégorie alim", "dans alim", "en alim"
    const regex = new RegExp(`(dans la|en|catégorie)?\\s*(catégorie|dans|en)\\s*${normalized}`, 'i');
    
    // On vérifie si ça matche (en ignorant aussi les accents/points du texte parlé grâce à la regex permissive ou une double normalisation si besoin)
    // Ici on fait simple : on regarde si le mot clé normalisé est présent après un déclencheur
    if (cleanText.includes(`catégorie ${normalized}`) || cleanText.includes(`dans ${normalized}`) || cleanText.includes(`en ${normalized}`)) {
      category = original;
      
      // Nettoyage : On enlève la partie trouvée
      // On utilise le 'normalized' pour le pattern de suppression car c'est ce que l'utilisateur a dit (à peu près)
      cleanText = cleanText.replace(new RegExp(`(dans la|en)?\\s*catégorie\\s*${normalized}`, 'gi'), '');
      cleanText = cleanText.replace(new RegExp(`(dans|en)\\s*${normalized}`, 'gi'), '');
      break;
    }
  }

  // B. RECHERCHE IMPLICITE (Fallback)
  if (!category && type === 'expense') {
    if (cleanText.includes('mcdo') || cleanText.includes('burger') || cleanText.includes('courses') || cleanText.includes('leclerc')) || cleanText.includes('carrefour')) category = 'Alim.';
    else if (cleanText.includes('essence') || (cleanText.includes('carburant') || cleanText.includes('péage')) category = 'Transport';
    else if (cleanText.includes('edf') || cleanText.includes('électricité')) category = 'Energie';
    else if (cleanText.includes('internet') || cleanText.includes('téléphone') || cleanText.includes('box')) category = 'Abo. et Tel';
  }
  
  if (type === 'income' && !category) category = 'Revenus';

  // --- 5. NETTOYAGE FINAL DE LA DESCRIPTION ---
  let description = cleanText
    .replace(/ajoute|crée|mets|une|un|dépense/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  description = description.charAt(0).toUpperCase() + description.slice(1);
  if (!description || description.length < 2) description = "Opération vocale";

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  return { amount, category, description, date: dateStr, type, isFixed };
};