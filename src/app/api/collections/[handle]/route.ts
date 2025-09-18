import { NextRequest, NextResponse } from 'next/server';
import { CollectionService } from '@/lib/shopify';

// Get single collection detail API route
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  try {
    const { handle } = await params;
    
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
    
    // 使用封装的服务获取商品集合详情
    const result = await CollectionService.getCollectionByHandle(handle, {
      first,
      after: after || undefined,
      sortKey,
      reverse
    });
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Failed to get collection details: " + result.message,
        errors: result.errors
      }, {
        status: 400,
        headers
      });
    }
    
    // Check if collection exists
    if (!result.data?.collectionByHandle) {
      return NextResponse.json({
        success: false,
        message: "Collection not found"
      }, {
        status: 404,
        headers
      });
    }
    
    const shopifyCollection = result.data.collectionByHandle;
    
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
