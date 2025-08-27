'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import DataTable, { Column } from '@/components/admin/DataTable'
import {
  ShoppingCart,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Package,
  Eye,
  Download,
  Filter,
  CreditCard,
  RefreshCw,
  TrendingUp,
  User,
  Phone,
  Hash,
  FileText
} from 'lucide-react'

interface Order {
  id: string
  user_id: string
  user_email: string
  user_name: string
  type: 'number_purchase' | 'renewal' | 'addon' | 'forwarding'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  items: OrderItem[]
  subtotal: number
  tax: number
  total: number
  currency: string
  payment_method: string
  payment_intent_id: string | null
  invoice_number: string
  created_at: string
  updated_at: string
  completed_at: string | null
  notes: string | null
}

interface OrderItem {
  id: string
  type: 'number' | 'sms_addon' | 'forwarding'
  description: string
  quantity: number
  unit_price: number
  total: number
  metadata: {
    number?: string
    country?: string
    area_code?: string
    duration_months?: number
  }
}

interface OrderDetailsModal {
  order: Order | null
  isOpen: boolean
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | Order['type']>('all')
  const [dateRange, setDateRange] = useState<'all' | '7days' | '30days' | '90days'>('30days')
  const [modal, setModal] = useState<OrderDetailsModal>({ order: null, isOpen: false })
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchOrders()
  }, [statusFilter, typeFilter, dateRange])

  const fetchOrders = async () => {
    try {
      // Mock data for demo
      const mockOrders: Order[] = [
        {
          id: '1',
          user_id: '1',
          user_email: 'john.doe@example.com',
          user_name: 'John Doe',
          type: 'number_purchase',
          status: 'completed',
          items: [
            {
              id: '1',
              type: 'number',
              description: 'US Phone Number (+1 212-555-0123)',
              quantity: 1,
              unit_price: 5.00,
              total: 5.00,
              metadata: {
                number: '+12125550123',
                country: 'United States',
                area_code: '+1212',
                duration_months: 1
              }
            },
            {
              id: '2',
              type: 'sms_addon',
              description: 'SMS Capability',
              quantity: 1,
              unit_price: 2.00,
              total: 2.00,
              metadata: {}
            }
          ],
          subtotal: 7.00,
          tax: 0.63,
          total: 7.63,
          currency: 'USD',
          payment_method: 'card',
          payment_intent_id: 'pi_1234567890',
          invoice_number: 'INV-2024-001',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          notes: null
        },
        {
          id: '2',
          user_id: '2',
          user_email: 'jane.smith@example.com',
          user_name: 'Jane Smith',
          type: 'renewal',
          status: 'completed',
          items: [
            {
              id: '3',
              type: 'number',
              description: 'UK Phone Number Renewal (+44 207-555-0456)',
              quantity: 1,
              unit_price: 3.00,
              total: 3.00,
              metadata: {
                number: '+442075550456',
                country: 'United Kingdom',
                area_code: '+44207',
                duration_months: 1
              }
            }
          ],
          subtotal: 3.00,
          tax: 0.00,
          total: 3.00,
          currency: 'USD',
          payment_method: 'card',
          payment_intent_id: 'pi_2345678901',
          invoice_number: 'INV-2024-002',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          notes: null
        },
        {
          id: '3',
          user_id: '3',
          user_email: 'bob.wilson@example.com',
          user_name: 'Bob Wilson',
          type: 'number_purchase',
          status: 'pending',
          items: [
            {
              id: '4',
              type: 'number',
              description: 'Canada Phone Number (+1 416-555-0789)',
              quantity: 1,
              unit_price: 4.00,
              total: 4.00,
              metadata: {
                number: '+14165550789',
                country: 'Canada',
                area_code: '+1416',
                duration_months: 1
              }
            }
          ],
          subtotal: 4.00,
          tax: 0.52,
          total: 4.52,
          currency: 'USD',
          payment_method: 'card',
          payment_intent_id: null,
          invoice_number: 'INV-2024-003',
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          completed_at: null,
          notes: 'Awaiting payment confirmation'
        },
        {
          id: '4',
          user_id: '4',
          user_email: 'alice.johnson@example.com',
          user_name: 'Alice Johnson',
          type: 'addon',
          status: 'completed',
          items: [
            {
              id: '5',
              type: 'forwarding',
              description: 'Call Forwarding Setup',
              quantity: 1,
              unit_price: 10.00,
              total: 10.00,
              metadata: {
                number: '+492115550321',
                country: 'Germany'
              }
            }
          ],
          subtotal: 10.00,
          tax: 1.90,
          total: 11.90,
          currency: 'USD',
          payment_method: 'card',
          payment_intent_id: 'pi_3456789012',
          invoice_number: 'INV-2024-004',
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          notes: null
        },
        {
          id: '5',
          user_id: '5',
          user_email: 'test@example.com',
          user_name: 'Test User',
          type: 'number_purchase',
          status: 'failed',
          items: [
            {
              id: '6',
              type: 'number',
              description: 'France Phone Number (+33 1-555-0654)',
              quantity: 1,
              unit_price: 4.50,
              total: 4.50,
              metadata: {
                number: '+3315550654',
                country: 'France',
                area_code: '+331',
                duration_months: 1
              }
            }
          ],
          subtotal: 4.50,
          tax: 0.90,
          total: 5.40,
          currency: 'USD',
          payment_method: 'card',
          payment_intent_id: 'pi_4567890123',
          invoice_number: 'INV-2024-005',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          completed_at: null,
          notes: 'Payment declined - insufficient funds'
        }
      ]

      // Apply filters
      let filtered = mockOrders

      // Status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter(o => o.status === statusFilter)
      }

      // Type filter
      if (typeFilter !== 'all') {
        filtered = filtered.filter(o => o.type === typeFilter)
      }

      // Date range filter
      if (dateRange !== 'all') {
        const now = new Date()
        const daysAgo = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90
        const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(o => new Date(o.created_at) >= cutoff)
      }

      setOrders(filtered)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async (order: Order) => {
    if (!confirm(`Are you sure you want to refund order ${order.invoice_number}?`)) return

    try {
      // Process refund
      // await supabase.from('orders').update({ status: 'refunded' }).eq('id', order.id)
      
      // Update locally
      setOrders(orders.map(o => 
        o.id === order.id ? { ...o, status: 'refunded' as const } : o
      ))
    } catch (error) {
      console.error('Error refunding order:', error)
    }
  }

  const handleExportCSV = () => {
    const csv = [
      'Invoice,Customer,Type,Status,Items,Total,Payment Method,Date',
      ...orders.map(o => 
        `${o.invoice_number},${o.user_email},${o.type},${o.status},${o.items.length},${o.total},${o.payment_method},${o.created_at}`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'orders.csv'
    a.click()
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'refunded':
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: Order['status']) => {
    const statusColors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getTypeBadge = (type: Order['type']) => {
    const typeConfig = {
      number_purchase: { label: 'New Number', color: 'blue' },
      renewal: { label: 'Renewal', color: 'green' },
      addon: { label: 'Add-on', color: 'purple' },
      forwarding: { label: 'Forwarding', color: 'yellow' }
    }

    const config = typeConfig[type]
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
        {config.label}
      </span>
    )
  }

  const columns: Column<Order>[] = [
    {
      key: 'invoice_number',
      label: 'Invoice',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-gray-500">{formatDate(row.created_at)}</div>
        </div>
      )
    },
    {
      key: 'user_email',
      label: 'Customer',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <div>
            <div className="font-medium">{row.user_name}</div>
            <div className="text-xs text-gray-500">{value}</div>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => getTypeBadge(value as Order['type'])
    },
    {
      key: 'items',
      label: 'Items',
      render: (value: OrderItem[]) => (
        <div className="space-y-1">
          {value.slice(0, 2).map((item, idx) => (
            <div key={idx} className="text-sm">
              <div className="flex items-center gap-1">
                {item.type === 'number' && <Phone className="h-3 w-3 text-blue-500" />}
                {item.type === 'sms_addon' && <Hash className="h-3 w-3 text-green-500" />}
                {item.type === 'forwarding' && <RefreshCw className="h-3 w-3 text-purple-500" />}
                <span className="text-gray-700 truncate max-w-[200px]">{item.description}</span>
              </div>
            </div>
          ))}
          {value.length > 2 && (
            <div className="text-xs text-gray-500">+{value.length - 2} more</div>
          )}
        </div>
      )
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (value, row) => (
        <div className="font-medium">
          ${value.toFixed(2)} {row.currency}
        </div>
      )
    },
    {
      key: 'payment_method',
      label: 'Payment',
      render: (value) => (
        <div className="flex items-center gap-1">
          <CreditCard className="h-4 w-4 text-gray-400" />
          <span className="text-sm capitalize">{value}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => getStatusBadge(value as Order['status'])
    }
  ]

  const actions = (row: Order) => (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setModal({ order: row, isOpen: true })}
        className="p-1 rounded hover:bg-gray-100 text-gray-600"
        title="View details"
      >
        <Eye className="h-4 w-4" />
      </button>
      {row.status === 'completed' && (
        <button
          onClick={() => handleRefund(row)}
          className="p-1 rounded hover:bg-gray-100 text-red-600"
          title="Refund order"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Calculate stats
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0)
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const completedOrders = orders.filter(o => o.status === 'completed').length
  const failedOrders = orders.filter(o => o.status === 'failed').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Order Management</h1>
          <p className="mt-1 text-sm text-gray-600">View and manage all customer orders</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="mt-1 text-2xl font-semibold">${totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">This period</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="mt-1 text-2xl font-semibold">{completedOrders}</p>
              <p className="text-xs text-gray-500 mt-1">Orders</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="mt-1 text-2xl font-semibold">{pendingOrders}</p>
              <p className="text-xs text-gray-500 mt-1">Orders</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="mt-1 text-2xl font-semibold">{failedOrders}</p>
              <p className="text-xs text-gray-500 mt-1">Orders</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="number_purchase">New Numbers</option>
              <option value="renewal">Renewals</option>
              <option value="addon">Add-ons</option>
              <option value="forwarding">Forwarding</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <DataTable
        data={orders}
        columns={columns}
        searchPlaceholder="Search orders..."
        searchKeys={['invoice_number', 'user_email', 'user_name']}
        actions={actions}
      />

      {/* Order Details Modal */}
      {modal.isOpen && modal.order && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Order Details</h2>
              <button
                onClick={() => setModal({ order: null, isOpen: false })}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            {/* Order Info */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <p className="text-2xl font-bold">{modal.order.invoice_number}</p>
                  <p className="text-sm text-gray-500">{formatDate(modal.order.created_at)}</p>
                </div>
                {getStatusBadge(modal.order.status)}
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Customer</p>
                  <p className="font-medium">{modal.order.user_name}</p>
                  <p className="text-sm text-gray-500">{modal.order.user_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                  <p className="font-medium capitalize">{modal.order.payment_method}</p>
                  {modal.order.payment_intent_id && (
                    <p className="text-xs text-gray-500">{modal.order.payment_intent_id}</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-medium mb-2">Order Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {modal.order.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2">
                            <div>
                              <p className="text-sm font-medium">{item.description}</p>
                              {item.metadata.number && (
                                <p className="text-xs text-gray-500">{item.metadata.number}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right text-sm">{item.quantity}</td>
                          <td className="px-4 py-2 text-right text-sm">${item.unit_price.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right text-sm font-medium">${item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right text-sm">Subtotal:</td>
                        <td className="px-4 py-2 text-right text-sm font-medium">${modal.order.subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right text-sm">Tax:</td>
                        <td className="px-4 py-2 text-right text-sm font-medium">${modal.order.tax.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right text-sm font-semibold">Total:</td>
                        <td className="px-4 py-2 text-right text-lg font-bold text-blue-600">
                          ${modal.order.total.toFixed(2)} {modal.order.currency}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {modal.order.notes && (
                <div>
                  <h3 className="font-medium mb-2">Notes</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{modal.order.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t flex justify-end gap-2">
                {modal.order.status === 'completed' && (
                  <button
                    onClick={() => {
                      handleRefund(modal.order!)
                      setModal({ order: null, isOpen: false })
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                  >
                    Process Refund
                  </button>
                )}
                <button
                  onClick={() => setModal({ order: null, isOpen: false })}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}