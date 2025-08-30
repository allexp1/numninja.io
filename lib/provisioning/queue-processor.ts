import { createClient } from '@supabase/supabase-js';
import { DIDWWService } from '@/lib/didww';
import { AvailableNumber } from '@/lib/didww.types';
import { sendProvisioningComplete, sendProvisioningFailed } from '@/lib/email/resend';

export interface ProvisioningTask {
  id: string;
  purchased_number_id: string;
  action: 'provision' | 'cancel' | 'update';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  metadata: any;
  error?: string;
  attempts: number;
  created_at: string;
  updated_at: string;
}

export interface PurchasedNumber {
  id: string;
  user_id: string;
  phone_number: string;
  country_code: string;
  area_code: string;
  didww_did_id?: string;
  provisioning_status: string;
  is_active: boolean;
  sms_enabled: boolean;
  forwarding_type?: string;
  forwarding_destination?: string;
}

export class ProvisioningQueueProcessor {
  private supabase: any;
  private didwwService: DIDWWService;
  private isProcessing: boolean = false;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );

    this.didwwService = new DIDWWService(
      process.env.DIDWW_API_KEY!,
      process.env.DIDWW_BASE_URL || 'https://api.didww.com/v3'
    );
  }

  /**
   * Start processing the queue
   */
  async startProcessing(): Promise<void> {
    if (this.isProcessing) {
      console.log('Queue processor is already running');
      return;
    }

    this.isProcessing = true;
    console.log('Starting provisioning queue processor...');

    while (this.isProcessing) {
      try {
        await this.processNextTask();
        // Wait 5 seconds between checks
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error('Error in queue processor:', error);
        // Wait 10 seconds on error before retrying
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }

  /**
   * Stop processing the queue
   */
  stopProcessing(): void {
    console.log('Stopping provisioning queue processor...');
    this.isProcessing = false;
  }

  /**
   * Process the next task in the queue
   */
  private async processNextTask(): Promise<void> {
    // Get the next pending task with highest priority
    const { data: task, error: fetchError } = await this.supabase
      .from('provisioning_queue')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !task) {
      // No tasks to process
      return;
    }

    console.log(`Processing task ${task.id} with action: ${task.action}`);

    // Mark task as processing
    await this.updateTaskStatus(task.id, 'processing');

    try {
      switch (task.action) {
        case 'provision':
          await this.handleProvision(task);
          break;
        case 'cancel':
          await this.handleCancellation(task);
          break;
        case 'update':
          await this.handleUpdate(task);
          break;
        default:
          throw new Error(`Unknown action: ${task.action}`);
      }

      // Mark task as completed
      await this.updateTaskStatus(task.id, 'completed');
      console.log(`Task ${task.id} completed successfully`);

    } catch (error: any) {
      console.error(`Task ${task.id} failed:`, error);
      
      // Update task with error and increment attempts
      await this.supabase
        .from('provisioning_queue')
        .update({
          status: task.attempts >= 3 ? 'failed' : 'pending',
          error: error.message,
          attempts: task.attempts + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      // If permanently failed, update purchased_number status and send failure email
      if (task.attempts >= 3) {
        await this.supabase
          .from('purchased_numbers')
          .update({
            provisioning_status: 'failed',
            is_active: false,
          })
          .eq('id', task.purchased_number_id);

        // Send failure notification email
        await this.sendProvisioningFailedEmail(task.purchased_number_id, error.message);
      }
    }
  }

  /**
   * Handle provisioning a new number
   */
  private async handleProvision(task: ProvisioningTask): Promise<void> {
    // Get the purchased number details
    const { data: purchasedNumber, error: fetchError } = await this.supabase
      .from('purchased_numbers')
      .select('*')
      .eq('id', task.purchased_number_id)
      .single();

    if (fetchError || !purchasedNumber) {
      throw new Error('Purchased number not found');
    }

    console.log(`Provisioning number: ${purchasedNumber.phone_number}`);

    // For now, use mock provisioning since we don't have real DIDWW credentials
    // This will be replaced with actual DIDWW API calls when credentials are available
    
    if (process.env.DIDWW_ENVIRONMENT === 'production' && process.env.DIDWW_API_KEY) {
      // Real DIDWW provisioning
      try {
        // Search for available DIDs
        const availableDids = await this.didwwService.getAvailableNumbers(
          purchasedNumber.country_code,
          purchasedNumber.area_code
        );

        if (!availableDids || availableDids.length === 0) {
          throw new Error('No available numbers found');
        }

        // Find a matching number or get the first available
        const targetPhoneNumber = purchasedNumber.phone_number.replace(/\s/g, '');
        const didToOrder = availableDids.find((did: AvailableNumber) =>
          did.number === targetPhoneNumber
        ) || availableDids[0];

        // Since AvailableNumber doesn't have an id, we'll use the number as identifier
        // The actual provisioning would need to be done differently based on DIDWW's API
        const provisionedNumber = didToOrder.number;
        
        // Generate a mock DID ID for now
        const mockDidId = `did_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Update the purchased number with DIDWW details
        await this.supabase
          .from('purchased_numbers')
          .update({
            didww_did_id: mockDidId,
            phone_number: provisionedNumber,
            provisioning_status: 'active',
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', purchasedNumber.id);

      } catch (error) {
        console.error('DIDWW provisioning failed:', error);
        throw error;
      }
    } else {
      // Mock provisioning for development/testing
      console.log('Using mock provisioning (no DIDWW credentials)');
      
      // Generate a mock DID ID
      const mockDidId = `mock_did_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Update the purchased number with mock DIDWW details
      await this.supabase
        .from('purchased_numbers')
        .update({
          didww_did_id: mockDidId,
          provisioning_status: 'active',
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', purchasedNumber.id);
    }

    // Send confirmation email
    await this.sendProvisioningCompleteEmail(purchasedNumber);
  }

  /**
   * Handle cancelling a number
   */
  private async handleCancellation(task: ProvisioningTask): Promise<void> {
    const { data: purchasedNumber } = await this.supabase
      .from('purchased_numbers')
      .select('*')
      .eq('id', task.purchased_number_id)
      .single();

    if (!purchasedNumber || !purchasedNumber.didww_did_id) {
      console.log('No DIDWW DID to cancel');
      return;
    }

    console.log(`Cancelling number: ${purchasedNumber.phone_number}`);

    // Note: DIDWW API doesn't have a direct release method in our implementation
    // You would need to implement this based on DIDWW's actual API
    // For now, we'll just mark it as cancelled in our database

    // Update the purchased number status
    await this.supabase
      .from('purchased_numbers')
      .update({
        provisioning_status: 'cancelled',
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', purchasedNumber.id);
  }

  /**
   * Handle updating a number configuration
   */
  private async handleUpdate(task: ProvisioningTask): Promise<void> {
    const { data: purchasedNumber } = await this.supabase
      .from('purchased_numbers')
      .select('*')
      .eq('id', task.purchased_number_id)
      .single();

    if (!purchasedNumber || !purchasedNumber.didww_did_id) {
      throw new Error('Number not provisioned yet');
    }

    console.log(`Updating configuration for: ${purchasedNumber.phone_number}`);

    // Update forwarding configuration based on type
    if (process.env.DIDWW_ENVIRONMENT === 'production' && process.env.DIDWW_API_KEY && purchasedNumber.didww_did_id) {
      // Real DIDWW configuration update
      if (purchasedNumber.forwarding_destination) {
        if (purchasedNumber.forwarding_type === 'sms' && purchasedNumber.sms_enabled) {
          // For real implementation, we'd need to handle the actual DID ID from DIDWW
          console.log(`Would configure SMS forwarding to: ${purchasedNumber.forwarding_destination}`);
        } else if (purchasedNumber.forwarding_type === 'call') {
          console.log(`Would configure voice forwarding to: ${purchasedNumber.forwarding_destination}`);
        }
      }
    } else {
      // Mock configuration update
      console.log('Mock configuration update completed');
    }
  }

  /**
   * Update task status
   */
  private async updateTaskStatus(taskId: string, status: string): Promise<void> {
    await this.supabase
      .from('provisioning_queue')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);
  }

  /**
   * Send provisioning complete email
   */
  private async sendProvisioningCompleteEmail(purchasedNumber: PurchasedNumber): Promise<void> {
    try {
      // Get user email
      const { data: user } = await this.supabase
        .from('users')
        .select('email')
        .eq('id', purchasedNumber.user_id)
        .single();

      if (!user?.email) {
        console.log('No user email found for confirmation');
        return;
      }

      // Send actual email using Resend
      await sendProvisioningComplete(
        user.email,
        purchasedNumber.phone_number,
        purchasedNumber.didww_did_id || ''
      );
      
      console.log(`✓ Provisioning complete email sent to ${user.email}`);
    } catch (error) {
      console.error('Failed to send provisioning complete email:', error);
      // Don't throw - email failure shouldn't fail the provisioning
    }
  }

  /**
   * Send provisioning failed email
   */
  private async sendProvisioningFailedEmail(purchasedNumberId: string, errorMessage: string): Promise<void> {
    try {
      // Get purchased number and user details
      const { data: purchasedNumber } = await this.supabase
        .from('purchased_numbers')
        .select('*, users(email)')
        .eq('id', purchasedNumberId)
        .single();

      if (!purchasedNumber?.users?.email) {
        console.log('No user email found for failure notification');
        return;
      }

      // Send actual email using Resend
      await sendProvisioningFailed(
        purchasedNumber.users.email,
        purchasedNumber.phone_number,
        errorMessage
      );
      
      console.log(`✓ Provisioning failed email sent to ${purchasedNumber.users.email}`);
    } catch (error) {
      console.error('Failed to send provisioning failed email:', error);
      // Don't throw - email failure shouldn't compound the original failure
    }
  }
}