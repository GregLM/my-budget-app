export const parseVoiceInput = (text: string, categories: string[]) => {
    const lower = text.toLowerCase();
    const result = {
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    };
  
    // 1. DÉTECTION DU MONTANT (Cherche "15.5" ou "15,5" ou "15 euros")
    // L'API vocale renvoie souvent "15,20 €" ou "15.20"
    const amountMatch = lower.match(/(\d+[.,]?\d*)\s?([€e]|euro|euros)?/);
    if (amountMatch) {
      result.amount = amountMatch[1].replace(',', '.');
    }
  
    // 2. DÉTECTION DE LA DATE
    const today = new Date();
    if (lower.includes('hier')) {
      today.setDate(today.getDate() - 1);
      result.date = today.toISOString().split('T')[0];
    } else if (lower.includes('demain')) {
      today.setDate(today.getDate() + 1);
      result.date = today.toISOString().split('T')[0];
    } else {
        // Détection simple "6 février"
        const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        const dateMatch = lower.match(/(\d{1,2})\s(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/);
        
        if (dateMatch) {
            const day = parseInt(dateMatch[1]);
            const monthIndex = months.indexOf(dateMatch[2]);
            const currentYear = today.getFullYear();
            // On crée la date (attention aux mois indexés à 0)
            const d = new Date(currentYear, monthIndex, day);
            // Si on est en décembre et qu'on dit "janvier", c'est probablement l'année prochaine (optionnel, restons simple pour l'instant)
            // On ajuste le fuseau horaire pour éviter les décalages
            const offset = d.getTimezoneOffset() * 60000; 
            result.date = new Date(d.getTime() - offset).toISOString().split('T')[0];
        }
    }
  
    // 3. DÉTECTION DE LA CATÉGORIE
    // On cherche si un des mots de tes catégories est dans la phrase
    // Ex: "Alimentation" ou "Alim" -> Match avec "Alim."
    const foundCat = categories.find(c => lower.includes(c.toLowerCase()) || lower.includes(c.toLowerCase().slice(0, 4)));
    if (foundCat) {
      result.category = foundCat;
    }
  
    // 4. NETTOYAGE POUR LE LIBELLÉ
    // On enlève le montant, la date (mots clés) et la catégorie pour ne garder que le reste
    let cleanDesc = lower
      .replace(amountMatch ? amountMatch[0] : '', '')
      .replace('hier', '')
      .replace('demain', '')
      .replace('euros', '')
      .replace('euro', '')
      .replace('€', '')
      .replace(foundCat?.toLowerCase() || '', '')
      // On enlève aussi les mots de liaison parasites
      .replace(/\s(en|dans|le|la|du|au)\s/g, ' ') 
      .replace(/\s+/g, ' ') // Supprime les doubles espaces
      .trim();
  
    // Capitalize première lettre
    result.description = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);
  
    return result;
  };