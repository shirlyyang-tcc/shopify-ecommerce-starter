import { getProducts } from '@/lib/shopify';
import { Product } from '@/interfaces/product';
import ProductDetailClient from "@/components/ui/product-detail-client";
import { Metadata } from 'next';
interface Props {
  params: Promise<{
    slug: string;
  }>;
}

// 这个函数告诉 Next.js 在构建时需要预渲染哪些产品页面
export async function generateStaticParams() {
  const products = await getProducts();
  
  return products.map((product: Product) => ({
    slug: product.slug,
  }));
}

// 生成页面的元数据
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const products = await getProducts();
  const {slug} = await params;
  const product = products.find((p: Product) => p.slug === slug);

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
    };
  }

  return {
    title: product.title,
    description: product.description,
  };
}

// 页面组件
export default async function ProductPage({ params }: Props) {
  const products = await getProducts();
  const {slug} = await params;

  const product = products.find((p: Product) => p.slug === slug);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p>The requested product could not be found.</p>
      </div>
    );
  }

  return <ProductDetailClient product={product} />;
} 