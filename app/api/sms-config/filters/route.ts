import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SmsConfigurationService } from '@/lib/sms-config'
import type { Database } from '@/lib/database.types'

// Create Supabase client with service role for server-side operations
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

    // Get config_id from query params
    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('config_id')
    
    if (!configId) {
      return NextResponse.json({ error: 'Missing config_id' }, { status: 400 })
    }

    // Verify user owns this configuration
    const { data: configData, error: configError } = await supabase
      .from('sms_configurations')
      .select('purchased_number_id')
      .eq('id', configId)
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

    // Get filter rules
    const rules = await SmsConfigurationService.getFilterRules(configId)

    return NextResponse.json({ rules })
  } catch (error) {
    console.error('Error fetching filter rules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filter rules' },
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
    const { sms_configuration_id, ...ruleData } = body

    if (!sms_configuration_id) {
      return NextResponse.json({ error: 'Missing sms_configuration_id' }, { status: 400 })
    }

    // Verify user owns this configuration
    const { data: configData, error: configError } = await supabase
      .from('sms_configurations')
      .select('purchased_number_id')
      .eq('id', sms_configuration_id)
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

    // Create filter rule
    const rule = await SmsConfigurationService.createFilterRule({
      sms_configuration_id,
      ...ruleData
    })

    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Error creating filter rule:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create filter rule' },
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
    const { rule_id, ...updates } = body

    if (!rule_id) {
      return NextResponse.json({ error: 'Missing rule_id' }, { status: 400 })
    }

    // Get rule and verify ownership
    const { data: ruleData, error: ruleError } = await supabase
      .from('sms_filter_rules')
      .select('sms_configuration_id')
      .eq('id', rule_id)
      .single()

    if (ruleError || !ruleData) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    // Verify user owns the configuration
    const { data: configData, error: configError } = await supabase
      .from('sms_configurations')
      .select('purchased_number_id')
      .eq('id', (ruleData as any).sms_configuration_id)
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

    // Update filter rule
    const rule = await SmsConfigurationService.updateFilterRule(rule_id, updates)

    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Error updating filter rule:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update filter rule' },
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

    // Get rule_id from query params
    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get('rule_id')
    
    if (!ruleId) {
      return NextResponse.json({ error: 'Missing rule_id' }, { status: 400 })
    }

    // Get rule and verify ownership
    const { data: ruleData, error: ruleError } = await supabase
      .from('sms_filter_rules')
      .select('sms_configuration_id')
      .eq('id', ruleId)
      .single()

    if (ruleError || !ruleData) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    // Verify user owns the configuration
    const { data: configData, error: configError } = await supabase
      .from('sms_configurations')
      .select('purchased_number_id')
      .eq('id', (ruleData as any).sms_configuration_id)
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

    // Delete filter rule
    await SmsConfigurationService.deleteFilterRule(ruleId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting filter rule:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete filter rule' },
      { status: 500 }
    )
  }
}