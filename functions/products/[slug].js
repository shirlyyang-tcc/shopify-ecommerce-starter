// functions/products/[slug].js

async function fetchProductFromShopify(slug, env) {
  const storefrontAccessToken = env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  const shopifyDomain = env.SHOPIFY_STORE_DOMAIN;

  if (!storefrontAccessToken || !shopifyDomain) {
    console.error("Shopify environment variables (SHOPIFY_STOREFRONT_ACCESS_TOKEN, SHOPIFY_STORE_DOMAIN) are not set.");
    return { success: false, message: "Shopify API credentials not configured.", status: 500 };
  }

  const graphqlEndpoint = `https://${shopifyDomain}/api/${env.SHOPIFY_API_VERSION}/graphql.json`; // Use a recent stable API version

  const query = `
    query getProductByHandle($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        description
        descriptionHtml
        handle # This is the slug
        vendor
        productType
        tags
        featuredImage {
          url
          altText
          width
          height
        }
        images(first: 10) {
          edges {
            node {
              url
              altText
              width
              height
            }
          }
        }
        options {
          id
          name
          values
        }
        variants(first: 20) {
          edges {
            node {
              id
              title
              availableForSale
              quantityAvailable
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              image {
                url
                altText
                width
                height
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
      }
    }
  `;

  const variables = { handle: slug };

  try {
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Shopify API error: ${response.status} ${response.statusText}`, errorBody);
      return { success: false, message: `Shopify API error: ${response.status} - ${errorBody}`, status: response.status };
    }

    const jsonResponse = await response.json();
    if (jsonResponse.errors) {
      console.error("Shopify GraphQL errors:", jsonResponse.errors);
      return { success: false, message: "Shopify GraphQL error.", errors: jsonResponse.errors, status: 400 };
    }

    const shopifyProduct = jsonResponse.data?.productByHandle;

    if (!shopifyProduct) {
      return { success: false, message: "Product not found in Shopify.", status: 404 };
    }

    // Transform Shopify product to match frontend Product interface
    const product = {
      id: shopifyProduct.id, // Shopify GID, e.g., "gid://shopify/Product/12345"
      gid: shopifyProduct.id, // Keep GID for consistency or future use
      title: shopifyProduct.title,
      slug: shopifyProduct.handle,
      description: shopifyProduct.description,
      descriptionHtml: shopifyProduct.descriptionHtml,
      vendor: shopifyProduct.vendor,
      productType: shopifyProduct.productType,
      tags: shopifyProduct.tags || [],
      featuredImage: shopifyProduct.featuredImage ? {
        url: shopifyProduct.featuredImage.url,
        altText: shopifyProduct.featuredImage.altText,
        width: shopifyProduct.featuredImage.width,
        height: shopifyProduct.featuredImage.height,
      } : null,
      images: shopifyProduct.images.edges.map(edge => edge.node).map(img => ({
        url: img.url,
        altText: img.altText,
        width: img.width,
        height: img.height,
      })),
      options: shopifyProduct.options.map(opt => ({ // Ensure options have name and values
        id: opt.id,
        name: opt.name,
        values: opt.values
      })),
      variants: shopifyProduct.variants.edges.map(edge => ({
        id: edge.node.id,
        title: edge.node.title,
        price: parseFloat(edge.node.price.amount),
        currencyCode: edge.node.price.currencyCode,
        availableForSale: edge.node.availableForSale,
        stock: edge.node.quantityAvailable || 0,
        compareAtPrice: edge.node.compareAtPrice ? parseFloat(edge.node.compareAtPrice.amount) : undefined,
        image: edge.node.image ? { 
            url: edge.node.image.url, 
            altText: edge.node.image.altText, 
            width: edge.node.image.width, 
            height: edge.node.image.height 
        } : null,
        selectedOptions: edge.node.selectedOptions.map(so => ({ name: so.name, value: so.value }))
      })),
      // Top-level price, stock, etc., for easier access (maps to first variant or default variant logic if needed)
      // For now, let's use minVariantPrice as a general price indicator.
      price: parseFloat(shopifyProduct.priceRange.minVariantPrice.amount),
      currencyCode: shopifyProduct.priceRange.minVariantPrice.currencyCode,
      availableForSale: shopifyProduct.variants.edges.some(edge => edge.node.availableForSale),
      // A simple stock could be the sum of all variants, or based on a default/selected variant in frontend
      // For product detail, usually frontend logic handles stock based on selected variant.
      // We can provide a total stock if meaningful, or rely on variant-specific stock.
      stock: shopifyProduct.variants.edges.reduce((acc, edge) => acc + (edge.node.quantityAvailable || 0), 0), // Example: total stock
      defaultVariant: shopifyProduct.variants.edges.length > 0 ? {
        id: shopifyProduct.variants.edges[0].node.id,
        title: shopifyProduct.variants.edges[0].node.title,
        price: parseFloat(shopifyProduct.variants.edges[0].node.price.amount),
        currencyCode: shopifyProduct.variants.edges[0].node.price.currencyCode,
        availableForSale: shopifyProduct.variants.edges[0].node.availableForSale,
        stock: shopifyProduct.variants.edges[0].node.quantityAvailable || 0,
      } : undefined,
    };

    return { success: true, product };

  } catch (error) {
    console.error("Error fetching product from Shopify:", error);
    return { success: false, message: error.message || "An unexpected error occurred while fetching from Shopify.", status: 500 };
  }
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const slugFromParams = params.slug; // slug from path like /products/the-slug
  const slugFromQuery = url.searchParams.get('slug'); // slug from query like /products?slug=the-slug (useful for generateStaticParams)

  const slugToFetch = slugFromParams || slugFromQuery;

  if (!slugToFetch) {
    return new Response(JSON.stringify({
      success: false,
      message: "Product slug is required."
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  if (env.NEXT_PUBLIC_DEV === "true" || env.DEV === "true") { // Check both potential dev flags
    headers.append('Access-Control-Allow-Origin', env.FRONT_END_URL_DEV || '*');
    headers.append('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.append('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Added Authorization for potential future use
  }
  
  if (request.method === "OPTIONS") {
    return new Response(null, { headers, status: 204 }); // Use 204 No Content for OPTIONS
  }
  
  if (request.method === "GET") {
    const result = await fetchProductFromShopify(slugToFetch, env);
    
    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        message: result.message,
        errors: result.errors, // Propagate Shopify errors if any
      }), {
        status: result.status || 500,
        headers
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      product: result.product
    }), {
      status: 200,
      headers
    });
  }
  
  return new Response(JSON.stringify({
    success: false,
    message: "Method not allowed"
  }), {
    status: 405,
    headers
  });
} 