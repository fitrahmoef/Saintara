"use client"

import { useEffect, useState } from "react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import AOS from "aos"
import "aos/dist/aos.css"
import { HiChevronDown, HiSearch } from "react-icons/hi"

interface FAQ {
  id: number
  category: string
  product_type_code: string | null
  question: string
  answer: string
  sort_order: number
  views: number
}

interface GroupedFAQs {
  [category: string]: FAQ[]
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [groupedFAQs, setGroupedFAQs] = useState<GroupedFAQs>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    })
    fetchFAQs()
  }, [])

  const fetchFAQs = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const response = await fetch(`${apiUrl}/api/faqs`)
      const data = await response.json()

      if (data.status === "success") {
        setFaqs(data.data.faqs)
        setGroupedFAQs(data.data.grouped)
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error)
    } finally {
      setLoading(false)
    }
  }

  const categories = Object.keys(groupedFAQs)

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleFAQ = (id: number) => {
    setOpenFAQ(openFAQ === id ? null : id)
  }

  const getCategoryTitle = (category: string) => {
    const titles: { [key: string]: string } = {
      general: "Pertanyaan Umum",
      product: "Tentang Produk",
      payment: "Pembayaran",
      partnership: "Kemitraan",
    }
    return titles[category] || category
  }

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-saintara-yellow/20 via-white to-gray-50 pt-20 lg:pt-32 pb-16">
        <div className="relative max-w-screen-xl mx-auto px-4 text-center">
          <h1 className="font-poppins text-4xl md:text-5xl lg:text-6xl font-extrabold text-saintara-black leading-tight" data-aos="fade-up">
            Frequently Asked Questions
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="100">
            Temukan jawaban untuk pertanyaan yang sering ditanyakan tentang Saintara
          </p>
        </div>
      </section>

      {/* Search & Filter Section */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <HiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari pertanyaan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {getCategoryTitle(category)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-screen-lg mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-saintara-yellow"></div>
              <p className="mt-4 text-gray-600">Memuat FAQ...</p>
            </div>
          ) : filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Tidak ada FAQ yang sesuai dengan pencarian Anda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFAQs.map((faq, index) => (
                <div
                  key={faq.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                  data-aos="fade-up"
                  data-aos-delay={index * 50}
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-semibold px-2 py-1 bg-saintara-yellow/20 text-saintara-black rounded">
                          {getCategoryTitle(faq.category)}
                        </span>
                        {faq.product_type_code && (
                          <span className="text-xs font-semibold px-2 py-1 bg-gray-200 text-gray-700 rounded">
                            {faq.product_type_code}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-saintara-black">{faq.question}</h3>
                    </div>
                    <HiChevronDown
                      className={`w-6 h-6 text-gray-400 transition-transform ${
                        openFAQ === faq.id ? "transform rotate-180" : ""
                      }`}
                    />
                  </button>

                  {openFAQ === faq.id && (
                    <div className="px-6 pb-6">
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Still Have Questions */}
          <div className="mt-16 text-center bg-white p-8 rounded-2xl shadow-lg" data-aos="fade-up">
            <h3 className="text-2xl font-bold text-saintara-black mb-4">Masih Punya Pertanyaan?</h3>
            <p className="text-gray-600 mb-6">
              Jika Anda tidak menemukan jawaban yang Anda cari, jangan ragu untuk menghubungi kami
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:support@saintara.id"
                className="text-white bg-saintara-yellow hover:bg-saintara-black focus:ring-4 focus:ring-yellow-300 font-semibold rounded-lg text-base px-8 py-3 transition-all transform hover:scale-105 duration-300"
              >
                Email Kami
              </a>
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="text-saintara-black border-2 border-saintara-black hover:bg-saintara-black hover:text-white font-semibold rounded-lg text-base px-8 py-3 transition-colors duration-300"
              >
                WhatsApp Support
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
