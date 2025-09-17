import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/lib/shopify';
import type { CustomerAccessTokenCreateInput } from '@/lib/shopify';

// Customer login API route
export async function POST(request: NextRequest) {
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  if (request.method === "OPTIONS") {
    return new Response(null, { headers, status: 204 });
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        message: "Email and password are required." 
      }, {
        status: 400,
        headers
      });
    }

    const input: CustomerAccessTokenCreateInput = { email, password };
    
    // Use the encapsulated service for customer login
    const result = await CustomerService.login(input);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.message,
        errors: result.errors,
      }, {
        status: 401, // Default to 401 for login failures
        headers
      });
    }

    const tokenData = result.data?.customerAccessTokenCreate?.customerAccessToken;
    const userErrors = result.data?.customerAccessTokenCreate?.customerUserErrors;

    if (userErrors && userErrors.length > 0) {
      return NextResponse.json({
        success: false,
        message: userErrors[0].message,
        errors: userErrors,
      }, {
        status: 401,
        headers
      });
    }

    if (!tokenData?.accessToken) {
      return NextResponse.json({
        success: false,
        message: "Failed to get access token"
      }, {
        status: 500,
        headers
      });
    }

    // Login successful, return token and expiry
    return NextResponse.json({
      success: true,
      message: "Login successful.",
      customerAccessToken: tokenData.accessToken,
      expiresAt: tokenData.expiresAt,
    }, {
      status: 200,
      headers
    });

  } catch (error: any) {
    console.error("[api/customers/login] Error processing request:", error);
    return NextResponse.json({ 
      success: false, 
      message: "An error occurred processing your request." 
    }, {
      status: 500,
      headers
    });
  }
}
