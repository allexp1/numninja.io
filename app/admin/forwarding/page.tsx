'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import DataTable, { Column } from '@/components/admin/DataTable'
import PriceEditor, { BulkPriceEditor } from '@/components/admin/PriceEditor'
import {
  ArrowRightLeft,
  Phone,
  Smartphone,
  Globe,
  Download,
  Upload,
  DollarSign,
  TrendingUp,
  Edit,
  Save,
  X
} from 'lucide-react'

interface ForwardingPrice {
  id: string
  country_id: string
  country_name: string
  country_iso: string
  mobile_price: number
  landline_price: number
  toll_free_price: number
  local_price: number
  international_price: number
  sms_forwarding_price: number
  currency: string
  active: boolean
  created_at: string
  updated_at: string
}

export default function ForwardingPricesPage() {
  const [forwardingPrices, setForwardingPrices] = useState<ForwardingPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPrices, setSelectedPrices] = useState<ForwardingPrice[]>([])
  const [editingRow, setEditingRow] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<ForwardingPrice>>({})
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchForwardingPrices()
  }, [filter])

  const fetchForwardingPrices = async () => {
    try {
      // Mock data for demo
      const mockPrices: ForwardingPrice[] = [
        {
          id: '1',
          country_id: '1',
          country_name: 'United States',
          country_iso: 'US',
          mobile_price: 0.08,
          landline_price: 0.04,
          toll_free_price: 0.06,
          local_price: 0.03,
          international_price: 0.15,
          sms_forwarding_price: 0.05,
          currency: 'USD',
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          country_id: '2',
          country_name: 'United Kingdom',
          country_iso: 'GB',
          mobile_price: 0.07,
          landline_price: 0.03,
          toll_free_price: 0.05,
          local_price: 0.025,
          international_price: 0.12,
          sms_forwarding_price: 0.04,
          currency: 'USD',
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          country_id: '3',
          country_name: 'Canada',
          country_iso: 'CA',
          mobile_price: 0.09,
          landline_price: 0.045,
          toll_free_price: 0.065,
          local_price: 0.035,
          international_price: 0.14,
          sms_forwarding_price: 0.045,
          currency: 'USD',
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          country_id: '4',
          country_name: 'Germany',
          country_iso: 'DE',
          mobile_price: 0.10,
          landline_price: 0.05,
          toll_free_price: 0.07,
          local_price: 0.04,
          international_price: 0.16,
          sms_forwarding_price: 0.06,
          currency: 'USD',
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '5',
          country_id: '5',
          country_name: 'France',
          country_iso: 'FR',
          mobile_price: 0.11,
          landline_price: 0.055,
          toll_free_price: 0.075,
          local_price: 0.045,
          international_price: 0.17,
          sms_forwarding_price: 0.065,
          currency: 'USD',
          active: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '6',
          country_id: '6',
          country_name: 'Australia',
          country_iso: 'AU',
          mobile_price: 0.12,
          landline_price: 0.06,
          toll_free_price: 0.08,
          local_price: 0.05,
          international_price: 0.18,
          sms_forwarding_price: 0.07,
          currency: 'USD',
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      // Apply filter
      let filtered = mockPrices
      if (filter === 'active') {
        filtered = mockPrices.filter(p => p.active)
      } else if (filter === 'inactive') {
        filtered = mockPrices.filter(p => !p.active)
      }

      setForwardingPrices(filtered)
    } catch (error) {
      console.error('Error fetching forwarding prices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkPriceUpdate = (adjustment: { type: 'fixed' | 'percentage'; value: number }) => {
    if (selectedPrices.length === 0) return

    const updatedPrices = forwardingPrices.map(price => {
      if (!selectedPrices.find(sp => sp.id === price.id)) return price

      const updatePrice = (originalPrice: number) => {
        if (adjustment.type === 'percentage') {
          return Number((originalPrice * (1 + adjustment.value / 100)).toFixed(3))
        } else {
          return Number((originalPrice + adjustment.value).toFixed(3))
        }
      }

      return {
        ...price,
        mobile_price: Math.max(0, updatePrice(price.mobile_price)),
        landline_price: Math.max(0, updatePrice(price.landline_price)),
        toll_free_price: Math.max(0, updatePrice(price.toll_free_price)),
        local_price: Math.max(0, updatePrice(price.local_price)),
        international_price: Math.max(0, updatePrice(price.international_price)),
        sms_forwarding_price: Math.max(0, updatePrice(price.sms_forwarding_price))
      }
    })

    setForwardingPrices(updatedPrices)
    setSelectedPrices([])
  }

  const handleEditRow = (price: ForwardingPrice) => {
    setEditingRow(price.id)
    setEditData({
      mobile_price: price.mobile_price,
      landline_price: price.landline_price,
      toll_free_price: price.toll_free_price,
      local_price: price.local_price,
      international_price: price.international_price,
      sms_forwarding_price: price.sms_forwarding_price
    })
  }

  const handleSaveRow = async (priceId: string) => {
    try {
      // Update in database
      // await supabase.from('forwarding_prices').update(editData).eq('id', priceId)
      
      // Update locally
      setForwardingPrices(forwardingPrices.map(p => 
        p.id === priceId ? { ...p, ...editData } : p
      ))
      
      setEditingRow(null)
      setEditData({})
    } catch (error) {
      console.error('Error updating price:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingRow(null)
    setEditData({})
  }

  const handleExportCSV = () => {
    const csv = [
      'Country,ISO,Mobile,Landline,Toll Free,Local,International,SMS Forwarding,Active',
      ...forwardingPrices.map(p => 
        `${p.country_name},${p.country_iso},${p.mobile_price},${p.landline_price},${p.toll_free_price},${p.local_price},${p.international_price},${p.sms_forwarding_price},${p.active}`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'forwarding-prices.csv'
    a.click()
  }

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const lines = text.split('\n')
    const headers = lines[0].split(',')
    
    // Process CSV and update prices
    console.log('Importing CSV:', headers, lines.length - 1, 'rows')
  }

  const columns: Column<ForwardingPrice>[] = [
    {
      key: 'country_name',
      label: 'Country',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-gray-400" />
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-gray-500">{row.country_iso}</div>
          </div>
        </div>
      )
    },
    {
      key: 'mobile_price',
      label: 'Mobile',
      sortable: true,
      render: (value, row) => {
        if (editingRow === row.id) {
          return (
            <div className="flex items-center gap-1">
              <Smartphone className="h-4 w-4 text-blue-500" />
              <input
                type="number"
                value={editData.mobile_price || 0}
                onChange={(e) => setEditData({ ...editData, mobile_price: parseFloat(e.target.value) })}
                step="0.001"
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          )
        }
        return (
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-blue-500" />
            <PriceEditor
              value={value}
              format="decimal"
              onSave={async (newValue) => {
                setForwardingPrices(forwardingPrices.map(p => 
                  p.id === row.id ? { ...p, mobile_price: newValue } : p
                ))
              }}
            />
          </div>
        )
      }
    },
    {
      key: 'landline_price',
      label: 'Landline',
      sortable: true,
      render: (value, row) => {
        if (editingRow === row.id) {
          return (
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4 text-green-500" />
              <input
                type="number"
                value={editData.landline_price || 0}
                onChange={(e) => setEditData({ ...editData, landline_price: parseFloat(e.target.value) })}
                step="0.001"
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          )
        }
        return (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-green-500" />
            <PriceEditor
              value={value}
              format="decimal"
              onSave={async (newValue) => {
                setForwardingPrices(forwardingPrices.map(p => 
                  p.id === row.id ? { ...p, landline_price: newValue } : p
                ))
              }}
            />
          </div>
        )
      }
    },
    {
      key: 'toll_free_price',
      label: 'Toll Free',
      sortable: true,
      render: (value, row) => {
        if (editingRow === row.id) {
          return (
            <input
              type="number"
              value={editData.toll_free_price || 0}
              onChange={(e) => setEditData({ ...editData, toll_free_price: parseFloat(e.target.value) })}
              step="0.001"
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          )
        }
        return <span className="font-medium">${value.toFixed(3)}</span>
      }
    },
    {
      key: 'local_price',
      label: 'Local',
      sortable: true,
      render: (value, row) => {
        if (editingRow === row.id) {
          return (
            <input
              type="number"
              value={editData.local_price || 0}
              onChange={(e) => setEditData({ ...editData, local_price: parseFloat(e.target.value) })}
              step="0.001"
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          )
        }
        return <span className="font-medium">${value.toFixed(3)}</span>
      }
    },
    {
      key: 'international_price',
      label: 'Int\'l',
      sortable: true,
      render: (value, row) => {
        if (editingRow === row.id) {
          return (
            <input
              type="number"
              value={editData.international_price || 0}
              onChange={(e) => setEditData({ ...editData, international_price: parseFloat(e.target.value) })}
              step="0.001"
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          )
        }
        return <span className="font-medium">${value.toFixed(3)}</span>
      }
    },
    {
      key: 'sms_forwarding_price',
      label: 'SMS',
      sortable: true,
      render: (value, row) => {
        if (editingRow === row.id) {
          return (
            <input
              type="number"
              value={editData.sms_forwarding_price || 0}
              onChange={(e) => setEditData({ ...editData, sms_forwarding_price: parseFloat(e.target.value) })}
              step="0.001"
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          )
        }
        return <span className="font-medium">${value.toFixed(3)}</span>
      }
    },
    {
      key: 'active',
      label: 'Status',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ]

  const actions = (row: ForwardingPrice) => {
    if (editingRow === row.id) {
      return (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleSaveRow(row.id)}
            className="p-1 rounded hover:bg-green-100 text-green-600"
            title="Save"
          >
            <Save className="h-4 w-4" />
          </button>
          <button
            onClick={handleCancelEdit}
            className="p-1 rounded hover:bg-red-100 text-red-600"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )
    }

    return (
      <button
        onClick={() => handleEditRow(row)}
        className="p-1 rounded hover:bg-gray-100 text-gray-600"
        title="Edit all prices"
      >
        <Edit className="h-4 w-4" />
      </button>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Calculate statistics
  const avgMobilePrice = forwardingPrices.reduce((sum, p) => sum + p.mobile_price, 0) / forwardingPrices.length || 0
  const avgLandlinePrice = forwardingPrices.reduce((sum, p) => sum + p.landline_price, 0) / forwardingPrices.length || 0
  const activeCountries = forwardingPrices.filter(p => p.active).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Forwarding Prices</h1>
          <p className="mt-1 text-sm text-gray-600">Manage call and SMS forwarding prices per country</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <Upload className="h-4 w-4" />
            Import
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleImportCSV}
            />
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Countries</p>
              <p className="mt-1 text-2xl font-semibold">{activeCountries}</p>
            </div>
            <Globe className="h-8 w-8 text-blue-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Mobile Price</p>
              <p className="mt-1 text-2xl font-semibold">${avgMobilePrice.toFixed(3)}</p>
              <p className="text-xs text-gray-500 mt-1">per minute</p>
            </div>
            <Smartphone className="h-8 w-8 text-purple-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Landline Price</p>
              <p className="mt-1 text-2xl font-semibold">${avgLandlinePrice.toFixed(3)}</p>
              <p className="text-xs text-gray-500 mt-1">per minute</p>
            </div>
            <Phone className="h-8 w-8 text-green-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Countries</p>
              <p className="mt-1 text-2xl font-semibold">{forwardingPrices.length}</p>
            </div>
            <ArrowRightLeft className="h-8 w-8 text-yellow-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Countries</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {selectedPrices.length > 0 && (
            <div className="flex items-end">
              <BulkPriceEditor
                onApply={handleBulkPriceUpdate}
                disabled={selectedPrices.length === 0}
              />
            </div>
          )}
        </div>
      </div>

      {/* Prices Table */}
      <DataTable
        data={forwardingPrices}
        columns={columns}
        searchPlaceholder="Search countries..."
        searchKeys={['country_name', 'country_iso']}
        actions={actions}
        selectable
        selectedRows={selectedPrices}
        onSelectionChange={setSelectedPrices}
      />
    </div>
  )
}