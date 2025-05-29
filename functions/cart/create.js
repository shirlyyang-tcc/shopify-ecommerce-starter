// 创建购物车函数

export async function onRequest(context) {
  const { request, env } = context;
  
  // 添加CORS头
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  
  // 仅处理POST请求
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
    // Parse request body to get optional customerAccessToken
    let input = {}; // Default to empty input for anonymous cart
    try {
        const requestBody = await request.json();
        if (requestBody && requestBody.customerAccessToken) {
            input = {
                buyerIdentity: {
                    customerAccessToken: requestBody.customerAccessToken
                }
            };
        }
        // You can also add lines here if you want to create a cart with initial items
        // e.g., if (requestBody.lines) input.lines = requestBody.lines;
    } catch {
        // If request body is empty or not valid JSON, proceed with anonymous cart creation
        // console.log("No valid request body for cartCreate or empty body, creating anonymous cart.");
        // No action needed, input remains {} for anonymous cart
    }

    // 创建GraphQL查询
    const query = `
      mutation cartCreate($input: CartInput) { # Make input argument optional in mutation definition if not always present
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
            createdAt
            updatedAt
            lines(first: 10) {
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
    
    // Prepare variables for the GraphQL query
    // The input object might be empty for anonymous cart or contain buyerIdentity for logged-in user
    const variables = { input };

    // 发送请求到Shopify
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
          variables // Pass the variables object, which contains the input
        })
      }
    );
    
    const responseData = await response.json();
    
    // 检查是否有错误
    if (responseData.errors || 
        (responseData.data && 
         responseData.data.cartCreate && 
         responseData.data.cartCreate.userErrors.length > 0)) {
      
      const errorMessage = responseData.errors ? 
        responseData.errors[0].message : 
        responseData.data.cartCreate.userErrors[0].message;
      
      return new Response(JSON.stringify({
        success: false,
        message: "创建购物车失败：" + errorMessage
      }), {
        status: 400,
        headers
      });
    }
    
    // 返回成功响应
    return new Response(JSON.stringify({
      success: true,
      cart: responseData.data.cartCreate.cart
    }), {
      status: 201,
      headers
    });
    
  } catch (error) {
    console.error("Error in cartCreate function:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "创建购物车过程中出现内部错误",
      error: error.message
    }), {
      status: 500,
      headers
    });
  }
} 