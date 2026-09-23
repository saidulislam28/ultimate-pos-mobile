import { create } from 'zustand';

export interface CartItem {
  product_id: number;
  variation_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  discount_type: 'fixed' | 'percentage';
  discount_amount: number;
  tax_rate_id?: number;
  enable_stock?: boolean;
  qty_available?: number;
}

export interface PosState {
  location_id: number | null;
  contact_id: number | null;
  status: 'final' | 'draft';
  discount_type: 'fixed' | 'percentage';
  discount_amount: number;
  shipping_charges: number;
  
  cart: CartItem[];
  
  payment: {
    amount: number;
    method: 'cash' | 'card' | 'bank_transfer' | 'other';
    account_id?: number | null;
    note?: string;
  };
  
  // Actions
  setCustomer: (id: number) => void;
  setLocation: (id: number) => void;
  setStatus: (status: 'final' | 'draft') => void;
  addToCart: (item: CartItem) => void;
  updateCartItemQty: (index: number, qty: number) => void;
  updateCartItemDiscount: (index: number, type: 'fixed' | 'percentage', amount: number) => void;
  removeFromCart: (index: number) => void;
  setGlobalDiscount: (type: 'fixed' | 'percentage', amount: number) => void;
  setShippingCharges: (amount: number) => void;
  setPayment: (paymentData: Partial<PosState['payment']>) => void;
  clearCart: () => void;
  
  // Computed (Getters)
  getSubTotal: () => number;
  getGrandTotal: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  location_id: null,
  contact_id: null,
  status: 'final',
  discount_type: 'fixed',
  discount_amount: 0,
  shipping_charges: 0,
  
  cart: [],
  
  payment: {
    amount: 0,
    method: 'cash',
    account_id: null,
    note: '',
  },

  setCustomer: (id) => set({ contact_id: id }),
  setLocation: (id) => set({ location_id: id }),
  setStatus: (status) => set({ status }),
  
  addToCart: (item) => set((state) => {
    // Check if item already exists in cart based on variation_id
    const existingIndex = state.cart.findIndex(i => i.variation_id === item.variation_id);
    
    if (existingIndex >= 0) {
      const newCart = [...state.cart];
      const newQty = newCart[existingIndex].quantity + item.quantity;
      
      // Stock validation
      if (item.enable_stock && item.qty_available !== undefined && newQty > item.qty_available) {
        return state; // Ignore adding if over stock
      }
      
      newCart[existingIndex].quantity = newQty;
      return { cart: newCart };
    }
    
    return { cart: [...state.cart, item] };
  }),

  updateCartItemQty: (index, qty) => set((state) => {
    const newCart = [...state.cart];
    if (qty > 0) {
      newCart[index].quantity = qty;
    }
    return { cart: newCart };
  }),
  
  updateCartItemDiscount: (index, type, amount) => set((state) => {
    const newCart = [...state.cart];
    newCart[index].discount_type = type;
    newCart[index].discount_amount = amount;
    return { cart: newCart };
  }),

  removeFromCart: (index) => set((state) => ({
    cart: state.cart.filter((_, i) => i !== index)
  })),

  setGlobalDiscount: (type, amount) => set({ 
    discount_type: type, 
    discount_amount: amount 
  }),
  
  setShippingCharges: (amount) => set({ 
    shipping_charges: amount 
  }),

  setPayment: (paymentData) => set((state) => ({
    payment: { ...state.payment, ...paymentData }
  })),

  clearCart: () => set({
    location_id: null,
    contact_id: null,
    status: 'final',
    discount_type: 'fixed',
    discount_amount: 0,
    shipping_charges: 0,
    cart: [],
    payment: {
      amount: 0,
      method: 'cash',
      account_id: null,
      note: '',
    },
  }),

  getSubTotal: () => {
    const { cart } = get();
    return cart.reduce((total, item) => {
      let itemTotal = item.quantity * item.unit_price;
      
      // Apply item discount
      if (item.discount_type === 'fixed') {
        itemTotal -= (item.discount_amount * item.quantity);
      } else if (item.discount_type === 'percentage') {
        itemTotal -= (itemTotal * (item.discount_amount / 100));
      }
      
      return total + itemTotal;
    }, 0);
  },

  getGrandTotal: () => {
    const { getSubTotal, discount_type, discount_amount, shipping_charges } = get();
    let total = getSubTotal();

    // Apply global discount
    if (discount_type === 'fixed') {
      total -= discount_amount;
    } else if (discount_type === 'percentage') {
      total -= (total * (discount_amount / 100));
    }

    // Add shipping charges
    total += shipping_charges;

    return Math.max(0, total); // Ensure it doesn't go below 0
  }
}));
