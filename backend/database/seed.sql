-- Seed data for Saintara database

-- Insert character types
INSERT INTO character_types (name, code, description, strengths, challenges, career_paths, communication_style) VALUES
('Pemikir Introvert', 'PI', 'Analis yang mendalam, logis, dan lebih suka bekerja sendiri.',
 ARRAY['Analisis Tajam', 'Mandiri', 'Pemikir Strategis'],
 ARRAY['Cenderung Overthinking', 'Sulit Beradaptasi Cepat'],
 ARRAY['Researcher', 'Data Analyst', 'Software Developer', 'Scientist'],
 'Lebih suka komunikasi tertulis, detail-oriented, membutuhkan waktu untuk berpikir sebelum merespons'),

('Pemikir Extrovert', 'PE', 'Pemimpin tegas, strategis, dan suka mengatur sistem.',
 ARRAY['Leadership', 'Decisiveness', 'Strategic Thinking'],
 ARRAY['Can be too direct', 'Impatient with details'],
 ARRAY['CEO', 'Project Manager', 'Consultant', 'Entrepreneur'],
 'Direct and assertive, comfortable with public speaking, takes charge in conversations'),

('Pengamat Introvert', 'OI', 'Praktis, teliti, dan mengandalkan fakta nyata.',
 ARRAY['Detail-oriented', 'Reliable', 'Organized'],
 ARRAY['May resist change', 'Can be overly cautious'],
 ARRAY['Accountant', 'Quality Analyst', 'Administrator', 'Librarian'],
 'Prefers one-on-one conversations, values facts over emotions, methodical communicator'),

('Pengamat Extrovert', 'OE', 'Energik, spontan, dan suka menikmati momen saat ini.',
 ARRAY['Adaptable', 'Sociable', 'Practical'],
 ARRAY['May lack long-term planning', 'Can be impulsive'],
 ARRAY['Sales', 'Event Planner', 'Athlete', 'Performer'],
 'Spontaneous and engaging, learns by doing, enjoys interactive discussions'),

('Perasa Introvert', 'FI', 'Penuh empati, peduli, dan setia pada nilai-nilai pribadi.',
 ARRAY['Empathetic', 'Creative', 'Idealistic'],
 ARRAY['Overly sensitive', 'Difficulty with criticism'],
 ARRAY['Counselor', 'Writer', 'Artist', 'Social Worker'],
 'Deep listener, values authenticity, expresses through art and writing'),

('Perasa Extrovert', 'FE', 'Karismatik, inspiratif, dan mudah bergaul dengan orang lain.',
 ARRAY['Charismatic', 'Inspiring', 'Organized'],
 ARRAY['Can be too people-pleasing', 'May avoid conflict'],
 ARRAY['Teacher', 'HR Manager', 'Coach', 'Public Relations'],
 'Warm and expressive, naturally builds rapport, motivates others through communication'),

('Pemimpi Introvert', 'DI', 'Idealis, kreatif, dan mencari makna mendalam dalam hidup.',
 ARRAY['Innovative', 'Visionary', 'Independent'],
 ARRAY['Can be impractical', 'May struggle with routine'],
 ARRAY['Designer', 'Researcher', 'Architect', 'Philosopher'],
 'Conceptual thinker, enjoys exploring ideas, needs space to process thoughts'),

('Pemimpi Extrovert', 'DE', 'Inovatif, antusias, dan pandai menghubungkan ide-ide.',
 ARRAY['Enthusiastic', 'Creative', 'Inspiring'],
 ARRAY['Can be scattered', 'May struggle with follow-through'],
 ARRAY['Entrepreneur', 'Marketing', 'Innovator', 'Motivational Speaker'],
 'Energetic and persuasive, brainstorms with others, inspires through vision'),

('Penggerak', 'PG', 'Adaptif, pemecah masalah, dan berorientasi pada tindakan.',
 ARRAY['Problem Solver', 'Adaptable', 'Practical'],
 ARRAY['May be too focused on present', 'Can overlook long-term consequences'],
 ARRAY['Technician', 'Engineer', 'Negotiator', 'Emergency Responder'],
 'Action-oriented, direct and to the point, excels in crisis situations')
ON CONFLICT (code) DO NOTHING;

-- Insert sample test questions
INSERT INTO test_questions (question_text, category, question_order) VALUES
('Saya lebih suka bekerja sendiri daripada dalam tim', 'Work Style', 1),
('Saya membuat keputusan berdasarkan logika daripada perasaan', 'Decision Making', 2),
('Saya menikmati menghadiri acara sosial dan bertemu orang baru', 'Social', 3),
('Saya lebih fokus pada fakta dan detail daripada gambaran besar', 'Thinking Style', 4),
('Saya merasa nyaman dengan rutinitas dan struktur', 'Work Style', 5),
('Saya sering memikirkan masa depan dan kemungkinan-kemungkinannya', 'Thinking Style', 6),
('Saya mudah berempati dengan perasaan orang lain', 'Emotional', 7),
('Saya lebih suka membuat rencana detail sebelum bertindak', 'Planning', 8),
('Saya merasa energik setelah berinteraksi dengan banyak orang', 'Social', 9),
('Saya lebih suka ide-ide baru daripada cara-cara yang sudah terbukti', 'Innovation', 10)
ON CONFLICT DO NOTHING;

-- Insert sample admin user (password: admin123)
INSERT INTO users (email, password, name, role) VALUES
('admin@saintara.com', '$2a$10$YourHashedPasswordHere', 'Admin Saintara', 'admin')
ON CONFLICT (email) DO NOTHING;

COMMIT;
