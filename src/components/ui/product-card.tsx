"use client";

import { formatPrice } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./button";
import { useCart } from "@/context/cart-context";
import { toast } from "sonner";

export interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  slug: string;
  variantId: string;
}

const ProductCard = ({ title, price, image, slug, variantId }: ProductCardProps) => {
  const { addItem } = useCart();

  const addToCart = async () => {
    try {
      await addItem(variantId, 1);
      toast.success(`${title} has been added to cart!`);
    } catch (error) {
      console.error("Failed to add item to cart:", error);
      toast.error("Failed to add to cart. Please try again later.");
    }
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
          Add to Cart
        </Button>
      </div>
    </div>
  );
};

export default ProductCard; 