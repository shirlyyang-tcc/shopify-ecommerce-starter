import { Product, ProductImage, ProductVariant } from '@/interfaces/product';

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const storefrontAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-04";

const endpoint = `https://${domain}/api/${apiVersion}/graphql.json`;

type Variables = Record<string, unknown>;

async function shopifyFetch<T>({ query, variables }: { query: string; variables?: Variables }): Promise<T> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken!,
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0].message || 'Shopify API Error');
    }

    return data.data;
  } catch (error) {
    console.error('Shopify API Error:', error);
    throw error;
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const query = `
      query GetProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              description
              descriptionHtml
              vendor
              productType
              tags
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              images(first: 5) {
                edges {
                  node {
                    url
                    altText
                    width
                    height
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    sku
                    price {
                      amount
                      currencyCode
                    }
                    compareAtPrice {
                      amount
                      currencyCode
                    }
                    availableForSale
                    quantityAvailable
                    image {
                      url
                      altText
                      width
                      height
                    }
                  }
                }
              }
              options {
                name
                values
              }
            }
          }
        }
      }
    `;

    const data = await shopifyFetch<{
      products: {
        edges: Array<{
          node: {
            id: string;
            title: string;
            handle: string;
            description: string;
            descriptionHtml: string;
            vendor: string;
            productType: string;
            tags: string[];
            priceRange: {
              minVariantPrice: {
                amount: string;
                currencyCode: string;
              };
            };
            images: {
              edges: Array<{
                node: {
                  url: string;
                  altText: string | null;
                  width: number;
                  height: number;
                };
              }>;
            };
            variants: {
              edges: Array<{
                node: {
                  id: string;
                  title: string;
                  sku: string | null;
                  price: {
                    amount: string;
                    currencyCode: string;
                  };
                  compareAtPrice: {
                    amount: string;
                    currencyCode: string;
                  } | null;
                  availableForSale: boolean;
                  quantityAvailable: number | null;
                  image: {
                    url: string;
                    altText: string | null;
                    width: number;
                    height: number;
                  } | null;
                };
              }>;
            };
            options: Array<{
              name: string;
              values: string[];
            }>;
          };
        }>;
      };
    }>({
      query,
      variables: {
        first: 100, // 获取前100个产品，可以根据需要调整
      },
    });

    return data.products.edges.map(({ node }) => {
      // 处理图片数据
      const images: ProductImage[] = node.images.edges.map(edge => ({
        url: edge.node.url,
        altText: edge.node.altText || undefined,
        width: edge.node.width,
        height: edge.node.height,
      }));

      // 处理变体数据
      const variants: ProductVariant[] = node.variants.edges.map(edge => ({
        id: edge.node.id,
        title: edge.node.title,
        sku: edge.node.sku || undefined,
        price: parseFloat(edge.node.price.amount),
        currencyCode: edge.node.price.currencyCode,
        compareAtPrice: edge.node.compareAtPrice ? parseFloat(edge.node.compareAtPrice.amount) : null,
        availableForSale: edge.node.availableForSale,
        stock: edge.node.quantityAvailable || 0,
        image: edge.node.image ? {
          url: edge.node.image.url,
          altText: edge.node.image.altText || undefined,
          width: edge.node.image.width,
          height: edge.node.image.height,
        } : images[0], // 如果变体没有图片，使用第一个产品图片
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
        collections: [], // 如果需要collections数据，需要在GraphQL查询中添加相关字段
        // 从默认变体中获取的简化字段
        price: defaultVariant.price,
        currencyCode: defaultVariant.currencyCode,
        availableForSale: defaultVariant.availableForSale,
        stock: defaultVariant.stock,
        variantId: defaultVariant.id,
      };
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
} 