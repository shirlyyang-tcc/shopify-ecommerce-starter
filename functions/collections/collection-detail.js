// 获取单个商品分类详情 - 使用Shopify Storefront API

export async function onRequest(context) {
  const { request, env } = context;
  
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  // 处理GET请求
  if (request.method === "GET") {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const segments = path.split('/');
      const handle = segments[segments.length - 1]; // 获取分类的slug/handle
      
      if (!handle) {
        return new Response(JSON.stringify({
          success: false,
          message: "分类ID或slug不能为空"
        }), {
          status: 400,
          headers
        });
      }
      
      // 获取查询参数，用于产品分页
      const first = parseInt(url.searchParams.get('first') || '20', 10);
      const after = url.searchParams.get('after') || null;
      const sortKey = url.searchParams.get('sortKey') || 'BEST_SELLING';
      const reverse = url.searchParams.get('reverse') === 'true';
      
      // 创建GraphQL查询
      const graphqlQuery = `
        query getCollectionByHandle($handle: String!, $first: Int!, $after: String, $sortKey: ProductCollectionSortKeys!, $reverse: Boolean!) {
          collectionByHandle(handle: $handle) {
            id
            title
            handle
            description
            descriptionHtml
            image {
              url
              altText
              width
              height
            }
            updatedAt
            products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
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
                  productType
                  tags
                }
              }
            }
          }
        }
      `;
      
      // 准备变量
      const variables = {
        handle,
        first,
        after,
        sortKey,
        reverse
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
          message: "获取分类详情失败：" + responseData.errors[0].message
        }), {
          status: 400,
          headers
        });
      }
      
      // 检查分类是否存在
      if (!responseData.data.collectionByHandle) {
        return new Response(JSON.stringify({
          success: false,
          message: "未找到分类"
        }), {
          status: 404,
          headers
        });
      }
      
      const shopifyCollection = responseData.data.collectionByHandle;
      
      // 处理产品数据并格式化成符合前端需要的格式
      const products = shopifyCollection.products.edges.map(edge => {
        const { node } = edge;
        const firstVariant = node.variants.edges[0]?.node;
        
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
          productType: node.productType,
          tags: node.tags
        };
      });
      
      // 构建分类对象
      const collection = {
        id: shopifyCollection.id.split('/').pop(),
        title: shopifyCollection.title,
        slug: shopifyCollection.handle,
        description: shopifyCollection.description,
        descriptionHtml: shopifyCollection.descriptionHtml,
        image: shopifyCollection.image?.url || '',
        imageAlt: shopifyCollection.image?.altText || shopifyCollection.title,
        updatedAt: shopifyCollection.updatedAt,
        products,
        productsPageInfo: shopifyCollection.products.pageInfo
      };
      
      return new Response(JSON.stringify({
        success: true,
        collection
      }), {
        headers
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        message: "获取分类详情过程中出现错误",
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