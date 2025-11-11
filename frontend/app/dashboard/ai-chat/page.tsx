'use client'

import { useState, useEffect, useRef } from 'react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Message {
  id?: number
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize or get existing chat session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          setError('Please log in to use AI chat')
          return
        }

        const response = await fetch(`${API_BASE_URL}/api/ai-chat/session`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to initialize chat session')
        }

        const data = await response.json()
        setSessionId(data.data.session_id)

        // Load existing messages if any
        if (data.data.messages && data.data.messages.length > 0) {
          setMessages(data.data.messages)
        }
      } catch (err: any) {
        console.error('Error initializing chat:', err)
        setError(err.message || 'Failed to connect to AI chat service')
      }
    }

    initializeSession()
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !sessionId) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('Please log in to continue')
      }

      const response = await fetch(`${API_BASE_URL}/api/ai-chat/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          session_id: sessionId,
          message: input,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to send message')
      }

      const data = await response.json()
      setMessages(prev => [...prev, data.data.message])
    } catch (err: any) {
      console.error('Error sending message:', err)
      setError(err.message || 'Failed to send message. Please try again.')

      // Remove the user message that failed to send
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 h-[calc(100vh-8rem)]">
      <h1 className="text-3xl font-bold mb-6">AI Consultation</h1>

      {error && !sessionId && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <p className="text-sm font-medium">{error}</p>
          <p className="text-xs mt-1">
            {error.includes('log in') ? (
              <>Please <a href="/login" className="underline">log in</a> to continue.</>
            ) : (
              'Please check your connection or contact support if the problem persists.'
            )}
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md h-[calc(100%-5rem)] flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg">Start a conversation with Saintara AI</p>
                <p className="text-sm mt-2">Ask me about your personality, career, or personal development!</p>
              </div>
            </div>
          )}

          {messages.map((message, idx) => (
            <div
              key={message.id || idx}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-3 rounded-lg">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && sessionId && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSend} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={sessionId ? "Ask me anything about your personality..." : "Connecting..."}
              disabled={!sessionId || loading}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
              maxLength={2000}
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || !sessionId}
              className="px-6 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
