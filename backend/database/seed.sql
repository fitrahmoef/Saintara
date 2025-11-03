-- Seed data for Saintara database

-- Insert character types
INSERT INTO character_types (name, code, description, strengths, challenges, career_paths, communication_style) VALUES
('Pemikir Introvert', 'PI', 'Analis yang mendalam, logis, dan lebih suka bekerja sendiri.',
 ARRAY['Analisis Tajam', 'Mandiri', 'Pemikir Strategis', 'Detail-oriented', 'Problem Solver'],
 ARRAY['Cenderung Overthinking', 'Sulit Beradaptasi Cepat', 'Kurang Ekspresif'],
 ARRAY['Researcher', 'Data Analyst', 'Software Developer', 'Scientist', 'Actuary'],
 'Lebih suka komunikasi tertulis, detail-oriented, membutuhkan waktu untuk berpikir sebelum merespons'),

('Pemikir Extrovert', 'PE', 'Pemimpin tegas, strategis, dan suka mengatur sistem.',
 ARRAY['Leadership', 'Decisiveness', 'Strategic Thinking', 'Efficiency', 'Goal-oriented'],
 ARRAY['Can be too direct', 'Impatient with details', 'May overlook emotions'],
 ARRAY['CEO', 'Project Manager', 'Consultant', 'Entrepreneur', 'Executive'],
 'Direct and assertive, comfortable with public speaking, takes charge in conversations'),

('Pengamat Introvert', 'OI', 'Praktis, teliti, dan mengandalkan fakta nyata.',
 ARRAY['Detail-oriented', 'Reliable', 'Organized', 'Systematic', 'Thorough'],
 ARRAY['May resist change', 'Can be overly cautious', 'Rigid with rules'],
 ARRAY['Accountant', 'Quality Analyst', 'Administrator', 'Librarian', 'Compliance Officer'],
 'Prefers one-on-one conversations, values facts over emotions, methodical communicator'),

('Pengamat Extrovert', 'OE', 'Energik, spontan, dan suka menikmati momen saat ini.',
 ARRAY['Adaptable', 'Sociable', 'Practical', 'Resourceful', 'Action-oriented'],
 ARRAY['May lack long-term planning', 'Can be impulsive', 'Difficulty with abstract concepts'],
 ARRAY['Sales', 'Event Planner', 'Athlete', 'Performer', 'Entrepreneur'],
 'Spontaneous and engaging, learns by doing, enjoys interactive discussions'),

('Perasa Introvert', 'FI', 'Penuh empati, peduli, dan setia pada nilai-nilai pribadi.',
 ARRAY['Empathetic', 'Creative', 'Idealistic', 'Compassionate', 'Authentic'],
 ARRAY['Overly sensitive', 'Difficulty with criticism', 'Avoids conflict'],
 ARRAY['Counselor', 'Writer', 'Artist', 'Social Worker', 'Psychologist'],
 'Deep listener, values authenticity, expresses through art and writing'),

('Perasa Extrovert', 'FE', 'Karismatik, inspiratif, dan mudah bergaul dengan orang lain.',
 ARRAY['Charismatic', 'Inspiring', 'Organized', 'Empathetic', 'Supportive'],
 ARRAY['Can be too people-pleasing', 'May avoid conflict', 'Overly concerned with harmony'],
 ARRAY['Teacher', 'HR Manager', 'Coach', 'Public Relations', 'Counselor'],
 'Warm and expressive, naturally builds rapport, motivates others through communication'),

('Pemimpi Introvert', 'DI', 'Idealis, kreatif, dan mencari makna mendalam dalam hidup.',
 ARRAY['Innovative', 'Visionary', 'Independent', 'Creative', 'Philosophical'],
 ARRAY['Can be impractical', 'May struggle with routine', 'Difficulty finishing projects'],
 ARRAY['Designer', 'Researcher', 'Architect', 'Philosopher', 'Novelist'],
 'Conceptual thinker, enjoys exploring ideas, needs space to process thoughts'),

('Pemimpi Extrovert', 'DE', 'Inovatif, antusias, dan pandai menghubungkan ide-ide.',
 ARRAY['Enthusiastic', 'Creative', 'Inspiring', 'Innovative', 'Charismatic'],
 ARRAY['Can be scattered', 'May struggle with follow-through', 'Easily bored with details'],
 ARRAY['Entrepreneur', 'Marketing', 'Innovator', 'Motivational Speaker', 'Creative Director'],
 'Energetic and persuasive, brainstorms with others, inspires through vision'),

('Penggerak', 'PG', 'Adaptif, pemecah masalah, dan berorientasi pada tindakan.',
 ARRAY['Problem Solver', 'Adaptable', 'Practical', 'Logical', 'Risk-taker'],
 ARRAY['May be too focused on present', 'Can overlook long-term consequences', 'Impatient with theory'],
 ARRAY['Technician', 'Engineer', 'Negotiator', 'Emergency Responder', 'Mechanic'],
 'Action-oriented, direct and to the point, excels in crisis situations')
ON CONFLICT (code) DO NOTHING;

