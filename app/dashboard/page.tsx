'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { authStorage, authFetch } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  ArrowRight,
  Mail,
  PhoneForwarded,
  AlertCircle
} from 'lucide-react';

interface PurchasedNumber {
  id: string;
  phone_number: string;
  display_name?: string;
  is_active: boolean;
  sms_enabled: boolean;
  provisioning_status: string;
  didww_did_id?: string;
  last_provision_error?: string;
  provisioning_attempts: number;
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
    forwarding_type: string;
    forwarding_number?: string;
    voicemail_enabled: boolean;
    voicemail_email?: string;
  }[];
  latestProvisioningJob?: {
    status: string;
    error_message?: string;
    created_at: string;
  };
}

function DashboardContent() {
  const [numbers, setNumbers] = useState<PurchasedNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchNumbers();
  }, []);

  const fetchNumbers = async () => {
    try {
      setLoading(true);
      
      // Use authFetch which includes the auth token
      const response = await authFetch('/api/provisioning/status', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch numbers');
      }

      const result = await response.json();
      setNumbers(result.data || []);
    } catch (err) {
      console.error('Error fetching numbers:', err);
      setError('Failed to load your numbers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const retryProvisioning = async (purchasedNumberId: string) => {
    try {
      setRetrying(purchasedNumberId);
      
      const response = await authFetch('/api/provisioning/retry', {
        method: 'POST',
        body: JSON.stringify({ purchasedNumberId })
      });

      if (!response.ok) {
        throw new Error('Failed to retry provisioning');
      }

      // Refresh the list
      await fetchNumbers();
    } catch (err) {
      console.error('Error retrying provisioning:', err);
      alert('Failed to retry provisioning. Please try again.');
    } finally {
      setRetrying(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
      case 'provisioning':
        return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />;
      case 'suspended':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'provisioning':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPhoneNumber = (number: string) => {
    // Simple formatting - you can enhance this
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-gray-600">Manage your phone numbers and configurations</p>
            </div>
            <div className="flex gap-4">
              <Button 
                onClick={() => router.push('/numbers')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Get New Number
              </Button>
              <Button 
                onClick={fetchNumbers}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Numbers Grid */}
        {numbers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Phone className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Numbers Yet</h2>
            <p className="text-gray-600 mb-6">Get started by purchasing your first phone number</p>
            <Button 
              onClick={() => router.push('/numbers')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Browse Available Numbers
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {numbers.map((number) => (
              <div key={number.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Number Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {formatPhoneNumber(number.phone_number)}
                      </h3>
                      {number.display_name && (
                        <p className="text-sm text-gray-600">{number.display_name}</p>
                      )}
                      {number.area_code && (
                        <p className="text-sm text-gray-500">
                          {number.area_code.city}, {number.country?.name}
                        </p>
                      )}
                    </div>
                    {getStatusIcon(number.provisioning_status)}
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(number.provisioning_status)}`}>
                      {number.provisioning_status.replace('_', ' ').toUpperCase()}
                    </span>
                    {number.sms_enabled && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        SMS Enabled
                      </span>
                    )}
                  </div>

                  {/* Forwarding Info */}
                  {number.number_configurations?.[0] && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm">
                        {number.number_configurations[0].forwarding_type !== 'none' ? (
                          <div className="flex items-center gap-2">
                            <PhoneForwarded className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">
                              Forwarding to: {number.number_configurations[0].forwarding_number || 'Not set'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500">No forwarding configured</span>
                        )}
                        {number.number_configurations[0].voicemail_email && (
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700 text-xs">
                              Voicemail: {number.number_configurations[0].voicemail_email}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {number.last_provision_error && (
                    <div className="mb-4 p-2 bg-red-50 rounded-lg">
                      <p className="text-xs text-red-700">
                        Error: {number.last_provision_error}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Attempts: {number.provisioning_attempts}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {number.provisioning_status === 'active' ? (
                      <>
                        <Button
                          onClick={() => router.push(`/my-numbers?id=${number.id}`)}
                          variant="outline"
                          size="sm"
                          className="flex-1 flex items-center justify-center gap-1"
                        >
                          <Settings className="w-4 h-4" />
                          Configure
                        </Button>
                        <Button
                          onClick={() => router.push(`/my-numbers?id=${number.id}`)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          View Details
                        </Button>
                      </>
                    ) : number.provisioning_status === 'failed' ? (
                      <Button
                        onClick={() => retryProvisioning(number.id)}
                        disabled={retrying === number.id}
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                        size="sm"
                      >
                        {retrying === number.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Retry Provisioning
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        disabled
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Provisioning...
                      </Button>
                    )}
                  </div>

                  {/* Purchase Info */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Purchased: {new Date(number.purchase_date).toLocaleDateString()}</span>
                      {number.expiry_date && (
                        <span>Expires: {new Date(number.expiry_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {numbers.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Button
                onClick={() => router.push('/my-numbers')}
                variant="outline"
                className="justify-start"
              >
                <Phone className="w-4 h-4 mr-2" />
                View All Numbers
              </Button>
              <Button
                onClick={() => router.push('/numbers')}
                variant="outline"
                className="justify-start"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Get Another Number
              </Button>
              <Button
                onClick={() => router.push('/account')}
                variant="outline"
                className="justify-start"
              >
                <Settings className="w-4 h-4 mr-2" />
                Account Settings
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard requireAuth={true}>
      <DashboardContent />
    </AuthGuard>
  );
}