'use client';

import React, { useState, useEffect } from 'react';
import { 
  CDRRecord, 
  SMSRecord, 
  CDRStats, 
  SMSStats,
  generateMockCDR,
  generateMockSMS,
  calculateCDRStats,
  calculateSMSStats,
  formatDuration
} from '@/lib/cdr';
import { 
  PhoneIcon, 
  ChatBubbleLeftRightIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import DateRangePicker from '@/components/cdr/DateRangePicker';
import Link from 'next/link';

interface NumberAnalytics {
  phoneNumber: string;
  cdrStats: CDRStats;
  smsStats: SMSStats;
  callsByHour: number[];
  callsByDay: number[];
  topDestinations: { name: string; count: number; duration: number }[];
  costTrend: { date: string; cost: number }[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<NumberAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });
  const [selectedView, setSelectedView] = useState<'overview' | 'trends' | 'costs'>('overview');

  // Mock phone numbers for demo
  const phoneNumbers = ['+14155552345', '+442071234567', '+33142891234'];

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = () => {
    setLoading(true);
    
    // Generate analytics for each phone number
    const analyticsData: NumberAnalytics[] = phoneNumbers.map(phoneNumber => {
      const cdrRecords = generateMockCDR(100, phoneNumber);
      const smsRecords = generateMockSMS(50, phoneNumber);
      
      // Calculate stats
      const cdrStats = calculateCDRStats(cdrRecords);
      const smsStats = calculateSMSStats(smsRecords);
      
      // Calculate calls by hour (24 hours)
      const callsByHour = new Array(24).fill(0);
      cdrRecords.forEach(record => {
        const hour = new Date(record.start_time).getHours();
        callsByHour[hour]++;
      });
      
      // Calculate calls by day of week (7 days)
      const callsByDay = new Array(7).fill(0);
      cdrRecords.forEach(record => {
        const day = new Date(record.start_time).getDay();
        callsByDay[day]++;
      });
      
      // Calculate top destinations
      const destinationMap = new Map<string, { count: number; duration: number }>();
      cdrRecords.forEach(record => {
        const dest = record.destination_name || 'Unknown';
        const existing = destinationMap.get(dest) || { count: 0, duration: 0 };
        destinationMap.set(dest, {
          count: existing.count + 1,
          duration: existing.duration + record.duration_seconds,
        });
      });
      
      const topDestinations = Array.from(destinationMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Calculate cost trend (last 7 days)
      const costTrend: { date: string; cost: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayCost = cdrRecords
          .filter(r => new Date(r.start_time).toISOString().split('T')[0] === dateStr)
          .reduce((sum, r) => sum + r.cost, 0);
        
        costTrend.push({ date: dateStr, cost: dayCost });
      }
      
      return {
        phoneNumber,
        cdrStats,
        smsStats,
        callsByHour,
        callsByDay,
        topDestinations,
        costTrend,
      };
    });
    
    setAnalytics(analyticsData);
    setLoading(false);
  };

  const getTotalStats = () => {
    const totalCalls = analytics.reduce((sum, a) => sum + a.cdrStats.total_calls, 0);
    const totalSMS = analytics.reduce((sum, a) => sum + a.smsStats.total_messages, 0);
    const totalCost = analytics.reduce((sum, a) => sum + a.cdrStats.total_cost + a.smsStats.total_cost, 0);
    const totalDuration = analytics.reduce((sum, a) => sum + a.cdrStats.total_duration_seconds, 0);
    
    return { totalCalls, totalSMS, totalCost, totalDuration };
  };

  const { totalCalls, totalSMS, totalCost, totalDuration } = getTotalStats();

  const peakHour = () => {
    const hourTotals = new Array(24).fill(0);
    analytics.forEach(a => {
      a.callsByHour.forEach((count, hour) => {
        hourTotals[hour] += count;
      });
    });
    const maxHour = hourTotals.indexOf(Math.max(...hourTotals));
    return `${maxHour}:00 - ${maxHour + 1}:00`;
  };

  const peakDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayTotals = new Array(7).fill(0);
    analytics.forEach(a => {
      a.callsByDay.forEach((count, day) => {
        dayTotals[day] += count;
      });
    });
    const maxDay = dayTotals.indexOf(Math.max(...dayTotals));
    return days[maxDay];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor usage patterns and costs across all your numbers</p>
        </div>

        {/* Date Range and View Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <DateRangePicker 
                onRangeChange={setDateRange}
                initialRange={dateRange}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedView('overview')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedView === 'overview'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setSelectedView('trends')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedView === 'trends'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Trends
              </button>
              <button
                onClick={() => setSelectedView('costs')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedView === 'costs'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Costs
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            {selectedView === 'overview' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <PhoneIcon className="h-8 w-8 text-blue-600" />
                      <span className="text-sm text-gray-500">All Numbers</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{totalCalls}</div>
                    <p className="text-sm text-gray-600 mt-1">Total Calls</p>
                  </div>

                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600" />
                      <span className="text-sm text-gray-500">All Numbers</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{totalSMS}</div>
                    <p className="text-sm text-gray-600 mt-1">Total Messages</p>
                  </div>

                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <ClockIcon className="h-8 w-8 text-purple-600" />
                      <span className="text-sm text-gray-500">All Numbers</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{formatDuration(totalDuration)}</div>
                    <p className="text-sm text-gray-600 mt-1">Total Duration</p>
                  </div>

                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <CurrencyDollarIcon className="h-8 w-8 text-orange-600" />
                      <span className="text-sm text-gray-500">All Numbers</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">${totalCost.toFixed(2)}</div>
                    <p className="text-sm text-gray-600 mt-1">Total Cost</p>
                  </div>
                </div>

                {/* Numbers Overview */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Numbers Overview</h2>
                  <div className="space-y-4">
                    {analytics.map(({ phoneNumber, cdrStats, smsStats }) => (
                      <div key={phoneNumber} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <Link 
                            href={`/my-numbers/${encodeURIComponent(phoneNumber)}/cdr`}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {phoneNumber}
                          </Link>
                          <div className="flex gap-6 mt-2 text-sm text-gray-600">
                            <span>{cdrStats.total_calls} calls</span>
                            <span>{smsStats.total_messages} messages</span>
                            <span>{formatDuration(cdrStats.total_duration_seconds)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            ${(cdrStats.total_cost + smsStats.total_cost).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">Total cost</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Trends View */}
            {selectedView === 'trends' && (
              <div className="space-y-6">
                {/* Peak Usage */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Usage Times</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Peak Hour:</span>
                        <span className="font-semibold text-gray-900">{peakHour()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Peak Day:</span>
                        <span className="font-semibold text-gray-900">{peakDay()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Destinations</h3>
                    <div className="space-y-2">
                      {analytics[0]?.topDestinations.map((dest, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-600">{dest.name}</span>
                          <div className="text-right">
                            <span className="font-semibold text-gray-900">{dest.count} calls</span>
                            <span className="text-sm text-gray-500 ml-2">
                              ({formatDuration(dest.duration)})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hourly Distribution */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Call Distribution</h3>
                  <div className="flex items-end gap-1 h-40">
                    {Array.from({ length: 24 }, (_, hour) => {
                      const totalForHour = analytics.reduce((sum, a) => sum + a.callsByHour[hour], 0);
                      const maxCalls = Math.max(...analytics.flatMap(a => a.callsByHour));
                      const height = maxCalls > 0 ? (totalForHour / maxCalls) * 100 : 0;
                      
                      return (
                        <div key={hour} className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                            style={{ height: `${height}%` }}
                            title={`${hour}:00 - ${totalForHour} calls`}
                          />
                          {hour % 3 === 0 && (
                            <span className="text-xs text-gray-500 mt-1">{hour}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Costs View */}
            {selectedView === 'costs' && (
              <div className="space-y-6">
                {/* Cost Breakdown */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown by Number</h3>
                  <div className="space-y-4">
                    {analytics.map(({ phoneNumber, cdrStats, smsStats }) => {
                      const totalNumberCost = cdrStats.total_cost + smsStats.total_cost;
                      const percentage = totalCost > 0 ? (totalNumberCost / totalCost) * 100 : 0;
                      
                      return (
                        <div key={phoneNumber}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-900">{phoneNumber}</span>
                            <span className="font-semibold text-gray-900">${totalNumberCost.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1 text-sm text-gray-600">
                            <span>Calls: ${cdrStats.total_cost.toFixed(2)}</span>
                            <span>SMS: ${smsStats.total_cost.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 7-Day Cost Trend */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">7-Day Cost Trend</h3>
                  <div className="space-y-3">
                    {analytics[0]?.costTrend.map((day, index) => {
                      const totalDayCost = analytics.reduce((sum, a) => sum + a.costTrend[index].cost, 0);
                      const maxDayCost = Math.max(...analytics[0].costTrend.map((_, i) => 
                        analytics.reduce((sum, a) => sum + a.costTrend[i].cost, 0)
                      ));
                      const width = maxDayCost > 0 ? (totalDayCost / maxDayCost) * 100 : 0;
                      
                      return (
                        <div key={day.date} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 w-20">
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                            <div 
                              className="bg-green-500 h-6 rounded-full transition-all duration-300"
                              style={{ width: `${width}%` }}
                            />
                            <span className="absolute right-2 top-0 h-6 flex items-center text-xs font-medium text-gray-700">
                              ${totalDayCost.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}