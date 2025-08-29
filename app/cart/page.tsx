'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, CreditCard, LogIn } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/lib/supabase-client';

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateItem, clearCart } = useCart();
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    checkUser();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      // Redirect to sign in with return URL
      router.push('/auth/signin?redirectTo=/checkout');
    } else {
      // Proceed to checkout (not implemented yet)
      alert('Checkout functionality will be implemented in the next task');
    }
  };

  if (!isClient) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Continue Shopping
        </Link>
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
      </div>

      {items.length === 0 ? (
        /* Empty Cart */
        <div className="text-center py-12">
          <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Add some phone numbers to get started with your virtual phone service
          </p>
          <Button size="lg" onClick={() => router.push('/')}>
            Browse Phone Numbers
          </Button>
        </div>
      ) : (
        /* Cart Content */
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {items.length} {items.length === 1 ? 'Item' : 'Items'} in Cart
              </h2>
              {items.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear your entire cart?')) {
                      clearCart();
                    }
                  }}
                >
                  Clear All
                </Button>
              )}
            </div>

            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onRemove={removeItem}
                onUpdate={updateItem}
                showDetails={true}
              />
            ))}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              <CartSummary items={items} showDetails={true} />

              {/* Checkout Section */}
              <div className="border rounded-lg p-4 space-y-3 bg-white">
                {user ? (
                  <>
                    <p className="text-sm text-gray-600">
                      Signed in as <strong className="text-gray-900">{user.email}</strong>
                    </p>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      size="lg"
                      onClick={handleCheckout}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Proceed to Checkout
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">
                      Sign in to proceed to checkout
                    </p>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                      onClick={() => router.push('/auth/signin?redirectTo=/cart')}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In to Checkout
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      size="lg"
                      onClick={() => router.push('/auth/signup?redirectTo=/cart')}
                    >
                      Create Account
                    </Button>
                  </>
                )}

                <div className="pt-3 border-t space-y-2">
                  <p className="text-xs text-gray-600 flex items-center">
                    <span className="text-green-600 mr-1">✓</span> Secure checkout powered by Stripe
                  </p>
                  <p className="text-xs text-gray-600 flex items-center">
                    <span className="text-green-600 mr-1">✓</span> Instant number activation after payment
                  </p>
                  <p className="text-xs text-gray-600 flex items-center">
                    <span className="text-green-600 mr-1">✓</span> 30-day money-back guarantee
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="border rounded-lg p-4 space-y-2 bg-gray-50">
                <h3 className="font-semibold text-sm text-gray-900">Important Information</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• All prices are in USD</li>
                  <li>• Numbers are activated immediately after payment</li>
                  <li>• SMS-enabled numbers require a 6-month minimum commitment</li>
                  <li>• Call forwarding can be configured after activation</li>
                  <li>• Cancel anytime before renewal date</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}