'use client';

import { useEffect } from 'react';
import { useCartStore, CartItem, calculateItemTotal, getPriceBreakdown } from '@/lib/cart';

export const useCart = () => {
  const {
    items,
    addItem,
    removeItem,
    updateItem,
    clearCart,
    getTotal,
    getItemCount,
    getItemById,
  } = useCartStore();

  // Hydrate the store on mount
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    clearCart,
    getTotal,
    getItemCount,
    getItemById,
    calculateItemTotal,
    getPriceBreakdown: () => getPriceBreakdown(items),
  };
};

// Hook for adding a phone number to cart with proper formatting
export const useAddToCart = () => {
  const { addItem } = useCart();

  const addPhoneToCart = (phoneData: {
    countryCode: string;
    countryName: string;
    areaCode: string;
    cityName: string;
    phoneNumber: string;
    basePrice: number;
    smsEnabled?: boolean;
    smsPrice?: number;
    forwardingType?: 'none' | 'call' | 'sms' | 'both';
    forwardingDestination?: string;
    forwardingPrice?: number;
    monthlyDuration?: number;
  }) => {
    const cartItem: CartItem = {
      id: '', // Will be set by the store
      countryCode: phoneData.countryCode,
      countryName: phoneData.countryName,
      areaCode: phoneData.areaCode,
      cityName: phoneData.cityName,
      phoneNumber: phoneData.phoneNumber,
      basePrice: phoneData.basePrice,
      smsEnabled: phoneData.smsEnabled || false,
      smsPrice: phoneData.smsPrice || 0,
      forwardingType: phoneData.forwardingType || 'none',
      forwardingDestination: phoneData.forwardingDestination || '',
      forwardingPrice: phoneData.forwardingPrice || 0,
      monthlyDuration: phoneData.monthlyDuration || 1,
    };

    addItem(cartItem);
  };

  return { addPhoneToCart };
};