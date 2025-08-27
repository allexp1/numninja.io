import { createClient } from '@supabase/supabase-js';
import { DIDWWService } from './didww';
import {
  Database,
  ProvisioningStatus,
  PurchasedNumber,
  PurchasedNumberUpdate,
  ProvisioningQueue,
  ProvisioningQueueUpdate,
  NumberConfiguration,
  NumberConfigurationInsert,
  Country,
  AreaCode
} from './database.types';

export interface ProvisioningConfig {
  forwardingType?: 'mobile' | 'landline' | 'voip' | 'none';
  forwardingNumber?: string;
  voicemailEnabled?: boolean;
  voicemailEmail?: string;
  smsForwardingEmail?: string;
  callRecordingEnabled?: boolean;
}

export interface ProvisioningResult {
  success: boolean;
  didId?: string;
  error?: string;
  attempts?: number;
}

// Mock DIDWW Service for testing
class MockDIDWWService {
  private static MOCK_DELAY = 2000; // Simulate API delay
  private static FAILURE_RATE = 0.1; // 10% chance of failure for testing

  async provisionNumber(
    phoneNumber: string,
    countryCode: string,
    areaCode: string
  ): Promise<{ didId: string; orderId: string }> {
    await this.simulateDelay();
    
    if (Math.random() < MockDIDWWService.FAILURE_RATE) {
      throw new Error('Mock provisioning failed - simulated error');
    }

    // Generate mock IDs
    const didId = `did_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[MOCK] Provisioned number ${phoneNumber} with DID ID: ${didId}`);
    
    return { didId, orderId };
  }

  async configureVoiceForwarding(
    didId: string,
    forwardingType: string,
    forwardingNumber?: string
  ): Promise<void> {
    await this.simulateDelay();
    
    console.log(`[MOCK] Configured voice forwarding for DID ${didId}:`, {
      type: forwardingType,
      number: forwardingNumber
    });
  }

  async configureSMSForwarding(
    didId: string,
    email: string
  ): Promise<void> {
    await this.simulateDelay();
    
    console.log(`[MOCK] Configured SMS forwarding for DID ${didId} to email: ${email}`);
  }

  async cancelNumber(didId: string): Promise<void> {
    await this.simulateDelay();
    
    console.log(`[MOCK] Cancelled DID ${didId}`);
  }

  async suspendNumber(didId: string): Promise<void> {
    await this.simulateDelay();
    
    console.log(`[MOCK] Suspended DID ${didId}`);
  }

  async reactivateNumber(didId: string): Promise<void> {
    await this.simulateDelay();
    
    console.log(`[MOCK] Reactivated DID ${didId}`);
  }

  private async simulateDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, MockDIDWWService.MOCK_DELAY));
  }
}

export class ProvisioningService {
  private supabase: ReturnType<typeof createClient<Database>>;
  private didwwService: DIDWWService | MockDIDWWService;
  private useMock: boolean;

