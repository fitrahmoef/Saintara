"use client"

import React, { useState } from "react"

// --- Tipe Data untuk Acara/Event ---
type CalendarEvent = {
  id: number
  date: string // Format "YYYY-MM-DD"
  title: string
  color: "blue" | "green" | "yellow" | "red" // Warna ini tetap untuk membedakan event
  icon?: string // Emoji
}

// --- Mock Data (Data Palsu) ---
// (Data ini tetap sama)
const MOCK_EVENTS: CalendarEvent[] = [
  { id: 1, date: "2025-11-06", title: "Marty", color: "green", icon: "🦓" },
  { id: 2, date: "2025-11-09", title: "King Julien", color: "yellow", icon: "👑" },
  { id: 3, date: "2025-11-09", title: "Kowalski", color: "blue", icon: "🐧" },
  { id: 4, date: "2025-11-14", title: "Mort", color: "yellow", icon: "🌻" },
  { id: 5, date: "2025-11-19", title: "Private", color: "blue", icon: "🎉" },
  { id: 6, date: "2025-11-04", title: "Event 1", color: "red", icon: "🍓" },
  { id: 7, date: "2025-11-04", title: "Event 2", color: "blue", icon: "🧊" },
  { id: 8, date: "2025-11-04", title: "Event 3", color: "green", icon: "🐧" },
]

// --- Konstanta ---
const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
const DAYS_OF_WEEK_FULL = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

// --- Fungsi Helper untuk Styling ---
// (Fungsi-fungsi ini tetap sama, karena event masih perlu dibedakan)
const getEventColorClasses = (color: CalendarEvent["color"]) => {
  switch (color) {
    case "blue":
      return "bg-blue-100 text-blue-800 border-l-4 border-blue-500"
    case "green":
      return "bg-green-100 text-green-800 border-l-4 border-green-500"
    case "yellow":
      return "bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500"
    case "red":
      return "bg-red-100 text-red-800 border-l-4 border-red-500"
    default:
      return "bg-gray-100 text-gray-800 border-l-4 border-gray-500"
  }
}

const getDayHighlightClasses = (color: CalendarEvent["color"]) => {
  switch (color) {
    case "blue":
      return "border-blue-300 bg-blue-50/50"
    case "green":
      return "border-green-300 bg-green-50/50"
    case "yellow":
      return "border-yellow-300 bg-yellow-50/50"
    case "red":
      return "border-red-300 bg-red-50/50"
    default:
      return "border-gray-200"
  }
}

