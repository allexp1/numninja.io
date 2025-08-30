'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, ChatBubbleLeftRightIcon, FunnelIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase-client'
import { SmsConfigurationService } from '@/lib/sms-config'
import { toast } from 'sonner'
import type { PurchasedNumber, SMSRecord, SmsForwardingLog, SmsAutoReplyLog } from '@/lib/database.types'

interface SmsHistoryPageProps {
  params: {
    number: string
  }
}

interface SMSRecordWithLogs extends SMSRecord {
  forwarding_logs?: SmsForwardingLog[]
  auto_reply_logs?: SmsAutoReplyLog[]
}

export default function SmsHistoryPage({ params }: SmsHistoryPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [purchasedNumber, setPurchasedNumber] = useState<PurchasedNumber | null>(null)
  const [smsRecords, setSmsRecords] = useState<SMSRecordWithLogs[]>([])
  const [filteredRecords, setFilteredRecords] = useState<SMSRecordWithLogs[]>([])
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [senderFilter, setSenderFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [resending, setResending] = useState<string | null>(null)

  useEffect(() => {
    loadSmsHistory()
  }, [params.number])

  useEffect(() => {
    applyFilters()
  }, [smsRecords, startDate, endDate, senderFilter, searchQuery])

  const loadSmsHistory = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/auth/signin')
        return
      }

      // Load purchased number details
      const { data: numberData, error: numberError } = await supabase
        .from('purchased_numbers')
        .select('*')
        .eq('phone_number', decodeURIComponent(params.number))
        .eq('user_id', user.id)
        .single()

      if (numberError || !numberData) {
        console.error('Error loading number:', numberError)
        router.push('/my-numbers')
        return
      }

      setPurchasedNumber(numberData)

      // Load SMS history with logs
      const smsHistory = await SmsConfigurationService.getSmsHistory(
        (numberData as PurchasedNumber).id,
        {
          limit: 100 // Load last 100 SMS messages
        }
      )

      setSmsRecords(smsHistory)
    } catch (error) {
      console.error('Error loading SMS history:', error)
      toast.error('Failed to load SMS history')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...smsRecords]

    // Date filter
    if (startDate) {
      filtered = filtered.filter(record => 
        new Date(record.created_at) >= new Date(startDate)
      )
    }
    if (endDate) {
      filtered = filtered.filter(record => 
        new Date(record.created_at) <= new Date(endDate + 'T23:59:59')
      )
    }

    // Sender filter
    if (senderFilter) {
      filtered = filtered.filter(record => 
        record.from_number?.includes(senderFilter)
      )
    }

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(record => 
        record.message?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredRecords(filtered)
  }

  const handleResendForward = async (logId: string) => {
    try {
      setResending(logId)
      await SmsConfigurationService.resendFailedForward(logId)
      toast.success('Email forward resent successfully')
      await loadSmsHistory()
    } catch (error) {
      console.error('Error resending forward:', error)
      toast.error('Failed to resend forward')
    } finally {
      setResending(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getForwardingStatus = (logs?: SmsForwardingLog[]) => {
    if (!logs || logs.length === 0) return 'not_forwarded'
    
    const hasFailure = logs.some(log => log.status === 'failed')
    const hasPending = logs.some(log => log.status === 'pending')
    const allSent = logs.every(log => log.status === 'sent')
    
    if (hasFailure) return 'failed'
    if (hasPending) return 'pending'
    if (allSent) return 'sent'
    return 'unknown'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!purchasedNumber) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Number not found</p>
            <Link 
              href="/my-numbers"
              className="mt-2 inline-flex items-center text-sm text-red-600 hover:text-red-800"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to My Numbers
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/my-numbers"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to My Numbers
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SMS History</h1>
              <p className="mt-1 text-sm text-gray-500">
                View all SMS messages for {purchasedNumber.phone_number}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              <button
                onClick={loadSmsHistory}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Messages</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sender Number
                </label>
                <input
                  type="text"
                  value={senderFilter}
                  onChange={(e) => setSenderFilter(e.target.value)}
                  placeholder="Filter by sender..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Content
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
            {(startDate || endDate || senderFilter || searchQuery) && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setStartDate('')
                    setEndDate('')
                    setSenderFilter('')
                    setSearchQuery('')
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* SMS List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Messages ({filteredRecords.length})
            </h2>
          </div>
          
          {filteredRecords.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredRecords.map((record) => {
                const forwardingStatus = getForwardingStatus(record.forwarding_logs)
                const hasAutoReply = record.auto_reply_logs && record.auto_reply_logs.length > 0
                
                return (
                  <div key={record.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            From: {record.from_number || 'Unknown'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(record.created_at)}
                          </span>
                          {record.direction === 'outbound' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Outbound
                            </span>
                          )}
                        </div>
                        
                        <div className="bg-gray-50 rounded-md p-3 mb-3">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {record.message || 'No message content'}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs">
                          {/* Forwarding Status */}
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">Forwarding:</span>
                            {forwardingStatus === 'sent' && (
                              <span className="text-green-600">✓ Sent to {record.forwarding_logs?.length || 0} recipient(s)</span>
                            )}
                            {forwardingStatus === 'failed' && (
                              <span className="text-red-600">✗ Failed</span>
                            )}
                            {forwardingStatus === 'pending' && (
                              <span className="text-yellow-600">⏳ Pending</span>
                            )}
                            {forwardingStatus === 'not_forwarded' && (
                              <span className="text-gray-400">Not forwarded</span>
                            )}
                          </div>
                          
                          {/* Auto-reply Status */}
                          {hasAutoReply && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Auto-reply:</span>
                              <span className="text-green-600">✓ Sent</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Failed forwards - show resend option */}
                        {record.forwarding_logs?.some(log => log.status === 'failed') && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-red-600 mb-2">
                              Failed to forward to some recipients:
                            </p>
                            {record.forwarding_logs
                              .filter(log => log.status === 'failed')
                              .map(log => (
                                <div key={log.id} className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-gray-600">
                                    {log.email_recipient}: {log.error_message || 'Unknown error'}
                                  </span>
                                  <button
                                    onClick={() => handleResendForward(log.id)}
                                    disabled={resending === log.id}
                                    className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                  >
                                    {resending === log.id ? 'Resending...' : 'Resend'}
                                  </button>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No messages</h3>
              <p className="mt-1 text-sm text-gray-500">
                {smsRecords.length > 0 
                  ? 'No messages match your filters.'
                  : 'No SMS messages have been received yet.'}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <Link
            href={`/my-numbers/${params.number}/sms-settings`}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Configure SMS Settings
          </Link>
          
          <Link
            href={`/my-numbers/${params.number}/cdr`}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View Call Records
          </Link>
        </div>
      </div>
    </div>
  )
}