'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Mail, 
  Save, 
  X, 
  PhoneForwarded,
  Voicemail,
  MessageSquare,
  Info,
  Settings,
  Clock
} from 'lucide-react';

export interface ForwardingConfig {
  forwardingType: 'mobile' | 'landline' | 'voip' | 'none';
  forwardingNumber?: string;
  voicemailEnabled: boolean;
  voicemailEmail?: string;
  callRecordingEnabled: boolean;
  smsForwardingEmail?: string;
  businessHoursEnabled?: boolean;
  businessHoursStart?: string;
  businessHoursEnd?: string;
  businessHoursTimezone?: string;
  weekendHandling?: 'forward' | 'voicemail' | 'reject';
}

interface ForwardingEditorProps {
  config: ForwardingConfig;
  onSave: (config: ForwardingConfig) => Promise<void>;
  onCancel: () => void;
  smsEnabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function ForwardingEditor({
  config: initialConfig,
  onSave,
  onCancel,
  smsEnabled = false,
  isLoading = false,
  className = ''
}: ForwardingEditorProps) {
  const [config, setConfig] = useState<ForwardingConfig>(initialConfig);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const validateConfig = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (config.forwardingType !== 'none' && !config.forwardingNumber) {
      newErrors.forwardingNumber = 'Forwarding number is required';
    }

    if (config.forwardingType === 'voip' && config.forwardingNumber) {
      // Validate SIP URI format
      const sipRegex = /^sip:[^@]+@[^:]+(?::\d+)?$/;
      if (!sipRegex.test(config.forwardingNumber)) {
        newErrors.forwardingNumber = 'Invalid SIP URI format (e.g., sip:user@domain.com)';
      }
    }

    if (config.forwardingType !== 'voip' && config.forwardingNumber) {
      // Validate phone number format
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(config.forwardingNumber.replace(/[\s()-]/g, ''))) {
        newErrors.forwardingNumber = 'Invalid phone number format';
      }
    }

