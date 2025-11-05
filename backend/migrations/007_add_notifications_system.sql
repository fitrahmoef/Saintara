-- Migration: Add notifications system
-- Description: Creates tables for email queue, notifications, and email templates

-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'test_assigned', 'test_completed', 'payment_approved', 'event_invitation', 'announcement'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500), -- Optional link to related resource
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Create email_queue table for async email sending with retry
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email VARCHAR(255) NOT NULL,
    to_name VARCHAR(255),
    from_email VARCHAR(255),
    from_name VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT,
    template_name VARCHAR(100), -- References email_templates
    template_data JSONB, -- Data for template rendering
    priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'sent', 'failed', 'cancelled'
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_error TEXT,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When to send
    sent_at TIMESTAMP,
    failed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create email_templates table for reusable email templates
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL, -- 'welcome', 'password_reset', 'test_completed', etc.
    subject VARCHAR(500) NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT,
    description TEXT,
    variables JSONB, -- JSON array of required variables like ["name", "testTitle"]
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_institution_id ON notifications(institution_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled_at ON email_queue(scheduled_at);
CREATE INDEX idx_email_queue_priority ON email_queue(priority);
CREATE INDEX idx_email_queue_to_email ON email_queue(to_email);
CREATE INDEX idx_email_queue_created_at ON email_queue(created_at DESC);

CREATE INDEX idx_email_templates_name ON email_templates(name);
CREATE INDEX idx_email_templates_active ON email_templates(active);

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_template, text_template, description, variables) VALUES
(
    'welcome',
    'Selamat Datang di Saintara - {{customerName}}',
    '<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FEC53D; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #FEC53D; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; color: #000;">Saintara</h1>
        </div>
        <div class="content">
            <h2>Selamat Datang, {{customerName}}!</h2>
            <p>Terima kasih telah bergabung dengan Saintara. Kami senang memiliki Anda sebagai bagian dari komunitas kami.</p>
            <p><strong>Informasi Akun Anda:</strong></p>
            <ul>
                <li>Email: {{email}}</li>
                <li>Institusi: {{institutionName}}</li>
            </ul>
            <p>Anda sekarang dapat login dan mulai menggunakan layanan kami.</p>
            <a href="{{loginUrl}}" class="button">Login Sekarang</a>
            <p>Jika Anda memiliki pertanyaan, jangan ragu untuk menghubungi kami.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 Saintara. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Selamat Datang, {{customerName}}!

Terima kasih telah bergabung dengan Saintara.

Informasi Akun:
Email: {{email}}
Institusi: {{institutionName}}

Login di: {{loginUrl}}

Tim Saintara',
    'Welcome email for new customers',
    '["customerName", "email", "institutionName", "loginUrl"]'::jsonb
),
(
    'test_assigned',
    'Tes Baru Telah Ditugaskan - {{testTitle}}',
    '<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FEC53D; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #FEC53D; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; color: #000;">Saintara</h1>
        </div>
        <div class="content">
            <h2>Tes Baru Untuk Anda</h2>
            <p>Halo {{customerName}},</p>
            <p>Tes baru telah ditugaskan kepada Anda:</p>
            <div style="background: white; padding: 15px; border-left: 4px solid #FEC53D; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0;">{{testTitle}}</h3>
                <p style="margin: 5px 0;"><strong>Batas Waktu:</strong> {{deadline}}</p>
            </div>
            <p>Silakan login untuk memulai tes Anda.</p>
            <a href="{{testUrl}}" class="button">Mulai Tes</a>
        </div>
        <div class="footer">
            <p>&copy; 2025 Saintara. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Halo {{customerName}},

Tes baru telah ditugaskan kepada Anda:

{{testTitle}}
Batas Waktu: {{deadline}}

Mulai tes di: {{testUrl}}

Tim Saintara',
    'Email when a test is assigned to a customer',
    '["customerName", "testTitle", "deadline", "testUrl"]'::jsonb
),
(
    'test_completed',
    'Hasil Tes Anda Sudah Tersedia - {{testTitle}}',
    '<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FEC53D; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #FEC53D; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; color: #000;">Saintara</h1>
        </div>
        <div class="content">
            <h2>Hasil Tes Anda Tersedia!</h2>
            <p>Halo {{customerName}},</p>
            <p>Hasil tes <strong>{{testTitle}}</strong> Anda sudah tersedia.</p>
            <p>Anda dapat melihat hasil lengkap dan mengunduh sertifikat Anda sekarang.</p>
            <a href="{{resultsUrl}}" class="button">Lihat Hasil</a>
        </div>
        <div class="footer">
            <p>&copy; 2025 Saintara. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Halo {{customerName}},

Hasil tes {{testTitle}} Anda sudah tersedia.

Lihat hasil di: {{resultsUrl}}

Tim Saintara',
    'Email when test results are ready',
    '["customerName", "testTitle", "resultsUrl"]'::jsonb
),
(
    'payment_approved',
    'Pembayaran Anda Telah Disetujui',
    '<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FEC53D; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #FEC53D; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; color: #000;">Saintara</h1>
        </div>
        <div class="content">
            <h2>Pembayaran Disetujui</h2>
            <p>Halo {{customerName}},</p>
            <p>Pembayaran Anda telah diverifikasi dan disetujui.</p>
            <div style="background: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Jumlah:</strong> Rp {{amount}}</p>
                <p style="margin: 5px 0;"><strong>Tanggal:</strong> {{date}}</p>
                <p style="margin: 5px 0;"><strong>Invoice:</strong> {{invoiceNumber}}</p>
            </div>
            <p>Terima kasih atas pembayaran Anda. Anda sekarang dapat mengakses layanan yang telah dibayarkan.</p>
            <a href="{{dashboardUrl}}" class="button">Buka Dashboard</a>
        </div>
        <div class="footer">
            <p>&copy; 2025 Saintara. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Halo {{customerName}},

Pembayaran Anda telah disetujui.

Jumlah: Rp {{amount}}
Tanggal: {{date}}
Invoice: {{invoiceNumber}}

Dashboard: {{dashboardUrl}}

Tim Saintara',
    'Email when payment is approved',
    '["customerName", "amount", "date", "invoiceNumber", "dashboardUrl"]'::jsonb
),
(
    'bulk_import_completed',
    'Import Pelanggan Selesai - {{recordCount}} Records',
    '<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FEC53D; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .stats { background: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; color: #000;">Saintara</h1>
        </div>
        <div class="content">
            <h2>Import Pelanggan Selesai</h2>
            <p>Halo,</p>
            <p>Proses import pelanggan dari file <strong>{{fileName}}</strong> telah selesai.</p>
            <div class="stats">
                <h3>Ringkasan Import:</h3>
                <ul>
                    <li><strong>Total Records:</strong> {{totalRecords}}</li>
                    <li><strong>Berhasil:</strong> <span style="color: #4CAF50;">{{successCount}}</span></li>
                    <li><strong>Gagal:</strong> <span style="color: #F44336;">{{failedCount}}</span></li>
                </ul>
                {{#if hasErrors}}
                <p><strong>Errors:</strong></p>
                <ul>
                    {{#each errors}}
                    <li>Row {{row}}: {{message}}</li>
                    {{/each}}
                </ul>
                {{/if}}
            </div>
        </div>
        <div class="footer">
            <p>&copy; 2025 Saintara. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Import pelanggan selesai.

File: {{fileName}}
Total: {{totalRecords}}
Berhasil: {{successCount}}
Gagal: {{failedCount}}

Tim Saintara',
    'Email when bulk customer import completes',
    '["fileName", "totalRecords", "successCount", "failedCount", "errors"]'::jsonb
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE ON email_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
