'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeftIcon, PhoneIcon, ChatBubbleLeftRightIcon, BellIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { 
  CDRRecord, 
  SMSRecord, 
  CDRStats, 
  SMSStats,
  DateRange,
  fetchCDR,
  fetchSMS,
  calculateCDRStats,
  calculateSMSStats,
  subscribeToCDRUpdates,
  subscribeToSMSUpdates,
  filterByDateRange
} from '@/lib/cdr';
import CallLogTable from '@/components/cdr/CallLogTable';
import CallStats from '@/components/cdr/CallStats';
import DateRangePicker from '@/components/cdr/DateRangePicker';
import ExportButton from '@/components/cdr/ExportButton';
import SmsLogTable from '@/components/sms/SmsLogTable';
import SmsStats from '@/components/sms/SmsStats';

export default function CDRDetailPage() {
  const params = useParams();
  const phoneNumber = decodeURIComponent(params.number as string);
  
  const [activeTab, setActiveTab] = useState<'calls' | 'sms'>('calls');
  const [cdrRecords, setCdrRecords] = useState<CDRRecord[]>([]);
  const [smsRecords, setSmsRecords] = useState<SMSRecord[]>([]);
  const [cdrStats, setCdrStats] = useState<CDRStats | null>(null);
  const [smsStats, setSmsStats] = useState<SMSStats | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
  });
  const [loading, setLoading] = useState(true);
  const [newRecordsCount, setNewRecordsCount] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [phoneNumber, dateRange]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!autoRefresh) return;

    const unsubscribeCDR = subscribeToCDRUpdates(phoneNumber, (newRecord) => {
      setCdrRecords(prev => [newRecord, ...prev]);
      setNewRecordsCount(prev => prev + 1);
    });

    const unsubscribeSMS = subscribeToSMSUpdates(phoneNumber, (newRecord) => {
      setSmsRecords(prev => [newRecord, ...prev]);
      setNewRecordsCount(prev => prev + 1);
    });

    return () => {
      unsubscribeCDR();
      unsubscribeSMS();
    };
  }, [phoneNumber, autoRefresh]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch CDR records
      const cdr = await fetchCDR(phoneNumber, dateRange);
      setCdrRecords(cdr);
      
      // Calculate CDR stats
      const cdrStatsData = calculateCDRStats(cdr);
      setCdrStats(cdrStatsData);

      // Fetch SMS records
      const sms = await fetchSMS(phoneNumber, dateRange);
      setSmsRecords(sms);
      
      // Calculate SMS stats
      const smsStatsData = calculateSMSStats(sms);
      setSmsStats(smsStatsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  const handleExportCDR = () => {
    // The ExportButton component handles the export logic
    console.log('Exporting CDR...');
  };

  const handleExportSMS = () => {
    // The ExportButton component handles the export logic
    console.log('Exporting SMS...');
  };

  const handleRecordClick = (record: CDRRecord | SMSRecord) => {
    // Handle individual record click (e.g., show details modal)
    console.log('Record clicked:', record);
  };

  const clearNewRecordsNotification = () => {
    setNewRecordsCount(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/my-numbers" 
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to My Numbers
          </Link>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Call & SMS Logs
                </h1>
                <p className="text-gray-600 mt-1">
                  {phoneNumber}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {newRecordsCount > 0 && (
                  <button
                    onClick={clearNewRecordsNotification}
                    className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    <BellIcon className="h-5 w-5 mr-1" />
                    {newRecordsCount} new record{newRecordsCount !== 1 ? 's' : ''}
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                  </button>
                )}
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Auto-refresh</span>
                </label>
              </div>
            </div>

            {/* Date Range Picker */}
            <DateRangePicker 
              onRangeChange={handleDateRangeChange}
              initialRange={dateRange}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('calls')}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                ${activeTab === 'calls'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <PhoneIcon className="h-5 w-5" />
              Call Logs
            </button>
            <button
              onClick={() => setActiveTab('sms')}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                ${activeTab === 'sms'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              SMS Logs
            </button>
          </nav>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'calls' ? (
              <div className="space-y-6">
                {/* CDR Stats */}
                {cdrStats && (
                  <CallStats 
                    stats={cdrStats}
                    period={`${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`}
                  />
                )}

                {/* Export Button */}
                <div className="flex justify-end">
                  <ExportButton 
                    data={cdrRecords}
                    type="cdr"
                    filename={`calls-${phoneNumber}`}
                  />
                </div>

                {/* Call Log Table */}
                <CallLogTable 
                  records={cdrRecords}
                  onRecordClick={handleRecordClick}
                  onExport={handleExportCDR}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* SMS Stats */}
                {smsStats && (
                  <SmsStats 
                    stats={smsStats}
                    period={`${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`}
                  />
                )}

                {/* Export Button */}
                <div className="flex justify-end">
                  <ExportButton 
                    data={smsRecords}
                    type="sms"
                    filename={`sms-${phoneNumber}`}
                  />
                </div>

                {/* SMS Log Table */}
                <SmsLogTable 
                  records={smsRecords}
                  onRecordClick={handleRecordClick}
                  onExport={handleExportSMS}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}