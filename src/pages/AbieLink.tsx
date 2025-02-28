import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Lock, Info, Search, ExternalLink, Zap } from 'lucide-react';
import { useEnedisData } from '../hooks/useEnedisData';
import ConsumptionChart from '../components/ConsumptionChart';
import { useLocation } from 'react-router-dom';
import { generateMockData } from '../utils/api/consumptionApi';

const AbieLink: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [pdl, setPdl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const location = useLocation();
  const { consumptionData, isConnected, fetchConsumptionData, resetData, testConnection } = useEnedisData();

  useEffect(() => {
    // Récupérer le PDL du localStorage s'il existe
    const savedPdl = localStorage.getItem('enedis_usage_point_id');
    if (savedPdl) {
      setPdl(savedPdl);
      testConnection(savedPdl).then(connected => {
        if (connected) {
          setSuccess('Votre compteur Linky est connecté');
        }
      });
    }

    // Vérifier les paramètres d'URL pour les messages de succès/erreur
    if (location.state) {
      if (location.state.success) {
        setSuccess(location.state.message || 'Connexion réussie');
        if (location.state.pdl) {
          setPdl(location.state.pdl);
          localStorage.setItem('enedis_usage_point_id', location.state.pdl);
        }
      } else if (location.state.error) {
        setError(location.state.error);
      }
    }
  }, [location, testConnection]);

  const handleEnedisClick = () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Générer l'URL d'authentification Enedis avec les variables d'environnement
      const clientId = import.meta.env.VITE_ENEDIS_CLIENT_ID || 'Y_LuB7HsQW3JWYudw7HRmN28FN8a';
      const redirectUri = import.meta.env.VITE_ENEDIS_REDIRECT_URI || 'https://abienergie.github.io/Simulator/#/oauth/callback';
      
      const authUrl = `https://mon-compte-particulier.enedis.fr/dataconnect/v1/oauth2/authorize?client_id=${clientId}&duration=P1Y&response_type=code&state=AbieLink1&redirect_uri=${encodeURIComponent(redirectUri)}`;
      
      // Ouvrir dans un nouvel onglet
      window.open(authUrl, '_blank');
      
      setSuccess('Redirection vers Enedis en cours...');
    } catch (err) {
      setError('Erreur lors de la connexion à Enedis');
      console.error('Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchData = async () => {
    if (!pdl) {
      setError('Veuillez entrer un numéro PDL valide');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      
      // En production, utiliser l'API réelle
      await fetchConsumptionData(pdl);
      setSuccess('Données récupérées avec succès');
    } catch (err) {
      console.error('Erreur lors de la récupération des données:', err);
      
      // En cas d'erreur, générer des données de test
      setError('Impossible de récupérer les données réelles. Utilisation de données simulées pour démonstration.');
      
      // Générer et sauvegarder des données de test
      const mockData = generateMockData(pdl);
      await saveConsumptionData(mockData);
      
      // Recharger la page après un court délai
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Accepter uniquement les chiffres et limiter à 14 caractères
    const value = e.target.value.replace(/\D/g, '').slice(0, 14);
    setPdl(value);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center gap-3 text-white mb-4">
          <LinkIcon className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Abie Link</h1>
        </div>
        <p className="text-blue-100">
          Connectez votre compteur Linky pour suivre votre consommation d'énergie en temps réel
          et optimiser votre installation solaire.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {consumptionData ? (
        <ConsumptionChart data={consumptionData} onReset={resetData} />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Search className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium text-gray-900">Suivi en temps réel</h3>
              </div>
              <p className="text-sm text-gray-600">
                Visualisez votre consommation d'énergie au jour le jour
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-5 w-5 text-green-500" />
                <h3 className="font-medium text-gray-900">Sécurisé</h3>
              </div>
              <p className="text-sm text-gray-600">
                Vos données sont protégées et confidentielles
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-purple-500" />
                <h3 className="font-medium text-gray-900">Optimisation</h3>
              </div>
              <p className="text-sm text-gray-600">
                Optimisez votre installation solaire selon vos besoins
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Connecter mon compteur Linky
            </h2>

            <div className="space-y-6">
              <div>
                <label htmlFor="pdl" className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro PDL (Point De Livraison)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="text"
                    id="pdl"
                    value={pdl}
                    onChange={handlePdlChange}
                    className="block w-full pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                    placeholder="14 chiffres"
                    maxLength={14}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Zap className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Vous trouverez ce numéro sur votre facture d'électricité ou sur votre compteur Linky
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleEnedisClick}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Se connecter à Enedis
                </button>

                <button
                  onClick={handleFetchData}
                  disabled={isLoading || !pdl}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Récupérer mes données
                </button>
              </div>

              {isLoading && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Fonction pour sauvegarder les données de consommation
async function saveConsumptionData(data: any[]) {
  try {
    localStorage.setItem('enedis_consumption_data', JSON.stringify(data));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des données:', error);
  }
}

export default AbieLink;