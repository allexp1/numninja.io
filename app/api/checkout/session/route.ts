import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { CartItem } from '@/lib/cart';

export async function POST(request: NextRequest) {
  try {
    // Get the cart items from the request body
    const { items }: { items: CartItem[] } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );

    // Get the auth token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Transform cart items to Stripe format
    const checkoutItems = items.map(item => {
      // Calculate total monthly price
      const monthlyPrice = item.basePrice + 
        (item.smsEnabled ? item.smsPrice : 0) + 
        (item.forwardingPrice || 0);
      
      // Generate a display-friendly number format
      const formattedNumber = `+${getCountryPrefix(item.countryCode)} ${item.areaCode} ${item.phoneNumber.slice(-7)}`;

      return {
        id: item.id,
        number: formattedNumber,
        countryCode: item.countryCode,
        areaCode: item.areaCode,
        monthlyPrice: monthlyPrice * item.monthlyDuration, // Multiply by duration
        setupPrice: 0, // No setup fees for now
        quantity: 1,
      };
    });

    // Get the base URL for success/cancel URLs
    const baseUrl = request.headers.get('origin') || 'http://localhost:3000';

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      userId: user.id,
      email: user.email!,
      items: checkoutItems,
      successUrl: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/cart`,
    });

    // Store the order in database as pending
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        stripe_session_id: session.id,
        total_amount: checkoutItems.reduce((sum, item) => sum + item.monthlyPrice + item.setupPrice, 0),
        currency: 'usd',
        status: 'pending',
        payment_status: 'pending',
        metadata: {
          items: checkoutItems,
          cart_items: items,
        },
      });

    if (orderError) {
      console.error('Failed to create order record:', orderError);
      // Continue anyway - we can reconcile later via webhook
    }

    // Store cart items in database for later provisioning
    for (const item of items) {
      const { error: cartError } = await supabase
        .from('cart_items')
        .upsert({
          user_id: user.id,
          country_id: await getCountryId(supabase, item.countryCode),
          area_code_id: await getAreaCodeId(supabase, item.countryCode, item.areaCode),
          phone_number: item.phoneNumber,
          monthly_price: item.basePrice,
          setup_price: 0,
          sms_enabled: item.smsEnabled,
          forwarding_type: item.forwardingType,
          metadata: {
            forwarding_destination: item.forwardingDestination,
            forwarding_price: item.forwardingPrice,
            sms_price: item.smsPrice,
            monthly_duration: item.monthlyDuration,
          },
        });

      if (cartError) {
        console.error('Failed to store cart item:', cartError);
      }
    }

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// Helper function to get country prefix
function getCountryPrefix(countryCode: string): string {
  const prefixes: Record<string, string> = {
    'us': '1',
    'uk': '44',
    'ca': '1',
    'au': '61',
    'de': '49',
    'fr': '33',
    'nl': '31',
    'es': '34',
    'it': '39',
    'se': '46',
  };
  return prefixes[countryCode.toLowerCase()] || '1';
}

// Helper function to get country ID from database
async function getCountryId(supabase: any, countryCode: string): Promise<string | null> {
  const { data } = await supabase
    .from('countries')
    .select('id')
    .eq('code', countryCode.toUpperCase())
    .single();
  
  return data?.id || null;
}

// Helper function to get area code ID from database
async function getAreaCodeId(supabase: any, countryCode: string, areaCode: string): Promise<string | null> {
  const countryId = await getCountryId(supabase, countryCode);
  if (!countryId) return null;

  const { data } = await supabase
    .from('area_codes')
    .select('id')
    .eq('country_id', countryId)
    .eq('area_code', areaCode)
    .single();
  
  return data?.id || null;
}