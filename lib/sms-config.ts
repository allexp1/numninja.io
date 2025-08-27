import { supabase } from './supabase'
import type {
  SmsConfiguration,
  SmsConfigurationInsert,
  SmsConfigurationUpdate,
  SmsFilterRule,
  SmsFilterRuleInsert,
  SmsFilterRuleUpdate,
  SMSRecord,
  SMSRecordInsert,
  SmsForwardingLog,
  SmsForwardingLogInsert,
  SmsAutoReplyLog,
  SmsAutoReplyLogInsert,
  PurchasedNumber,
} from './database.types'

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export class SmsConfigurationService {
  /**
   * Validate email address format
   */
  static validateEmail(email: string): boolean {
    return EMAIL_REGEX.test(email)
  }

  /**
   * Validate multiple email addresses
   */
  static validateEmails(emails: string[]): { valid: boolean; invalidEmails: string[] } {
    const invalidEmails = emails.filter(email => !this.validateEmail(email))
    return {
      valid: invalidEmails.length === 0,
      invalidEmails,
    }
  }

  /**
   * Get SMS configuration for a purchased number
   */
  static async getConfiguration(purchasedNumberId: string): Promise<SmsConfiguration | null> {
    const { data, error } = await supabase
      .from('sms_configurations')
      .select('*')
      .eq('purchased_number_id', purchasedNumberId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching SMS configuration:', error)
      throw error
    }

    return data
  }

  /**
   * Get SMS configuration with filter rules
   */
  static async getConfigurationWithRules(purchasedNumberId: string) {
    const { data: config, error: configError } = await supabase
      .from('sms_configurations')
      .select('*')
      .eq('purchased_number_id', purchasedNumberId)
      .single() as any

    if (configError && configError.code !== 'PGRST116') {
      console.error('Error fetching SMS configuration:', configError)
      throw configError
    }

    if (!config) return null

    const typedConfig = config as SmsConfiguration

    const { data: rules, error: rulesError } = await supabase
      .from('sms_filter_rules')
      .select('*')
      .eq('sms_configuration_id', typedConfig.id)
      .order('priority', { ascending: true })

    if (rulesError) {
      console.error('Error fetching SMS filter rules:', rulesError)
      throw rulesError
    }

    return {
      ...typedConfig,
      filter_rules: rules || [],
    }
  }

  /**
   * Create or update SMS configuration
   */
  static async upsertConfiguration(
    purchasedNumberId: string,
    config: Omit<SmsConfigurationInsert, 'purchased_number_id'>
  ): Promise<SmsConfiguration> {
    // Validate emails if provided
    if (config.forward_to_emails && config.forward_to_emails.length > 0) {
      const validation = this.validateEmails(config.forward_to_emails)
      if (!validation.valid) {
        throw new Error(`Invalid email addresses: ${validation.invalidEmails.join(', ')}`)
      }
    }

    const { data, error } = await supabase
      .from('sms_configurations')
      .upsert({
        ...config,
        purchased_number_id: purchasedNumberId,
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error upserting SMS configuration:', error)
      throw error
    }

    return data
  }

  /**
   * Update SMS configuration
   */
  static async updateConfiguration(
    configId: string,
    updates: SmsConfigurationUpdate
  ): Promise<SmsConfiguration> {
    // Validate emails if provided
    if (updates.forward_to_emails && updates.forward_to_emails.length > 0) {
      const validation = this.validateEmails(updates.forward_to_emails)
      if (!validation.valid) {
        throw new Error(`Invalid email addresses: ${validation.invalidEmails.join(', ')}`)
      }
    }

    const { data, error } = await supabase
      .from('sms_configurations')
      .update(updates)
      .eq('id', configId)
      .select()
      .single() as any

    if (error) {
      console.error('Error updating SMS configuration:', error)
      throw error
    }

    return data
  }

  /**
   * Add email recipient to configuration
   */
  static async addEmailRecipient(configId: string, email: string): Promise<SmsConfiguration> {
    if (!this.validateEmail(email)) {
      throw new Error(`Invalid email address: ${email}`)
    }

    const { data: config, error: fetchError } = await supabase
      .from('sms_configurations')
      .select('forward_to_emails')
      .eq('id', configId)
      .single() as any

    if (fetchError) {
      console.error('Error fetching configuration:', fetchError)
      throw fetchError
    }

    const typedConfig = config as Pick<SmsConfiguration, 'forward_to_emails'>
    const emails = typedConfig.forward_to_emails || []
    if (!emails.includes(email)) {
      emails.push(email)

      const { data, error } = await (supabase
        .from('sms_configurations') as any)
        .update({ forward_to_emails: emails })
        .eq('id', configId)
        .select()
        .single()

      if (error) {
        console.error('Error adding email recipient:', error)
        throw error
      }

      return data
    }

    return typedConfig as SmsConfiguration
  }

  /**
   * Remove email recipient from configuration
   */
  static async removeEmailRecipient(configId: string, email: string): Promise<SmsConfiguration> {
    const { data: config, error: fetchError } = await supabase
      .from('sms_configurations')
      .select('forward_to_emails')
      .eq('id', configId)
      .single() as any

    if (fetchError) {
      console.error('Error fetching configuration:', fetchError)
      throw fetchError
    }

    const typedConfig = config as Pick<SmsConfiguration, 'forward_to_emails'>
    const emails = (typedConfig.forward_to_emails || []).filter((e: string) => e !== email)

    const { data, error } = await (supabase
      .from('sms_configurations') as any)
      .update({ forward_to_emails: emails })
      .eq('id', configId)
      .select()
      .single()

    if (error) {
      console.error('Error removing email recipient:', error)
      throw error
    }

    return data
  }

  /**
   * Create SMS filter rule
   */
  static async createFilterRule(rule: SmsFilterRuleInsert): Promise<SmsFilterRule> {
    const { data, error } = await supabase
      .from('sms_filter_rules')
      .insert(rule as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating filter rule:', error)
      throw error
    }

    return data
  }

  /**
   * Update SMS filter rule
   */
  static async updateFilterRule(
    ruleId: string,
    updates: SmsFilterRuleUpdate
  ): Promise<SmsFilterRule> {
    const { data, error } = await (supabase
      .from('sms_filter_rules') as any)
      .update(updates)
      .eq('id', ruleId)
      .select()
      .single()

    if (error) {
      console.error('Error updating filter rule:', error)
      throw error
    }

    return data
  }

  /**
   * Delete SMS filter rule
   */
  static async deleteFilterRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('sms_filter_rules')
      .delete()
      .eq('id', ruleId)

    if (error) {
      console.error('Error deleting filter rule:', error)
      throw error
    }
  }

  /**
   * Get filter rules for a configuration
   */
  static async getFilterRules(configId: string): Promise<SmsFilterRule[]> {
    const { data, error } = await supabase
      .from('sms_filter_rules')
      .select('*')
      .eq('sms_configuration_id', configId)
      .order('priority', { ascending: true })

    if (error) {
      console.error('Error fetching filter rules:', error)
      throw error
    }

    return data || []
  }

  /**
   * Apply filter rules to an SMS message
   */
  static async applyFilters(
    configId: string,
    sms: { from_number: string; message: string }
  ): Promise<{ action: 'forward' | 'block' | 'auto_reply'; matchedRule?: SmsFilterRule }> {
    const rules = await this.getFilterRules(configId)
    const enabledRules = rules.filter(r => r.enabled)

    for (const rule of enabledRules) {
      let matched = false

      switch (rule.rule_type) {
        case 'keyword':
          // Check if message contains the keyword (case-insensitive)
          matched = sms.message.toLowerCase().includes(rule.pattern.toLowerCase())
          break

        case 'sender':
          // Check if sender matches the pattern
          matched = sms.from_number.includes(rule.pattern) || 
                   rule.pattern === sms.from_number
          break

        case 'blacklist':
          // Check if sender is in blacklist
          matched = sms.from_number === rule.pattern
          break
      }

      if (matched) {
        return { action: rule.action, matchedRule: rule }
      }
    }

    // Default action if no rules match
    return { action: 'forward' }
  }

  /**
   * Send test SMS (mock implementation)
   */
  static async sendTestSms(
    purchasedNumber: PurchasedNumber,
    testMessage?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Create a mock SMS record
      const mockSms: SMSRecordInsert = {
        purchased_number_id: purchasedNumber.id,
        direction: 'inbound',
        from_number: '+1234567890',
        to_number: purchasedNumber.phone_number,
        message: testMessage || `Test SMS received at ${new Date().toISOString()}`,
        delivered: true,
        delivered_at: new Date().toISOString(),
      }

      const { data: smsRecord, error: smsError } = await supabase
        .from('sms_records')
        .insert(mockSms as any)
        .select()
        .single() as any

      if (smsError) {
        throw smsError
      }

      // Get SMS configuration
      const config = await this.getConfiguration(purchasedNumber.id)

      if (!config || !config.enabled) {
        return {
          success: true,
          message: 'Test SMS created but forwarding is not enabled',
        }
      }

      // Process forwarding
      const typedSmsRecord = smsRecord as SMSRecord
      const emails = config.forward_to_emails || []
      const forwardingLogs: SmsForwardingLogInsert[] = emails.map(email => ({
        sms_record_id: typedSmsRecord.id,
        email_recipient: email,
        status: 'sent',
        sent_at: new Date().toISOString(),
      }))

      if (forwardingLogs.length > 0) {
        await supabase
          .from('sms_forwarding_logs')
          .insert(forwardingLogs as any)
      }

      // Process auto-reply if enabled
      if (config.auto_reply_enabled && config.auto_reply_message) {
        const autoReplyLog: SmsAutoReplyLogInsert = {
          sms_record_id: typedSmsRecord.id,
          reply_message: config.auto_reply_message,
          status: 'sent',
          sent_at: new Date().toISOString(),
        }

        await supabase
          .from('sms_auto_reply_logs')
          .insert(autoReplyLog as any)
      }

      return {
        success: true,
        message: `Test SMS sent successfully. Forwarded to ${emails.length} recipient(s)${
          config.auto_reply_enabled ? ' with auto-reply' : ''
        }`,
      }
    } catch (error) {
      console.error('Error sending test SMS:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send test SMS',
      }
    }
  }

  /**
   * Process incoming SMS (webhook handler)
   */
  static async processIncomingSms(
    purchasedNumberId: string,
    sms: {
      from_number: string
      to_number: string
      message: string
      didww_sms_id?: string
    }
  ): Promise<void> {
    // Save SMS record
    const { data: smsRecord, error: smsError } = await supabase
      .from('sms_records')
      .insert({
        purchased_number_id: purchasedNumberId,
        didww_sms_id: sms.didww_sms_id,
        direction: 'inbound',
        from_number: sms.from_number,
        to_number: sms.to_number,
        message: sms.message,
        delivered: true,
        delivered_at: new Date().toISOString(),
      } as any)
      .select()
      .single() as any

    if (smsError) {
      console.error('Error saving SMS record:', smsError)
      throw smsError
    }

    const typedSmsRecord = smsRecord as SMSRecord
    
    // Get SMS configuration
    const config = await this.getConfigurationWithRules(purchasedNumberId)

    if (!config || !config.enabled) {
      console.log('SMS forwarding not enabled for this number')
      return
    }

    // Apply filters
    let shouldForward = true
    let shouldAutoReply = false

    if (config.filter_enabled && config.filter_rules) {
      const filterResult = await this.applyFilters(config.id, {
        from_number: sms.from_number,
        message: sms.message,
      })

      switch (filterResult.action) {
        case 'block':
          shouldForward = false
          break
        case 'auto_reply':
          shouldAutoReply = true
          break
        case 'forward':
        default:
          shouldForward = true
      }
    }

    // Forward to emails if allowed
    if (shouldForward && config.forward_to_emails && config.forward_to_emails.length > 0) {
      const forwardingLogs: SmsForwardingLogInsert[] = config.forward_to_emails.map(email => ({
        sms_record_id: typedSmsRecord.id,
        email_recipient: email,
        status: 'pending',
      }))

      await supabase
        .from('sms_forwarding_logs')
        .insert(forwardingLogs as any)

      // In a real implementation, this would trigger email sending
      // For now, we'll just mark them as sent
      await (supabase
        .from('sms_forwarding_logs') as any)
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('sms_record_id', typedSmsRecord.id)
    }

    // Send auto-reply if configured
    if ((shouldAutoReply || config.auto_reply_enabled) && config.auto_reply_message) {
      const autoReplyLog: SmsAutoReplyLogInsert = {
        sms_record_id: typedSmsRecord.id,
        reply_message: config.auto_reply_message,
        status: 'pending',
      }

      const { data: replyLog } = await supabase
        .from('sms_auto_reply_logs')
        .insert(autoReplyLog as any)
        .select()
        .single() as any

      // In a real implementation, this would trigger SMS sending via DIDWW
      // For now, we'll just mark it as sent
      if (replyLog) {
        const typedReplyLog = replyLog as SmsAutoReplyLog
        await (supabase
          .from('sms_auto_reply_logs') as any)
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', typedReplyLog.id)
      }
    }
  }

  /**
   * Get SMS history for a purchased number
   */
  static async getSmsHistory(
    purchasedNumberId: string,
    options?: {
      startDate?: string
      endDate?: string
      sender?: string
      search?: string
      limit?: number
      offset?: number
    }
  ) {
    let query = supabase
      .from('sms_records')
      .select(`
        *,
        forwarding_logs:sms_forwarding_logs(*),
        auto_reply_logs:sms_auto_reply_logs(*)
      `)
      .eq('purchased_number_id', purchasedNumberId)
      .order('created_at', { ascending: false })

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate)
    }

    if (options?.endDate) {
      query = query.lte('created_at', options.endDate)
    }

    if (options?.sender) {
      query = query.eq('from_number', options.sender)
    }

    if (options?.search) {
      query = query.ilike('message', `%${options.search}%`)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching SMS history:', error)
      throw error
    }

    return data || []
  }

  /**
   * Resend failed SMS forwards
   */
  static async resendFailedForward(logId: string): Promise<SmsForwardingLog> {
    const { data, error } = await (supabase
      .from('sms_forwarding_logs') as any)
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', logId)
      .select()
      .single()

    if (error) {
      console.error('Error resending forward:', error)
      throw error
    }

    // In a real implementation, this would trigger the actual email sending
    
    return data
  }

  /**
   * Validate if a number can have SMS enabled (6-month minimum requirement)
   */
  static validateSmsEligibility(purchasedNumber: PurchasedNumber): {
    eligible: boolean
    reason?: string
  } {
    const purchaseDate = new Date(purchasedNumber.purchase_date)
    const sixMonthsLater = new Date(purchaseDate)
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6)
    
    const now = new Date()
    
    if (purchasedNumber.expiry_date) {
      const expiryDate = new Date(purchasedNumber.expiry_date)
      
      if (expiryDate < sixMonthsLater) {
        return {
          eligible: false,
          reason: 'SMS requires a minimum 6-month commitment. Please extend your number subscription.',
        }
      }
    }
    
    if (now < sixMonthsLater && !purchasedNumber.sms_enabled) {
      return {
        eligible: false,
        reason: `SMS can only be enabled for numbers with at least 6 months remaining. This number needs to be active until ${sixMonthsLater.toLocaleDateString()}.`,
      }
    }
    
    return { eligible: true }
  }
}

export default SmsConfigurationService