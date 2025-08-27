import { supabase } from './supabase';

// CDR Types
export interface CDRRecord {
  id: string;
  number_id: string;
  phone_number: string;
  direction: 'inbound' | 'outbound';
  from_number: string;
  to_number: string;
  destination_name?: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  duration_formatted: string;
  answered: boolean;
  status: 'completed' | 'no-answer' | 'busy' | 'failed' | 'cancelled';
  cost: number;
  cost_currency: string;
  recording_url?: string;
  created_at: string;
}

export interface SMSRecord {
  id: string;
  number_id: string;
  phone_number: string;
  direction: 'inbound' | 'outbound';
  from_number: string;
  to_number: string;
  message: string;
  status: 'delivered' | 'sent' | 'failed' | 'pending';
  cost: number;
  cost_currency: string;
  segments: number;
  created_at: string;
  delivered_at?: string;
}

export interface CDRStats {
  total_calls: number;
  total_duration_seconds: number;
  total_duration_formatted: string;
  total_cost: number;
  answered_calls: number;
  missed_calls: number;
  average_duration_seconds: number;
  average_duration_formatted: string;
  inbound_calls: number;
  outbound_calls: number;
}

export interface SMSStats {
  total_messages: number;
  total_cost: number;
  delivered_messages: number;
  failed_messages: number;
  inbound_messages: number;
  outbound_messages: number;
  total_segments: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

// Format duration from seconds to human readable
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
}

// Generate mock CDR data
export function generateMockCDR(count: number = 50, phoneNumber: string = '+1234567890'): CDRRecord[] {
  const cdrs: CDRRecord[] = [];
  const destinations = [
    { name: 'New York, US', prefix: '+1212' },
    { name: 'London, UK', prefix: '+44207' },
    { name: 'Paris, FR', prefix: '+331' },
    { name: 'Tokyo, JP', prefix: '+813' },
    { name: 'Sydney, AU', prefix: '+612' },
    { name: 'Toronto, CA', prefix: '+1416' },
    { name: 'Berlin, DE', prefix: '+4930' },
    { name: 'Mumbai, IN', prefix: '+9122' },
  ];

  const statuses: CDRRecord['status'][] = ['completed', 'no-answer', 'busy', 'failed', 'cancelled'];
  const statusWeights = [0.7, 0.15, 0.08, 0.05, 0.02]; // Most calls are completed

  for (let i = 0; i < count; i++) {
    const direction: 'inbound' | 'outbound' = Math.random() > 0.6 ? 'inbound' : 'outbound';
    const destination = destinations[Math.floor(Math.random() * destinations.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);
    
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - daysAgo);
    startTime.setHours(startTime.getHours() - hoursAgo);
    startTime.setMinutes(startTime.getMinutes() - minutesAgo);
    
    // Weighted random status selection
    const randomValue = Math.random();
    let cumulativeWeight = 0;
    let status: CDRRecord['status'] = 'completed';
    for (let j = 0; j < statuses.length; j++) {
      cumulativeWeight += statusWeights[j];
      if (randomValue <= cumulativeWeight) {
        status = statuses[j];
        break;
      }
    }
    
    const answered = status === 'completed';
    const duration = answered ? Math.floor(Math.random() * 600) + 10 : 0; // 10s to 10min for answered calls
    const endTime = new Date(startTime.getTime() + duration * 1000);
    
    // Calculate cost based on duration and destination
    const ratePerMinute = 0.02 + Math.random() * 0.08; // $0.02 to $0.10 per minute
    const cost = answered ? (duration / 60) * ratePerMinute : 0;
    
    const fromNumber = direction === 'inbound' 
      ? `${destination.prefix}${Math.floor(Math.random() * 9000000 + 1000000)}`
      : phoneNumber;
    
    const toNumber = direction === 'outbound'
      ? `${destination.prefix}${Math.floor(Math.random() * 9000000 + 1000000)}`
      : phoneNumber;

    cdrs.push({
      id: `cdr_${i + 1}_${Date.now()}`,
      number_id: `num_${phoneNumber.replace(/\+/g, '')}`,
      phone_number: phoneNumber,
      direction,
      from_number: fromNumber,
      to_number: toNumber,
      destination_name: destination.name,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_seconds: duration,
      duration_formatted: formatDuration(duration),
      answered,
      status,
      cost: parseFloat(cost.toFixed(4)),
      cost_currency: 'USD',
      recording_url: answered && Math.random() > 0.3 ? `https://recordings.example.com/${i + 1}.mp3` : undefined,
      created_at: startTime.toISOString(),
    });
  }

  // Sort by start_time descending (most recent first)
  return cdrs.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
}

