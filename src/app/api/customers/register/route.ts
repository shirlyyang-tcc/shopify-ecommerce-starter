import { NextRequest, NextResponse } from 'next/server';

async function createShopifyCustomer(input: { email: string; password: string; firstName?: string; lastName?: string }) {
  const storefrontAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-04';

  if (!storefrontAccessToken || !shopifyDomain) {
    console.error("Shopify environment variables for customer registration are not set.");
    return { success: false, message: "Shopify API credentials not configured.", status: 500 };
  }

  const graphqlEndpoint = `https://${shopifyDomain}/api/${apiVersion}/graphql.json`;

  const mutation = `
    mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
          firstName
          lastName
          displayName
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
      email: input.email,
      password: input.password,
      firstName: input.firstName || '',
      lastName: input.lastName || '',
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
      console.error("Shopify customerCreate error:", jsonResponse.errors || await response.text());
      const shopifyErrors = jsonResponse.data?.customerCreate?.customerUserErrors || jsonResponse.errors;
      const errorMessage = shopifyErrors?.[0]?.message || "Failed to create customer account.";
      return { 
        success: false, 
        message: errorMessage, 
        errors: shopifyErrors, 
        status: response.status === 200 ? 400 : response.status
      };
    }
    
    const customerData = jsonResponse.data?.customerCreate?.customer;
    const userErrors = jsonResponse.data?.customerCreate?.customerUserErrors;

    if (userErrors && userErrors.length > 0) {
      console.warn("Shopify customer user errors during registration:", userErrors);
      return { success: false, message: userErrors[0].message, errors: userErrors, status: 400 };
    }

    if (customerData) {
      return { success: true, customer: customerData };
    }

    // Fallback error if structure is unexpected
    console.error("Unexpected response structure from Shopify customerCreate:", jsonResponse);
    return { success: false, message: "Failed to create customer account. Unexpected response from Shopify.", status: 500 };

  } catch (error: any) {
    console.error("Error in createShopifyCustomer:", error);
    return { success: false, message: error.message || "An unexpected error occurred during registration.", status: 500 };
  }
}

// Customer registration API route
export async function POST(request: NextRequest) {
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  try {
    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        message: "Email and password are required." 
      }, {
        status: 400,
        headers
      });
    }

    const registrationResult = await createShopifyCustomer({
      email,
      password,
      firstName,
      lastName
    });

    if (!registrationResult.success) {
      return NextResponse.json({
        success: false,
        message: registrationResult.message,
        errors: registrationResult.errors,
      }, {
        status: registrationResult.status || 400,
        headers
      });
    }

    // Registration successful
    return NextResponse.json({
      success: true,
      message: "Account created successfully. You can now log in.",
      customer: registrationResult.customer,
    }, {
      status: 201,
      headers
    });

  } catch (error: any) {
    console.error("[api/customers/register] Error processing request:", error);
    return NextResponse.json({ 
      success: false, 
      message: "An error occurred processing your request." 
    }, {
      status: 500,
      headers
    });
  }
}
