'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import DataTable, { Column } from '@/components/admin/DataTable'
import PriceEditor, { BulkPriceEditor } from '@/components/admin/PriceEditor'
import {
  Hash,
  Download,
  Upload,
  Globe,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Filter,
  Edit
} from 'lucide-react'

interface AreaCode {
  id: string
  country_id: string
  country_name: string
  country_iso: string
  area_code: string
  region: string
  city: string
  base_price: number
  sms_addon_price: number
  voice_price: number
  availability: number
  popular: boolean
  created_at: string
  updated_at: string
}

export default function AreaCodesPage() {
  const [areaCodes, setAreaCodes] = useState<AreaCode[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [selectedCodes, setSelectedCodes] = useState<AreaCode[]>([])
  const [countries, setCountries] = useState<{ id: string; name: string; iso_code: string }[]>([])
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchAreaCodes()
    fetchCountries()
  }, [selectedCountry])

  const fetchCountries = async () => {
    // Mock data for demo
    const mockCountries = [
      { id: '1', name: 'United States', iso_code: 'US' },
      { id: '2', name: 'United Kingdom', iso_code: 'GB' },
      { id: '3', name: 'Canada', iso_code: 'CA' },
      { id: '4', name: 'Germany', iso_code: 'DE' }
    ]
    setCountries(mockCountries)
  }

  const fetchAreaCodes = async () => {
    try {
      // Mock data for demo
      const mockAreaCodes: AreaCode[] = [
        {
          id: '1',
          country_id: '1',
          country_name: 'United States',
          country_iso: 'US',
          area_code: '+1212',
          region: 'New York',
          city: 'New York City',
          base_price: 5.00,
          sms_addon_price: 2.00,
          voice_price: 0.05,
          availability: 150,
          popular: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          country_id: '1',
          country_name: 'United States',
          country_iso: 'US',
          area_code: '+1310',
          region: 'California',
          city: 'Los Angeles',
          base_price: 4.50,
          sms_addon_price: 2.00,
          voice_price: 0.05,
          availability: 200,
          popular: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          country_id: '1',
          country_name: 'United States',
          country_iso: 'US',
          area_code: '+1415',
          region: 'California',
          city: 'San Francisco',
          base_price: 5.50,
          sms_addon_price: 2.50,
          voice_price: 0.05,
          availability: 100,
          popular: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          country_id: '2',
          country_name: 'United Kingdom',
          country_iso: 'GB',
          area_code: '+44207',
          region: 'England',
          city: 'London',
          base_price: 3.00,
          sms_addon_price: 1.50,
          voice_price: 0.04,
          availability: 300,
          popular: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '5',
          country_id: '2',
          country_name: 'United Kingdom',
          country_iso: 'GB',
          area_code: '+44161',
          region: 'England',
          city: 'Manchester',
          base_price: 2.50,
          sms_addon_price: 1.50,
          voice_price: 0.04,
          availability: 250,
          popular: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '6',
          country_id: '3',
          country_name: 'Canada',
          country_iso: 'CA',
          area_code: '+1416',
          region: 'Ontario',
          city: 'Toronto',
          base_price: 4.00,
          sms_addon_price: 1.75,
          voice_price: 0.045,
          availability: 180,
          popular: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      // Filter by country if selected
      const filtered = selectedCountry === 'all' 
        ? mockAreaCodes 
        : mockAreaCodes.filter(ac => ac.country_id === selectedCountry)

      setAreaCodes(filtered)
    } catch (error) {
      console.error('Error fetching area codes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkPriceUpdate = (adjustment: { type: 'fixed' | 'percentage'; value: number }) => {
    if (selectedCodes.length === 0) return

    const updatedCodes = areaCodes.map(code => {
      if (!selectedCodes.find(sc => sc.id === code.id)) return code

      let newBasePrice = code.base_price
      let newSmsPrice = code.sms_addon_price

      if (adjustment.type === 'percentage') {
        const multiplier = 1 + (adjustment.value / 100)
        newBasePrice = Number((code.base_price * multiplier).toFixed(2))
        newSmsPrice = Number((code.sms_addon_price * multiplier).toFixed(2))
      } else {
        newBasePrice = Number((code.base_price + adjustment.value).toFixed(2))
        newSmsPrice = Number((code.sms_addon_price + adjustment.value).toFixed(2))
      }

      return {
        ...code,
        base_price: Math.max(0, newBasePrice),
        sms_addon_price: Math.max(0, newSmsPrice)
      }
    })

    setAreaCodes(updatedCodes)
    setSelectedCodes([])
  }

  const handleExportCSV = () => {
    const csv = [
      'Country,Area Code,Region,City,Base Price,SMS Addon Price,Voice Price,Availability',
      ...areaCodes.map(ac => 
        `${ac.country_name},${ac.area_code},${ac.region},${ac.city},${ac.base_price},${ac.sms_addon_price},${ac.voice_price},${ac.availability}`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `area-codes-${selectedCountry === 'all' ? 'all' : countries.find(c => c.id === selectedCountry)?.iso_code}.csv`
    a.click()
  }

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const lines = text.split('\n')
    const headers = lines[0].split(',')
    
    // Process CSV and update area codes
    // This is simplified for demo
    console.log('Importing CSV:', headers, lines.length - 1, 'rows')
  }

  const columns: Column<AreaCode>[] = [
    {
      key: 'area_code',
      label: 'Area Code',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-gray-400" />
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-gray-500">
              {row.city}, {row.region}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'country_name',
      label: 'Country',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-gray-400" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'base_price',
      label: 'Base Price',
      sortable: true,
      render: (value, row) => (
        <PriceEditor
          value={value}
          onSave={async (newValue) => {
            // Update in database
            // await supabase.from('area_codes').update({ base_price: newValue }).eq('id', row.id)
            
            // Update locally
            setAreaCodes(areaCodes.map(ac => 
              ac.id === row.id ? { ...ac, base_price: newValue } : ac
            ))
          }}
        />
      )
    },
    {
      key: 'sms_addon_price',
      label: 'SMS Addon',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-green-500" />
          <PriceEditor
            value={value}
            onSave={async (newValue) => {
              // Update in database
              // await supabase.from('area_codes').update({ sms_addon_price: newValue }).eq('id', row.id)
              
              // Update locally
              setAreaCodes(areaCodes.map(ac => 
                ac.id === row.id ? { ...ac, sms_addon_price: newValue } : ac
              ))
            }}
          />
        </div>
      )
    },
    {
      key: 'voice_price',
      label: 'Voice (per min)',
      sortable: true,
      render: (value) => (
        <span className="font-medium">${value.toFixed(3)}</span>
      )
    },
    {
      key: 'availability',
      label: 'Available',
      sortable: true,
      render: (value, row) => {
        const percentage = Math.min(100, (value / 300) * 100)
        const color = percentage > 50 ? 'green' : percentage > 20 ? 'yellow' : 'red'
        
        return (
          <div className="space-y-1">
            <span className="text-sm font-medium">{value} numbers</span>
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full bg-${color}-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      }
    },
    {
      key: 'popular',
      label: 'Popular',
      render: (value) => (
        value ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            <TrendingUp className="h-3 w-3" />
            Popular
          </span>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )
      )
    }
  ]

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Area Code Pricing</h1>
          <p className="mt-1 text-sm text-gray-600">Manage base prices and SMS addon prices for area codes</p>
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Country
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Countries</option>
              {countries.map(country => (
                <option key={country.id} value={country.id}>
                  {country.name} ({country.iso_code})
                </option>
              ))}
            </select>
          </div>

          {selectedCodes.length > 0 && (
            <div className="flex items-end">
              <BulkPriceEditor
                onApply={handleBulkPriceUpdate}
                disabled={selectedCodes.length === 0}
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Area Codes</p>
              <p className="mt-1 text-2xl font-semibold">{areaCodes.length}</p>
            </div>
            <Hash className="h-8 w-8 text-blue-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Base Price</p>
              <p className="mt-1 text-2xl font-semibold">
                ${(areaCodes.reduce((sum, ac) => sum + ac.base_price, 0) / areaCodes.length || 0).toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg SMS Addon</p>
              <p className="mt-1 text-2xl font-semibold">
                ${(areaCodes.reduce((sum, ac) => sum + ac.sms_addon_price, 0) / areaCodes.length || 0).toFixed(2)}
              </p>
            </div>
            <MessageSquare className="h-8 w-8 text-purple-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Available</p>
              <p className="mt-1 text-2xl font-semibold">
                {areaCodes.reduce((sum, ac) => sum + ac.availability, 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Area Codes Table */}
      <DataTable
        data={areaCodes}
        columns={columns}
        searchPlaceholder="Search area codes..."
        searchKeys={['area_code', 'city', 'region']}
        selectable
        selectedRows={selectedCodes}
        onSelectionChange={setSelectedCodes}
      />
    </div>
  )
}