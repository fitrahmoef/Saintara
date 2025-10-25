'use client'

import { useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Image from 'next/image'
import Link from 'next/link'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { HiCheckCircle } from 'react-icons/hi'

export default function Home() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    })
  }, [])

  const characterTypes = [
    { name: 'Pemikir Introvert', desc: 'Analis yang mendalam, logis, dan lebih suka bekerja sendiri.' },
    { name: 'Pemikir Extrovert', desc: 'Pemimpin tegas, strategis, dan suka mengatur sistem.' },
    { name: 'Pengamat Introvert', desc: 'Praktis, teliti, dan mengandalkan fakta nyata.' },
    { name: 'Pengamat Extrovert', desc: 'Energik, spontan, dan suka menikmati momen saat ini.' },
    { name: 'Perasa Introvert', desc: 'Penuh empati, peduli, dan setia pada nilai-nilai pribadi.' },
    { name: 'Perasa Extrovert', desc: 'Karismatik, inspiratif, dan mudah bergaul dengan orang lain.' },
    { name: 'Pemimpi Introvert', desc: 'Idealis, kreatif, dan mencari makna mendalam dalam hidup.' },
    { name: 'Pemimpi Extrovert', desc: 'Inovatif, antusias, dan pandai menghubungkan ide-ide.' },
    { name: 'Penggerak', desc: 'Adaptif, pemecah masalah, dan berorientasi pada tindakan.' },
  ]

  const features = [
    { title: 'Gaya Komunikasi Alami', desc: 'Memahami cara Anda berinteraksi paling efektif.' },
    { title: 'Potensi Karier Terbaik', desc: 'Menemukan jalur karier yang paling sesuai dengan bakat Anda.' },
    { title: 'Pemicu Stres & Solusinya', desc: 'Mengenali apa yang membuat Anda stres dan cara mengatasinya.' },
    { title: 'Kekuatan Terpendam', desc: 'Menggali kelebihan yang mungkin belum Anda sadari.' },
    { title: 'Manajemen Emosi', desc: 'Cara Anda mengelola perasaan dalam berbagai situasi.' },
    { title: 'Kecocokan Hubungan', desc: 'Tipe pasangan atau rekan yang paling cocok dengan Anda.' },
  ]

  const testimonials = [
    {
      name: 'Budi Santoso',
      text: 'Saintara sangat membantu saya dalam mengenal diri saya lebih lanjut.',
    },
    {
      name: 'Meri',
      text: 'Memberikan dampak yang signifikan dalam hidup saya sehingga membuka jalan baru.',
    },
    {
      name: 'Lastri',
      text: 'Terimakasih Saintara saya bisa tahu karakter asli saya dan menjalani hidup lebih baik.',
    },
  ]

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex items-center bg-white overflow-hidden pt-20">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" />
        <div className="relative max-w-screen-xl mx-auto px-4 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left" data-aos="fade-right">
            <h1 className="font-poppins text-4xl md:text-5xl lg:text-6xl font-extrabold text-saintara-black leading-tight">
              Kenali <span className="text-saintara-yellow">Karakter Alami</span> dan Potensi Mendalam Anda
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-xl mx-auto lg:mx-0">
              Peta sempurna kehidupan untuk menggali potensi dan menjadi diri sendiri seutuhnya—untuk Anda, keluarga, pasangan, sahabat, dan tim.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                href="#harga"
                className="w-full sm:w-auto text-center text-white bg-saintara-yellow hover:bg-saintara-black focus:ring-4 focus:ring-yellow-300 font-semibold rounded-lg text-base px-8 py-3 transition-all transform hover:scale-105 duration-300"
              >
                Coba Tes Sekarang
              </Link>
              <Link
                href="#"
                className="w-full sm:w-auto text-center text-saintara-black border-2 border-saintara-black hover:bg-saintara-black hover:text-white font-semibold rounded-lg text-base px-8 py-3 transition-colors duration-300"
              >
                Daftar Kemitraan Lisensi
              </Link>
            </div>
          </div>
          <div className="hidden lg:block" data-aos="fade-left" data-aos-delay="200">
            <div className="w-full h-96 bg-gray-200 rounded-2xl shadow-2xl flex items-center justify-center">
              <span className="text-gray-500">Hero Image</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tentang Saintara */}
      <section id="tentang" className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div data-aos="fade-right">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold text-saintara-black">
              Tentang Saintara
            </h2>
            <p className="mt-6 text-gray-600 leading-relaxed">
              Saintara adalah sebuah platform inovatif yang dirancang untuk membantu Anda memahami cetak biru alami kepribadian Anda. Kami percaya bahwa setiap orang memiliki potensi unik yang, jika dipahami dan dikembangkan, dapat membawa pada kehidupan yang lebih memuaskan dan sukses.
            </p>
            <div className="mt-6">
              <h3 className="font-poppins text-xl font-semibold text-saintara-black">
                Visi & Misi
              </h3>
              <p className="mt-2 text-gray-600">
                Membantu setiap individu di dunia untuk mengenali, menerima, dan memaksimalkan potensi alami mereka untuk menjadi versi terbaik dari diri mereka sendiri.
              </p>
            </div>
          </div>
          <div data-aos="fade-left">
            <div className="w-full h-96 bg-gray-200 rounded-xl shadow-lg flex items-center justify-center">
              <span className="text-gray-500">Team Image</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mengapa Saintara */}
      <section id="mengapa" className="py-20 bg-gray-50">
        <div className="max-w-screen-lg mx-auto px-4 text-center">
          <h2 className="font-poppins text-3xl md:text-4xl font-bold text-saintara-black mb-6" data-aos="fade-up">
            Mengapa Memilih Saintara?
          </h2>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed" data-aos="fade-up" data-aos-delay="100">
            Saintara memberikan perubahan dan menggali makna dari kekuatan yang terpendam dalam diri, memetakan agar dapat dieksplorasi untuk kesuksesan yang membahagiakan, menjadi diri yang utuh, dan menemukan jati diri yang sesungguhnya.
          </p>
        </div>
      </section>

      {/* 35 Rahasia */}
      <section id="fitur" className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold text-saintara-black" data-aos="fade-up">
              35 Rahasia Kepribadian Alami Anda
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="100">
              Ungkap berbagai aspek mendalam dari diri Anda yang belum pernah Anda sadari sebelumnya.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-saintara-yellow transition-colors"
                data-aos="fade-up"
                data-aos-delay={200 + index * 100}
              >
                <h3 className="font-semibold text-lg text-saintara-black">{feature.title}</h3>
                <p className="mt-2 text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9 Karakter */}
      <section id="karakter" className="py-20 bg-gray-50">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold text-saintara-black" data-aos="fade-up">
              Temukan 9 Tipe Karakter Saintara
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="100">
              Setiap individu unik. Kenali tipe karakter alami Anda dan orang-orang di sekitar Anda.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {characterTypes.map((char, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl shadow-lg"
                data-aos="zoom-in"
                data-aos-delay={index * 100}
              >
                <div className="w-full h-64 bg-gradient-to-br from-saintara-yellow to-gray-200" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="text-white text-2xl font-bold font-poppins">{char.name}</h3>
                </div>
                <div className="absolute inset-0 bg-saintara-black/90 flex flex-col justify-center items-center p-6 text-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="mb-4">{char.desc}</p>
                  <Link
                    href="#"
                    className="px-6 py-2 border-2 border-white rounded-full hover:bg-white hover:text-saintara-black transition-colors"
                  >
                    Pelajari Lebih Lanjut
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimoni */}
      <section id="testimoni" className="py-20 bg-saintara-yellow/20">
        <div className="max-w-screen-lg mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold text-saintara-black" data-aos="fade-up">
              Apa Kata Mereka?
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="100">
              Pengalaman nyata dari mereka yang telah menemukan potensinya.
            </p>
          </div>
          <div className="space-y-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-lg flex items-center space-x-6"
                data-aos="fade-up"
                data-aos-delay={200 + index * 100}
              >
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gray-200" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-saintara-black font-poppins">
                    {testimonial.name}
                  </h3>
                  <p className="text-gray-600 mt-1">&quot;{testimonial.text}&quot;</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Paket & Harga */}
      <section id="harga" className="py-20 bg-gray-50">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold text-saintara-black" data-aos="fade-up">
              Pilih Paket yang Sesuai Untuk Anda
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="100">
              Mulai perjalanan penemuan diri Anda hari ini.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Personal */}
            <div
              className="flex flex-col p-8 bg-white rounded-2xl shadow-lg border-t-4 border-gray-300"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <h3 className="text-2xl font-semibold font-poppins text-saintara-black">Personal</h3>
              <p className="mt-2 text-gray-500">Untuk individu yang ingin mengenal diri.</p>
              <div className="my-6">
                <span className="text-5xl font-extrabold text-saintara-black">Rp150k</span>
              </div>
              <ul className="space-y-3 text-gray-600 flex-grow">
                <li className="flex items-center">
                  <HiCheckCircle className="w-5 h-5 text-saintara-yellow mr-2" />
                  Laporan Lengkap 35 Poin
                </li>
                <li className="flex items-center">
                  <HiCheckCircle className="w-5 h-5 text-saintara-yellow mr-2" />
                  Analisis Karakter Alami
                </li>
              </ul>
              <Link
                href="#"
                className="mt-8 w-full text-center text-saintara-black border-2 border-saintara-black hover:bg-saintara-black hover:text-white font-semibold rounded-lg text-base px-8 py-3 transition-colors duration-300"
              >
                Pilih Paket
              </Link>
            </div>

            {/* Pasangan - Popular */}
            <div
              className="flex flex-col p-8 bg-saintara-yellow text-saintara-black rounded-2xl shadow-2xl border-t-4 border-saintara-black relative"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <span className="absolute top-0 right-6 -mt-4 bg-saintara-black text-white text-xs font-bold px-3 py-1 rounded-full">
                PALING POPULER
              </span>
              <h3 className="text-2xl font-semibold font-poppins">Pasangan & Keluarga</h3>
              <p className="mt-2 text-gray-700">Untuk memahami dinamika hubungan.</p>
              <div className="my-6">
                <span className="text-5xl font-extrabold">Rp250k</span>
                <span className="text-gray-700">/2 Laporan</span>
              </div>
              <ul className="space-y-3 text-gray-700 flex-grow">
                <li className="flex items-center">
                  <HiCheckCircle className="w-5 h-5 text-saintara-black mr-2" />
                  Semua fitur Paket Personal
                </li>
                <li className="flex items-center">
                  <HiCheckCircle className="w-5 h-5 text-saintara-black mr-2" />
                  Analisis Kecocokan
                </li>
                <li className="flex items-center">
                  <HiCheckCircle className="w-5 h-5 text-saintara-black mr-2" />
                  Saran Pengembangan Hubungan
                </li>
              </ul>
              <Link
                href="#"
                className="mt-8 w-full text-center text-saintara-yellow bg-saintara-black hover:bg-black hover:text-white font-semibold rounded-lg text-base px-8 py-3 transition-colors duration-300"
              >
                Pilih Paket
              </Link>
            </div>

            {/* Tim & Bisnis */}
            <div
              className="flex flex-col p-8 bg-white rounded-2xl shadow-lg border-t-4 border-gray-300"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <h3 className="text-2xl font-semibold font-poppins text-saintara-black">
                Tim & Bisnis
              </h3>
              <p className="mt-2 text-gray-500">Untuk membangun tim yang solid & produktif.</p>
              <div className="my-6">
                <span className="text-3xl font-bold text-saintara-black">Hubungi Kami</span>
              </div>
              <ul className="space-y-3 text-gray-600 flex-grow">
                <li className="flex items-center">
                  <HiCheckCircle className="w-5 h-5 text-saintara-yellow mr-2" />
                  Analisis per individu
                </li>
                <li className="flex items-center">
                  <HiCheckCircle className="w-5 h-5 text-saintara-yellow mr-2" />
                  Peta Dinamika Tim
                </li>
                <li className="flex items-center">
                  <HiCheckCircle className="w-5 h-5 text-saintara-yellow mr-2" />
                  Workshop & Konsultasi
                </li>
              </ul>
              <Link
                href="#"
                className="mt-8 w-full text-center text-saintara-black border-2 border-saintara-black hover:bg-saintara-black hover:text-white font-semibold rounded-lg text-base px-8 py-3 transition-colors duration-300"
              >
                Kontak Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Penutup */}
      <section id="cta-penutup" className="py-20 cta-gradient">
        <div className="max-w-screen-md mx-auto px-4 text-center">
          <h2 className="font-poppins text-3xl md:text-4xl font-extrabold text-white" data-aos="fade-up">
            Sudah siap menemukan Potensi Alami Terbaik Anda?
          </h2>
          <p className="mt-4 text-lg text-gray-300" data-aos="fade-up" data-aos-delay="100">
            Mulailah perjalanan transformatif bersama Saintara sekarang juga.
          </p>
          <Link
            href="#harga"
            className="mt-8 inline-block text-saintara-black bg-saintara-yellow hover:bg-white hover:text-saintara-black focus:ring-4 focus:ring-yellow-300 font-bold rounded-lg text-lg px-12 py-4 transition-all transform hover:scale-105 duration-300"
            data-aos="zoom-in"
            data-aos-delay="200"
          >
            Ikuti Tes Saintara Sekarang
          </Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
