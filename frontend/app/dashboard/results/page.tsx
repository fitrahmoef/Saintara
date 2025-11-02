'use client'

import { useState, useEffect } from 'react'
import { resultAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function ResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      const response = await resultAPI.getUserResults()
      setResults(response.data.data.results || [])
    } catch (error) {
      console.error('Failed to fetch results:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async (id: number) => {
    try {
      const response = await resultAPI.downloadPDF(id)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `saintara-certificate-${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      alert('Failed to download certificate')
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Test Results</h1>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 text-lg">No test results available.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {results.map((result) => (
            <div key={result.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-yellow-600">
                      {result.character_type_name}
                    </h3>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      {result.character_type_code}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-2">{result.description}</p>
                  <p className="text-sm text-gray-500 mt-3">
                    Completed: {new Date(result.created_at).toLocaleDateString()}
                  </p>

                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-green-600 mb-2">Strengths:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {result.strengths?.slice(0, 3).map((strength: string, idx: number) => (
                          <li key={idx}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-600 mb-2">Development Areas:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {result.challenges?.slice(0, 3).map((challenge: string, idx: number) => (
                          <li key={idx}>{challenge}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="ml-6 flex flex-col gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/results/${result.id}`)}
                    className="px-4 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 whitespace-nowrap"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(result.id)}
                    className="px-4 py-2 border border-yellow-400 text-yellow-600 rounded-lg hover:bg-yellow-50 whitespace-nowrap"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
