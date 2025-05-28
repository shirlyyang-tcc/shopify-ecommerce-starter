// 创建结账流程函数

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
    // 解析请求体
    const { cartId } = await request.json();
    
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
    
    // 用Shopify Storefront API创建结账
    // 如果用户已登录（有accessToken），则关联该用户
    // 否则创建匿名结账
    
    let checkoutUrl;
    
    // 检查购物车是否存在
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
        message: "获取购物车信息失败：" + cartData.errors[0].message
      }), {
        status: 400,
        headers
      });
    }
    
    if (!cartData.data || !cartData.data.cart) {
      return new Response(JSON.stringify({
        success: false,
        message: "找不到购物车"
      }), {
        status: 404,
        headers
      });
    }
    
    // 获取购物车的结账URL
    checkoutUrl = cartData.data.cart.checkoutUrl;
    
    // 如果有accessToken，可以在这里将购物车与用户关联
    // 注意：Shopify Storefront API的购物车已经包含结账URL
    // 所以这里不需要额外创建结账，直接使用购物车的结账URL即可
    
    // 返回成功响应
    return new Response(JSON.stringify({
      success: true,
      checkoutUrl,
      message: "已创建结账流程，请继续完成支付"
    }), {
      status: 200,
      headers
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: "创建结账过程中出现错误",
      error: error.message
    }), {
      status: 500,
      headers
    });
  }
} 