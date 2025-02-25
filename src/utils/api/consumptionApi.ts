import { ConsumptionData } from '../../types/consumption';

const STORAGE_KEY = 'enedis_consumption_data';

export async function saveConsumptionData(data: ConsumptionData[]) {
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

export async function getConsumptionData(prm: string, startDate: string, endDate: string) {
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