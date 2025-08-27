// DIDWW API Types - Following JSON:API specification

// Base JSON:API types
export interface JsonApiResource<T> {
  id: string;
  type: string;
  attributes: T;
  relationships?: Record<string, any>;
}

export interface JsonApiResponse<T> {
  data: JsonApiResource<T> | JsonApiResource<T>[];
  included?: JsonApiResource<any>[];
  meta?: Record<string, any>;
  links?: {
    self?: string;
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
}

export interface JsonApiError {
  id?: string;
  status?: string;
  code?: string;
  title?: string;
  detail?: string;
  source?: {
    pointer?: string;
    parameter?: string;
  };
}

export interface JsonApiErrorResponse {
  errors: JsonApiError[];
}

// DIDWW specific types

// Available Numbers
export interface AvailableNumber {
  number: string;
  is_available: boolean;
  setup_price: string;
  monthly_price: string;
  area_name: string;
  country_iso: string;
  features: string[];
  restrictions: string[];
}

// Country
export interface Country {
  name: string;
  prefix: string;
  iso: string;
  local_prefix: string;
  requires_registration: boolean;
  supports_sms: boolean;
}

// Area Code
export interface AreaCode {
  name: string;
  code: string;
  country_iso: string;
  area_type: 'Local' | 'National' | 'Mobile' | 'Toll-Free';
}

// DID (Phone Number)
export interface DID {
  number: string;
  description: string;
  capacity_limit: number;
  blocked: boolean;
  awaiting_registration: boolean;
  created_at: string;
  expire_at: string;
  terminated: boolean;
  billing_cycles_count: number;
}

// SMS Configuration
export interface SMSConfiguration {
  enabled: boolean;
  url?: string;
  method?: 'GET' | 'POST';
  max_characters?: number;
}

// Voice Configuration
export interface VoiceConfiguration {
  sip_configuration?: {
    username: string;
    host: string;
    port: number;
    transport: 'UDP' | 'TCP' | 'TLS';
    codec_ids: string[];
  };
  pstn_configuration?: {
    number: string;
  };
}

// Call Detail Record
export interface CallDetailRecord {
  direction: 'inbound' | 'outbound';
  initiated_at: string;
  answered_at: string | null;
  finished_at: string;
  duration: number;
  from: string;
  to: string;
  rate: string;
  price: string;
  billed_duration: number;
}

// Order (for provisioning)
export interface Order {
  reference: string;
  amount: string;
  status: 'Pending' | 'Completed' | 'Canceled';
  description: string;
  created_at: string;
  items_count: number;
}

// Request types
export interface GetAvailableNumbersParams {
  country_code: string;
  area_code?: string;
  contains?: string;
  limit?: number;
}

export interface GetAreaCodesParams {
  country_code: string;
}

export interface ProvisionNumberConfig {
  capacity_limit?: number;
  description?: string;
  billing_cycles_count?: number;
  voice_configuration?: VoiceConfiguration;
  sms_configuration?: SMSConfiguration;
}

export interface GetCallDetailRecordsParams {
  did_id: string;
  from_date?: string;
  to_date?: string;
  direction?: 'inbound' | 'outbound';
  limit?: number;
  page?: number;
}

export interface ConfigureSMSForwardingParams {
  did_id: string;
  email: string;
  enabled?: boolean;
}

export interface ConfigureVoiceForwardingParams {
  did_id: string;
  destination: string;
  type: 'sip' | 'pstn';
  codec_ids?: string[];
  transport?: 'UDP' | 'TCP' | 'TLS';
}

// Custom error types
export class DIDWWAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: JsonApiError[]
  ) {
    super(message);
    this.name = 'DIDWWAPIError';
  }
}

export class DIDWWAuthenticationError extends DIDWWAPIError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'DIDWWAuthenticationError';
  }
}

export class DIDWWValidationError extends DIDWWAPIError {
  constructor(message: string, errors?: JsonApiError[]) {
    super(message, 422, errors);
    this.name = 'DIDWWValidationError';
  }
}

export class DIDWWRateLimitError extends DIDWWAPIError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429);
    this.name = 'DIDWWRateLimitError';
  }
}