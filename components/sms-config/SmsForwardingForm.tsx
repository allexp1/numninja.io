'use client'

import React, { useState, useEffect } from 'react'
import { Switch } from '@headlessui/react'
import { toast } from 'sonner'
import { SmsConfigurationService } from '@/lib/sms-config'
import type { 
  PurchasedNumber, 
  SmsConfiguration,
  SmsConfigurationWithRules 
} from '@/lib/database.types'
import EmailRecipientList from './EmailRecipientList'
import SmsFilterRules from './SmsFilterRules'
import AutoReplySettings from './AutoReplySettings'
import SmsTestButton from './SmsTestButton'

interface SmsForwardingFormProps {
  purchasedNumber: PurchasedNumber
  onUpdate?: () => void
}

export default function SmsForwardingForm({ 
  purchasedNumber, 
  onUpdate 
}: SmsForwardingFormProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<SmsConfigurationWithRules | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [filterEnabled, setFilterEnabled] = useState(false)

  useEffect(() => {
    loadConfiguration()
  }, [purchasedNumber.id])

  const loadConfiguration = async () => {
    try {
      setLoading(true)
      const data = await SmsConfigurationService.getConfigurationWithRules(purchasedNumber.id)
      if (data) {
        setConfig(data)
        setEnabled(data.enabled)
        setFilterEnabled(data.filter_enabled)
      }
    } catch (error) {
      console.error('Error loading SMS configuration:', error)
      toast.error('Failed to load SMS configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnabled = async () => {
    try {
      setSaving(true)
      const newValue = !enabled
      
      const updatedConfig = await SmsConfigurationService.upsertConfiguration(
        purchasedNumber.id,
        {
          enabled: newValue,
          forward_to_emails: config?.forward_to_emails || [],
          filter_enabled: filterEnabled,
        }
      )
      
      setEnabled(newValue)
      setConfig(prev => prev ? { ...prev, ...updatedConfig } : updatedConfig as SmsConfigurationWithRules)
      toast.success(`SMS forwarding ${newValue ? 'enabled' : 'disabled'}`)
      onUpdate?.()
    } catch (error) {
      console.error('Error updating SMS configuration:', error)
      toast.error('Failed to update SMS configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleFilters = async () => {
    try {
      setSaving(true)
      const newValue = !filterEnabled
      
      const updatedConfig = await SmsConfigurationService.upsertConfiguration(
        purchasedNumber.id,
        {
          enabled,
          forward_to_emails: config?.forward_to_emails || [],
          filter_enabled: newValue,
        }
      )
      
      setFilterEnabled(newValue)
      setConfig(prev => prev ? { ...prev, ...updatedConfig } : updatedConfig as SmsConfigurationWithRules)
      toast.success(`SMS filters ${newValue ? 'enabled' : 'disabled'}`)
      onUpdate?.()
    } catch (error) {
      console.error('Error updating SMS configuration:', error)
      toast.error('Failed to update SMS configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleConfigUpdate = async (updates: Partial<SmsConfiguration>) => {
    if (!config) return
    
    try {
      const updatedConfig = await SmsConfigurationService.updateConfiguration(
        config.id,
        updates
      )
      setConfig(prev => prev ? { ...prev, ...updatedConfig } : updatedConfig as SmsConfigurationWithRules)
      onUpdate?.()
    } catch (error) {
      console.error('Error updating configuration:', error)
      throw error
    }
  }

  // Check eligibility for SMS
  const eligibility = SmsConfigurationService.validateSmsEligibility(purchasedNumber)

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (!eligibility.eligible) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800">SMS Not Available</h3>
        <p className="mt-1 text-sm text-yellow-700">{eligibility.reason}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* SMS Forwarding Toggle */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">SMS Forwarding</h3>
            <p className="mt-1 text-sm text-gray-500">
              Forward incoming SMS messages to email addresses
            </p>
          </div>
          <Switch
            checked={enabled}
            onChange={handleToggleEnabled}
            disabled={saving}
            className={`${
              enabled ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                enabled ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>

        {enabled && (
          <div className="mt-6 space-y-6">
            {/* Email Recipients */}
            <EmailRecipientList
              configId={config?.id || ''}
              recipients={config?.forward_to_emails || []}
              onUpdate={(emails) => handleConfigUpdate({ forward_to_emails: emails })}
            />

            {/* Filter Settings */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-base font-medium text-gray-900">Message Filters</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Apply rules to filter incoming messages
                  </p>
                </div>
                <Switch
                  checked={filterEnabled}
                  onChange={handleToggleFilters}
                  disabled={saving}
                  className={`${
                    filterEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      filterEnabled ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>

              {filterEnabled && config && (
                <SmsFilterRules
                  configId={config.id}
                  rules={config.filter_rules || []}
                  onUpdate={loadConfiguration}
                />
              )}
            </div>

            {/* Auto-Reply Settings */}
            <div className="border-t pt-6">
              {config && (
                <AutoReplySettings
                  config={config}
                  onUpdate={(updates) => handleConfigUpdate(updates)}
                />
              )}
            </div>

            {/* Test SMS */}
            <div className="border-t pt-6">
              <SmsTestButton
                purchasedNumber={purchasedNumber}
                onTestComplete={loadConfiguration}
              />
            </div>
          </div>
        )}
      </div>

      {/* Pricing Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900">SMS Pricing</h4>
        <p className="mt-1 text-sm text-gray-600">
          SMS service requires a 6-month minimum commitment
        </p>
        {purchasedNumber.sms_enabled && (
          <p className="mt-2 text-sm text-green-600">
            ✓ SMS service is active for this number
          </p>
        )}
      </div>
    </div>
  )
}