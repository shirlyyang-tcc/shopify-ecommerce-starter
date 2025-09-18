/**
 * Shopify business service layer
 * Provides advanced business logic encapsulation, based on query collections and client
 */

import { Product, ProductImage, ProductVariant } from '@/interfaces/product';
import { shopifyClient, ShopifyAPIResponse } from './client';
import * as queries from './queries';

// =============================================================================
// Cart Service
// =============================================================================

export class CartService {
  /**
   * Get cart information
   */
  static async getCart(cartId: string): Promise<ShopifyAPIResponse> {
    return shopifyClient.query(queries.GET_CART_QUERY, { cartId });
  }

  /**
   * Create a cart
   */
  static async createCart(input?: queries.CartCreateInput): Promise<ShopifyAPIResponse> {
    return shopifyClient.mutate(queries.CREATE_CART_MUTATION, { 
      input: input || {} 
    });
  }

  /**
   * Add items to cart
   */
  static async addToCart(
    cartId: string, 
    lines: queries.CartLineInput[]
  ): Promise<ShopifyAPIResponse> {
    return shopifyClient.mutate(queries.ADD_TO_CART_MUTATION, {
      cartId,
      lines,
    });
  }

  /**
   * Remove items from cart
   */
  static async removeFromCart(
    cartId: string, 
    lineIds: string[]
  ): Promise<ShopifyAPIResponse> {
    return shopifyClient.mutate(queries.REMOVE_FROM_CART_MUTATION, {
      cartId,
      lineIds,
    });
  }

  /**
   * Update cart item quantities
   */
  static async updateCart(
    cartId: string, 
    lines: queries.CartLineUpdateInput[]
  ): Promise<ShopifyAPIResponse> {
    return shopifyClient.mutate(queries.UPDATE_CART_MUTATION, {
      cartId,
      lines,
    });
  }

  /**
   * Add a single item to cart (convenience method)
   */
  static async addSingleItem(
    cartId: string,
    variantId: string,
    quantity: number
  ): Promise<ShopifyAPIResponse> {
    return this.addToCart(cartId, [{
      merchandiseId: variantId,
      quantity,
    }]);
  }

  /**
   * Update quantity of a single item (convenience method)
   */
  static async updateSingleItem(
    cartId: string,
    lineId: string,
    quantity: number
  ): Promise<ShopifyAPIResponse> {
    return this.updateCart(cartId, [{
      id: lineId,
      quantity,
    }]);
  }
}

// =============================================================================
// Customer Service
// =============================================================================

export class CustomerService {
  /**
   * Customer registration
   */
  static async register(input: queries.CustomerCreateInput): Promise<ShopifyAPIResponse> {
    return shopifyClient.mutate(queries.CREATE_CUSTOMER_MUTATION, { input });
  }

  /**
   * Customer login
   */
  static async login(input: queries.CustomerAccessTokenCreateInput): Promise<ShopifyAPIResponse> {
    return shopifyClient.mutate(queries.CREATE_CUSTOMER_ACCESS_TOKEN_MUTATION, { input });
  }

  /**
   * Customer logout
   */
  static async logout(customerAccessToken: string): Promise<ShopifyAPIResponse> {
    return shopifyClient.mutate(queries.REVOKE_CUSTOMER_ACCESS_TOKEN_MUTATION, {
      customerAccessToken,
    });
  }

  /**
   * Get customer information
   */
  static async getCustomer(customerAccessToken: string): Promise<ShopifyAPIResponse> {
    return shopifyClient.query(queries.GET_CUSTOMER_QUERY, { customerAccessToken });
  }

  /**
   * Get customer orders
   */
  static async getCustomerOrders(
    customerAccessToken: string, 
    first: number = 20
  ): Promise<ShopifyAPIResponse> {
    return shopifyClient.query(queries.GET_CUSTOMER_ORDERS_QUERY, {
      customerAccessToken,
      first,
    });
  }
}

