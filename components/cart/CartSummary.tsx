'use client';

import { DollarSign, Calculator, ShoppingBag } from 'lucide-react';
import { getPriceBreakdown } from '@/lib/cart';
import { CartItem } from '@/lib/cart';

interface CartSummaryProps {
  items: CartItem[];
  className?: string;
  showDetails?: boolean;
}

export function CartSummary({ items, className = '', showDetails = true }: CartSummaryProps) {
  const breakdown = getPriceBreakdown(items);
  
  if (items.length === 0) {
    return (
      <div className={`border rounded-lg p-6 text-center ${className}`}>
        <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 space-y-3 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold text-lg">Order Summary</h3>
      </div>

      <div className="space-y-2">
        {/* Items count */}
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Items in cart:</span>
          <span>{items.length} {items.length === 1 ? 'number' : 'numbers'}</span>
        </div>

        {/* Price breakdown */}
        {showDetails && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base charges:</span>
              <span>${breakdown.baseTotal.toFixed(2)}</span>
            </div>
            
            {breakdown.smsTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SMS addons:</span>
                <span className="text-blue-600">${breakdown.smsTotal.toFixed(2)}</span>
              </div>
            )}
            
            {breakdown.forwardingTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Forwarding services:</span>
                <span className="text-purple-600">${breakdown.forwardingTotal.toFixed(2)}</span>
              </div>
            )}
          </>
        )}

        {/* Divider */}
        <div className="border-t pt-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span className="font-semibold">Total:</span>
            </div>
            <span className="text-xl font-bold text-primary">
              ${breakdown.grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Monthly breakdown if multiple months */}
        {showDetails && items.some(item => item.monthlyDuration > 1) && (
          <div className="text-xs text-muted-foreground pt-1 border-t">
            <p>* Prices shown include duration discounts where applicable</p>
            {items.some(item => item.smsEnabled && item.monthlyDuration >= 6) && (
              <p>* SMS-enabled numbers require 6-month minimum commitment</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}