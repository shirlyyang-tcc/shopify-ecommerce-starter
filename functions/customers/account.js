// functions/customers/account.js

async function getShopifyCustomerData(customerAccessToken, env) {
  const storefrontAccessToken = env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  const shopifyDomain = env.SHOPIFY_STORE_DOMAIN;
  const apiVersion = env.SHOPIFY_API_VERSION || '2024-04';

  if (!storefrontAccessToken || !shopifyDomain) {
    console.error("Shopify environment variables for customer data are not set.");
    return { success: false, message: "Shopify API credentials not configured.", status: 500 };
  }

  const graphqlEndpoint = `https://${shopifyDomain}/api/${apiVersion}/graphql.json`;

  // Query to get customer data including orders and addresses
  const query = `
    query($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id
        firstName
        lastName
        email
        phone
        acceptsMarketing
        createdAt
        updatedAt
        defaultAddress {
          id
          address1
          address2
          city
          zip
          province
          country
          phone
        }
        addresses(first: 5) {
          edges {
            node {
              id
              address1
              address2
              city
              zip
              province
              country
              phone
            }
          }
        }
        orders(first: 10, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id
              name
              processedAt
              financialStatus
              fulfillmentStatus
              totalPrice {
                amount
                currencyCode
              }
              lineItems(first: 5) {
                edges {
                  node {
                    title
                    quantity
                    variant {
                      title
                      image {
                        url
                        altText
                      }
                      price {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables =  { customerAccessToken: customerAccessToken };
  console.log('customerAccessToken', customerAccessToken);
  try {
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken, // This is the public storefront token
      },
      body: JSON.stringify({ query, variables }),
    });

    const jsonResponse = await response.json();
    
    if (!response.ok || jsonResponse.errors) {
      console.error("Shopify customer data error:", jsonResponse.errors || await response.text());
      // Check for specific errors related to invalid token
      if (jsonResponse.errors && jsonResponse.errors.some(err => err.message.includes("CustomerAccessTokenInvalid") || err.message.includes("CustomerAccessTokenExpired"))){
        return { success: false, message: "Session expired or invalid. Please login again.", status: 401, errorCode: 'TOKEN_INVALID' };
      }
      const errorMessage = jsonResponse.errors?.[0]?.message || "Failed to fetch customer data.";
      return { success: false, message: errorMessage, errors: jsonResponse.errors, status: response.status === 200 ? 400 : response.status };
    }

    const customerData = jsonResponse.data?.customer;

    if (customerData) {
      // Transform addresses and orders if necessary, or return as is
      const transformedCustomer = {
        ...customerData,
        addresses: customerData.addresses.edges.map(edge => edge.node),
        orders: customerData.orders.edges.map(edge => ({
            ...edge.node,
            lineItems: edge.node.lineItems.edges.map(itemEdge => itemEdge.node)
        })),
      };
      return { success: true, customer: transformedCustomer };
    } else {
      // This case can happen if token is invalid/expired and Shopify returns null for customer but no explicit error
      console.warn("No customer data returned from Shopify, token might be invalid/expired.");
      return { success: false, message: "Could not retrieve customer data. Your session may have expired.", status: 401, errorCode: 'NO_CUSTOMER_DATA' };
    }

  } catch (error) {
    console.error("Error in getShopifyCustomerData:", error);
    return { success: false, message: error.message || "An unexpected error occurred while fetching customer data.", status: 500 };
  }
}

export async function onRequest(context) {
  const { request, env } = context;

  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ success: false, message: "Method not allowed. Please use GET." }), {
      status: 405,
      headers
    });
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, message: "Authorization header with Bearer token is required." }), {
      status: 401,
      headers
    });
  }

  const customerAccessToken = authHeader.split('Bearer ')[1];

  if (!customerAccessToken) {
    return new Response(JSON.stringify({ success: false, message: "Customer access token is missing." }), {
      status: 401,
      headers
    });
  }

  try {
    const accountResult = await getShopifyCustomerData(customerAccessToken, env);

    if (!accountResult.success) {
      return new Response(JSON.stringify({
        success: false,
        message: accountResult.message,
        errorCode: accountResult.errorCode,
        errors: accountResult.errors,
      }), {
        status: accountResult.status || 400,
        headers
      });
    }

    return new Response(JSON.stringify({
      success: true,
      customer: accountResult.customer,
    }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error("[functions/customers/account.js] Error processing request:", error);
    return new Response(JSON.stringify({ success: false, message: "An error occurred processing your account data request." }), {
      status: 500,
      headers
    });
  }
} 