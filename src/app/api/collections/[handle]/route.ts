import { NextRequest, NextResponse } from 'next/server';

// Get single collection detail API route
export async function GET(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  try {
    const handle = params.handle;
    
    if (!handle) {
      return NextResponse.json({
        success: false,
        message: "Collection ID or slug cannot be empty"
      }, {
        status: 400,
        headers
      });
    }
    
    // Get query parameters for product pagination
    const { searchParams } = new URL(request.url);
    const first = parseInt(searchParams.get('first') || '20', 10);
    const after = searchParams.get('after') || null;
    const sortKey = searchParams.get('sortKey') || 'BEST_SELLING';
    const reverse = searchParams.get('reverse') === 'true';
    
    // Create GraphQL query
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
    
    // Prepare variables
    const variables = {
      handle,
      first,
      after,
      sortKey,
      reverse
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
        message: "Failed to get collection details: " + responseData.errors[0].message
      }, {
        status: 400,
        headers
      });
    }
    
    // Check if collection exists
    if (!responseData.data.collectionByHandle) {
      return NextResponse.json({
        success: false,
        message: "Collection not found"
      }, {
        status: 404,
        headers
      });
    }
    
    const shopifyCollection = responseData.data.collectionByHandle;
    
    // Process product data and format for frontend
    const products = shopifyCollection.products.edges.map((edge: any) => {
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
    
    // Build collection object
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
    
    return NextResponse.json({
      success: true,
      collection
    }, {
      headers
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "An error occurred while getting collection details",
      error: error.message
    }, {
      status: 500,
      headers
    });
  }
}
