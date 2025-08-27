'use client';

import { Trash2, Phone, MessageSquare, PhoneForwarded } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem as CartItemType, calculateItemTotal } from '@/lib/cart';

interface CartItemProps {
  item: CartItemType;
  onRemove: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<CartItemType>) => void;
  showDetails?: boolean;
}

export function CartItem({ item, onRemove, onUpdate, showDetails = true }: CartItemProps) {
  const itemTotal = calculateItemTotal(item);

  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDuration = parseInt(e.target.value);
    onUpdate?.(item.id, { monthlyDuration: newDuration });
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Phone className="h-4 w-4 text-gray-500" />
            <h3 className="font-semibold text-lg text-gray-900">{item.phoneNumber}</h3>
          </div>
          <p className="text-sm text-gray-600">
            {item.cityName}, {item.countryName} ({item.countryCode})
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.id)}
          className="text-red-600 hover:text-red-700"
          aria-label="Remove from cart"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Features */}
      <div className="flex flex-wrap gap-2">
        {item.smsEnabled && (
          <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-sm">
            <MessageSquare className="h-3 w-3" />
            <span>SMS Enabled</span>
          </div>
        )}
        {item.forwardingType !== 'none' && (
          <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-sm">
            <PhoneForwarded className="h-3 w-3" />
            <span>
              {item.forwardingType === 'call' && 'Call Forwarding'}
              {item.forwardingType === 'sms' && 'SMS Forwarding'}
              {item.forwardingType === 'both' && 'Call & SMS Forwarding'}
            </span>
          </div>
        )}
      </div>

      {/* Duration selector */}
      {showDetails && (
        <div className="flex items-center gap-2">
          <label htmlFor={`duration-${item.id}`} className="text-sm text-gray-600">
            Duration:
          </label>
          <select
            id={`duration-${item.id}`}
            value={item.monthlyDuration}
            onChange={handleDurationChange}
            className="border rounded px-2 py-1 text-sm text-gray-900"
            disabled={!onUpdate}
          >
            {item.smsEnabled ? (
              // SMS-enabled numbers require minimum 6 months
              <>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="24">24 months</option>
              </>
            ) : (
              // Regular numbers can be monthly
              <>
                <option value="1">1 month</option>
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="24">24 months</option>
              </>
            )}
          </select>
          {item.smsEnabled && (
            <span className="text-xs text-gray-500">(6 months minimum for SMS)</span>
          )}
        </div>
      )}

      {/* Pricing breakdown */}
      {showDetails && (
        <div className="space-y-1 pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Base price:</span>
            <span className="text-gray-900">${item.basePrice.toFixed(2)} × {item.monthlyDuration} months</span>
          </div>
          {item.smsEnabled && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">SMS addon:</span>
              <span className="text-gray-900">${item.smsPrice.toFixed(2)} × {item.monthlyDuration} months</span>
            </div>
          )}
          {item.forwardingType !== 'none' && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Forwarding:</span>
              <span className="text-gray-900">${item.forwardingPrice.toFixed(2)} × {item.monthlyDuration} months</span>
            </div>
          )}
          <div className="flex justify-between font-semibold pt-1 border-t">
            <span className="text-gray-900">Item total:</span>
            <span className="text-gray-900">${itemTotal.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Compact view - just show total */}
      {!showDetails && (
        <div className="flex justify-between font-semibold">
          <span>{item.monthlyDuration} month{item.monthlyDuration > 1 ? 's' : ''}</span>
          <span>${itemTotal.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}