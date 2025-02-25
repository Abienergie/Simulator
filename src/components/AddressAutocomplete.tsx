import React, { useState, useEffect, useRef } from 'react';
import { getSuggestions } from '../utils/addressSuggestions';
import type { AddressFeature } from '../types/address';
import { Search } from 'lucide-react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (
    address: string, 
    postcode: string, 
    city: string, 
    coordinates: { lat: number; lon: number }
  ) => void;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressFeature[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSelected, setHasSelected] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!value || value.length < 3 || hasSelected) {
        setSuggestions([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const results = await getSuggestions(value);
        setSuggestions(results);
        setIsOpen(true);
      } catch (error) {
        setError('Impossible de récupérer les suggestions. Veuillez réessayer.');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(fetchSuggestions, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [value, hasSelected]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasSelected(false);
    setError(null);
    const newValue = e.target.value || '';
    onChange(newValue);
  };

  const handleSuggestionClick = (suggestion: AddressFeature) => {
    const { properties, geometry } = suggestion;
    const coordinates = {
      lat: geometry.coordinates[1],
      lon: geometry.coordinates[0]
    };
    
    const streetAddress = properties.housenumber 
      ? `${properties.housenumber} ${properties.street}`
      : properties.street;
    
    setHasSelected(true);
    onChange(streetAddress);
    onSelect(
      streetAddress,
      properties.postcode,
      properties.city,
      coordinates
    );
    setIsOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value || ''}
          onChange={handleInputChange}
          onFocus={() => !hasSelected && setIsOpen(true)}
          placeholder="Entrez votre adresse..."
          className={`w-full pl-10 pr-4 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.properties.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
            >
              <div className="flex items-center">
                <span className="font-normal block truncate">
                  {suggestion.properties.label}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}