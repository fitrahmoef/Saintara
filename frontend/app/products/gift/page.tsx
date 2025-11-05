"use client"

import { useEffect } from "react"
import ProductLayout from "@/components/products/ProductLayout"
import AOS from "aos"
import "aos/dist/aos.css"

export default function GiftPage() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    })
  }, [])

  const features = [
    {
      title: "35 Atribut Kepribadian Lengkap",
      description: "Hadiah yang bermakna - analisis mendalam tentang kepribadian penerima",
    },
    {
      title: "6 Kerangka Analisis Profesional",
      description: "Pendekatan komprehensif menggunakan 6 framework ilmiah terpercaya",
    },
    {
      title: "Premium PDF Report Design",
      description: "Laporan dengan desain premium yang indah dan mudah dipahami",
    },
    {
      title: "Gift Card Digital",
      description: "Kartu hadiah digital yang bisa langsung dikirim ke penerima",
    },
    {
      title: "Custom Message untuk Penerima",
      description: "Tambahkan pesan personal yang menyentuh hati penerima hadiah",
    },
    {
      title: "Email Reminder ke Penerima",
      description: "Sistem reminder otomatis agar penerima tidak lupa mengerjakan tes",
    },
    {
      title: "Validity 6 Bulan",
      description: "Penerima punya waktu 6 bulan untuk menggunakan gift card",
    },
  ]

  const attributes = [
    { name: "Fungsi Kognitif Dominan", description: "Cara memproses informasi dan membuat keputusan" },
    { name: "Arah Energi", description: "Introvert/Extrovert - sumber energi utama" },
    { name: "Cara Memproses Informasi", description: "Sensing vs Intuition" },
    { name: "Gaya Pengambilan Keputusan", description: "Thinking vs Feeling" },
    { name: "Orientasi Gaya Hidup", description: "Judging vs Perceiving" },
    { name: "Gaya Komunikasi Alami", description: "Cara berkomunikasi yang paling efektif" },
    { name: "Keterbukaan terhadap Pengalaman", description: "Tingkat penerimaan terhadap hal baru" },
    { name: "Kesadaran & Disiplin", description: "Level keteraturan dan tanggung jawab" },
    { name: "Tingkat Ekstraversi", description: "Orientasi sosial" },
    { name: "Keramahan & Kerjasama", description: "Kecenderungan untuk kooperatif" },
    { name: "Stabilitas Emosional", description: "Ketahanan terhadap stres" },
    { name: "Kesadaran Diri", description: "Kemampuan mengenali emosi" },
  ]

  const frameworks = [
    "MBTI - 16 Kepribadian",
    "Big Five Personality Traits",
    "DISC Profile",
    "Kecerdasan Emosional",
    "Nilai & Motivasi Inti",
    "Pemetaan Kekuatan Alami",
  ]

  const useCases = [
    {
      title: "Hadiah Ulang Tahun yang Bermakna",
      description: "Berikan hadiah yang tidak hanya berkesan, tapi juga memberikan value jangka panjang untuk pengembangan diri mereka.",
    },
    {
      title: "Hadiah Wisuda / Kelulusan",
      description: "Bantu fresh graduate memahami diri mereka lebih baik sebelum memulai karier - hadiah yang sempurna untuk milestone ini!",
    },
    {
      title: "Anniversary / Valentine Gift",
      description: "Hadiah unik untuk pasangan - bantu mereka (dan Anda) memahami kepribadian satu sama lain lebih dalam.",
    },
    {
      title: "Corporate Gift untuk Karyawan",
      description: "Hadiah yang thoughtful untuk karyawan berprestasi atau sebagai bagian dari employee development program.",
    },
    {
      title: "Hadiah untuk Orang Tua",
      description: "Bantu orang tua Anda menemukan passion baru atau memahami diri mereka di fase hidup yang berbeda.",
    },
    {
      title: "Hadiah untuk Mentor / Guru",
      description: "Ucapan terima kasih yang bermakna untuk mentor atau guru yang telah banyak membantu perjalanan hidup Anda.",
    },
  ]

  const testimonials = [
    {
      name: "Dina Puspita",
      role: "Corporate Manager",
      quote: "Saya kasih Saintara Gift ke tim saya sebagai appreciation. Mereka semua sangat suka dan merasa valued!",
    },
    {
      name: "Ricky Harun",
      role: "Entrepreneur",
      quote: "Hadiah ulang tahun terbaik yang pernah saya terima! Hasilnya sangat akurat dan membantu saya memahami diri lebih baik.",
    },
    {
      name: "Maya Andini",
      role: "HR Specialist",
      quote: "Kami gunakan Saintara Gift sebagai hadiah untuk new joiners. Respon mereka luar biasa positif!",
    },
  ]

  return (
    <ProductLayout
      productCode="gift"
      productName="Saintara Gift"
      productTagline="Hadiah Bermakna untuk Orang Tersayang"
      productDescription="Hadiah unik yang membantu orang tersayang mengenal diri lebih dalam dan menemukan potensi terbaik mereka - gift that keeps on giving!"
      targetAudience="Hadiah untuk Orang Lain"
      priceIndividual={175000}
      heroImagePlaceholder="Gift of Self-Discovery"
      features={features}
      attributes={attributes}
      frameworks={frameworks}
      ctaPrimary="Beli Gift Card"
      ctaSecondary="Lihat Contoh Gift"
      useCases={useCases}
      testimonials={testimonials}
    />
  )
}
