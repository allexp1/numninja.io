'use client';

import { useState } from 'react';
import { ForwardingType, ForwardingConfig } from '@/lib/mock-data';
import { Mail, Phone, Globe, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ForwardingConfigurationProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ForwardingConfig) => void;
  currentConfig?: ForwardingConfig;
}

export function ForwardingConfiguration({ 
  isOpen, 
  onClose, 
  onSave,
  currentConfig 
}: ForwardingConfigurationProps) {
  const [forwardingType, setForwardingType] = useState<ForwardingType>(
    currentConfig?.type || 'sms_email'
  );
  const [forwardingValue, setForwardingValue] = useState(currentConfig?.value || '');
  const [errors, setErrors] = useState<string>('');

  if (!isOpen) return null;

  const validateAndSave = () => {
    setErrors('');
    
    // Validation based on type
    if (!forwardingValue.trim()) {
      setErrors('Please enter a forwarding destination');
      return;
    }

    if (forwardingType === 'sms_email') {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(forwardingValue)) {
        setErrors('Please enter a valid email address');
        return;
      }
    } else if (forwardingType === 'phone_number') {
      // Basic phone validation (just check if it starts with + and has digits)
      const phoneRegex = /^\+[0-9]{10,15}$/;
      if (!phoneRegex.test(forwardingValue.replace(/\s/g, ''))) {
        setErrors('Please enter a valid international phone number (e.g., +1234567890)');
        return;
      }
    } else if (forwardingType === 'sip_url') {
      // Basic SIP URL validation
      if (!forwardingValue.startsWith('sip:')) {
        setErrors('SIP URL must start with "sip:"');
        return;
      }
    }

    onSave({
      type: forwardingType,
      value: forwardingValue.trim()
    });
  };

  const getPlaceholder = () => {
    switch (forwardingType) {
      case 'sms_email':
        return 'your@email.com';
      case 'phone_number':
        return '+1234567890';
      case 'sip_url':
        return 'sip:user@domain.com';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Configure Call Forwarding
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forwarding Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setForwardingType('sms_email')}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                  forwardingType === 'sms_email'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Mail className="h-5 w-5" />
                <span className="text-xs">Email</span>
              </button>
              <button
                onClick={() => setForwardingType('phone_number')}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                  forwardingType === 'phone_number'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Phone className="h-5 w-5" />
                <span className="text-xs">Phone</span>
              </button>
              <button
                onClick={() => setForwardingType('sip_url')}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                  forwardingType === 'sip_url'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Globe className="h-5 w-5" />
                <span className="text-xs">SIP</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {forwardingType === 'sms_email' && 'Email Address'}
              {forwardingType === 'phone_number' && 'Phone Number'}
              {forwardingType === 'sip_url' && 'SIP URL'}
            </label>
            <input
              type="text"
              value={forwardingValue}
              onChange={(e) => {
                setForwardingValue(e.target.value);
                setErrors('');
              }}
              placeholder={getPlaceholder()}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors && (
              <p className="mt-1 text-sm text-red-600">{errors}</p>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              {forwardingType === 'sms_email' && (
                <>SMS messages will be forwarded to your email address.</>
              )}
              {forwardingType === 'phone_number' && (
                <>Calls will be forwarded to the specified phone number.</>
              )}
              {forwardingType === 'sip_url' && (
                <>Calls will be routed to your SIP endpoint.</>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={validateAndSave}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}