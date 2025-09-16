import { NextRequest, NextResponse } from 'next/server';

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
        message: "购物车ID为必填项"
      }, {
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
    const variables = { cartId };
    
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
    if (responseData.errors) {
      return NextResponse.json({
        success: false,
        message: "获取购物车信息失败：" + responseData.errors[0].message
      }, {
        status: 400,
        headers
      });
    }
    
    // Check if cart exists
    if (!responseData.data || !responseData.data.cart) {
      return NextResponse.json({
        success: false,
        message: "购物车未找到",
        cart: null
      }, {
        status: 404,
        headers
      });
    }
    
    // Return successful response
    return NextResponse.json({
      success: true,
      message: "购物车信息获取成功",
      cart: responseData.data.cart
    }, {
      status: 200,
      headers
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "获取购物车信息过程中出现错误",
      error: error.message
    }, {
      status: 500,
      headers
    });
  }
}
