import React, { useState, useEffect } from 'react';
import { ClientContext } from './ClientContext';
import { ClientInfo, Address } from '../../types/client';
import { saveClientData, loadClientData, clearClientData } from '../../utils/storage/clientStorage';

const defaultClientInfo: ClientInfo = {
  civilite: '',
  nom: '',
  prenom: '',
  telephone: '',
  email: ''
};

const defaultAddress: Address = {
  rue: '',
  codePostal: '',
  ville: '',
  pays: 'France',
  region: '',
  coordinates: undefined
};

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [clientInfo, setClientInfo] = useState<ClientInfo>(defaultClientInfo);
  const [address, setAddress] = useState<Address>(defaultAddress);

  // Load saved data on mount
  useEffect(() => {
    const savedData = loadClientData();
    if (savedData) {
      setClientInfo(savedData.clientInfo);
      setAddress(prev => ({
        ...defaultAddress,
        ...savedData.address
      }));
    }
  }, []);

  // Save data on changes
  useEffect(() => {
    saveClientData({ clientInfo, address });
  }, [clientInfo, address]);

  const updateClientInfo = (info: Partial<ClientInfo>) => {
    setClientInfo(prev => ({ ...prev, ...info }));
  };

  const updateAddress = (newAddress: Partial<Address>) => {
    setAddress(prev => ({ ...prev, ...newAddress }));
  };

  const resetClientInfo = () => {
    // Reset states to default values
    setClientInfo({ ...defaultClientInfo });
    setAddress({ ...defaultAddress });
    
    // Clear all storage data
    clearClientData();
  };

  return (
    <ClientContext.Provider value={{
      clientInfo,
      address,
      updateClientInfo,
      updateAddress,
      resetClientInfo
    }}>
      {children}
    </ClientContext.Provider>
  );
}