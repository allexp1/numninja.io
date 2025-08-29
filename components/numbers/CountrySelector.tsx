'use client';

import { useState, useEffect } from 'react';
import { Country } from '@/lib/mock-data';
import { ChevronDown, Search } from 'lucide-react';

interface CountrySelectorProps {
  countries: Country[];
  selectedCountry: Country | null;
  onCountrySelect: (country: Country) => void;
}

export function CountrySelector({ countries, selectedCountry, onCountrySelect }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);

  useEffect(() => {
    const filtered = countries.filter(country =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCountries(filtered);
  }, [searchTerm, countries]);

  const handleCountrySelect = (country: Country) => {
    onCountrySelect(country);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Country
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {selectedCountry ? (
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedCountry.flag}</span>
            <span className="font-medium">{selectedCountry.name}</span>
            <span className="text-gray-500">({selectedCountry.prefix})</span>
          </div>
        ) : (
          <span className="text-gray-500">Choose a country</span>
        )}
        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search countries..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
          </div>

          <ul className="max-h-60 overflow-y-auto py-1">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <li key={country.id}>
                  <button
                    onClick={() => handleCountrySelect(country)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-indigo-50 transition-colors"
                  >
                    <span className="text-xl">{country.flag}</span>
                    <span className="font-medium">{country.name}</span>
                    <span className="text-gray-500 ml-auto">{country.prefix}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-gray-500 text-center">
                No countries found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}