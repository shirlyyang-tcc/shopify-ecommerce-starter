"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { Product } from '@/interfaces/product';


interface ProductListClientProps {
  initialProducts: Product[];
}

export default function ProductListClient({ initialProducts }: ProductListClientProps) {
  const [products] = useState<Product[]>(initialProducts);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product: Product) => (
          <Card key={product.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="p-0">
              <Link href={`/product/${product.slug}`} className="block">
                <Image
                  src={product.featuredImage?.url || product.images[0]?.url || '/placeholder-image.png'}
                  alt={product.title}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover"
                />
              </Link>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="text-lg font-semibold mb-2 truncate" title={product.title}>
                <Link href={`/product/${product.slug}`}>{product.title}</Link>
              </CardTitle>
              <p className="text-gray-700 text-sm mb-1">Brand: {product.vendor}</p>
              <p className="text-lg font-bold text-primary mt-2">
                {product.price.toFixed(2)} {product.currencyCode}
              </p>
              <p className={`text-sm ${product.availableForSale && product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {product.availableForSale && product.stock > 0 ? `In stock (Stock: ${product.stock})` : 'Out of stock'}
              </p>
            </CardContent>
            <CardFooter className="p-4 bg-gray-50">
              <Link href={`/product/${product.slug}`} passHref>
                <Button variant="outline" className="w-full cursor-pointer">
                  View Details <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
      {products.length === 0 &&(
        <div className="text-center py-10 text-gray-500">No products.</div>
      )}
    </>
  );
} 