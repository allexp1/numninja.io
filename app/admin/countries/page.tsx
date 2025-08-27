'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import DataTable, { Column } from '@/components/admin/DataTable'
import PriceEditor from '@/components/admin/PriceEditor'
import { 
  Globe, 
  Check, 
  X, 
  Edit, 
  Save, 
  Plus,
  FileText,
  MessageSquare,
  Download,
  Upload
} from 'lucide-react'

interface Country {
  id: string
  name: string
  iso_code: string
  sms_enabled: boolean
  voice_enabled: boolean
  document_required: boolean
  document_types: string[]
  active: boolean
  min_price: number
  currency: string
  created_at: string
  updated_at: string
}

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCountry, setEditingCountry] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Country>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCountries, setSelectedCountries] = useState<Country[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchCountries()
  }, [])

  const fetchCountries = async () => {
    try {
      // For demo, using mock data - replace with actual Supabase query
      const mockCountries: Country[] = [
        {
          id: '1',
          name: 'United States',
          iso_code: 'US',
          sms_enabled: true,
          voice_enabled: true,
          document_required: false,
          document_types: [],
          active: true,
          min_price: 3.00,
          currency: 'USD',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'United Kingdom',
          iso_code: 'GB',
          sms_enabled: true,
          voice_enabled: true,
          document_required: false,
          document_types: [],
          active: true,
          min_price: 2.50,
          currency: 'USD',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Canada',
          iso_code: 'CA',
          sms_enabled: true,
          voice_enabled: true,
          document_required: false,
          document_types: [],
          active: true,
          min_price: 3.50,
          currency: 'USD',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Germany',
          iso_code: 'DE',
          sms_enabled: true,
          voice_enabled: true,
          document_required: true,
          document_types: ['Passport', 'National ID'],
          active: true,
          min_price: 4.00,
          currency: 'USD',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '5',
          name: 'France',
          iso_code: 'FR',
          sms_enabled: true,
          voice_enabled: true,
          document_required: true,
          document_types: ['Passport', 'National ID', 'Utility Bill'],
          active: false,
          min_price: 4.50,
          currency: 'USD',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      setCountries(mockCountries)
    } catch (error) {
      console.error('Error fetching countries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (country: Country) => {
    try {
      // Update in database
      // await supabase.from('countries').update({ active: !country.active }).eq('id', country.id)
      
      // Update locally
      setCountries(countries.map(c => 
        c.id === country.id ? { ...c, active: !c.active } : c
      ))
    } catch (error) {
      console.error('Error updating country:', error)
    }
  }

  const handleToggleSMS = async (country: Country) => {
    try {
      // Update in database
      // await supabase.from('countries').update({ sms_enabled: !country.sms_enabled }).eq('id', country.id)
      
      // Update locally
      setCountries(countries.map(c => 
        c.id === country.id ? { ...c, sms_enabled: !c.sms_enabled } : c
      ))
    } catch (error) {
      console.error('Error updating country:', error)
    }
  }

  const handleEditCountry = (country: Country) => {
    setEditingCountry(country.id)
    setEditData({
      document_required: country.document_required,
      document_types: country.document_types
    })
  }

  const handleSaveEdit = async (countryId: string) => {
    try {
      // Update in database
      // await supabase.from('countries').update(editData).eq('id', countryId)
      
      // Update locally
      setCountries(countries.map(c => 
        c.id === countryId ? { ...c, ...editData } : c
      ))
      
      setEditingCountry(null)
      setEditData({})
    } catch (error) {
      console.error('Error updating country:', error)
    }
  }

  const handleExportCSV = () => {
    const csv = [
      'Name,ISO Code,SMS Enabled,Voice Enabled,Document Required,Active,Min Price',
      ...countries.map(c => 
        `${c.name},${c.iso_code},${c.sms_enabled},${c.voice_enabled},${c.document_required},${c.active},${c.min_price}`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'countries.csv'
    a.click()
  }

  const handleBulkToggleActive = async () => {
    if (selectedCountries.length === 0) return

    try {
      // Update in database
      const ids = selectedCountries.map(c => c.id)
      // await supabase.from('countries').update({ active: true }).in('id', ids)
      
      // Update locally
      setCountries(countries.map(c => 
        ids.includes(c.id) ? { ...c, active: true } : c
      ))
      
      setSelectedCountries([])
    } catch (error) {
      console.error('Error updating countries:', error)
    }
  }

  const columns: Column<Country>[] = [
    {
      key: 'name',
      label: 'Country',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-gray-400" />
          <div>
            <div className="font-medium">{row.name}</div>
            <div className="text-xs text-gray-500">{row.iso_code}</div>
          </div>
        </div>
      )
    },
    {
      key: 'sms_enabled',
      label: 'SMS',
      render: (value, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleToggleSMS(row)
          }}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {value ? 'Enabled' : 'Disabled'}
        </button>
      )
    },
    {
      key: 'voice_enabled',
      label: 'Voice',
      render: (value) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {value ? 'Enabled' : 'Disabled'}
        </span>
      )
    },
    {
      key: 'document_required',
      label: 'Documents',
      render: (value, row) => {
        if (editingCountry === row.id) {
          return (
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editData.document_required || false}
                  onChange={(e) => setEditData({ ...editData, document_required: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <span className="text-sm">Required</span>
              </label>
              {editData.document_required && (
                <div className="pl-6">
                  <textarea
                    value={editData.document_types?.join(', ') || ''}
                    onChange={(e) => setEditData({ 
                      ...editData, 
                      document_types: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    placeholder="Passport, National ID, ..."
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    rows={2}
                  />
                </div>
              )}
            </div>
          )
        }
        
        return (
          <div className="flex items-center gap-2">
            <FileText className={`h-4 w-4 ${value ? 'text-yellow-500' : 'text-gray-300'}`} />
            <div>
              <span className="text-sm">{value ? 'Required' : 'Not Required'}</span>
              {value && row.document_types.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {row.document_types.join(', ')}
                </div>
              )}
            </div>
          </div>
        )
      }
    },
    {
      key: 'min_price',
      label: 'Min Price',
      sortable: true,
      render: (value, row) => (
        <PriceEditor
          value={value}
          onSave={async (newValue) => {
            // Update in database
            // await supabase.from('countries').update({ min_price: newValue }).eq('id', row.id)
            
            // Update locally
            setCountries(countries.map(c => 
              c.id === row.id ? { ...c, min_price: newValue } : c
            ))
          }}
          currency={row.currency}
        />
      )
    },
    {
      key: 'active',
      label: 'Status',
      render: (value, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleToggleActive(row)
          }}
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            value 
              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
              : 'bg-red-100 text-red-800 hover:bg-red-200'
          }`}
        >
          {value ? 'Active' : 'Inactive'}
        </button>
      )
    }
  ]

  const actions = (row: Country) => {
    if (editingCountry === row.id) {
      return (
        <button
          onClick={() => handleSaveEdit(row.id)}
          className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
      )
    }

    return (
      <button
        onClick={() => handleEditCountry(row)}
        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
      >
        <Edit className="h-4 w-4" />
        Edit
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Country Management</h1>
          <p className="mt-1 text-sm text-gray-600">Manage country availability, SMS capabilities, and document requirements</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <Upload className="h-4 w-4" />
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={() => {/* Handle import */}} />
          </label>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Country
          </button>
        </div>
      </div>

      {/* Countries Table */}
      <DataTable
        data={countries}
        columns={columns}
        searchPlaceholder="Search countries..."
        searchKeys={['name', 'iso_code']}
        actions={actions}
        selectable
        selectedRows={selectedCountries}
        onSelectionChange={setSelectedCountries}
        bulkActions={
          selectedCountries.length > 0 && (
            <button
              onClick={handleBulkToggleActive}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Activate Selected
            </button>
          )
        }
      />
    </div>
  )
}