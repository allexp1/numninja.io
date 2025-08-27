import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  countryCode: string;
  countryName: string;
  areaCode: string;
  cityName: string;
  phoneNumber: string;
  basePrice: number;
  smsEnabled: boolean;
  smsPrice: number;
  forwardingType: 'none' | 'call' | 'sms' | 'both';
  forwardingDestination: string;
  forwardingPrice: number;
  monthlyDuration: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getItemById: (id: string) => CartItem | undefined;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item: CartItem) => {
        // Enforce 6-month minimum for SMS-enabled numbers
        if (item.smsEnabled && item.monthlyDuration < 6) {
          item.monthlyDuration = 6;
        }

        set((state) => ({
          items: [...state.items, { ...item, id: `${item.phoneNumber}-${Date.now()}` }],
        }));
      },

      removeItem: (id: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateItem: (id: string, updates: Partial<CartItem>) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id === id) {
              const updatedItem = { ...item, ...updates };
              
              // Enforce 6-month minimum for SMS-enabled numbers
              if (updatedItem.smsEnabled && updatedItem.monthlyDuration < 6) {
                updatedItem.monthlyDuration = 6;
              }
              
              return updatedItem;
            }
            return item;
          }),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          let itemTotal = item.basePrice * item.monthlyDuration;
          
          if (item.smsEnabled) {
            itemTotal += item.smsPrice * item.monthlyDuration;
          }
          
          if (item.forwardingType !== 'none') {
            itemTotal += item.forwardingPrice * item.monthlyDuration;
          }
          
          return total + itemTotal;
        }, 0);
      },

      getItemCount: () => {
        return get().items.length;
      },

      getItemById: (id: string) => {
        return get().items.find((item) => item.id === id);
      },
    }),
    {
      name: 'numninja-cart',
      skipHydration: true,
    }
  )
);

// Helper function to calculate item total
export const calculateItemTotal = (item: CartItem): number => {
  let total = item.basePrice * item.monthlyDuration;
  
  if (item.smsEnabled) {
    total += item.smsPrice * item.monthlyDuration;
  }
  
  if (item.forwardingType !== 'none') {
    total += item.forwardingPrice * item.monthlyDuration;
  }
  
  return total;
};

// Helper function to get price breakdown
export const getPriceBreakdown = (items: CartItem[]) => {
  let baseTotal = 0;
  let smsTotal = 0;
  let forwardingTotal = 0;

  items.forEach((item) => {
    baseTotal += item.basePrice * item.monthlyDuration;
    
    if (item.smsEnabled) {
      smsTotal += item.smsPrice * item.monthlyDuration;
    }
    
    if (item.forwardingType !== 'none') {
      forwardingTotal += item.forwardingPrice * item.monthlyDuration;
    }
  });

  return {
    baseTotal,
    smsTotal,
    forwardingTotal,
    grandTotal: baseTotal + smsTotal + forwardingTotal,
  };
};