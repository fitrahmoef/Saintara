"use client"
import React, { useEffect } from "react"
import AOS from "aos"
import "aos/dist/aos.css"
import Calendar from "../../components/Calendar"

import Navbar from "@/components/Navbar"

export default function CalendarPage() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    })
  }, [])

  return (
    <>
      <Navbar />
      <section id="hero" className="relative min-h-screen bg-white overflow-hidden pt-28 lg:pt-40">
        {/* Anda bisa mengganti styling wrapper ini agar sesuai layout admin Anda */}
        <div className="p-4 md:p-8">
          {/* Render komponen kalender yang asli */}
          <Calendar /> {/* <-- Sekarang ini akan me-render komponen dari file .tsx Anda */}
        </div>
      </section>
    </>
  )
}
