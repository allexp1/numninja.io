'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Settings, 
  Activity,
  Calendar,
  DollarSign,
  MessageSquare,
  PhoneCall,
  Mail,
  Voicemail,
  PhoneForwarded,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  RefreshCw,
  ChevronLeft,
  Edit2,
  Trash2
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface NumberUsageStats {
  total_calls: number;
  total_minutes: number;
  total_sms: number;
  total_cost: number;
  period_start: string;
  period_end: string;
}

interface CallDetailRecord {
  id: string;
  direction: string;
  from_number: string;
  to_number: string;
  duration_seconds: number;
  answered: boolean;
  start_time: string;
  cost?: number;
}

interface PurchasedNumber {
  id: string;
  phone_number: string;
  display_name?: string;
  is_active: boolean;
  sms_enabled: boolean;
  provisioning_status: string;
  didww_did_id?: string;
  monthly_price?: number;
  setup_price?: number;
  purchase_date: string;
  expiry_date?: string;
  country?: {
    name: string;
    code: string;
  };
  area_code?: {
    area_code: string;
    city: string;
  };
  number_configurations?: {
    id: string;
    forwarding_type: string;
    forwarding_number?: string;
    voicemail_enabled: boolean;
    voicemail_email?: string;
    call_recording_enabled: boolean;
    business_hours_enabled: boolean;
    business_hours_start?: string;
    business_hours_end?: string;
    business_hours_timezone: string;
    weekend_handling: string;
  }[];
}

