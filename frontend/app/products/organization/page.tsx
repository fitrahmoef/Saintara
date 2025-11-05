"use client"

import { useEffect } from "react"
import ProductLayout from "@/components/products/ProductLayout"
import AOS from "aos"
import "aos/dist/aos.css"

export default function OrganizationPage() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    })
  }, [])

  const features = [
    {
      title: "35 Atribut per Karyawan",
      description: "Analisis mendalam kepribadian setiap anggota tim Anda",
    },
    {
      title: "Analisis Dinamika Tim",
      description: "Pahami bagaimana kepribadian setiap anggota saling berinteraksi",
    },
    {
      title: "Peta Kekuatan Tim",
      description: "Visualisasi kekuatan kolektif dan gap dalam tim Anda",
    },
    {
      title: "Rekomendasi Penempatan Posisi",
      description: "Tempatkan orang yang tepat di posisi yang tepat",
    },
    {
      title: "Workshop & Konsultasi",
      description: "Sesi workshop team building dan konsultasi dengan expert",
    },
    {
      title: "Dashboard Admin Institusi",
      description: "Kelola semua karyawan dan lihat insights dalam satu dashboard",
    },
    {
      title: "Bulk Upload Karyawan",
      description: "Upload ratusan karyawan sekaligus via CSV/Excel",
    },
    {
      title: "Report Institusi Lengkap",
      description: "Laporan komprehensif tentang profil kepribadian organisasi Anda",
    },
  ]

  const attributes = [
    { name: "Fungsi Kognitif Dominan", description: "Cara memproses informasi dan membuat keputusan" },
    { name: "Arah Energi", description: "Introvert/Extrovert - sumber energi utama" },
    { name: "Gaya Komunikasi", description: "Cara berkomunikasi yang paling efektif" },
    { name: "Keterbukaan terhadap Pengalaman", description: "Tingkat penerimaan terhadap perubahan" },
    { name: "Kesadaran & Disiplin", description: "Level keteraturan dan tanggung jawab" },
    { name: "Tingkat Ekstraversi", description: "Orientasi sosial dan kolaborasi" },
    { name: "Keramahan & Kerjasama", description: "Kecenderungan untuk kooperatif" },
    { name: "Stabilitas Emosional", description: "Ketahanan terhadap stres" },
    { name: "Tingkat Dominasi", description: "Asertivitas dan orientasi pada hasil" },
    { name: "Gaya Mempengaruhi", description: "Cara mempengaruhi dan membujuk orang lain" },
    { name: "Pola Kestabilan", description: "Konsistensi dan kesabaran" },
    { name: "Kecenderungan Kepatuhan", description: "Cara mengikuti aturan dan standar" },
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
      title: "Meningkatkan Produktivitas Tim",
      description: "Pahami dinamika tim untuk meningkatkan kolaborasi, komunikasi, dan output kerja secara signifikan.",
    },
    {
      title: "Recruitment & Placement",
      description: "Gunakan insights personality untuk membuat keputusan hiring yang lebih baik dan menempatkan orang di posisi yang tepat.",
    },
    {
      title: "Leadership Development",
      description: "Identifikasi high-potential employees dan kembangkan kepemimpinan mereka sesuai dengan kekuatan unik mereka.",
    },
    {
      title: "Conflict Resolution",
      description: "Pahami akar konflik tim dari perspektif kepribadian dan temukan solusi yang sustainable.",
    },
    {
      title: "Team Building yang Efektif",
      description: "Rancang program team building yang sesuai dengan profil kepribadian tim Anda untuk hasil maksimal.",
    },
    {
      title: "Organizational Culture",
      description: "Bangun budaya perusahaan yang sehat dengan memahami collective personality organisasi Anda.",
    },
  ]

  const testimonials = [
    {
      name: "Ir. Bambang Suryanto",
      role: "HR Director, PT Maju Jaya",
      quote: "Saintara mengubah cara kami merekrut dan mengembangkan karyawan. Turnover turun 40% dalam 6 bulan!",
    },
    {
      name: "Linda Kartika",
      role: "CEO, Tech Startup",
      quote: "Dashboard admin sangat membantu. Kami bisa lihat profil kepribadian seluruh tim dan membuat keputusan yang lebih baik.",
    },
    {
      name: "Dr. Ahmad Fauzi",
      role: "Organizational Psychologist",
      quote: "Framework yang digunakan Saintara sangat komprehensif. Ini adalah tool yang saya rekomendasikan untuk semua organisasi.",
    },
  ]

  return (
    <ProductLayout
      productCode="organization"
      productName="Saintara Organization"
      productTagline="Bangun Tim yang Solid & Produktif"
      productDescription="Solusi komprehensif untuk perusahaan yang ingin memahami dinamika tim, meningkatkan produktivitas, dan membangun budaya kerja yang sehat."
      targetAudience="Untuk Perusahaan & Organisasi"
      priceIndividual={120000}
      priceBulk={100000}
      minBulkQuantity={10}
      heroImagePlaceholder="Team Collaboration"
      features={features}
      attributes={attributes}
      frameworks={frameworks}
      ctaPrimary="Kontak Sales"
      ctaSecondary="Lihat Demo"
      useCases={useCases}
      testimonials={testimonials}
    />
  )
}
