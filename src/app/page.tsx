import ProductGrid from "@/components/ui/product-grid";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Product } from "@/interfaces/product";
import { getProducts } from '@/lib/shopify';
import type { ProductCardProps } from "@/components/ui/product-card";

// Convert Product to ProductCardProps
function convertToProductCardProps(product: Product): ProductCardProps {
  return {
    id: product.id,
    title: product.title,
    price: product.price,
    image: product.featuredImage?.url || product.images[0]?.url || '/placeholder.svg',
    slug: product.slug,
    variantId: product.variantId || product.variants[0]?.id || '',
  };
}

// Get featured products
async function getFeaturedProducts(): Promise<{ products: ProductCardProps[], error?: string }> {
  try {
    const allProducts = await getProducts();
    // Get first 4 products as featured products and convert to ProductCardProps
    const featuredProducts = allProducts.slice(0, 4).map(convertToProductCardProps);
    return { products: featuredProducts };
  } catch (e: unknown) {
    let errorMessage = "An error occurred while fetching featured products";
    if (e instanceof Error) {
      errorMessage = e.message;
    }
    console.error("Failed to fetch featured products:", e);
    return { products: [], error: errorMessage };
  }
}

export const metadata = {
  title: 'Good Fortune Crystal Mall - Explore High-Quality Crystal Series',
  description: 'We select various high-quality crystals to bring good fortune and energy to your life. Explore our featured products and latest arrivals.'
}

export default async function Home() {
  const { products: featuredProducts, error } = await getFeaturedProducts();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero section */}
      <section className="relative h-[500px] w-full overflow-hidden bg-gradient-to-r from-blue-900 to-purple-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Good Fortune by Your Side
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Explore our carefully selected high-quality crystal series, providing infinite energy for your life journey
            </p>
            <Link href="/product/list">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 cursor-pointer">
                Shop Now
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute inset-0 bg-black opacity-40"></div>
      </section>

      {/* Featured products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Featured Products</h2>
            <p className="text-gray-600">Our carefully curated popular crystal series</p>
          </div>
          {error && <div className="text-center text-red-500">Failed to load featured products: {error}</div>}
          {!error && featuredProducts.length === 0 && <div className="text-center text-gray-500">No featured products available.</div>}
          {!error && featuredProducts.length > 0 && <ProductGrid products={featuredProducts} />}
          <div className="text-center mt-12">
            <Link href="/product/list">
              <Button variant="outline" size="lg" className="cursor-pointer">
                View All Products
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Brand features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Our Advantages</h2>
            <p className="text-gray-600">Why choose our crystals</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl mb-4 text-blue-600 mx-auto flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">High-Quality Products</h3>
              <p className="text-gray-600">We only offer high-quality crystals from trusted brands, ensuring you get the best wearing experience.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl mb-4 text-blue-600 mx-auto flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Shipping</h3>
              <p className="text-gray-600">Nationwide delivery within 2-3 days, allowing you to enjoy the comfort of new shoes as soon as possible.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl mb-4 text-blue-600 mx-auto flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payment</h3>
              <p className="text-gray-600">Multiple secure payment options, ensuring your shopping experience is safe and worry-free.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Promotion section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Limited-Time Offer</h2>
          <p className="text-xl mb-8">New customers get 50 off their first order over 500</p>
          <Link href="/product/list">
            <Button className="bg-white text-blue-600 hover:bg-gray-100 cursor-pointer">
              Shop Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
