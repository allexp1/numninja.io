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
    const { purchasedNumberId } = body;

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

    // Check if provisioning failed
    if (purchasedNumber.provisioning_status !== 'failed') {
      return NextResponse.json(
        { error: 'Can only retry failed provisioning' },
        { status: 400 }
      );
    }

    // Reset the provisioning status
    await supabase
      .from('purchased_numbers')
      .update({
        provisioning_status: 'pending',
        last_provision_error: null
      })
      .eq('id', purchasedNumberId);

    // Queue a new provisioning job with high priority
    await provisioningService.queueProvisioning(
      purchasedNumberId,
      'provision',
      10, // High priority for retries
      { 
        isRetry: true,
        previousAttempts: purchasedNumber.provisioning_attempts || 0,
        userId: user.id
      }
    );

    // Start provisioning immediately (async)
    const config = await getNumberConfiguration(supabase, purchasedNumberId);
    provisioningService.provisionNumber(
      purchasedNumberId, 
      config,
      purchasedNumber.provisioning_attempts || 0
    ).catch(error => {
      console.error('Provisioning retry error:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Provisioning retry started',
      purchasedNumberId
    });
  } catch (error) {
    console.error('Retry API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getNumberConfiguration(supabase: any, purchasedNumberId: string) {
  const { data: config } = await supabase
    .from('number_configurations')
    .select('*')
    .eq('purchased_number_id', purchasedNumberId)
    .single();

  if (!config) {
    return undefined;
  }

  return {
    forwardingType: config.forwarding_type,
    forwardingNumber: config.forwarding_number,
    voicemailEnabled: config.voicemail_enabled,
    voicemailEmail: config.voicemail_email,
    callRecordingEnabled: config.call_recording_enabled
  };
}