// --- Komponen Utama Kalender ---
export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState(MOCK_EVENTS)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // --- Fungsi Navigasi ---
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // --- Logika Inti untuk Membangun Grid 42 Hari ---
  // (Logika ini tetap sama, hanya tampilan yang berubah)
  const buildCalendarGrid = () => {
    const firstDayOfMonth = new Date(year, month, 1).getDay() // 0-6
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const prevMonth = new Date(year, month, 0)
    const daysInPrevMonth = prevMonth.getDate()
    const prevMonthYear = prevMonth.getFullYear()
    const prevMonthMonth = prevMonth.getMonth()

    const nextMonth = new Date(year, month + 1, 1)
    const nextMonthYear = nextMonth.getFullYear()
    const nextMonthMonth = nextMonth.getMonth()

    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]

    const calendarDays = []

    // 1. Hari dari Bulan Sebelumnya
    for (let i = firstDayOfMonth; i > 0; i--) {
      const day = daysInPrevMonth - i + 1
      const dateStr = `${prevMonthYear}-${String(prevMonthMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      calendarDays.push({
        day,
        isCurrentMonth: false,
        dateStr,
        events: events.filter(e => e.date === dateStr),
      })
    }

    // 2. Hari dari Bulan Ini
    for (let i = 1; i <= daysInMonth; i++) {
      const day = i
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      calendarDays.push({
        day,
        isCurrentMonth: true,
        dateStr,
        isToday: dateStr === todayStr,
        events: events.filter(e => e.date === dateStr),
      })
    }

    // 3. Hari dari Bulan Berikutnya
    const remainingCells = 42 - calendarDays.length
    for (let i = 1; i <= remainingCells; i++) {
      const day = i
      const dateStr = `${nextMonthYear}-${String(nextMonthMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      calendarDays.push({
        day,
        isCurrentMonth: false,
        dateStr,
        events: events.filter(e => e.date === dateStr),
      })
    }

    return calendarDays
  }

  const calendarDays = buildCalendarGrid()

  // --- JSX (Render) ---
  return (
    // PERUBAHAN: Menambahkan font-poppins dan shadow-lg, mengganti font-sans
    <div className="w-full max-w-6xl mx-auto bg-white border border-gray-200 rounded-xl shadow-lg p-6 font-poppins">
      {/* Header: Navigasi & Tombol Aksi */}
      <div className="flex items-center justify-between mb-5">
        {/* Sisi Kiri: Kontrol Bulan & Acara */}
        <div className="flex items-center gap-4">
          {/* PERUBAHAN: Menambahkan font-bold dan text-saintara-black */}
          <h2 className="text-2xl font-bold text-saintara-black w-36">{MONTH_NAMES[month]}</h2>

          {/* PERUBAHAN: Menyesuaikan gaya tombol 'Today' (gaya sekunder) */}
          <button onClick={goToToday} className="px-4 py-2 text-sm font-semibold text-saintara-black border-2 border-saintara-black rounded-lg hover:bg-saintara-black hover:text-white transition-colors duration-300">
            Today
          </button>

          {/* PERUBAHAN: Menyesuaikan gaya tombol 'Add Event' (gaya primer) */}
          <button className="px-4 py-2 text-sm font-semibold text-white bg-saintara-yellow rounded-lg hover:bg-saintara-black focus:ring-4 focus:ring-yellow-300 transition-all duration-300 transform hover:scale-105">+ Add Event</button>
        </div>

        {/* Sisi Kanan: Kontrol Tahun */}
        <div className="flex items-center gap-2">
          {/* PERUBAHAN: Menambahkan aksen hover saintara-yellow */}
          <button onClick={handlePrevMonth} className="p-2 rounded-full text-gray-600 hover:bg-saintara-yellow/20 hover:text-saintara-black transition-colors" aria-label="Bulan sebelumnya">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* PERUBAHAN: Menambahkan text-saintara-black */}
          <span className="text-2xl font-bold text-saintara-black w-24 text-center">{year}</span>

          {/* PERUBAHAN: Menambahkan aksen hover saintara-yellow */}
          <button onClick={handleNextMonth} className="p-2 rounded-full text-gray-600 hover:bg-saintara-yellow/20 hover:text-saintara-black transition-colors" aria-label="Bulan berikutnya">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Grid Kalender */}

      {/* Header Nama Hari */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS_OF_WEEK_FULL.map(day => (
          // PERUBAHAN: Mengganti text-gray-500 menjadi 600 dan menebalkan sedikit
          <div key={day} className="text-left font-semibold text-sm text-gray-600 pt-2 pb-3 pl-2">
            {day}
          </div>
        ))}
      </div>

      {/* Body Grid (6 baris x 7 kolom) */}
      <div className="grid grid-cols-7 grid-rows-6 gap-2">
        {calendarDays.map(({ day, isCurrentMonth, dateStr, isToday, events }) => {
          const dayHighlightColor = events[0]?.color
          const highlightClass = dayHighlightColor && isCurrentMonth ? getDayHighlightClasses(dayHighlightColor) : "border-gray-100"

          return (
            <div
              key={dateStr}
              // PERUBAHAN: Mengganti rounded-md menjadi rounded-lg
              className={`h-32 p-2 border ${highlightClass} rounded-lg flex flex-col items-start overflow-hidden transition-colors
                          ${isCurrentMonth ? "bg-white hover:bg-gray-50" : "bg-gray-50"}`}
            >
              {/* Angka Tanggal */}
              <span
                // PERUBAHAN: Mengganti penanda 'isToday' dari merah ke saintara-yellow
                className={`text-sm font-semibold mb-1.5
                                ${isCurrentMonth ? "text-saintara-black" : "text-gray-400"}
                                ${isToday ? "bg-saintara-yellow text-saintara-black rounded-full h-7 w-7 flex items-center justify-center" : "p-1"}`}
              >
                {day}
              </span>

              {/* Container untuk Acara/Event */}
              {/* PERUBAHAN: Mengganti rounded menjadi rounded-md untuk event pills */}
              <div className="flex flex-col gap-1 w-full overflow-y-auto text-xs pr-1">
                {events.map(event => (
                  <div key={event.id} title={event.title} className={`p-1.5 rounded-md ${getEventColorClasses(event.color)} truncate`}>
                    {event.icon} {event.title}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
