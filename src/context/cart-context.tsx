'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ProductVariant, ProductImage } from '@/interfaces/product'; // Assuming ProductImage is also needed
import { useAuth } from './auth-context';
// Interface for a line item in the cart
export interface CartLineItem {
  id: string; // Line item ID
  quantity: number;
  merchandise: ProductVariant & { 
    // Enhance merchandise with product details directly if needed, or keep it simple
    image?: ProductImage | null; // Already on ProductVariant
    priceV2: { amount: number; currencyCode: string }; // Already on ProductVariant as price & currencyCode
    product: { title: string; handle: string; };
  };
  // Add other line item details if your API returns them and you need them
}

// Interface for the cart object (matching functions/cart/get.js output)
export interface Cart {
  id: string;
  checkoutUrl: string;
  createdAt: string;
  updatedAt: string;
  lines: CartLineItem[]; // Simplified from edges/node structure for easier use
  cost: {
    totalAmount: { amount: number; currencyCode: string };
    subtotalAmount: { amount: number; currencyCode: string };
    totalTaxAmount?: { amount: number; currencyCode: string } | null;
  };
  totalQuantity: number;
}

// Intermediate type for raw API response before processing lines
interface RawShopifyCart {
  id: string;
  checkoutUrl: string;
  createdAt: string;
  updatedAt: string;
  lines: {
    edges: Array<{ node: CartLineItem }>
  } | null; // lines can be null if cart is empty initially from create
  cost: {
    totalAmount: { amount: number; currencyCode: string };
    subtotalAmount: { amount: number; currencyCode: string };
    totalTaxAmount?: { amount: number; currencyCode: string } | null;
  };
  totalQuantity: number;
  // Potentially other fields not mapped directly to Cart interface
}

interface CartContextType {
  cart: Cart | null;
  cartId: string | null;
  isLoading: boolean;
  error: string | null;
  loadCart: (id: string) => Promise<void>;
  createCart: () => Promise<string | null>; // Returns new cartId or null
  addItem: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  updateItemQuantity: (lineId: string, quantity: number) => Promise<void>;
  clearCartData: () => void; // For logout or manual clear
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const SHOPIFY_CART_ID_LS_KEY = 'shopifyCartId';
const apiBaseUrl = process.env.NEXT_PUBLIC_DEV === 'true' 
    ? process.env.NEXT_PUBLIC_API_URL_DEV 
    : (process.env.NEXT_PUBLIC_API_URL || '');

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartId, setCartIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // EXAMPLE: Access auth state. Replace with your actual auth context usage.
  // const { isLoggedIn, customerAccessToken } = useAuth(); 
  // For demonstration, let's assume these are available or null if not logged in.
  // You will need to integrate this with your actual auth system.
  const {customerAccessToken} = useAuth(); // Placeholder - REPLACE THIS with actual token from your auth context

  const processCartData = (apiCart: RawShopifyCart): Cart => {
    return {
      id: apiCart.id,
      checkoutUrl: apiCart.checkoutUrl,
      createdAt: apiCart.createdAt,
      updatedAt: apiCart.updatedAt,
      lines: apiCart.lines?.edges?.map((edge) => edge.node) || [],
      cost: apiCart.cost,
      totalQuantity: apiCart.totalQuantity,
    };
  };

