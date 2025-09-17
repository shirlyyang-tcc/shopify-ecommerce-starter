import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/lib/shopify';

// Get customer orders API route
export async function POST(request: NextRequest) {
  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  try {
    const { customerAccessToken } = await request.json();

    if (!customerAccessToken) {
      return NextResponse.json({
        success: false,
        message: "Customer access token is required"
      }, {
        status: 401, // Unauthorized
        headers
      });
    }

    // Use the encapsulated service to get customer orders
    const result = await CustomerService.getCustomerOrders(customerAccessToken, 20);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Failed to fetch orders: " + result.message,
        errors: result.errors
      }, {
        status: 401,
        headers
      });
    }
    
    if (!result.data?.customer) {
        // This case can happen if the token is valid but customer data is not returned,
        // or if the customer has no orders, Shopify might return customer as null or orders as empty.
        // If customer is null with a valid token, it might imply no orders or an issue.
        // The GraphQL query for orders on a customer with no orders should return an empty edges array, not a null customer.
        // If customer is null, it usually means the access token was invalid or expired.
        console.log("Customer data not found in Shopify response, possibly invalid token or no orders for this token.");
        return NextResponse.json({
            success: true, // Still a success in terms of API call, but no data
            message: "No customer data found. The access token might be invalid or the customer has no orders.",
            orders: [] // Return empty orders array
        }, {
            status: 200, // Or 404 if you are sure customer should exist but has no data due to token
            headers
        });
    }

    return NextResponse.json({
      success: true,
      orders: result.data.customer.orders.edges.map((edge: any) => edge.node)
    }, {
      status: 200,
      headers
    });

  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({
      success: false,
      message: "An internal error occurred while fetching orders.",
      error: error.message
    }, {
      status: 500,
      headers
    });
  }
}
