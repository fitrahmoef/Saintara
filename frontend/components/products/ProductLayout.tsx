"use client"

import { ReactNode } from "react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import Link from "next/link"
import { HiCheckCircle, HiArrowRight } from "react-icons/hi"

interface Feature {
  title: string
  description: string
  icon?: string
}

interface Attribute {
  name: string
  description: string
}

interface ProductLayoutProps {
  productCode: string
  productName: string
  productTagline: string
  productDescription: string
  targetAudience: string
  priceIndividual?: number
  priceBulk?: number
  minBulkQuantity?: number
  heroImagePlaceholder?: string
  features: Feature[]
  attributes: Attribute[]
  frameworks: string[]
  ctaPrimary?: string
  ctaSecondary?: string
  benefitsSectionTitle?: string
  benefits?: string[]
  useCases?: { title: string; description: string }[]
  testimonials?: { name: string; role: string; quote: string; avatar?: string }[]
}

export default function ProductLayout({
  productCode,
  productName,
  productTagline,
  productDescription,
  targetAudience,
  priceIndividual,
  priceBulk,
  minBulkQuantity,
  heroImagePlaceholder,
  features,
  attributes,
  frameworks,
  ctaPrimary = "Mulai Sekarang",
  ctaSecondary = "Pelajari Lebih Lanjut",
  benefitsSectionTitle = "Manfaat Utama",
  benefits = [],
  useCases = [],
  testimonials = [],
}: ProductLayoutProps) {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-saintara-yellow/20 via-white to-gray-50 overflow-hidden pt-20 lg:pt-32">
        <div className="relative max-w-screen-xl mx-auto px-4 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left" data-aos="fade-right">
            <div className="inline-block px-4 py-2 bg-saintara-yellow/30 rounded-full mb-4">
              <span className="text-sm font-semibold text-saintara-black">{targetAudience}</span>
            </div>
            <h1 className="font-poppins text-4xl md:text-5xl lg:text-6xl font-extrabold text-saintara-black leading-tight">
              {productName}
            </h1>
            <p className="mt-4 text-2xl md:text-3xl font-bold text-gray-700">{productTagline}</p>
            <p className="mt-6 text-lg text-gray-600 max-w-xl mx-auto lg:mx-0">
              {productDescription}
            </p>

            {/* Pricing */}
            {priceIndividual && (
              <div className="mt-8">
                <div className="text-5xl font-extrabold text-saintara-black">
                  Rp {priceIndividual.toLocaleString("id-ID")}
                </div>
                {priceBulk && minBulkQuantity && (
                  <p className="mt-2 text-gray-600">
                    Harga bulk: <span className="font-bold">Rp {priceBulk.toLocaleString("id-ID")}</span>
                    {" "}(min. {minBulkQuantity} orang)
                  </p>
                )}
              </div>
            )}

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                href={`/register?product=${productCode}`}
                className="w-full sm:w-auto text-center text-white bg-saintara-yellow hover:bg-saintara-black focus:ring-4 focus:ring-yellow-300 font-semibold rounded-lg text-base px-8 py-3 transition-all transform hover:scale-105 duration-300"
              >
                {ctaPrimary} <HiArrowRight className="inline ml-2" />
              </Link>
              <Link
                href="#features"
                className="w-full sm:w-auto text-center text-saintara-black border-2 border-saintara-black hover:bg-saintara-black hover:text-white font-semibold rounded-lg text-base px-8 py-3 transition-colors duration-300"
              >
                {ctaSecondary}
              </Link>
            </div>
          </div>
          <div className="hidden lg:block" data-aos="fade-left" data-aos-delay="200">
            <div className="w-full h-96 bg-gradient-to-br from-saintara-yellow to-gray-200 rounded-2xl shadow-2xl flex items-center justify-center">
              <span className="text-gray-500 text-lg">{heroImagePlaceholder || "Product Hero Image"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold text-saintara-black" data-aos="fade-up">
              Fitur Unggulan {productName}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-saintara-yellow hover:shadow-lg transition-all"
                data-aos="fade-up"
                data-aos-delay={200 + index * 100}
              >
                <div className="flex items-center mb-4">
                  <HiCheckCircle className="w-8 h-8 text-saintara-yellow mr-3" />
                  <h3 className="font-semibold text-lg text-saintara-black">{feature.title}</h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 35 Attributes Section */}
      {attributes.length > 0 && (
        <section id="attributes" className="py-20 bg-gray-50">
          <div className="max-w-screen-xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-poppins text-3xl md:text-4xl font-bold text-saintara-black" data-aos="fade-up">
                35 Atribut Kepribadian yang Dianalisis
              </h2>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="100">
                Pemahaman mendalam tentang diri Anda melalui 35 dimensi kepribadian
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {attributes.slice(0, 12).map((attribute, index) => (
                <div
                  key={index}
                  className="p-4 bg-white rounded-lg border border-gray-200 hover:border-saintara-yellow transition-colors"
                  data-aos="fade-up"
                  data-aos-delay={index * 50}
                >
                  <h4 className="font-semibold text-saintara-black">{attribute.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{attribute.description}</p>
                </div>
              ))}
            </div>
            {attributes.length > 12 && (
              <div className="text-center mt-8">
                <p className="text-gray-600">+ {attributes.length - 12} atribut lainnya</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 6 Frameworks Section */}
      {frameworks.length > 0 && (
        <section id="frameworks" className="py-20 bg-white">
          <div className="max-w-screen-xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-poppins text-3xl md:text-4xl font-bold text-saintara-black" data-aos="fade-up">
                6 Kerangka Penilaian Profesional
              </h2>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="100">
                Pendekatan komprehensif menggunakan 6 framework ilmiah yang terbukti
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {frameworks.map((framework, index) => (
                <div
                  key={index}
                  className="p-6 bg-gradient-to-br from-saintara-yellow/20 to-white rounded-xl shadow-lg"
                  data-aos="zoom-in"
                  data-aos-delay={index * 100}
                >
                  <h3 className="text-xl font-bold text-saintara-black mb-2">{framework}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Use Cases Section */}
      {useCases.length > 0 && (
        <section id="use-cases" className="py-20 bg-gray-50">
          <div className="max-w-screen-xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-poppins text-3xl md:text-4xl font-bold text-saintara-black" data-aos="fade-up">
                Cocok Untuk Anda Yang...
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {useCases.map((useCase, index) => (
                <div
                  key={index}
                  className="p-8 bg-white rounded-2xl shadow-lg border-l-4 border-saintara-yellow"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <h3 className="text-2xl font-bold text-saintara-black mb-4">{useCase.title}</h3>
                  <p className="text-gray-600">{useCase.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section id="testimonials" className="py-20 bg-saintara-yellow/20">
          <div className="max-w-screen-lg mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-poppins text-3xl md:text-4xl font-bold text-saintara-black" data-aos="fade-up">
                Apa Kata Mereka?
              </h2>
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
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                      {testimonial.avatar ? (
                        <img src={testimonial.avatar} alt={testimonial.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-gray-500">{testimonial.name.charAt(0)}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-saintara-black font-poppins">{testimonial.name}</h3>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                    <p className="text-gray-600 mt-2">&quot;{testimonial.quote}&quot;</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section id="cta" className="py-20 cta-gradient">
        <div className="max-w-screen-md mx-auto px-4 text-center">
          <h2 className="font-poppins text-3xl md:text-4xl font-extrabold text-white" data-aos="fade-up">
            Siap Memulai Perjalanan Transformasi Anda?
          </h2>
          <p className="mt-4 text-lg text-gray-200" data-aos="fade-up" data-aos-delay="100">
            Bergabunglah dengan ribuan orang yang telah menemukan potensi terbaik mereka
          </p>
          <Link
            href={`/register?product=${productCode}`}
            className="mt-8 inline-block text-saintara-black bg-saintara-yellow hover:bg-white hover:text-saintara-black focus:ring-4 focus:ring-yellow-300 font-bold rounded-lg text-lg px-12 py-4 transition-all transform hover:scale-105 duration-300"
            data-aos="zoom-in"
            data-aos-delay="200"
          >
            {ctaPrimary} <HiArrowRight className="inline ml-2" />
          </Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
