export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      countries: {
        Row: {
          id: string
          code: string
          name: string
          sms_capable: boolean
          documents_required: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          sms_capable?: boolean
          documents_required?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          sms_capable?: boolean
          documents_required?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      area_codes: {
        Row: {
          id: string
          country_id: string
          area_code: string
          city: string
          base_price: number
          sms_addon_price: number
          is_sms_capable: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          country_id: string
          area_code: string
          city: string
          base_price: number
          sms_addon_price?: number
          is_sms_capable?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          country_id?: string
          area_code?: string
          city?: string
          base_price?: number
          sms_addon_price?: number
          is_sms_capable?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      forwarding_prices: {
        Row: {
          id: string
          country_id: string
          mobile_price: number
          landline_price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          country_id: string
          mobile_price?: number
          landline_price?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          country_id?: string
          mobile_price?: number
          landline_price?: number
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          phone: string | null
          full_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          phone?: string | null
          full_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string | null
          full_address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      purchased_numbers: {
        Row: {
          id: string
          user_id: string
          country_id: string
          area_code_id: string
          phone_number: string
          display_name: string | null
          is_active: boolean
          sms_enabled: boolean
          purchase_date: string
          expiry_date: string | null
          created_at: string
          updated_at: string
          didww_did_id: string | null
          provisioning_status: 'pending' | 'provisioning' | 'active' | 'failed' | 'cancelled' | 'suspended'
          provisioning_attempts: number
          provisioned_at: string | null
          last_provision_error: string | null
          stripe_subscription_id: string | null
          stripe_session_id: string | null
          monthly_price: number | null
          setup_price: number | null
        }
        Insert: {
          id?: string
          user_id: string
          country_id: string
          area_code_id: string
          phone_number: string
          display_name?: string | null
          is_active?: boolean
          sms_enabled?: boolean
          purchase_date?: string
          expiry_date?: string | null
          created_at?: string
          updated_at?: string
          didww_did_id?: string | null
          provisioning_status?: 'pending' | 'provisioning' | 'active' | 'failed' | 'cancelled' | 'suspended'
          provisioning_attempts?: number
          provisioned_at?: string | null
          last_provision_error?: string | null
          stripe_subscription_id?: string | null
          stripe_session_id?: string | null
          monthly_price?: number | null
          setup_price?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          country_id?: string
          area_code_id?: string
          phone_number?: string
          display_name?: string | null
          is_active?: boolean
          sms_enabled?: boolean
          purchase_date?: string
          expiry_date?: string | null
          created_at?: string
          updated_at?: string
          didww_did_id?: string | null
          provisioning_status?: 'pending' | 'provisioning' | 'active' | 'failed' | 'cancelled' | 'suspended'
          provisioning_attempts?: number
          provisioned_at?: string | null
          last_provision_error?: string | null
          stripe_subscription_id?: string | null
          stripe_session_id?: string | null
          monthly_price?: number | null
          setup_price?: number | null
        }
      }
      number_configurations: {
        Row: {
          id: string
          purchased_number_id: string
          forwarding_type: 'mobile' | 'landline' | 'voip' | 'none'
          forwarding_number: string | null
          voicemail_enabled: boolean
          voicemail_email: string | null
          call_recording_enabled: boolean
          business_hours_enabled: boolean
          business_hours_start: string | null
          business_hours_end: string | null
          business_hours_timezone: string
          weekend_handling: 'forward' | 'voicemail' | 'reject'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          purchased_number_id: string
          forwarding_type?: 'mobile' | 'landline' | 'voip' | 'none'
          forwarding_number?: string | null
          voicemail_enabled?: boolean
          voicemail_email?: string | null
          call_recording_enabled?: boolean
          business_hours_enabled?: boolean
          business_hours_start?: string | null
          business_hours_end?: string | null
          business_hours_timezone?: string
          weekend_handling?: 'forward' | 'voicemail' | 'reject'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          purchased_number_id?: string
          forwarding_type?: 'mobile' | 'landline' | 'voip' | 'none'
          forwarding_number?: string | null
          voicemail_enabled?: boolean
          voicemail_email?: string | null
          call_recording_enabled?: boolean
          business_hours_enabled?: boolean
          business_hours_start?: string | null
          business_hours_end?: string | null
          business_hours_timezone?: string
          weekend_handling?: 'forward' | 'voicemail' | 'reject'
          created_at?: string
          updated_at?: string
        }
      }
      provisioning_queue: {
        Row: {
          id: string
          purchased_number_id: string
          action: 'provision' | 'update_forwarding' | 'cancel' | 'suspend' | 'reactivate'
          priority: number
          status: 'pending' | 'processing' | 'completed' | 'failed'
          attempts: number
          max_attempts: number
          scheduled_for: string
          processed_at: string | null
          error_message: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          purchased_number_id: string
          action: 'provision' | 'update_forwarding' | 'cancel' | 'suspend' | 'reactivate'
          priority?: number
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          attempts?: number
          max_attempts?: number
          scheduled_for?: string
          processed_at?: string | null
          error_message?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          purchased_number_id?: string
          action?: 'provision' | 'update_forwarding' | 'cancel' | 'suspend' | 'reactivate'
          priority?: number
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          attempts?: number
          max_attempts?: number
          scheduled_for?: string
          processed_at?: string | null
          error_message?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      call_detail_records: {
        Row: {
          id: string
          purchased_number_id: string
          didww_cdr_id: string | null
          direction: 'inbound' | 'outbound' | null
          from_number: string | null
          to_number: string | null
          duration_seconds: number | null
          answered: boolean
          start_time: string | null
          end_time: string | null
          cost: number | null
          currency: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          purchased_number_id: string
          didww_cdr_id?: string | null
          direction?: 'inbound' | 'outbound' | null
          from_number?: string | null
          to_number?: string | null
          duration_seconds?: number | null
          answered?: boolean
          start_time?: string | null
          end_time?: string | null
          cost?: number | null
          currency?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          purchased_number_id?: string
          didww_cdr_id?: string | null
          direction?: 'inbound' | 'outbound' | null
          from_number?: string | null
          to_number?: string | null
          duration_seconds?: number | null
          answered?: boolean
          start_time?: string | null
          end_time?: string | null
          cost?: number | null
          currency?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      sms_records: {
        Row: {
          id: string
          purchased_number_id: string
          didww_sms_id: string | null
          direction: 'inbound' | 'outbound' | null
          from_number: string | null
          to_number: string | null
          message: string | null
          delivered: boolean
          delivered_at: string | null
          cost: number | null
          currency: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          purchased_number_id: string
          didww_sms_id?: string | null
          direction?: 'inbound' | 'outbound' | null
          from_number?: string | null
          to_number?: string | null
          message?: string | null
          delivered?: boolean
          delivered_at?: string | null
          cost?: number | null
          currency?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          purchased_number_id?: string
          didww_sms_id?: string | null
          direction?: 'inbound' | 'outbound' | null
          from_number?: string | null
          to_number?: string | null
          message?: string | null
          delivered?: boolean
          delivered_at?: string | null
          cost?: number | null
          currency?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      number_usage_stats: {
        Row: {
          id: string
          purchased_number_id: string
          period_start: string
          period_end: string
          total_calls: number
          total_minutes: number
          total_sms: number
          total_cost: number
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          purchased_number_id: string
          period_start: string
          period_end: string
          total_calls?: number
          total_minutes?: number
          total_sms?: number
          total_cost?: number
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          purchased_number_id?: string
          period_start?: string
          period_end?: string
          total_calls?: number
          total_minutes?: number
          total_sms?: number
          total_cost?: number
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          stripe_session_id: string | null
          stripe_subscription_id: string | null
          total_amount: number | null
          currency: string | null
          status: string | null
          payment_status: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          total_amount?: number | null
          currency?: string | null
          status?: string | null
          payment_status?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          total_amount?: number | null
          currency?: string | null
          status?: string | null
          payment_status?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          stripe_invoice_id: string | null
          stripe_subscription_id: string | null
          amount: number | null
          currency: string | null
          status: string | null
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_invoice_id?: string | null
          stripe_subscription_id?: string | null
          amount?: number | null
          currency?: string | null
          status?: string | null
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_invoice_id?: string | null
          stripe_subscription_id?: string | null
          amount?: number | null
          currency?: string | null
          status?: string | null
          paid_at?: string | null
          created_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          country_id: string
          area_code_id: string
          phone_number: string | null
          monthly_price: number | null
          setup_price: number | null
          sms_enabled: boolean
          forwarding_type: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          country_id: string
          area_code_id: string
          phone_number?: string | null
          monthly_price?: number | null
          setup_price?: number | null
          sms_enabled?: boolean
          forwarding_type?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          country_id?: string
          area_code_id?: string
          phone_number?: string | null
          monthly_price?: number | null
          setup_price?: number | null
          sms_enabled?: boolean
          forwarding_type?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      sms_configurations: {
        Row: {
          id: string
          purchased_number_id: string
          enabled: boolean
          forward_to_emails: string[]
          auto_reply_enabled: boolean
          auto_reply_message: string | null
          filter_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          purchased_number_id: string
          enabled?: boolean
          forward_to_emails?: string[]
          auto_reply_enabled?: boolean
          auto_reply_message?: string | null
          filter_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          purchased_number_id?: string
          enabled?: boolean
          forward_to_emails?: string[]
          auto_reply_enabled?: boolean
          auto_reply_message?: string | null
          filter_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      sms_filter_rules: {
        Row: {
          id: string
          sms_configuration_id: string
          rule_type: 'keyword' | 'sender' | 'blacklist'
          pattern: string
          action: 'forward' | 'block' | 'auto_reply'
          priority: number
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sms_configuration_id: string
          rule_type: 'keyword' | 'sender' | 'blacklist'
          pattern: string
          action: 'forward' | 'block' | 'auto_reply'
          priority?: number
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sms_configuration_id?: string
          rule_type?: 'keyword' | 'sender' | 'blacklist'
          pattern?: string
          action?: 'forward' | 'block' | 'auto_reply'
          priority?: number
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      sms_forwarding_logs: {
        Row: {
          id: string
          sms_record_id: string
          email_recipient: string
          status: 'pending' | 'sent' | 'failed' | 'bounced'
          sent_at: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sms_record_id: string
          email_recipient: string
          status: 'pending' | 'sent' | 'failed' | 'bounced'
          sent_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sms_record_id?: string
          email_recipient?: string
          status?: 'pending' | 'sent' | 'failed' | 'bounced'
          sent_at?: string | null
          error_message?: string | null
          created_at?: string
        }
      }
      sms_auto_reply_logs: {
        Row: {
          id: string
          sms_record_id: string
          reply_message: string
          status: 'pending' | 'sent' | 'failed'
          sent_at: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sms_record_id: string
          reply_message: string
          status: 'pending' | 'sent' | 'failed'
          sent_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sms_record_id?: string
          reply_message?: string
          status?: 'pending' | 'sent' | 'failed'
          sent_at?: string | null
          error_message?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type aliases for easier use
export type Country = Database['public']['Tables']['countries']['Row']
export type AreaCode = Database['public']['Tables']['area_codes']['Row']
export type ForwardingPrice = Database['public']['Tables']['forwarding_prices']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type PurchasedNumber = Database['public']['Tables']['purchased_numbers']['Row']
export type NumberConfiguration = Database['public']['Tables']['number_configurations']['Row']
export type ProvisioningQueue = Database['public']['Tables']['provisioning_queue']['Row']
export type CallDetailRecord = Database['public']['Tables']['call_detail_records']['Row']
export type SMSRecord = Database['public']['Tables']['sms_records']['Row']
export type NumberUsageStats = Database['public']['Tables']['number_usage_stats']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type CartItem = Database['public']['Tables']['cart_items']['Row']
export type SmsConfiguration = Database['public']['Tables']['sms_configurations']['Row']
export type SmsFilterRule = Database['public']['Tables']['sms_filter_rules']['Row']
export type SmsForwardingLog = Database['public']['Tables']['sms_forwarding_logs']['Row']
export type SmsAutoReplyLog = Database['public']['Tables']['sms_auto_reply_logs']['Row']

// Insert types
export type CountryInsert = Database['public']['Tables']['countries']['Insert']
export type AreaCodeInsert = Database['public']['Tables']['area_codes']['Insert']
export type ForwardingPriceInsert = Database['public']['Tables']['forwarding_prices']['Insert']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type PurchasedNumberInsert = Database['public']['Tables']['purchased_numbers']['Insert']
export type NumberConfigurationInsert = Database['public']['Tables']['number_configurations']['Insert']
export type ProvisioningQueueInsert = Database['public']['Tables']['provisioning_queue']['Insert']
export type CallDetailRecordInsert = Database['public']['Tables']['call_detail_records']['Insert']
export type SMSRecordInsert = Database['public']['Tables']['sms_records']['Insert']
export type NumberUsageStatsInsert = Database['public']['Tables']['number_usage_stats']['Insert']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type CartItemInsert = Database['public']['Tables']['cart_items']['Insert']
export type SmsConfigurationInsert = Database['public']['Tables']['sms_configurations']['Insert']
export type SmsFilterRuleInsert = Database['public']['Tables']['sms_filter_rules']['Insert']
export type SmsForwardingLogInsert = Database['public']['Tables']['sms_forwarding_logs']['Insert']
export type SmsAutoReplyLogInsert = Database['public']['Tables']['sms_auto_reply_logs']['Insert']

// Update types
export type CountryUpdate = Database['public']['Tables']['countries']['Update']
export type AreaCodeUpdate = Database['public']['Tables']['area_codes']['Update']
export type ForwardingPriceUpdate = Database['public']['Tables']['forwarding_prices']['Update']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type PurchasedNumberUpdate = Database['public']['Tables']['purchased_numbers']['Update']
export type NumberConfigurationUpdate = Database['public']['Tables']['number_configurations']['Update']
export type ProvisioningQueueUpdate = Database['public']['Tables']['provisioning_queue']['Update']
export type CallDetailRecordUpdate = Database['public']['Tables']['call_detail_records']['Update']
export type SMSRecordUpdate = Database['public']['Tables']['sms_records']['Update']
export type NumberUsageStatsUpdate = Database['public']['Tables']['number_usage_stats']['Update']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']
export type PaymentUpdate = Database['public']['Tables']['payments']['Update']
export type CartItemUpdate = Database['public']['Tables']['cart_items']['Update']
export type SmsConfigurationUpdate = Database['public']['Tables']['sms_configurations']['Update']
export type SmsFilterRuleUpdate = Database['public']['Tables']['sms_filter_rules']['Update']
export type SmsForwardingLogUpdate = Database['public']['Tables']['sms_forwarding_logs']['Update']
export type SmsAutoReplyLogUpdate = Database['public']['Tables']['sms_auto_reply_logs']['Update']

// Enums
export type ForwardingType = 'mobile' | 'landline' | 'voip' | 'none'
export type WeekendHandling = 'forward' | 'voicemail' | 'reject'
export type ProvisioningStatus = 'pending' | 'provisioning' | 'active' | 'failed' | 'cancelled' | 'suspended'
export type ProvisioningAction = 'provision' | 'update_forwarding' | 'cancel' | 'suspend' | 'reactivate'
export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type CallDirection = 'inbound' | 'outbound'
export type SmsFilterRuleType = 'keyword' | 'sender' | 'blacklist'
export type SmsFilterAction = 'forward' | 'block' | 'auto_reply'
export type SmsForwardingStatus = 'pending' | 'sent' | 'failed' | 'bounced'
export type SmsAutoReplyStatus = 'pending' | 'sent' | 'failed'

// Extended user type (Supabase Auth User + custom fields)
export interface ExtendedUser {
  id: string
  email?: string
  phone?: string
  full_address?: string
  created_at: string
  updated_at?: string
}

// Helper types for relationships
export interface CountryWithAreaCodes extends Country {
  area_codes: AreaCode[]
}

export interface CountryWithForwardingPrices extends Country {
  forwarding_prices: ForwardingPrice
}

export interface PurchasedNumberWithConfiguration extends PurchasedNumber {
  number_configuration?: NumberConfiguration
  country: Country
  area_code: AreaCode
}

export interface PurchasedNumberWithUsage extends PurchasedNumber {
  number_configuration?: NumberConfiguration
  country: Country
  area_code: AreaCode
  usage_stats?: NumberUsageStats[]
  recent_calls?: CallDetailRecord[]
  recent_sms?: SMSRecord[]
}

export interface UserProfile extends Profile {
  purchased_numbers?: PurchasedNumber[]
}

export interface OrderWithItems extends Order {
  purchased_numbers?: PurchasedNumber[]
}

export interface SmsConfigurationWithRules extends SmsConfiguration {
  filter_rules?: SmsFilterRule[]
}

export interface PurchasedNumberWithSmsConfig extends PurchasedNumber {
  sms_configuration?: SmsConfiguration
  number_configuration?: NumberConfiguration
  country: Country
  area_code: AreaCode
}

export interface SMSRecordWithLogs extends SMSRecord {
  forwarding_logs?: SmsForwardingLog[]
  auto_reply_logs?: SmsAutoReplyLog[]
}