import { NextRequest, NextResponse } from 'next/server';

async function getShopifyCustomer(customerAccessToken: string) {
  const storefrontAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-04';

  if (!storefrontAccessToken || !shopifyDomain) {
    console.error("Shopify environment variables for customer account are not set.");
    return { success: false, message: "Shopify API credentials not configured.", status: 500 };
  }

  const graphqlEndpoint = `https://${shopifyDomain}/api/${apiVersion}/graphql.json`;

  const query = `
    query getCustomer($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id
        email
        firstName
        lastName
        displayName
        phone
        defaultAddress {
          id
          firstName
          lastName
          company
          address1
          address2
          city
          province
          country
          zip
          phone
        }
        addresses(first: 10) {
          edges {
            node {
              id
              firstName
              lastName
              company
              address1
              address2
              city
              province
              country
              zip
              phone
            }
          }
        }
        orders(first: 10) {
          edges {
            node {
              id
              orderNumber
              processedAt
              totalPrice {
                amount
                currencyCode
              }
              fulfillmentStatus
              financialStatus
              lineItems(first: 10) {
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

  const variables = {
    customerAccessToken: customerAccessToken,
  };

  try {
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    const jsonResponse = await response.json();

    if (!response.ok || jsonResponse.errors) {
      console.error("Shopify customer query error:", jsonResponse.errors || await response.text());
      const errorMessage = jsonResponse.errors?.[0]?.message || "Failed to fetch customer information.";
      return { 
        success: false, 
        message: errorMessage, 
        status: response.status === 200 ? 401 : response.status
      };
    }
    
    const customerData = jsonResponse.data?.customer;

    if (!customerData) {
      return { success: false, message: "Customer not found or invalid access token.", status: 404 };
    }

    return { success: true, customer: customerData };

  } catch (error: any) {
    console.error("Error in getShopifyCustomer:", error);
    return { success: false, message: error.message || "An unexpected error occurred while fetching customer information.", status: 500 };
  }
}

// Get customer account information API route
export async function GET(request: NextRequest) {
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  try {
    // Get customerAccessToken from query parameters or Authorization header
    const { searchParams } = new URL(request.url);
    const customerAccessToken = searchParams.get('customerAccessToken') || 
                               request.headers.get('authorization')?.replace('Bearer ', '');

    if (!customerAccessToken) {
      return NextResponse.json({ 
        success: false, 
        message: "Customer access token is required." 
      }, {
        status: 401,
        headers
      });
    }

    const customerResult = await getShopifyCustomer(customerAccessToken);

    if (!customerResult.success) {
      return NextResponse.json({
        success: false,
        message: customerResult.message,
      }, {
        status: customerResult.status || 400,
        headers
      });
    }

    // Return customer information
    return NextResponse.json({
      success: true,
      message: "Customer information retrieved successfully.",
      customer: customerResult.customer,
    }, {
      status: 200,
      headers
    });

  } catch (error: any) {
    console.error("[api/customers/account] Error processing request:", error);
    return NextResponse.json({ 
      success: false, 
      message: "An error occurred processing your request." 
    }, {
      status: 500,
      headers
    });
  }
}
