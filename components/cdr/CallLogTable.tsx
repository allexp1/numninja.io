'use client';

import React, { useState, useMemo } from 'react';
import { CDRRecord } from '@/lib/cdr';
import CallLogItem from './CallLogItem';
import { FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface CallLogTableProps {
  records: CDRRecord[];
  onRecordClick?: (record: CDRRecord) => void;
  onExport?: () => void;
}

export default function CallLogTable({ records, onRecordClick, onExport }: CallLogTableProps) {
  const [filter, setFilter] = useState<'all' | 'inbound' | 'outbound' | 'missed'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'cost'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredRecords = useMemo(() => {
    let filtered = [...records];

    // Apply direction filter
    if (filter !== 'all') {
      if (filter === 'missed') {
        filtered = filtered.filter(r => !r.answered);
      } else {
        filtered = filtered.filter(r => r.direction === filter);
      }
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        filtered = filtered.filter(r => r.status === 'completed');
      } else {
        filtered = filtered.filter(r => r.status === 'failed' || r.status === 'cancelled');
      }
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.from_number.toLowerCase().includes(search) ||
        r.to_number.toLowerCase().includes(search) ||
        r.destination_name?.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
          break;
        case 'duration':
          comparison = a.duration_seconds - b.duration_seconds;
          break;
        case 'cost':
          comparison = a.cost - b.cost;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [records, filter, statusFilter, searchTerm, sortBy, sortOrder]);

  const toggleSort = (field: 'date' | 'duration' | 'cost') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by phone number or destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Calls</option>
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
              <option value="missed">Missed</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>

            {onExport && (
              <button
                onClick={onExport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
          </div>
        </div>

        {/* Sort Options */}
        <div className="mt-4 flex gap-2">
          <span className="text-sm text-gray-500 py-1">Sort by:</span>
          <button
            onClick={() => toggleSort('date')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              sortBy === 'date' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => toggleSort('duration')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              sortBy === 'duration' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Duration {sortBy === 'duration' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => toggleSort('cost')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              sortBy === 'cost' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cost {sortBy === 'cost' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500">
        Showing {filteredRecords.length} of {records.length} records
      </div>

      {/* Call Log Items */}
      <div className="space-y-2">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <CallLogItem
              key={record.id}
              record={record}
              onClick={() => onRecordClick?.(record)}
            />
          ))
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <FunnelIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No call records found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your filters or search criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}