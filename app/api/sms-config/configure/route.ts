import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SmsConfigurationService } from '@/lib/sms-config'
import type { Database } from '@/lib/database.types'

// Create Supabase client - using anon key for now, should use service role in production
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = supabaseUrl && supabaseKey ? createClient<Database>(
  supabaseUrl,
  supabaseKey
) : null as any

export async function GET(request: NextRequest) {
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

    // Get purchased_number_id from query params
    const { searchParams } = new URL(request.url)
    const purchasedNumberId = searchParams.get('purchased_number_id')
    
    if (!purchasedNumberId) {
      return NextResponse.json({ error: 'Missing purchased_number_id' }, { status: 400 })
    }

    // Verify user owns this number
    const { data: numberData, error: numberError } = await supabase
      .from('purchased_numbers')
      .select('id')
      .eq('id', purchasedNumberId)
      .eq('user_id', user.id)
      .single()

    if (numberError || !numberData) {
      return NextResponse.json({ error: 'Number not found' }, { status: 404 })
    }

    // Get SMS configuration
    const config = await SmsConfigurationService.getConfigurationWithRules(purchasedNumberId)

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error fetching SMS configuration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SMS configuration' },
      { status: 500 }
    )
  }
}

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
    const { purchased_number_id, ...configData } = body

    if (!purchased_number_id) {
      return NextResponse.json({ error: 'Missing purchased_number_id' }, { status: 400 })
    }

    // Verify user owns this number
    const { data: numberData, error: numberError } = await supabase
      .from('purchased_numbers')
      .select('id')
      .eq('id', purchased_number_id)
      .eq('user_id', user.id)
      .single()

    if (numberError || !numberData) {
      return NextResponse.json({ error: 'Number not found' }, { status: 404 })
    }

    // Create or update SMS configuration
    const config = await SmsConfigurationService.upsertConfiguration(
      purchased_number_id,
      configData
    )

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error updating SMS configuration:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update SMS configuration' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
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
    const { config_id, ...updates } = body

    if (!config_id) {
      return NextResponse.json({ error: 'Missing config_id' }, { status: 400 })
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

    // Update configuration
    const config = await SmsConfigurationService.updateConfiguration(config_id, updates)

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error updating SMS configuration:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update SMS configuration' },
      { status: 500 }
    )
  }
}