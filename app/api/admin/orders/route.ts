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
    const type = searchParams.get('type')
    const userId = searchParams.get('userId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles (
          email,
          full_name,
          phone
        ),
        order_items (
          id,
          type,
          description,
          quantity,
          unit_price,
          total,
          metadata
        )
      `)
    
    if (status) {
      query = query.eq('status', status)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
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
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('orders')
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
      { error: 'Failed to update order' },
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
    const { orderId, action } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    // Handle different actions
    switch (action) {
      case 'refund': {
        // Get the order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single()

        if (orderError || !order) {
          return NextResponse.json(
            { error: 'Order not found' },
            { status: 404 }
          )
        }

        if (order.status !== 'completed') {
          return NextResponse.json(
            { error: 'Can only refund completed orders' },
            { status: 400 }
          )
        }

        // Update order status to refunded
        const { data: refundedOrder, error: refundError } = await supabase
          .from('orders')
          .update({ 
            status: 'refunded',
            refunded_at: new Date().toISOString(),
            refund_amount: order.total,
            notes: `Refunded by admin on ${new Date().toISOString()}`
          })
          .eq('id', orderId)
          .select()
          .single()

        if (refundError) {
          return NextResponse.json({ error: refundError.message }, { status: 400 })
        }

        // Here you would also integrate with your payment provider to process the actual refund
        // For example with Stripe:
        // const refund = await stripe.refunds.create({
        //   payment_intent: order.payment_intent_id,
        //   amount: order.total * 100, // Convert to cents
        // })

        return NextResponse.json({ 
          success: true, 
          order: refundedOrder,
          message: 'Order refunded successfully'
        })
      }

      case 'cancel': {
        const { data: cancelledOrder, error: cancelError } = await supabase
          .from('orders')
          .update({ 
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('id', orderId)
          .select()
          .single()

        if (cancelError) {
          return NextResponse.json({ error: cancelError.message }, { status: 400 })
        }

        return NextResponse.json({ 
          success: true, 
          order: cancelledOrder,
          message: 'Order cancelled successfully'
        })
      }

      case 'complete': {
        const { data: completedOrder, error: completeError } = await supabase
          .from('orders')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', orderId)
          .select()
          .single()

        if (completeError) {
          return NextResponse.json({ error: completeError.message }, { status: 400 })
        }

        return NextResponse.json({ 
          success: true, 
          order: completedOrder,
          message: 'Order marked as completed'
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process order action' },
      { status: 500 }
    )
  }
}

// Export orders data
export async function PATCH(request: NextRequest) {
  const authResult = await checkAdminAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles (
          email,
          full_name,
          phone
        ),
        order_items (*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (format === 'csv') {
      // Generate CSV
      const csv = [
        'Order ID,Invoice,Customer Email,Customer Name,Type,Status,Items Count,Subtotal,Tax,Total,Payment Method,Created At,Completed At',
        ...(orders || []).map(order => 
          `${order.id},${order.invoice_number},${order.profiles?.email},${order.profiles?.full_name || ''},${order.type},${order.status},${order.order_items?.length || 0},${order.subtotal},${order.tax},${order.total},${order.payment_method},${order.created_at},${order.completed_at || ''}`
        )
      ].join('\n')

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="orders-export-${new Date().toISOString()}.csv"`
        }
      })
    }

    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to export orders' },
      { status: 500 }
    )
  }
}