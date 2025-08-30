'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { authHelpers } from '@/lib/supabase-client';
import { getStripe } from '@/lib/stripe';
import { Button } from '@/components/ui/button';

interface BillingInfo {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getPriceBreakdown, clearCart, calculateItemTotal } = useCart();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: ''
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { user, error } = await authHelpers.getUser();
    if (!user) {
      router.push('/auth/signin?redirect=/checkout');
      return;
    }
    setUser(user);
    
    // Pre-fill billing info from user metadata
    setBillingInfo(prev => ({
      ...prev,
      name: user.user_metadata?.full_name || '',
      email: user.email || '',
      phone: user.user_metadata?.phone || '',
      address: user.user_metadata?.address || ''
    }));
  };

  const handleCheckout = async () => {
    if (!user) {
      router.push('/auth/signin?redirect=/checkout');
      return;
    }

    if (items.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      // Create checkout session
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            number: item.phoneNumber,
            country_code: item.countryCode,
            area_code: item.areaCode,
            area_name: item.cityName,
            monthly_price: item.basePrice,
            setup_price: 10, // Fixed setup fee per number
          }))
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      const stripe = await getStripe();
      const { error } = await stripe!.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (error) {
        console.error('Stripe redirect error:', error);
        alert(error.message);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to process checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBillingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const priceBreakdown = getPriceBreakdown();
  const setupTotal = items.length * 10; // $10 setup fee per number

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Add some phone numbers to get started.</p>
          <Button onClick={() => router.push('/numbers')}>
            Browse Numbers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start pb-4 border-b last:border-0">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.phoneNumber}</h3>
                      <p className="text-sm text-gray-600">
                        {item.countryName} • {item.cityName}
                      </p>
                      <div className="text-sm mt-1">
                        <span className="text-gray-600">Base: ${item.basePrice.toFixed(2)}/mo</span>
                        {item.smsEnabled && (
                          <span className="text-gray-600 ml-3">
                            SMS: ${item.smsPrice.toFixed(2)}/mo
                          </span>
                        )}
                        {item.forwardingType !== 'none' && (
                          <span className="text-gray-600 ml-3">
                            Forwarding: ${item.forwardingPrice.toFixed(2)}/mo
                          </span>
                        )}
                        <span className="text-gray-600 ml-3">
                          Duration: {item.monthlyDuration} month{item.monthlyDuration > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        ${calculateItemTotal(item).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        + $10 setup
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Billing Information</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={billingInfo.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={billingInfo.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={billingInfo.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <select
                    name="country"
                    value={billingInfo.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={billingInfo.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={billingInfo.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={billingInfo.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={billingInfo.zipCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Setup Fees ({items.length} number{items.length > 1 ? 's' : ''})</span>
                  <span>${setupTotal.toFixed(2)}</span>
                </div>
                
                {priceBreakdown.baseTotal > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Base Monthly Fees</span>
                    <span>${priceBreakdown.baseTotal.toFixed(2)}</span>
                  </div>
                )}
                
                {priceBreakdown.smsTotal > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>SMS Services</span>
                    <span>${priceBreakdown.smsTotal.toFixed(2)}</span>
                  </div>
                )}
                
                {priceBreakdown.forwardingTotal > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Call Forwarding</span>
                    <span>${priceBreakdown.forwardingTotal.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total Due Today</span>
                    <span>${(priceBreakdown.grandTotal + setupTotal).toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Includes all services for selected duration
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Processing...' : 'Proceed to Payment'}
                </Button>
                
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Secure payment powered by Stripe
                  </p>
                  <div className="flex justify-center items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400">Accepted:</span>
                    <span className="text-xs text-gray-600">Visa, Mastercard, Amex</span>
                  </div>
                </div>
              </div>

              {/* Security badges */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>SSL Encrypted</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>PCI Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}