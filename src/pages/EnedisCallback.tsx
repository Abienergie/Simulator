import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { enedisApi } from '../utils/api/enedisApi';

export default function EnedisCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Log l'URL complète pour déboguer
        console.log('URL de callback complète:', location.search);
        
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const state = params.get('state');
        const usagePointId = params.get('usage_point_id');

        // Log tous les paramètres reçus
        console.log('Paramètres reçus:', {
          code: code ? '***' + code.slice(-6) : null, // On masque la majorité du code pour la sécurité
          state,
          usagePointId
        });

        if (!code) {
          console.error('Code d\'autorisation manquant dans les paramètres');
          throw new Error('Code d\'autorisation manquant');
        }

        if (state !== 'AbieLink1') {
          console.error('État invalide reçu:', state);
          throw new Error('État invalide');
        }

        // Store the usage point ID
        if (usagePointId) {
          console.log('Sauvegarde du PDL:', usagePointId);
          localStorage.setItem('enedis_usage_point_id', usagePointId);
        }

        console.log('Échange du code contre un token...');
        await enedisApi.handleCallback(code);
        console.log('Échange du code réussi');
        
        // Redirect back to Abie Link with success
        console.log('Redirection vers Abie Link avec succès');
        navigate('/abie-link', { 
          state: { 
            success: true,
            pdl: usagePointId,
            message: 'Connexion à Enedis réussie'
          },
          replace: true
        });
      } catch (error) {
        console.error('Erreur détaillée lors de la connexion Enedis:', error);
        navigate('/abie-link', { 
          state: { 
            error: error instanceof Error ? error.message : 'Échec de la connexion à Enedis'
          },
          replace: true
        });
      }
    };

    if (location.search) {
      console.log('Démarrage du traitement du callback Enedis');
      handleCallback();
    } else {
      console.log('Aucun paramètre dans l\'URL, redirection vers Abie Link');
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