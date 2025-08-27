'use client';

import { useState, useEffect } from 'react';
import { Country, AreaCode, AvailableNumber, ForwardingConfig } from '@/lib/mock-data';
import { CountrySelector } from '@/components/numbers/CountrySelector';
import { AreaCodeSelector } from '@/components/numbers/AreaCodeSelector';
import { NumberDisplay } from '@/components/numbers/NumberDisplay';
import { ForwardingConfiguration } from '@/components/numbers/ForwardingConfiguration';
import { useCartStore } from '@/lib/cart';
import { ArrowLeft, Phone, Globe, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function NumbersPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [areaCodes, setAreaCodes] = useState<AreaCode[]>([]);
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedAreaCode, setSelectedAreaCode] = useState<AreaCode | null>(null);
  
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingAreaCodes, setLoadingAreaCodes] = useState(false);
  const [loadingNumbers, setLoadingNumbers] = useState(false);
  
  const [showForwarding, setShowForwarding] = useState(false);
  const [pendingNumber, setPendingNumber] = useState<{ number: AvailableNumber; addSms: boolean } | null>(null);
  const [forwardingConfig, setForwardingConfig] = useState<ForwardingConfig | undefined>();
  
  const { addItem } = useCartStore();

  // Load countries on mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Load area codes when country changes
  useEffect(() => {
    if (selectedCountry) {
      fetchAreaCodes(selectedCountry.id);
      setSelectedAreaCode(null);
      setAvailableNumbers([]);
    } else {
      setAreaCodes([]);
      setAvailableNumbers([]);
    }
  }, [selectedCountry]);

  // Load available numbers when area code changes
  useEffect(() => {
    if (selectedCountry && selectedAreaCode) {
      fetchAvailableNumbers(selectedCountry.id, selectedAreaCode.id);
    }
  }, [selectedCountry, selectedAreaCode]);

  const fetchCountries = async () => {
    try {
      setLoadingCountries(true);
      const response = await fetch('/api/numbers/countries');
      const data = await response.json();
      if (data.success) {
        setCountries(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    } finally {
      setLoadingCountries(false);
    }
  };

  const fetchAreaCodes = async (countryId: string) => {
    try {
      setLoadingAreaCodes(true);
      const response = await fetch(`/api/numbers/area-codes?countryId=${countryId}`);
      const data = await response.json();
      if (data.success) {
        setAreaCodes(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch area codes:', error);
    } finally {
      setLoadingAreaCodes(false);
    }
  };

  const fetchAvailableNumbers = async (countryId: string, areaCodeId: string) => {
    try {
      setLoadingNumbers(true);
      const response = await fetch(`/api/numbers/available?countryId=${countryId}&areaCodeId=${areaCodeId}`);
      const data = await response.json();
      if (data.success) {
        setAvailableNumbers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch available numbers:', error);
    } finally {
      setLoadingNumbers(false);
    }
  };

  const handleAddToCart = (number: AvailableNumber, addSms: boolean) => {
    // Store the pending number and show forwarding configuration
    setPendingNumber({ number, addSms });
    setShowForwarding(true);
  };

  const handleForwardingSave = (config: ForwardingConfig) => {
    if (pendingNumber && selectedCountry && selectedAreaCode) {
      // Map forwarding config to cart item format
      let forwardingType: 'none' | 'call' | 'sms' | 'both' = 'none';
      let forwardingDestination = config.value;
      let forwardingPrice = 0;
      
      // Set forwarding type and price based on config
      if (config.type === 'sms_email') {
        forwardingType = 'sms';
        forwardingPrice = 2.00; // $2/month for SMS forwarding
      } else if (config.type === 'phone_number') {
        forwardingType = 'call';
        forwardingPrice = 5.00; // $5/month for call forwarding
      } else if (config.type === 'sip_url') {
        forwardingType = 'call';
        forwardingPrice = 3.00; // $3/month for SIP forwarding
      }
      
      // Add to cart with proper CartItem structure
      addItem({
        id: pendingNumber.number.id,
        countryCode: selectedCountry.id,
        countryName: selectedCountry.name,
        areaCode: selectedAreaCode.code,
        cityName: selectedAreaCode.city,
        phoneNumber: pendingNumber.number.number,
        basePrice: pendingNumber.number.monthlyPrice,
        smsEnabled: pendingNumber.addSms && pendingNumber.number.smsEnabled,
        smsPrice: pendingNumber.number.smsMonthlyPrice || 0,
        forwardingType,
        forwardingDestination,
        forwardingPrice,
        monthlyDuration: 1, // Default to 1 month, can be changed in cart
      });
      
      setForwardingConfig(config);
      setShowForwarding(false);
      setPendingNumber(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </Link>
              <div className="flex items-center gap-2">
                <Phone className="h-6 w-6 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-900">Find Your Number</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Globe className="h-4 w-4" />
              <span>No documents required for listed countries</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Filters Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Select Location</h2>
              
              {loadingCountries ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading countries...</p>
                </div>
              ) : (
                <>
                  <CountrySelector
                    countries={countries}
                    selectedCountry={selectedCountry}
                    onCountrySelect={setSelectedCountry}
                  />
                  
                  <AreaCodeSelector
                    areaCodes={areaCodes}
                    selectedAreaCode={selectedAreaCode}
                    onAreaCodeSelect={setSelectedAreaCode}
                    disabled={!selectedCountry || loadingAreaCodes}
                  />
                </>
              )}
              
              {selectedCountry && selectedAreaCode && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Country:</span> {selectedCountry.name}</p>
                    <p><span className="font-medium">Area:</span> {selectedAreaCode.city}{selectedAreaCode.state ? `, ${selectedAreaCode.state}` : ''}</p>
                    <p><span className="font-medium">Prefix:</span> {selectedCountry.prefix} {selectedAreaCode.code}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Info Box */}
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Quick Setup</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Instant activation</li>
                <li>• No setup fees</li>
                <li>• Cancel anytime</li>
                <li>• Forward calls to any number</li>
                <li>• SMS support available</li>
              </ul>
            </div>
          </div>

          {/* Numbers Display Section */}
          <div className="lg:col-span-2">
            {!selectedCountry ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Phone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Country to Get Started
                </h3>
                <p className="text-gray-500">
                  Choose a country from the dropdown to see available phone numbers
                </p>
              </div>
            ) : !selectedAreaCode ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select an Area Code
                </h3>
                <p className="text-gray-500">
                  Choose an area code to see available numbers in that region
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <NumberDisplay
                  numbers={availableNumbers}
                  loading={loadingNumbers}
                  onAddToCart={handleAddToCart}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forwarding Configuration Modal */}
      <ForwardingConfiguration
        isOpen={showForwarding}
        onClose={() => {
          setShowForwarding(false);
          setPendingNumber(null);
        }}
        onSave={handleForwardingSave}
        currentConfig={forwardingConfig}
      />
    </div>
  );
}