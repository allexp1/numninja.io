'use client';

import React from 'react';
import { CDRStats } from '@/lib/cdr';
import { PhoneIcon, ClockIcon, CurrencyDollarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

interface CallStatsProps {
  stats: CDRStats;
  period?: string;
}

export default function CallStats({ stats, period = 'This month' }: CallStatsProps) {
  const statsCards = [
    {
      title: 'Total Calls',
      value: stats.total_calls.toLocaleString(),
      subtitle: `${stats.answered_calls} answered, ${stats.missed_calls} missed`,
      icon: PhoneIcon,
      color: 'blue',
    },
    {
      title: 'Total Duration',
      value: stats.total_duration_formatted,
      subtitle: `Avg: ${stats.average_duration_formatted}`,
      icon: ClockIcon,
      color: 'green',
    },
    {
      title: 'Total Cost',
      value: `$${stats.total_cost.toFixed(2)}`,
      subtitle: `${period}`,
      icon: CurrencyDollarIcon,
      color: 'purple',
    },
    {
      title: 'Call Direction',
      value: `${stats.inbound_calls} / ${stats.outbound_calls}`,
      subtitle: 'Inbound / Outbound',
      icon: ArrowTrendingUpIcon,
      color: 'orange',
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
              <Icon className={`h-5 w-5 ${colors.icon}`} />
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
  );
}