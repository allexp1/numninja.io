'use client';

import { AvailableNumber } from '@/lib/mock-data';
import { NumberCard } from './NumberCard';
import { Loader2 } from 'lucide-react';

interface NumberDisplayProps {
  numbers: AvailableNumber[];
  loading?: boolean;
  onAddToCart: (number: AvailableNumber, addSms: boolean) => void;
}

export function NumberDisplay({ numbers, loading = false, onAddToCart }: NumberDisplayProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600">Loading available numbers...</span>
      </div>
    );
  }

  if (numbers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          No numbers available for the selected criteria.
        </p>
        <p className="text-gray-400 mt-2">
          Please try a different country or area code.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Available Numbers
        </h2>
        <span className="text-sm text-gray-500">
          {numbers.length} number{numbers.length !== 1 ? 's' : ''} found
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {numbers.map((number) => (
          <NumberCard
            key={number.id}
            number={number}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
}