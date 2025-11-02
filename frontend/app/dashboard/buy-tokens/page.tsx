'use client'

import { useState } from 'react'
import { transactionAPI, voucherAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'

const packages = [
  {
    type: 'personal',
    name: 'Personal Package',
    price: 150000,
    features: ['1 Complete Personality Test', 'Detailed Character Analysis', 'Career Recommendations', 'Downloadable PDF Certificate']
  },
  {
    type: 'couple',
    name: 'Couple Package',
    price: 250000,
    features: ['2 Complete Personality Tests', 'Relationship Compatibility Analysis', 'Communication Tips', 'Joint PDF Certificate']
  },
  {
    type: 'team',
    name: 'Team Package',
    price: 500000,
    features: ['5 Complete Personality Tests', 'Team Dynamics Analysis', 'Leadership Insights', 'Team Report & Certificates']
  }
]

export default function BuyTokensPage() {
  const router = useRouter()
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [loading, setLoading] = useState(false)

  const handlePurchase = async () => {
    if (!selectedPackage) {
      alert('Please select a package')
      return
    }

    setLoading(true)

    try {
      const pkg = packages.find(p => p.type === selectedPackage)
      if (!pkg) return

      const response = await transactionAPI.create(pkg.type, pkg.price, paymentMethod)
      const transactionCode = response.data.transaction.transaction_code

      alert(`Transaction created! Your transaction code is: ${transactionCode}. Please complete payment and upload proof.`)
      router.push('/dashboard/transactions')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">Buy Test Tokens</h1>
      <p className="text-gray-600 mb-8">Choose a package that suits your needs</p>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {packages.map((pkg) => (
          <div
            key={pkg.type}
            onClick={() => setSelectedPackage(pkg.type)}
            className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all ${
              selectedPackage === pkg.type
                ? 'ring-2 ring-yellow-400 transform scale-105'
                : 'hover:shadow-lg'
            }`}
          >
            <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
            <p className="text-3xl font-bold text-yellow-600 mb-4">
              Rp {pkg.price.toLocaleString('id-ID')}
            </p>
            <ul className="space-y-2">
              {pkg.features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              className={`w-full mt-6 px-4 py-2 rounded-lg font-medium ${
                selectedPackage === pkg.type
                  ? 'bg-yellow-400 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {selectedPackage === pkg.type ? 'Selected' : 'Select'}
            </button>
          </div>
        ))}
      </div>

      {selectedPackage && (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Payment Method</h2>
          <div className="space-y-3 mb-6">
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment"
                value="bank_transfer"
                checked={paymentMethod === 'bank_transfer'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-3"
              />
              <div>
                <p className="font-medium">Bank Transfer</p>
                <p className="text-sm text-gray-600">Transfer to our bank account</p>
              </div>
            </label>
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment"
                value="e-wallet"
                checked={paymentMethod === 'e-wallet'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-3"
              />
              <div>
                <p className="font-medium">E-Wallet</p>
                <p className="text-sm text-gray-600">GoPay, OVO, Dana, etc.</p>
              </div>
            </label>
          </div>

          <button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full px-6 py-3 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 disabled:opacity-50 font-medium"
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </button>
        </div>
      )}
    </div>
  )
}
