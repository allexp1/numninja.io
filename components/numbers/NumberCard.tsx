'use client';

import { AvailableNumber } from '@/lib/mock-data';
import { Phone, MessageSquare, ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface NumberCardProps {
  number: AvailableNumber;
  onAddToCart: (number: AvailableNumber, addSms: boolean) => void;
}

export function NumberCard({ number, onAddToCart }: NumberCardProps) {
  const [addSms, setAddSms] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(number, addSms);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const totalMonthlyPrice = number.monthlyPrice + (addSms && number.smsEnabled ? (number.smsMonthlyPrice || 0) : 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 font-mono">
            {number.number}
          </h3>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-600">Voice</span>
            </div>
            {number.smsEnabled && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">SMS</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            ${totalMonthlyPrice.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">per month</div>
        </div>
      </div>

      {number.smsEnabled && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={addSms}
              onChange={(e) => setAddSms(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Add SMS capability (+${number.smsMonthlyPrice?.toFixed(2)}/mo)
            </span>
          </label>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {number.setupFee > 0 ? (
            <span>Setup fee: ${number.setupFee.toFixed(2)}</span>
          ) : (
            <span>No setup fee</span>
          )}
        </div>
        <Button
          onClick={handleAddToCart}
          disabled={isAdded}
          className={`${
            isAdded 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          } text-white`}
        >
          {isAdded ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Added
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </>
          )}
        </Button>
      </div>
    </div>
  );
}