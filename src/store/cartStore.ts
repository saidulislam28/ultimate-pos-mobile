import { create } from 'zustand';
import { Product } from '@/components/ProductCard';

export interface CartItem extends Product {
  cartItemId: string; 
  quantity: number;
  unit_price: number;
  variation_id?: number | string;
}

interface CartState {
  cartItems: CartItem[];
  cartTotal: number;
  addItem: (product: Product, variationId?: number | string) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cartItems: [],
  cartTotal: 0,
  
  addItem: (product: Product, variationId?: number | string) => {
    const { cartItems } = get();
    // Default variation and price handling
    const varId = variationId || (product.product_variations?.[0]?.variations?.[0]?.id) || '';
    const priceStr = product.sell_price_inc_tax || product.price || '0';
    const unitPrice = parseFloat(priceStr.toString().replace(/,/g, ''));
    
    const existingItemIndex = cartItems.findIndex(
      item => item.id === product.id && item.variation_id === varId
    );

    let newItems = [...cartItems];

    if (existingItemIndex >= 0) {
      newItems[existingItemIndex].quantity += 1;
    } else {
      newItems.push({
        ...product,
        cartItemId: `${product.id}-${varId}`,
        quantity: 1,
        unit_price: unitPrice,
        variation_id: varId,
      });
    }

    const newTotal = newItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    set({ cartItems: newItems, cartTotal: newTotal });
  },

  removeItem: (cartItemId: string) => {
    const { cartItems } = get();
    const newItems = cartItems.filter(item => item.cartItemId !== cartItemId);
    const newTotal = newItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    set({ cartItems: newItems, cartTotal: newTotal });
  },

  updateQuantity: (cartItemId: string, delta: number) => {
    const { cartItems } = get();
    let newItems = [...cartItems];
    const existingItemIndex = newItems.findIndex(item => item.cartItemId === cartItemId);

    if (existingItemIndex >= 0) {
      const newQuantity = newItems[existingItemIndex].quantity + delta;
      if (newQuantity <= 0) {
        newItems.splice(existingItemIndex, 1);
      } else {
        newItems[existingItemIndex].quantity = newQuantity;
      }
    }

    const newTotal = newItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    set({ cartItems: newItems, cartTotal: newTotal });
  },

  clearCart: () => set({ cartItems: [], cartTotal: 0 }),
}));
