"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import { PackageSearch, ShoppingBag, MapPin, LogOut, CreditCard, Edit3 } from 'lucide-react';
import { Order } from '@/interfaces/order';

const apiBaseUrl = '';

export default function AccountPage() {
  const router = useRouter();
  const { customer, isLoading, logout, isAuthenticated, fetchCustomerData, customerAccessToken } = useAuth();
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
      router.push('/account/login'); 
      
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
        toast.error("Failed to load orders: " + errorMessage);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [customerAccessToken, router]);

  const handleLogout = async () => {
    await logout();
    toast.success("You have been successfully logged out.");
    router.push('/');
  };

  if (isLoading || (!isAuthenticated && typeof window !== 'undefined')) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="w-full max-w-2xl mx-auto shadow-lg p-6 border rounded-lg">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-6" />
          <div className="flex items-center space-x-4 mb-6">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <Separator className="mb-6"/>
          <div>
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Separator className="my-6" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    );
  }
  
  if (!customer) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Could not load user information. Please try logging in again.</p>
        <Button onClick={() => router.push('/account/login')} className="mt-4">Go to Login</Button>
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

  const displayName = customer.firstName || customer.lastName || 'User';
  const userEmail = customer.email || 'No email information';

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">My Account</h1>
        <p className="text-muted-foreground">Manage your profile, orders, and preferences.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="flex flex-col items-center md:items-start p-6 border rounded-lg shadow-sm bg-card">
            <Avatar className="w-20 h-20 mb-4">
              <AvatarImage src={customer.photoURL || undefined} alt={displayName} />
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold text-center md:text-left">{displayName}</h2>
            <p className="text-sm text-muted-foreground text-center md:text-left mb-4">{userEmail}</p>
            <Button variant="outline" size="sm" className="w-full md:w-auto" onClick={() => toast.info("Edit profile functionality is pending.")}>
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          </div>
          
          <nav className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
                <PackageSearch className="mr-2 h-4 w-4" /> My Orders
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => toast.info("Address management functionality is pending.")}>
                <MapPin className="mr-2 h-4 w-4" /> Address Management
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => toast.info("Payment methods functionality is pending.")}>
                <CreditCard className="mr-2 h-4 w-4" /> Payment Methods
            </Button>
            <Separator className="my-2" />
            <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </nav>
        </div>

        <div className="md:col-span-2 space-y-8">
          <section>
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <ShoppingBag className="mr-3 h-6 w-6 text-primary"/>
              My Orders
            </h3>
            {isLoadingOrders ? (
              <div className="border rounded-lg p-6 text-center">
                <p className="text-muted-foreground">Loading orders...</p>
              </div>
            ) : errorLoadingOrders ? (
              <div className="border rounded-lg p-6 text-center text-red-600">
                <p>Failed to load orders: {errorLoadingOrders}</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="border rounded-lg p-6 text-center">
                <p className="text-muted-foreground">You don&apos;t have any orders yet.</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push('/')}>Start Shopping</Button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg shadow-sm overflow-hidden bg-card">
                    <div className="p-4 sm:p-6 bg-muted/30">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                        <h4 className="text-lg font-semibold text-primary">
                          Order: {order.name}
                        </h4>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${order.financialStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {order.financialStatus}
                        </span>
                      </div> 
                      <div className="text-sm text-muted-foreground space-y-1 sm:space-y-0 sm:flex sm:gap-6">
                        <span>Order Date: {new Date(order.processedAt).toLocaleDateString()}</span>
                        <span>Total: {formatPrice(order.totalPriceV2.amount, order.totalPriceV2.currencyCode)}</span>
                        <span>Fulfillment Status: {order.fulfillmentStatus || 'UNFULFILLED'}</span>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6 space-y-3">
                      {order.lineItems.edges.map(itemEdge => (
                        <div key={itemEdge.node.title} className="flex items-start gap-4 py-2">
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
                            <p className="text-xs text-muted-foreground">Quantity: {itemEdge.node.quantity}</p>
                          </div>
                          <p className="text-sm font-medium ml-auto whitespace-nowrap">
                            {itemEdge.node.variant ? 
                                formatPrice(itemEdge.node.variant.priceV2.amount * itemEdge.node.quantity, itemEdge.node.variant.priceV2.currencyCode) : 'N/A'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          
          {/* Placeholder for other account sections */}
        </div>
      </div>
    </div>
  );
} 