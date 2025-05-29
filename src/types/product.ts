export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  price: number;
  currencyCode: string;
  variantId: string;
  availableForSale: boolean;
  stock: number;
  brand: string;
  collections: Array<{ id: string; title: string; handle: string; }>;
  productType: string;
  tags: string[];
} 