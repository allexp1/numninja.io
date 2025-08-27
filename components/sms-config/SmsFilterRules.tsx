'use client'

import React, { useState } from 'react'
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { SmsConfigurationService } from '@/lib/sms-config'
import type { 
  SmsFilterRule, 
  SmsFilterRuleInsert,
  SmsFilterRuleType,
  SmsFilterAction 
} from '@/lib/database.types'

interface SmsFilterRulesProps {
  configId: string
  rules: SmsFilterRule[]
  onUpdate: () => Promise<void>
}

export default function SmsFilterRules({
  configId,
  rules,
  onUpdate
}: SmsFilterRulesProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newRule, setNewRule] = useState<Partial<SmsFilterRuleInsert>>({
    rule_type: 'keyword',
    action: 'forward',
    pattern: '',
    priority: 0,
    enabled: true
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleAddRule = async () => {
    if (!newRule.pattern) {
      toast.error('Please enter a pattern')
      return
    }

    try {
      setSaving(true)
      await SmsConfigurationService.createFilterRule({
        sms_configuration_id: configId,
        rule_type: newRule.rule_type as SmsFilterRuleType,
        action: newRule.action as SmsFilterAction,
        pattern: newRule.pattern,
        priority: newRule.priority || 0,
        enabled: newRule.enabled !== false
      })
      
      toast.success('Filter rule added')
      setShowAddForm(false)
      setNewRule({
        rule_type: 'keyword',
        action: 'forward',
        pattern: '',
        priority: 0,
        enabled: true
      })
      await onUpdate()
    } catch (error) {
      console.error('Error adding filter rule:', error)
      toast.error('Failed to add filter rule')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleRule = async (rule: SmsFilterRule) => {
    try {
      await SmsConfigurationService.updateFilterRule(rule.id, {
        enabled: !rule.enabled
      })
      toast.success(`Rule ${!rule.enabled ? 'enabled' : 'disabled'}`)
      await onUpdate()
    } catch (error) {
      console.error('Error toggling rule:', error)
      toast.error('Failed to update rule')
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    try {
      setDeleting(ruleId)
      await SmsConfigurationService.deleteFilterRule(ruleId)
      toast.success('Filter rule deleted')
      await onUpdate()
    } catch (error) {
      console.error('Error deleting rule:', error)
      toast.error('Failed to delete rule')
    } finally {
      setDeleting(null)
    }
  }

  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case 'keyword':
        return 'Keyword'
      case 'sender':
        return 'Sender'
      case 'blacklist':
        return 'Blacklist'
      default:
        return type
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'forward':
        return 'Forward'
      case 'block':
        return 'Block'
      case 'auto_reply':
        return 'Auto Reply'
      default:
        return action
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">Filter Rules</h4>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-3 w-3 mr-1" />
          Add Rule
        </button>
      </div>

      {/* Add Rule Form */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Rule Type
              </label>
              <select
                value={newRule.rule_type}
                onChange={(e) => setNewRule({ ...newRule, rule_type: e.target.value as SmsFilterRuleType })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="keyword">Keyword</option>
                <option value="sender">Sender</option>
                <option value="blacklist">Blacklist</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                value={newRule.action}
                onChange={(e) => setNewRule({ ...newRule, action: e.target.value as SmsFilterAction })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="forward">Forward</option>
                <option value="block">Block</option>
                <option value="auto_reply">Auto Reply</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Pattern {newRule.rule_type === 'keyword' ? '(keyword to match)' : newRule.rule_type === 'sender' ? '(phone number)' : '(phone number to block)'}
            </label>
            <input
              type="text"
              value={newRule.pattern}
              onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
              placeholder={
                newRule.rule_type === 'keyword' 
                  ? 'Enter keyword' 
                  : 'Enter phone number'
              }
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Priority (lower number = higher priority)
            </label>
            <input
              type="number"
              value={newRule.priority}
              onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) || 0 })}
              min="0"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rule-enabled"
              checked={newRule.enabled}
              onChange={(e) => setNewRule({ ...newRule, enabled: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="rule-enabled" className="text-sm text-gray-700">
              Enable rule immediately
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddRule}
              disabled={saving || !newRule.pattern}
              className="flex-1 inline-flex justify-center items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Rule'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false)
                setNewRule({
                  rule_type: 'keyword',
                  action: 'forward',
                  pattern: '',
                  priority: 0,
                  enabled: true
                })
              }}
              className="flex-1 inline-flex justify-center items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      {rules.length > 0 ? (
        <div className="space-y-2">
          {rules.sort((a, b) => a.priority - b.priority).map((rule) => (
            <div
              key={rule.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                rule.enabled 
                  ? 'bg-white border-gray-200' 
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {getRuleTypeLabel(rule.rule_type)}
                  </span>
                  <span className="font-mono text-gray-900">{rule.pattern}</span>
                  <span className="text-gray-500">→</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    rule.action === 'block' 
                      ? 'bg-red-100 text-red-800'
                      : rule.action === 'auto_reply'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {getActionLabel(rule.action)}
                  </span>
                  <span className="text-xs text-gray-500">
                    Priority: {rule.priority}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleRule(rule)}
                  className={`text-sm ${
                    rule.enabled ? 'text-gray-600 hover:text-gray-800' : 'text-blue-600 hover:text-blue-800'
                  }`}
                >
                  {rule.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  disabled={deleting === rule.id}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          No filter rules configured. Add rules to filter incoming messages.
        </p>
      )}

      {/* Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
        <p className="text-xs text-gray-600">
          Rules are evaluated in priority order (lowest number first). 
          The first matching rule determines the action taken.
        </p>
      </div>
    </div>
  )
}