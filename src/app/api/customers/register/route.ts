import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/lib/shopify';
import type { CustomerCreateInput } from '@/lib/shopify';

// Customer registration API route
export async function POST(request: NextRequest) {
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  try {
    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        message: "Email and password are required." 
      }, {
        status: 400,
        headers
      });
    }

    const input: CustomerCreateInput = {
      email,
      password,
      firstName,
      lastName
    };

    // Register customer using the encapsulated service
    const result = await CustomerService.register(input);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.message,
        errors: result.errors,
      }, {
        status: 400,
        headers
      });
    }

    const customerData = result.data?.customerCreate?.customer;
    const userErrors = result.data?.customerCreate?.customerUserErrors;

    if (userErrors && userErrors.length > 0) {
      return NextResponse.json({
        success: false,
        message: userErrors[0].message,
        errors: userErrors,
      }, {
        status: 400,
        headers
      });
    }

    // Registration successful
    return NextResponse.json({
      success: true,
      message: "Account created successfully. You can now log in.",
      customer: customerData,
    }, {
      status: 201,
      headers
    });

  } catch (error: any) {
    console.error("[api/customers/register] Error processing request:", error);
    return NextResponse.json({ 
      success: false, 
      message: "An error occurred processing your request." 
    }, {
      status: 500,
      headers
    });
  }
}
