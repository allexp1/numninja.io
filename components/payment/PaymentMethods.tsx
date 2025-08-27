'use client';

interface PaymentMethodsProps {
  className?: string;
}

export function PaymentMethods({ className = '' }: PaymentMethodsProps) {
  const paymentMethods = [
    {
      name: 'Credit & Debit Cards',
      description: 'Visa, Mastercard, American Express, Discover',
      icon: '💳',
      available: true,
    },
    {
      name: 'Apple Pay',
      description: 'Fast checkout with Apple Pay',
      icon: '🍎',
      available: true,
    },
    {
      name: 'Google Pay',
      description: 'Fast checkout with Google Pay', 
      icon: '🔵',
      available: true,
    },
  ];

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Accepted Payment Methods</h3>
      
      <div className="space-y-3">
        {paymentMethods.map((method) => (
          <div
            key={method.name}
            className={`flex items-start space-x-3 p-3 rounded-lg border ${
              method.available 
                ? 'border-gray-200 bg-white' 
                : 'border-gray-100 bg-gray-50 opacity-60'
            }`}
          >
            <div className="text-2xl">{method.icon}</div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">
                {method.name}
              </h4>
              <p className="text-xs text-gray-600 mt-0.5">
                {method.description}
              </p>
            </div>
            {method.available && (
              <svg 
                className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* Security Badges */}
      <div className="mt-6 pt-6 border-t">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>PCI Compliant</span>
          </div>
        </div>
      </div>

      {/* Stripe Badge */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Secure payments powered by
        </p>
        <div className="mt-2">
          <svg className="h-6 mx-auto" viewBox="0 0 60 25" fill="none">
            <path d="M60 12.5c0-5.07-2.5-8.3-7.3-8.3-4.82 0-7.76 3.23-7.76 8.25 0 6.13 3.45 8.25 8.41 8.25 2.43 0 4.26-.55 5.62-1.3v-3.82c-1.36.65-2.82 1.05-4.92 1.05-1.95 0-3.67-.65-3.92-2.9h9.82c0-.25.05-.8.05-1.23zm-9.92-1.95c0-2.15 1.3-3.05 2.52-3.05 1.2 0 2.4.9 2.4 3.05h-4.92zm-8.91-6.35l-3.22 10.9-3.17-10.9h-4.52v15.4h3.32V9.1l3.77 10.5h2.57L43.7 9.1v10.5h3.32V4.2h-4.52l-.33-.01zm-14.53 0h-3.97v15.4h3.97V4.2zm5.13 0l-.55 3.45c-.9-2.3-2.67-3.65-5.07-3.65-4.02 0-6.87 3.35-6.87 8.3 0 4.95 2.85 8.3 6.87 8.3 2.4 0 4.17-1.35 5.07-3.65l.55 3.45h3.42V4.2h-3.42zm-4.42 12.75c-2.05 0-3.37-1.55-3.37-4.45s1.32-4.45 3.37-4.45c2.05 0 3.37 1.55 3.37 4.45s-1.32 4.45-3.37 4.45zM11.45 7.5c0-1.2.95-1.7 2.5-1.7 1.77 0 3.97.55 5.72 1.55V3.18C17.72 2.38 15.82 2 13.95 2 9.48 2 6.73 4.1 6.73 7.75c0 5.8 7.97 4.88 7.97 7.38 0 1.55-1.35 2.05-3.22 2.05-2.08 0-4.52-.85-6.53-2v4.27c2.18.95 4.37 1.4 6.53 1.4 4.62 0 7.52-2.28 7.52-6.03.01-6.26-7.55-5.07-7.55-7.32z" fill="#6772E5"/>
          </svg>
        </div>
      </div>
    </div>
  );
}