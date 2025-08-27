'use client';

import React from 'react';
import { SMSStats } from '@/lib/cdr';
import { ChatBubbleLeftRightIcon, CheckCircleIcon, XCircleIcon, CurrencyDollarIcon, DocumentTextIcon, ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';

interface SmsStatsProps {
  stats: SMSStats;
  period?: string;
}

export default function SmsStats({ stats, period = 'This month' }: SmsStatsProps) {
  const deliveryRate = stats.total_messages > 0 
    ? ((stats.delivered_messages / stats.total_messages) * 100).toFixed(1)
    : '0';

  const avgSegments = stats.total_messages > 0
    ? (stats.total_segments / stats.total_messages).toFixed(1)
    : '0';

  const statsCards = [
    {
      title: 'Total Messages',
      value: stats.total_messages.toLocaleString(),
      subtitle: `${stats.delivered_messages} delivered`,
      icon: ChatBubbleLeftRightIcon,
      color: 'blue',
      trend: null,
    },
    {
      title: 'Delivery Rate',
      value: `${deliveryRate}%`,
      subtitle: `${stats.failed_messages} failed`,
      icon: CheckCircleIcon,
      color: 'green',
      trend: parseFloat(deliveryRate) >= 95 ? 'up' : 'down',
    },
    {
      title: 'Total Cost',
      value: `$${stats.total_cost.toFixed(2)}`,
      subtitle: period,
      icon: CurrencyDollarIcon,
      color: 'purple',
      trend: null,
    },
    {
      title: 'Segments Used',
      value: stats.total_segments.toLocaleString(),
      subtitle: `Avg ${avgSegments} per message`,
      icon: DocumentTextIcon,
      color: 'orange',
      trend: null,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-900',
        icon: 'text-blue-600',
      },
      green: {
        bg: 'bg-green-50',
        text: 'text-green-900',
        icon: 'text-green-600',
      },
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-900',
        icon: 'text-purple-600',
      },
      orange: {
        bg: 'bg-orange-50',
        text: 'text-orange-900',
        icon: 'text-orange-600',
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => {
          const colors = getColorClasses(card.color);
          const Icon = card.icon;
          
          return (
            <div
              key={index}
              className={`${colors.bg} rounded-lg p-6 border border-gray-200`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-medium ${colors.text}`}>
                  {card.title}
                </h3>
                <div className="flex items-center gap-1">
                  <Icon className={`h-5 w-5 ${colors.icon}`} />
                  {card.trend && (
                    card.trend === 'up' 
                      ? <ArrowUpIcon className="h-4 w-4 text-green-500" />
                      : <ArrowDownIcon className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              
              <div className={`text-2xl font-bold ${colors.text}`}>
                {card.value}
              </div>
              
              <p className="text-sm text-gray-600 mt-2">
                {card.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Direction Breakdown */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Message Direction</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownIcon className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-700">Inbound Messages</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-900">
                {stats.inbound_messages.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500">
                ({((stats.inbound_messages / stats.total_messages) * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpIcon className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-700">Outbound Messages</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-900">
                {stats.outbound_messages.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500">
                ({((stats.outbound_messages / stats.total_messages) * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="flex h-full">
              <div 
                className="bg-blue-500 transition-all duration-300"
                style={{ width: `${(stats.inbound_messages / stats.total_messages) * 100}%` }}
              />
              <div 
                className="bg-green-500 transition-all duration-300"
                style={{ width: `${(stats.outbound_messages / stats.total_messages) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}