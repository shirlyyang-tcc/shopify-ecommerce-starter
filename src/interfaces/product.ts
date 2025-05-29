// src/interfaces/product.ts

export interface ProductCollection {
  id: string;
  title: string;
  handle: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku?: string;
  price: number;
  currencyCode: string;
  compareAtPrice?: number | null;
  availableForSale: boolean;
  stock: number; // Corresponds to quantityAvailable
  image: ProductImage;
  // selectedOptions?: Array<{ name: string; value: string; }>; // If needed from API
}

export interface ProductImage {
  url: string;
  altText?: string;
  width?: number;
  height?: number;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface Product {
  id: string; // Shopify GID (e.g., gid://shopify/Product/12345) or just the ID part
  gid?: string; // Full Shopify GID, if needed
  title: string;
  slug: string; // Corresponds to handle in Shopify
  description: string;
  descriptionHtml?: string;
  vendor: string; // Corresponds to brand
  productType: string;
  tags: string[];
  
  featuredImage: ProductImage | null; // Or a simple string URL if that's how it's processed
  images: ProductImage[];
  
  variants: ProductVariant[]; // Array of variants
  defaultVariant?: ProductVariant; // Often helpful to have the first or default variant easily accessible

  options: ProductOption[];
  collections?: ProductCollection[];

  // Fields used by product page but derived/simplified from variants for display
  price: number; // Price of the default/selected variant
  currencyCode: string; // Currency code of the default/selected variant
  availableForSale: boolean; // Availability of the default/selected variant
  stock: number; // Stock of the default/selected variant
  variantId?: string; // ID of the default/selected variant, useful for cart operations
}

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
  hasPreviousPage?: boolean;
  startCursor?: string | null;
} 