"use client"

import { useEffect } from "react"
import ProductLayout from "@/components/products/ProductLayout"
import AOS from "aos"
import "aos/dist/aos.css"

export default function PersonalPage() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    })
  }, [])

  const features = [
    {
      title: "Laporan Lengkap 35 Poin",
      description: "Analisis mendalam tentang 35 aspek kepribadian Anda yang unik",
    },
    {
      title: "Analisis Karakter Alami",
      description: "Pahami cetak biru kepribadian bawaan Anda yang autentik",
    },
    {
      title: "Rekomendasi Karier Personal",
      description: "Temukan jalur karier yang paling sesuai dengan potensi alami Anda",
    },
    {
      title: "Kekuatan & Area Pengembangan",
      description: "Identifikasi kekuatan unik dan area yang perlu dikembangkan",
    },
    {
      title: "Tips Komunikasi & Hubungan",
      description: "Cara berkomunikasi yang paling efektif sesuai tipe kepribadian Anda",
    },
    {
      title: "Manajemen Stres Personal",
      description: "Kenali pemicu stres dan strategi mengelolanya secara efektif",
    },
  ]

  const attributes = [
    { name: "Fungsi Kognitif Dominan", description: "Cara Anda memproses informasi dan membuat keputusan" },
    { name: "Arah Energi (Introvert/Extrovert)", description: "Dari mana Anda mendapatkan energi" },
    { name: "Cara Memproses Informasi", description: "Sensing vs Intuition dalam mengumpulkan data" },
    { name: "Gaya Pengambilan Keputusan", description: "Thinking vs Feeling dalam memutuskan" },
    { name: "Orientasi Gaya Hidup", description: "Judging vs Perceiving dalam mengatur hidup" },
    { name: "Gaya Komunikasi Alami", description: "Cara berkomunikasi yang paling efektif untuk Anda" },
    { name: "Keterbukaan terhadap Pengalaman", description: "Seberapa terbuka Anda terhadap hal baru" },
    { name: "Kesadaran & Disiplin", description: "Tingkat keteraturan dan tanggung jawab Anda" },
    { name: "Tingkat Ekstraversi", description: "Seberapa keluar dan sosial Anda" },
    { name: "Keramahan & Kerjasama", description: "Kecenderungan Anda untuk kooperatif" },
    { name: "Stabilitas Emosional", description: "Kemampuan mengelola stres dan emosi" },
    { name: "Kesadaran Diri", description: "Kemampuan mengenali emosi dan dampaknya" },
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
      title: "Ingin Mengenal Diri Lebih Dalam",
      description: "Anda merasa belum sepenuhnya memahami siapa Anda sebenarnya dan ingin eksplorasi mendalam tentang kepribadian, kekuatan, dan nilai-nilai Anda.",
    },
    {
      title: "Sedang Mencari Arah Karier",
      description: "Anda bingung memilih jalur karier atau ingin memastikan pekerjaan Anda saat ini sesuai dengan potensi dan kepribadian alami Anda.",
    },
    {
      title: "Ingin Meningkatkan Hubungan",
      description: "Anda ingin memahami bagaimana kepribadian Anda mempengaruhi hubungan dengan orang lain dan cara komunikasi yang lebih efektif.",
    },
    {
      title: "Sedang Menghadapi Transisi Hidup",
      description: "Anda sedang dalam fase perubahan besar (career switch, pasca lulus, dll) dan membutuhkan clarity tentang langkah selanjutnya.",
    },
  ]

  const testimonials = [
    {
      name: "Budi Santoso",
      role: "Software Engineer",
      quote: "Saintara sangat membantu saya dalam mengenal diri saya lebih lanjut. Sekarang saya lebih percaya diri dalam mengambil keputusan karier.",
    },
    {
      name: "Sarah Meilani",
      role: "Fresh Graduate",
      quote: "Hasil tes Saintara memberikan clarity yang saya butuhkan untuk memilih jalur karier. Rekomendasi kariernya sangat akurat!",
    },
    {
      name: "Lastri Wijaya",
      role: "Entrepreneur",
      quote: "Terimakasih Saintara, saya bisa tahu karakter asli saya dan menjalani hidup lebih baik. Sangat membantu untuk pengembangan diri.",
    },
  ]

  return (
    <ProductLayout
      productCode="personal"
      productName="Saintara Personal"
      productTagline="Kenali Diri Anda Seutuhnya"
      productDescription="Paket lengkap untuk mengenali diri Anda secara mendalam - untuk individual yang ingin memahami kepribadian, potensi, dan arah hidup mereka."
      targetAudience="Untuk Individu"
      priceIndividual={150000}
      heroImagePlaceholder="Personal Growth Journey"
      features={features}
      attributes={attributes}
      frameworks={frameworks}
      ctaPrimary="Mulai Tes Sekarang"
      ctaSecondary="Lihat Detail Paket"
      useCases={useCases}
      testimonials={testimonials}
    />
  )
}
