-- Migration: Add Product Types, Attributes, and Frameworks
-- Version: 010
-- Description: Implements 4 product types (Personal, Organization, School, Gift) with 35 attributes and 6 frameworks

-- ============================================================================
-- PRODUCT TYPES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,  -- 'personal', 'organization', 'school', 'gift'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    target_audience VARCHAR(100),      -- 'Individual', 'Corporate', 'Educational', 'Gift'
    price_individual DECIMAL(10, 2),
    price_bulk DECIMAL(10, 2),         -- For bulk purchases
    min_bulk_quantity INTEGER DEFAULT 1,
    features JSONB,                     -- Product-specific features
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6 FRAMEWORKS (KERANGKA) TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS personality_frameworks (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    icon VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert 6 frameworks
INSERT INTO personality_frameworks (code, name, description, category, sort_order) VALUES
('mbti', 'MBTI - 16 Kepribadian', 'Myers-Briggs Type Indicator dengan 16 tipe kepribadian berdasarkan preferensi kognitif', 'Core Assessment', 1),
('big_five', 'Big Five Personality Traits', 'Lima dimensi kepribadian: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism', 'Trait Assessment', 2),
('disc', 'DISC Profile', 'Analisis perilaku: Dominance, Influence, Steadiness, Compliance', 'Behavioral Assessment', 3),
('emotional_intelligence', 'Kecerdasan Emosional', 'Kemampuan memahami dan mengelola emosi diri dan orang lain', 'EQ Assessment', 4),
('values_assessment', 'Nilai & Motivasi Inti', 'Identifikasi nilai-nilai dan motivasi yang menggerakkan Anda', 'Values & Motivation', 5),
('strengths_finder', 'Pemetaan Kekuatan Alami', 'Temukan dan kembangkan kekuatan unik Anda', 'Strengths Assessment', 6);

-- ============================================================================
-- 35 ATTRIBUTES (ATRIBUT KEPRIBADIAN) TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS personality_attributes (
    id SERIAL PRIMARY KEY,
    framework_id INTEGER REFERENCES personality_frameworks(id) ON DELETE SET NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),           -- 'personality', 'behavior', 'emotion', 'cognition', 'social'
    product_types VARCHAR(50)[],     -- Which product types include this attribute
    is_core BOOLEAN DEFAULT false,   -- Core attributes shown in all products
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert 35 personality attributes grouped by framework
-- MBTI Framework (6 attributes)
INSERT INTO personality_attributes (framework_id, code, name, description, category, product_types, is_core, sort_order) VALUES
(1, 'cognitive_function', 'Fungsi Kognitif Dominan', 'Bagaimana Anda memproses informasi dan membuat keputusan', 'cognition', ARRAY['personal', 'organization', 'school', 'gift'], true, 1),
(1, 'energy_direction', 'Arah Energi (Introvert/Extrovert)', 'Dari mana Anda mendapatkan energi dan bagaimana Anda mengisi ulang', 'personality', ARRAY['personal', 'organization', 'school', 'gift'], true, 2),
(1, 'information_processing', 'Cara Memproses Informasi', 'Sensing vs Intuition - bagaimana Anda mengumpulkan data', 'cognition', ARRAY['personal', 'organization', 'school', 'gift'], true, 3),
(1, 'decision_making', 'Gaya Pengambilan Keputusan', 'Thinking vs Feeling - dasar pertimbangan keputusan Anda', 'cognition', ARRAY['personal', 'organization', 'school', 'gift'], true, 4),
(1, 'lifestyle_orientation', 'Orientasi Gaya Hidup', 'Judging vs Perceiving - bagaimana Anda mengatur hidup', 'behavior', ARRAY['personal', 'organization', 'school', 'gift'], true, 5),
(1, 'communication_style', 'Gaya Komunikasi Alami', 'Cara Anda berkomunikasi yang paling efektif dan autentik', 'social', ARRAY['personal', 'organization', 'school', 'gift'], true, 6),

-- Big Five Framework (5 attributes)
(2, 'openness', 'Keterbukaan terhadap Pengalaman', 'Seberapa terbuka Anda terhadap ide, pengalaman, dan kreativitas baru', 'personality', ARRAY['personal', 'organization', 'school', 'gift'], true, 7),
(2, 'conscientiousness', 'Kesadaran & Disiplin', 'Tingkat keteraturan, tanggung jawab, dan orientasi pada tujuan', 'behavior', ARRAY['personal', 'organization', 'school', 'gift'], true, 8),
(2, 'extraversion_level', 'Tingkat Ekstraversi', 'Seberapa keluar dan sosial Anda dalam berinteraksi', 'social', ARRAY['personal', 'organization', 'school', 'gift'], true, 9),
(2, 'agreeableness', 'Keramahan & Kerjasama', 'Kecenderungan Anda untuk kooperatif dan harmonis dengan orang lain', 'social', ARRAY['personal', 'organization', 'school', 'gift'], true, 10),
(2, 'emotional_stability', 'Stabilitas Emosional', 'Kemampuan Anda mengelola stres dan emosi negatif', 'emotion', ARRAY['personal', 'organization', 'school', 'gift'], true, 11),

-- DISC Framework (4 attributes)
(3, 'dominance_level', 'Tingkat Dominasi', 'Seberapa asertif dan berorientasi pada hasil Anda', 'behavior', ARRAY['organization', 'school'], false, 12),
(3, 'influence_style', 'Gaya Mempengaruhi', 'Cara Anda mempengaruhi dan membujuk orang lain', 'social', ARRAY['organization', 'school'], false, 13),
(3, 'steadiness_pattern', 'Pola Kestabilan', 'Tingkat konsistensi dan kesabaran Anda', 'behavior', ARRAY['organization', 'school'], false, 14),
(3, 'compliance_tendency', 'Kecenderungan Kepatuhan', 'Bagaimana Anda mengikuti aturan dan standar', 'behavior', ARRAY['organization', 'school'], false, 15),

-- Emotional Intelligence Framework (6 attributes)
(4, 'self_awareness', 'Kesadaran Diri', 'Kemampuan mengenali emosi dan dampaknya pada diri sendiri', 'emotion', ARRAY['personal', 'organization', 'school', 'gift'], true, 16),
(4, 'self_regulation', 'Regulasi Diri', 'Kemampuan mengelola emosi dan impuls', 'emotion', ARRAY['personal', 'organization', 'school', 'gift'], true, 17),
(4, 'empathy', 'Empati', 'Kemampuan memahami dan merasakan emosi orang lain', 'emotion', ARRAY['personal', 'organization', 'school', 'gift'], true, 18),
(4, 'social_skills', 'Keterampilan Sosial', 'Kemampuan membangun dan memelihara hubungan', 'social', ARRAY['personal', 'organization', 'school', 'gift'], true, 19),
(4, 'motivation_drivers', 'Penggerak Motivasi', 'Apa yang memotivasi Anda secara intrinsik', 'emotion', ARRAY['personal', 'organization', 'school', 'gift'], true, 20),
(4, 'stress_management', 'Manajemen Stres', 'Cara Anda menangani tekanan dan pemicu stres', 'emotion', ARRAY['personal', 'organization', 'school', 'gift'], true, 21),

-- Values & Motivation Framework (7 attributes)
(5, 'core_values', 'Nilai-nilai Inti', 'Prinsip fundamental yang memandu hidup Anda', 'values', ARRAY['personal', 'organization', 'school', 'gift'], true, 22),
(5, 'work_motivation', 'Motivasi Kerja', 'Apa yang membuat Anda bersemangat dalam bekerja', 'motivation', ARRAY['personal', 'organization', 'school'], true, 23),
(5, 'life_purpose', 'Tujuan Hidup', 'Makna dan arah yang Anda cari dalam hidup', 'values', ARRAY['personal', 'gift'], false, 24),
(5, 'relationship_values', 'Nilai dalam Hubungan', 'Apa yang paling Anda hargai dalam relasi', 'values', ARRAY['personal', 'gift'], false, 25),
(5, 'achievement_drive', 'Dorongan Berprestasi', 'Tingkat ambisi dan orientasi kesuksesan Anda', 'motivation', ARRAY['personal', 'organization', 'school'], true, 26),
(5, 'growth_mindset', 'Pola Pikir Berkembang', 'Sikap Anda terhadap pembelajaran dan perkembangan', 'cognition', ARRAY['personal', 'organization', 'school', 'gift'], true, 27),
(5, 'work_life_balance', 'Keseimbangan Hidup-Kerja', 'Bagaimana Anda menyeimbangkan berbagai aspek kehidupan', 'values', ARRAY['personal', 'organization'], false, 28),

-- Strengths Finder Framework (7 attributes)
(6, 'natural_talents', 'Talenta Alami', 'Kemampuan bawaan yang Anda miliki secara natural', 'strengths', ARRAY['personal', 'organization', 'school', 'gift'], true, 29),
(6, 'learned_skills', 'Keterampilan yang Dikembangkan', 'Keahlian yang telah Anda kembangkan', 'strengths', ARRAY['personal', 'organization', 'school'], false, 30),
(6, 'thinking_strengths', 'Kekuatan Berpikir', 'Area kognitif dimana Anda unggul', 'cognition', ARRAY['personal', 'organization', 'school', 'gift'], true, 31),
(6, 'relationship_strengths', 'Kekuatan Relasional', 'Kemampuan Anda dalam membangun hubungan', 'social', ARRAY['personal', 'organization', 'gift'], true, 32),
(6, 'execution_strengths', 'Kekuatan Eksekusi', 'Cara Anda menyelesaikan tugas dan mencapai tujuan', 'behavior', ARRAY['organization', 'school'], false, 33),
(6, 'influence_strengths', 'Kekuatan Mempengaruhi', 'Kemampuan Anda membawa perubahan dan mempengaruhi orang', 'social', ARRAY['organization', 'school'], false, 34),
(6, 'strategic_thinking', 'Pemikiran Strategis', 'Kemampuan Anda melihat pola dan merencanakan masa depan', 'cognition', ARRAY['personal', 'organization', 'school'], true, 35);

-- ============================================================================
-- PRODUCT-ATTRIBUTE MAPPING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_attribute_mapping (
    id SERIAL PRIMARY KEY,
    product_type_id INTEGER REFERENCES product_types(id) ON DELETE CASCADE,
    attribute_id INTEGER REFERENCES personality_attributes(id) ON DELETE CASCADE,
    is_included BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_type_id, attribute_id)
);