-- Insert comprehensive test questions (40 questions covering all dimensions)
INSERT INTO test_questions (question_text, category, question_order) VALUES
-- Introversion vs Extroversion (I/E)
('Saya merasa lebih berenergi setelah menghabiskan waktu sendirian', 'Energy Source', 1),
('Saya lebih suka bekerja dalam tim daripada bekerja sendiri', 'Work Style', 2),
('Saya menikmati menghadiri acara sosial dan bertemu orang baru', 'Social Interaction', 3),
('Saya membutuhkan waktu tenang untuk me-recharge energi saya', 'Energy Management', 4),
('Saya cenderung berpikir sebelum berbicara', 'Communication Style', 5),

-- Thinking vs Feeling (T/F)
('Saya membuat keputusan berdasarkan logika daripada perasaan', 'Decision Making', 6),
('Saya mudah berempati dengan perasaan orang lain', 'Emotional Intelligence', 7),
('Dalam konflik, saya prioritaskan keadilan daripada harmoni', 'Conflict Resolution', 8),
('Saya lebih suka kritik yang objektif daripada pujian yang subjektif', 'Feedback Preference', 9),
('Nilai-nilai pribadi sangat mempengaruhi keputusan saya', 'Value System', 10),

-- Sensing vs Intuition (S/N)
('Saya lebih fokus pada fakta dan detail daripada gambaran besar', 'Information Processing', 11),
('Saya sering memikirkan masa depan dan kemungkinan-kemungkinannya', 'Future Orientation', 12),
('Saya lebih suka ide-ide baru daripada cara-cara yang sudah terbukti', 'Innovation', 13),
('Saya percaya pada intuisi dan firasat saya', 'Intuition', 14),
('Saya memperhatikan detail-detail kecil yang orang lain lewatkan', 'Attention to Detail', 15),

-- Judging vs Perceiving (J/P)
('Saya merasa nyaman dengan rutinitas dan struktur', 'Structure Preference', 16),
('Saya lebih suka membuat rencana detail sebelum bertindak', 'Planning Style', 17),
('Saya fleksibel dan mudah beradaptasi dengan perubahan', 'Adaptability', 18),
('Saya suka menyelesaikan tugas jauh sebelum deadline', 'Time Management', 19),
('Saya lebih suka menjaga opsi tetap terbuka daripada membuat keputusan cepat', 'Decision Style', 20),

-- Additional personality dimensions
('Saya menikmati menganalisis masalah yang kompleks', 'Problem Solving', 21),
('Saya lebih suka pekerjaan yang melibatkan kreativitas', 'Creativity', 22),
('Saya merasa bertanggung jawab untuk membantu orang lain', 'Social Responsibility', 23),
('Saya tertarik pada teori dan konsep abstrak', 'Abstract Thinking', 24),
('Saya lebih suka bekerja dengan tangan dan alat praktis', 'Practical Skills', 25),

-- Work preferences
('Saya bekerja paling baik di bawah tekanan dan deadline ketat', 'Stress Response', 26),
('Saya menikmati pekerjaan yang rutin dan dapat diprediksi', 'Routine Preference', 27),
('Saya suka mengambil risiko untuk mencapai tujuan', 'Risk Taking', 28),
('Saya lebih suka bekerja mandiri tanpa banyak supervisi', 'Autonomy', 29),
('Saya menikmati memimpin dan mengatur orang lain', 'Leadership', 30),

-- Communication and relationships
('Saya mudah memulai percakapan dengan orang asing', 'Social Confidence', 31),
('Saya lebih suka mendengar daripada berbicara', 'Communication Balance', 32),
('Saya terbuka untuk berbagi perasaan dan pikiran pribadi', 'Emotional Expression', 33),
('Saya lebih suka komunikasi tertulis daripada verbal', 'Communication Medium', 34),
('Saya dapat dengan mudah membaca bahasa tubuh orang lain', 'Social Awareness', 35),

-- Additional traits
('Saya lebih suka mengikuti aturan yang ada daripada membuat aturan sendiri', 'Rule Following', 36),
('Saya sering mencari cara baru untuk melakukan sesuatu', 'Innovation Seeking', 37),
('Saya merasa tidak nyaman dengan ambiguitas dan ketidakpastian', 'Certainty Need', 38),
('Saya menikmati debat dan diskusi intelektual', 'Intellectual Engagement', 39),
('Saya lebih fokus pada hasil akhir daripada proses', 'Goal Orientation', 40)
ON CONFLICT DO NOTHING;

-- Insert sample admin user
-- Email: admin@saintara.com
-- Password: admin123
-- Hash generated with bcrypt, salt rounds: 10
INSERT INTO users (email, password, name, role) VALUES
('admin@saintara.com', '$2a$10$8K1p/a0dL3cqvVxM9.6rO8GhQCqE3xZ9lJ7RM7qK5Bb4xN5qS9yLm', 'Admin Saintara', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample regular user for testing
-- Email: user@test.com
-- Password: test123
INSERT INTO users (email, password, name, role) VALUES
('user@test.com', '$2a$10$YQmJ3p/a0dL3cqvVxM9.6rO8GhQCqE3xZ9lJ7RM7qK5Bb4xN5test', 'Test User', 'user')
ON CONFLICT (email) DO NOTHING;

COMMIT;
