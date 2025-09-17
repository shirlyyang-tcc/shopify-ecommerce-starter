import { NextRequest, NextResponse } from 'next/server';
import { CollectionService } from '@/lib/shopify';

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
    
    // Use the encapsulated service to get the collection list
    const result = await CollectionService.getCollections({ first, after });
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Failed to fetch collection list: " + result.message,
        errors: result.errors
      }, {
        status: 400,
        headers
      });
    }
    
    // Process collection data and format for frontend
    const collections = result.data?.collections?.edges?.map((edge: any) => {
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
    }) || [];
    
    // Return collection list and pagination info
    return NextResponse.json({
      success: true,
      collections,
      pageInfo: result.data?.collections?.pageInfo
    }, {
      headers
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "An error occurred while fetching the collection list",
      error: error.message
    }, {
      status: 500,
      headers
    });
  }
}
