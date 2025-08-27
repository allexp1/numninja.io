import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SmsConfigurationService } from '@/lib/sms-config'
import type { Database } from '@/lib/database.types'

// Create Supabase client with service role for server-side operations
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
    const { config_id, email } = body

    if (!config_id || !email) {
      return NextResponse.json({ error: 'Missing config_id or email' }, { status: 400 })
    }

    // Verify user owns this configuration
    const { data: configData, error: configError } = await supabase
      .from('sms_configurations')
      .select('purchased_number_id')
      .eq('id', config_id)
      .single()

    if (configError || !configData) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    // Verify user owns the number
    const { data: numberData, error: numberError } = await supabase
      .from('purchased_numbers')
      .select('id')
      .eq('id', (configData as any).purchased_number_id)
      .eq('user_id', user.id)
      .single()

    if (numberError || !numberData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Add email recipient
    const config = await SmsConfigurationService.addEmailRecipient(config_id, email)

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error adding email recipient:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add email recipient' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    const { config_id, email } = body

    if (!config_id || !email) {
      return NextResponse.json({ error: 'Missing config_id or email' }, { status: 400 })
    }

    // Verify user owns this configuration
    const { data: configData, error: configError } = await supabase
      .from('sms_configurations')
      .select('purchased_number_id')
      .eq('id', config_id)
      .single()

    if (configError || !configData) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    // Verify user owns the number
    const { data: numberData, error: numberError } = await supabase
      .from('purchased_numbers')
      .select('id')
      .eq('id', (configData as any).purchased_number_id)
      .eq('user_id', user.id)
      .single()

    if (numberError || !numberData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Remove email recipient
    const config = await SmsConfigurationService.removeEmailRecipient(config_id, email)

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error removing email recipient:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove email recipient' },
      { status: 500 }
    )
  }
}