// Generate mock SMS data
export function generateMockSMS(count: number = 30, phoneNumber: string = '+1234567890'): SMSRecord[] {
  const smsRecords: SMSRecord[] = [];
  const messageTemplates = [
    'Your verification code is: ',
    'Reminder: Your appointment is scheduled for ',
    'Thank you for your purchase. Order #',
    'Welcome to our service! Your account has been activated.',
    'Alert: Unusual activity detected on your account.',
    'Your package has been delivered to ',
    'Happy Birthday! Special offer just for you: ',
    'System maintenance scheduled for ',
  ];

  const statuses: SMSRecord['status'][] = ['delivered', 'sent', 'failed', 'pending'];
  const statusWeights = [0.85, 0.08, 0.05, 0.02];

  for (let i = 0; i < count; i++) {
    const direction: 'inbound' | 'outbound' = Math.random() > 0.4 ? 'outbound' : 'inbound';
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);
    
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(createdAt.getHours() - hoursAgo);
    createdAt.setMinutes(createdAt.getMinutes() - minutesAgo);
    
    // Weighted random status selection
    const randomValue = Math.random();
    let cumulativeWeight = 0;
    let status: SMSRecord['status'] = 'delivered';
    for (let j = 0; j < statuses.length; j++) {
      cumulativeWeight += statusWeights[j];
      if (randomValue <= cumulativeWeight) {
        status = statuses[j];
        break;
      }
    }
    
    const template = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
    const message = template + (Math.floor(Math.random() * 900000) + 100000);
    const segments = Math.ceil(message.length / 160); // SMS segments
    const cost = segments * 0.01; // $0.01 per segment
    
    const fromNumber = direction === 'inbound'
      ? `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`
      : phoneNumber;
    
    const toNumber = direction === 'outbound'
      ? `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`
      : phoneNumber;

    const deliveredAt = status === 'delivered' 
      ? new Date(createdAt.getTime() + Math.random() * 60000).toISOString() // Delivered within 1 minute
      : undefined;

    smsRecords.push({
      id: `sms_${i + 1}_${Date.now()}`,
      number_id: `num_${phoneNumber.replace(/\+/g, '')}`,
      phone_number: phoneNumber,
      direction,
      from_number: fromNumber,
      to_number: toNumber,
      message,
      status,
      cost: parseFloat(cost.toFixed(4)),
      cost_currency: 'USD',
      segments,
      created_at: createdAt.toISOString(),
      delivered_at: deliveredAt,
    });
  }

  // Sort by created_at descending (most recent first)
  return smsRecords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// Calculate CDR statistics
export function calculateCDRStats(records: CDRRecord[]): CDRStats {
  const totalCalls = records.length;
  const answeredCalls = records.filter(r => r.answered).length;
  const missedCalls = totalCalls - answeredCalls;
  const inboundCalls = records.filter(r => r.direction === 'inbound').length;
  const outboundCalls = records.filter(r => r.direction === 'outbound').length;
  
  const totalDurationSeconds = records.reduce((sum, r) => sum + r.duration_seconds, 0);
  const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
  
  const averageDurationSeconds = answeredCalls > 0 
    ? Math.round(totalDurationSeconds / answeredCalls)
    : 0;

  return {
    total_calls: totalCalls,
    total_duration_seconds: totalDurationSeconds,
    total_duration_formatted: formatDuration(totalDurationSeconds),
    total_cost: parseFloat(totalCost.toFixed(2)),
    answered_calls: answeredCalls,
    missed_calls: missedCalls,
    average_duration_seconds: averageDurationSeconds,
    average_duration_formatted: formatDuration(averageDurationSeconds),
    inbound_calls: inboundCalls,
    outbound_calls: outboundCalls,
  };
}

