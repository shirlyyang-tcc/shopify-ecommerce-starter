// Get collection list - Using Shopify Storefront API

export async function onRequest(context) {
  const { request, env } = context;
  
  // Add CORS headers
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  // Handle GET request
  if (request.method === "GET") {
    try {
      // Get query parameters
      const url = new URL(request.url);
      const first = parseInt(url.searchParams.get('first') || '20', 10);
      const after = url.searchParams.get('after') || null;
      
      // Create GraphQL query
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
      
      // Prepare variables
      const variables = {
        first,
        after
      };
      
      // Send request to Shopify
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
      
      // Check for errors
      if (responseData.errors) {
        return new Response(JSON.stringify({
          success: false,
          message: "获取分类列表失败：" + responseData.errors[0].message
        }), {
          status: 400,
          headers
        });
      }
      
      // Process collection data and format for frontend
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
      
      // Return collection list and pagination info
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
  
  // Handle unsupported request methods
  return new Response(JSON.stringify({
    success: false,
    message: "Method not allowed"
  }), {
    status: 405,
    headers
  });
} 