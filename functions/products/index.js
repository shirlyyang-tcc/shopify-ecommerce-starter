// 获取产品列表函数 - 使用Shopify Storefront API

export async function onRequest(context) {
  const { request, env } = context;
  
  // 添加CORS头
  const headers = new Headers({
    'Content-Type': 'application/json'
  });
  
  
  // 处理GET请求
  if (request.method === "GET") {
    try {
      // 获取查询参数
      const url = new URL(request.url);
      const first = parseInt(url.searchParams.get('first') || '8', 10);
      const after = url.searchParams.get('after') || null;
      const query = url.searchParams.get('query') || '';
      const sortKey = url.searchParams.get('sortKey') || 'RELEVANCE';
      
      // 创建GraphQL查询
      const graphqlQuery = `
        query getProducts($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys!) {
          products(first: $first, after: $after, query: $query, sortKey: $sortKey) {
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
            edges {
              cursor
              node {
                id
                title
                handle
                description
                vendor
                featuredImage {
                  url
                  altText
                }
                variants(first: 1) {
                  edges {
                    node {
                      id
                      title
                      priceV2 {
                        amount
                        currencyCode
                      }
                      availableForSale
                      quantityAvailable
                    }
                  }
                }
                collections(first: 5) {
                  edges {
                    node {
                      id
                      title
                      handle
                    }
                  }
                }
                productType
                tags
              }
            }
          }
        }
      `;
      
      // 准备变量
      const variables = {
        first,
        after,
        query,
        sortKey
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
          message: "获取产品列表失败：" + responseData.errors[0].message
        }), {
          status: 400,
          headers
        });
      }
      
      // 处理产品数据并格式化成符合前端需要的格式
      const products = responseData.data.products.edges.map(edge => {
        const { node } = edge;
        const firstVariant = node.variants.edges[0]?.node;
        const collections = node.collections.edges.map(e => e.node);
        
        return {
          id: node.id.split('/').pop(),
          title: node.title,
          slug: node.handle,
          description: node.description,
          image: node.featuredImage?.url || '',
          price: firstVariant ? parseFloat(firstVariant.priceV2.amount) : 0,
          currencyCode: firstVariant ? firstVariant.priceV2.currencyCode : 'CNY',
          variantId: firstVariant ? firstVariant.id : '',
          availableForSale: firstVariant ? firstVariant.availableForSale : false,
          stock: firstVariant ? firstVariant.quantityAvailable || 0 : 0,
          brand: node.vendor,
          collections,
          productType: node.productType,
          tags: node.tags
        };
      });
      
      // 返回产品列表与分页信息
      return new Response(JSON.stringify({
        success: true,
        products,
        pageInfo: responseData.data.products.pageInfo
      }), {
        headers
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        message: "获取产品列表过程中出现错误",
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