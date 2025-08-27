'use client';

import { Button } from '@/components/ui/button';
import { useAddToCart } from '@/hooks/useCart';
import { ShoppingCart } from 'lucide-react';

// Demo component to test cart functionality
export function AddToCartDemo() {
  const { addPhoneToCart } = useAddToCart();

  const demoNumbers = [
    {
      countryCode: '+1',
      countryName: 'United States',
      areaCode: '212',
      cityName: 'New York',
      phoneNumber: '+1 212 555 0101',
      basePrice: 9.99,
      smsEnabled: true,
      smsPrice: 4.99,
    },
    {
      countryCode: '+44',
      countryName: 'United Kingdom',
      areaCode: '20',
      cityName: 'London',
      phoneNumber: '+44 20 7123 4567',
      basePrice: 7.99,
      smsEnabled: false,
      smsPrice: 0,
    },
    {
      countryCode: '+33',
      countryName: 'France',
      areaCode: '1',
      cityName: 'Paris',
      phoneNumber: '+33 1 4234 5678',
      basePrice: 8.99,
      smsEnabled: true,
      smsPrice: 3.99,
      forwardingType: 'call' as const,
      forwardingDestination: '+1 555 0123',
      forwardingPrice: 2.99,
    },
  ];

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Demo: Add Numbers to Cart</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {demoNumbers.map((number) => (
          <div key={number.phoneNumber} className="border rounded-lg p-4 space-y-2">
            <h4 className="font-semibold">{number.phoneNumber}</h4>
            <p className="text-sm text-muted-foreground">
              {number.cityName}, {number.countryName}
            </p>
            <p className="text-sm">Base price: ${number.basePrice}/month</p>
            {number.smsEnabled && (
              <p className="text-sm text-blue-600">SMS enabled (+${number.smsPrice}/month)</p>
            )}
            {number.forwardingType && (
              <p className="text-sm text-purple-600">Call forwarding (+${number.forwardingPrice}/month)</p>
            )}
            <Button
              onClick={() => addPhoneToCart(number)}
              size="sm"
              className="w-full"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        * This is a demo component for testing. Click the cart icon in the header to view your cart.
      </p>
    </div>
  );
}