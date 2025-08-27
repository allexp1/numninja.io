import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';

export type ProvisioningStatus = 
  | 'pending' 
  | 'provisioning' 
  | 'active' 
  | 'failed' 
  | 'cancelled' 
  | 'suspended';

interface NumberStatusBadgeProps {
  status: ProvisioningStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function NumberStatusBadge({ 
  status, 
  showIcon = true, 
  size = 'md',
  className = '' 
}: NumberStatusBadgeProps) {
  const getStatusIcon = () => {
    const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
    
    switch (status) {
      case 'active':
        return <CheckCircle className={`${iconSize} text-green-600`} />;
      case 'failed':
        return <XCircle className={`${iconSize} text-red-600`} />;
      case 'pending':
        return <Clock className={`${iconSize} text-yellow-600`} />;
      case 'provisioning':
        return <RefreshCw className={`${iconSize} text-blue-600 animate-spin`} />;
      case 'suspended':
        return <AlertCircle className={`${iconSize} text-orange-600`} />;
      case 'cancelled':
        return <XCircle className={`${iconSize} text-gray-600`} />;
      default:
        return <Clock className={`${iconSize} text-gray-400`} />;
    }
  };

  const getStatusStyles = () => {
    const baseStyles = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base'
    };

    const colorStyles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      provisioning: 'bg-blue-100 text-blue-800 border-blue-200',
      suspended: 'bg-orange-100 text-orange-800 border-orange-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return `${baseStyles[size]} ${colorStyles[status] || colorStyles.pending}`;
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'failed':
        return 'Failed';
      case 'pending':
        return 'Pending';
      case 'provisioning':
        return 'Provisioning';
      case 'suspended':
        return 'Suspended';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <span 
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full border
        ${getStatusStyles()}
        ${className}
      `}
    >
      {showIcon && getStatusIcon()}
      <span>{getStatusLabel()}</span>
    </span>
  );
}

// Additional helper component for simple status dots
export function StatusDot({ status }: { status: ProvisioningStatus }) {
  const getColor = () => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'provisioning':
        return 'bg-blue-500';
      case 'suspended':
        return 'bg-orange-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const isAnimated = status === 'provisioning' || status === 'pending';

  return (
    <span className="relative inline-flex">
      <span 
        className={`
          inline-flex h-2 w-2 rounded-full 
          ${getColor()}
          ${isAnimated ? 'animate-pulse' : ''}
        `}
      />
      {isAnimated && (
        <span 
          className={`
            absolute inline-flex h-full w-full rounded-full opacity-75
            ${getColor()}
            animate-ping
          `}
        />
      )}
    </span>
  );
}