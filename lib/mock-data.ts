// Mock data for testing the number selection UI
// In production, this will be replaced with actual DIDWW API calls

export interface Country {
  id: string;
  name: string;
  prefix: string;
  flag: string; // emoji flag
  requiresDocuments: boolean;
}

export interface AreaCode {
  id: string;
  countryId: string;
  code: string;
  city: string;
  state?: string;
}

export interface AvailableNumber {
  id: string;
  number: string;
  countryId: string;
  areaCodeId: string;
  smsEnabled: boolean;
  voiceEnabled: boolean;
  monthlyPrice: number;
  setupFee: number;
  smsMonthlyPrice?: number;
  currency: string;
}

// Countries without document requirements
export const mockCountries: Country[] = [
  { id: 'us', name: 'United States', prefix: '+1', flag: '🇺🇸', requiresDocuments: false },
  { id: 'uk', name: 'United Kingdom', prefix: '+44', flag: '🇬🇧', requiresDocuments: false },
  { id: 'ca', name: 'Canada', prefix: '+1', flag: '🇨🇦', requiresDocuments: false },
  { id: 'au', name: 'Australia', prefix: '+61', flag: '🇦🇺', requiresDocuments: false },
  { id: 'de', name: 'Germany', prefix: '+49', flag: '🇩🇪', requiresDocuments: false },
  { id: 'fr', name: 'France', prefix: '+33', flag: '🇫🇷', requiresDocuments: false },
  { id: 'nl', name: 'Netherlands', prefix: '+31', flag: '🇳🇱', requiresDocuments: false },
  { id: 'se', name: 'Sweden', prefix: '+46', flag: '🇸🇪', requiresDocuments: false },
  { id: 'no', name: 'Norway', prefix: '+47', flag: '🇳🇴', requiresDocuments: false },
  { id: 'dk', name: 'Denmark', prefix: '+45', flag: '🇩🇰', requiresDocuments: false },
];

// Area codes with cities
export const mockAreaCodes: AreaCode[] = [
  // United States
  { id: 'us-212', countryId: 'us', code: '212', city: 'New York', state: 'NY' },
  { id: 'us-213', countryId: 'us', code: '213', city: 'Los Angeles', state: 'CA' },
  { id: 'us-312', countryId: 'us', code: '312', city: 'Chicago', state: 'IL' },
  { id: 'us-415', countryId: 'us', code: '415', city: 'San Francisco', state: 'CA' },
  { id: 'us-305', countryId: 'us', code: '305', city: 'Miami', state: 'FL' },
  { id: 'us-206', countryId: 'us', code: '206', city: 'Seattle', state: 'WA' },
  { id: 'us-617', countryId: 'us', code: '617', city: 'Boston', state: 'MA' },
  { id: 'us-512', countryId: 'us', code: '512', city: 'Austin', state: 'TX' },
  
  // United Kingdom
  { id: 'uk-20', countryId: 'uk', code: '20', city: 'London' },
  { id: 'uk-121', countryId: 'uk', code: '121', city: 'Birmingham' },
  { id: 'uk-161', countryId: 'uk', code: '161', city: 'Manchester' },
  { id: 'uk-131', countryId: 'uk', code: '131', city: 'Edinburgh' },
  { id: 'uk-141', countryId: 'uk', code: '141', city: 'Glasgow' },
  
  // Canada
  { id: 'ca-416', countryId: 'ca', code: '416', city: 'Toronto', state: 'ON' },
  { id: 'ca-514', countryId: 'ca', code: '514', city: 'Montreal', state: 'QC' },
  { id: 'ca-604', countryId: 'ca', code: '604', city: 'Vancouver', state: 'BC' },
  { id: 'ca-403', countryId: 'ca', code: '403', city: 'Calgary', state: 'AB' },
  { id: 'ca-613', countryId: 'ca', code: '613', city: 'Ottawa', state: 'ON' },
  
  // Australia
  { id: 'au-2', countryId: 'au', code: '2', city: 'Sydney' },
  { id: 'au-3', countryId: 'au', code: '3', city: 'Melbourne' },
  { id: 'au-7', countryId: 'au', code: '7', city: 'Brisbane' },
  { id: 'au-8', countryId: 'au', code: '8', city: 'Perth' },
  
  // Germany
  { id: 'de-30', countryId: 'de', code: '30', city: 'Berlin' },
  { id: 'de-89', countryId: 'de', code: '89', city: 'Munich' },
  { id: 'de-40', countryId: 'de', code: '40', city: 'Hamburg' },
  { id: 'de-69', countryId: 'de', code: '69', city: 'Frankfurt' },
  { id: 'de-221', countryId: 'de', code: '221', city: 'Cologne' },
  
  // France
  { id: 'fr-1', countryId: 'fr', code: '1', city: 'Paris' },
  { id: 'fr-4', countryId: 'fr', code: '4', city: 'Marseille' },
  { id: 'fr-4-lyon', countryId: 'fr', code: '4', city: 'Lyon' },
  { id: 'fr-5', countryId: 'fr', code: '5', city: 'Toulouse' },
  { id: 'fr-3', countryId: 'fr', code: '3', city: 'Nice' },
];

