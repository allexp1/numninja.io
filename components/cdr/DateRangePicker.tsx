'use client';

import React, { useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { DateRange } from '@/lib/cdr';

interface DateRangePickerProps {
  onRangeChange: (range: DateRange) => void;
  initialRange?: DateRange;
}

export default function DateRangePicker({ onRangeChange, initialRange }: DateRangePickerProps) {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const [startDate, setStartDate] = useState(
    initialRange?.start ? formatDateForInput(initialRange.start) : formatDateForInput(thirtyDaysAgo)
  );
  const [endDate, setEndDate] = useState(
    initialRange?.end ? formatDateForInput(initialRange.end) : formatDateForInput(today)
  );
  const [preset, setPreset] = useState<string>('last30days');

  function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const now = new Date();
    let start: Date;
    let end = new Date();

    switch (value) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'yesterday':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        end = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last7days':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        return; // Don't update dates for custom
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
    onRangeChange({ start, end });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    setPreset('custom');
    if (e.target.value && endDate) {
      onRangeChange({
        start: new Date(e.target.value),
        end: new Date(endDate),
      });
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    setPreset('custom');
    if (startDate && e.target.value) {
      onRangeChange({
        start: new Date(startDate),
        end: new Date(e.target.value),
      });
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <CalendarIcon className="h-5 w-5 text-gray-400" />
        <h3 className="text-sm font-medium text-gray-700">Date Range</h3>
      </div>

      <div className="space-y-3">
        {/* Preset Options */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => handlePresetChange('today')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              preset === 'today'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => handlePresetChange('yesterday')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              preset === 'yesterday'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => handlePresetChange('last7days')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              preset === 'last7days'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => handlePresetChange('last30days')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              preset === 'last30days'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => handlePresetChange('thisMonth')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              preset === 'thisMonth'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => handlePresetChange('lastMonth')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              preset === 'lastMonth'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last Month
          </button>
          <button
            onClick={() => handlePresetChange('thisYear')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              preset === 'thisYear'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Year
          </button>
          <button
            onClick={() => setPreset('custom')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              preset === 'custom'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Custom
          </button>
        </div>

        {/* Custom Date Inputs */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <label htmlFor="start-date" className="block text-xs text-gray-600 mb-1">
              From
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              max={endDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="end-date" className="block text-xs text-gray-600 mb-1">
              To
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              min={startDate}
              max={formatDateForInput(new Date())}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Date Range Display */}
        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
          Showing data from <span className="font-medium">{new Date(startDate).toLocaleDateString()}</span> to{' '}
          <span className="font-medium">{new Date(endDate).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}