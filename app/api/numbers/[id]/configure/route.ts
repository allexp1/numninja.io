import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the purchased number configuration
    const { data: number, error } = await supabase
      .from('purchased_numbers')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !number) {
      return NextResponse.json(
        { error: 'Number not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: number.id,
      phone_number: number.phone_number,
      sms_enabled: number.sms_enabled,
      forwarding_type: number.forwarding_type,
      forwarding_destination: number.forwarding_destination,
      is_active: number.is_active,
      provisioning_status: number.provisioning_status,
    });

  } catch (error) {
    console.error('Get configuration error:', error);
    return NextResponse.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      sms_enabled,
      forwarding_type,
      forwarding_destination,
    } = body;

    // Validate forwarding type
    if (forwarding_type && !['sms', 'call', 'both', null].includes(forwarding_type)) {
      return NextResponse.json(
        { error: 'Invalid forwarding type. Must be: sms, call, both, or null' },
        { status: 400 }
      );
    }

    // Validate forwarding destination based on type
    if (forwarding_destination) {
      if (forwarding_type === 'sms') {
        // Validate email format for SMS forwarding
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(forwarding_destination)) {
          return NextResponse.json(
            { error: 'Invalid email address for SMS forwarding' },
            { status: 400 }
          );
        }
      } else if (forwarding_type === 'call') {
        // Validate phone number format for call forwarding
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(forwarding_destination.replace(/\s/g, ''))) {
          return NextResponse.json(
            { error: 'Invalid phone number for call forwarding' },
            { status: 400 }
          );
        }
      }
    }

    // Get the current number to verify ownership
    const { data: currentNumber, error: fetchError } = await supabase
      .from('purchased_numbers')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !currentNumber) {
      return NextResponse.json(
        { error: 'Number not found' },
        { status: 404 }
      );
    }

    // Check if provisioning is complete
    if (currentNumber.provisioning_status !== 'active') {
      return NextResponse.json(
        { error: 'Number is not yet active. Please wait for provisioning to complete.' },
        { status: 400 }
      );
    }

    // Update the configuration
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (sms_enabled !== undefined) {
      updateData.sms_enabled = sms_enabled;
    }
    if (forwarding_type !== undefined) {
      updateData.forwarding_type = forwarding_type;
    }
    if (forwarding_destination !== undefined) {
      updateData.forwarding_destination = forwarding_destination;
    }

    const { data: updatedNumber, error: updateError } = await supabase
      .from('purchased_numbers')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update configuration' },
        { status: 500 }
      );
    }

    // Add a task to the provisioning queue to update DIDWW configuration
    if (currentNumber.didww_did_id) {
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      await serviceSupabase
        .from('provisioning_queue')
        .insert({
          purchased_number_id: params.id,
          action: 'update',
          priority: 5,
          status: 'pending',
          metadata: {
            previous_config: {
              sms_enabled: currentNumber.sms_enabled,
              forwarding_type: currentNumber.forwarding_type,
              forwarding_destination: currentNumber.forwarding_destination,
            },
            new_config: {
              sms_enabled: updatedNumber.sms_enabled,
              forwarding_type: updatedNumber.forwarding_type,
              forwarding_destination: updatedNumber.forwarding_destination,
            }
          },
        });
    }

    return NextResponse.json({
      message: 'Configuration updated successfully',
      data: {
        id: updatedNumber.id,
        phone_number: updatedNumber.phone_number,
        sms_enabled: updatedNumber.sms_enabled,
        forwarding_type: updatedNumber.forwarding_type,
        forwarding_destination: updatedNumber.forwarding_destination,
        is_active: updatedNumber.is_active,
        provisioning_status: updatedNumber.provisioning_status,
      }
    });

  } catch (error) {
    console.error('Update configuration error:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the number to verify ownership
    const { data: number, error: fetchError } = await supabase
      .from('purchased_numbers')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !number) {
      return NextResponse.json(
        { error: 'Number not found' },
        { status: 404 }
      );
    }

    // Cancel the Stripe subscription if it exists
    if (number.stripe_subscription_id) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        await stripe.subscriptions.cancel(number.stripe_subscription_id);
      } catch (stripeError) {
        console.error('Failed to cancel Stripe subscription:', stripeError);
      }
    }

    // Add cancellation task to provisioning queue
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await serviceSupabase
      .from('provisioning_queue')
      .insert({
        purchased_number_id: params.id,
        action: 'cancel',
        priority: 10, // High priority for cancellations
        status: 'pending',
        metadata: {
          reason: 'User requested cancellation',
          cancelled_at: new Date().toISOString(),
        },
      });

    // Mark the number as pending cancellation
    await supabase
      .from('purchased_numbers')
      .update({
        provisioning_status: 'pending_cancellation',
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    return NextResponse.json({
      message: 'Number cancellation initiated',
      data: {
        id: params.id,
        status: 'pending_cancellation'
      }
    });

  } catch (error) {
    console.error('Cancel number error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel number' },
      { status: 500 }
    );
  }
}