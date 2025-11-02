'use client'

import { useState, useEffect } from 'react'
import { transactionAPI } from '@/lib/api'

export default function AdminKeuanganPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchData()
  }, [filter])

  const fetchData = async () => {
    try {
      const [transResponse, statsResponse] = await Promise.all([
        transactionAPI.getAll({ status: filter || undefined, limit: 50 }),
        transactionAPI.getStats()
      ])
      setTransactions(transResponse.data.transactions || [])
      setStats(statsResponse.data.stats)
    } catch (error) {
      console.error('Failed to fetch financial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await transactionAPI.updateStatus(id, status)
      alert(`Transaction marked as ${status}!`)
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update transaction')
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Financial Management</h1>

      {stats && (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-600 text-sm">Total Revenue</h3>
            <p className="text-2xl font-bold text-green-600">
              Rp {parseInt(stats.total_revenue).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-600 text-sm">Monthly Revenue</h3>
            <p className="text-2xl font-bold text-blue-600">
              Rp {parseInt(stats.monthly_revenue).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-600 text-sm">Paid Transactions</h3>
            <p className="text-2xl font-bold text-yellow-600">{stats.paid_transactions}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-600 text-sm">Pending Transactions</h3>
            <p className="text-2xl font-bold text-orange-600">{stats.pending_transactions}</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('')}
          className={`px-4 py-2 rounded-lg ${filter === '' ? 'bg-yellow-400 text-white' : 'bg-gray-200'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg ${filter === 'pending' ? 'bg-yellow-400 text-white' : 'bg-gray-200'}`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`px-4 py-2 rounded-lg ${filter === 'paid' ? 'bg-yellow-400 text-white' : 'bg-gray-200'}`}
        >
          Paid
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{transaction.transaction_code}</td>
                  <td className="px-6 py-4 text-sm">
                    <div>{transaction.user_name}</div>
                    <div className="text-gray-500 text-xs">{transaction.user_email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm capitalize">{transaction.package_type}</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    Rp {parseInt(transaction.amount).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-sm capitalize">{transaction.payment_method || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      transaction.status === 'paid' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{new Date(transaction.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm">
                    {transaction.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(transaction.id, 'paid')}
                        className="text-green-600 hover:text-green-800"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
