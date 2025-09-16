import { NextRequest, NextResponse } from 'next/server';

// Create cart API route
export async function POST(request: NextRequest) {
  // Add CORS headers
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  try {
    // Parse request body
    const { customerAccessToken } = await request.json();
    
    // Create GraphQL query
    const query = `
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
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
      input: customerAccessToken ? {
        buyerIdentity: {
          customerAccessToken: customerAccessToken
        }
      } : {}
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
         responseData.data.cartCreate && 
         responseData.data.cartCreate.userErrors.length > 0)) {
      
      const errorMessage = responseData.errors ? 
        responseData.errors[0].message : 
        responseData.data.cartCreate.userErrors[0].message;
      
      return NextResponse.json({
        success: false,
        message: "创建购物车失败：" + errorMessage
      }, {
        status: 400,
        headers
      });
    }
    
    // Return successful response
    return NextResponse.json({
      success: true,
      message: "购物车创建成功",
      cart: responseData.data.cartCreate.cart
    }, {
      status: 200,
      headers
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "创建购物车过程中出现错误",
      error: error.message
    }, {
      status: 500,
      headers
    });
  }
}
