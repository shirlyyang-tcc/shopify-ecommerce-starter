import { NextRequest, NextResponse } from 'next/server';
import { Cart } from '@/lib/shopify';

// Create checkout process API route
export async function POST(request: NextRequest) {
  // Add CORS headers
  const headers = new Headers({
    'Content-Type': 'application/json'
  });
  
  try {
    // Parse request body
    const { cartId } = await request.json();
    
    // Parameter validation
    if (!cartId) {
      return NextResponse.json({
        success: false,
        message: "Shopping cart ID is required"
      }, {
        status: 400,
        headers
      });
    }
    
    // Use the wrapped service to get cart information
    const cartResult = await Cart.getCart(cartId);
    
    if (!cartResult.success) {
      return NextResponse.json({
        success: false,
        message: "Failed to get shopping cart information: " + cartResult.message
      }, {
        status: 400,
        headers
      });
    }
    
    if (!cartResult.data?.cart) {
      return NextResponse.json({
        success: false,
        message: "Shopping cart not found"
      }, {
        status: 404,
        headers
      });
    }
    
    // Get cart checkout URL
    const checkoutUrl = cartResult.data.cart.checkoutUrl;
    
    // If there's an accessToken, we can associate the cart with the user here
    // Note: Shopify Storefront API's cart already includes checkout URL
    // So we don't need to create a separate checkout, just use the cart's checkout URL
    
    // Return successful response
    return NextResponse.json({
      success: true,
      checkoutUrl,
      message: "Checkout process created successfully, please complete payment"
    }, {
      status: 200,
      headers
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "An error occurred while creating checkout",
      error: error.message
    }, {
      status: 500,
      headers
    });
  }
}
