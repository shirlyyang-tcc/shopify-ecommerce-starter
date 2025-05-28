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
      toast.info("商品数量至少为1。如需移除，请使用删除按钮。");
      return;
    }

    try {
      await updateItemQuantity(lineId, newQuantity);
      toast.success("购物车已更新");
    } catch (e) {
      console.error("Failed to update quantity from page:", e);
      toast.error("更新数量失败，请稍后再试。");
    }
  };

  const handleRemoveItem = async (lineId: string) => {
    if (!removeItem) return;
    try {
      await removeItem(lineId);
      toast.success("商品已从购物车移除");
    } catch (e) {
      console.error("Failed to remove item from page:", e);
      toast.error("移除商品失败，请稍后再试。");
    }
  };
  
  const handleClearCart = () => {
    clearCartData(); 
    toast.info("本地购物车已清空");
  };

  useEffect(() => {
    if (cartContextError) {
      toast.error(`购物车错误: ${cartContextError}`);
      console.error("Cart page error from context:", cartContextError);
    }
  }, [cartContextError]);

  if (isLoading && !cart) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-lg">正在加载购物车...</p>
      </div>
    );
  }

  const cartItems = cart?.lines || [];
  const subtotal = cart?.cost?.subtotalAmount?.amount || 0;
  const total = cart?.cost?.totalAmount?.amount || 0;
  const currencyCode = cart?.cost?.totalAmount?.currencyCode || 'USD';

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">购物车</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCartIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" strokeWidth={1}/>
          <h2 className="text-2xl font-semibold mb-4">您的购物车是空的</h2>
          <p className="text-gray-600 mb-8">
            看起来您还没有将任何商品添加到购物车。
          </p>
          <Link href="/">
            <Button size="lg">继续购物</Button>
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
                      商品
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      价格
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      数量
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      总计
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">操作</span>
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
                                <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">无图</div>
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
                <Button variant="outline">继续购物</Button>
              </Link>
              {cartItems.length > 0 && (
                <Button 
                  variant="outline"
                  onClick={handleClearCart} 
                  disabled={isLoading}
                  className="text-red-600 border-red-500 hover:bg-red-50 hover:text-red-700"
                >
                  清空购物车
                </Button>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                订单摘要
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <div>小计</div>
                  <div>{formatPrice(subtotal, currencyCode)}</div>
                </div>
                {cart?.cost?.totalTaxAmount && cart.cost.totalTaxAmount.amount > 0 && (
                    <div className="flex justify-between text-sm">
                        <div>税费</div>
                        <div>{formatPrice(cart.cost.totalTaxAmount.amount, cart.cost.totalTaxAmount.currencyCode)}</div>
                    </div>
                )}
                <div className="border-t pt-4 flex justify-between font-bold text-lg">
                  <div>总计</div>
                  <div>{formatPrice(total, currencyCode)}</div>
                </div>
                <Button 
                    asChild 
                    className="w-full mt-6 py-3 text-base"
                    disabled={isLoading || cartItems.length === 0 || !cart?.checkoutUrl}
                >
                  <a href={cart?.checkoutUrl} target="_blank" rel="noopener noreferrer">
                    前往结算
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