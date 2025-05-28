import ProductGrid from "@/components/ui/product-grid";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// 定义产品接口 (可以考虑提取到共享文件中)
interface Product {
  id: string;
  title: string;
  slug: string;
  description?: string; // 首页可能不需要完整描述
  image: string;
  price: number;
  currencyCode?: string; // 首页可能不需要
  variantId?: string;    // 首页可能不需要
  availableForSale?: boolean; // 首页可能不需要
  stock?: number;        // 首页可能不需要
  brand?: string;        // 首页可能不需要
  collections?: Array<{ id: string; title: string; handle: string; }>; // 首页可能不需要
  productType?: string;  // 首页可能不需要
  tags?: string[];       // 首页可能不需要
}

// 数据获取函数 (与 products/page.tsx 类似，但可能参数不同，例如获取少量特色产品)
async function getFeaturedProducts(): Promise<{ products: Product[], error?: string }> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_DEV === 'true' 
      ? process.env.NEXT_PUBLIC_API_URL_DEV 
      : (process.env.NEXT_PUBLIC_API_URL || '');

    if (!apiUrl && process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV !== 'true'){
      console.warn("API URL for production is not set. Falling back to relative path for featured products. Ensure NEXT_PUBLIC_API_URL is set or your Edge Function is configured correctly.")
    }
    
    const queryParams = new URLSearchParams();
    queryParams.append('first', '4'); // 获取4个作为特色产品
    // queryParams.append('sortKey', 'BEST_SELLING'); // 例如，按畅销排序获取特色产品

    const response = await fetch(`${apiUrl}/products?${queryParams.toString()}`, { cache: 'no-store' });
    if (!response.ok) {
      return { products: [], error: `HTTP error! status: ${response.status}` };
    }
    const data = await response.json();

    if (data.success) {
      return { products: data.products };
    } else {
      return { products: [], error: data.message || "获取特色产品失败" };
    }
  } catch (e: unknown) {
    let errorMessage = "获取特色产品时发生未知错误";
    if (e instanceof Error) {
      errorMessage = e.message;
    }
    console.error("获取特色产品失败 (server-side):", e);
    return { products: [], error: errorMessage };
  }
}

export const metadata = {
  title: '好运水晶商城 - 探索高品质水晶系列',
  description: '我们精选各类高品质水晶，为您的生活带来好运与能量。立即探索特色产品和最新到货。'
}

export default async function Home() {
  const { products: featuredProducts, error } = await getFeaturedProducts();

  return (
    <div className="flex flex-col min-h-screen">
      {/* 英雄区 */}
      <section className="relative h-[500px] w-full overflow-hidden bg-gradient-to-r from-blue-900 to-purple-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              好运始于足下
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              探索我们精选的高品质水晶系列，为您的好运之旅提供卓越支持
            </p>
            <Link href="/products">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100">
                立即购买
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute inset-0 bg-black opacity-40"></div>
      </section>

      {/* 特色产品 */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">特色产品</h2>
            <p className="text-gray-600">我们精心挑选的热门水晶系列</p>
          </div>
          {error && <div className="text-center text-red-500">加载特色产品失败: {error}</div>}
          {!error && featuredProducts.length === 0 && <div className="text-center text-gray-500">暂无特色产品。</div>}
          {!error && featuredProducts.length > 0 && <ProductGrid products={featuredProducts} />}
          <div className="text-center mt-12">
            <Link href="/products">
              <Button variant="outline" size="lg">
                查看全部产品
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 品牌特色 */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">我们的优势</h2>
            <p className="text-gray-600">为什么选择我们的水晶</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl mb-4 text-blue-600 mx-auto flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">优质品质</h3>
              <p className="text-gray-600">我们只提供来自可信赖品牌的高品质水晶，确保您获得最佳穿着体验。</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl mb-4 text-blue-600 mx-auto flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">快速配送</h3>
              <p className="text-gray-600">全国范围内2-3天送达，让您尽快享受新鞋带来的舒适体验。</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl mb-4 text-blue-600 mx-auto flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">安全支付</h3>
              <p className="text-gray-600">多种安全支付方式，保障您的购物体验安全无忧。</p>
            </div>
          </div>
        </div>
      </section>

      {/* 促销区 */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">限时优惠</h2>
          <p className="text-xl mb-8">新用户首单满500元立减50元</p>
          <Link href="/products">
            <Button className="bg-white text-blue-600 hover:bg-gray-100">
              立即抢购
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
