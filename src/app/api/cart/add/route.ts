import { NextRequest, NextResponse } from 'next/server';
import { CartService } from '@/lib/shopify';

// Add item to cart API route
export async function POST(request: NextRequest) {
  // Add CORS headers
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  try {
    // Parse request body
    const { cartId, variantId, quantity } = await request.json();
    
    // Parameter validation
    if (!cartId || !variantId || !quantity) {
      return NextResponse.json({
        success: false,
        message: "cartId, variantId, and quantity are required"
      }, {
        status: 400,
        headers
      });
    }
    
    // Add item to cart using the encapsulated service
    const result = await CartService.addSingleItem(cartId, variantId, parseInt(quantity, 10));
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Failed to add item to cart: " + result.message,
        errors: result.errors
      }, {
        status: 400,
        headers
      });
    }
    
    // Check for user errors
    const userErrors = result.data?.cartLinesAdd?.userErrors;
    if (userErrors && userErrors.length > 0) {
      return NextResponse.json({
        success: false,
        message: "Failed to add item to cart: " + userErrors[0].message
      }, {
        status: 400,
        headers
      });
    }
    
    // Return successful response
    return NextResponse.json({
      success: true,
      message: "Item added to cart",
      cart: result.data?.cartLinesAdd?.cart
    }, {
      status: 200,
      headers
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "An error occurred while adding item to cart",
      error: error.message
    }, {
      status: 500,
      headers
    });
  }
}
