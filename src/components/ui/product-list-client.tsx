"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { Product } from '@/types/product';

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

interface ProductListClientProps {
  initialProducts: Product[];
  initialPageInfo: PageInfo | null;
}

export default function ProductListClient({ initialProducts, initialPageInfo }: ProductListClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(initialPageInfo);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMoreProducts = async (cursor: string | null) => {
    if (!cursor) return;
    setLoadingMore(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_DEV === 'true' 
        ? process.env.NEXT_PUBLIC_API_URL_DEV 
        : ''; // Relative path for production
      
      const queryParams = new URLSearchParams();
      queryParams.append('first', '8'); // Load 8 products each time
      queryParams.append('after', cursor);

      const response = await fetch(`${apiUrl}/products?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.success) {
        setProducts(prevProducts => [...prevProducts, ...data.products]);
        setPageInfo(data.pageInfo);
      } else {
        throw new Error(data.message || "Failed to load more products");
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred");
      }
      console.error("Failed to load more products:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="p-0">
              <Link href={`/products/${product.slug}`} className="block">
                <Image
                  src={product.image || '/placeholder-image.png'}
                  alt={product.title}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover"
                />
              </Link>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="text-lg font-semibold mb-2 truncate" title={product.title}>
                <Link href={`/products/${product.slug}`}>{product.title}</Link>
              </CardTitle>
              <p className="text-gray-700 text-sm mb-1">Brand: {product.brand}</p>
              <p className="text-lg font-bold text-primary mt-2">
                {product.price.toFixed(2)} {product.currencyCode}
              </p>
              <p className={`text-sm ${product.availableForSale && product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {product.availableForSale && product.stock > 0 ? `In stock (Stock: ${product.stock})` : 'Out of stock'}
              </p>
            </CardContent>
            <CardFooter className="p-4 bg-gray-50">
              <Link href={`/products/${product.slug}`} passHref>
                <Button variant="outline" className="w-full">
                  View Details <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
      {error && <div className="text-center py-4 text-red-500">Error loading more products: {error}</div>}
      {pageInfo?.hasNextPage && (
        <div className="mt-8 text-center">
          <Button onClick={() => fetchMoreProducts(pageInfo.endCursor)} disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
      {!loadingMore && products.length === 0 && !pageInfo?.hasNextPage && !error && (
        <div className="text-center py-10 text-gray-500">No products.</div>
      )}
    </>
  );
} 