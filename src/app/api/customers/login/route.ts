import { NextRequest, NextResponse } from 'next/server';

async function getShopifyCustomerAccessToken(email: string, password: string) {
  const storefrontAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-04'; // Default to a recent version

  if (!storefrontAccessToken || !shopifyDomain) {
    console.error("Shopify environment variables for customer auth are not set.");
    return { success: false, message: "Shopify API credentials not configured.", status: 500 };
  }

  const graphqlEndpoint = `https://${shopifyDomain}/api/${apiVersion}/graphql.json`;

  const mutation = `
    mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      email: email,
      password: password,
    },
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
      console.error("Shopify customerAccessTokenCreate error:", jsonResponse.errors || await response.text());
      const shopifyErrors = jsonResponse.data?.customerAccessTokenCreate?.customerUserErrors || jsonResponse.errors;
      const errorMessage = shopifyErrors?.[0]?.message || "Invalid email or password.";
      return { 
        success: false, 
        message: errorMessage, 
        errors: shopifyErrors, 
        status: response.status === 200 ? 401 : response.status // if Shopify returns 200 with user errors, it's an auth failure
      };
    }
    
    const tokenData = jsonResponse.data?.customerAccessTokenCreate?.customerAccessToken;
    const userErrors = jsonResponse.data?.customerAccessTokenCreate?.customerUserErrors;

    if (userErrors && userErrors.length > 0) {
      console.warn("Shopify customer user errors during login:", userErrors);
      return { success: false, message: userErrors[0].message, errors: userErrors, status: 401 };
    }

    if (tokenData && tokenData.accessToken) {
      return { success: true, token: tokenData.accessToken, expiresAt: tokenData.expiresAt };
    }

    // Fallback error if structure is unexpected
    console.error("Unexpected response structure from Shopify customerAccessTokenCreate:", jsonResponse);
    return { success: false, message: "Failed to login. Unexpected response from Shopify.", status: 500 };

  } catch (error: any) {
    console.error("Error in getShopifyCustomerAccessToken:", error);
    return { success: false, message: error.message || "An unexpected error occurred during login.", status: 500 };
  }
}

// Customer login API route
export async function POST(request: NextRequest) {
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  if (request.method === "OPTIONS") {
    return new Response(null, { headers, status: 204 });
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required." }, {
        status: 400,
        headers
      });
    }

    const loginResult = await getShopifyCustomerAccessToken(email, password);

    if (!loginResult.success) {
      return NextResponse.json({
        success: false,
        message: loginResult.message,
        errors: loginResult.errors,
      }, {
        status: loginResult.status || 401, // Default to 401 for login failures
        headers
      });
    }

    // Login successful, return token and expiry
    return NextResponse.json({
      success: true,
      message: "Login successful.",
      customerAccessToken: loginResult.token,
      expiresAt: loginResult.expiresAt,
      // Optionally, you could fetch basic customer info here too, but it's better to do it in a separate /account call
    }, {
      status: 200,
      headers
    });

  } catch (error: any) {
    console.error("[api/customers/login] Error processing request:", error);
    return NextResponse.json({ success: false, message: "An error occurred processing your request." }, {
      status: 500,
      headers
    });
  }
}