    if (config.voicemailEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(config.voicemailEmail)) {
        newErrors.voicemailEmail = 'Invalid email format';
      }
    }

    if (smsEnabled && config.smsForwardingEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(config.smsForwardingEmail)) {
        newErrors.smsForwardingEmail = 'Invalid email format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateConfig()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(config);
    } catch (error) {
      console.error('Error saving configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters except +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // Format US numbers
    if (cleaned.startsWith('+1') && cleaned.length <= 12) {
      const number = cleaned.substring(2);
      if (number.length <= 3) {
        return `+1 ${number}`;
      } else if (number.length <= 6) {
        return `+1 (${number.slice(0, 3)}) ${number.slice(3)}`;
      } else {
        return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6, 10)}`;
      }
    }
    
    return cleaned;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Forwarding Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <PhoneForwarded className="w-4 h-4 inline mr-1" />
          Forwarding Type
        </label>
        <select
          value={config.forwardingType}
          onChange={(e) => setConfig({ 
            ...config, 
            forwardingType: e.target.value as ForwardingConfig['forwardingType'],
            forwardingNumber: '' // Clear number when changing type
          })}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="none">No Forwarding</option>
          <option value="mobile">Mobile Number</option>
          <option value="landline">Landline Number</option>
          <option value="voip">VoIP/SIP</option>
        </select>
      </div>

      {/* Forwarding Number */}
      {config.forwardingType !== 'none' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Forwarding Destination
          </label>
          <input
            type={config.forwardingType === 'voip' ? 'text' : 'tel'}
            value={config.forwardingNumber || ''}
            onChange={(e) => {
              const value = config.forwardingType === 'voip' 
                ? e.target.value 
                : formatPhoneNumber(e.target.value);
              setConfig({ ...config, forwardingNumber: value });
              setErrors({ ...errors, forwardingNumber: '' });
            }}
            placeholder={
              config.forwardingType === 'voip' 
                ? 'sip:user@domain.com' 
                : '+1 (555) 123-4567'
            }
            disabled={isLoading}
            className={`
              w-full px-3 py-2 border rounded-lg 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              disabled:bg-gray-100
              ${errors.forwardingNumber ? 'border-red-500' : 'border-gray-300'}
            `}
          />
          {errors.forwardingNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.forwardingNumber}</p>
          )}
          {config.forwardingType === 'voip' && (
            <p className="mt-1 text-xs text-gray-500">
              <Info className="w-3 h-3 inline mr-1" />
              Enter a valid SIP URI for VoIP forwarding
            </p>
          )}
        </div>
      )}

      {/* Voicemail Configuration */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.voicemailEnabled}
              onChange={(e) => setConfig({ ...config, voicemailEnabled: e.target.checked })}
              disabled={isLoading}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">
              <Voicemail className="w-4 h-4 inline mr-1" />
              Enable Voicemail
            </span>
          </label>
        </div>
        
        {config.voicemailEnabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voicemail Email
            </label>
            <input
              type="email"
              value={config.voicemailEmail || ''}
              onChange={(e) => {
                setConfig({ ...config, voicemailEmail: e.target.value });
                setErrors({ ...errors, voicemailEmail: '' });
              }}
              placeholder="voicemail@example.com"
              disabled={isLoading}
              className={`
                w-full px-3 py-2 border rounded-lg 
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                disabled:bg-gray-100
                ${errors.voicemailEmail ? 'border-red-500' : 'border-gray-300'}
              `}
            />
            {errors.voicemailEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.voicemailEmail}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Voicemail recordings will be sent to this email
            </p>
          </div>
        )}
      </div>

      {/* SMS Forwarding */}
      {smsEnabled && (
        <div className="border-t pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MessageSquare className="w-4 h-4 inline mr-1" />
            SMS Forwarding Email
          </label>
          <input
            type="email"
            value={config.smsForwardingEmail || ''}
            onChange={(e) => {
              setConfig({ ...config, smsForwardingEmail: e.target.value });
              setErrors({ ...errors, smsForwardingEmail: '' });
            }}
            placeholder="sms@example.com"
            disabled={isLoading}
            className={`
              w-full px-3 py-2 border rounded-lg 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              disabled:bg-gray-100
              ${errors.smsForwardingEmail ? 'border-red-500' : 'border-gray-300'}
            `}
          />
          {errors.smsForwardingEmail && (
            <p className="mt-1 text-sm text-red-600">{errors.smsForwardingEmail}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Incoming SMS messages will be forwarded to this email
          </p>
        </div>
      )}

      {/* Advanced Settings */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">
          <Settings className="w-4 h-4 inline mr-1" />
          Advanced Settings
        </h3>
        
        <div className="space-y-3">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.callRecordingEnabled}
              onChange={(e) => setConfig({ ...config, callRecordingEnabled: e.target.checked })}
              disabled={isLoading}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Enable Call Recording</span>
          </label>

          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.businessHoursEnabled || false}
              onChange={(e) => setConfig({ ...config, businessHoursEnabled: e.target.checked })}
              disabled={isLoading}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">
              <Clock className="w-4 h-4 inline mr-1" />
              Enable Business Hours
            </span>
          </label>
        </div>

        {config.businessHoursEnabled && (
          <div className="mt-4 ml-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                <input
                  type="time"
                  value={config.businessHoursStart || '09:00'}
                  onChange={(e) => setConfig({ ...config, businessHoursStart: e.target.value })}
                  disabled={isLoading}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">End Time</label>
                <input
                  type="time"
                  value={config.businessHoursEnd || '17:00'}
                  onChange={(e) => setConfig({ ...config, businessHoursEnd: e.target.value })}
                  disabled={isLoading}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Timezone</label>
              <select
                value={config.businessHoursTimezone || 'UTC'}
                onChange={(e) => setConfig({ ...config, businessHoursTimezone: e.target.value })}
                disabled={isLoading}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Australia/Sydney">Sydney</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Weekend Handling</label>
              <select
                value={config.weekendHandling || 'forward'}
                onChange={(e) => setConfig({ 
                  ...config, 
                  weekendHandling: e.target.value as ForwardingConfig['weekendHandling'] 
                })}
                disabled={isLoading}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              >
                <option value="forward">Forward Normally</option>
                <option value="voicemail">Send to Voicemail</option>
                <option value="reject">Reject Calls</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button
          onClick={onCancel}
          variant="outline"
          disabled={saving || isLoading}
        >
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-1" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}