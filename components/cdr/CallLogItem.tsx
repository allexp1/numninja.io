'use client';

import React from 'react';
import { CDRRecord } from '@/lib/cdr';
import { PhoneIcon, PhoneArrowDownLeftIcon, PhoneArrowUpRightIcon, ClockIcon, CurrencyDollarIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

interface CallLogItemProps {
  record: CDRRecord;
  onClick?: () => void;
}

export default function CallLogItem({ record, onClick }: CallLogItemProps) {
  const getStatusIcon = () => {
    switch (record.status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'no-answer':
      case 'busy':
        return <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getDirectionIcon = () => {
    if (record.direction === 'inbound') {
      return <PhoneArrowDownLeftIcon className="h-5 w-5 text-blue-500" />;
    }
    return <PhoneArrowUpRightIcon className="h-5 w-5 text-green-500" />;
  };

  const formatPhoneNumber = (number: string) => {
    // Format phone number for display
    if (number.length === 11 && number.startsWith('1')) {
      return `+1 (${number.slice(1, 4)}) ${number.slice(4, 7)}-${number.slice(7)}`;
    }
    return number;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const otherNumber = record.direction === 'inbound' ? record.from_number : record.to_number;

  return (
    <div 
      onClick={onClick}
      className={`
        bg-white border border-gray-200 rounded-lg p-4 
        hover:shadow-md transition-shadow cursor-pointer
        ${!record.answered ? 'opacity-75' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex flex-col items-center space-y-1">
            {getDirectionIcon()}
            {getStatusIcon()}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900">
                {formatPhoneNumber(otherNumber)}
              </span>
              {record.destination_name && (
                <span className="text-sm text-gray-500">
                  • {record.destination_name}
                </span>
              )}
            </div>
            
            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center space-x-1">
                <ClockIcon className="h-4 w-4" />
                <span>{formatDate(record.start_time)}</span>
              </span>
              
              {record.answered && (
                <>
                  <span className="flex items-center space-x-1">
                    <span>Duration:</span>
                    <span className="font-medium">{record.duration_formatted}</span>
                  </span>
                  
                  <span className="flex items-center space-x-1">
                    <CurrencyDollarIcon className="h-4 w-4" />
                    <span className="font-medium">
                      ${record.cost.toFixed(2)}
                    </span>
                  </span>
                </>
              )}
              
              {record.recording_url && (
                <span className="flex items-center space-x-1">
                  <MicrophoneIcon className="h-4 w-4" />
                  <span>Recording available</span>
                </span>
              )}
            </div>
            
            <div className="mt-2 flex items-center space-x-2">
              <span className={`
                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${record.direction === 'inbound' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'}
              `}>
                {record.direction}
              </span>
              
              <span className={`
                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${record.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : record.status === 'failed' || record.status === 'cancelled'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'}
              `}>
                {record.status}
              </span>
            </div>
          </div>
        </div>
        
        {record.recording_url && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              window.open(record.recording_url, '_blank');
            }}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MicrophoneIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}