'use client';

import React from 'react';
import { SMSRecord } from '@/lib/cdr';
import { ChatBubbleLeftRightIcon, ChatBubbleLeftIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon, ClockIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';

interface SmsLogItemProps {
  record: SMSRecord;
  onClick?: () => void;
}

export default function SmsLogItem({ record, onClick }: SmsLogItemProps) {
  const getStatusIcon = () => {
    switch (record.status) {
      case 'delivered':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'sent':
        return <PaperAirplaneIcon className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getDirectionIcon = () => {
    if (record.direction === 'inbound') {
      return <ChatBubbleLeftIcon className="h-5 w-5 text-blue-500" />;
    }
    return <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-green-500" />;
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
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      const hoursAgo = Math.floor(hours);
      return `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
    } else if (hours < 168) { // 7 days
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    
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
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex flex-col items-center space-y-1">
            {getDirectionIcon()}
            {getStatusIcon()}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">
                  {formatPhoneNumber(otherNumber)}
                </span>
                <span className={`
                  inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                  ${record.direction === 'inbound' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'}
                `}>
                  {record.direction}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {formatDate(record.created_at)}
              </span>
            </div>
            
            <div className="mb-2">
              <p className="text-gray-700 text-sm line-clamp-2">
                {record.message}
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <span className={`
                  inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                  ${record.status === 'delivered'
                    ? 'bg-green-100 text-green-800'
                    : record.status === 'sent'
                    ? 'bg-blue-100 text-blue-800'
                    : record.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'}
                `}>
                  {record.status}
                </span>
                
                {record.segments > 1 && (
                  <span className="text-xs">
                    {record.segments} segments
                  </span>
                )}
                
                {record.delivered_at && (
                  <span className="text-xs">
                    Delivered: {formatDate(record.delivered_at)}
                  </span>
                )}
              </div>
              
              <span className="text-sm font-medium text-gray-700">
                ${record.cost.toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}