import { Product } from "@/interfaces/product"; // 使用共享接口
import ProductDetailClient from "@/components/ui/product-detail-client"; // 新的客户端组件
import { Metadata } from 'next';

// 定义 PageInfo 接口，用于处理分页
interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

// API URL 获取逻辑 (与 products/page.tsx 类似)
function getApiUrlBase(): string {
  const isDev = process.env.NEXT_PUBLIC_DEV === 'true';
  const devApiUrl = process.env.NEXT_PUBLIC_API_URL_DEV;
  const prodApiUrl = process.env.NEXT_PUBLIC_API_URL || ''; // 默认为相对路径

  if (isDev) {
    if (!devApiUrl) {
      console.warn("NEXT_PUBLIC_API_URL_DEV is not set. Using relative path for API in dev.");
      return ''; // 或者抛出错误，或者使用默认的 localhost 地址
    }
    return devApiUrl;
  }
  return prodApiUrl; // 生产环境可能为空，表示相对路径
}


// 1. 实现 fetchAllProducts 以获取所有产品用于 generateStaticParams
async function fetchAllProducts(): Promise<{ products: Product[], error?: string }> {
  let allProducts: Product[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;
  const apiUrlBase = getApiUrlBase();

  while (hasNextPage) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('first', '50'); // 获取较多数量以减少请求次数
      if (cursor) {
        queryParams.append('after', cursor);
      }

      const response = await fetch(`${apiUrlBase}/products?${queryParams.toString()}`, { cache: 'no-store' });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error in fetchAllProducts! Status: ${response.status}`, errorText);
        if (response.status === 404 && allProducts.length > 0) {
           hasNextPage = false; 
           continue;
        }
        return { products: [], error: `HTTP error! status: ${response.status}. ${errorText}` };
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.products)) {
        allProducts = allProducts.concat(data.products);
        const pageInfo = data.pageInfo as PageInfo | null;
        hasNextPage = pageInfo?.hasNextPage || false;
        cursor = pageInfo?.endCursor || null;
        if (!hasNextPage) break;
      } else {
        console.error("Failed to fetch all products or unexpected data format:", data.message || data);
        return { products: [], error: data.message || "获取所有产品列表失败或数据格式不正确" };
      }
    } catch (e: unknown) {
      let errorMessage = "获取所有产品时发生未知错误";
      if (e instanceof Error) {
        errorMessage = e.message;
      }
      console.error(`获取所有产品失败 (fetchAllProducts): ${errorMessage}`, e);
      return { products: [], error: errorMessage };
    }
  }
  return { products: allProducts };
}

// 2. 更新 generateStaticParams
export async function generateStaticParams() {
  console.log("Generating static params for product slugs...");
  const { products, error } = await fetchAllProducts();

  if (error) {
    console.error("Error fetching products for generateStaticParams:", error);
    return []; 
  }

  if (!products || products.length === 0) {
    console.warn("No products found to generate static params.");
    return [];
  }
  
  const params = products.map((product) => ({
    slug: product.slug,
  }));
  console.log(`Found ${params.length} slugs to generate: ${params.map(p=>p.slug).join(', ')}`);
  return params;
}

// 3. 更新 getProductBySlug 以从API获取单个产品
async function getProductBySlug(slug: string): Promise<Product | null> {
  const apiUrlBase = getApiUrlBase();
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('query', `handle:${slug}`);
    queryParams.append('first', '1'); 

    const response = await fetch(`${apiUrlBase}/products/${slug}`, { cache: 'no-store' });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error in getProductBySlug for slug ${slug}! Status: ${response.status}`, errorText);
      return null;
    }

    const data = await response.json();

    if (data.success && data.product) {
      // console.log('data.products[0]',data.products[0]);
      return data.product as Product;
    } else if (data.success && Array.isArray(data.products) && data.products.length === 0) {
      console.warn(`Product with slug '${slug}' not found via API.`);
      return null;
    }
    else {
      console.error(`Failed to fetch product by slug '${slug}' or unexpected data format:`, data.message || data);
      return null;
    }
  } catch (e: unknown) {
    let errorMessage = `获取产品 (slug: ${slug}) 时发生未知错误`;
    if (e instanceof Error) {
      errorMessage = e.message;
    }
    console.error(`获取产品失败 (getProductBySlug for slug: ${slug}): ${errorMessage}`, e);
    return null;
  }
}

// 4. 更新 generateMetadata
export async function generateMetadata(
  { params }: { params: { slug: string } }, 
  // parent: ResolvingMetadata // Commented out as it's not used
): Promise<Metadata> {
  const {slug} = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return {
      title: "产品未找到",
      description: "抱歉，我们找不到您请求的产品。",
      alternates: {
        canonical: `/products/${params.slug}`,
      },
    };
  }
  
  return {
    title: `${product.title} - 水晶商城`, 
    description: product.descriptionHtml ? product.descriptionHtml.substring(0, 160) : (product.description || '').substring(0,160), 
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    // @ts-expect-error Type '"product"' is not assignable to type OpenGraphType | undefined. However, "product" is a valid Open Graph type.
    openGraph: {
      title: product.title,
      description: product.descriptionHtml ? product.descriptionHtml.substring(0, 160) : (product.description || '').substring(0,160),
      url: `/products/${product.slug}`,
      siteName: '水晶商城', 
      // price: product.price,
      images: [
        {
          url: product.featuredImage?.url || '/placeholder-image.png', 
          width: product.featuredImage?.width || 800,
          height: product.featuredImage?.height || 600,
          alt: product.featuredImage?.altText || product.title,
        },
      ],
      // type: 'product', 
    },
  };
}

// 5. 页面组件保持不变，它已经使用了 getProductBySlug
export default async function ProductPage({ params }: { params: { slug: string } }) {
  const {slug} = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return <div className="container mx-auto px-4 py-8 text-center">产品未找到。</div>;
  }

  return <ProductDetailClient product={product} />;
} 