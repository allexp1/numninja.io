'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateEmail } from '@/lib/supabase'
import { authStorage } from '@/lib/auth'

export function SignInForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate email
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    // Validate password
    if (!formData.password) {
      setError('Please enter your password')
      return
    }

    setLoading(true)

    try {
      // Call the signin API
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to sign in')
      } else if (data.session && data.user) {
        // Store tokens and user info in localStorage
        const stored = authStorage.setTokens(
          {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at
          },
          data.user
        )

        if (stored) {
          // Get the redirect URL from query params or default to dashboard
          const params = new URLSearchParams(window.location.search)
          const redirectTo = params.get('redirectTo') || '/dashboard'
          
          // Use router.push for client-side navigation
          router.push(redirectTo)
        } else {
          setError('Failed to store authentication data')
        }
      } else {
        setError('Invalid response from server')
      }
    } catch (err) {
      console.error('Sign in error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Test user helper - for quick testing
  const fillTestUser = () => {
    setFormData({
      email: 'admin@test.com',
      password: 'Test123456'
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
        />
      </div>

      <div className="flex items-center justify-between">
        <a href="/auth/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500">
          Forgot your password?
        </a>
        <button
          type="button"
          onClick={fillTestUser}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Use test credentials
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <p className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <a href="/auth/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
          Sign up
        </a>
      </p>
    </form>
  )
}