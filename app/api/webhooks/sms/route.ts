import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SmsConfigurationService } from '@/lib/sms-config'
import type { Database } from '@/lib/database.types'

// Create Supabase client with service role for server-side operations
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verify webhook signature (if DIDWW provides one)
function verifyWebhookSignature(request: NextRequest): boolean {
  // In production, verify the webhook signature from DIDWW
  // For now, we can check for a secret token in headers
  const webhookSecret = process.env.DIDWW_WEBHOOK_SECRET
  if (!webhookSecret) {
    // No secret configured, allow in development
    return process.env.NODE_ENV === 'development'
  }
  
  const signature = request.headers.get('x-didww-signature')
  // Implement proper signature verification based on DIDWW's documentation
  return signature === webhookSecret
}

interface DIDWWSmsWebhook {
  event: 'sms.received'
  data: {
    id: string
    type: 'sms'
    attributes: {
      from: string
      to: string
      message: string
      received_at: string
      did_id: string
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    if (!verifyWebhookSignature(request)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse webhook payload
    const body: DIDWWSmsWebhook = await request.json()
    
    // Validate webhook event type
    if (body.event !== 'sms.received') {
      return NextResponse.json({ 
        message: 'Event type not handled' 
      }, { status: 200 })
    }

    const { data } = body
    const { attributes } = data

    // Find the purchased number by phone number
    const { data: numberData, error: numberError } = await supabase
      .from('purchased_numbers')
      .select('*')
      .eq('phone_number', attributes.to)
      .eq('didww_did_id', attributes.did_id)
      .single()

    if (numberError || !numberData) {
      console.error('Purchased number not found:', attributes.to)
      return NextResponse.json({ 
        error: 'Number not found' 
      }, { status: 404 })
    }

    // Check if SMS is enabled for this number
    if (!(numberData as any).sms_enabled) {
      console.log('SMS not enabled for number:', attributes.to)
      return NextResponse.json({
        message: 'SMS not enabled for this number'
      }, { status: 200 })
    }

    // Process the incoming SMS
    await SmsConfigurationService.processIncomingSms(
      (numberData as any).id,
      {
        from_number: attributes.from,
        to_number: attributes.to,
        message: attributes.message,
        didww_sms_id: data.id
      }
    )

    // Send email notifications asynchronously
    // In production, this would be handled by a queue system
    sendEmailNotifications((numberData as any).id, {
      from: attributes.from,
      to: attributes.to,
      message: attributes.message,
      received_at: attributes.received_at
    }).catch(error => {
      console.error('Error sending email notifications:', error)
    })

    // Return success response to DIDWW
    return NextResponse.json({ 
      success: true,
      message: 'SMS processed successfully' 
    }, { status: 200 })
    
  } catch (error) {
    console.error('Error processing SMS webhook:', error)
    
    // Return 200 to prevent DIDWW from retrying
    // Log the error for investigation
    return NextResponse.json({ 
      success: false,
      message: 'Error processing SMS, logged for investigation' 
    }, { status: 200 })
  }
}

// Function to send email notifications
async function sendEmailNotifications(
  purchasedNumberId: string,
  smsData: {
    from: string
    to: string
    message: string
    received_at: string
  }
) {
  try {
    // Get SMS configuration
    const config = await SmsConfigurationService.getConfiguration(purchasedNumberId)
    
    if (!config || !config.enabled || !config.forward_to_emails || config.forward_to_emails.length === 0) {
      return
    }

    // Get forwarding logs that need to be sent
    const { data: pendingLogs, error: logsError } = await supabase
      .from('sms_forwarding_logs')
      .select('*')
      .eq('status', 'pending')
      .in('email_recipient', config.forward_to_emails)

    if (logsError) {
      console.error('Error fetching pending logs:', logsError)
      return
    }

    // Send emails to each recipient
    for (const recipient of config.forward_to_emails) {
      try {
        // In production, use a proper email service (SendGrid, AWS SES, etc.)
        const emailSent = await sendSmsNotificationEmail(recipient, smsData)
        
        if (emailSent) {
          // Update forwarding log status
          await supabase
            .from('sms_forwarding_logs')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('email_recipient', recipient)
            .eq('status', 'pending')
        }
      } catch (error) {
        console.error(`Error sending email to ${recipient}:`, error)
        
        // Update forwarding log with error
        await supabase
          .from('sms_forwarding_logs')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('email_recipient', recipient)
          .eq('status', 'pending')
      }
    }
  } catch (error) {
    console.error('Error in sendEmailNotifications:', error)
  }
}

// Mock function to send SMS notification email
async function sendSmsNotificationEmail(
  recipientEmail: string,
  smsData: {
    from: string
    to: string
    message: string
    received_at: string
  }
): Promise<boolean> {
  // In production, integrate with an email service provider
  // For now, just log and return success
  console.log(`Sending SMS notification to ${recipientEmail}:`, {
    subject: `New SMS from ${smsData.from}`,
    body: `
      You received a new SMS message:
      
      From: ${smsData.from}
      To: ${smsData.to}
      Received: ${new Date(smsData.received_at).toLocaleString()}
      
      Message:
      ${smsData.message}
      
      ---
      This message was forwarded by NumNinja SMS Forwarding Service
    `
  })
  
  // Simulate email sending
  return true
}

// GET endpoint for webhook verification (some providers require this)
export async function GET(request: NextRequest) {
  // Some webhook providers send a GET request to verify the endpoint
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('challenge')
  
  if (challenge) {
    // Echo back the challenge for verification
    return new Response(challenge, { status: 200 })
  }
  
  return NextResponse.json({ 
    status: 'ok',
    message: 'SMS webhook endpoint is active' 
  }, { status: 200 })
}