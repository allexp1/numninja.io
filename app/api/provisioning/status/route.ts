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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get purchasedNumberId from query params
    const { searchParams } = new URL(request.url);
    const purchasedNumberId = searchParams.get('purchasedNumberId');

    if (!purchasedNumberId) {
      return NextResponse.json(
        { error: 'purchasedNumberId is required' },
        { status: 400 }
      );
    }

    // Get the purchased number with configuration
    const { data: purchasedNumber, error: fetchError } = await supabase
      .from('purchased_numbers')
      .select(`
        *,
        number_configurations(*)
      `)
      .eq('id', purchasedNumberId)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !purchasedNumber) {
      return NextResponse.json(
        { error: 'Number not found or access denied' },
        { status: 404 }
      );
    }

    // Get the latest provisioning job
    const { data: provisioningJob } = await supabase
      .from('provisioning_queue')
      .select('*')
      .eq('purchased_number_id', purchasedNumberId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        purchasedNumber,
        provisioningJob,
        status: purchasedNumber.provisioning_status,
        isActive: purchasedNumber.is_active,
        didId: purchasedNumber.didww_did_id,
        lastError: purchasedNumber.last_provision_error,
        attempts: purchasedNumber.provisioning_attempts
      }
    });
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get status for all user's numbers
export async function POST(request: NextRequest) {
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

    const userId = session.user.id;
    
    // Try to get purchased numbers with relationships
    let purchasedNumbers = [];
    try {
      // First try with all joins
      const { data, error } = await supabase
        .from('purchased_numbers')
        .select(`
          *,
          number_configurations(*),
          countries(*),
          area_codes(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error && error.message?.includes('relation')) {
        // If relationships don't exist, try simpler query
        console.log('Complex query failed, using simple query');
        const simpleResult = await supabase
          .from('purchased_numbers')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        purchasedNumbers = simpleResult.data || [];
      } else if (error) {
        console.error('Query error:', error);
        throw error;
      } else {
        purchasedNumbers = data || [];
      }
    } catch (err) {
      // If the table doesn't exist yet, return empty array
      console.log('Table may not exist yet:', err);
      purchasedNumbers = [];
    }

    // If we have numbers, try to get provisioning jobs
    if (purchasedNumbers.length > 0) {
      const numberIds = purchasedNumbers.map(n => n.id);
      
      try {
        const { data: provisioningJobs } = await supabase
          .from('provisioning_queue')
          .select('*')
          .in('purchased_number_id', numberIds)
          .order('created_at', { ascending: false });

        // Map jobs to numbers
        if (provisioningJobs) {
          purchasedNumbers = purchasedNumbers.map(number => {
            const jobs = provisioningJobs.filter(j => j.purchased_number_id === number.id);
            const latestJob = jobs[0];
            
            return {
              ...number,
              latestProvisioningJob: latestJob,
              provisioningJobs: jobs
            };
          });
        }
      } catch (err) {
        // Provisioning queue table might not exist
        console.log('Could not fetch provisioning jobs:', err);
      }
    }

    return NextResponse.json({
      success: true,
      data: purchasedNumbers
    });
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}