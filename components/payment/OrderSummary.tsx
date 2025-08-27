'use client';

import { CartItem, calculateItemTotal } from '@/lib/cart';

interface OrderSummaryProps {
  items: CartItem[];
  showDetails?: boolean;
  className?: string;
}

export function OrderSummary({ 
  items, 
  showDetails = true,
  className = ''
}: OrderSummaryProps) {
  // Calculate totals
  const setupFeePerNumber = 10;
  const setupTotal = items.length * setupFeePerNumber;
  
  let baseTotal = 0;
  let smsTotal = 0;
  let forwardingTotal = 0;
  
  items.forEach(item => {
    const monthlyBase = item.basePrice;
    const monthlySms = item.smsEnabled ? item.smsPrice : 0;
    const monthlyForwarding = item.forwardingType !== 'none' ? item.forwardingPrice : 0;
    
    baseTotal += monthlyBase * item.monthlyDuration;
    smsTotal += monthlySms * item.monthlyDuration;
    forwardingTotal += monthlyForwarding * item.monthlyDuration;
  });
  
  const subscriptionTotal = baseTotal + smsTotal + forwardingTotal;
  const grandTotal = setupTotal + subscriptionTotal;

  if (items.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
      
      {showDetails && (
        <div className="space-y-4 mb-6">
          {items.map((item) => (
            <div key={item.id} className="pb-4 border-b last:border-0">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium">{item.phoneNumber}</h4>
                  <p className="text-sm text-gray-600">
                    {item.countryName} • {item.cityName}
                  </p>
                  
                  {/* Service Details */}
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-gray-500">
                      Base: ${item.basePrice.toFixed(2)}/mo × {item.monthlyDuration} month{item.monthlyDuration > 1 ? 's' : ''}
                    </div>
                    {item.smsEnabled && (
                      <div className="text-xs text-gray-500">
                        SMS: ${item.smsPrice.toFixed(2)}/mo × {item.monthlyDuration} month{item.monthlyDuration > 1 ? 's' : ''}
                      </div>
                    )}
                    {item.forwardingType !== 'none' && (
                      <div className="text-xs text-gray-500">
                        Forwarding ({item.forwardingType}): ${item.forwardingPrice.toFixed(2)}/mo × {item.monthlyDuration} month{item.monthlyDuration > 1 ? 's' : ''}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Setup fee: ${setupFeePerNumber.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-medium">
                    ${(calculateItemTotal(item) + setupFeePerNumber).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Total for this number
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Price Breakdown */}
      <div className="space-y-2 pt-4 border-t">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Setup Fees ({items.length} number{items.length > 1 ? 's' : ''})</span>
          <span className="font-medium">${setupTotal.toFixed(2)}</span>
        </div>
        
        {baseTotal > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Base Service</span>
            <span className="font-medium">${baseTotal.toFixed(2)}</span>
          </div>
        )}
        
        {smsTotal > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">SMS Services</span>
            <span className="font-medium">${smsTotal.toFixed(2)}</span>
          </div>
        )}
        
        {forwardingTotal > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Call Forwarding</span>
            <span className="font-medium">${forwardingTotal.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between pt-3 border-t text-lg font-semibold">
          <span>Total Due</span>
          <span className="text-blue-600">${grandTotal.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Payment Notice */}
      <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
        <p>
          • One-time setup fee of ${setupFeePerNumber.toFixed(2)} per number
        </p>
        <p>
          • Service fees cover the selected duration upfront
        </p>
        <p>
          • All prices are in USD
        </p>
      </div>
    </div>
  );
}