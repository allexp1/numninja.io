import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Verify webhook signature from DIDWW
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-didww-signature') || '';
    const webhookSecret = process.env.DIDWW_WEBHOOK_SECRET || '';

    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production' && webhookSecret) {
      const isValid = verifyWebhookSignature(body, signature, webhookSecret);
      if (!isValid) {
        console.error('Invalid DIDWW webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse the webhook payload
    const data = JSON.parse(body);
    const eventType = data.type;
    const eventData = data.data;

    // Create Supabase service client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Handle different event types
    switch (eventType) {
      case 'did.provisioned':
        await handleDIDProvisioned(supabase, eventData);
        break;
      
      case 'did.released':
        await handleDIDReleased(supabase, eventData);
        break;
      
      case 'did.suspended':
        await handleDIDSuspended(supabase, eventData);
        break;
      
      case 'did.activated':
        await handleDIDActivated(supabase, eventData);
        break;
      
      case 'cdr.created':
        await handleCDRCreated(supabase, eventData);
        break;
      
      case 'sms.received':
        await handleSMSReceived(supabase, eventData);
        break;
      
      case 'voicemail.received':
        await handleVoicemailReceived(supabase, eventData);
        break;
      
      default:
        console.log(`Unhandled DIDWW webhook event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('DIDWW webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle DID provisioned event
async function handleDIDProvisioned(supabase: any, data: any) {
  const { did_id, phone_number, status } = data;
  
  // Update the purchased number status
  const { error } = await supabase
    .from('purchased_numbers')
    .update({
      provisioning_status: 'active',
      is_active: true,
      provisioned_at: new Date().toISOString()
    })
    .eq('didww_did_id', did_id);

  if (error) {
    console.error('Error updating provisioned DID:', error);
  } else {
    console.log(`DID ${did_id} (${phone_number}) provisioned successfully`);
  }
}

// Handle DID released event
async function handleDIDReleased(supabase: any, data: any) {
  const { did_id, phone_number } = data;
  
  // Update the purchased number status
  const { error } = await supabase
    .from('purchased_numbers')
    .update({
      provisioning_status: 'cancelled',
      is_active: false
    })
    .eq('didww_did_id', did_id);

  if (error) {
    console.error('Error updating released DID:', error);
  } else {
    console.log(`DID ${did_id} (${phone_number}) released`);
  }
}

// Handle DID suspended event
async function handleDIDSuspended(supabase: any, data: any) {
  const { did_id, phone_number, reason } = data;
  
  // Update the purchased number status
  const { error } = await supabase
    .from('purchased_numbers')
    .update({
      provisioning_status: 'suspended',
      is_active: false,
      last_provision_error: reason || 'Number suspended'
    })
    .eq('didww_did_id', did_id);

  if (error) {
    console.error('Error updating suspended DID:', error);
  } else {
    console.log(`DID ${did_id} (${phone_number}) suspended: ${reason}`);
  }
}

// Handle DID activated event
async function handleDIDActivated(supabase: any, data: any) {
  const { did_id, phone_number } = data;
  
  // Update the purchased number status
  const { error } = await supabase
    .from('purchased_numbers')
    .update({
      provisioning_status: 'active',
      is_active: true,
      last_provision_error: null
    })
    .eq('didww_did_id', did_id);

  if (error) {
    console.error('Error updating activated DID:', error);
  } else {
    console.log(`DID ${did_id} (${phone_number}) activated`);
  }
}

// Handle CDR created event
async function handleCDRCreated(supabase: any, data: any) {
  const {
    cdr_id,
    did_id,
    direction,
    from_number,
    to_number,
    duration,
    answered,
    start_time,
    end_time,
    cost,
    currency
  } = data;

  // Find the purchased number
  const { data: purchasedNumber } = await supabase
    .from('purchased_numbers')
    .select('id')
    .eq('didww_did_id', did_id)
    .single();

  if (!purchasedNumber) {
    console.error(`Purchased number not found for DID: ${did_id}`);
    return;
  }

  // Insert CDR record
  const { error: cdrError } = await supabase
    .from('call_detail_records')
    .insert({
      purchased_number_id: purchasedNumber.id,
      didww_cdr_id: cdr_id,
      direction: direction,
      from_number: from_number,
      to_number: to_number,
      duration_seconds: duration,
      answered: answered,
      start_time: start_time,
      end_time: end_time,
      cost: cost,
      currency: currency,
      metadata: data
    });

  if (cdrError) {
    console.error('Error inserting CDR:', cdrError);
  } else {
    console.log(`CDR ${cdr_id} recorded for DID ${did_id}`);
  }

  // Update usage statistics
  await updateUsageStats(supabase, purchasedNumber.id, {
    calls: 1,
    minutes: Math.ceil(duration / 60),
    cost: cost || 0
  });
}

// Handle SMS received event
async function handleSMSReceived(supabase: any, data: any) {
  const {
    sms_id,
    did_id,
    from_number,
    to_number,
    message,
    received_at,
    cost,
    currency
  } = data;

  // Find the purchased number
  const { data: purchasedNumber } = await supabase
    .from('purchased_numbers')
    .select('id')
    .eq('didww_did_id', did_id)
    .single();

  if (!purchasedNumber) {
    console.error(`Purchased number not found for DID: ${did_id}`);
    return;
  }

  // Insert SMS record
  const { error: smsError } = await supabase
    .from('sms_records')
    .insert({
      purchased_number_id: purchasedNumber.id,
      didww_sms_id: sms_id,
      direction: 'inbound',
      from_number: from_number,
      to_number: to_number,
      message: message,
      delivered: true,
      delivered_at: received_at,
      cost: cost,
      currency: currency,
      metadata: data
    });

  if (smsError) {
    console.error('Error inserting SMS record:', smsError);
  } else {
    console.log(`SMS ${sms_id} recorded for DID ${did_id}`);
  }

  // Update usage statistics
  await updateUsageStats(supabase, purchasedNumber.id, {
    sms: 1,
    cost: cost || 0
  });

  // Forward SMS if configured
  await forwardSMS(supabase, purchasedNumber.id, {
    from: from_number,
    message: message,
    received_at: received_at
  });
}

// Handle voicemail received event
async function handleVoicemailReceived(supabase: any, data: any) {
  const {
    voicemail_id,
    did_id,
    from_number,
    duration,
    recording_url,
    received_at
  } = data;

  // Find the purchased number
  const { data: purchasedNumber } = await supabase
    .from('purchased_numbers')
    .select('id')
    .eq('didww_did_id', did_id)
    .single();

  if (!purchasedNumber) {
    console.error(`Purchased number not found for DID: ${did_id}`);
    return;
  }

  // Store voicemail information (you might want to create a voicemails table)
  console.log(`Voicemail ${voicemail_id} received for DID ${did_id}`);
  
  // Send voicemail notification
  await sendVoicemailNotification(supabase, purchasedNumber.id, {
    from: from_number,
    duration: duration,
    recording_url: recording_url,
    received_at: received_at
  });
}

// Update usage statistics
async function updateUsageStats(
  supabase: any,
  purchasedNumberId: string,
  stats: { calls?: number; minutes?: number; sms?: number; cost?: number }
) {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Try to get existing stats for this period
  const { data: existingStats } = await supabase
    .from('number_usage_stats')
    .select('*')
    .eq('purchased_number_id', purchasedNumberId)
    .eq('period_start', periodStart.toISOString().split('T')[0])
    .single();

  if (existingStats) {
    // Update existing stats
    await supabase
      .from('number_usage_stats')
      .update({
        total_calls: existingStats.total_calls + (stats.calls || 0),
        total_minutes: existingStats.total_minutes + (stats.minutes || 0),
        total_sms: existingStats.total_sms + (stats.sms || 0),
        total_cost: existingStats.total_cost + (stats.cost || 0)
      })
      .eq('id', existingStats.id);
  } else {
    // Create new stats record
    await supabase
      .from('number_usage_stats')
      .insert({
        purchased_number_id: purchasedNumberId,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        total_calls: stats.calls || 0,
        total_minutes: stats.minutes || 0,
        total_sms: stats.sms || 0,
        total_cost: stats.cost || 0
      });
  }
}

// Forward SMS to configured email
async function forwardSMS(
  supabase: any,
  purchasedNumberId: string,
  smsData: { from: string; message: string; received_at: string }
) {
  // Get configuration
  const { data: config } = await supabase
    .from('number_configurations')
    .select('voicemail_email')
    .eq('purchased_number_id', purchasedNumberId)
    .single();

  if (config?.voicemail_email) {
    // In production, you would send an email here
    // For now, just log it
    console.log(`Forwarding SMS to ${config.voicemail_email}:`, smsData);
    
    // You could integrate with SendGrid, Resend, or another email service
    // Example:
    // await sendEmail({
    //   to: config.voicemail_email,
    //   subject: `SMS from ${smsData.from}`,
    //   text: smsData.message,
    //   html: `<p>From: ${smsData.from}</p><p>Message: ${smsData.message}</p><p>Received: ${smsData.received_at}</p>`
    // });
  }
}

// Send voicemail notification
async function sendVoicemailNotification(
  supabase: any,
  purchasedNumberId: string,
  voicemailData: { from: string; duration: number; recording_url: string; received_at: string }
) {
  // Get configuration
  const { data: config } = await supabase
    .from('number_configurations')
    .select('voicemail_email')
    .eq('purchased_number_id', purchasedNumberId)
    .single();

  if (config?.voicemail_email) {
    // In production, you would send an email here
    // For now, just log it
    console.log(`Sending voicemail notification to ${config.voicemail_email}:`, voicemailData);
    
    // You could integrate with SendGrid, Resend, or another email service
    // Example:
    // await sendEmail({
    //   to: config.voicemail_email,
    //   subject: `New voicemail from ${voicemailData.from}`,
    //   text: `You have a new voicemail (${voicemailData.duration} seconds) from ${voicemailData.from}`,
    //   html: `
    //     <p>You have a new voicemail from ${voicemailData.from}</p>
    //     <p>Duration: ${voicemailData.duration} seconds</p>
    //     <p>Received: ${voicemailData.received_at}</p>
    //     <p><a href="${voicemailData.recording_url}">Listen to voicemail</a></p>
    //   `
    // });
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    webhook: 'didww',
    timestamp: new Date().toISOString()
  });
}