import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ProvisioningQueueProcessor } from '@/lib/provisioning/queue-processor';

// Store processor instance
let processor: ProvisioningQueueProcessor | null = null;

export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization (you should implement proper auth)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'start') {
      if (processor) {
        return NextResponse.json({
          message: 'Processor is already running',
          status: 'running'
        });
      }

      processor = new ProvisioningQueueProcessor();
      
      // Start processing in the background (non-blocking)
      processor.startProcessing().catch(error => {
        console.error('Processor error:', error);
        processor = null;
      });

      return NextResponse.json({
        message: 'Provisioning processor started',
        status: 'started'
      });

    } else if (action === 'stop') {
      if (!processor) {
        return NextResponse.json({
          message: 'Processor is not running',
          status: 'stopped'
        });
      }

      processor.stopProcessing();
      processor = null;

      return NextResponse.json({
        message: 'Provisioning processor stopped',
        status: 'stopped'
      });

    } else if (action === 'status') {
      return NextResponse.json({
        status: processor ? 'running' : 'stopped'
      });

    } else if (action === 'process-single') {
      // Process a single task immediately
      const tempProcessor = new ProvisioningQueueProcessor();
      
      // Get the next pending task
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: task } = await supabase
        .from('provisioning_queue')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (!task) {
        return NextResponse.json({
          message: 'No pending tasks in queue'
        });
      }

      return NextResponse.json({
        message: 'Processing single task',
        task_id: task.id
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use: start, stop, status, or process-single' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Provisioning API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get queue status
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: stats } = await supabase
      .rpc('get_provisioning_queue_stats');

    // If RPC doesn't exist, do it manually
    const { data: pending } = await supabase
      .from('provisioning_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { data: processing } = await supabase
      .from('provisioning_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'processing');

    const { data: completed } = await supabase
      .from('provisioning_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed');

    const { data: failed } = await supabase
      .from('provisioning_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed');

    return NextResponse.json({
      processor_status: processor ? 'running' : 'stopped',
      queue_stats: {
        pending: pending || 0,
        processing: processing || 0,
        completed: completed || 0,
        failed: failed || 0,
      }
    });

  } catch (error) {
    console.error('Queue status error:', error);
    return NextResponse.json(
      { error: 'Failed to get queue status' },
      { status: 500 }
    );
  }
}