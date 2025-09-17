import { ProductService } from '@/lib/shopify';
import { Product } from '@/interfaces/product';
import ProductDetailClient from "@/components/ui/product-detail-client";
import { Metadata } from 'next';
interface Props {
  params: Promise<{
    slug: string;
  }>;
}

// This function tells Next.js which product pages to pre-render at build time
export async function generateStaticParams() {
  const products = await ProductService.getProducts();
  
  return products.map((product: Product) => ({
    slug: product.slug,
  }));
}

// Generate page metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const products = await ProductService.getProducts();
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

// Page component
export default async function ProductPage({ params }: Props) {
  const products = await ProductService.getProducts();
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