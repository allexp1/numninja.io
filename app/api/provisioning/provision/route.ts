import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { provisioningService } from '@/lib/provisioning';

export async function POST(request: NextRequest) {
  try {
    // Get the user token from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Create Supabase client with user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { purchasedNumberId, config } = body;

    if (!purchasedNumberId) {
      return NextResponse.json(
        { error: 'purchasedNumberId is required' },
        { status: 400 }
      );
    }

    // Verify the user owns this number
    const { data: purchasedNumber, error: fetchError } = await supabase
      .from('purchased_numbers')
      .select('*')
      .eq('id', purchasedNumberId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !purchasedNumber) {
      return NextResponse.json(
        { error: 'Number not found or access denied' },
        { status: 404 }
      );
    }

    // Check if already provisioned
    if (purchasedNumber.provisioning_status === 'active') {
      return NextResponse.json(
        { error: 'Number is already provisioned' },
        { status: 400 }
      );
    }

    // Queue the provisioning job
    await provisioningService.queueProvisioning(
      purchasedNumberId,
      'provision',
      5,
      { config, userId: user.id }
    );

    // Start provisioning immediately (async)
    provisioningService.provisionNumber(purchasedNumberId, config).catch(error => {
      console.error('Provisioning error:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Provisioning started',
      purchasedNumberId
    });
  } catch (error) {
    console.error('Provision API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}