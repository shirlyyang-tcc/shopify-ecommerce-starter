import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/lib/shopify';

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

    // 使用封装的服务获取客户信息
    const result = await CustomerService.getCustomer(customerAccessToken);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.message,
        errors: result.errors,
      }, {
        status: 401,
        headers
      });
    }

    const customerData = result.data?.customer;

    if (!customerData) {
      return NextResponse.json({
        success: false,
        message: "Customer not found or invalid access token.",
      }, {
        status: 404,
        headers
      });
    }

    // Return customer information
    return NextResponse.json({
      success: true,
      message: "Customer information retrieved successfully.",
      customer: customerData,
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