function MyNumbersContent() {
  const [numbers, setNumbers] = useState<PurchasedNumber[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<PurchasedNumber | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usageStats, setUsageStats] = useState<NumberUsageStats | null>(null);
  const [recentCalls, setRecentCalls] = useState<CallDetailRecord[]>([]);
  const [editingConfig, setEditingConfig] = useState(false);
  const [configForm, setConfigForm] = useState({
    forwardingType: 'none',
    forwardingNumber: '',
    voicemailEnabled: true,
    voicemailEmail: '',
    callRecordingEnabled: false,
    smsForwardingEmail: ''
  });
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const numberIdParam = searchParams.get('id');

  useEffect(() => {
    checkAuth();
    fetchNumbers();
  }, []);

  useEffect(() => {
    if (numberIdParam && numbers.length > 0) {
      const number = numbers.find(n => n.id === numberIdParam);
      if (number) {
        setSelectedNumber(number);
        loadNumberDetails(number.id);
      }
    }
  }, [numberIdParam, numbers]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/signin');
    }
  };

  const fetchNumbers = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      const response = await fetch('/api/provisioning/status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch numbers');
      }

      const result = await response.json();
      const numbersData = result.data || [];
      setNumbers(numbersData);
      
      // If no specific number selected, select the first one
      if (!numberIdParam && numbersData.length > 0) {
        setSelectedNumber(numbersData[0]);
        loadNumberDetails(numbersData[0].id);
      }
    } catch (err) {
      console.error('Error fetching numbers:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadNumberDetails = async (numberId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Load configuration
      const configResponse = await fetch(`/api/provisioning/configure?purchasedNumberId=${numberId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (configResponse.ok) {
        const configResult = await configResponse.json();
        if (configResult.data?.configuration) {
          setConfigForm({
            forwardingType: configResult.data.configuration.forwardingType || 'none',
            forwardingNumber: configResult.data.configuration.forwardingNumber || '',
            voicemailEnabled: configResult.data.configuration.voicemailEnabled ?? true,
            voicemailEmail: configResult.data.configuration.voicemailEmail || '',
            callRecordingEnabled: configResult.data.configuration.callRecordingEnabled ?? false,
            smsForwardingEmail: '' // This would come from a separate SMS config
          });
        }
      }

      // Load usage stats (mock for now)
      setUsageStats({
        total_calls: 42,
        total_minutes: 186,
        total_sms: 15,
        total_cost: 23.50,
        period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        period_end: new Date().toISOString()
      });

      // Load recent calls (mock for now)
      setRecentCalls([
        {
          id: '1',
          direction: 'inbound',
          from_number: '+14155551234',
          to_number: selectedNumber?.phone_number || '',
          duration_seconds: 125,
          answered: true,
          start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          cost: 0.05
        },
        {
          id: '2',
          direction: 'inbound',
          from_number: '+12125555678',
          to_number: selectedNumber?.phone_number || '',
          duration_seconds: 45,
          answered: true,
          start_time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          cost: 0.02
        }
      ]);
    } catch (err) {
      console.error('Error loading number details:', err);
    }
  };

  const saveConfiguration = async () => {
    if (!selectedNumber) return;

    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      const response = await fetch('/api/provisioning/configure', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          purchasedNumberId: selectedNumber.id,
          config: configForm
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      setEditingConfig(false);
      alert('Configuration saved successfully!');
      
      // Reload the number details
      await fetchNumbers();
    } catch (err) {
      console.error('Error saving configuration:', err);
      alert('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (number: string) => {
    if (number.startsWith('+1') && number.length === 12) {
      return `+1 (${number.slice(2, 5)}) ${number.slice(5, 8)}-${number.slice(8)}`;
    }
    return number;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your numbers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            className="mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">My Numbers</h1>
          <p className="mt-2 text-gray-600">Detailed view and configuration of your phone numbers</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Numbers List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Your Numbers</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {numbers.length === 0 ? (
                  <div className="p-8 text-center">
                    <Phone className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500">No numbers yet</p>
                    <Button
                      onClick={() => router.push('/numbers')}
                      className="mt-4"
                      size="sm"
                    >
                      Get a Number
                    </Button>
                  </div>
                ) : (
                  numbers.map((number) => (
                    <button
                      key={number.id}
                      onClick={() => {
                        setSelectedNumber(number);
                        loadNumberDetails(number.id);
                      }}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedNumber?.id === number.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatPhoneNumber(number.phone_number)}
                          </p>
                          {number.display_name && (
                            <p className="text-sm text-gray-600">{number.display_name}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {number.area_code?.city}, {number.country?.name}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {number.provisioning_status === 'active' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Number Details */}
          {selectedNumber ? (
            <div className="lg:col-span-2 space-y-6">
              {/* Status and Info */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {formatPhoneNumber(selectedNumber.phone_number)}
                    </h2>
                    {selectedNumber.display_name && (
                      <p className="text-gray-600">{selectedNumber.display_name}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedNumber.area_code?.city}, {selectedNumber.country?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedNumber.provisioning_status === 'active' ? (
                      <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        <Clock className="w-4 h-4" />
                        Provisioning
                      </span>
                    )}
                    {selectedNumber.sms_enabled && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        SMS
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Monthly Price</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${selectedNumber.monthly_price || '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Purchase Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(selectedNumber.purchase_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Renewal Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedNumber.expiry_date 
                        ? new Date(selectedNumber.expiry_date).toLocaleDateString()
                        : 'Monthly'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">DID ID</p>
                    <p className="text-sm font-mono text-gray-600">
                      {selectedNumber.didww_did_id || 'Pending'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Forwarding Configuration</h3>
                  {!editingConfig ? (
                    <Button
                      onClick={() => setEditingConfig(true)}
                      variant="outline"
                      size="sm"
                      disabled={selectedNumber.provisioning_status !== 'active'}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={saveConfiguration}
                        size="sm"
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {saving ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-1" />
                        )}
                        Save
                      </Button>
                      <Button
                        onClick={() => setEditingConfig(false)}
                        variant="outline"
                        size="sm"
                        disabled={saving}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {editingConfig ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Forwarding Type
                      </label>
                      <select
                        value={configForm.forwardingType}
                        onChange={(e) => setConfigForm({...configForm, forwardingType: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="none">No Forwarding</option>
                        <option value="mobile">Mobile</option>
                        <option value="landline">Landline</option>
                        <option value="voip">VoIP/SIP</option>
                      </select>
                    </div>

                    {configForm.forwardingType !== 'none' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Forwarding Number
                        </label>
                        <input
                          type="text"
                          value={configForm.forwardingNumber}
                          onChange={(e) => setConfigForm({...configForm, forwardingNumber: e.target.value})}
                          placeholder={configForm.forwardingType === 'voip' ? 'sip:user@domain.com' : '+1234567890'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Voicemail Email
                      </label>
                      <input
                        type="email"
                        value={configForm.voicemailEmail}
                        onChange={(e) => setConfigForm({...configForm, voicemailEmail: e.target.value})}
                        placeholder="voicemail@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {selectedNumber.sms_enabled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          SMS Forwarding Email
                        </label>
                        <input
                          type="email"
                          value={configForm.smsForwardingEmail}
                          onChange={(e) => setConfigForm({...configForm, smsForwardingEmail: e.target.value})}
                          placeholder="sms@example.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={configForm.voicemailEnabled}
                          onChange={(e) => setConfigForm({...configForm, voicemailEnabled: e.target.checked})}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Enable Voicemail</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={configForm.callRecordingEnabled}
                          onChange={(e) => setConfigForm({...configForm, callRecordingEnabled: e.target.checked})}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Enable Call Recording</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <PhoneForwarded className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Forwarding</p>
                        <p className="font-medium">
                          {configForm.forwardingType === 'none' 
                            ? 'Not configured' 
                            : `${configForm.forwardingType}: ${configForm.forwardingNumber || 'Not set'}`}
                        </p>
                      </div>
                    </div>
                    {configForm.voicemailEnabled && (
                      <div className="flex items-center gap-3">
                        <Voicemail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Voicemail</p>
                          <p className="font-medium">
                            {configForm.voicemailEmail || 'Enabled'}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedNumber.sms_enabled && (
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">SMS Forwarding</p>
                          <p className="font-medium">
                            {configForm.smsForwardingEmail || 'Not configured'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Usage Statistics */}
              {usageStats && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Usage Statistics (Last 30 Days)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <PhoneCall className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold text-gray-900">{usageStats.total_calls}</p>
                      <p className="text-sm text-gray-600">Total Calls</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold text-gray-900">{usageStats.total_minutes}</p>
                      <p className="text-sm text-gray-600">Minutes</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <p className="text-2xl font-bold text-gray-900">{usageStats.total_sms}</p>
                      <p className="text-sm text-gray-600">SMS Messages</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                      <p className="text-2xl font-bold text-gray-900">${usageStats.total_cost.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Total Cost</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Calls */}
              {recentCalls.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Calls</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b border-gray-200">
                          <th className="pb-2 text-sm font-medium text-gray-700">Type</th>
                          <th className="pb-2 text-sm font-medium text-gray-700">Number</th>
                          <th className="pb-2 text-sm font-medium text-gray-700">Duration</th>
                          <th className="pb-2 text-sm font-medium text-gray-700">Time</th>
                          <th className="pb-2 text-sm font-medium text-gray-700">Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recentCalls.map((call) => (
                          <tr key={call.id}>
                            <td className="py-3">
                              <span className={`inline-flex items-center gap-1 text-sm ${
                                call.direction === 'inbound' ? 'text-green-600' : 'text-blue-600'
                              }`}>
                                {call.direction === 'inbound' ? '↓' : '↑'}
                                {call.direction}
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-900">
                              {formatPhoneNumber(call.from_number)}
                            </td>
                            <td className="py-3 text-sm text-gray-600">
                              {formatDuration(call.duration_seconds)}
                            </td>
                            <td className="py-3 text-sm text-gray-600">
                              {new Date(call.start_time).toLocaleString()}
                            </td>
                            <td className="py-3 text-sm text-gray-900">
                              ${call.cost?.toFixed(2) || '0.00'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Phone className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Select a number to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyNumbersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <MyNumbersContent />
    </Suspense>
  );
}