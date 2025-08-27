'use client';

import { useState, useEffect } from 'react';
import { AreaCode } from '@/lib/mock-data';
import { ChevronDown, MapPin, Search } from 'lucide-react';

interface AreaCodeSelectorProps {
  areaCodes: AreaCode[];
  selectedAreaCode: AreaCode | null;
  onAreaCodeSelect: (areaCode: AreaCode) => void;
  disabled?: boolean;
}

export function AreaCodeSelector({ 
  areaCodes, 
  selectedAreaCode, 
  onAreaCodeSelect,
  disabled = false 
}: AreaCodeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAreaCodes, setFilteredAreaCodes] = useState<AreaCode[]>(areaCodes);

  useEffect(() => {
    const filtered = areaCodes.filter(areaCode =>
      areaCode.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      areaCode.code.includes(searchTerm) ||
      (areaCode.state && areaCode.state.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredAreaCodes(filtered);
  }, [searchTerm, areaCodes]);

  const handleAreaCodeSelect = (areaCode: AreaCode) => {
    onAreaCodeSelect(areaCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Area Code
      </label>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm 
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500'}`}
      >
        {selectedAreaCode ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="font-medium">
              {selectedAreaCode.city}{selectedAreaCode.state ? `, ${selectedAreaCode.state}` : ''}
            </span>
            <span className="text-gray-500">({selectedAreaCode.code})</span>
          </div>
        ) : (
          <span className="text-gray-500">
            {disabled ? 'Select a country first' : 'Choose an area code'}
          </span>
        )}
        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by city or area code..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
          </div>

          <ul className="max-h-60 overflow-y-auto py-1">
            {filteredAreaCodes.length > 0 ? (
              filteredAreaCodes.map((areaCode) => (
                <li key={areaCode.id}>
                  <button
                    onClick={() => handleAreaCodeSelect(areaCode)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-indigo-50 transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="font-medium flex-1">
                      {areaCode.city}{areaCode.state ? `, ${areaCode.state}` : ''}
                    </span>
                    <span className="text-gray-500 font-mono">{areaCode.code}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-gray-500 text-center">
                No area codes found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}