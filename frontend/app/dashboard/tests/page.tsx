'use client'

import { useState, useEffect } from 'react'
import { testAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function TestsPage() {
  const router = useRouter()
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchTests()
  }, [])

  const fetchTests = async () => {
    try {
      const response = await testAPI.getMyTests()
      setTests(response.data.tests || [])
    } catch (error) {
      console.error('Failed to fetch tests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartNewTest = async () => {
    setCreating(true)
    try {
      const response = await testAPI.createTest('personal')
      router.push(`/dashboard/tests/${response.data.test.id}/take`)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create test')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Tests</h1>
        <button
          onClick={handleStartNewTest}
          disabled={creating}
          className="px-6 py-3 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Start New Test'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
          <p className="mt-4 text-gray-600">Loading tests...</p>
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 text-lg mb-4">You haven't taken any tests yet.</p>
          <button
            onClick={handleStartNewTest}
            className="px-6 py-3 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500"
          >
            Take Your First Test
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {tests.map((test) => (
            <div key={test.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold capitalize">{test.test_type} Test</h3>
                  <p className="text-gray-600 mt-1">
                    Started: {new Date(test.created_at).toLocaleDateString()}
                  </p>
                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${
                      test.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : test.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {test.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  {test.status === 'completed' && (
                    <button
                      onClick={() => router.push(`/dashboard/results/${test.result_id}`)}
                      className="px-4 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500"
                    >
                      View Results
                    </button>
                  )}
                  {test.status === 'in_progress' && (
                    <button
                      onClick={() => router.push(`/dashboard/tests/${test.id}/take`)}
                      className="px-4 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500"
                    >
                      Continue Test
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
