import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SmsConfigurationService } from '@/lib/sms-config'
import type { Database } from '@/lib/database.types'

// Create Supabase client with service role for server-side operations
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    // Verify user token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { purchased_number_id, message } = body

    if (!purchased_number_id) {
      return NextResponse.json({ error: 'Missing purchased_number_id' }, { status: 400 })
    }

    // Get purchased number details
    const { data: numberData, error: numberError } = await supabase
      .from('purchased_numbers')
      .select('*')
      .eq('id', purchased_number_id)
      .eq('user_id', user.id)
      .single()

    if (numberError || !numberData) {
      return NextResponse.json({ error: 'Number not found' }, { status: 404 })
    }

    // Check if SMS is enabled for this number
    if (!(numberData as any).sms_enabled) {
      return NextResponse.json(
        { error: 'SMS is not enabled for this number' },
        { status: 400 }
      )
    }

    // Send test SMS
    const result = await SmsConfigurationService.sendTestSms(numberData as any, message)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      })
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error sending test SMS:', error)
    return NextResponse.json(
      { error: 'Failed to send test SMS' },
      { status: 500 }
    )
  }
}