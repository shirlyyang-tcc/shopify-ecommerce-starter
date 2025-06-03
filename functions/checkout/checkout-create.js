// Create checkout process function

export async function onRequest(context) {
  const { request, env } = context;
  
  // Add CORS headers
  const headers = new Headers({
    'Content-Type': 'application/json'
  });
  
  
  // Only handle POST requests
  if (request.method !== "POST") {
    return new Response(JSON.stringify({
      success: false,
      message: "Method not allowed"
    }), {
      status: 405,
      headers
    });
  }
  
  try {
    // Parse request body
    const { cartId } = await request.json();
    
    // Parameter validation
    if (!cartId) {
      return new Response(JSON.stringify({
        success: false,
        message: "Shopping cart ID is required"
      }), {
        status: 400,
        headers
      });
    }
    
    // Create checkout using Shopify Storefront API
    // If user is logged in (has accessToken), associate with that user
    // Otherwise create anonymous checkout
    
    let checkoutUrl;
    
    // Check if cart exists
    const getCartQuery = `
      query getCart($cartId: ID!) {
        cart(id: $cartId) {
          id
          checkoutUrl
        }
      }
    `;
    
    const getCartVars = { cartId };
    
    const cartResponse = await fetch(
      `https://${env.SHOPIFY_STORE_DOMAIN}/api/${env.SHOPIFY_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
        },
        body: JSON.stringify({
          query: getCartQuery,
          variables: getCartVars
        })
      }
    );
    
    const cartData = await cartResponse.json();
    
    if (cartData.errors) {
      return new Response(JSON.stringify({
        success: false,
        message: "Failed to get shopping cart information: " + cartData.errors[0].message
      }), {
        status: 400,
        headers
      });
    }
    
    if (!cartData.data || !cartData.data.cart) {
      return new Response(JSON.stringify({
        success: false,
        message: "Shopping cart not found"
      }), {
        status: 404,
        headers
      });
    }
    
    // Get cart checkout URL
    checkoutUrl = cartData.data.cart.checkoutUrl;
    
    // If there's an accessToken, we can associate the cart with the user here
    // Note: Shopify Storefront API's cart already includes checkout URL
    // So we don't need to create a separate checkout, just use the cart's checkout URL
    
    // Return successful response
    return new Response(JSON.stringify({
      success: true,
      checkoutUrl,
      message: "Checkout process created successfully, please complete payment"
    }), {
      status: 200,
      headers
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: "An error occurred while creating checkout",
      error: error.message
    }), {
      status: 500,
      headers
    });
  }
} 