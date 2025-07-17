// Get cart information function

export async function onRequest(context) {
  const { request, env } = context;
  
  // Add CORS headers
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  
  // Only handle GET requests
  if (request.method !== "GET") {
    return new Response(JSON.stringify({
      success: false,
      message: "Method not allowed"
    }), {
      status: 405,
      headers
    });
  }
  
  try {
    // Get cart ID from URL
    const url = new URL(request.url);
    const cartId = url.searchParams.get('cartId');
    
    // Parameter validation
    if (!cartId) {
      return new Response(JSON.stringify({
        success: false,
        message: "购物车ID为必填项"
      }), {
        status: 400,
        headers
      });
    }
    
    // Create GraphQL query
    const query = `
      query getCart($cartId: ID!) {
        cart(id: $cartId) {
          id
          checkoutUrl
          createdAt
          updatedAt
          lines(first: 100) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    image {
                      url
                      altText
                    }
                    priceV2 {
                      amount
                      currencyCode
                    }
                    product {
                      title
                      handle
                    }
                  }
                }
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
            totalTaxAmount {
              amount
              currencyCode
            }
          }
          totalQuantity
        }
      }
    `;
    
    // Prepare variables
    const variables = {
      cartId
    };
    
    // Send request to Shopify
    const response = await fetch(
      `https://${env.SHOPIFY_STORE_DOMAIN}/api/${env.SHOPIFY_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
        },
        body: JSON.stringify({
          query,
          variables
        })
      }
    );
    
    const responseData = await response.json();
    
    // Check for errors
    if (responseData.errors) {
      return new Response(JSON.stringify({
        success: false,
        message: "获取购物车信息失败：" + responseData.errors[0].message
      }), {
        status: 400,
        headers
      });
    }
    
    // Check if cart exists
    if (!responseData.data || !responseData.data.cart) {
      return new Response(JSON.stringify({
        success: false,
        message: "找不到购物车"
      }), {
        status: 404,
        headers
      });
    }
    
    // Return successful response
    return new Response(JSON.stringify({
      success: true,
      cart: responseData.data.cart
    }), {
      status: 200,
      headers
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: "获取购物车信息过程中出现错误",
      error: error.message
    }), {
      status: 500,
      headers
    });
  }
} 