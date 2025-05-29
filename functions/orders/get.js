export async function onRequest(context) {
  const { request, env } = context;

  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  if (request.method !== "POST") {
    return new Response(JSON.stringify({
      success: false,
      message: "Method not allowed"
    }), {
      status: 405,
      headers
    });
  }

  try {
    const { customerAccessToken } = await request.json();

    if (!customerAccessToken) {
      return new Response(JSON.stringify({
        success: false,
        message: "Customer access token is required"
      }), {
        status: 401, // Unauthorized
        headers
      });
    }

    const query = `
      query getCustomerOrders($customerAccessToken: String!, $first: Int!) {
        customer(customerAccessToken: $customerAccessToken) {
          orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
            edges {
              node {
                id
                orderNumber
                name # Typically the same as orderNumber with a prefix like #1001
                processedAt
                financialStatus
                fulfillmentStatus
                totalPriceV2 {
                  amount
                  currencyCode
                }
                lineItems(first: 5) { # Get first 5 line items for summary
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
                        priceV2 {
                            amount
                            currencyCode
                        }
                      }
                    }
                  }
                }
              }
            }
            pageInfo { # For pagination if needed later
              hasNextPage
              endCursor
            }
          }
        }
      }
    `;

    const variables = {
      customerAccessToken,
      first: 20 // Get the last 20 orders, adjust as needed
    };

    const shopifyResponse = await fetch(
      `https://${env.SHOPIFY_STORE_DOMAIN}/api/${env.SHOPIFY_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
        },
        body: JSON.stringify({ query, variables })
      }
    );

    const responseData = await shopifyResponse.json();

    if (responseData.errors) {
      console.error("Shopify API errors:", responseData.errors);
      // Check for specific errors, e.g., token invalid or expired
      const primaryError = responseData.errors[0];
      let statusCode = 500;
      if (primaryError.message.toLowerCase().includes("invalid token") || 
          primaryError.message.toLowerCase().includes("customer not found")) {
        statusCode = 401; // Unauthorized or Not Found for customer
      }
      return new Response(JSON.stringify({
        success: false,
        message: "Failed to fetch orders: " + primaryError.message,
        errors: responseData.errors
      }), {
        status: statusCode,
        headers
      });
    }
    
    if (!responseData.data || !responseData.data.customer) {
        // This case can happen if the token is valid but somehow customer data is not returned
        // or if the customer has no orders, Shopify might return customer as null or orders as empty.
        // If customer is null with a valid token, it might imply no orders or an issue.
        // The GraphQL query for orders on a customer with no orders should return an empty edges array, not a null customer.
        // If customer is null, it usually means the access token was invalid or expired.
        console.log("Customer data not found in Shopify response, possibly invalid token or no orders for this token.");
        return new Response(JSON.stringify({
            success: true, // Still a success in terms of API call, but no data
            message: "No customer data found. The access token might be invalid or the customer has no orders.",
            orders: [] // Return empty orders array
        }), {
            status: 200, // Or 404 if you are sure customer should exist but has no data due to token
            headers
        });
    }

    return new Response(JSON.stringify({
      success: true,
      orders: responseData.data.customer.orders.edges.map(edge => edge.node)
    }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error("Error fetching orders:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "An internal error occurred while fetching orders.",
      error: error.message
    }), {
      status: 500,
      headers
    });
  }
} 