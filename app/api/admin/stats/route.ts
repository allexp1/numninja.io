import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { checkAdminAuth } from '../middleware'

export async function GET(request: NextRequest) {
  const authResult = await checkAdminAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get total users count
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get active numbers count
    const { count: activeNumbers } = await supabase
      .from('numbers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get total revenue
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total')
      .eq('status', 'completed')

    const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0

    // Get recent orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select(`
        *,
        profiles (
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    // Calculate growth metrics (mock data for demo)
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Users growth
    const { count: lastMonthUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', thisMonth.toISOString())
      .gte('created_at', lastMonth.toISOString())

    const { count: thisMonthUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisMonth.toISOString())

    const userGrowth = lastMonthUsers && lastMonthUsers > 0 
      ? ((thisMonthUsers! - lastMonthUsers) / lastMonthUsers) * 100 
      : 0

    // Numbers growth
    const { count: lastMonthNumbers } = await supabase
      .from('numbers')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', thisMonth.toISOString())
      .gte('created_at', lastMonth.toISOString())

    const { count: thisMonthNumbers } = await supabase
      .from('numbers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisMonth.toISOString())

    const numberGrowth = lastMonthNumbers && lastMonthNumbers > 0
      ? ((thisMonthNumbers! - lastMonthNumbers) / lastMonthNumbers) * 100
      : 0

    // Revenue growth
    const { data: lastMonthRevenue } = await supabase
      .from('orders')
      .select('total')
      .eq('status', 'completed')
      .lt('created_at', thisMonth.toISOString())
      .gte('created_at', lastMonth.toISOString())

    const { data: thisMonthRevenue } = await supabase
      .from('orders')
      .select('total')
      .eq('status', 'completed')
      .gte('created_at', thisMonth.toISOString())

    const lastMonthTotal = lastMonthRevenue?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
    const thisMonthTotal = thisMonthRevenue?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
    
    const revenueGrowth = lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0

    // Get order stats
    const { count: pendingOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: completedOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    const { count: failedOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeNumbers: activeNumbers || 0,
      totalRevenue,
      recentOrders: recentOrders || [],
      userGrowth: Number(userGrowth.toFixed(1)),
      numberGrowth: Number(numberGrowth.toFixed(1)),
      revenueGrowth: Number(revenueGrowth.toFixed(1)),
      orderStats: {
        pending: pendingOrders || 0,
        completed: completedOrders || 0,
        failed: failedOrders || 0
      }
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}