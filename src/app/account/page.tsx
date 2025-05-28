"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

export default function AccountPage() {
  const router = useRouter();
  const { customer, isLoading, logout, isAuthenticated, fetchCustomerData } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated()) {
      router.replace('/account/login');
    } else if (isAuthenticated() && !customer) {
      // If authenticated but customer data is not yet loaded, fetch it.
      fetchCustomerData();
    }
  }, [isLoading, isAuthenticated, customer, router, fetchCustomerData]);

  const handleLogout = async () => {
    await logout();
    router.push('/'); // Redirect to homepage after logout
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

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName ? firstName[0] : '';
    const last = lastName ? lastName[0] : '';
    return `${first}${last}`.toUpperCase() || 'U'; // Default to 'U' for User
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">我的账户</CardTitle>
          <CardDescription>查看和管理您的账户信息。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4 p-4 bg-secondary/20 rounded-lg">
            <Avatar className="h-16 w-16 text-xl">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(customer.firstName, customer.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-semibold">
                {customer.firstName || '用户'} {customer.lastName || ''}
              </h2>
              <p className="text-muted-foreground">{customer.email}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-xl font-semibold mb-3">账户详情</h3>
            <div className="space-y-2 text-sm">
              <p><strong>名字:</strong> {customer.firstName || '未提供'}</p>
              <p><strong>姓氏:</strong> {customer.lastName || '未提供'}</p>
              <p><strong>邮箱:</strong> {customer.email || '未提供'}</p>
              <p><strong>电话:</strong> {customer.phone || '未提供'}</p>
              {/* Add more customer details as needed */}
            </div>
          </div>
          
          <Separator />

          {/* Placeholder for Orders */}
          <div>
            <h3 className="text-xl font-semibold mb-3">我的订单</h3>
            <div className="border rounded-lg p-6 text-center text-muted-foreground">
              <p>您还没有任何订单。</p>
              {/* Later, list orders here */}
              <Button variant="outline" className="mt-4" onClick={() => router.push('/')}>开始购物</Button>
            </div>
          </div>

          <Separator />

          {/* Placeholder for Addresses */}
          <div>
            <h3 className="text-xl font-semibold mb-3">我的地址</h3>
            <div className="border rounded-lg p-6 text-center text-muted-foreground">
              <p>您还没有保存任何地址。</p>
              {/* Later, list addresses and add new address button here */}
              <Button variant="outline" className="mt-4">添加新地址</Button>  {/* Placeholder action */}
            </div>
          </div>

        </CardContent>
        <CardFooter className="border-t pt-6">
          <Button variant="destructive" onClick={handleLogout} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? '正在登出...' : '登出账户'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 