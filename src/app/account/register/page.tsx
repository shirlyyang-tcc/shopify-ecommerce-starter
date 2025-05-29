"use client";

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error: authError, isAuthenticated } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && isAuthenticated()) {
      setIsRedirecting(true);
      router.replace('/account');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!email || !password || !firstName) { // Basic validation
      setFormError("Please enter your name, email, and password.");
      return;
    }
    if (password.length < 5) {
      setFormError("Password must be at least 5 characters.");
      return;
    }

    const result = await register({ firstName, lastName, email, password });

    if (result?.success) {
      setSuccessMessage("Account created successfully! You can now log in.");
      // Optionally, redirect to login or clear form
      // router.push('/account/login');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
    } else if (result?.error) {
      setFormError(result.error);
    } else if (authError) {
      setFormError(authError);
    } else {
      setFormError("An unknown error occurred during registration.");
    }
  };

  if (isRedirecting || isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>You have logged in. Redirecting to your account...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Create Your Account</CardTitle>
          <CardDescription className="mt-2">
            Fill in the following information to register a new account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 p-6">
            {formError && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Registration Failed</AlertTitle>
                <AlertDescription>
                  {formError}
                </AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert variant="default" className="bg-green-50 border-green-300 text-green-700">
                 <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="font-semibold">Registration Successful</AlertTitle>
                <AlertDescription>
                  {successMessage} Please go to the <Link href="/account/login" className="font-medium hover:underline">login page</Link>.
                </AlertDescription>
              </Alert>
            )}
             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  type="text" 
                  placeholder="John" 
                  required 
                  value={firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                  disabled={isLoading || !!successMessage}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name (Optional)</Label>
                <Input 
                  id="lastName" 
                  type="text" 
                  placeholder="Doe" 
                  value={lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                  disabled={isLoading || !!successMessage}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="john.doe@example.com" 
                required 
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                disabled={isLoading || !!successMessage}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password (At least 5 characters)</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                disabled={isLoading || !!successMessage}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-4 p-6 pt-0">
            <Button type="submit" className="w-full text-base py-3" disabled={isLoading || !!successMessage}>
              {isLoading ? 'Registering...' : 'Register'}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{' '}
              <Link href="/account/login" className="font-medium text-blue-600 hover:underline">
                Go to login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 