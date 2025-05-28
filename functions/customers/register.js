// functions/customers/register.js

async function createShopifyCustomer(firstName, lastName, email, password, env) {
  const storefrontAccessToken = env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  const shopifyDomain = env.SHOPIFY_STORE_DOMAIN;
  const apiVersion = env.SHOPIFY_API_VERSION || '2024-04';

  if (!storefrontAccessToken || !shopifyDomain) {
    console.error("Shopify environment variables for customer creation are not set.");
    return { success: false, message: "Shopify API credentials not configured.", status: 500 };
  }

  const graphqlEndpoint = `https://${shopifyDomain}/api/${apiVersion}/graphql.json`;

  const mutation = `
    mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer {
          id
          firstName
          lastName
          email
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
      firstName: firstName,
      lastName: lastName,
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
      console.error("Shopify customerCreate error:", jsonResponse.errors || await response.text());
      const shopifyErrors = jsonResponse.data?.customerCreate?.customerUserErrors || jsonResponse.errors;
      const errorMessage = shopifyErrors?.[0]?.message || "Failed to create customer account.";
      return { 
        success: false, 
        message: errorMessage, 
        errors: shopifyErrors, 
        status: response.status === 200 ? 400 : response.status // if Shopify returns 200 with user errors, it's a validation failure
      };
    }
    
    const customerData = jsonResponse.data?.customerCreate?.customer;
    const userErrors = jsonResponse.data?.customerCreate?.customerUserErrors;

    if (userErrors && userErrors.length > 0) {
      console.warn("Shopify customer user errors during registration:", userErrors);
      // It's possible to have both customer data and errors if some fields are ok but others fail (e.g. password too short)
      // However, Shopify usually returns customer as null if there are userErrors.
      return { success: false, message: userErrors[0].message, errors: userErrors, status: 400 };
    }

    if (customerData && customerData.id) {
      return { success: true, customer: customerData };
    }

    console.error("Unexpected response structure from Shopify customerCreate:", jsonResponse);
    return { success: false, message: "Failed to register. Unexpected response from Shopify.", status: 500 };

  } catch (error) {
    console.error("Error in createShopifyCustomer:", error);
    return { success: false, message: error.message || "An unexpected error occurred during registration.", status: 500 };
  }
}

export async function onRequest(context) {
  const { request, env } = context;

  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ success: false, message: "Method not allowed. Please use POST." }), {
      status: 405,
      headers
    });
  }

  try {
    const { firstName, lastName, email, password } = await request.json();

    if (!firstName || !email || !password) {
      return new Response(JSON.stringify({ success: false, message: "First name, email, and password are required." }), {
        status: 400,
        headers
      });
    }
    // Basic password validation (example)
    if (password.length < 5) {
        return new Response(JSON.stringify({ success: false, message: "Password must be at least 5 characters long." }), {
            status: 400,
            headers
        });
    }

    const registrationResult = await createShopifyCustomer(firstName, lastName, email, password, env);

    if (!registrationResult.success) {
      return new Response(JSON.stringify({
        success: false,
        message: registrationResult.message,
        errors: registrationResult.errors,
      }), {
        status: registrationResult.status || 400, // Default to 400 for registration input errors
        headers
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Account created successfully. Please login.",
      customer: registrationResult.customer,
    }), {
      status: 201, // 201 Created
      headers
    });

  } catch (error) {
    console.error("[functions/customers/register.js] Error processing request:", error);
    return new Response(JSON.stringify({ success: false, message: "An error occurred processing your registration." }), {
      status: 500,
      headers
    });
  }
} 