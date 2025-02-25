import React, { useState } from 'react';
import { FileDown } from 'lucide-react';
import { generatePDF } from '../utils/pdfGenerator';
import { FinancialParameters, FinancialProjection } from '../types/financial';

interface DownloadReportButtonProps {
  params: FinancialParameters;
  projection: FinancialProjection;
  productionAnnuelle: number;
  clientInfo: {
    civilite: string;
    nom: string;
    prenom: string;
    adresse: string;
    codePostal: string;
    ville: string;
    telephone: string;
    email: string;
    pdl?: string;
  };
  installationParams: {
    typeCompteur: string;
    pdl?: string;
    consommationAnnuelle: number;
    puissanceCrete: number;
    nombreModules: number;
    inclinaison: number;
    orientation: number;
    pertes: number;
    masqueSolaire: number;
    microOnduleurs: boolean;
    bifacial: boolean;
    surfaceTotale: number;
  };
}

export default function DownloadReportButton({
  params,
  projection,
  productionAnnuelle,
  clientInfo,
  installationParams
}: DownloadReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      // S'assurer que le mode de financement est correctement défini
      const financialParams: FinancialParameters = {
        ...params,
        financingMode: params.financingMode || 'subscription', // valeur par défaut si non définie
        prixKwh: params.prixKwh || 0.25,
        tarifRevente: params.tarifRevente || 0.1269,
        autoconsommation: params.autoconsommation || 75,
        revalorisationEnergie: params.revalorisationEnergie || 7,
        indexationProduction: params.indexationProduction || 2,
        degradationPanneau: params.degradationPanneau || -0.2,
        dureeAbonnement: params.dureeAbonnement || 20,
        primeAutoconsommation: params.primeAutoconsommation || 0,
        remiseCommerciale: params.remiseCommerciale || 0
      };

      await generatePDF(
        financialParams,
        projection,
        productionAnnuelle,
        clientInfo,
        installationParams
      );
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
        isGenerating ? 'opacity-50 cursor-wait' : ''
      }`}
    >
      <FileDown className="h-5 w-5" />
      {isGenerating ? 'Génération...' : 'Télécharger le rapport'}
    </button>
  );
}