// 从购物车移除商品函数

export async function onRequest(context) {
  const { request, env } = context;
  
  // 添加CORS头
  const headers = new Headers({
    'Content-Type': 'application/json'
  });
  
  //if (env.DEV === "true") {
//    headers.append('Access-Control-Allow-Origin', env.FRONT_END_URL_DEV);
//    headers.append('Access-Control-Allow-Methods', 'POST, OPTIONS');
//    headers.append('Access-Control-Allow-Headers', 'Content-Type');
//  }
  
  // 处理OPTIONS请求
  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }
  
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
    // 解析请求体
    const { cartId, lineIds } = await request.json();
    
    // 参数验证
    if (!cartId || !lineIds || !lineIds.length) {
      return new Response(JSON.stringify({
        success: false,
        message: "购物车ID和要移除的商品行ID为必填项"
      }), {
        status: 400,
        headers
      });
    }
    
    // 创建GraphQL查询
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
    
    // 准备变量
    const variables = {
      cartId,
      lineIds
    };
    
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
          variables
        })
      }
    );
    
    const responseData = await response.json();
    
    // 检查是否有错误
    if (responseData.errors || 
        (responseData.data && 
         responseData.data.cartLinesRemove && 
         responseData.data.cartLinesRemove.userErrors.length > 0)) {
      
      const errorMessage = responseData.errors ? 
        responseData.errors[0].message : 
        responseData.data.cartLinesRemove.userErrors[0].message;
      
      return new Response(JSON.stringify({
        success: false,
        message: "从购物车移除商品失败：" + errorMessage
      }), {
        status: 400,
        headers
      });
    }
    
    // 返回成功响应
    return new Response(JSON.stringify({
      success: true,
      message: "商品已从购物车移除",
      cart: responseData.data.cartLinesRemove.cart
    }), {
      status: 200,
      headers
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: "从购物车移除商品过程中出现错误",
      error: error.message
    }), {
      status: 500,
      headers
    });
  }
} 