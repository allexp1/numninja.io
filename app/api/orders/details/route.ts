import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID is required' },
      { status: 400 }
    );
  }

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Get order details by Stripe session ID
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get purchased numbers for this order
    const { data: purchasedNumbers } = await supabase
      .from('purchased_numbers')
      .select('*')
      .eq('stripe_checkout_session_id', sessionId);

    // Format the response to match what the frontend expects
    const response = {
      sessionId: sessionId,
      orderId: order.id,
      totalAmount: order.total || 0,
      currency: order.currency || 'usd',
      items: purchasedNumbers?.map(num => ({
        number: num.phone_number,
        countryCode: num.country_code,
        areaCode: num.area_code,
        monthlyPrice: num.monthly_price
      })) || [],
      subscriptionId: order.stripe_subscription_id,
      order: order,
      purchasedNumbers: purchasedNumbers || [],
      success: true
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}