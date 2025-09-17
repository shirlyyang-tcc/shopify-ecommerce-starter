import { NextRequest, NextResponse } from 'next/server';
import { CartService } from '@/lib/shopify';

// Update item quantity in cart API route
export async function POST(request: NextRequest) {
  // Add CORS headers
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  try {
    // Parse request body
    const { cartId, lineId, quantity } = await request.json();
    
    // Parameter validation
    if (!cartId || !lineId || quantity === undefined) {
      return NextResponse.json({
        success: false,
        message: "cartId, lineId, and quantity are required"
      }, {
        status: 400,
        headers
      });
    }
    
    // Update cart item quantity using the service
    const result = await CartService.updateSingleItem(cartId, lineId, parseInt(quantity, 10));
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Failed to update cart item quantity: " + result.message,
        errors: result.errors
      }, {
        status: 400,
        headers
      });
    }
    
    // Check for user errors
    const userErrors = result.data?.cartLinesUpdate?.userErrors;
    if (userErrors && userErrors.length > 0) {
      return NextResponse.json({
        success: false,
        message: "Failed to update cart item quantity: " + userErrors[0].message
      }, {
        status: 400,
        headers
      });
    }
    
    // Return successful response
    return NextResponse.json({
      success: true,
      message: "Cart item quantity updated",
      cart: result.data?.cartLinesUpdate?.cart
    }, {
      status: 200,
      headers
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "An error occurred while updating cart item quantity",
      error: error.message
    }, {
      status: 500,
      headers
    });
  }
}