  constructor(supabaseUrl?: string, supabaseKey?: string, useMock: boolean = true) {
    this.supabase = createClient<Database>(
      supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Use mock service in development/testing
    this.useMock = useMock || process.env.NODE_ENV !== 'production';
    this.didwwService = this.useMock 
      ? new MockDIDWWService() 
      : new DIDWWService();
  }

  /**
   * Provision a new phone number
   */
  async provisionNumber(
    purchasedNumberId: string,
    config?: ProvisioningConfig,
    retryCount: number = 0
  ): Promise<ProvisioningResult> {
    try {
      // Get the purchased number details
      const { data: purchasedNumber, error: fetchError } = await this.supabase
        .from('purchased_numbers')
        .select('*')
        .eq('id', purchasedNumberId)
        .single();

      if (fetchError || !purchasedNumber) {
        throw new Error(`Purchased number not found: ${purchasedNumberId}`);
      }

      const typedPurchasedNumber = purchasedNumber as unknown as PurchasedNumber;

      // Get country and area code details
      const { data: country } = await this.supabase
        .from('countries')
        .select('*')
        .eq('id', typedPurchasedNumber.country_id)
        .single() as any;

      const { data: areaCode } = await this.supabase
        .from('area_codes')
        .select('*')
        .eq('id', typedPurchasedNumber.area_code_id)
        .single() as any;

      if (!country || !areaCode) {
        throw new Error('Country or area code not found');
      }

      const typedCountry = country as Country;
      const typedAreaCode = areaCode as AreaCode;

      // Update status to provisioning
      await this.updateProvisioningStatus(purchasedNumberId, 'provisioning', retryCount);

      // Provision the number with DIDWW (or mock)
      const { didId, orderId } = await this.callProvisionAPI(
        typedPurchasedNumber.phone_number,
        typedCountry.code,
        typedAreaCode.area_code
      );

      // Update the purchased number with DIDWW ID
      const updateData: PurchasedNumberUpdate = {
        didww_did_id: didId,
        provisioning_status: 'active',
        provisioned_at: new Date().toISOString(),
        provisioning_attempts: retryCount + 1
      };
      
      const { error: updateError } = await (this.supabase
        .from('purchased_numbers') as any)
        .update(updateData)
        .eq('id', purchasedNumberId);

      if (updateError) {
        throw updateError;
      }

      // Configure forwarding if provided
      if (config) {
        await this.configureForwarding(purchasedNumberId, didId, config);
      }

      // Mark provisioning as complete in the queue
      await this.markProvisioningComplete(purchasedNumberId);

      return {
        success: true,
        didId,
        attempts: retryCount + 1
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update status to failed
      await this.updateProvisioningStatus(
        purchasedNumberId, 
        'failed', 
        retryCount + 1,
        errorMessage
      );

      // Schedule retry if not exceeded max attempts
      if (retryCount < 3) {
        await this.scheduleRetry(purchasedNumberId, retryCount + 1);
      }

      return {
        success: false,
        error: errorMessage,
        attempts: retryCount + 1
      };
    }
  }

  /**
   * Configure forwarding for a provisioned number
   */
  async configureForwarding(
    purchasedNumberId: string,
    didId: string,
    config: ProvisioningConfig
  ): Promise<void> {
    try {
      // Configure voice forwarding
      if (config.forwardingType && config.forwardingType !== 'none') {
        if (this.useMock) {
          await (this.didwwService as MockDIDWWService).configureVoiceForwarding(
            didId,
            config.forwardingType,
            config.forwardingNumber
          );
        } else {
          const didww = this.didwwService as DIDWWService;
          if (config.forwardingType === 'voip' && config.forwardingNumber) {
            await didww.configureVoiceForwarding(
              didId,
              config.forwardingNumber,
              'sip'
            );
          } else if (config.forwardingNumber) {
            await didww.configureVoiceForwarding(
              didId,
              config.forwardingNumber,
              'pstn'
            );
          }
        }
      }

      // Configure SMS forwarding
      if (config.smsForwardingEmail) {
        if (this.useMock) {
          await (this.didwwService as MockDIDWWService).configureSMSForwarding(
            didId,
            config.smsForwardingEmail
          );
        } else {
          await (this.didwwService as DIDWWService).configureSMSForwarding(
            didId,
            config.smsForwardingEmail,
            true
          );
        }
      }

      // Update number configuration in database
      const { data: existingConfig } = await this.supabase
        .from('number_configurations')
        .select('id')
        .eq('purchased_number_id', purchasedNumberId)
        .single() as any;

      const configData = {
        forwarding_type: (config.forwardingType || 'none') as 'mobile' | 'landline' | 'voip' | 'none',
        forwarding_number: config.forwardingNumber || null,
        voicemail_enabled: config.voicemailEnabled ?? true,
        voicemail_email: config.voicemailEmail || null,
        call_recording_enabled: config.callRecordingEnabled ?? false,
      };

      if (existingConfig) {
        const typedConfig = existingConfig as { id: string };
        await (this.supabase
          .from('number_configurations') as any)
          .update(configData)
          .eq('id', typedConfig.id);
      } else {
        const insertData: NumberConfigurationInsert = {
          ...configData,
          purchased_number_id: purchasedNumberId
        };
        await (this.supabase
          .from('number_configurations') as any)
          .insert(insertData);
      }
    } catch (error) {
      console.error('Error configuring forwarding:', error);
      throw error;
    }
  }

  /**
   * Cancel a provisioned number
   */
  async cancelNumber(purchasedNumberId: string): Promise<void> {
    try {
      const { data: purchasedNumber } = await this.supabase
        .from('purchased_numbers')
        .select('didww_did_id')
        .eq('id', purchasedNumberId)
        .single() as any;

      const typedNumber = purchasedNumber as { didww_did_id: string | null } | null;

      if (typedNumber?.didww_did_id) {
        if (this.useMock) {
          await (this.didwwService as MockDIDWWService).cancelNumber(typedNumber.didww_did_id);
        } else {
          // Real DIDWW cancellation would go here
          console.log('Cancelling DID:', typedNumber.didww_did_id);
        }
      }

      const cancelUpdateData: PurchasedNumberUpdate = {
        provisioning_status: 'cancelled',
        is_active: false
      };
      
      await (this.supabase
        .from('purchased_numbers') as any)
        .update(cancelUpdateData)
        .eq('id', purchasedNumberId);
    } catch (error) {
      console.error('Error cancelling number:', error);
      throw error;
    }
  }

  /**
   * Suspend a provisioned number
   */
  async suspendNumber(purchasedNumberId: string): Promise<void> {
    try {
      const { data: purchasedNumber } = await this.supabase
        .from('purchased_numbers')
        .select('didww_did_id')
        .eq('id', purchasedNumberId)
        .single() as any;

      const typedNumber = purchasedNumber as { didww_did_id: string | null } | null;

      if (typedNumber?.didww_did_id) {
        if (this.useMock) {
          await (this.didwwService as MockDIDWWService).suspendNumber(typedNumber.didww_did_id);
        } else {
          // Real DIDWW suspension would go here
          console.log('Suspending DID:', typedNumber.didww_did_id);
        }
      }

      const suspendUpdateData: PurchasedNumberUpdate = {
        provisioning_status: 'suspended',
        is_active: false
      };
      
      await (this.supabase
        .from('purchased_numbers') as any)
        .update(suspendUpdateData)
        .eq('id', purchasedNumberId);
    } catch (error) {
      console.error('Error suspending number:', error);
      throw error;
    }
  }

  /**
   * Reactivate a suspended number
   */
  async reactivateNumber(purchasedNumberId: string): Promise<void> {
    try {
      const { data: purchasedNumber } = await this.supabase
        .from('purchased_numbers')
        .select('didww_did_id')
        .eq('id', purchasedNumberId)
        .single() as any;

      const typedNumber = purchasedNumber as { didww_did_id: string | null } | null;

      if (typedNumber?.didww_did_id) {
        if (this.useMock) {
          await (this.didwwService as MockDIDWWService).reactivateNumber(typedNumber.didww_did_id);
        } else {
          // Real DIDWW reactivation would go here
          console.log('Reactivating DID:', typedNumber.didww_did_id);
        }
      }

      const reactivateUpdateData: PurchasedNumberUpdate = {
        provisioning_status: 'active',
        is_active: true
      };
      
      await (this.supabase
        .from('purchased_numbers') as any)
        .update(reactivateUpdateData)
        .eq('id', purchasedNumberId);
    } catch (error) {
      console.error('Error reactivating number:', error);
      throw error;
    }
  }

  /**
   * Add a provisioning job to the queue
   */
  async queueProvisioning(
    purchasedNumberId: string,
    action: 'provision' | 'update_forwarding' | 'cancel' | 'suspend' | 'reactivate' = 'provision',
    priority: number = 5,
    metadata?: any
  ): Promise<void> {
    await (this.supabase
      .from('provisioning_queue') as any)
      .insert({
        purchased_number_id: purchasedNumberId,
        action,
        priority,
        metadata
      });
  }

  /**
   * Process pending provisioning jobs
   */
  async processProvisioningQueue(limit: number = 10): Promise<void> {
    // Get pending jobs
    const { data: jobs } = await this.supabase
      .from('provisioning_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(limit) as any;

    const typedJobs = jobs as ProvisioningQueue[] | null;

    if (!typedJobs || typedJobs.length === 0) {
      return;
    }

    // Process each job
    for (const job of typedJobs) {
      await this.processProvisioningJob(job);
    }
  }

  /**
   * Process a single provisioning job
   */
  private async processProvisioningJob(job: ProvisioningQueue): Promise<void> {
    try {
      // Mark job as processing
      const processingUpdate: ProvisioningQueueUpdate = {
        status: 'processing',
        attempts: job.attempts + 1
      };
      
      await (this.supabase
        .from('provisioning_queue') as any)
        .update(processingUpdate)
        .eq('id', job.id);

      // Execute the action
      switch (job.action) {
        case 'provision':
          await this.provisionNumber(job.purchased_number_id, (job.metadata as any)?.config, job.attempts);
          break;
        case 'update_forwarding':
          const { data: number } = await this.supabase
            .from('purchased_numbers')
            .select('didww_did_id')
            .eq('id', job.purchased_number_id)
            .single() as any;
          
          const typedNum = number as { didww_did_id: string | null } | null;
          
          if (typedNum?.didww_did_id) {
            await this.configureForwarding(
              job.purchased_number_id,
              typedNum.didww_did_id,
              (job.metadata as any)?.config
            );
          }
          break;
        case 'cancel':
          await this.cancelNumber(job.purchased_number_id);
          break;
        case 'suspend':
          await this.suspendNumber(job.purchased_number_id);
          break;
        case 'reactivate':
          await this.reactivateNumber(job.purchased_number_id);
          break;
      }

      // Mark job as completed
      const completedUpdate: ProvisioningQueueUpdate = {
        status: 'completed',
        processed_at: new Date().toISOString()
      };
      
      await (this.supabase
        .from('provisioning_queue') as any)
        .update(completedUpdate)
        .eq('id', job.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Mark job as failed
      const failedUpdate: ProvisioningQueueUpdate = {
        status: job.attempts >= job.max_attempts ? 'failed' : 'pending',
        error_message: errorMessage,
        scheduled_for: job.attempts < job.max_attempts
          ? new Date(Date.now() + Math.pow(2, job.attempts) * 60000).toISOString() // Exponential backoff
          : undefined
      };
      
      await (this.supabase
        .from('provisioning_queue') as any)
        .update(failedUpdate)
        .eq('id', job.id);
    }
  }

  /**
   * Helper: Update provisioning status
   */
  private async updateProvisioningStatus(
    purchasedNumberId: string,
    status: ProvisioningStatus,
    attempts: number,
    error?: string
  ): Promise<void> {
    const statusUpdate: PurchasedNumberUpdate = {
      provisioning_status: status,
      provisioning_attempts: attempts,
      last_provision_error: error || null
    };
    
    await (this.supabase
      .from('purchased_numbers') as any)
      .update(statusUpdate)
      .eq('id', purchasedNumberId);
  }

  /**
   * Helper: Call provision API (mock or real)
   */
  private async callProvisionAPI(
    phoneNumber: string,
    countryCode: string,
    areaCode: string
  ): Promise<{ didId: string; orderId: string }> {
    if (this.useMock) {
      return await (this.didwwService as MockDIDWWService).provisionNumber(
        phoneNumber,
        countryCode,
        areaCode
      );
    } else {
      // Real DIDWW provisioning would go here
      // For now, return mock data
      console.log('Would provision with real DIDWW API:', { phoneNumber, countryCode, areaCode });
      return {
        didId: `real_did_${Date.now()}`,
        orderId: `real_order_${Date.now()}`
      };
    }
  }

  /**
   * Helper: Mark provisioning as complete in queue
   */
  private async markProvisioningComplete(purchasedNumberId: string): Promise<void> {
    const completeUpdate: ProvisioningQueueUpdate = {
      status: 'completed',
      processed_at: new Date().toISOString()
    };
    
    await (this.supabase
      .from('provisioning_queue') as any)
      .update(completeUpdate)
      .eq('purchased_number_id', purchasedNumberId)
      .eq('action', 'provision')
      .eq('status', 'processing');
  }

  /**
   * Helper: Schedule a retry
   */
  private async scheduleRetry(purchasedNumberId: string, retryCount: number): Promise<void> {
    const delayMinutes = Math.pow(2, retryCount); // Exponential backoff: 2, 4, 8 minutes
    const scheduledFor = new Date(Date.now() + delayMinutes * 60000);

    await (this.supabase
      .from('provisioning_queue') as any)
      .insert({
        purchased_number_id: purchasedNumberId,
        action: 'provision',
        priority: 10, // Higher priority for retries
        attempts: retryCount,
        scheduled_for: scheduledFor.toISOString(),
        metadata: { isRetry: true, previousAttempts: retryCount }
      });
  }
}

// Export singleton instance for easy use
export const provisioningService = new ProvisioningService();