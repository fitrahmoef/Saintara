'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { resultAPI } from '@/lib/api'
import { HiArrowLeft, HiDownload, HiCheckCircle } from 'react-icons/hi'

interface ResultDetail {
  id: number
  character_type_name: string
  character_type_code: string
  character_description: string
  communication_style: string
  strengths: string[]
  challenges: string[]
  career_recommendations: string[]
  test_type: string
  completed_at: string
  user_name: string
}

export default function ResultDetailPage() {
  const params = useParams()
  const router = useRouter()
  const resultId = params.id as string

  const [result, setResult] = useState<ResultDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchResult()
  }, [resultId])

  const fetchResult = async () => {
    try {
      setLoading(true)
      const response = await resultAPI.getResult(Number(resultId))
      setResult(response.data.data.result)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch result')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true)
      const response = await resultAPI.downloadPDF(Number(resultId))
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `saintara-certificate-${resultId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert('Failed to download certificate')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saintara-yellow mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading result...</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Result</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard/results')}
            className="bg-saintara-yellow text-black px-6 py-2 rounded-lg hover:bg-yellow-500 font-medium"
          >
            Back to Results
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/results')}
            className="flex items-center text-gray-600 hover:text-saintara-yellow mb-4"
          >
            <HiArrowLeft className="w-5 h-5 mr-2" />
            Back to Results
          </button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Personality Profile</h1>
              <p className="text-gray-600">
                Test completed on {new Date(result.completed_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center px-6 py-3 bg-saintara-yellow text-black rounded-lg hover:bg-yellow-500 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                  Downloading...
                </>
              ) : (
                <>
                  <HiDownload className="w-5 h-5 mr-2" />
                  Download Certificate
                </>
              )}
            </button>
          </div>
        </div>

        {/* Character Type Card */}
        <div className="bg-gradient-to-br from-saintara-yellow to-yellow-400 rounded-2xl shadow-xl p-8 mb-6 text-black">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-4xl font-bold mb-2">{result.character_type_name}</h2>
              <span className="inline-block px-4 py-2 bg-black text-saintara-yellow rounded-full text-lg font-semibold">
                {result.character_type_code}
              </span>
            </div>
            <HiCheckCircle className="w-20 h-20 opacity-50" />
          </div>
          <p className="text-lg leading-relaxed">{result.character_description}</p>
        </div>

        {/* Communication Style */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-saintara-yellow/20 p-2 rounded-lg mr-3">💬</span>
            Communication Style
          </h3>
          <p className="text-gray-700 leading-relaxed">{result.communication_style}</p>
        </div>

        {/* Strengths & Challenges Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-green-600 mb-4 flex items-center">
              <span className="bg-green-100 p-2 rounded-lg mr-3">✓</span>
              Key Strengths
            </h3>
            <ul className="space-y-3">
              {result.strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Challenges */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-blue-600 mb-4 flex items-center">
              <span className="bg-blue-100 p-2 rounded-lg mr-3">→</span>
              Development Areas
            </h3>
            <ul className="space-y-3">
              {result.challenges.map((challenge, index) => (
                <li key={index} className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{challenge}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Career Recommendations */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold text-purple-600 mb-4 flex items-center">
            <span className="bg-purple-100 p-2 rounded-lg mr-3">💼</span>
            Recommended Career Paths
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {result.career_recommendations.map((career, index) => (
              <div
                key={index}
                className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center"
              >
                <span className="text-purple-700 font-medium">{career}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg shadow-md p-6 text-white">
          <h3 className="text-xl font-bold mb-4">What's Next?</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="text-saintara-yellow mr-3">•</span>
              <span>Download your certificate and share it with others</span>
            </li>
            <li className="flex items-start">
              <span className="text-saintara-yellow mr-3">•</span>
              <span>Explore articles and resources tailored to your personality type</span>
            </li>
            <li className="flex items-start">
              <span className="text-saintara-yellow mr-3">•</span>
              <span>Consider taking additional assessments to deepen your self-understanding</span>
            </li>
            <li className="flex items-start">
              <span className="text-saintara-yellow mr-3">•</span>
              <span>Connect with our AI consultant to discuss your results in detail</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
