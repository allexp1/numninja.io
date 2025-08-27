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
    const active = searchParams.get('active')

    let query = supabase.from('countries').select('*')
    
    if (active !== null) {
      query = query.eq('active', active === 'true')
    }

    const { data, error } = await query.order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
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
      .from('countries')
      .insert([body])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create country' },
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
        { error: 'Country ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('countries')
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
      { error: 'Failed to update country' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await checkAdminAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Country ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('countries')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete country' },
      { status: 500 }
    )
  }
}