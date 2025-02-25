import React, { useEffect } from 'react';
import { Address } from '../types';
import TextFormField from './TextFormField';
import AddressAutocomplete from './AddressAutocomplete';
import { getRegionFromPostalCode } from '../utils/regionMapping';

interface AddressFormProps {
  address: Address;
  onChange: (field: keyof Address, value: string | { lat: number; lon: number }) => void;
}

export default function AddressForm({ address, onChange }: AddressFormProps) {
  useEffect(() => {
    if (address.codePostal && !address.region) {
      const region = getRegionFromPostalCode(address.codePostal);
      if (region) {
        onChange('region', region);
      }
    }
  }, [address.codePostal, address.region, onChange]);

  const handleAddressSelect = (
    fullAddress: string, 
    postcode: string, 
    city: string, 
    coordinates: { lat: number; lon: number }
  ) => {
    // Reset all fields first
    onChange('rue', '');
    onChange('codePostal', '');
    onChange('ville', '');
    onChange('region', '');
    
    // Then set new values
    onChange('rue', fullAddress || '');
    onChange('codePostal', postcode || '');
    onChange('ville', city || '');
    onChange('coordinates', coordinates);
    
    // Set region based on postal code
    const region = getRegionFromPostalCode(postcode);
    if (region) {
      onChange('region', region);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Rechercher votre adresse
        </label>
        <AddressAutocomplete
          value={address.rue || ''}
          onChange={(value) => onChange('rue', value)}
          onSelect={handleAddressSelect}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <TextFormField
          label="Code postal"
          name="codePostal"
          value={address.codePostal || ''}
          onChange={(e) => onChange('codePostal', e.target.value)}
          placeholder="75001"
          disabled
        />
        
        <TextFormField
          label="Ville"
          name="ville"
          value={address.ville || ''}
          onChange={(e) => onChange('ville', e.target.value)}
          placeholder="Paris"
          disabled
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <TextFormField
          label="Région"
          name="region"
          value={address.region || ''}
          onChange={(e) => onChange('region', e.target.value)}
          disabled
        />

        <TextFormField
          label="Pays"
          name="pays"
          value={address.pays || 'France'}
          onChange={(e) => onChange('pays', e.target.value)}
          disabled
        />
      </div>
    </div>
  );
}