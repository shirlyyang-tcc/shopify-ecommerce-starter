import { NextRequest, NextResponse } from 'next/server';
import { CartService } from '@/lib/shopify';

// Get cart API route
export async function GET(request: NextRequest) {
  // Add CORS headers
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  try {
    // Get cartId from query parameters
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get('cartId');
    
    // Parameter validation
    if (!cartId) {
      return NextResponse.json({
        success: false,
        message: "Cart ID is required"
      }, {
        status: 400,
        headers
      });
    }
    
    // Get cart information using the encapsulated service
    const result = await CartService.getCart(cartId);
    console.log('result', result);
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Failed to get cart information: " + result.message,
        errors: result.errors
      }, {
        status: 400,
        headers
      });
    }
    
    // Check if cart exists
    if (!result.data?.cart) {
      return NextResponse.json({
        success: false,
        message: "Cart not found",
        cart: null
      }, {
        status: 404,
        headers
      });
    }
    
    // Return successful response
    return NextResponse.json({
      success: true,
      message: "Cart information retrieved successfully",
      cart: result.data.cart
    }, {
      status: 200,
      headers
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "An error occurred while retrieving cart information",
      error: error.message
    }, {
      status: 500,
      headers
    });
  }
}
