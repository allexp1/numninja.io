import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { checkAdminAuth } from '../middleware'

export async function GET(request: NextRequest) {
  const authResult = await checkAdminAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const countryId = searchParams.get('countryId')

    let query = supabase
      .from('area_codes')
      .select(`
        *,
        countries (
          name,
          iso_code
        )
      `)
    
    if (countryId) {
      query = query.eq('country_id', countryId)
    }

    const { data, error } = await query.order('area_code', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch area codes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authResult = await checkAdminAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    const { data, error } = await supabase
      .from('area_codes')
      .insert([body])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create area code' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await checkAdminAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Area code ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('area_codes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update area code' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await checkAdminAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { ids, adjustment } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Area code IDs are required' },
        { status: 400 }
      )
    }

    if (!adjustment || typeof adjustment.value !== 'number') {
      return NextResponse.json(
        { error: 'Price adjustment is required' },
        { status: 400 }
      )
    }

    // Get current prices
    const { data: areaCodes, error: fetchError } = await supabase
      .from('area_codes')
      .select('id, base_price, sms_addon_price')
      .in('id', ids)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 })
    }

    // Calculate new prices
    const updates = areaCodes.map(code => {
      let newBasePrice = code.base_price
      let newSmsPrice = code.sms_addon_price

      if (adjustment.type === 'percentage') {
        const multiplier = 1 + (adjustment.value / 100)
        newBasePrice = Number((code.base_price * multiplier).toFixed(2))
        newSmsPrice = Number((code.sms_addon_price * multiplier).toFixed(2))
      } else {
        newBasePrice = Number((code.base_price + adjustment.value).toFixed(2))
        newSmsPrice = Number((code.sms_addon_price + adjustment.value).toFixed(2))
      }

      return {
        id: code.id,
        base_price: Math.max(0, newBasePrice),
        sms_addon_price: Math.max(0, newSmsPrice)
      }
    })

    // Update prices in batch
    const updatePromises = updates.map(update =>
      supabase
        .from('area_codes')
        .update({
          base_price: update.base_price,
          sms_addon_price: update.sms_addon_price
        })
        .eq('id', update.id)
    )

    await Promise.all(updatePromises)

    return NextResponse.json({ success: true, updated: updates.length })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to bulk update area codes' },
      { status: 500 }
    )
  }
}