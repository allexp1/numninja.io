'use client'

import React, { useState } from 'react'
import { BeakerIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { SmsConfigurationService } from '@/lib/sms-config'
import type { PurchasedNumber } from '@/lib/database.types'

interface SmsTestButtonProps {
  purchasedNumber: PurchasedNumber
  onTestComplete?: () => void
}

export default function SmsTestButton({
  purchasedNumber,
  onTestComplete
}: SmsTestButtonProps) {
  const [testing, setTesting] = useState(false)
  const [showCustomMessage, setShowCustomMessage] = useState(false)
  const [customMessage, setCustomMessage] = useState('')

  const handleSendTest = async () => {
    try {
      setTesting(true)
      
      const message = customMessage.trim() || undefined
      const result = await SmsConfigurationService.sendTestSms(
        purchasedNumber,
        message
      )
      
      if (result.success) {
        toast.success(result.message)
        setShowCustomMessage(false)
        setCustomMessage('')
        onTestComplete?.()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error sending test SMS:', error)
      toast.error('Failed to send test SMS')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-base font-medium text-gray-900 mb-2">Test SMS Forwarding</h4>
        <p className="text-sm text-gray-500 mb-4">
          Send a test SMS to verify your forwarding configuration is working correctly.
        </p>

        {!showCustomMessage ? (
          <div className="flex gap-2">
            <button
              onClick={handleSendTest}
              disabled={testing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BeakerIcon className="h-4 w-4 mr-2" />
              {testing ? 'Sending...' : 'Send Test SMS'}
            </button>
            <button
              onClick={() => setShowCustomMessage(true)}
              disabled={testing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Custom Message
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor="test-message" className="block text-sm font-medium text-gray-700 mb-1">
                Test Message (Optional)
              </label>
              <textarea
                id="test-message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={2}
                placeholder="Enter a custom test message..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={testing}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSendTest}
                disabled={testing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BeakerIcon className="h-4 w-4 mr-2" />
                {testing ? 'Sending...' : 'Send Custom Test'}
              </button>
              <button
                onClick={() => {
                  setShowCustomMessage(false)
                  setCustomMessage('')
                }}
                disabled={testing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Test Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <h5 className="text-sm font-medium text-blue-900 mb-1">What happens when you test:</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• A simulated SMS will be created from +1234567890</li>
          <li>• The SMS will be processed through your filter rules</li>
          <li>• If forwarding is enabled, emails will be sent to all recipients</li>
          <li>• If auto-reply is enabled, a reply will be simulated</li>
          <li>• Check your email and SMS history to verify delivery</li>
        </ul>
      </div>

      {/* Test Results */}
      <div className="text-sm text-gray-600">
        <p>
          <strong>Number:</strong> {purchasedNumber.phone_number}
        </p>
        <p>
          <strong>SMS Status:</strong>{' '}
          <span className={purchasedNumber.sms_enabled ? 'text-green-600' : 'text-gray-500'}>
            {purchasedNumber.sms_enabled ? 'Enabled' : 'Not Enabled'}
          </span>
        </p>
      </div>
    </div>
  )
}