// Generate mock available numbers
function generateMockNumbers(countryId: string, areaCodeId: string, count: number = 5): AvailableNumber[] {
  const country = mockCountries.find(c => c.id === countryId);
  const areaCode = mockAreaCodes.find(ac => ac.id === areaCodeId);
  
  if (!country || !areaCode) return [];
  
  const numbers: AvailableNumber[] = [];
  const basePrice = getBasePrice(countryId);
  
  for (let i = 0; i < count; i++) {
    const lastDigits = Math.floor(Math.random() * 9000 + 1000);
    const middleDigits = Math.floor(Math.random() * 900 + 100);
    
    numbers.push({
      id: `${areaCodeId}-${i}`,
      number: `${country.prefix} ${areaCode.code} ${middleDigits} ${lastDigits}`,
      countryId,
      areaCodeId,
      smsEnabled: Math.random() > 0.3, // 70% chance of SMS support
      voiceEnabled: true,
      monthlyPrice: basePrice,
      setupFee: 0,
      smsMonthlyPrice: 2.00,
      currency: 'USD',
    });
  }
  
  return numbers;
}

function getBasePrice(countryId: string): number {
  const prices: { [key: string]: number } = {
    'us': 3.00,
    'uk': 2.50,
    'ca': 3.50,
    'au': 4.00,
    'de': 2.00,
    'fr': 2.00,
    'nl': 2.00,
    'se': 2.50,
    'no': 3.00,
    'dk': 2.50,
  };
  
  return prices[countryId] || 3.00;
}

// Export function to get available numbers for a specific country and area code
export function getMockAvailableNumbers(countryId: string, areaCodeId?: string): AvailableNumber[] {
  if (areaCodeId) {
    return generateMockNumbers(countryId, areaCodeId, 8);
  }
  
  // If no area code specified, return numbers from the first area code of that country
  const firstAreaCode = mockAreaCodes.find(ac => ac.countryId === countryId);
  if (firstAreaCode) {
    return generateMockNumbers(countryId, firstAreaCode.id, 5);
  }
  
  return [];
}

// Export function to get area codes for a specific country
export function getMockAreaCodes(countryId: string): AreaCode[] {
  return mockAreaCodes.filter(ac => ac.countryId === countryId);
}

// Export function to get countries without document requirements
export function getMockCountries(): Country[] {
  return mockCountries.filter(c => !c.requiresDocuments);
}

// Forwarding configuration types
export type ForwardingType = 'sms_email' | 'sip_url' | 'phone_number';

export interface ForwardingConfig {
  type: ForwardingType;
  value: string;
}

// Cart item with forwarding configuration
export interface NumberCartItem {
  number: AvailableNumber;
  forwarding?: ForwardingConfig;
  addSms: boolean;
}