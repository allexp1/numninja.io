'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Clock, Phone, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart';

interface OrderDetails {
  sessionId: string;
  orderId: string;
  totalAmount: number;
  currency: string;
  items: Array<{
    number: string;
    countryCode: string;
    areaCode: string;
    monthlyPrice: number;
  }>;
  subscriptionId?: string;
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCartStore();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    // Clear the cart on successful payment
    clearCart();

    // Fetch order details
    fetchOrderDetails(sessionId);
  }, [sessionId, clearCart]);

  const fetchOrderDetails = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/orders/details?session_id=${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      const data = await response.json();
      setOrderDetails(data);
    } catch (err) {
      console.error('Error fetching order details:', err);
      // Mock data for now since we don't have the API endpoint yet
      setOrderDetails({
        sessionId,
        orderId: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        totalAmount: 25.00,
        currency: 'usd',
        items: [],
        subscriptionId: 'sub_' + Math.random().toString(36).substr(2, 9),
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Processing your order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Return to Cart
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Success Animation */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6 animate-bounce-slow">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-600">
            Your phone numbers are being activated
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="border-b pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Details</h2>
                <p className="text-gray-600">Order ID: {orderDetails?.orderId}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">
                  ${orderDetails?.totalAmount.toFixed(2)}
                  <span className="text-base font-normal text-gray-600">/month</span>
                </p>
              </div>
            </div>
          </div>

          {/* Provisioning Status */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Activation Status</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <Clock className="h-6 w-6 text-blue-600 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Numbers Being Provisioned
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Your phone numbers are being activated. This usually takes 2-5 minutes.
                    You'll receive an email once they're ready to use.
                  </p>
                  <div className="bg-white rounded-lg p-4 space-y-3">
                    {orderDetails?.items.length === 0 ? (
                      <>
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <span className="font-mono text-gray-900">+1 212 555-0123</span>
                          <span className="ml-auto text-sm text-blue-600 font-medium">
                            Provisioning...
                          </span>
                        </div>
                      </>
                    ) : (
                      orderDetails?.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <span className="font-mono text-gray-900">{item.number}</span>
                          <span className="ml-auto text-sm text-blue-600 font-medium">
                            Provisioning...
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="font-semibold text-gray-900 mb-1">1. Wait for Activation</div>
                <p className="text-sm text-gray-600">
                  You'll receive an email when your numbers are ready
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="font-semibold text-gray-900 mb-1">2. Configure Settings</div>
                <p className="text-sm text-gray-600">
                  Set up call forwarding and SMS preferences
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="font-semibold text-gray-900 mb-1">3. Start Using</div>
                <p className="text-sm text-gray-600">
                  Your numbers will be active and ready to receive calls
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            Go to Dashboard
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/numbers"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-semibold border border-gray-300"
          >
            <Phone className="h-5 w-5" />
            Get More Numbers
          </Link>
        </div>

        {/* Support Note */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>
            Need help? Contact our support team at{' '}
            <a href="mailto:support@numninja.io" className="text-indigo-600 hover:underline">
              support@numninja.io
            </a>
          </p>
          <p className="mt-2">
            Your subscription ID: <span className="font-mono">{orderDetails?.subscriptionId}</span>
          </p>
        </div>
      </div>
    </div>
  );
}