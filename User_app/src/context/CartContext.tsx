import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { CartAPI, CartItem } from '../api/cart.api';
import { useAuthContext } from './AuthContext';

interface CartContextType {
  cartItems: CartItem[];
  totalPrice: number;
  suggestions: any[];
  isLoading: boolean;
  addToCart: (serviceCategoryId: string, type?: 'MAIN' | 'EXTRA', clearExist?: boolean) => Promise<void>;
  removeFromCart: (serviceCategoryId: string, removeAll?: boolean) => Promise<void>;
  fetchCart: () => Promise<void>;
  fetchSuggestions: () => Promise<void>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const { accessToken, user } = useAuthContext();

  const fetchCart = async () => {
    if (!accessToken) return;
    try {
      setIsLoading(true);
      const res = await CartAPI.getCart();
      if (res.success && res.cart) {
        setCartItems(res.cart.items || []);
        setTotalPrice(res.cart.totalPrice || 0);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    if (!accessToken) return;
    try {
      const res = await CartAPI.getSuggestions();
      if (res.success && res.suggestions) {
        setSuggestions(res.suggestions);
      }
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    }
  };

  const addToCart = async (serviceCategoryId: string, type?: 'MAIN' | 'EXTRA', clearExist = false) => {
    // ⚡ Optimistic UI update: instantly mark item as added (0ms delay)
    const alreadyExists = cartItems.some((item) => item.serviceCategoryId === serviceCategoryId);
    if (!alreadyExists && !clearExist) {
      setCartItems((prev) => [
        ...prev,
        {
          _id: `temp-${serviceCategoryId}`,
          serviceCategoryId,
          type: type || 'MAIN',
          quantity: 1,
          price: 0,
          serviceCategoryName: '',
          durationInMinutes: 0,
          employeeCount: 1,
        } as CartItem,
      ]);
    }

    try {
      setIsLoading(true);
      const res = await CartAPI.addToCart(serviceCategoryId, type, clearExist);
      if (res.success && res.cart) {
        setCartItems(res.cart.items || []);
        setTotalPrice(res.cart.totalPrice || 0);
        // Non-blocking background fetch
        fetchSuggestions().catch(() => {});
      }
    } catch (err: any) {
      console.error('Failed to add to cart:', err);
      // Revert optimistic state on error
      if (!alreadyExists && !clearExist) {
        fetchCart();
      }
      if (err.response?.data?.errorType === 'DIFFERENT_DOMAIN') {
        Alert.alert(
          'Different Service Category',
          err.response.data.message || 'Your cart contains items from a different service category. Would you like to clear the cart and add this instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Clear & Add',
              style: 'destructive',
              onPress: () => addToCart(serviceCategoryId, type, true),
            },
          ]
        );
        return;
      }
      const msg = err.response?.data?.message || err.message || 'Failed to add item to cart';
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (serviceCategoryId: string, removeAll = false) => {
    // ⚡ Optimistic UI update: instantly remove item from cart state
    setCartItems((prev) => prev.filter((item) => item.serviceCategoryId !== serviceCategoryId));
    try {
      setIsLoading(true);
      const res = await CartAPI.removeFromCart(serviceCategoryId, removeAll);
      if (res.success && res.cart) {
        setCartItems(res.cart.items || []);
        setTotalPrice(res.cart.totalPrice || 0);
        fetchSuggestions().catch(() => {});
      }
    } catch (err) {
      console.error('Failed to remove from cart:', err);
      fetchCart();
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = () => {
    setCartItems([]);
    setTotalPrice(0);
    setSuggestions([]);
  };

  // Sync cart fetching with authentication status
  useEffect(() => {
    // ⛔ Only fetch for fully verified users.
    // New users have a tempToken before profile completion.
    // Fetching with tempToken returns 401 → FORCE_LOGOUT → slider screen.
    if (accessToken && user?.isVerified) {
      fetchCart();
      fetchSuggestions();
    } else {
      clearCart();
    }
  }, [accessToken, user]);

  return (
    <CartContext.Provider value={{
      cartItems,
      totalPrice,
      suggestions,
      isLoading,
      addToCart,
      removeFromCart,
      fetchCart,
      fetchSuggestions,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCartContext must be used inside CartProvider');
  }
  return ctx;
};
