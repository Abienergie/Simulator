import React, { useState } from 'react';
import { Link as LinkIcon, Lock, Info, Search } from 'lucide-react';
import { useEnedisData } from '../hooks/useEnedisData';
import ConsumptionChart from '../components/ConsumptionChart';
import { enedisApi } from '../utils/api/enedisApi';

const AbieLink: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { consumptionData, resetData } = useEnedisData();

  const handleEnedisClick = () => {
    // Ouvrir dans un nouvel onglet
    window.open('https://mon-compte-particulier.enedis.fr/dataconnect/v1/oauth2/authorize?client_id=Y_LuB7HsQW3JWYudw7HRmN28FN8a&duration=P1Y&response_type=code&state=AbieLink1', '_blank');
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

          <div className="flex flex-col items-center gap-6 mt-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl w-full text-center">
              <h3 className="text-lg font-medium text-blue-900 mb-4">
                Nouvelle version bientôt disponible !
              </h3>
              <p className="text-blue-800 mb-4">
                Une nouvelle version d'Abie Link est en cours de développement. En attendant, vous pouvez continuer à utiliser l'ancienne version.
              </p>
              <a 
                href="https://fabulous-praline-ae9982.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <LinkIcon className="h-5 w-5" />
                Accéder à l'ancienne version
              </a>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-2xl w-full text-center">
              <h3 className="text-lg font-medium text-amber-900 mb-4">
                Nouvelle version
              </h3>
              <p className="text-amber-800 mb-4">
                La nouvelle version d'Abie Link sera bientôt disponible avec de nouvelles fonctionnalités.
              </p>
              <button
                onClick={handleEnedisClick}
                disabled
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed"
              >
                <Lock className="h-5 w-5" />
                Bientôt disponible
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbieLink;