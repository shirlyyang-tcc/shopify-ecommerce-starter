"use client";

import { formatPrice } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./button";

export interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  slug: string;
}

const ProductCard = ({ id, title, price, image, slug }: ProductCardProps) => {
  const addToCart = () => {
    // 在实际应用中，这里会调用添加到购物车的函数
    console.log(`添加商品 ${id} 到购物车`);
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md transition-all hover:shadow-lg">
      <Link href={`/products/${slug}`} className="block aspect-square overflow-hidden">
        <Image
          src={image}
          alt={title}
          width={300}
          height={300}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </Link>
      <div className="p-4">
        <Link href={`/products/${slug}`}>
          <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>
        </Link>
        <p className="mb-4 text-xl font-bold text-gray-900">
          {formatPrice(price)}
        </p>
        <Button 
          onClick={addToCart}
          className="w-full"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          加入购物车
        </Button>
      </div>
    </div>
  );
};

export default ProductCard; 