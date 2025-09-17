/**
 * Shopify library entry file
 * Unified export of all Shopify related tools and services
 */

import { ProductService } from './services';

// Export client
export { ShopifyClient, shopifyClient, shopifyQuery, shopifyMutate } from './client';
export type { ShopifyConfig, ShopifyAPIResponse, GraphQLResponse } from './client';

// Export all queries
export * as queries from './queries';

// Export services
export {
  CartService,
  CustomerService,
  ProductService,
  CollectionService,
  // Convenient aliases
  CartService as Cart,
  CustomerService as Customer,
  ProductService as Product,
  CollectionService as Collection,
} from './services';

// Export types
export type {
  CartCreateInput,
  CartLineInput,
  CartLineUpdateInput,
  CustomerCreateInput,
  CustomerAccessTokenCreateInput,
  PaginationParams,
  SortParams,
} from './queries';
