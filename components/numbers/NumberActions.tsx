'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  RefreshCw, 
  Trash2, 
  Power, 
  PowerOff,
  Phone,
  MessageSquare,
  FileText,
  Download,
  MoreVertical,
  Edit,
  Copy,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

interface NumberActionsProps {
  numberId: string;
  status: 'active' | 'suspended' | 'failed' | 'pending' | 'provisioning' | 'cancelled';
  didId?: string;
  phoneNumber: string;
  onConfigure?: () => void;
  onRetry?: () => void;
  onSuspend?: () => void;
  onReactivate?: () => void;
  onCancel?: () => void;
  onViewDetails?: () => void;
  onDownloadCDR?: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'dropdown';
}

export function NumberActions({
  numberId,
  status,
  didId,
  phoneNumber,
  onConfigure,
  onRetry,
  onSuspend,
  onReactivate,
  onCancel,
  onViewDetails,
  onDownloadCDR,
  className = '',
  variant = 'default'
}: NumberActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleAction = async (action: string, callback?: () => void | Promise<void>) => {
    if (!callback) return;
    
    setLoading(action);
    try {
      await callback();
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
    } finally {
      setLoading(null);
      setShowDropdown(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(phoneNumber);
    // You could add a toast notification here
    console.log('Phone number copied to clipboard');
  };

  const isLoading = (action: string) => loading === action;

  // Dropdown variant
  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <Button
          onClick={() => setShowDropdown(!showDropdown)}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>

        {showDropdown && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="py-1">
                {status === 'active' && (
                  <>
                    <button
                      onClick={() => handleAction('configure', onConfigure)}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      disabled={isLoading('configure')}
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      Configure
                    </button>
                    <button
                      onClick={() => handleAction('suspend', onSuspend)}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      disabled={isLoading('suspend')}
                    >
                      <PowerOff className="mr-3 h-4 w-4" />
                      Suspend
                    </button>
                  </>
                )}

                {status === 'suspended' && (
                  <button
                    onClick={() => handleAction('reactivate', onReactivate)}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    disabled={isLoading('reactivate')}
                  >
                    <Power className="mr-3 h-4 w-4" />
                    Reactivate
                  </button>
                )}

                {status === 'failed' && (
                  <button
                    onClick={() => handleAction('retry', onRetry)}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    disabled={isLoading('retry')}
                  >
                    <RefreshCw className="mr-3 h-4 w-4" />
                    Retry Provisioning
                  </button>
                )}

                <button
                  onClick={() => handleAction('view', onViewDetails)}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  disabled={isLoading('view')}
                >
                  <ExternalLink className="mr-3 h-4 w-4" />
                  View Details
                </button>

                <button
                  onClick={copyToClipboard}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Copy className="mr-3 h-4 w-4" />
                  Copy Number
                </button>

                {status === 'active' && onDownloadCDR && (
                  <button
                    onClick={() => handleAction('download', onDownloadCDR)}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    disabled={isLoading('download')}
                  >
                    <Download className="mr-3 h-4 w-4" />
                    Download CDRs
                  </button>
                )}

                {(status === 'active' || status === 'suspended') && (
                  <>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => handleAction('cancel', onCancel)}
                      className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      disabled={isLoading('cancel')}
                    >
                      <Trash2 className="mr-3 h-4 w-4" />
                      Cancel Number
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={`flex gap-1 ${className}`}>
        {status === 'active' && (
          <>
            <Button
              onClick={() => handleAction('configure', onConfigure)}
              variant="ghost"
              size="sm"
              title="Configure"
              disabled={isLoading('configure')}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleAction('view', onViewDetails)}
              variant="ghost"
              size="sm"
              title="View Details"
              disabled={isLoading('view')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </>
        )}

        {status === 'failed' && (
          <Button
            onClick={() => handleAction('retry', onRetry)}
            variant="ghost"
            size="sm"
            title="Retry Provisioning"
            disabled={isLoading('retry')}
          >
            {isLoading('retry') ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        )}

        {status === 'suspended' && (
          <Button
            onClick={() => handleAction('reactivate', onReactivate)}
            variant="ghost"
            size="sm"
            title="Reactivate"
            disabled={isLoading('reactivate')}
          >
            <Power className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // Default variant - full buttons
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {status === 'active' && (
        <>
          <Button
            onClick={() => handleAction('configure', onConfigure)}
            variant="outline"
            size="sm"
            disabled={isLoading('configure')}
          >
            {isLoading('configure') ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Settings className="h-4 w-4 mr-1" />
            )}
            Configure
          </Button>

          <Button
            onClick={() => handleAction('view', onViewDetails)}
            variant="outline"
            size="sm"
            disabled={isLoading('view')}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View Details
          </Button>

          {onSuspend && (
            <Button
              onClick={() => handleAction('suspend', onSuspend)}
              variant="outline"
              size="sm"
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
              disabled={isLoading('suspend')}
            >
              {isLoading('suspend') ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <PowerOff className="h-4 w-4 mr-1" />
              )}
              Suspend
            </Button>
          )}
        </>
      )}

      {status === 'failed' && (
        <Button
          onClick={() => handleAction('retry', onRetry)}
          className="bg-orange-600 hover:bg-orange-700 text-white"
          size="sm"
          disabled={isLoading('retry')}
        >
          {isLoading('retry') ? (
            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Retry Provisioning
        </Button>
      )}

      {status === 'suspended' && (
        <Button
          onClick={() => handleAction('reactivate', onReactivate)}
          className="bg-green-600 hover:bg-green-700 text-white"
          size="sm"
          disabled={isLoading('reactivate')}
        >
          {isLoading('reactivate') ? (
            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Power className="h-4 w-4 mr-1" />
          )}
          Reactivate
        </Button>
      )}

      {status === 'pending' && (
        <Button
          disabled
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
          Pending...
        </Button>
      )}

      {status === 'provisioning' && (
        <Button
          disabled
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
          Provisioning...
        </Button>
      )}

      {status === 'cancelled' && (
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md">
          <AlertCircle className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">Number Cancelled</span>
        </div>
      )}
    </div>
  );
}

// Quick action button component for individual actions
export function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  variant = 'outline',
  className = '',
  disabled = false,
  loading = false
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: 'outline' | 'ghost' | 'default';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      size="sm"
      className={className}
      disabled={disabled || loading}
      title={label}
    >
      {loading ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      <span className="sr-only">{label}</span>
    </Button>
  );
}