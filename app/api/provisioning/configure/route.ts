import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { provisioningService } from '@/lib/provisioning';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with cookies for auth
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    });

    // Get the authenticated user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      );
    }

    const user = session.user;

    // Get request body
    const body = await request.json();
    const { purchasedNumberId, config } = body;

    if (!purchasedNumberId) {
      return NextResponse.json(
        { error: 'purchasedNumberId is required' },
        { status: 400 }
      );
    }

    if (!config) {
      return NextResponse.json(
        { error: 'config is required' },
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

    // Check if the number is active
    if (purchasedNumber.provisioning_status !== 'active') {
      return NextResponse.json(
        { error: 'Number must be active to update configuration' },
        { status: 400 }
      );
    }

    if (!purchasedNumber.didww_did_id) {
      return NextResponse.json(
        { error: 'Number is not provisioned yet' },
        { status: 400 }
      );
    }

    // Update configuration in database first
    const { data: existingConfig } = await supabase
      .from('number_configurations')
      .select('id')
      .eq('purchased_number_id', purchasedNumberId)
      .single();

    const configData = {
      forwarding_type: config.forwardingType || 'none',
      forwarding_number: config.forwardingNumber || null,
      voicemail_enabled: config.voicemailEnabled ?? true,
      voicemail_email: config.voicemailEmail || null,
      call_recording_enabled: config.callRecordingEnabled ?? false,
    };

    if (existingConfig) {
      await supabase
        .from('number_configurations')
        .update(configData)
        .eq('id', existingConfig.id);
    } else {
      await supabase
        .from('number_configurations')
        .insert({
          ...configData,
          purchased_number_id: purchasedNumberId
        });
    }

    // Queue the update job
    await provisioningService.queueProvisioning(
      purchasedNumberId,
      'update_forwarding',
      5,
      { config, userId: user.id }
    );

    // Apply configuration immediately (async)
    provisioningService.configureForwarding(
      purchasedNumberId,
      purchasedNumber.didww_did_id,
      config
    ).catch(error => {
      console.error('Configuration update error:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Configuration update started',
      purchasedNumberId
    });
  } catch (error) {
    console.error('Configure API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET configuration for a number
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with cookies for auth
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    });

    // Get the authenticated user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      );
    }

    const user = session.user;

    // Get purchasedNumberId from query params
    const { searchParams } = new URL(request.url);
    const purchasedNumberId = searchParams.get('purchasedNumberId');

    if (!purchasedNumberId) {
      return NextResponse.json(
        { error: 'purchasedNumberId is required' },
        { status: 400 }
      );
    }

    // Verify the user owns this number
    const { data: purchasedNumber, error: fetchError } = await supabase
      .from('purchased_numbers')
      .select(`
        *,
        number_configurations(*)
      `)
      .eq('id', purchasedNumberId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !purchasedNumber) {
      return NextResponse.json(
        { error: 'Number not found or access denied' },
        { status: 404 }
      );
    }

    const configuration = purchasedNumber.number_configurations?.[0] || null;

    return NextResponse.json({
      success: true,
      data: {
        purchasedNumber: {
          id: purchasedNumber.id,
          phoneNumber: purchasedNumber.phone_number,
          displayName: purchasedNumber.display_name,
          isActive: purchasedNumber.is_active,
          smsEnabled: purchasedNumber.sms_enabled,
          provisioningStatus: purchasedNumber.provisioning_status,
          didId: purchasedNumber.didww_did_id
        },
        configuration: configuration ? {
          forwardingType: configuration.forwarding_type,
          forwardingNumber: configuration.forwarding_number,
          voicemailEnabled: configuration.voicemail_enabled,
          voicemailEmail: configuration.voicemail_email,
          callRecordingEnabled: configuration.call_recording_enabled,
          businessHoursEnabled: configuration.business_hours_enabled,
          businessHoursStart: configuration.business_hours_start,
          businessHoursEnd: configuration.business_hours_end,
          businessHoursTimezone: configuration.business_hours_timezone,
          weekendHandling: configuration.weekend_handling
        } : null
      }
    });
  } catch (error) {
    console.error('Get configuration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}