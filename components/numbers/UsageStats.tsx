'use client';

import React from 'react';
import { 
  PhoneCall,
  MessageSquare,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

export interface UsageData {
  totalCalls: number;
  totalMinutes: number;
  totalSMS: number;
  totalCost: number;
  periodStart: string;
  periodEnd: string;
  previousPeriod?: {
    totalCalls: number;
    totalMinutes: number;
    totalSMS: number;
    totalCost: number;
  };
}

interface UsageStatsProps {
  data: UsageData;
  variant?: 'default' | 'compact' | 'detailed';
  showTrends?: boolean;
  className?: string;
}

export function UsageStats({
  data,
  variant = 'default',
  showTrends = true,
  className = ''
}: UsageStatsProps) {
  const calculateTrend = (current: number, previous?: number) => {
    if (!previous || previous === 0) return { value: 0, direction: 'neutral' as const };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const
    };
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatPeriod = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days === 30 || days === 31) {
      return 'Last 30 Days';
    } else if (days === 7) {
      return 'Last 7 Days';
    } else if (days === 1) {
      return 'Today';
    } else {
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }
  };

  const stats = [
    {
      icon: PhoneCall,
      label: 'Total Calls',
      value: data.totalCalls,
      format: (v: number) => v.toString(),
      color: 'blue',
      trend: showTrends ? calculateTrend(data.totalCalls, data.previousPeriod?.totalCalls) : null
    },
    {
      icon: Clock,
      label: 'Talk Time',
      value: data.totalMinutes,
      format: formatDuration,
      color: 'green',
      trend: showTrends ? calculateTrend(data.totalMinutes, data.previousPeriod?.totalMinutes) : null
    },
    {
      icon: MessageSquare,
      label: 'SMS Messages',
      value: data.totalSMS,
      format: (v: number) => v.toString(),
      color: 'purple',
      trend: showTrends ? calculateTrend(data.totalSMS, data.previousPeriod?.totalSMS) : null
    },
    {
      icon: DollarSign,
      label: 'Total Cost',
      value: data.totalCost,
      format: (v: number) => `$${v.toFixed(2)}`,
      color: 'yellow',
      trend: showTrends ? calculateTrend(data.totalCost, data.previousPeriod?.totalCost) : null
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        icon: 'text-blue-600',
        trend: 'text-blue-600'
      },
      green: {
        bg: 'bg-green-50',
        icon: 'text-green-600',
        trend: 'text-green-600'
      },
      purple: {
        bg: 'bg-purple-50',
        icon: 'text-purple-600',
        trend: 'text-purple-600'
      },
      yellow: {
        bg: 'bg-yellow-50',
        icon: 'text-yellow-600',
        trend: 'text-yellow-600'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const TrendIndicator = ({ trend }: { trend: { value: number; direction: 'up' | 'down' | 'neutral' } }) => {
    if (trend.direction === 'neutral') {
      return (
        <div className="flex items-center gap-1 text-gray-500">
          <Minus className="w-3 h-3" />
          <span className="text-xs">0%</span>
        </div>
      );
    }

    const isPositive = trend.direction === 'up';
    const Icon = isPositive ? ArrowUp : ArrowDown;
    const color = isPositive ? 'text-green-600' : 'text-red-600';

    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="w-3 h-3" />
        <span className="text-xs font-medium">{trend.value.toFixed(1)}%</span>
      </div>
    );
  };

  // Compact variant - single row
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-6 p-4 bg-white rounded-lg ${className}`}>
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center gap-2">
            <stat.icon className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {stat.format(stat.value)}
              </p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Detailed variant - with charts placeholder
  if (variant === 'detailed') {
    return (
      <div className={className}>
        {/* Period Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Usage Statistics</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{formatPeriod(data.periodStart, data.periodEnd)}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => {
            const colors = getColorClasses(stat.color);
            return (
              <div key={index} className={`rounded-lg ${colors.bg} p-4`}>
                <div className="flex items-start justify-between mb-2">
                  <stat.icon className={`w-5 h-5 ${colors.icon}`} />
                  {stat.trend && <TrendIndicator trend={stat.trend} />}
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.format(stat.value)}
                </p>
                <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Charts Placeholder */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Call Volume</h4>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-32 flex items-center justify-center">
              <p className="text-sm text-gray-500">Chart visualization coming soon</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Usage Trend</h4>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-32 flex items-center justify-center">
              <p className="text-sm text-gray-500">Chart visualization coming soon</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant - grid layout
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Usage Statistics</h3>
        <span className="text-sm text-gray-500">
          {formatPeriod(data.periodStart, data.periodEnd)}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const colors = getColorClasses(stat.color);
          return (
            <div key={index} className={`text-center p-4 ${colors.bg} rounded-lg`}>
              <stat.icon className={`w-8 h-8 mx-auto mb-2 ${colors.icon}`} />
              <p className="text-2xl font-bold text-gray-900">
                {stat.format(stat.value)}
              </p>
              <p className="text-sm text-gray-600">{stat.label}</p>
              {stat.trend && (
                <div className="mt-2 flex justify-center">
                  <TrendIndicator trend={stat.trend} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Mini stats component for dashboard cards
export function MiniUsageStats({ 
  calls, 
  minutes, 
  sms 
}: { 
  calls: number; 
  minutes: number; 
  sms: number; 
}) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1">
        <PhoneCall className="w-3 h-3 text-gray-400" />
        <span className="text-gray-600">{calls}</span>
      </div>
      <div className="flex items-center gap-1">
        <Clock className="w-3 h-3 text-gray-400" />
        <span className="text-gray-600">{minutes}m</span>
      </div>
      <div className="flex items-center gap-1">
        <MessageSquare className="w-3 h-3 text-gray-400" />
        <span className="text-gray-600">{sms}</span>
      </div>
    </div>
  );
}

// Period selector component
export function PeriodSelector({
  selected,
  onChange,
  options = ['today', '7days', '30days', 'custom']
}: {
  selected: string;
  onChange: (period: string) => void;
  options?: string[];
}) {
  const labels: Record<string, string> = {
    today: 'Today',
    '7days': 'Last 7 Days',
    '30days': 'Last 30 Days',
    custom: 'Custom Range'
  };

  return (
    <div className="inline-flex rounded-lg border border-gray-200 p-1">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`
            px-3 py-1 text-sm font-medium rounded-md transition-colors
            ${selected === option 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }
          `}
        >
          {labels[option] || option}
        </button>
      ))}
    </div>
  );
}