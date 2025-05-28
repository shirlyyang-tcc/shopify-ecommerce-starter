"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { PackageSearch, ShoppingBag, MapPin, LogOut, CreditCard, Edit3 } from 'lucide-react';

// Define an interface for the order structure based on the Edge Function response
interface OrderLineItemVariant {
  title: string;
  image?: { url: string; altText?: string | null } | null;
  priceV2: { amount: number; currencyCode: string };
}
interface OrderLineItemNode {
  id: string;
  title: string;
  quantity: number;
  variant?: OrderLineItemVariant | null;
}
interface OrderLineItemEdge {
  node: OrderLineItemNode;
}
export interface Order {
  id: string;
  orderNumber: string;
  name: string; // Shopify's order name, e.g., #1001
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPriceV2: { amount: number; currencyCode: string };
  lineItems: { edges: OrderLineItemEdge[] };
}

const apiBaseUrl = process.env.NEXT_PUBLIC_DEV === 'true' 
    ? process.env.NEXT_PUBLIC_API_URL_DEV 
    : (process.env.NEXT_PUBLIC_API_URL || '');

export default function AccountPage() {
  const router = useRouter();
  const { customer, isLoading, logout, isAuthenticated, fetchCustomerData, user, customerAccessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [errorLoadingOrders, setErrorLoadingOrders] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated()) {
      router.replace('/account/login');
    } else if (isAuthenticated() && !customer) {
      // If authenticated but customer data is not yet loaded, fetch it.
      fetchCustomerData();
    }
  }, [isLoading, isAuthenticated, customer, router, fetchCustomerData]);

  useEffect(() => {
    if (!customerAccessToken) {
      // If not logged in (no access token), redirect to login page or show message
      // For this example, we assume the page is protected and user is available if token is present
      // If user is null but token exists, it might be an intermediate state or an issue.
      if (!user) {
        router.push('/account/login'); // Or handle as appropriate
      }
      return;
    }

    const fetchOrders = async () => {
      setIsLoadingOrders(true);
      setErrorLoadingOrders(null);
      try {
        const response = await fetch(`${apiBaseUrl}/orders/get`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ customerAccessToken }),
        });
        const data = await response.json();
        if (data.success && data.orders) {
          setOrders(data.orders);
        } else {
          throw new Error(data.message || 'Failed to fetch orders.');
        }
      } catch (error: unknown) {
        console.error("Error fetching orders:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setErrorLoadingOrders(errorMessage);
        toast.error("加载订单失败: " + errorMessage);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [customerAccessToken, router]);

  const handleLogout = async () => {
    await logout();
    toast.success("您已成功登出");
    router.push('/');
  };

  if (isLoading || (!isAuthenticated && typeof window !== 'undefined')) {
    // Show skeleton loaders while loading or if initial auth check is pending
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="w-full max-w-2xl mx-auto shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
            <Separator />
            <div>
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </div>
             <Separator />
            <div className="mt-6">
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!customer) {
    // This case should ideally be covered by the redirect in useEffect,
    // but as a fallback if customer data is not available after loading:
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>无法加载用户信息。请尝试重新登录。</p>
        <Button onClick={() => router.push('/account/login')} className="mt-4">前往登录</Button>
      </div>
    );
  }

  const getInitials = (name: string = '') => {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const displayName = customer.firstName || customer.lastName || '用户';
  const userEmail = customer.email || '无邮箱信息';

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">我的账户</h1>
        <p className="text-muted-foreground">管理您的个人信息、订单和偏好设置。</p>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Sidebar for navigation (optional, or for larger screens) */}
        <div className="md:col-span-1 space-y-6">
          <div className="flex flex-col items-center md:items-start p-6 border rounded-lg shadow-sm bg-card">
            <Avatar className="w-20 h-20 mb-4">
              <AvatarImage src={customer.photoURL || undefined} alt={displayName} />
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold text-center md:text-left">{displayName}</h2>
            <p className="text-sm text-muted-foreground text-center md:text-left mb-4">{userEmail}</p>
            <Button variant="outline" size="sm" className="w-full md:w-auto" onClick={() => toast.info("编辑个人资料功能待实现")}>
              <Edit3 className="mr-2 h-4 w-4" /> 编辑个人资料
            </Button>
          </div>
          
          <nav className="space-y-1">
            {/* Example Nav Items - expand as needed */}
            <Button variant="ghost" className="w-full justify-start">
                <PackageSearch className="mr-2 h-4 w-4" /> 我的订单
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => toast.info("地址管理功能待实现")}>
                <MapPin className="mr-2 h-4 w-4" /> 地址管理
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => toast.info("支付方式功能待实现")}>
                <CreditCard className="mr-2 h-4 w-4" /> 支付方式
            </Button>
            <Separator className="my-2" />
            <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> 登出
            </Button>
          </nav>
        </div>

        {/* Main content area */}
        <div className="md:col-span-2 space-y-8">
          <section>
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <ShoppingBag className="mr-3 h-6 w-6 text-primary"/>
              我的订单
            </h3>
            {isLoadingOrders ? (
              <div className="border rounded-lg p-6 text-center">
                <p className="text-muted-foreground">正在加载订单...</p>
              </div>
            ) : errorLoadingOrders ? (
              <div className="border rounded-lg p-6 text-center text-red-600">
                <p>加载订单失败: {errorLoadingOrders}</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="border rounded-lg p-6 text-center">
                <p className="text-muted-foreground">您还没有任何订单。</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push('/')}>开始购物</Button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg shadow-sm overflow-hidden bg-card">
                    <div className="p-4 sm:p-6 bg-muted/30">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                        <h4 className="text-lg font-semibold text-primary">
                          订单号: {order.name} {/* order.name is like #1001 */}
                        </h4>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${order.financialStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {order.financialStatus}
                        </span>
                      </div> 
                      <div className="text-sm text-muted-foreground space-y-1 sm:space-y-0 sm:flex sm:gap-6">
                        <span>下单日期: {new Date(order.processedAt).toLocaleDateString()}</span>
                        <span>总金额: {formatPrice(order.totalPriceV2.amount, order.totalPriceV2.currencyCode)}</span>
                        <span>发货状态: {order.fulfillmentStatus || 'UNFULFILLED'}</span>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6 space-y-3">
                      {order.lineItems.edges.map(itemEdge => (
                        <div key={itemEdge.node.id} className="flex items-start gap-4 py-2">
                          <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-muted">
                            {itemEdge.node.variant?.image?.url ? (
                              <Image 
                                src={itemEdge.node.variant.image.url} 
                                alt={itemEdge.node.variant.image.altText || itemEdge.node.title} 
                                fill 
                                className="object-cover"
                              />
                            ) : (
                              <PackageSearch className="w-8 h-8 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm leading-tight">{itemEdge.node.title}</p>
                            {itemEdge.node.variant?.title && itemEdge.node.variant.title !== 'Default Title' && (
                                <p className="text-xs text-muted-foreground">{itemEdge.node.variant.title}</p>
                            )}
                            <p className="text-xs text-muted-foreground">数量: {itemEdge.node.quantity}</p>
                          </div>
                          <p className="text-sm font-medium ml-auto whitespace-nowrap">
                            {itemEdge.node.variant ? 
                                formatPrice(itemEdge.node.variant.priceV2.amount * itemEdge.node.quantity, itemEdge.node.variant.priceV2.currencyCode) : 'N/A'}
                          </p>
                        </div>
                      ))}
                      <div className="pt-2 text-right">
                        <Link href={`/account/orders/${order.id.split('/').pop()}`} passHref>
                           <Button variant="ghost" size="sm">查看详情</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          
          {/* Placeholder for other account sections */}
          {/* 
          <Separator />
          <section>
            <h3 className="text-2xl font-semibold mb-4">地址管理</h3>
            <div className="border rounded-lg p-6 text-center text-muted-foreground">
                <p>您还没有保存任何地址。</p>
                <Button variant="outline" className="mt-4">添加新地址</Button>
            </div>
          </section>
          <Separator />
          <section>
            <h3 className="text-2xl font-semibold mb-4">支付方式</h3>
             <div className="border rounded-lg p-6 text-center text-muted-foreground">
                <p>您还没有保存任何支付方式。</p>
                <Button variant="outline" className="mt-4">添加支付方式</Button>
            </div>
          </section>
          */}
        </div>
      </div>
    </div>
  );
} 