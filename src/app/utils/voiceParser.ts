export const parseVoiceTransaction = (text: string, categories: string[]) => {
  const lowerText = text.toLowerCase();
  
  let amount = '';
  let category = '';
  // Par défaut
  let type = 'expense'; 
  let isFixed = false;
  let date = new Date().toISOString().split('T')[0];

  // --- 1. DÉTECTION DU TYPE (Dépense vs Revenu) ---
  const incomeKeywords = ['revenu', 'rentrée', 'encaissement', 'salaire', 'virement reçu', 'gain', 'remboursement'];
  if (incomeKeywords.some(k => lowerText.includes(k))) {
    type = 'income';
    category = 'Revenus'; // Catégorie par défaut pour les revenus
  }

  // --- 2. DÉTECTION DE LA RÉCURRENCE ---
  const fixedKeywords = ['fixe', 'récurrent', 'abonnement', 'mensuel', 'tous les mois', 'loyer', 'facture'];
  if (fixedKeywords.some(k => lowerText.includes(k))) {
    isFixed = true;
  }

  // --- 3. DÉTECTION DU MONTANT ---
  const amountMatch = lowerText.match(/(\d+([.,]\d+)?)\s*(?:euros?|€)?\s*(\d+)?/);
  
  if (amountMatch) {
    let main = amountMatch[1].replace(',', '.');
    let cents = amountMatch[3];
    if (cents) amount = `${main}.${cents}`;
    else amount = main;
  }

  // --- 4. DÉTECTION DE LA DATE ---
  if (lowerText.includes('hier')) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    date = d.toISOString().split('T')[0];
  } else if (lowerText.includes('demain')) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    date = d.toISOString().split('T')[0];
  }

  // --- 5. DÉTECTION DE LA CATÉGORIE (Si ce n'est pas déjà défini comme Revenu) ---
  if (type === 'expense') {
      const foundCat = categories.find(cat => lowerText.includes(cat.toLowerCase()));
      if (foundCat) {
        category = foundCat;
      } else {
        // Mapping manuel enrichi
        if (lowerText.includes('mcdo') || lowerText.includes('burger') || lowerText.includes('courses') || lowerText.includes('lidl') || lowerText.includes('leclerc') || lowerText.includes('resto')) category = 'Alim.';
        else if (lowerText.includes('essence') || lowerText.includes('péage') || lowerText.includes('parking')) category = 'Transport';
        else if (lowerText.includes('edf') || lowerText.includes('électricité') || lowerText.includes('eau')) category = 'Energie';
        else if (lowerText.includes('internet') || lowerText.includes('téléphone') || lowerText.includes('box')) category = 'Abo. et Tel';
      }
  }

  // --- 6. NETTOYAGE DE LA DESCRIPTION ---
  // On enlève le montant, les mots clés techniques pour garder le "vrai" libellé
  let description = text
    .replace(amountMatch?.[0] || '', '')
    .replace(/euros?|€/gi, '')
    // On enlève certains mots de commande, mais on garde "Abonnement" ou "Salaire" car ça fait un bon titre
    .replace(/ajoute|crée|mets|une|un|dépense/gi, '') 
    .trim();
    
  // Nettoyage final des espaces multiples
  description = description.replace(/\s+/g, ' ').trim();
  description = description.charAt(0).toUpperCase() + description.slice(1);

  if (!description || description.length < 2) description = type === 'income' ? "Revenu divers" : "Dépense vocale";

  return { amount, category, description, date, type, isFixed };
};