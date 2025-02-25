import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { enedisApi } from '../utils/api/enedisApi';

export default function EnedisCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const state = params.get('state');
        const usagePointId = params.get('usage_point_id');

        if (!code) {
          throw new Error('Code d\'autorisation manquant');
        }

        if (state !== 'AbieLink1') {
          throw new Error('État invalide');
        }

        // Store the usage point ID
        if (usagePointId) {
          localStorage.setItem('enedis_usage_point_id', usagePointId);
        }

        // Exchange code for token
        await enedisApi.handleCallback(code);
        
        // Redirect back to Abie Link with success
        navigate('/abie-link', { 
          state: { 
            success: true,
            pdl: usagePointId,
            message: 'Connexion à Enedis réussie'
          },
          replace: true
        });
      } catch (error) {
        console.error('Erreur lors de la connexion Enedis:', error);
        navigate('/abie-link', { 
          state: { 
            error: error instanceof Error ? error.message : 'Échec de la connexion à Enedis'
          },
          replace: true
        });
      }
    };

    if (location.search) {
      handleCallback();
    } else {
      navigate('/abie-link', { replace: true });
    }
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600 mb-2">Connexion à Enedis en cours...</p>
        <p className="text-sm text-gray-500">Veuillez patienter pendant que nous traitons votre demande</p>
      </div>
    </div>
  );
}