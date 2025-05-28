// 获取单个产品详情 - 使用Shopify Storefront API

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
  
  // 处理GET请求
  if (request.method === "GET") {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const segments = path.split('/');
      const handle = segments[segments.length - 1]; // 获取产品的slug/handle
      
      if (!handle) {
        return new Response(JSON.stringify({
          success: false,
          message: "产品ID或slug不能为空"
        }), {
          status: 400,
          headers
        });
      }
      
      // 创建GraphQL查询
      const graphqlQuery = `
        query getProductByHandle($handle: String!) {
          productByHandle(handle: $handle) {
            id
            title
            handle
            description
            descriptionHtml
            vendor
            productType
            tags
            metafields(first: 10) {
              edges {
                node {
                  key
                  value
                  namespace
                }
              }
            }
            featuredImage {
              url
              altText
              width
              height
            }
            images(first: 10) {
              edges {
                node {
                  url
                  altText
                  width
                  height
                }
              }
            }
            variants(first: 20) {
              edges {
                node {
                  id
                  title
                  sku
                  priceV2 {
                    amount
                    currencyCode
                  }
                  compareAtPriceV2 {
                    amount
                    currencyCode
                  }
                  availableForSale
                  quantityAvailable
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
            options {
              name
              values
            }
            collections(first: 5) {
              edges {
                node {
                  id
                  handle
                  title
                }
              }
            }
          }
        }
      `;
      
      // 准备变量
      const variables = {
        handle: handle
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
            query: graphqlQuery,
            variables
          })
        }
      );
      
      const responseData = await response.json();
      
      // 检查是否有错误
      if (responseData.errors) {
        return new Response(JSON.stringify({
          success: false,
          message: "获取产品详情失败：" + responseData.errors[0].message
        }), {
          status: 400,
          headers
        });
      }
      
      // 检查产品是否存在
      if (!responseData.data.productByHandle) {
        return new Response(JSON.stringify({
          success: false,
          message: "未找到产品"
        }), {
          status: 404,
          headers
        });
      }
      
      const shopifyProduct = responseData.data.productByHandle;
      
      // 处理产品数据并转换为前端所需格式
      const product = {
        id: shopifyProduct.id.split('/').pop(),
        title: shopifyProduct.title,
        slug: shopifyProduct.handle,
        description: shopifyProduct.description,
        descriptionHtml: shopifyProduct.descriptionHtml,
        featuredImage: shopifyProduct.featuredImage?.url || '',
        images: shopifyProduct.images.edges.map(edge => ({
          url: edge.node.url,
          altText: edge.node.altText || shopifyProduct.title,
          width: edge.node.width,
          height: edge.node.height
        })),
        brand: shopifyProduct.vendor,
        productType: shopifyProduct.productType,
        tags: shopifyProduct.tags,
        variants: shopifyProduct.variants.edges.map(edge => {
          const variant = edge.node;
          return {
            id: variant.id,
            title: variant.title,
            sku: variant.sku || '',
            price: parseFloat(variant.priceV2.amount),
            currencyCode: variant.priceV2.currencyCode,
            compareAtPrice: variant.compareAtPriceV2 ? parseFloat(variant.compareAtPriceV2.amount) : null,
            availableForSale: variant.availableForSale,
            stock: variant.quantityAvailable || 0,
            options: variant.selectedOptions.map(option => ({
              name: option.name,
              value: option.value
            }))
          };
        }),
        options: shopifyProduct.options.map(option => ({
          name: option.name,
          values: option.values
        })),
        collections: shopifyProduct.collections.edges.map(edge => ({
          id: edge.node.id.split('/').pop(),
          handle: edge.node.handle,
          title: edge.node.title
        })),
        metafields: shopifyProduct.metafields.edges.map(edge => ({
          key: edge.node.key,
          value: edge.node.value,
          namespace: edge.node.namespace
        }))
      };
      
      return new Response(JSON.stringify({
        success: true,
        product
      }), {
        headers
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        message: "获取产品详情过程中出现错误",
        error: error.message
      }), {
        status: 500,
        headers
      });
    }
  }
  
  // 处理不支持的请求方法
  return new Response(JSON.stringify({
    success: false,
    message: "Method not allowed"
  }), {
    status: 405,
    headers
  });
} 