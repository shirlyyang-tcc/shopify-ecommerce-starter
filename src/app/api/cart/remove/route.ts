import { NextRequest, NextResponse } from 'next/server';

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
        message: "购物车ID和商品行ID为必填项"
      }, {
        status: 400,
        headers
      });
    }
    
    // Create GraphQL query
    const query = `
      mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
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
      lineIds
    };
    
    // Send request to Shopify
    const response = await fetch(
      `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/${process.env.SHOPIFY_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!
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
         responseData.data.cartLinesRemove && 
         responseData.data.cartLinesRemove.userErrors.length > 0)) {
      
      const errorMessage = responseData.errors ? 
        responseData.errors[0].message : 
        responseData.data.cartLinesRemove.userErrors[0].message;
      
      return NextResponse.json({
        success: false,
        message: "从购物车移除商品失败：" + errorMessage
      }, {
        status: 400,
        headers
      });
    }
    
    // Return successful response
    return NextResponse.json({
      success: true,
      message: "商品已从购物车移除",
      cart: responseData.data.cartLinesRemove.cart
    }, {
      status: 200,
      headers
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "从购物车移除商品过程中出现错误",
      error: error.message
    }, {
      status: 500,
      headers
    });
  }
}
