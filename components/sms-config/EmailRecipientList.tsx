'use client'

import React, { useState } from 'react'
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { SmsConfigurationService } from '@/lib/sms-config'

interface EmailRecipientListProps {
  configId: string
  recipients: string[]
  onUpdate: (emails: string[]) => Promise<void>
}

export default function EmailRecipientList({
  configId,
  recipients,
  onUpdate
}: EmailRecipientListProps) {
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  const handleAddEmail = async () => {
    if (!newEmail) {
      toast.error('Please enter an email address')
      return
    }

    if (!SmsConfigurationService.validateEmail(newEmail)) {
      toast.error('Please enter a valid email address')
      return
    }

    if (recipients.includes(newEmail)) {
      toast.error('This email is already in the list')
      return
    }

    try {
      setAdding(true)
      const updatedRecipients = [...recipients, newEmail]
      await onUpdate(updatedRecipients)
      setNewEmail('')
      toast.success('Email recipient added')
    } catch (error) {
      console.error('Error adding email recipient:', error)
      toast.error('Failed to add email recipient')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveEmail = async (email: string) => {
    try {
      setRemoving(email)
      const updatedRecipients = recipients.filter(r => r !== email)
      await onUpdate(updatedRecipients)
      toast.success('Email recipient removed')
    } catch (error) {
      console.error('Error removing email recipient:', error)
      toast.error('Failed to remove email recipient')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Recipients
        </label>
        
        {/* Email list */}
        {recipients.length > 0 ? (
          <ul className="space-y-2 mb-4">
            {recipients.map((email) => (
              <li
                key={email}
                className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
              >
                <span className="text-sm text-gray-900">{email}</span>
                <button
                  onClick={() => handleRemoveEmail(email)}
                  disabled={removing === email}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 mb-4">
            No email recipients configured. Add an email address to start receiving SMS forwards.
          </p>
        )}

        {/* Add new email */}
        <div className="flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
            placeholder="Enter email address"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={adding}
          />
          <button
            onClick={handleAddEmail}
            disabled={adding || !newEmail}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-800">
          SMS messages will be forwarded to all configured email addresses.
          Each recipient will receive a copy of incoming messages.
        </p>
      </div>
    </div>
  )
}