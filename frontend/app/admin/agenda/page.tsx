'use client'

import { useState, useEffect } from 'react'
import { eventAPI } from '@/lib/api'

export default function AdminAgendaPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'webinar',
    event_date: '',
    location: '',
    capacity: 50
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await eventAPI.getAll()
      setEvents(response.data.events || [])
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await eventAPI.create(formData)
      alert('Event created successfully!')
      setShowCreate(false)
      setFormData({
        title: '',
        description: '',
        event_type: 'webinar',
        event_date: '',
        location: '',
        capacity: 50
      })
      fetchEvents()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create event')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this event?')) return

    try {
      await eventAPI.delete(id)
      alert('Event deleted successfully!')
      fetchEvents()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete event')
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Event Management</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-6 py-3 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500"
        >
          Create New Event
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create New Event</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Event Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Event Type</label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="webinar">Webinar</option>
                    <option value="talkshow">Talkshow</option>
                    <option value="workshop">Workshop</option>
                    <option value="seminar">Seminar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Event Date</label>
                  <input
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500"
                >
                  Create Event
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold">{event.title}</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {event.event_type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      event.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                      event.status === 'ongoing' ? 'bg-yellow-100 text-yellow-800' :
                      event.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-2">{event.description}</p>
                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Date: </span>
                      <span className="font-medium">{new Date(event.event_date).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Location: </span>
                      <span className="font-medium">{event.location || 'Online'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Registered: </span>
                      <span className="font-medium">{event.registered_count}/{event.capacity}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="ml-4 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
