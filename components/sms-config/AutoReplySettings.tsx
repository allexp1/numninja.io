'use client'

import React, { useState } from 'react'
import { Switch } from '@headlessui/react'
import { toast } from 'sonner'
import type { SmsConfiguration, SmsConfigurationUpdate } from '@/lib/database.types'

interface AutoReplySettingsProps {
  config: SmsConfiguration
  onUpdate: (updates: SmsConfigurationUpdate) => Promise<void>
}

export default function AutoReplySettings({
  config,
  onUpdate
}: AutoReplySettingsProps) {
  const [enabled, setEnabled] = useState(config.auto_reply_enabled)
  const [message, setMessage] = useState(config.auto_reply_message || '')
  const [saving, setSaving] = useState(false)

  const handleToggle = async () => {
    try {
      setSaving(true)
      const newValue = !enabled
      
      await onUpdate({
        auto_reply_enabled: newValue,
        auto_reply_message: message || null
      })
      
      setEnabled(newValue)
      toast.success(`Auto-reply ${newValue ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error('Error updating auto-reply settings:', error)
      toast.error('Failed to update auto-reply settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMessage = async () => {
    if (enabled && !message.trim()) {
      toast.error('Please enter an auto-reply message')
      return
    }

    try {
      setSaving(true)
      
      await onUpdate({
        auto_reply_enabled: enabled,
        auto_reply_message: message.trim() || null
      })
      
      toast.success('Auto-reply message updated')
    } catch (error) {
      console.error('Error updating auto-reply message:', error)
      toast.error('Failed to update auto-reply message')
    } finally {
      setSaving(false)
    }
  }

  const characterCount = message.length
  const maxCharacters = 160

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-medium text-gray-900">Auto-Reply</h4>
          <p className="mt-1 text-sm text-gray-500">
            Automatically send a reply to incoming messages
          </p>
        </div>
        <Switch
          checked={enabled}
          onChange={handleToggle}
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
        <div className="space-y-3">
          <div>
            <label htmlFor="auto-reply-message" className="block text-sm font-medium text-gray-700 mb-1">
              Auto-Reply Message
            </label>
            <textarea
              id="auto-reply-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={maxCharacters}
              placeholder="Enter the message to send as an auto-reply..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={saving}
            />
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-gray-500">
                This message will be sent automatically to anyone who texts this number
              </span>
              <span className={`${characterCount > maxCharacters * 0.9 ? 'text-orange-600' : 'text-gray-500'}`}>
                {characterCount}/{maxCharacters}
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveMessage}
              disabled={saving || !message.trim()}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Message'}
            </button>
          </div>

          {/* Example messages */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-700 mb-2">Example messages:</p>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>• "Thank you for your message. We'll get back to you shortly."</li>
              <li>• "This number receives texts only. Please call our main line at XXX-XXX-XXXX."</li>
              <li>• "Office hours: Mon-Fri 9am-5pm. We'll respond during business hours."</li>
            </ul>
          </div>
        </div>
      )}

      {/* Warning */}
      {enabled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Auto-reply messages will be sent to every incoming SMS. 
            Use with caution to avoid spam or unwanted messages. Standard SMS rates may apply.
          </p>
        </div>
      )}
    </div>
  )
}