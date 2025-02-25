import { useState, useCallback } from 'react';
import { enedisApi } from '../utils/api/enedisApi';
import { saveConsumptionData, getConsumptionData } from '../utils/api/consumptionApi';
import type { ConsumptionData } from '../types/consumption';

export function useEnedisData() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consumptionData, setConsumptionData] = useState<ConsumptionData[] | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const testConnection = useCallback(async (prm: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const connected = await enedisApi.testConnection(prm);
      setIsConnected(connected);
      return connected;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du test de connexion';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchConsumptionData = useCallback(async (prm: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const connected = await testConnection(prm);
      if (!connected) {
        throw new Error('Impossible de se connecter au compteur');
      }

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const enedisData = await enedisApi.getConsumptionData(prm, startDate, endDate);
      
      const formattedData = enedisData.consumption.map(item => ({
        prm,
        date: item.date,
        peakHours: item.peakHours || 0,
        offPeakHours: item.offPeakHours || 0
      }));

      await saveConsumptionData(formattedData);
      const filteredData = await getConsumptionData(prm, startDate, endDate);
      setConsumptionData(filteredData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des données';
      setError(message);
      setConsumptionData(null);
    } finally {
      setIsLoading(false);
    }
  }, [testConnection]);

  const resetData = useCallback(() => {
    localStorage.removeItem('enedis_consumption_data');
    setConsumptionData(null);
    setIsConnected(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    consumptionData,
    isConnected,
    testConnection,
    fetchConsumptionData,
    resetData
  };
}

// Export the hook as both default and named export
export const useEnedisApi = useEnedisData;
export default useEnedisData;