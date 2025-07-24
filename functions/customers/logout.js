// functions/customers/logout.js

async function deleteShopifyCustomerAccessToken(customerAccessToken, env) {
  const storefrontAccessToken = env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  const shopifyDomain = env.SHOPIFY_STORE_DOMAIN;
  const apiVersion = env.SHOPIFY_API_VERSION || '2024-04';

  if (!storefrontAccessToken || !shopifyDomain) {
    console.error("Shopify environment variables for customer token deletion are not set.");
    return { success: false, message: "Shopify API credentials not configured.", status: 500 };
  }

  const graphqlEndpoint = `https://${shopifyDomain}/api/${apiVersion}/graphql.json`;

  const mutation = `
    mutation customerAccessTokenDelete($customerAccessToken: String!) {
      customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
        deletedAccessToken
        deletedCustomerAccessTokenId
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = { customerAccessToken };

  try {
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    const jsonResponse = await response.json();

    if (!response.ok || jsonResponse.errors) {
      console.error("Shopify customerAccessTokenDelete error:", jsonResponse.errors || await response.text());
      const shopifyErrors = jsonResponse.data?.customerAccessTokenDelete?.userErrors || jsonResponse.errors;
      const errorMessage = shopifyErrors?.[0]?.message || "Failed to logout.";
      return { 
        success: false, 
        message: errorMessage, 
        errors: shopifyErrors, 
        status: response.status === 200 ? 400 : response.status 
      };
    }
    
    const userErrors = jsonResponse.data?.customerAccessTokenDelete?.userErrors;

    if (userErrors && userErrors.length > 0) {
      console.warn("Shopify customer user errors during logout:", userErrors);
      return { success: false, message: userErrors[0].message, errors: userErrors, status: 400 };
    }

    // If deletedAccessToken is present (even if null, it means the call was structurally successful regarding this token)
    // or if there are no userErrors, consider it a success from Shopify's perspective for this operation.
    if (jsonResponse.data?.customerAccessTokenDelete && ('deletedAccessToken' in jsonResponse.data.customerAccessTokenDelete)) {
        return { success: true, deletedAccessToken: jsonResponse.data.customerAccessTokenDelete.deletedAccessToken };
    }

    console.error("Unexpected response structure from Shopify customerAccessTokenDelete:", jsonResponse);
    return { success: false, message: "Failed to logout. Unexpected response from Shopify.", status: 500 };

  } catch (error) {
    console.error("Error in deleteShopifyCustomerAccessToken:", error);
    return { success: false, message: error.message || "An unexpected error occurred during logout.", status: 500 };
  }
}

export async function onRequest(context) {
  const { request, env } = context;

  const headers = new Headers({
    'Content-Type': 'application/json' 
  });


  if (request.method === "OPTIONS") {
    return new Response(null, { headers, status: 204 });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ success: false, message: "Method not allowed. Please use POST." }), {
      status: 405,
      headers
    });
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, message: "Authorization header with Bearer token is required for logout." }), {
      status: 401,
      headers
    });
  }

  const customerAccessToken = authHeader.split('Bearer ')[1];

  if (!customerAccessToken) {
    return new Response(JSON.stringify({ success: false, message: "Customer access token is missing for logout." }), {
      status: 401,
      headers
    });
  }

  try {
    const logoutResult = await deleteShopifyCustomerAccessToken(customerAccessToken, env);

    if (!logoutResult.success) {
      return new Response(JSON.stringify({
        success: false,
        message: logoutResult.message,
        errors: logoutResult.errors,
      }), {
        status: logoutResult.status || 400,
        headers
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Logout successful.",
    }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error("[functions/customers/logout.js] Error processing request:", error);
    return new Response(JSON.stringify({ success: false, message: "An error occurred processing your logout request." }), {
      status: 500,
      headers
    });
  }
} 