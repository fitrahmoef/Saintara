import nodemailer, { Transporter } from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'Saintara <noreply@saintara.com>';
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    // Skip initialization if email config is not provided (for development)
    if (!host || !port || !user || !pass) {
      console.warn('Email service not configured. Email features will be disabled.');
      return;
    }

    const config: EmailConfig = {
      host,
      port: parseInt(port),
      secure: parseInt(port) === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    };

    this.transporter = nodemailer.createTransport(config);

    // Verify connection configuration
    this.transporter.verify((error) => {
      if (error) {
        console.error('Email service configuration error:', error);
      } else {
        console.log('Email service ready to send messages');
      }
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email service not available. Email not sent to:', options.to);
      return false;
    }

    try {
      const mailOptions = {
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, name: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FEC53D; padding: 20px; text-align: center; }
          .header h1 { color: #000; margin: 0; }
          .content { background-color: #f9f9f9; padding: 30px; }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #FEC53D;
            color: #000;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Saintara</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello ${name},</p>
            <p>We received a request to reset your password for your Saintara account. Click the button below to reset your password:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            <p>Best regards,<br>The Saintara Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Saintara. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Saintara Password',
      html,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FEC53D; padding: 20px; text-align: center; }
          .header h1 { color: #000; margin: 0; }
          .content { background-color: #f9f9f9; padding: 30px; }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #FEC53D;
            color: #000;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Saintara!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Thank you for joining Saintara, your journey to self-discovery starts now!</p>
            <p>With Saintara, you can:</p>
            <ul>
              <li>Discover your natural character traits</li>
              <li>Understand your strengths and challenges</li>
              <li>Get personalized career recommendations</li>
              <li>Access AI-powered insights</li>
            </ul>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" class="button">Get Started</a>
            </p>
            <p>We're excited to have you on board!</p>
            <p>Best regards,<br>The Saintara Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Saintara. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Saintara - Discover Your True Potential',
      html,
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();
