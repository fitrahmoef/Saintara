"use client"

import { useEffect } from "react"
import ProductLayout from "@/components/products/ProductLayout"
import AOS from "aos"
import "aos/dist/aos.css"

export default function SchoolPage() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    })
  }, [])

  const features = [
    {
      title: "35 Atribut Kepribadian Siswa",
      description: "Analisis mendalam untuk setiap siswa - pahami potensi unik mereka",
    },
    {
      title: "Rekomendasi Jurusan Kuliah",
      description: "Panduan pemilihan jurusan berdasarkan kepribadian dan minat alami",
    },
    {
      title: "Pemetaan Minat & Bakat",
      description: "Identifikasi bakat terpendam dan minat sesungguhnya siswa",
    },
    {
      title: "Konseling Karier",
      description: "Panduan karier yang sesuai dengan kepribadian dan potensi siswa",
    },
    {
      title: "Parent Report (Laporan Orang Tua)",
      description: "Laporan khusus untuk orang tua tentang kepribadian anak mereka",
    },
    {
      title: "Dashboard Guru/Konselor",
      description: "Akses semua data siswa untuk bimbingan yang lebih efektif",
    },
    {
      title: "Bulk Upload Siswa",
      description: "Upload data ratusan siswa sekaligus via CSV/Excel",
    },
    {
      title: "Progress Tracking",
      description: "Pantau perkembangan kepribadian siswa dari waktu ke waktu",
    },
    {
      title: "Guidance Counseling Support",
      description: "Tools dan resources untuk guru BK dalam membimbing siswa",
    },
  ]

  const attributes = [
    { name: "Fungsi Kognitif Dominan", description: "Cara siswa memproses informasi dan belajar" },
    { name: "Arah Energi", description: "Introvert/Extrovert - preferensi interaksi sosial" },
    { name: "Gaya Belajar", description: "Visual, auditori, atau kinestetik" },
    { name: "Keterbukaan terhadap Pengalaman", description: "Tingkat keingintahuan dan kreativitas" },
    { name: "Kesadaran & Disiplin", description: "Keteraturan dalam belajar dan tanggung jawab" },
    { name: "Tingkat Ekstraversi", description: "Preferensi kerja kelompok vs individual" },
    { name: "Keramahan & Kerjasama", description: "Kemampuan bekerjasama dengan teman" },
    { name: "Stabilitas Emosional", description: "Ketahanan menghadapi tekanan akademik" },
    { name: "Minat Akademik", description: "Bidang studi yang paling menarik" },
    { name: "Gaya Komunikasi", description: "Cara berkomunikasi yang paling efektif" },
    { name: "Motivasi Belajar", description: "Apa yang mendorong semangat belajar" },
    { name: "Pemikiran Strategis", description: "Kemampuan merencanakan dan memecahkan masalah" },
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
      title: "Bimbingan Konseling yang Efektif",
      description: "Bantu guru BK memberikan konseling yang lebih personal dan efektif berdasarkan profil kepribadian setiap siswa.",
    },
    {
      title: "Pemilihan Jurusan yang Tepat",
      description: "Panduan berbasis data untuk siswa kelas 12 dalam memilih jurusan kuliah yang sesuai dengan potensi mereka.",
    },
    {
      title: "Character Building Program",
      description: "Rancang program pengembangan karakter yang sesuai dengan profil kepribadian mayoritas siswa di sekolah Anda.",
    },
    {
      title: "Parent-Teacher Communication",
      description: "Fasilitasi komunikasi yang lebih baik antara guru dan orang tua dengan insights kepribadian siswa.",
    },
    {
      title: "Identifikasi Siswa Berkebutuhan Khusus",
      description: "Deteksi dini siswa yang membutuhkan perhatian atau pendampingan khusus dari perspektif kepribadian.",
    },
    {
      title: "Career Day & Expo Planning",
      description: "Rancang acara career day yang lebih targeted berdasarkan profil kepribadian dan minat siswa.",
    },
  ]

  const testimonials = [
    {
      name: "Dra. Siti Nurhaliza, M.Pd",
      role: "Guru BK, SMA Negeri 1 Jakarta",
      quote: "Saintara School sangat membantu saya dalam memberikan konseling karier. Siswa jadi lebih yakin dengan pilihan jurusan mereka.",
    },
    {
      name: "Dr. Hendra Gunawan",
      role: "Kepala Sekolah, SMA Swasta XYZ",
      quote: "Kami implementasikan Saintara untuk seluruh siswa kelas 12. Parent report-nya sangat diapresiasi oleh orang tua!",
    },
    {
      name: "Rina Marlina, S.Psi",
      role: "Psikolog Sekolah",
      quote: "Framework yang komprehensif dan mudah dipahami. Sangat cocok untuk siswa SMA yang sedang mencari arah.",
    },
  ]

  return (
    <ProductLayout
      productCode="school"
      productName="Saintara School"
      productTagline="Bantu Siswa Temukan Potensi Terbaik"
      productDescription="Platform khusus untuk institusi pendidikan - bantu siswa menemukan potensi, jurusan yang tepat, dan kembangkan karakter mereka."
      targetAudience="Untuk Sekolah & Universitas"
      priceIndividual={100000}
      priceBulk={75000}
      minBulkQuantity={20}
      heroImagePlaceholder="Student Success"
      features={features}
      attributes={attributes}
      frameworks={frameworks}
      ctaPrimary="Hubungi Sales"
      ctaSecondary="Download Brosur"
      useCases={useCases}
      testimonials={testimonials}
    />
  )
}
