import { NextRequest, NextResponse } from 'next/server';
import { CartService } from '@/lib/shopify';

// Remove item from cart API route
export async function POST(request: NextRequest) {
  // Add CORS headers
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  try {
    // Parse request body
    const { cartId, lineIds } = await request.json();
    
    // Parameter validation
    if (!cartId || !lineIds || !Array.isArray(lineIds) || lineIds.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Cart ID and line item IDs are required"
      }, {
        status: 400,
        headers
      });
    }
    
    // Remove items from cart using the encapsulated service
    const result = await CartService.removeFromCart(cartId, lineIds);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Failed to remove items from cart: " + result.message,
        errors: result.errors
      }, {
        status: 400,
        headers
      });
    }
    
    // Check for user errors
    const userErrors = result.data?.cartLinesRemove?.userErrors;
    if (userErrors && userErrors.length > 0) {
      return NextResponse.json({
        success: false,
        message: "Failed to remove items from cart: " + userErrors[0].message
      }, {
        status: 400,
        headers
      });
    }
    
    // Return successful response
    return NextResponse.json({
      success: true,
      message: "Items have been removed from the cart",
      cart: result.data?.cartLinesRemove?.cart
    }, {
      status: 200,
      headers
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "An error occurred while removing items from the cart",
      error: error.message
    }, {
      status: 500,
      headers
    });
  }
}
