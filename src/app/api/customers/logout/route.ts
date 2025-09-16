import { NextRequest, NextResponse } from 'next/server';

async function revokeShopifyCustomerAccessToken(accessToken: string) {
  const storefrontAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-04';

  if (!storefrontAccessToken || !shopifyDomain) {
    console.error("Shopify environment variables for customer logout are not set.");
    return { success: false, message: "Shopify API credentials not configured.", status: 500 };
  }

  const graphqlEndpoint = `https://${shopifyDomain}/api/${apiVersion}/graphql.json`;

  const mutation = `
    mutation customerAccessTokenRevoke($customerAccessToken: String!) {
      customerAccessTokenRevoke(customerAccessToken: $customerAccessToken) {
        deletedAccessToken
        deletedCustomerAccessTokenId
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    customerAccessToken: accessToken,
  };

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
      console.error("Shopify customerAccessTokenRevoke error:", jsonResponse.errors || await response.text());
      const shopifyErrors = jsonResponse.data?.customerAccessTokenRevoke?.userErrors || jsonResponse.errors;
      const errorMessage = shopifyErrors?.[0]?.message || "Failed to revoke access token.";
      return { 
        success: false, 
        message: errorMessage, 
        errors: shopifyErrors, 
        status: response.status === 200 ? 400 : response.status
      };
    }
    
    const revokeData = jsonResponse.data?.customerAccessTokenRevoke;
    const userErrors = revokeData?.userErrors;

    if (userErrors && userErrors.length > 0) {
      console.warn("Shopify customer user errors during logout:", userErrors);
      return { success: false, message: userErrors[0].message, errors: userErrors, status: 400 };
    }

    if (revokeData) {
      return { success: true, message: "Access token revoked successfully." };
    }

    // Fallback error if structure is unexpected
    console.error("Unexpected response structure from Shopify customerAccessTokenRevoke:", jsonResponse);
    return { success: false, message: "Failed to logout. Unexpected response from Shopify.", status: 500 };

  } catch (error: any) {
    console.error("Error in revokeShopifyCustomerAccessToken:", error);
    return { success: false, message: error.message || "An unexpected error occurred during logout.", status: 500 };
  }
}

// Customer logout API route
export async function POST(request: NextRequest) {
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  try {
    const { customerAccessToken } = await request.json();

    if (!customerAccessToken) {
      return NextResponse.json({ 
        success: false, 
        message: "Customer access token is required." 
      }, {
        status: 400,
        headers
      });
    }

    const logoutResult = await revokeShopifyCustomerAccessToken(customerAccessToken);

    if (!logoutResult.success) {
      return NextResponse.json({
        success: false,
        message: logoutResult.message,
        errors: logoutResult.errors,
      }, {
        status: logoutResult.status || 400,
        headers
      });
    }

    // Logout successful
    return NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    }, {
      status: 200,
      headers
    });

  } catch (error: any) {
    console.error("[api/customers/logout] Error processing request:", error);
    return NextResponse.json({ 
      success: false, 
      message: "An error occurred processing your request." 
    }, {
      status: 500,
      headers
    });
  }
}
