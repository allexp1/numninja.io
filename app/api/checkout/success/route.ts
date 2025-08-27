import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer', 'subscription']
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get the order details from the database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
    }

    // Get provisioned numbers for this order
    const { data: provisionedNumbers, error: numbersError } = await supabase
      .from('provisioned_numbers')
      .select('*')
      .eq('user_id', session.metadata?.userId)
      .order('created_at', { ascending: false });

    if (numbersError) {
      console.error('Error fetching provisioned numbers:', numbersError);
    }

    // Parse items from metadata
    const items = session.metadata?.items ? JSON.parse(session.metadata.items) : [];

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_email,
        subscription_id: session.subscription
      },
      order,
      items,
      provisionedNumbers: provisionedNumbers || []
    });

  } catch (error) {
    console.error('Error handling success:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payment information' },
      { status: 500 }
    );
  }
}