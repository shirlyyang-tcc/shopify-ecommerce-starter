import ProductListClient from '@/components/ui/product-list-client';
import { Product } from '@/types/product';


interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

async function getProducts(cursor: string | null = null): Promise<{ products: Product[], pageInfo: PageInfo | null, error?: string }> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_DEV === 'true' 
      ? process.env.NEXT_PUBLIC_API_URL_DEV 
      : (process.env.NEXT_PUBLIC_API_URL || ''); // Fallback to NEXT_PUBLIC_API_URL for production if available

    if (!apiUrl && process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV !== 'true'){
      console.warn("API URL for production is not set. Falling back to relative path. Ensure NEXT_PUBLIC_API_URL is set or your Edge Function is configured correctly.")
    }
    
    const queryParams = new URLSearchParams();
    queryParams.append('first', '8');
    if (cursor) {
      queryParams.append('after', cursor);
    }
    // console.log(`${apiUrl}/products?${queryParams.toString()}`);
    const response = await fetch(`${apiUrl}/products/search?${queryParams.toString()}`, { cache: 'no-store' }); // no-store for dynamic data on each request during build for SSG
    if (!response.ok) {
      return { products: [], pageInfo: null, error: `HTTP error! status: ${response.status}` };
    }
    const data = await response.json();

    if (data.success) {
      return { products: data.products, pageInfo: data.pageInfo };
    } else {
      return { products: [], pageInfo: null, error: data.message || "Failed to get product list" };
    }
  } catch (e: unknown) {
    let errorMessage = "An unknown error occurred while getting products";
    if (e instanceof Error) {
      errorMessage = e.message;
    }
    console.error("Failed to get products (server-side):", e);
    return { products: [], pageInfo: null, error: errorMessage };
  }
}

export const metadata = {
  title: 'All Products - Mall',
  description: 'Browse our full range of products, including the latest styles and hot collections.',
};

export default async function ProductsPage() {
  const { products: initialProducts, pageInfo: initialPageInfo, error } = await getProducts();

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  }
  
  // If you need to revalidate data periodically in production, you can set revalidate here
  // export const revalidate = 3600; // Revalidate every hour, for example

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">All Products</h1>
      {initialProducts.length === 0 && (
        <div className="text-center py-10 text-gray-500">No products.</div>
      )}
      {initialProducts.length > 0 && (
          <ProductListClient initialProducts={initialProducts} initialPageInfo={initialPageInfo} />
      )}
    </div>
  );
} 