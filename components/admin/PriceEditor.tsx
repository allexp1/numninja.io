'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, X, Edit2 } from 'lucide-react'

interface PriceEditorProps {
  value: number
  onSave: (value: number) => Promise<void>
  currency?: string
  disabled?: boolean
  format?: 'currency' | 'decimal'
}

export default function PriceEditor({
  value,
  onSave,
  currency = 'USD',
  disabled = false,
  format = 'currency'
}: PriceEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value.toString())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditValue(value.toString())
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const formatDisplay = (val: number) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val)
    }
    return val.toFixed(2)
  }

  const handleSave = async () => {
    const newValue = parseFloat(editValue)
    
    if (isNaN(newValue) || newValue < 0) {
      setError('Invalid price')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onSave(newValue)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value.toString())
    setIsEditing(false)
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (!isEditing) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="font-medium">{formatDisplay(value)}</span>
        {!disabled && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            title="Edit price"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div className="relative">
        <input
          ref={inputRef}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={saving}
          step="0.01"
          min="0"
          className={`w-32 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {error && (
          <div className="absolute top-full left-0 mt-1 text-xs text-red-600">
            {error}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="p-1 rounded hover:bg-green-100 text-green-600 hover:text-green-700 disabled:opacity-50"
          title="Save"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="p-1 rounded hover:bg-red-100 text-red-600 hover:text-red-700 disabled:opacity-50"
          title="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Bulk price editor for multiple items
interface BulkPriceEditorProps {
  onApply: (adjustment: { type: 'fixed' | 'percentage'; value: number }) => void
  disabled?: boolean
}

export function BulkPriceEditor({ onApply, disabled }: BulkPriceEditorProps) {
  const [adjustmentType, setAdjustmentType] = useState<'fixed' | 'percentage'>('percentage')
  const [adjustmentValue, setAdjustmentValue] = useState('')
  const [showEditor, setShowEditor] = useState(false)

  const handleApply = () => {
    const value = parseFloat(adjustmentValue)
    if (isNaN(value)) return

    onApply({ type: adjustmentType, value })
    setAdjustmentValue('')
    setShowEditor(false)
  }

  if (!showEditor) {
    return (
      <button
        onClick={() => setShowEditor(true)}
        disabled={disabled}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Bulk Price Update
      </button>
    )
  }

  return (
    <div className="inline-flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      <select
        value={adjustmentType}
        onChange={(e) => setAdjustmentType(e.target.value as 'fixed' | 'percentage')}
        className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="percentage">Percentage</option>
        <option value="fixed">Fixed Amount</option>
      </select>
      
      <input
        type="number"
        value={adjustmentValue}
        onChange={(e) => setAdjustmentValue(e.target.value)}
        placeholder={adjustmentType === 'percentage' ? '10' : '5.00'}
        step={adjustmentType === 'percentage' ? '1' : '0.01'}
        className="w-24 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      {adjustmentType === 'percentage' && <span>%</span>}
      
      <button
        onClick={handleApply}
        disabled={!adjustmentValue}
        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        Apply
      </button>
      
      <button
        onClick={() => {
          setShowEditor(false)
          setAdjustmentValue('')
        }}
        className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  )
}