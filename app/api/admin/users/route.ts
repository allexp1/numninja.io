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
    const status = searchParams.get('status')
    const verified = searchParams.get('verified')

    let query = supabase
      .from('profiles')
      .select(`
        *,
        numbers (count)
      `)
    
    if (status) {
      query = query.eq('status', status)
    }

    if (verified !== null) {
      query = query.eq('email_verified', verified === 'true')
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Calculate additional stats for each user
    const usersWithStats = await Promise.all(
      (data || []).map(async (user) => {
        // Get user's orders for total spent
        const { data: orders } = await supabase
          .from('orders')
          .select('total')
          .eq('user_id', user.id)
          .eq('status', 'completed')

        const totalSpent = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0

        // Get user's active numbers count
        const { count: numbersCount } = await supabase
          .from('numbers')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active')

        return {
          ...user,
          numbers_count: numbersCount || 0,
          total_spent: totalSpent
        }
      })
    )

    return NextResponse.json(usersWithStats)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
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
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('profiles')
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
      { error: 'Failed to update user' },
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
    const { ids, status } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'User IDs are required' },
        { status: 400 }
      )
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .in('id', ids)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, updated: ids.length })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to bulk update users' },
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
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Note: In production, you might want to soft delete or handle this differently
    // This is just for demo purposes
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'deleted', deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}