import { NextRequest, NextResponse } from 'next/server';
import { CartService } from '@/lib/shopify';
import type { CartCreateInput } from '@/lib/shopify';

// Create cart API route
export async function POST(request: NextRequest) {
  // Add CORS headers
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  try {
    // Parse request body
    const { customerAccessToken } = await request.json();
    
    // Prepare cart creation input
    const input: CartCreateInput = {};
    if (customerAccessToken) {
      input.buyerIdentity = { customerAccessToken };
    }
    
    // Create cart using the encapsulated service
    const result = await CartService.createCart(input);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Failed to create cart: " + result.message,
        errors: result.errors
      }, {
        status: 400,
        headers
      });
    }
    
    // Check for user errors
    const userErrors = result.data?.cartCreate?.userErrors;
    if (userErrors && userErrors.length > 0) {
      return NextResponse.json({
        success: false,
        message: "Failed to create cart: " + userErrors[0].message
      }, {
        status: 400,
        headers
      });
    }
    
    // Return successful response
    return NextResponse.json({
      success: true,
      message: "Cart created successfully",
      cart: result.data?.cartCreate?.cart
    }, {
      status: 200,
      headers
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "An error occurred while creating the cart",
      error: error.message
    }, {
      status: 500,
      headers
    });
  }
}