// =============================================================================
// Product Service
// =============================================================================

export class ProductService {
  /**
   * Get product by handle
   */
  static async getProductByHandle(handle: string): Promise<ShopifyAPIResponse> {
    return shopifyClient.query(queries.GET_PRODUCT_BY_HANDLE_QUERY, { handle });
  }

  /**
   * Get product list
   */
  static async getProducts(params: {
    first?: number;
    after?: string;
    sortKey?: string;
    reverse?: boolean;
    query?: string;
  } = {}): Promise<Array<Product>> {
    const {
      first = 20,
      after,
      sortKey = 'CREATED_AT',
      reverse = true,
      query,
    } = params;

    const {data} = await shopifyClient.query(queries.GET_PRODUCTS_QUERY, {
      first,
      after,
      sortKey,
      reverse,
      query,
    });
    return data.products.edges.map(({ node }: { node: any }) => {
        // Process image data
        const images: ProductImage[] = node.images.edges.map((edge: any)     => ({
          url: edge.node.url,
          altText: edge.node.altText || undefined,
          width: edge.node.width,
          height: edge.node.height,
        }));
  
        // Process variant data
        const variants: ProductVariant[] = node.variants.edges.map((edge: any) => ({
          id: edge.node.id,
          title: edge.node.title,
          sku: edge.node.sku || undefined,
          price: parseFloat(edge.node.priceV2.amount),
          currencyCode: edge.node.priceV2.currencyCode,
          compareAtPrice: edge.node.compareAtPriceV2 ? parseFloat(edge.node.compareAtPriceV2.amount) : null,
          availableForSale: edge.node.availableForSale,
          stock: edge.node.quantityAvailable || 0,
          image: edge.node.image ? {
            url: edge.node.image.url,
            altText: edge.node.image.altText || undefined,
            width: edge.node.image.width,
            height: edge.node.image.height,
          } : images[0], // If variant has no image, use first product image
        }));
  
        const defaultVariant = variants[0];
  
        return {
          id: node.id,
          title: node.title,
          slug: node.handle,
          description: node.description,
          descriptionHtml: node.descriptionHtml,
          vendor: node.vendor,
          productType: node.productType,
          tags: node.tags,
          featuredImage: images[0] || null,
          images,
          variants,
          defaultVariant,
          options: node.options,
          collections: [], // If collections data needed, add related fields in GraphQL query
          // Get simplified fields from default variant
          price: defaultVariant.price,
          currencyCode: defaultVariant.currencyCode,
          availableForSale: defaultVariant.availableForSale,
          stock: defaultVariant.stock,
          variantId: defaultVariant.id,
        };
      });
  }

  /**
   * Search products
   */
  static async searchProducts(
    searchQuery: string, 
    options: {
      first?: number;
      after?: string;
      sortKey?: string;
      reverse?: boolean;
    } = {}
  ): Promise<Array<Product>> {
    return this.getProducts({
      ...options,
      query: searchQuery,
    });
  }
}

// =============================================================================
// Collection Service
// =============================================================================

export class CollectionService {
  /**
   * Get collection list
   */
  static async getCollections(params: {
    first?: number;
    after?: string;
  } = {}): Promise<ShopifyAPIResponse> {
    const { first = 20, after } = params;
    return shopifyClient.query(queries.GET_COLLECTIONS_QUERY, { first, after });
  }

  /**
   * Get collection by handle
   */
  static async getCollectionByHandle(
    handle: string,
    params: {
      first?: number;
      after?: string;
      sortKey?: string;
      reverse?: boolean;
    } = {}
  ): Promise<ShopifyAPIResponse> {
    const {
      first = 20,
      after,
      sortKey = 'BEST_SELLING',
      reverse = false,
    } = params;

    return shopifyClient.query(queries.GET_COLLECTION_BY_HANDLE_QUERY, {
      handle,
      first,
      after,
      sortKey,
      reverse,
    });
  }
}
