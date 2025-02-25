import { ClientInfo, Address } from '../../types/client';

const STORAGE_KEY = 'solar_client_data';

interface StoredData {
  clientInfo: ClientInfo;
  address: Address;
}

export function saveClientData(data: StoredData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving client data:', error);
  }
}

export function loadClientData(): StoredData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading client data:', error);
    return null;
  }
}

export function clearClientData(): void {
  try {
    // Supprimer toutes les clés du localStorage
    localStorage.clear();

    // Réajouter les clés qui doivent être préservées (comme l'authentification)
    const authToken = sessionStorage.getItem('auth_token');
    if (authToken) {
      localStorage.setItem('auth_token', authToken);
    }
  } catch (error) {
    console.error('Error clearing client data:', error);
  }
}