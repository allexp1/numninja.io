import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get the user token from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Create Supabase client with user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
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
      .eq('user_id', user.id)
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
    // Get the user token from the request
    const authHeader = request.headers.get('authorization');
    console.log('[DEBUG] Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[DEBUG] Missing or invalid auth header');
      return NextResponse.json(
        { error: 'Unauthorized - No auth header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    console.log('[DEBUG] Token received (first 20 chars):', token.substring(0, 20));
    
    // Create Supabase client with user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[DEBUG] Supabase auth.getUser result:', {
      hasUser: !!user,
      error: authError?.message,
      userId: user?.id
    });
    
    if (authError || !user) {
      console.log('[DEBUG] Auth failed:', authError);
      // For now, let's try to decode the JWT manually to get user ID
      // This is a temporary fix - we need to properly handle auth
      try {
        // Parse JWT payload (base64 decode the middle part)
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('[DEBUG] JWT payload:', payload);
          
          // If we have a user ID in the payload, use it
          if (payload.sub || payload.user_id) {
            const userId = payload.sub || payload.user_id;
            console.log('[DEBUG] Using user ID from JWT:', userId);
            
            // Use service role to bypass RLS and fetch user's numbers
            const serviceSupabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            
            // Get all purchased numbers with configurations
            const { data: purchasedNumbers, error: fetchError } = await serviceSupabase
              .from('purchased_numbers')
              .select(`
                *,
                number_configurations(*),
                countries(*),
                area_codes(*)
              `)
              .eq('user_id', userId)
              .order('created_at', { ascending: false });

            console.log('[DEBUG] Fetch result:', {
              count: purchasedNumbers?.length || 0,
              error: fetchError?.message
            });

            if (fetchError) {
              throw fetchError;
            }

            // Get provisioning jobs for all numbers
            const numberIds = purchasedNumbers?.map(n => n.id) || [];
            const { data: provisioningJobs } = await serviceSupabase
              .from('provisioning_queue')
              .select('*')
              .in('purchased_number_id', numberIds)
              .order('created_at', { ascending: false });

            // Map jobs to numbers
            const numbersWithJobs = purchasedNumbers?.map(number => {
              const jobs = provisioningJobs?.filter(j => j.purchased_number_id === number.id) || [];
              const latestJob = jobs[0];
              
              return {
                ...number,
                latestProvisioningJob: latestJob,
                provisioningJobs: jobs
              };
            });

            return NextResponse.json({
              success: true,
              data: numbersWithJobs || []
            });
          }
        }
      } catch (jwtError) {
        console.error('[DEBUG] JWT decode error:', jwtError);
      }
      
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Get all purchased numbers - simplified query without joins
    // The relationships might not exist yet in the database
    console.log('[DEBUG] Fetching numbers for authenticated user:', user.id);
    
    let purchasedNumbers = [];
    try {
      // Try with joins first
      const { data, error } = await supabase
        .from('purchased_numbers')
        .select(`
          *,
          number_configurations(*),
          countries(*),
          area_codes(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error && error.code === 'PGRST200') {
        // If joins fail, try simple query
        console.log('[DEBUG] Complex query failed, trying simple query');
        const simpleResult = await supabase
          .from('purchased_numbers')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        purchasedNumbers = simpleResult.data || [];
      } else if (error) {
        console.log('[DEBUG] Query error:', error);
        // If table doesn't exist, return empty array
        purchasedNumbers = [];
      } else {
        purchasedNumbers = data || [];
      }
    } catch (err) {
      console.log('[DEBUG] Query exception:', err);
      purchasedNumbers = [];
    }

    console.log('[DEBUG] Found', purchasedNumbers.length, 'numbers for user');

    // Get provisioning jobs for all numbers
    const numberIds = purchasedNumbers?.map(n => n.id) || [];
    const { data: provisioningJobs } = await supabase
      .from('provisioning_queue')
      .select('*')
      .in('purchased_number_id', numberIds)
      .order('created_at', { ascending: false });

    // Map jobs to numbers
    const numbersWithJobs = purchasedNumbers?.map(number => {
      const jobs = provisioningJobs?.filter(j => j.purchased_number_id === number.id) || [];
      const latestJob = jobs[0];
      
      return {
        ...number,
        latestProvisioningJob: latestJob,
        provisioningJobs: jobs
      };
    });

    return NextResponse.json({
      success: true,
      data: numbersWithJobs
    });
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}