import {
  JsonApiResponse,
  JsonApiErrorResponse,
  JsonApiResource,
  AvailableNumber,
  Country,
  AreaCode,
  DID,
  CallDetailRecord,
  Order,
  GetAvailableNumbersParams,
  GetAreaCodesParams,
  ProvisionNumberConfig,
  GetCallDetailRecordsParams,
  ConfigureSMSForwardingParams,
  ConfigureVoiceForwardingParams,
  DIDWWAPIError,
  DIDWWAuthenticationError,
  DIDWWValidationError,
  DIDWWRateLimitError,
} from './didww.types';

// DIDWW API Service Wrapper
export class DIDWWService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    // Allow passing API key directly or from environment
    this.apiKey = apiKey || process.env.DIDWW_API_KEY || '';
    this.baseUrl = baseUrl || process.env.DIDWW_API_URL || 'https://api.didww.com/v3';
  }

  // Validate API key is present before making requests
  private validateApiKey(): void {
    if (!this.apiKey) {
      throw new Error('DIDWW_API_KEY is required. Set it in environment variables or pass it to the constructor.');
    }
  }

  // Helper method for making authenticated requests
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<JsonApiResponse<T>> {
    this.validateApiKey();
    
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Api-Key': this.apiKey,
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      // Handle authentication errors
      if (response.status === 401) {
        throw new DIDWWAuthenticationError();
      }

      // Handle rate limiting
      if (response.status === 429) {
        throw new DIDWWRateLimitError();
      }

      // Handle validation errors
      if (response.status === 422) {
        const errorData = await response.json() as JsonApiErrorResponse;
        throw new DIDWWValidationError('Validation failed', errorData.errors);
      }

      // Handle other errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errors = errorData?.errors || [];
        throw new DIDWWAPIError(
          `API request failed: ${response.statusText}`,
          response.status,
          errors
        );
      }

      return await response.json() as JsonApiResponse<T>;
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof DIDWWAPIError) {
        throw error;
      }
      
      // Wrap other errors
      throw new DIDWWAPIError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  /**
   * Get available phone numbers for a specific country and optional area code
   */
  async getAvailableNumbers(
    countryCode: string,
    areaCode?: string
  ): Promise<AvailableNumber[]> {
    const params = new URLSearchParams({
      'filter[countries.iso]': countryCode,
      ...(areaCode && { 'filter[area_codes.area_code]': areaCode }),
      'include': 'area,country',
      'page[size]': '100',
    });

    const response = await this.makeRequest<AvailableNumber>(
      `/available_dids?${params.toString()}`
    );

    if (Array.isArray(response.data)) {
      return response.data.map(item => item.attributes);
    }

    return [];
  }

  /**
   * Get list of countries that don't require documents
   */
  async getCountriesWithoutDocuments(): Promise<Country[]> {
    const params = new URLSearchParams({
      'filter[features]': 'did_accessible',
      'filter[requires_registration]': 'false',
      'page[size]': '200',
    });

    const response = await this.makeRequest<Country>(
      `/countries?${params.toString()}`
    );

    if (Array.isArray(response.data)) {
      return response.data.map(item => item.attributes);
    }

    return [];
  }

  /**
   * Get all area codes for a specific country
   */
  async getAreaCodesForCountry(countryCode: string): Promise<AreaCode[]> {
    const params = new URLSearchParams({
      'filter[countries.iso]': countryCode,
      'page[size]': '500',
    });

    const response = await this.makeRequest<AreaCode>(
      `/regions?${params.toString()}`
    );

    if (Array.isArray(response.data)) {
      return response.data.map(item => item.attributes);
    }

    return [];
  }

  /**
   * Check if a specific DID number supports SMS
   */
  async checkSMSCapability(didId: string): Promise<boolean> {
    try {
      const response = await this.makeRequest<DID>(
        `/dids/${didId}?include=sms_configuration`
      );

      if (!Array.isArray(response.data)) {
        // Check if SMS is mentioned in capabilities or features
        const did = response.data;
        const relationships = did.relationships;
        
        if (relationships?.sms_configuration?.data) {
          return true;
        }

        // Check in included resources
        if (response.included) {
          const smsConfig = response.included.find(
            item => item.type === 'sms_configurations' && 
                    item.id === relationships?.sms_configuration?.data?.id
          );
          return !!smsConfig;
        }
      }

      return false;
    } catch (error) {
      // If we get a 404, the DID doesn't exist
      if (error instanceof DIDWWAPIError && error.statusCode === 404) {
        throw new DIDWWAPIError(`DID ${didId} not found`, 404);
      }
      throw error;
    }
  }

  /**
   * Provision (purchase) a new phone number
   */
  async provisionNumber(
    availableDidId: string,
    configuration?: ProvisionNumberConfig
  ): Promise<{ order: Order; did: DID }> {
    // First, create an order
    const orderData = {
      data: {
        type: 'orders',
        attributes: {
          reference: `order-${Date.now()}`,
          items: [
            {
              type: 'did_order_items',
              attributes: {
                available_did_id: availableDidId,
                ...configuration,
              },
            },
          ],
        },
      },
    };

    const orderResponse = await this.makeRequest<Order>(
      '/orders',
      {
        method: 'POST',
        body: JSON.stringify(orderData),
      }
    );

    if (Array.isArray(orderResponse.data)) {
      throw new DIDWWAPIError('Unexpected response format');
    }

    const order = orderResponse.data.attributes;

    // Get the provisioned DID from the order
    const didsResponse = await this.makeRequest<DID>(
      `/dids?filter[order_id]=${orderResponse.data.id}&page[size]=1`
    );

    if (!Array.isArray(didsResponse.data) || didsResponse.data.length === 0) {
      throw new DIDWWAPIError('DID not found after provisioning');
    }

    const did = didsResponse.data[0].attributes;

    return { order, did };
  }

  /**
   * Get call detail records for a specific DID
   */
  async getCallDetailRecords(
    didId: string,
    params?: {
      fromDate?: Date;
      toDate?: Date;
      direction?: 'inbound' | 'outbound';
      limit?: number;
      page?: number;
    }
  ): Promise<{ records: CallDetailRecord[]; totalCount: number }> {
    const queryParams = new URLSearchParams({
      'filter[did_id]': didId,
      ...(params?.fromDate && {
        'filter[created_at][from]': params.fromDate.toISOString(),
      }),
      ...(params?.toDate && {
        'filter[created_at][to]': params.toDate.toISOString(),
      }),
      ...(params?.direction && {
        'filter[direction]': params.direction,
      }),
      'page[size]': String(params?.limit || 100),
      'page[number]': String(params?.page || 1),
    });

    const response = await this.makeRequest<CallDetailRecord>(
      `/cdr_exports?${queryParams.toString()}`
    );

    const records = Array.isArray(response.data)
      ? response.data.map(item => item.attributes)
      : [];

    const totalCount = response.meta?.total_records || records.length;

    return { records, totalCount };
  }

  /**
   * Configure SMS to email forwarding for a DID
   */
  async configureSMSForwarding(
    didId: string,
    email: string,
    enabled: boolean = true
  ): Promise<void> {
    // First, check if SMS configuration exists
    const didResponse = await this.makeRequest<DID>(
      `/dids/${didId}?include=sms_configuration`
    );

    if (Array.isArray(didResponse.data)) {
      throw new DIDWWAPIError('Unexpected response format');
    }

    const smsConfigId = didResponse.data.relationships?.sms_configuration?.data?.id;

    const smsConfigData = {
      data: {
        type: 'sms_configurations',
        attributes: {
          enabled,
          url: `mailto:${email}`,
          method: 'POST',
          max_characters: 160,
        },
      },
    };

    if (smsConfigId) {
      // Update existing configuration
      await this.makeRequest(
        `/sms_configurations/${smsConfigId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(smsConfigData),
        }
      );
    } else {
      // Create new configuration
      const smsConfigResponse = await this.makeRequest(
        '/sms_configurations',
        {
          method: 'POST',
          body: JSON.stringify(smsConfigData),
        }
      );

      // Associate with DID
      const didUpdateData = {
        data: {
          type: 'dids',
          id: didId,
          relationships: {
            sms_configuration: {
              data: {
                type: 'sms_configurations',
                id: (smsConfigResponse as any).data.id,
              },
            },
          },
        },
      };

      await this.makeRequest(
        `/dids/${didId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(didUpdateData),
        }
      );
    }
  }

  /**
   * Configure voice forwarding for a DID
   */
  async configureVoiceForwarding(
    didId: string,
    destination: string,
    type: 'sip' | 'pstn',
    options?: {
      codecIds?: string[];
      transport?: 'UDP' | 'TCP' | 'TLS';
    }
  ): Promise<void> {
    const configData: any = {
      data: {
        type: 'voice_in_trunks',
        attributes: {},
      },
    };

    if (type === 'sip') {
      // Parse SIP URI
      const sipMatch = destination.match(/sip:(.+)@(.+):?(\d+)?/);
      if (!sipMatch) {
        throw new DIDWWValidationError('Invalid SIP URI format. Expected: sip:username@host:port');
      }

      configData.data.attributes = {
        configuration_type: 'sip_configuration',
        configuration: {
          username: sipMatch[1],
          host: sipMatch[2],
          port: parseInt(sipMatch[3] || '5060'),
          transport: options?.transport || 'UDP',
          codec_ids: options?.codecIds || ['PCMU', 'PCMA', 'G729'],
        },
      };
    } else {
      // PSTN forwarding
      configData.data.attributes = {
        configuration_type: 'pstn_configuration',
        configuration: {
          dst_number: destination.replace(/\D/g, ''), // Remove non-digits
        },
      };
    }

    // First, check if voice configuration exists
    const didResponse = await this.makeRequest<DID>(
      `/dids/${didId}?include=voice_in_trunk`
    );

    if (Array.isArray(didResponse.data)) {
      throw new DIDWWAPIError('Unexpected response format');
    }

    const voiceConfigId = didResponse.data.relationships?.voice_in_trunk?.data?.id;

    if (voiceConfigId) {
      // Update existing configuration
      await this.makeRequest(
        `/voice_in_trunks/${voiceConfigId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(configData),
        }
      );
    } else {
      // Create new configuration
      const voiceConfigResponse = await this.makeRequest(
        '/voice_in_trunks',
        {
          method: 'POST',
          body: JSON.stringify(configData),
        }
      );

      // Associate with DID
      const didUpdateData = {
        data: {
          type: 'dids',
          id: didId,
          relationships: {
            voice_in_trunk: {
              data: {
                type: 'voice_in_trunks',
                id: (voiceConfigResponse as any).data.id,
              },
            },
          },
        },
      };

      await this.makeRequest(
        `/dids/${didId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(didUpdateData),
        }
      );
    }
  }
}

// Export a singleton instance (lazy initialization)
let _didwwService: DIDWWService | null = null;

export const getDIDWWService = (apiKey?: string, baseUrl?: string): DIDWWService => {
  if (!_didwwService) {
    _didwwService = new DIDWWService(apiKey, baseUrl);
  }
  return _didwwService;
};

// Export a getter for backward compatibility
export const didwwService = getDIDWWService();