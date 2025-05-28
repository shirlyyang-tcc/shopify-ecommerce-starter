"use client";

import { Product, ProductVariant } from '@/interfaces/product';
import { useState, useEffect, useMemo } from 'react';
import Image from "next/image";
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { cn, formatPrice } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { useCart } from '@/context/cart-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addItem, isLoading: isCartLoading, error: cartError } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [currentVariant, setCurrentVariant] = useState<ProductVariant | undefined>(
    product.variants?.length > 0 ? product.variants[0] : undefined
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const initialOptions: Record<string, string> = {};
    if (product.options && product.options.length > 0) {
        product.options.forEach(option => {
            if (option.values.length > 0) {
                initialOptions[option.name] = option.values[0];
            }
        });
        setSelectedOptions(initialOptions);
    }
  }, [product.options]);

  useEffect(() => {
    if (Object.keys(selectedOptions).length === 0 && product.options?.length > 0) {
        // Don't try to find a variant if options haven't been initialized yet
        return;
    }
    const matchedVariant = product.variants?.find(variant =>
      variant.title.split(' / ').every(optionPart => 
        Object.values(selectedOptions).includes(optionPart.trim()))
    );
    setCurrentVariant(matchedVariant || (product.variants?.length > 0 ? product.variants[0] : undefined));
    setCurrentImageIndex(0);
  }, [selectedOptions, product.variants, product.options]);

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionName]: value }));
  };

  const handleAddToCart = async () => {
    if (!currentVariant?.availableForSale) {
      toast.error(currentVariant ? "该商品规格暂无库存" : "请先选择商品规格");
      return;
    }
    if (currentVariant) {
      try {
        await addItem(currentVariant.id, quantity);
        toast.success(`${product.title} (${currentVariant.title}) 已添加到购物车`);
      } catch (e) {
        toast.error("添加到购物车失败，请稍后重试");
        console.error("Failed to add to cart:", e);
      }
    }
  };
  
  useEffect(()=> {
      if(cartError){
          toast.error(`购物车操作失败: ${cartError}`);
      }
  }, [cartError]);

  if (!product) return <div className="container mx-auto p-4">商品信息加载中...</div>;

  const activeVariant = currentVariant;
  const variantImage = activeVariant && activeVariant.image;
  const productImage = product.featuredImage;
  const currentImage = variantImage?.url || productImage?.url;
  const currentImageAlt = variantImage?.altText || productImage?.altText || product.title;

  const allImages = useMemo(() => {
    const pImages = product.images || [];
    const variantImage = currentVariant?.image;
    const images = [...pImages];
    if (variantImage && variantImage.url && !images.some(img => img.url === variantImage.url)) {
      images.unshift(variantImage as { url: string; altText?: string }); 
    }
    return images.length > 0 ? images : [{ url: '/placeholder.svg', altText: 'Placeholder Image' }];
  }, [product.images, currentVariant]);

  const activeVariantImage = currentVariant?.image;
  const displayImage = useMemo(() => {
    const variantImg = currentVariant?.image;
    const currentGalleryImg = allImages[currentImageIndex];
    const featuredImg = product.featuredImage;
    
    if (variantImg?.url) return variantImg;
    if (currentGalleryImg?.url) return currentGalleryImg;
    if (featuredImg?.url) return featuredImg;
    return { url: '/placeholder.svg', altText: 'Placeholder Image' };

  }, [currentVariant, allImages, currentImageIndex, product.featuredImage]);

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + allImages.length) % allImages.length);
  };

  const stockMessage = useMemo(() => {
    if (!currentVariant) return "选择一个规格";
    if (!currentVariant.availableForSale) return "暂无库存";
    if (typeof currentVariant.stock === 'number' && currentVariant.stock <= 5) return `仅剩 ${currentVariant.stock} 件`;
    return "库存充足";
  }, [currentVariant]);

  return (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start max-w-6xl mx-auto py-8 px-4">
      {/* Image Gallery */}
      <div className="relative">
        <div className="aspect-[1/1] relative bg-gray-100 rounded-lg overflow-hidden">
          {displayImage && displayImage.url && (
            <Image
              src={displayImage.url} 
              alt={displayImage.altText || product.title}
              fill
              className="object-cover transition-opacity duration-300 ease-in-out group-hover:opacity-80"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={currentImageIndex === 0} 
            />
          )}
        </div>
        {allImages.length > 1 && (
          <>
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white disabled:opacity-50"
              onClick={prevImage}
              disabled={allImages.length <= 1}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white disabled:opacity-50"
              onClick={nextImage}
              disabled={allImages.length <= 1}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {allImages.map((img, index) => (
                <button
                  key={img.url + index} // Ensure key is unique if urls can repeat
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    "h-2 w-2 rounded-full bg-gray-400 hover:bg-gray-600 transition-colors",
                    { "bg-gray-800 scale-125": currentImageIndex === index }
                  )}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{product.title}</h1>
          <p className="text-lg text-gray-600 mt-2">由 {product.vendor} 提供</p>
        </div>

        <div className="text-3xl font-semibold">
          {currentVariant ? formatPrice(currentVariant.price, currentVariant.currencyCode) : formatPrice(product.price, product.currencyCode)}
        </div>

        {/* Options Selection */}
        <div className="space-y-4">
          {product.options?.map((option) => (
            <div key={option.name}>
              <Label htmlFor={option.name} className="text-sm font-medium">
                {option.name}
              </Label>
              {option.values.length > 3 ? (
                <Select
                  value={selectedOptions[option.name]}
                  onValueChange={(value: string) => handleOptionChange(option.name, value)}
                >
                  <SelectTrigger id={option.name} className="mt-1">
                    <SelectValue placeholder={`选择 ${option.name}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {option.values.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <RadioGroup
                  id={option.name}
                  value={selectedOptions[option.name]}
                  onValueChange={(value: string) => handleOptionChange(option.name, value)}
                  className="mt-2 flex space-x-2"
                >
                  {option.values.map((value) => (
                    <Label
                      key={value}
                      htmlFor={`${option.name}-${value}`}
                      className={cn(
                        "border rounded-md py-2 px-3 text-sm cursor-pointer hover:bg-gray-50",
                        selectedOptions[option.name] === value ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-white text-gray-900"
                      )}
                    >
                      <RadioGroupItem value={value} id={`${option.name}-${value}`} className="sr-only" />
                      {value}
                    </Label>
                  ))}
                </RadioGroup>
              )}
            </div>
          ))}
        </div>

        {/* Quantity and Add to Cart */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center border rounded-md">
            <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="rounded-r-none"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <input 
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 text-center border-l border-r focus:ring-0 focus:outline-none"
              min="1"
            />
            <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)}
              className="rounded-l-none"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            size="lg" 
            onClick={handleAddToCart} 
            disabled={isCartLoading || !currentVariant?.availableForSale}
            className="flex-1"
          >
            {isCartLoading ? "添加中..." : (currentVariant?.availableForSale ? "添加到购物车" : (currentVariant ? "已售罄" : "选择规格"))}
          </Button>
        </div>
        
        <p className={cn(
          "text-sm",
          currentVariant?.availableForSale && typeof currentVariant.stock === 'number' && currentVariant.stock <= 5 ? "text-orange-600" : "text-gray-600"
        )}>
          {stockMessage}
        </p>

        {/* Product Description */}
        {product.descriptionHtml || product.description ? (
          <div>
            <h3 className="text-xl font-semibold mb-2">商品详情</h3>
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml || product.description || '' }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
} 