  const loadCart = useCallback(async (id: string) => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/cart/get?cartId=${id}`);
      // const response = await fetch(`${apiBaseUrl}/cart/get?cartId=${id}`);
      const data = await response.json();
      // Assuming data.cart matches RawShopifyCart structure from the API
      if (data.success && data.cart) {
        const processedCart = processCartData(data.cart as RawShopifyCart);
        setCart(processedCart);
        setCartIdState(processedCart.id);
        if (typeof window !== 'undefined') {
            localStorage.setItem(SHOPIFY_CART_ID_LS_KEY, processedCart.id);
        }
      } else if (response.status === 404 || (data.cart === null && data.message?.includes("not found"))) {
        // Cart not found, clear local storage and state
        console.warn(`Cart with ID ${id} not found. Clearing local cart data.`);
        if (typeof window !== 'undefined') localStorage.removeItem(SHOPIFY_CART_ID_LS_KEY);
        setCart(null);
        setCartIdState(null);
      } else {
        throw new Error(data.message || 'Failed to load cart.');
      }
    } catch (err: unknown) {
      console.error('Error loading cart:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while loading cart.');
      // Optionally clear cart if loading fails critically
      // setCart(null);
      // setCartIdState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load cartId from local storage on initial mount and try to load the cart
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCartId = localStorage.getItem(SHOPIFY_CART_ID_LS_KEY);
      if (storedCartId) {
        setCartIdState(storedCartId); // Set cartId first
        loadCart(storedCartId);     // Then load the cart details
      }
    }
  }, [loadCart]);

  const createCart = async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    let requestBody = {};
    // Use the customerAccessToken from the (assumed) auth context
    if (customerAccessToken) { // Check if customerAccessToken is available
      requestBody = { customerAccessToken };
    }

    try {
      const response = await fetch(`${apiBaseUrl}/cart/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send an empty body {} for anonymous cart or { customerAccessToken: token } for logged-in user
        body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined,
      });
      const data = await response.json();
      if (data.success && data.cart?.id) {
        // Assuming data.cart matches RawShopifyCart structure
        const processedCart = processCartData(data.cart as RawShopifyCart);
        setCart(processedCart);
        setCartIdState(processedCart.id);
        if (typeof window !== 'undefined') {
          localStorage.setItem(SHOPIFY_CART_ID_LS_KEY, processedCart.id);
        }
        return processedCart.id;
      } else {
        throw new Error(data.message || 'Failed to create cart.');
      }
    } catch (err: unknown) {
      console.error('Error creating cart:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while creating cart.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (variantId: string, quantity: number) => {
    let currentCartId = cartId;
    if (!currentCartId) {
      currentCartId = await createCart();
      if (!currentCartId) {
        // Error handled by createCart
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId: currentCartId, variantId, quantity }),
      });
      const data = await response.json();
      if (data.success && data.cart) {
        // Assuming data.cart matches RawShopifyCart structure
        const processedCart = processCartData(data.cart as RawShopifyCart);
        setCart(processedCart);
        setCartIdState(processedCart.id); // Shopify might return the same or a new cart ID
        if (typeof window !== 'undefined' && processedCart.id) {
             localStorage.setItem(SHOPIFY_CART_ID_LS_KEY, processedCart.id);
        }
        // toast.success('Item added to cart!'); // Handled in component for more context
      } else {
        throw new Error(data.message || 'Failed to add item to cart.');
      }
    } catch (err: unknown) {
      console.error('Error adding item to cart:', err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(message);
      // toast.error(`Failed to add item: ${message}`); // Handled in component
    } finally {
      setIsLoading(false);
    }
  };
  
  const removeItem = async (lineId: string) => {
    if (!cartId) {
      setError("Cannot remove item: Cart ID is missing.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/cart/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId, lineIds: [lineId] }),
      });
      const data = await response.json();
      if (data.success && data.cart) {
        const processedCart = processCartData(data.cart as RawShopifyCart);
        setCart(processedCart);
      } else {
        throw new Error(data.message || 'Failed to remove item from cart.');
      }
    } catch (err: unknown) {
      console.error('Error removing item from cart:', err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateItemQuantity = async (lineId: string, quantity: number) => {
    if (!cartId) {
      setError("Cannot update item quantity: Cart ID is missing.");
      return;
    }
    if (quantity <= 0) {
      console.log("Updating quantity to 0, Shopify might remove this line item.");
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/cart/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId, lineId, quantity }),
      });
      const data = await response.json();
      if (data.success && data.cart) {
        const processedCart = processCartData(data.cart as RawShopifyCart);
        setCart(processedCart);
      } else {
        throw new Error(data.message || 'Failed to update item quantity.');
      }
    } catch (err: unknown) {
      console.error('Error updating item quantity:', err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearCartData = () => {
    setCart(null);
    setCartIdState(null);
    if (typeof window !== 'undefined') {
        localStorage.removeItem(SHOPIFY_CART_ID_LS_KEY);
    }
    console.log("Cart data cleared.");
  };

  return (
    <CartContext.Provider value={{
      cart, 
      cartId, 
      isLoading, 
      error, 
      loadCart, 
      createCart, 
      addItem, 
      removeItem,
      updateItemQuantity,
      clearCartData 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 