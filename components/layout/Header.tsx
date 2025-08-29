'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, Phone, Menu, X } from 'lucide-react';
import { CartIcon } from '@/components/cart/CartIcon';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Phone className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">NumNinja</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                Browse Numbers
              </Link>
              <Link href="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link href="/features" className="text-sm font-medium hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="/support" className="text-sm font-medium hover:text-primary transition-colors">
                Support
              </Link>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <CartIcon onClick={() => setIsCartOpen(true)} />
              
              {loading ? (
                <div className="h-9 w-20 bg-muted animate-pulse rounded"></div>
              ) : user ? (
                <div className="flex items-center space-x-2">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-destructive hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/auth/signin">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <CartIcon onClick={() => setIsCartOpen(true)} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t">
            <div className="container mx-auto px-4 py-4 space-y-4">
              <nav className="flex flex-col space-y-2">
                <Link 
                  href="/" 
                  className="text-sm font-medium hover:text-primary transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Browse Numbers
                </Link>
                <Link 
                  href="/pricing" 
                  className="text-sm font-medium hover:text-primary transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link 
                  href="/features" 
                  className="text-sm font-medium hover:text-primary transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  href="/support" 
                  className="text-sm font-medium hover:text-primary transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Support
                </Link>
              </nav>

              <div className="pt-4 border-t space-y-2">
                {!loading && (
                  user ? (
                    <>
                      <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-start">
                          <User className="h-4 w-4 mr-2" />
                          Dashboard
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-destructive hover:text-destructive"
                        onClick={() => {
                          handleSignOut();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/auth/signin" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">Sign In</Button>
                      </Link>
                      <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full">Sign Up</Button>
                      </Link>
                    </>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}