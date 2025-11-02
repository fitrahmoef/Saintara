'use client'

import { useState, useEffect } from 'react'
import { approvalAPI } from '@/lib/api'

export default function AdminApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchApprovals()
  }, [filter])

  const fetchApprovals = async () => {
    try {
      const response = await approvalAPI.getAll({ status: filter || undefined })
      setApprovals(response.data.approvals || [])
    } catch (error) {
      console.error('Failed to fetch approvals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (id: number, status: 'approved' | 'rejected') => {
    const notes = prompt(`Enter notes for ${status}:`)

    try {
      await approvalAPI.updateStatus(id, status, notes || '')
      alert(`Approval ${status} successfully!`)
      fetchApprovals()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update approval')
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Approval Management</h1>

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
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg ${filter === 'approved' ? 'bg-yellow-400 text-white' : 'bg-gray-200'}`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-lg ${filter === 'rejected' ? 'bg-yellow-400 text-white' : 'bg-gray-200'}`}
        >
          Rejected
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
        </div>
      ) : approvals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600">No approvals found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {approvals.map((approval) => (
            <div key={approval.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {approval.type.replace('_', ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      approval.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      approval.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {approval.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Requester: </span>
                      <span className="font-medium">{approval.requester_name} ({approval.requester_email})</span>
                    </div>
                    {approval.approver_name && (
                      <div>
                        <span className="text-gray-500">Approver: </span>
                        <span className="font-medium">{approval.approver_name}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Reference ID: </span>
                      <span className="font-medium">{approval.reference_id || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created: </span>
                      <span className="font-medium">{new Date(approval.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {approval.notes && (
                    <div className="mt-3 text-sm">
                      <span className="text-gray-500">Notes: </span>
                      <span>{approval.notes}</span>
                    </div>
                  )}
                </div>
                {approval.status === 'pending' && (
                  <div className="ml-4 flex gap-2">
                    <button
                      onClick={() => handleApproval(approval.id, 'approved')}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproval(approval.id, 'rejected')}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
