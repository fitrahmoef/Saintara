"use client"

import { useEffect, useState } from "react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import AOS from "aos"
import "aos/dist/aos.css"
import { HiCheckCircle, HiCurrencyDollar, HiAcademicCap, HiUsers, HiLightningBolt } from "react-icons/hi"

export default function PartnershipPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    experience: "",
    social_media: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const response = await fetch(`${apiUrl}/api/partnership/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitStatus("success")
        setFormData({
          name: "",
          email: "",
          phone: "",
          organization: "",
          experience: "",
          social_media: "",
          message: "",
        })
      } else {
        setSubmitStatus("error")
      }
    } catch (error) {
      console.error("Error submitting application:", error)
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-saintara-yellow/30 via-white to-gray-50 overflow-hidden pt-20 lg:pt-32">
        <div className="relative max-w-screen-xl mx-auto px-4 py-20 lg:py-28">
          <div className="text-center max-w-3xl mx-auto" data-aos="fade-up">
            <h1 className="font-poppins text-4xl md:text-5xl lg:text-6xl font-extrabold text-saintara-black leading-tight">
              Bergabunglah dengan <span className="text-saintara-yellow">Misi Saintara</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              Bantu ribuan orang menemukan potensi terbaik mereka sambil membangun bisnis yang bermakna dan menguntungkan
            </p>
            <div className="mt-8">
              <a
                href="#apply"
                className="inline-block text-white bg-saintara-yellow hover:bg-saintara-black focus:ring-4 focus:ring-yellow-300 font-semibold rounded-lg text-base px-10 py-4 transition-all transform hover:scale-105 duration-300"
              >
                Daftar Sekarang
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold text-saintara-black" data-aos="fade-up">
              Kenapa Menjadi Partner Saintara?
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="100">
              Dapatkan benefit eksklusif dan dukungan penuh dari tim Saintara
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-saintara-yellow transition-all" data-aos="fade-up" data-aos-delay="200">
              <HiCurrencyDollar className="w-12 h-12 text-saintara-yellow mb-4" />
              <h3 className="text-xl font-bold text-saintara-black mb-2">Komisi Menarik</h3>
              <p className="text-gray-600">Hingga 30% komisi untuk setiap penjualan. Semakin banyak menjual, semakin besar penghasilan!</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-saintara-yellow transition-all" data-aos="fade-up" data-aos-delay="300">
              <HiAcademicCap className="w-12 h-12 text-saintara-yellow mb-4" />
              <h3 className="text-xl font-bold text-saintara-black mb-2">Training Gratis</h3>
              <p className="text-gray-600">Dapatkan training tentang personality assessment, sales technique, dan coaching skills.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-saintara-yellow transition-all" data-aos="fade-up" data-aos-delay="400">
              <HiUsers className="w-12 h-12 text-saintara-yellow mb-4" />
              <h3 className="text-xl font-bold text-saintara-black mb-2">Marketing Support</h3>
              <p className="text-gray-600">Material marketing profesional, landing page custom, dan dashboard tracking penjualan.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-saintara-yellow transition-all" data-aos="fade-up" data-aos-delay="500">
              <HiLightningBolt className="w-12 h-12 text-saintara-yellow mb-4" />
              <h3 className="text-xl font-bold text-saintara-black mb-2">Flexibility</h3>
              <p className="text-gray-600">Bekerja sesuai waktu Anda sendiri, dari mana saja. Cocok untuk freelancer dan profesional.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section id="requirements" className="py-20 bg-gray-50">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold text-saintara-black" data-aos="fade-up">
              Siapa yang Kami Cari?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="p-6 bg-white rounded-xl shadow-lg" data-aos="fade-up" data-aos-delay="200">
              <div className="flex items-center mb-4">
                <HiCheckCircle className="w-6 h-6 text-saintara-yellow mr-2" />
                <h3 className="text-lg font-semibold text-saintara-black">Passionate</h3>
              </div>
              <p className="text-gray-600">Percaya pada pentingnya self-awareness dan pengembangan potensi manusia</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-lg" data-aos="fade-up" data-aos-delay="300">
              <div className="flex items-center mb-4">
                <HiCheckCircle className="w-6 h-6 text-saintara-yellow mr-2" />
                <h3 className="text-lg font-semibold text-saintara-black">Connected</h3>
              </div>
              <p className="text-gray-600">Memiliki jaringan, komunitas, atau social media following yang aktif</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-lg" data-aos="fade-up" data-aos-delay="400">
              <div className="flex items-center mb-4">
                <HiCheckCircle className="w-6 h-6 text-saintara-yellow mr-2" />
                <h3 className="text-lg font-semibold text-saintara-black">Growth Mindset</h3>
              </div>
              <p className="text-gray-600">Komitmen untuk terus belajar, berkembang, dan memberikan value terbaik</p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold text-saintara-black" data-aos="fade-up">
              Cara Bergabung
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Daftar & Aplikasi",
                description: "Isi form aplikasi dan ceritakan tentang diri Anda dan visi Anda",
              },
              {
                step: "2",
                title: "Seleksi & Interview",
                description: "Tim kami akan menghubungi Anda untuk interview singkat",
              },
              {
                step: "3",
                title: "Training",
                description: "Ikuti training 2-3 hari tentang produk dan sales technique",
              },
              {
                step: "4",
                title: "Mulai!",
                description: "Dapatkan akses dashboard dan mulai referral pertama Anda",
              },
            ].map((item, index) => (
              <div key={index} className="relative" data-aos="fade-up" data-aos-delay={200 + index * 100}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-saintara-yellow rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-saintara-black mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-300" style={{ width: "calc(100% - 4rem)" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section id="apply" className="py-20 bg-gray-50">
        <div className="max-w-screen-md mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold text-saintara-black" data-aos="fade-up">
              Daftar Sekarang
            </h2>
            <p className="mt-4 text-gray-600" data-aos="fade-up" data-aos-delay="100">
              Isi form di bawah ini dan tim kami akan menghubungi Anda segera
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg" data-aos="fade-up" data-aos-delay="200">
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
                  Organisasi / Perusahaan (Opsional)
                </label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                  Pengalaman Relevan (Opsional)
                </label>
                <textarea
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  placeholder="Misalnya: sales, coaching, HR, trainer, dll"
                />
              </div>

              <div>
                <label htmlFor="social_media" className="block text-sm font-medium text-gray-700 mb-2">
                  Social Media / Website (Opsional)
                </label>
                <input
                  type="text"
                  id="social_media"
                  name="social_media"
                  value={formData.social_media}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  placeholder="Instagram, LinkedIn, atau website Anda"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Ceritakan Tentang Anda & Motivasi Anda *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  placeholder="Kenapa Anda tertarik menjadi partner Saintara? Apa visi Anda?"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-white bg-saintara-yellow hover:bg-saintara-black focus:ring-4 focus:ring-yellow-300 font-semibold rounded-lg text-base px-8 py-4 transition-all transform hover:scale-105 duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Mengirim..." : "Kirim Aplikasi"}
              </button>

              {submitStatus === "success" && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">
                    Terima kasih! Aplikasi Anda telah diterima. Tim kami akan menghubungi Anda segera.
                  </p>
                </div>
              )}

              {submitStatus === "error" && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">
                    Maaf, terjadi kesalahan. Silakan coba lagi atau hubungi kami di partnership@saintara.id
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </>
  )
}
