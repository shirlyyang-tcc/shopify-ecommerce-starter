"use client";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingCartIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { useEffect } from "react";
import { toast } from "sonner";

export default function CartPage() {
  const { 
    cart, 
    isLoading, 
    error: cartContextError,
    clearCartData, 
    removeItem,
    updateItemQuantity
  } = useCart();

  const handleUpdateQuantity = async (lineId: string, newQuantity: number) => {
    if (!updateItemQuantity) return;
    
    if (newQuantity < 1) {
      toast.info("Item quantity must be at least 1. If you want to remove, please use the delete button.");
      return;
    }

    try {
      await updateItemQuantity(lineId, newQuantity);
      toast.success("Cart updated successfully");
    } catch (e) {
      console.error("Failed to update quantity from page:", e);
      toast.error("Failed to update quantity, please try again later.");
    }
  };

  const handleRemoveItem = async (lineId: string) => {
    if (!removeItem) return;
    try {
      await removeItem(lineId);
      toast.success("Item removed from cart successfully");
    } catch (e) {
      console.error("Failed to remove item from page:", e);
      toast.error("Failed to remove item, please try again later.");
    }
  };
  
  const handleClearCart = () => {
    clearCartData(); 
    toast.info("Local cart cleared");
  };

  useEffect(() => {
    if (cartContextError) {
      toast.error(`Cart error: ${cartContextError}`);
      console.error("Cart page error from context:", cartContextError);
    }
  }, [cartContextError]);

  if (isLoading && !cart) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-lg">Loading cart...</p>
      </div>
    );
  }

  const cartItems = cart?.lines || [];
  const subtotal = cart?.cost?.subtotalAmount?.amount || 0;
  const total = cart?.cost?.totalAmount?.amount || 0;
  const currencyCode = cart?.cost?.totalAmount?.currencyCode || 'USD';

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCartIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" strokeWidth={1}/>
          <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">
            It looks like you haven't added any items to your cart yet.
          </p>
          <Link href="/">
            <Button size="lg">Continue Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Product
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Price
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Quantity
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Total
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-16 w-16 relative">
                            {item.merchandise.image?.url ? (
                                <Image
                                  src={item.merchandise.image.url}
                                  alt={item.merchandise.image.altText || item.merchandise.product.title}
                                  fill
                                  className="object-cover rounded"
                                />
                            ) : (
                                <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">No Image</div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              <Link href={`/products/${item.merchandise.product.handle}`} className="hover:text-blue-600">
                                {item.merchandise.product.title}
                              </Link>
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.merchandise.title}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatPrice(item.merchandise.priceV2.amount, item.merchandise.priceV2.currencyCode)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center border border-gray-300 rounded-md w-28">
                          <button
                            className="px-2 py-1 disabled:opacity-50 text-gray-700 hover:bg-gray-100"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isLoading}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="text"
                            className="w-10 text-center border-none focus:ring-0 bg-transparent appearance-none"
                            value={item.quantity}
                            readOnly
                          />
                          <button
                            className="px-2 py-1 disabled:opacity-50 text-gray-700 hover:bg-gray-100"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={isLoading}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatPrice(item.merchandise.priceV2.amount * item.quantity, item.merchandise.priceV2.currencyCode)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          disabled={isLoading}
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
              <Link href="/">
                <Button variant="outline">Continue Shopping</Button>
              </Link>
              {cartItems.length > 0 && (
                <Button 
                  variant="outline"
                  onClick={handleClearCart} 
                  disabled={isLoading}
                  className="text-red-600 border-red-500 hover:bg-red-50 hover:text-red-700"
                >
                  Clear Cart
                </Button>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                Order Summary
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <div>Subtotal</div>
                  <div>{formatPrice(subtotal, currencyCode)}</div>
                </div>
                {cart?.cost?.totalTaxAmount && cart.cost.totalTaxAmount.amount > 0 && (
                    <div className="flex justify-between text-sm">
                        <div>Tax</div>
                        <div>{formatPrice(cart.cost.totalTaxAmount.amount, cart.cost.totalTaxAmount.currencyCode)}</div>
                    </div>
                )}
                <div className="border-t pt-4 flex justify-between font-bold text-lg">
                  <div>Total</div>
                  <div>{formatPrice(total, currencyCode)}</div>
                </div>
                <Button 
                    className="w-full mt-6 py-3 text-base"
                    disabled={isLoading || cartItems.length === 0 || !cart?.checkoutUrl}
                >
                  <a href={cart?.checkoutUrl} target="_blank" rel="noopener noreferrer">
                    Proceed to Checkout
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 