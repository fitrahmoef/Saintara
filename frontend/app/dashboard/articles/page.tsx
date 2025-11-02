'use client'

import { useState, useEffect } from 'react'
import { articleAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function ArticlesPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')

  useEffect(() => {
    fetchArticles()
  }, [category])

  const fetchArticles = async () => {
    try {
      const response = await articleAPI.getAll({
        is_published: true,
        category: category || undefined,
        limit: 20
      })
      setArticles(response.data.articles || [])
    } catch (error) {
      console.error('Failed to fetch articles:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Articles & Resources</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setCategory('')}
            className={`px-4 py-2 rounded-lg ${
              category === '' ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setCategory('personality')}
            className={`px-4 py-2 rounded-lg ${
              category === 'personality' ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Personality
          </button>
          <button
            onClick={() => setCategory('career')}
            className={`px-4 py-2 rounded-lg ${
              category === 'career' ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Career
          </button>
          <button
            onClick={() => setCategory('relationships')}
            className={`px-4 py-2 rounded-lg ${
              category === 'relationships' ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Relationships
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
          <p className="mt-4 text-gray-600">Loading articles...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 text-lg">No articles available.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/articles/${article.id}`)}
            >
              {article.featured_image && (
                <img
                  src={article.featured_image}
                  alt={article.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                {article.category && (
                  <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs mb-2">
                    {article.category}
                  </span>
                )}
                <h3 className="text-xl font-bold mb-2">{article.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-3">
                  {article.content?.substring(0, 150)}...
                </p>
                <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                  <span>{article.author_name || 'Saintara Team'}</span>
                  <span>{new Date(article.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
