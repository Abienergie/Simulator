import type { AddressFeature } from '../types/address';

interface AddressResponse {
  type: string;
  version: string;
  features: AddressFeature[];
  attribution: string;
  licence: string;
  query: string;
  limit: number;
}

export async function getSuggestions(query: string): Promise<AddressFeature[]> {
  if (!query || query.length < 3) return [];

  try {
    const cleanQuery = query.trim();
    // Ajout d'un timeout plus long et gestion des erreurs améliorée
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes timeout

    const response = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(cleanQuery)}&limit=5&autocomplete=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Simulateur Solaire/1.0'
        }
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data: AddressResponse = await response.json();
    
    if (!Array.isArray(data.features)) {
      throw new Error('Format de réponse invalide');
    }

    // Filtrer pour ne garder que les résultats pertinents
    return data.features.filter(feature => 
      feature.properties.type === 'housenumber' || 
      feature.properties.type === 'street'
    );
  } catch (error) {
    // Gestion améliorée des erreurs
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('Timeout de la requête API adresse');
        return [];
      }
      console.error('Erreur API adresse:', error.message);
    } else {
      console.error('Erreur API adresse inconnue');
    }
    return []; // Retourner un tableau vide en cas d'erreur plutôt que de propager l'erreur
  }
}