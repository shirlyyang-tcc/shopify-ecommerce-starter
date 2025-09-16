import { NextRequest, NextResponse } from 'next/server';

// Get collection list API route
export async function GET(request: NextRequest) {
  // Add CORS headers
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const first = parseInt(searchParams.get('first') || '20', 10);
    const after = searchParams.get('after') || null;
    
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
      `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/${process.env.SHOPIFY_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!
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
      return NextResponse.json({
        success: false,
        message: "获取分类列表失败：" + responseData.errors[0].message
      }, {
        status: 400,
        headers
      });
    }
    
    // Process collection data and format for frontend
    const collections = responseData.data.collections.edges.map((edge: any) => {
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
    return NextResponse.json({
      success: true,
      collections,
      pageInfo: responseData.data.collections.pageInfo
    }, {
      headers
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "获取分类列表过程中出现错误",
      error: error.message
    }, {
      status: 500,
      headers
    });
  }
}
