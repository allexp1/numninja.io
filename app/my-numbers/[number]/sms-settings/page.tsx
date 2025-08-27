'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, EnvelopeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import SmsForwardingForm from '@/components/sms-config/SmsForwardingForm'
import type { PurchasedNumber, Country, AreaCode } from '@/lib/database.types'

interface SmsSettingsPageProps {
  params: {
    number: string
  }
}

export default function SmsSettingsPage({ params }: SmsSettingsPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [purchasedNumber, setPurchasedNumber] = useState<PurchasedNumber | null>(null)
  const [country, setCountry] = useState<Country | null>(null)
  const [areaCode, setAreaCode] = useState<AreaCode | null>(null)

  useEffect(() => {
    loadNumberDetails()
  }, [params.number])

  const loadNumberDetails = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/auth/signin')
        return
      }

      // Load purchased number details
      const { data: numberData, error: numberError } = await supabase
        .from('purchased_numbers')
        .select('*')
        .eq('phone_number', decodeURIComponent(params.number))
        .eq('user_id', user.id)
        .single()

      if (numberError || !numberData) {
        console.error('Error loading number:', numberError)
        router.push('/my-numbers')
        return
      }

      setPurchasedNumber(numberData)

      // Load country details
      const { data: countryData } = await supabase
        .from('countries')
        .select('*')
        .eq('id', (numberData as PurchasedNumber).country_id)
        .single()
      
      if (countryData) {
        setCountry(countryData)
      }

      // Load area code details
      const { data: areaCodeData } = await supabase
        .from('area_codes')
        .select('*')
        .eq('id', (numberData as PurchasedNumber).area_code_id)
        .single()
      
      if (areaCodeData) {
        setAreaCode(areaCodeData)
      }
    } catch (error) {
      console.error('Error loading number details:', error)
      router.push('/my-numbers')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!purchasedNumber) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Number not found</p>
            <Link 
              href="/my-numbers"
              className="mt-2 inline-flex items-center text-sm text-red-600 hover:text-red-800"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to My Numbers
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/my-numbers"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to My Numbers
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SMS Settings</h1>
              <p className="mt-1 text-sm text-gray-500">
                Configure SMS forwarding and auto-reply for {purchasedNumber.phone_number}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Number Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Phone Number</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {purchasedNumber.phone_number}
              </p>
              {purchasedNumber.display_name && (
                <p className="text-sm text-gray-600">{purchasedNumber.display_name}</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Location</p>
              <p className="mt-1 text-sm text-gray-900">
                {areaCode?.city}, {country?.name}
              </p>
              <p className="text-sm text-gray-600">Area Code: {areaCode?.area_code}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">SMS Status</p>
              <div className="mt-1">
                {purchasedNumber.sms_enabled ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <EnvelopeIcon className="h-3 w-3 mr-1" />
                    SMS Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    SMS Not Active
                  </span>
                )}
              </div>
              {areaCode && areaCode.is_sms_capable && !purchasedNumber.sms_enabled && (
                <p className="mt-1 text-xs text-gray-600">
                  SMS available for ${areaCode.sms_addon_price}/month
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SMS Configuration Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">SMS Configuration</h2>
            
            {areaCode && areaCode.is_sms_capable ? (
              <SmsForwardingForm 
                purchasedNumber={purchasedNumber}
                onUpdate={loadNumberDetails}
              />
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-800">SMS Not Available</h3>
                <p className="mt-1 text-sm text-gray-600">
                  SMS services are not available for this area code.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <Link
            href={`/my-numbers/${params.number}/sms-history`}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
            View SMS History
          </Link>
          
          <Link
            href={`/my-numbers/${params.number}/cdr`}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View Call Records
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">How SMS Forwarding Works</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="block mt-0.5 mr-2">1.</span>
              <span>When someone sends an SMS to your number, we receive it instantly</span>
            </li>
            <li className="flex items-start">
              <span className="block mt-0.5 mr-2">2.</span>
              <span>The message is processed through your configured filters (if enabled)</span>
            </li>
            <li className="flex items-start">
              <span className="block mt-0.5 mr-2">3.</span>
              <span>If forwarding is enabled, the message is sent to all configured email addresses</span>
            </li>
            <li className="flex items-start">
              <span className="block mt-0.5 mr-2">4.</span>
              <span>If auto-reply is enabled, a response is automatically sent back to the sender</span>
            </li>
          </ul>
          
          <div className="mt-4 p-3 bg-white rounded-md">
            <p className="text-xs text-gray-600">
              <strong>Important:</strong> SMS service requires a minimum 6-month commitment. 
              Additional charges apply for SMS-enabled numbers. Standard messaging rates may apply for auto-replies.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}