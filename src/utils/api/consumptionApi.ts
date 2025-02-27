import { ConsumptionData } from '../../types/consumption';

const STORAGE_KEY = 'enedis_consumption_data';

export async function saveConsumptionData(data: ConsumptionData[]): Promise<ConsumptionData[]> {
  try {
    const existingData = getStoredData();
    const mergedData = mergeConsumptionData(existingData, data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedData));
    return mergedData;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des données:', error);
    throw error;
  }
}

export async function getConsumptionData(prm: string, startDate: string, endDate: string): Promise<ConsumptionData[]> {
  try {
    const data = getStoredData();
    return filterConsumptionData(data, prm, startDate, endDate);
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    throw error;
  }
}

function getStoredData(): ConsumptionData[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function mergeConsumptionData(existing: ConsumptionData[], newData: ConsumptionData[]): ConsumptionData[] {
  const dataMap = new Map(existing.map(item => [`${item.prm}-${item.date}`, item]));
  
  newData.forEach(item => {
    dataMap.set(`${item.prm}-${item.date}`, item);
  });

  return Array.from(dataMap.values());
}

function filterConsumptionData(
  data: ConsumptionData[],
  prm: string,
  startDate: string,
  endDate: string
): ConsumptionData[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return data.filter(item => {
    const date = new Date(item.date);
    return (
      item.prm === prm &&
      date >= start &&
      date <= end
    );
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Fonction pour générer des données de test si nécessaire
export function generateMockData(prm: string, days: number = 30): ConsumptionData[] {
  const data: ConsumptionData[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    // Générer des valeurs aléatoires réalistes
    const peakHours = Math.round((10 + Math.random() * 15) * 10) / 10; // Entre 10 et 25 kWh
    const offPeakHours = Math.round((5 + Math.random() * 10) * 10) / 10; // Entre 5 et 15 kWh
    
    data.push({
      prm,
      date: dateString,
      peakHours,
      offPeakHours
    });
  }
  
  return data;
}