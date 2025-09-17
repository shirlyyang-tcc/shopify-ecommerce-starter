import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/lib/shopify';

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

    // Use the encapsulated service to log out the customer
    const result = await CustomerService.logout(customerAccessToken);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.message,
        errors: result.errors,
      }, {
        status: 400,
        headers
      });
    }

    const revokeData = result.data?.customerAccessTokenRevoke;
    const userErrors = revokeData?.userErrors;

    if (userErrors && userErrors.length > 0) {
      return NextResponse.json({
        success: false,
        message: userErrors[0].message,
        errors: userErrors,
      }, {
        status: 400,
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