-- ============================================================================
-- UPDATE EXISTING TABLES
-- ============================================================================

-- Add product_type_id to tests table
ALTER TABLE tests
    ADD COLUMN IF NOT EXISTS product_type_id INTEGER REFERENCES product_types(id) ON DELETE SET NULL;

-- Add product_type_id to transactions table
ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS product_type_id INTEGER REFERENCES product_types(id) ON DELETE SET NULL;

-- Add framework scoring to test_results
ALTER TABLE test_results
    ADD COLUMN IF NOT EXISTS framework_scores JSONB,
    ADD COLUMN IF NOT EXISTS attribute_scores JSONB;

-- ============================================================================
-- FAQ TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS faqs (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,   -- 'general', 'product', 'payment', 'partnership'
    product_type_code VARCHAR(50),    -- NULL for general FAQs
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PARTNERSHIP/AGENT CONTENT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS partnership_content (
    id SERIAL PRIMARY KEY,
    section VARCHAR(100) NOT NULL,    -- 'hero', 'benefits', 'requirements', 'process', 'testimonials'
    title VARCHAR(255),
    content TEXT,
    image_url VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SEED DATA: 4 PRODUCT TYPES
-- ============================================================================
INSERT INTO product_types (code, name, description, target_audience, price_individual, price_bulk, min_bulk_quantity, features, sort_order) VALUES
('personal', 'Saintara Personal',
 'Paket lengkap untuk mengenali diri Anda secara mendalam - untuk individual yang ingin memahami kepribadian, potensi, dan arah hidup mereka.',
 'Individu',
 150000,
 NULL,
 1,
 '{"test_access": ["personality", "strengths", "values"], "report_format": "pdf", "consultation": false, "validity_days": 365, "retake_allowed": false, "features": ["35 Atribut Kepribadian Lengkap", "6 Kerangka Analisis Profesional", "Rekomendasi Karier Personal", "Analisis Kekuatan & Area Pengembangan", "Tips Komunikasi & Hubungan", "Manajemen Stres Personal"]}'::jsonb,
 1),

('organization', 'Saintara Organization',
 'Solusi komprehensif untuk perusahaan yang ingin memahami dinamika tim, meningkatkan produktivitas, dan membangun budaya kerja yang sehat.',
 'Perusahaan & Organisasi',
 120000,
 100000,
 10,
 '{"test_access": ["personality", "strengths", "values", "team_dynamics"], "report_format": "pdf_excel", "consultation": true, "validity_days": 365, "retake_allowed": true, "admin_dashboard": true, "bulk_upload": true, "features": ["35 Atribut Kepribadian per Karyawan", "Analisis Dinamika Tim", "Peta Kekuatan Tim", "Rekomendasi Penempatan Posisi", "Workshop & Konsultasi", "Dashboard Admin Institusi", "Bulk Upload Karyawan", "Report Institusi Lengkap"]}'::jsonb,
 2),

('school', 'Saintara School',
 'Platform khusus untuk institusi pendidikan - bantu siswa menemukan potensi, jurusan yang tepat, dan kembangkan karakter mereka.',
 'Sekolah & Universitas',
 100000,
 75000,
 20,
 '{"test_access": ["personality", "strengths", "values", "career_guidance"], "report_format": "pdf", "consultation": true, "validity_days": 730, "retake_allowed": true, "admin_dashboard": true, "bulk_upload": true, "features": ["35 Atribut Kepribadian Siswa", "Rekomendasi Jurusan Kuliah", "Pemetaan Minat & Bakat", "Konseling Karier", "Parent Report (Laporan Orang Tua)", "Dashboard Guru/Konselor", "Bulk Upload Siswa", "Progress Tracking", "Guidance Counseling Support"]}'::jsonb,
 3),

('gift', 'Saintara Gift',
 'Hadiah bermakna untuk orang tersayang - bantu mereka mengenal diri lebih dalam dan temukan potensi terbaik mereka.',
 'Hadiah untuk Orang Lain',
 175000,
 NULL,
 1,
 '{"test_access": ["personality", "strengths", "values"], "report_format": "pdf_premium", "consultation": false, "validity_days": 180, "retake_allowed": false, "gift_card": true, "custom_message": true, "features": ["35 Atribut Kepribadian Lengkap", "6 Kerangka Analisis Profesional", "Premium PDF Report Design", "Gift Card Digital", "Custom Message untuk Penerima", "Email Reminder ke Penerima", "Validity 6 Bulan"]}'::jsonb,
 4);

-- ============================================================================
-- SEED DATA: FAQs
-- ============================================================================
INSERT INTO faqs (category, product_type_code, question, answer, sort_order) VALUES
-- General FAQs
('general', NULL, 'Apa itu Saintara?', 'Saintara adalah platform penilaian kepribadian yang komprehensif, dirancang untuk membantu Anda memahami cetak biru alami kepribadian, kekuatan, nilai-nilai, dan potensi Anda. Kami menggunakan 6 kerangka ilmiah dan menganalisis 35 atribut kepribadian untuk memberikan gambaran yang mendalam tentang diri Anda.', 1),
('general', NULL, 'Berapa lama tes Saintara?', 'Tes Saintara membutuhkan waktu sekitar 25-35 menit untuk diselesaikan. Kami menyarankan Anda mengerjakan dalam kondisi rileks dan fokus untuk hasil yang paling akurat.', 2),
('general', NULL, 'Apakah hasil tes Saintara akurat?', 'Ya! Saintara menggunakan kombinasi dari 6 kerangka penilaian kepribadian yang telah terbukti secara ilmiah (termasuk MBTI, Big Five, DISC, dan Emotional Intelligence). Hasil tes kami memiliki tingkat akurasi tinggi ketika pertanyaan dijawab dengan jujur dan reflektif.', 3),
('general', NULL, 'Apakah saya bisa mengulang tes?', 'Untuk paket Personal dan Gift, tes hanya dapat dilakukan satu kali. Untuk paket Organization dan School, tes dapat diulang sesuai kebijakan institusi Anda.', 4),

-- Product-specific FAQs
('product', 'personal', 'Apa yang termasuk dalam Paket Personal?', 'Paket Personal mencakup: akses tes lengkap, analisis 35 atribut kepribadian, 6 kerangka penilaian profesional, laporan PDF komprehensif, rekomendasi karier, tips komunikasi, dan panduan pengembangan diri. Hasil tes berlaku selama 1 tahun.', 10),
('product', 'organization', 'Bagaimana cara membeli untuk tim/perusahaan?', 'Untuk pembelian Organization, silakan hubungi tim sales kami melalui tombol "Kontak Sales" atau email ke sales@saintara.id. Kami menawarkan harga khusus untuk pembelian bulk (minimal 10 user) dan akan membantu setup dashboard admin institusi Anda.', 11),
('product', 'school', 'Apakah Saintara cocok untuk bimbingan konseling sekolah?', 'Sangat cocok! Paket School dirancang khusus untuk institusi pendidikan. Fitur unggulan termasuk rekomendasi jurusan, pemetaan minat-bakat, laporan untuk orang tua, dan dashboard khusus untuk guru BK/konselor. Minimal pembelian 20 siswa.', 12),
('product', 'gift', 'Bagaimana cara memberikan Saintara sebagai hadiah?', 'Setelah pembelian Paket Gift, Anda akan menerima gift card digital yang bisa dikirim ke penerima hadiah via email. Anda juga bisa menambahkan pesan personal. Penerima hadiah memiliki waktu 6 bulan untuk menggunakan gift card tersebut.', 13),

-- Payment FAQs
('payment', NULL, 'Metode pembayaran apa saja yang diterima?', 'Kami menerima pembayaran melalui transfer bank (BCA, Mandiri, BNI, BRI), e-wallet (GoPay, OVO, DANA), dan virtual account. Untuk pembelian institusi, kami juga menerima invoice.', 20),
('payment', NULL, 'Apakah ada refund jika tidak puas?', 'Kami menawarkan kebijakan refund 100% jika Anda belum mengerjakan tes dalam 7 hari pertama setelah pembelian. Setelah tes dikerjakan, kami tidak dapat memproses refund karena laporan sudah dihasilkan.', 21),

-- Partnership FAQs
('partnership', NULL, 'Bagaimana cara menjadi agen/partner Saintara?', 'Untuk menjadi partner Saintara, Anda bisa mendaftar melalui halaman Kemitraan kami. Kami mencari individu atau institusi yang passionate tentang pengembangan diri dan memiliki jaringan yang kuat. Benefit termasuk komisi hingga 30%, training gratis, dan support marketing.', 30),
('partnership', NULL, 'Berapa komisi untuk agen?', 'Komisi agen berkisar antara 15-30% tergantung pada tier dan volume penjualan bulanan. Semakin tinggi penjualan, semakin besar persentase komisi Anda. Detail lengkap akan dijelaskan saat proses onboarding partner.', 31);

-- ============================================================================
-- SEED DATA: Partnership Content
-- ============================================================================
INSERT INTO partnership_content (section, title, content, sort_order) VALUES
('hero', 'Bergabunglah dengan Misi Saintara', 'Bantu ribuan orang menemukan potensi terbaik mereka sambil membangun bisnis yang bermakna dan menguntungkan.', 1),
('benefits', 'Komisi Menarik hingga 30%', 'Dapatkan passive income dengan komisi kompetitif. Semakin banyak Anda menjual, semakin besar komisi Anda.', 1),
('benefits', 'Training & Sertifikasi Gratis', 'Kami akan melatih Anda tentang personality assessment, sales, dan coaching agar Anda bisa memberikan value maksimal ke klien.', 2),
('benefits', 'Marketing Support Lengkap', 'Dapatkan akses ke material marketing profesional, landing page custom, dan dashboard tracking penjualan real-time.', 3),
('benefits', 'Flexibility & Freedom', 'Bekerja sesuai waktu Anda sendiri, dari mana saja. Cocok untuk freelancer, coach, trainer, dan profesional HR.', 4),
('requirements', 'Passionate tentang Pengembangan Diri', 'Kami mencari partner yang benar-benar percaya pada pentingnya self-awareness dan pengembangan potensi manusia.', 1),
('requirements', 'Memiliki Jaringan atau Audience', 'Ideal jika Anda sudah memiliki komunitas, social media following, atau network profesional.', 2),
('requirements', 'Komitmen untuk Belajar', 'Kami akan melatih Anda, tapi Anda harus punya kemauan untuk terus belajar dan berkembang.', 3),
('process', 'Daftar & Aplikasi', 'Isi form aplikasi kemitraan dan ceritakan tentang diri Anda dan visi Anda.', 1),
('process', 'Seleksi & Interview', 'Tim kami akan menghubungi Anda untuk interview singkat (online/offline).', 2),
('process', 'Training & Onboarding', 'Ikuti training 2-3 hari tentang produk, personality assessment, dan sales technique.', 3),
('process', 'Mulai Jualan!', 'Dapatkan akses ke dashboard partner Anda dan mulai referral pertama Anda!', 4);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_product_types_code ON product_types(code);
CREATE INDEX IF NOT EXISTS idx_product_types_active ON product_types(is_active);
CREATE INDEX IF NOT EXISTS idx_personality_attributes_code ON personality_attributes(code);
CREATE INDEX IF NOT EXISTS idx_personality_attributes_framework ON personality_attributes(framework_id);
CREATE INDEX IF NOT EXISTS idx_personality_frameworks_code ON personality_frameworks(code);
CREATE INDEX IF NOT EXISTS idx_product_attribute_mapping ON product_attribute_mapping(product_type_id, attribute_id);
CREATE INDEX IF NOT EXISTS idx_tests_product_type ON tests(product_type_id);
CREATE INDEX IF NOT EXISTS idx_transactions_product_type ON transactions(product_type_id);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_product_type ON faqs(product_type_code);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_partnership_content_section ON partnership_content(section);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE TRIGGER update_product_types_updated_at BEFORE UPDATE ON product_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partnership_content_updated_at BEFORE UPDATE ON partnership_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This migration adds:
-- 1. Product types table (4 products: Personal, Organization, School, Gift)
-- 2. Personality frameworks table (6 frameworks)
-- 3. Personality attributes table (35 attributes)
-- 4. Product-attribute mapping
-- 5. FAQs table with seed data
-- 6. Partnership content table with seed data
-- 7. Updates to existing tables (tests, transactions, test_results)
-- 8. All necessary indexes and triggers
