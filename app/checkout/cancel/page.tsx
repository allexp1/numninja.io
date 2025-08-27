'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';

export default function CheckoutCancelPage() {
  const router = useRouter();
  const { items } = useCart();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        {/* Cancel Icon */}
        <div className="text-yellow-500 mb-6">
          <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Cancel Message */}
        <h1 className="text-3xl font-bold mb-4">Payment Cancelled</h1>
        <p className="text-gray-600 mb-8">
          Your payment was cancelled. No charges have been made to your account.
        </p>

        {/* Items Still in Cart Notice */}
        {items.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
            <h3 className="font-semibold text-blue-900 mb-2">Your items are still in the cart</h3>
            <p className="text-sm text-blue-700 mb-3">
              We've saved your {items.length} item{items.length > 1 ? 's' : ''} in your cart. You can complete your purchase anytime.
            </p>
            <div className="text-sm text-blue-600">
              {items.map((item, index) => (
                <div key={item.id} className="mb-1">
                  • {item.phoneNumber}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Why Complete Purchase */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8 max-w-md mx-auto">
          <h3 className="font-semibold mb-4">Why complete your purchase?</h3>
          <div className="space-y-3 text-left">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-gray-600">Instant number provisioning</p>
            </div>
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-gray-600">24/7 customer support</p>
            </div>
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-gray-600">Cancel anytime, no contracts</p>
            </div>
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-gray-600">30-day money-back guarantee</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {items.length > 0 ? (
            <>
              <Button
                onClick={() => router.push('/checkout')}
                size="lg"
              >
                Return to Checkout
              </Button>
              <Button
                onClick={() => router.push('/cart')}
                variant="outline"
                size="lg"
              >
                View Cart
              </Button>
            </>
          ) : (
            <Button
              onClick={() => router.push('/numbers')}
              size="lg"
            >
              Browse Numbers
            </Button>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-12 pt-8 border-t">
          <h3 className="font-semibold mb-4">Need Help?</h3>
          <p className="text-sm text-gray-600 mb-4">
            If you experienced any issues during checkout or have questions, our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
            <a href="mailto:support@numninja.io" className="text-blue-600 hover:text-blue-700">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                support@numninja.io
              </div>
            </a>
            <a href="/help" className="text-blue-600 hover:text-blue-700">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help Center
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}