import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with cookies for auth
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    });

    // Get the authenticated user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      );
    }

    const user = session.user;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const purchasedNumberId = searchParams.get('purchasedNumberId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!purchasedNumberId) {
      return NextResponse.json(
        { error: 'purchasedNumberId is required' },
        { status: 400 }
      );
    }

    // Verify the user owns this number
    const { data: purchasedNumber, error: fetchError } = await supabase
      .from('purchased_numbers')
      .select('id, phone_number')
      .eq('id', purchasedNumberId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !purchasedNumber) {
      return NextResponse.json(
        { error: 'Number not found or access denied' },
        { status: 404 }
      );
    }

    // Check if call_logs table exists
    const { data: callLogs, error: logsError } = await supabase
      .from('call_logs')
      .select('*')
      .eq('purchased_number_id', purchasedNumberId)
      .order('start_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError && logsError.message?.includes('relation')) {
      // Table doesn't exist yet, return empty data
      return NextResponse.json({
        success: true,
        data: {
          logs: [],
          total: 0,
          phoneNumber: purchasedNumber.phone_number
        }
      });
    }

    // Get total count
    const { count } = await supabase
      .from('call_logs')
      .select('*', { count: 'exact', head: true })
      .eq('purchased_number_id', purchasedNumberId);

    return NextResponse.json({
      success: true,
      data: {
        logs: callLogs || [],
        total: count || 0,
        phoneNumber: purchasedNumber.phone_number
      }
    });
  } catch (error) {
    console.error('Call logs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}