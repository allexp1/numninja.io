import { NextRequest, NextResponse } from 'next/server';
import { provisioningService } from '@/lib/provisioning';
import { createClient } from '@supabase/supabase-js';

// This endpoint should be called by a cron job or background service
// In production, you might use Vercel Cron, Railway, or a similar service

export async function GET(request: NextRequest) {
  try {
    // Check for authorization - this could be a secret key or cron job token
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Only allow execution with proper authorization
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Process the provisioning queue
    const results = await provisioningService.processProvisioningQueue(10);
    
    return NextResponse.json({
      success: true,
      message: 'Provisioning queue processed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Background job error:', error);
    return NextResponse.json(
      { error: 'Failed to process provisioning queue' },
      { status: 500 }
    );
  }
}

// Manual trigger for processing specific job
export async function POST(request: NextRequest) {
  try {
    // Check for authorization
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { purchasedNumberId, action } = body;

    if (!purchasedNumberId) {
      return NextResponse.json(
        { error: 'purchasedNumberId is required' },
        { status: 400 }
      );
    }

    // Create Supabase service client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get the purchased number
    const { data: purchasedNumber, error: fetchError } = await supabase
      .from('purchased_numbers')
      .select('*')
      .eq('id', purchasedNumberId)
      .single();

    if (fetchError || !purchasedNumber) {
      return NextResponse.json(
        { error: 'Purchased number not found' },
        { status: 404 }
      );
    }

    // Process based on action
    let result;
    switch (action || 'provision') {
      case 'provision':
        result = await provisioningService.provisionNumber(purchasedNumberId);
        break;
      case 'cancel':
        await provisioningService.cancelNumber(purchasedNumberId);
        result = { success: true, action: 'cancelled' };
        break;
      case 'suspend':
        await provisioningService.suspendNumber(purchasedNumberId);
        result = { success: true, action: 'suspended' };
        break;
      case 'reactivate':
        await provisioningService.reactivateNumber(purchasedNumberId);
        result = { success: true, action: 'reactivated' };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      result,
      purchasedNumberId
    });
  } catch (error) {
    console.error('Manual job trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to process job' },
      { status: 500 }
    );
  }
}

// Cleanup old jobs
export async function DELETE(request: NextRequest) {
  try {
    // Check for authorization
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create Supabase service client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Delete completed jobs older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { error } = await supabase
      .from('provisioning_queue')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('created_at', sevenDaysAgo.toISOString());

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Old jobs cleaned up'
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup old jobs' },
      { status: 500 }
    );
  }
}