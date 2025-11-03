'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { testAPI } from '@/lib/api'
import { HiArrowLeft, HiArrowRight, HiCheckCircle } from 'react-icons/hi'

interface Question {
  id: string
  question_text: string
  category: string
}

interface Answer {
  question_id: string
  answer_value: number
}

export default function TakeTestPage() {
  const router = useRouter()
  const params = useParams()
  const testId = params.id as string

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const response = await testAPI.getQuestions()
      setQuestions(response.data.data)

      // Initialize answers array
      const initialAnswers = response.data.data.map((q: Question) => ({
        question_id: q.id,
        answer_value: 3, // Default to neutral (middle value)
      }))
      setAnswers(initialAnswers)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, value: number) => {
    setAnswers(prev =>
      prev.map(answer =>
        answer.question_id === questionId
          ? { ...answer, answer_value: value }
          : answer
      )
    )
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError('')

      await testAPI.submitTest(parseInt(testId), answers)

      // Redirect to results page
      router.push('/dashboard/results')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit test')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saintara-yellow mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading questions...</p>
        </div>
      </div>
    )
  }

  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Test</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-saintara-yellow text-black px-6 py-2 rounded-lg hover:bg-yellow-500 font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = answers.find(a => a.question_id === currentQuestion?.id)
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  const scaleLabels = [
    'Strongly Disagree',
    'Disagree',
    'Neutral',
    'Agree',
    'Strongly Agree',
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-saintara-yellow">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-saintara-yellow h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-saintara-yellow/20 text-saintara-yellow rounded-full text-sm font-medium mb-4">
              {currentQuestion?.category}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-8">
            {currentQuestion?.question_text}
          </h2>

          {/* Answer Scale */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(value => (
              <label
                key={value}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  currentAnswer?.answer_value === value
                    ? 'border-saintara-yellow bg-saintara-yellow/10'
                    : 'border-gray-200 hover:border-saintara-yellow/50'
                }`}
              >
                <input
                  type="radio"
                  name="answer"
                  value={value}
                  checked={currentAnswer?.answer_value === value}
                  onChange={() => handleAnswerChange(currentQuestion.id, value)}
                  className="w-5 h-5 text-saintara-yellow focus:ring-saintara-yellow"
                />
                <span className="ml-4 text-lg text-gray-700 flex-1">
                  {scaleLabels[value - 1]}
                </span>
                {currentAnswer?.answer_value === value && (
                  <HiCheckCircle className="w-6 h-6 text-saintara-yellow" />
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
              currentQuestionIndex === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
            }`}
          >
            <HiArrowLeft className="w-5 h-5 mr-2" />
            Previous
          </button>

          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center px-6 py-3 bg-saintara-yellow text-black rounded-lg font-medium hover:bg-yellow-500 transition-all"
            >
              Next
              <HiArrowRight className="w-5 h-5 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center px-8 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <HiCheckCircle className="w-5 h-5 mr-2" />
                  Submit Test
                </>
              )}
            </button>
          )}
        </div>

        {/* Question Navigation Dots */}
        <div className="mt-8 flex justify-center gap-2 flex-wrap">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentQuestionIndex
                  ? 'bg-saintara-yellow w-8'
                  : answers[index]?.answer_value
                  ? 'bg-green-400'
                  : 'bg-gray-300'
              }`}
              title={`Question ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
