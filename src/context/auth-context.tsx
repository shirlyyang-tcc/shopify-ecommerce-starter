"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Customer } from '@/interfaces/customer';

interface AuthContextType {
  customer: Customer | null;
  customerAccessToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; } | void>;
  register: (details: { firstName?: string; lastName?: string; email: string; password: string }) => Promise<{ success: boolean; error?: string; } | void>;
  logout: () => Promise<void>;
  fetchCustomerData: () => Promise<void>; // Explicitly fetch/refresh customer data
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CUSTOMER_ACCESS_TOKEN_LS_KEY = 'shopifyCustomerAccessToken';
const CUSTOMER_ACCESS_TOKEN_EXPIRY_LS_KEY = 'shopifyCustomerAccessTokenExpiry';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerAccessToken, setCustomerAccessToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true to check initial session
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_DEV === 'true' 
    ? process.env.NEXT_PUBLIC_API_URL_DEV 
    : (process.env.NEXT_PUBLIC_API_URL || ''); 

  // Helper to clear session data
  const clearSession = () => {
    setCustomer(null);
    setCustomerAccessToken(null);
    setTokenExpiresAt(null);
    if (typeof window !== 'undefined') {
        localStorage.removeItem(CUSTOMER_ACCESS_TOKEN_LS_KEY);
        localStorage.removeItem(CUSTOMER_ACCESS_TOKEN_EXPIRY_LS_KEY);
    }
    setError(null);
  };

  // Fetch customer data using the current token
  const fetchCustomerDataInternal = async (token: string): Promise<Customer | null> => {
    if (!token) return null;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/customers/account`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success && data.customer) {
        setCustomer(data.customer);
        return data.customer;
      } else {
        console.warn("Failed to fetch customer data:", data.message);
        // If token is invalid (common reason for failure here), clear session
        if (response.status === 401 || data.errorCode === 'TOKEN_INVALID' || data.errorCode === 'NO_CUSTOMER_DATA') {
          clearSession(); 
        }
        setError(data.message || "Could not fetch customer details.");
        return null;
      }
    } catch (err: unknown) {
      console.error("Error fetching customer data:", err);
      setError(err instanceof Error ? err.message : "An error occurred while fetching customer data.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to be exposed via context
  const fetchCustomerData = async () => {
    if (customerAccessToken) {
        await fetchCustomerDataInternal(customerAccessToken);
    }
  }

  // Check local storage for token on initial load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem(CUSTOMER_ACCESS_TOKEN_LS_KEY);
      const storedExpiry = localStorage.getItem(CUSTOMER_ACCESS_TOKEN_EXPIRY_LS_KEY);

      if (storedToken && storedExpiry) {
        if (new Date(storedExpiry) > new Date()) { // Check if token is not expired
          setCustomerAccessToken(storedToken);
          setTokenExpiresAt(storedExpiry);
          fetchCustomerDataInternal(storedToken); // Fetch data with stored token
        } else {
          // Token expired
          clearSession();
          setIsLoading(false);
        }
      } else {
        setIsLoading(false); // No token found
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/customers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success && data.customerAccessToken) {
        setCustomerAccessToken(data.customerAccessToken);
        setTokenExpiresAt(data.expiresAt);
        if (typeof window !== 'undefined') {
            localStorage.setItem(CUSTOMER_ACCESS_TOKEN_LS_KEY, data.customerAccessToken);
            localStorage.setItem(CUSTOMER_ACCESS_TOKEN_EXPIRY_LS_KEY, data.expiresAt);
        }
        // Fetch customer data after successful login
        await fetchCustomerDataInternal(data.customerAccessToken);
        setIsLoading(false);
        return { success: true };
      } else {
        setError(data.message || "Login failed.");
        setIsLoading(false);
        return { success: false, error: data.message || "Login failed." };
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred during login.");
      setIsLoading(false);
      return { success: false, error: err instanceof Error ? err.message : "An error occurred during login." };
    }
  };

  const register = async (details: { firstName?: string; lastName?: string; email: string; password: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/customers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
      });
      const data = await response.json();
      if (data.success) {
        // Don't automatically log in; user should go to login page
        setIsLoading(false);
        return { success: true };
      } else {
        setError(data.message || "Registration failed.");
        setIsLoading(false);
        return { success: false, error: data.message || "Registration failed." };
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred during registration.");
      setIsLoading(false);
      return { success: false, error: err instanceof Error ? err.message : "An error occurred during registration." };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);
    if (customerAccessToken) {
      try {
        await fetch(`${apiBaseUrl}/customers/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${customerAccessToken}`,
            'Content-Type': 'application/json',
          },
        });
        // Regardless of Shopify logout success, clear local session
      } catch (err: unknown) {
        console.warn("Error during Shopify logout, proceeding with local logout:", err instanceof Error ? err.message : err);
        // Still proceed to clear local session even if API call fails
      }
    }
    clearSession();
    setIsLoading(false);
  };
  
  const isAuthenticated = () => {
    return !!customerAccessToken && !!customer && (tokenExpiresAt ? new Date(tokenExpiresAt) > new Date() : false);
  };

  return (
    <AuthContext.Provider value={{ customer, customerAccessToken, isLoading, error, login, register, logout, fetchCustomerData, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 