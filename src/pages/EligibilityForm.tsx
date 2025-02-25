import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Upload, Plus, X, HelpCircle, 
  Clock, Ruler, FileText, Wrench, LineChart, Camera,
  CheckCircle2
} from 'lucide-react';
import { useClient } from '../contexts/client';

interface EnvironmentPhoto {
  id: string;
  file: File;
}

const INSTALLATION_STEPS = [
  {
    icon: Clock,
    title: "Réponse sous 48H",
    duration: "2 jours",
    description: "Étude initiale de votre dossier"
  },
  {
    icon: Ruler,
    title: "Étude technique", 
    duration: "15 jours",
    description: "Analyse détaillée et dimensionnement"
  },
  {
    icon: FileText,
    title: "Démarches",
    duration: "30 jours", 
    description: "Autorisations administratives"
  },
  {
    icon: Wrench,
    title: "Installation",
    duration: "45 jours",
    description: "Pose et mise en service"
  },
  {
    icon: LineChart,
    title: "Monitoring",
    duration: "Permanent",
    description: "Suivi de production et maintenance"
  }
];

const EligibilityForm = () => {
  const navigate = useNavigate();
  const { clientInfo } = useClient();
  const [pdl, setPdl] = useState('');
  const [taxFile, setTaxFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [environmentPhotos, setEnvironmentPhotos] = useState<EnvironmentPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handlePDLChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 14);
    setPdl(value);
  };

  const handleFileChange = (type: 'tax' | 'id') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Le fichier est trop volumineux. Taille maximum : 10MB');
        return;
      }
      if (type === 'tax') {
        setTaxFile(file);
      } else {
        setIdFile(file);
      }
      setError(null);
    }
  };

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError('Une photo est trop volumineuse. Taille maximum : 10MB');
        return false;
      }
      return true;
    });

    const newPhotos = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file
    }));

    setEnvironmentPhotos(prev => [...prev, ...newPhotos]);
    setError(null);
  };

  const handlePhotoRemove = (id: string) => {
    setEnvironmentPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const handleSubmit = () => {
    setShowSuccessModal(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link to="/projection" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour à la projection financière
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Vérification d'éligibilité
      </h2>

      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Étapes de votre installation
        </h3>
        <div className="relative flex justify-between">
          {INSTALLATION_STEPS.map((step, index) => (
            <div key={index} className="relative flex flex-col items-center w-32">
              {index < INSTALLATION_STEPS.length - 1 && (
                <div 
                  className="absolute w-full h-[2px] top-7 left-[50%] bg-blue-200"
                  style={{
                    width: 'calc(200% - 2rem)'
                  }}
                />
              )}
              <div className="relative z-10 flex items-center justify-center w-14 h-14 bg-white rounded-full border-2 border-blue-500">
                <step.icon className="h-6 w-6 text-blue-500" />
              </div>
              <div className="mt-3 text-center">
                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full mb-2">
                  {step.duration}
                </span>
                <div className="text-sm font-medium text-gray-900">{step.title}</div>
                <div className="text-xs text-gray-500 mt-1">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Numéro PDL (Point De Livraison)
            <div className="relative inline-block ml-2 group">
              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-sm rounded-lg py-2 px-3 w-72 bottom-full left-1/2 -translate-x-1/2 mb-2">
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                Le numéro PDL (Point De Livraison) est un identifiant unique de 14 chiffres qui se trouve sur votre facture d'électricité et sur votre compteur Linky.
              </div>
            </div>
          </label>
          <input
            type="text"
            value={pdl}
            onChange={handlePDLChange}
            placeholder="14 chiffres"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            maxLength={14}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Avis d'imposition
          </label>
          <div className={`relative flex items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors ${
            taxFile 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300 hover:border-blue-500 bg-gray-50'
          }`}>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange('tax')}
              id="tax-file"
            />
            <label htmlFor="tax-file" className="cursor-pointer text-center">
              {taxFile ? (
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  <span className="text-green-700">{taxFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-gray-600">Cliquez pour sélectionner votre avis d'imposition</span>
                </div>
              )}
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pièce d'identité
          </label>
          <div className={`relative flex items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors ${
            idFile 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300 hover:border-blue-500 bg-gray-50'
          }`}>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange('id')}
              id="id-file"
            />
            <label htmlFor="id-file" className="cursor-pointer text-center">
              {idFile ? (
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  <span className="text-green-700">{idFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-gray-600">Cliquez pour sélectionner votre pièce d'identité</span>
                </div>
              )}
            </label>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Photos de l'environnement
              <div className="relative inline-block ml-2 group">
                <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-sm rounded-lg py-2 px-3 w-80 bottom-full left-1/2 -translate-x-1/2 mb-2">
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  Nous avons besoin de photos de :
                  • Votre toit à équiper
                  • L'environnement proche (arbres, bâtiments)
                  • Les éventuels masques solaires (ombres portées)
                </div>
              </div>
            </label>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {environmentPhotos.map(photo => (
                <div 
                  key={photo.id}
                  className="relative bg-gray-50 p-3 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600 truncate">
                        {photo.file.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePhotoRemove(photo.id)}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoAdd}
                />
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  <Plus className="h-5 w-5 text-gray-600" />
                  <span className="text-sm text-gray-700">Ajouter des photos</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}

        <div className="flex justify-center mt-8">
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Valider mon dossier
          </button>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg mt-8">
          <h4 className="text-lg font-medium text-blue-900 mb-4">
            Besoin d'assistance ?
          </h4>
          <div className="text-blue-700 mb-4">
            Nos conseillers sont à votre disposition pour vous accompagner dans votre projet d'installation solaire.
          </div>
          <div className="space-y-2">
            <div className="text-blue-800">
              <span className="font-medium">Téléphone :</span>{' '}
              <span className="relative group">
                <a href="tel:0183835150" className="hover:underline">01 83 83 51 50</a>
                <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-sm rounded-lg py-2 px-3 w-64 bottom-full left-1/2 -translate-x-1/2 mb-2">
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  <div className="text-center">
                    Horaires d'ouverture :<br />
                    Du lundi au vendredi<br />
                    9H30 - 18H00
                  </div>
                </div>
              </span>
            </div>
            <div className="text-blue-800">
              <span className="font-medium">Email :</span>{' '}
              <a href="mailto:contact@abie.fr" className="hover:underline">contact@abie.fr</a>
            </div>
          </div>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full overflow-hidden shadow-xl">
            <div className="flex">
              <div className="w-1/2">
                <img
                  src="https://i.ibb.co/GQr7gmd/maison-panneaux-solaires-toit.jpg"
                  alt="Maison avec panneaux solaires"
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="w-1/2 p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Félicitations !
                </h3>
                <div className="text-gray-600 mb-4">
                  Bienvenue dans le monde de demain ! Vous venez de faire le premier pas vers une énergie plus propre et plus économique.
                </div>
                <div className="text-gray-600 mb-6">
                  Notre équipe va étudier votre dossier et vous recevrez votre contrat d'abonnement sous 48H.
                </div>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EligibilityForm;