/**
 * Shopify GraphQL client
 * Provides a unified API call interface and error handling
 */

export interface ShopifyConfig {
  storeDomain: string;
  storefrontAccessToken: string;
  apiVersion: string;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export interface ShopifyAPIResponse<T = any> {
  success: boolean;
  data?: T;
  errors?: any[];
  message?: string;
}

export class ShopifyClient {
  private config: ShopifyConfig;
  private endpoint: string;

  constructor(config?: Partial<ShopifyConfig>) {
    this.config = {
      storeDomain: config?.storeDomain || process.env.SHOPIFY_STORE_DOMAIN || '',
      storefrontAccessToken: config?.storefrontAccessToken || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
      apiVersion: config?.apiVersion || process.env.SHOPIFY_API_VERSION || '2024-04',
    };

    if (!this.config.storeDomain || !this.config.storefrontAccessToken) {
      throw new Error('Shopify configuration is missing required fields');
    }

    this.endpoint = `https://${this.config.storeDomain}/api/${this.config.apiVersion}/graphql.json`;
  }

  /**
   * Execute a GraphQL query
   */
  async query<T = any>(
    query: string,
    variables?: Record<string, any>
  ): Promise<ShopifyAPIResponse<T>> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': this.config.storefrontAccessToken,
        },
        body: JSON.stringify({
          query,
          variables: variables || {},
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: GraphQLResponse<T> = await response.json();

      // Check for GraphQL errors
      if (result.errors && result.errors.length > 0) {
        return {
          success: false,
          errors: result.errors,
          message: result.errors[0].message,
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        errors: [error],
      };
    }
  }

  /**
   * Execute a GraphQL mutation
   */
  async mutate<T = any>(
    mutation: string,
    variables?: Record<string, any>
  ): Promise<ShopifyAPIResponse<T>> {
    return this.query<T>(mutation, variables);
  }

  /**
   * Execute multiple queries in batch
   */
  async batchQuery<T = any>(
    queries: Array<{ query: string; variables?: Record<string, any> }>
  ): Promise<ShopifyAPIResponse<T[]>> {
    try {
      const promises = queries.map(({ query, variables }) =>
        this.query<T>(query, variables)
      );

      const results = await Promise.all(promises);
      const hasErrors = results.some(result => !result.success);

      if (hasErrors) {
        const errors = results
          .filter(result => !result.success)
          .flatMap(result => result.errors || []);
        
        return {
          success: false,
          errors,
          message: 'Some queries failed',
          data: results.map(result => result.data).filter(Boolean) as T[],
        };
      }

      return {
        success: true,
        data: results.map(result => result.data).filter(Boolean) as T[],
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Batch query failed',
        errors: [error],
      };
    }
  }

  /**
   * Get configuration information
   */
  getConfig(): ShopifyConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ShopifyConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.endpoint = `https://${this.config.storeDomain}/api/${this.config.apiVersion}/graphql.json`;
  }
}

// Create default instance
export const shopifyClient = new ShopifyClient();

// Convenient query function
export const shopifyQuery = <T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<ShopifyAPIResponse<T>> => {
  return shopifyClient.query<T>(query, variables);
};

export const shopifyMutate = <T = any>(
  mutation: string,
  variables?: Record<string, any>
): Promise<ShopifyAPIResponse<T>> => {
  return shopifyClient.mutate<T>(mutation, variables);
};