// Calculate SMS statistics
export function calculateSMSStats(records: SMSRecord[]): SMSStats {
  const totalMessages = records.length;
  const deliveredMessages = records.filter(r => r.status === 'delivered').length;
  const failedMessages = records.filter(r => r.status === 'failed').length;
  const inboundMessages = records.filter(r => r.direction === 'inbound').length;
  const outboundMessages = records.filter(r => r.direction === 'outbound').length;
  
  const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
  const totalSegments = records.reduce((sum, r) => sum + r.segments, 0);

  return {
    total_messages: totalMessages,
    total_cost: parseFloat(totalCost.toFixed(2)),
    delivered_messages: deliveredMessages,
    failed_messages: failedMessages,
    inbound_messages: inboundMessages,
    outbound_messages: outboundMessages,
    total_segments: totalSegments,
  };
}

// Filter CDR records by date range
export function filterByDateRange<T extends { created_at: string }>(
  records: T[],
  dateRange: DateRange
): T[] {
  return records.filter(record => {
    const recordDate = new Date(record.created_at);
    return recordDate >= dateRange.start && recordDate <= dateRange.end;
  });
}

// Export CDR to CSV
export function exportToCSV(records: CDRRecord[]): string {
  const headers = [
    'Date',
    'Time',
    'Direction',
    'From',
    'To',
    'Destination',
    'Duration',
    'Status',
    'Cost (USD)',
  ];

  const rows = records.map(record => {
    const date = new Date(record.start_time);
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      record.direction,
      record.from_number,
      record.to_number,
      record.destination_name || '',
      record.duration_formatted,
      record.status,
      record.cost.toFixed(4),
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

// Export SMS to CSV
export function exportSMSToCSV(records: SMSRecord[]): string {
  const headers = [
    'Date',
    'Time',
    'Direction',
    'From',
    'To',
    'Message',
    'Status',
    'Segments',
    'Cost (USD)',
  ];

  const rows = records.map(record => {
    const date = new Date(record.created_at);
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      record.direction,
      record.from_number,
      record.to_number,
      record.message.substring(0, 50) + (record.message.length > 50 ? '...' : ''),
      record.status,
      record.segments.toString(),
      record.cost.toFixed(4),
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

// Fetch CDR from API (mock implementation)
export async function fetchCDR(
  phoneNumber: string,
  dateRange?: DateRange
): Promise<CDRRecord[]> {
  // In a real implementation, this would fetch from DIDWW API
  // For now, return mock data
  const mockData = generateMockCDR(100, phoneNumber);
  
  if (dateRange) {
    return filterByDateRange(mockData, dateRange);
  }
  
  return mockData;
}

// Fetch SMS records from API (mock implementation)
export async function fetchSMS(
  phoneNumber: string,
  dateRange?: DateRange
): Promise<SMSRecord[]> {
  // In a real implementation, this would fetch from DIDWW API
  // For now, return mock data
  const mockData = generateMockSMS(50, phoneNumber);
  
  if (dateRange) {
    return filterByDateRange(mockData, dateRange);
  }
  
  return mockData;
}

// Real-time CDR updates (mock implementation)
export function subscribeToCDRUpdates(
  phoneNumber: string,
  callback: (record: CDRRecord) => void
): () => void {
  // Simulate real-time updates with random intervals
  const interval = setInterval(() => {
    if (Math.random() > 0.7) { // 30% chance of new record
      const newRecord = generateMockCDR(1, phoneNumber)[0];
      // Make it recent
      newRecord.start_time = new Date().toISOString();
      newRecord.created_at = new Date().toISOString();
      callback(newRecord);
    }
  }, 10000); // Check every 10 seconds

  // Return cleanup function
  return () => clearInterval(interval);
}

// Real-time SMS updates (mock implementation)
export function subscribeToSMSUpdates(
  phoneNumber: string,
  callback: (record: SMSRecord) => void
): () => void {
  // Simulate real-time updates with random intervals
  const interval = setInterval(() => {
    if (Math.random() > 0.8) { // 20% chance of new SMS
      const newRecord = generateMockSMS(1, phoneNumber)[0];
      // Make it recent
      newRecord.created_at = new Date().toISOString();
      callback(newRecord);
    }
  }, 15000); // Check every 15 seconds

  // Return cleanup function
  return () => clearInterval(interval);
}