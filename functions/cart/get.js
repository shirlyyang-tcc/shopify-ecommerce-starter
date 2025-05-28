// 获取购物车信息函数

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
  
  // 仅处理GET请求
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
    // 从URL获取购物车ID
    const url = new URL(request.url);
    const cartId = url.searchParams.get('cartId');
    
    // 参数验证
    if (!cartId) {
      return new Response(JSON.stringify({
        success: false,
        message: "购物车ID为必填项"
      }), {
        status: 400,
        headers
      });
    }
    
    // 创建GraphQL查询
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
    
    // 准备变量
    const variables = {
      cartId
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
    if (responseData.errors) {
      return new Response(JSON.stringify({
        success: false,
        message: "获取购物车信息失败：" + responseData.errors[0].message
      }), {
        status: 400,
        headers
      });
    }
    
    // 检查购物车是否存在
    if (!responseData.data || !responseData.data.cart) {
      return new Response(JSON.stringify({
        success: false,
        message: "找不到购物车"
      }), {
        status: 404,
        headers
      });
    }
    
    // 返回成功响应
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