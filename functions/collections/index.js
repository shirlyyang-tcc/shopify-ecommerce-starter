// 获取商品分类列表 - 使用Shopify Storefront API

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
      const first = parseInt(url.searchParams.get('first') || '20', 10);
      const after = url.searchParams.get('after') || null;
      
      // 创建GraphQL查询
      const graphqlQuery = `
        query getCollections($first: Int!, $after: String) {
          collections(first: $first, after: $after) {
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
                descriptionHtml
                image {
                  url
                  altText
                }
                productsCount
                updatedAt
              }
            }
          }
        }
      `;
      
      // 准备变量
      const variables = {
        first,
        after
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
          message: "获取分类列表失败：" + responseData.errors[0].message
        }), {
          status: 400,
          headers
        });
      }
      
      // 处理分类数据并格式化成符合前端需要的格式
      const collections = responseData.data.collections.edges.map(edge => {
        const { node } = edge;
        
        return {
          id: node.id.split('/').pop(),
          title: node.title,
          slug: node.handle,
          description: node.description,
          descriptionHtml: node.descriptionHtml,
          image: node.image?.url || '',
          imageAlt: node.image?.altText || node.title,
          productsCount: node.productsCount,
          updatedAt: node.updatedAt
        };
      });
      
      // 返回分类列表与分页信息
      return new Response(JSON.stringify({
        success: true,
        collections,
        pageInfo: responseData.data.collections.pageInfo
      }), {
        headers
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        message: "获取分类列表过程中出现错误",
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