import ProductListClient from '@/components/ui/product-list-client';
import { getProducts } from '@/lib/shopify';

// 配置静态生成
export const dynamic = 'force-static';
export const dynamicParams = false;
export const preferredRegion = 'auto';

export const metadata = {
  title: 'All Products - Good Fortune Crystal Mall',
  description: 'Browse our complete collection of high-quality crystals. Find the perfect crystal to enhance your energy and bring good fortune to your life.',
};

export default async function ProductsPage() {
  try {
    const products = await getProducts();
    

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">All Products</h1>
        <ProductListClient 
          initialProducts={products} 
        />
      </div>
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">All Products</h1>
        <div className="text-center text-red-500">
          Failed to load products. Please try again later.
        </div>
      </div>
    );
  }
} 