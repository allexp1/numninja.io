'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import DataTable, { Column } from '@/components/admin/DataTable'
import {
  Users,
  Mail,
  Phone,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Ban,
  Download,
  Filter,
  User,
  Activity,
  X
} from 'lucide-react'

interface UserData {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  created_at: string
  last_sign_in: string | null
  email_verified: boolean
  phone_verified: boolean
  status: 'active' | 'suspended' | 'pending'
  numbers_count: number
  total_spent: number
  role: 'user' | 'admin'
  country: string | null
}

interface UserDetailsModal {
  user: UserData | null
  isOpen: boolean
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>('all')
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all')
  const [modal, setModal] = useState<UserDetailsModal>({ user: null, isOpen: false })
  const [selectedUsers, setSelectedUsers] = useState<UserData[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchUsers()
  }, [filter, verificationFilter])

  const fetchUsers = async () => {
    try {
      // Mock data for demo
      const mockUsers: UserData[] = [
        {
          id: '1',
          email: 'john.doe@example.com',
          full_name: 'John Doe',
          phone: '+1234567890',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          last_sign_in: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          email_verified: true,
          phone_verified: true,
          status: 'active',
          numbers_count: 3,
          total_spent: 150.00,
          role: 'user',
          country: 'United States'
        },
        {
          id: '2',
          email: 'jane.smith@example.com',
          full_name: 'Jane Smith',
          phone: '+44987654321',
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          last_sign_in: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          email_verified: true,
          phone_verified: false,
          status: 'active',
          numbers_count: 1,
          total_spent: 50.00,
          role: 'user',
          country: 'United Kingdom'
        },
        {
          id: '3',
          email: 'bob.wilson@example.com',
          full_name: 'Bob Wilson',
          phone: null,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          last_sign_in: null,
          email_verified: false,
          phone_verified: false,
          status: 'pending',
          numbers_count: 0,
          total_spent: 0,
          role: 'user',
          country: null
        },
        {
          id: '4',
          email: 'admin@numninja.io',
          full_name: 'Admin User',
          phone: '+1234567890',
          created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          last_sign_in: new Date().toISOString(),
          email_verified: true,
          phone_verified: true,
          status: 'active',
          numbers_count: 10,
          total_spent: 500.00,
          role: 'admin',
          country: 'United States'
        },
        {
          id: '5',
          email: 'suspended@example.com',
          full_name: 'Suspended User',
          phone: '+1111111111',
          created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          last_sign_in: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          email_verified: true,
          phone_verified: true,
          status: 'suspended',
          numbers_count: 2,
          total_spent: 75.00,
          role: 'user',
          country: 'Canada'
        },
        {
          id: '6',
          email: 'alice.johnson@example.com',
          full_name: 'Alice Johnson',
          phone: '+49123456789',
          created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          last_sign_in: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          email_verified: true,
          phone_verified: true,
          status: 'active',
          numbers_count: 5,
          total_spent: 225.00,
          role: 'user',
          country: 'Germany'
        }
      ]

      // Apply filters
      let filtered = mockUsers
      
      if (filter !== 'all') {
        filtered = filtered.filter(u => u.status === filter)
      }
      
      if (verificationFilter === 'verified') {
        filtered = filtered.filter(u => u.email_verified)
      } else if (verificationFilter === 'unverified') {
        filtered = filtered.filter(u => !u.email_verified)
      }

      setUsers(filtered)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (user: UserData) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active'
    
    try {
      // Update in database
      // await supabase.from('profiles').update({ status: newStatus }).eq('id', user.id)
      
      // Update locally
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, status: newStatus } : u
      ))
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  const handleBulkSuspend = async () => {
    if (selectedUsers.length === 0) return

    try {
      const ids = selectedUsers.map(u => u.id)
      // await supabase.from('profiles').update({ status: 'suspended' }).in('id', ids)
      
      setUsers(users.map(u => 
        ids.includes(u.id) ? { ...u, status: 'suspended' as const } : u
      ))
      
      setSelectedUsers([])
    } catch (error) {
      console.error('Error suspending users:', error)
    }
  }

  const handleExportCSV = () => {
    const csv = [
      'Email,Full Name,Phone,Status,Email Verified,Numbers,Total Spent,Created At,Last Sign In',
      ...users.map(u => 
        `${u.email},${u.full_name || ''},${u.phone || ''},${u.status},${u.email_verified},${u.numbers_count},${u.total_spent},${u.created_at},${u.last_sign_in || ''}`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users.csv'
    a.click()
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never'
    
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
    
    return formatDate(dateString)
  }

  const columns: Column<UserData>[] = [
    {
      key: 'email',
      label: 'User',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            row.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'
          }`}>
            <span className={`text-sm font-medium ${
              row.role === 'admin' ? 'text-purple-600' : 'text-blue-600'
            }`}>
              {row.full_name ? row.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : value[0].toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium">{row.full_name || 'No Name'}</div>
            <div className="text-sm text-gray-500">{value}</div>
            {row.role === 'admin' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium mt-1">
                <Shield className="h-3 w-3" />
                Admin
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const statusConfig = {
          active: { color: 'green', icon: CheckCircle },
          suspended: { color: 'red', icon: XCircle },
          pending: { color: 'yellow', icon: AlertCircle }
        }
        
        const config = statusConfig[value as keyof typeof statusConfig]
        const Icon = config.icon
        
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
            <Icon className="h-3 w-3" />
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        )
      }
    },
    {
      key: 'email_verified',
      label: 'Verification',
      render: (value, row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            {value ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            {row.phone_verified ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
      )
    },
    {
      key: 'numbers_count',
      label: 'Numbers',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-gray-500">${row.total_spent.toFixed(2)} spent</div>
        </div>
      )
    },
    {
      key: 'country',
      label: 'Country',
      render: (value) => (
        <span className="text-sm text-gray-900">{value || 'Unknown'}</span>
      )
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      render: (value) => formatDate(value)
    },
    {
      key: 'last_sign_in',
      label: 'Last Active',
      sortable: true,
      render: (value) => (
        <div className="text-sm">
          <div className="text-gray-900">{formatTimeAgo(value)}</div>
          {value && (
            <div className="text-xs text-gray-500">{formatDate(value)}</div>
          )}
        </div>
      )
    }
  ]

  const actions = (row: UserData) => (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setModal({ user: row, isOpen: true })}
        className="p-1 rounded hover:bg-gray-100 text-gray-600"
        title="View details"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleToggleStatus(row)}
        className={`p-1 rounded hover:bg-gray-100 ${
          row.status === 'active' ? 'text-red-600' : 'text-green-600'
        }`}
        title={row.status === 'active' ? 'Suspend user' : 'Activate user'}
      >
        <Ban className="h-4 w-4" />
      </button>
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
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.status === 'active').length
  const verifiedUsers = users.filter(u => u.email_verified).length
  const totalRevenue = users.reduce((sum, u) => sum + u.total_spent, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-600">View and manage all registered users</p>
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
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="mt-1 text-2xl font-semibold">{totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="mt-1 text-2xl font-semibold">{activeUsers}</p>
              <p className="text-xs text-gray-500 mt-1">
                {((activeUsers / totalUsers) * 100).toFixed(1)}% of total
              </p>
            </div>
            <Activity className="h-8 w-8 text-green-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verified Users</p>
              <p className="mt-1 text-2xl font-semibold">{verifiedUsers}</p>
              <p className="text-xs text-gray-500 mt-1">
                {((verifiedUsers / totalUsers) * 100).toFixed(1)}% verified
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="mt-1 text-2xl font-semibold">${totalRevenue.toFixed(2)}</p>
            </div>
            <Shield className="h-8 w-8 text-yellow-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Filter
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Users</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Filter
            </label>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value as typeof verificationFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Users</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
          </div>

          {selectedUsers.length > 0 && (
            <div className="flex items-end">
              <button
                onClick={handleBulkSuspend}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Suspend Selected ({selectedUsers.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        data={users}
        columns={columns}
        searchPlaceholder="Search users..."
        searchKeys={['email', 'full_name', 'phone']}
        actions={actions}
        selectable
        selectedRows={selectedUsers}
        onSelectionChange={setSelectedUsers}
      />

      {/* User Details Modal */}
      {modal.isOpen && modal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">User Details</h2>
              <button
                onClick={() => setModal({ user: null, isOpen: false })}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{modal.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="font-medium">{modal.user.full_name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{modal.user.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Country</p>
                  <p className="font-medium">{modal.user.country || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium capitalize">{modal.user.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-medium capitalize">{modal.user.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Numbers</p>
                  <p className="font-medium">{modal.user.numbers_count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="font-medium">${modal.user.total_spent.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email Verified</p>
                  <p className="font-medium">{modal.user.email_verified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone Verified</p>
                  <p className="font-medium">{modal.user.phone_verified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Joined</p>
                  <p className="font-medium">{formatDate(modal.user.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Sign In</p>
                  <p className="font-medium">{formatDate(modal.user.last_sign_in)}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  onClick={() => {
                    handleToggleStatus(modal.user!)
                    setModal({ user: null, isOpen: false })
                  }}
                  className={`px-4 py-2 rounded-lg ${
                    modal.user.status === 'active'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {modal.user.status === 'active' ? 'Suspend User' : 'Activate User'}
                </button>
                <button
                  onClick={() => setModal({ user: null, isOpen: false })}
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