// Add item to cart function

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
    const { cartId, variantId, quantity } = await request.json();
    
    // Parameter validation
    if (!cartId || !variantId || !quantity) {
      return new Response(JSON.stringify({
        success: false,
        message: "购物车ID、商品变体ID和数量为必填项"
      }), {
        status: 400,
        headers
      });
    }
    
    // Create GraphQL query
    const query = `
      mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart {
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
          userErrors {
            field
            message
          }
        }
      }
    `;
    
    // Prepare variables
    const variables = {
      cartId,
      lines: [
        {
          merchandiseId: variantId,
          quantity: parseInt(quantity, 10)
        }
      ]
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
    if (responseData.errors || 
        (responseData.data && 
         responseData.data.cartLinesAdd && 
         responseData.data.cartLinesAdd.userErrors.length > 0)) {
      
      const errorMessage = responseData.errors ? 
        responseData.errors[0].message : 
        responseData.data.cartLinesAdd.userErrors[0].message;
      
      return new Response(JSON.stringify({
        success: false,
        message: "添加商品到购物车失败：" + errorMessage
      }), {
        status: 400,
        headers
      });
    }
    
    // Return successful response
    return new Response(JSON.stringify({
      success: true,
      message: "商品已添加到购物车",
      cart: responseData.data.cartLinesAdd.cart
    }), {
      status: 200,
      headers
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: "添加商品到购物车过程中出现错误",
      error: error.message
    }), {
      status: 500,
      headers
    });
  }
} 