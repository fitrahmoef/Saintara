import nodemailer, { Transporter } from 'nodemailer';
import logger from '../config/logger'
import {
import logger from '../config/logger'
  EmailConfig,
  SendEmailOptions,
  EmailSendResult,
  TemplateRenderData
} from '../types/email.types';

class EmailService {
  private transporter: Transporter | null = null;
  private fromEmail: string;
  private isConfigured: boolean = false;

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
      logger.warn('Email service not configured. Email features will be disabled.');
      this.isConfigured = false;
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
    this.isConfigured = true;

    // Verify connection configuration
    this.transporter.verify((error) => {
      if (error) {
        logger.error('Email service configuration error:', error);
        this.isConfigured = false;
      } else {
        logger.info('Email service ready to send messages');
      }
    });
  }

  /**
   * Check if email service is configured and ready
   */
  public isReady(): boolean {
    return this.isConfigured && this.transporter !== null;
  }

  /**
   * Send email immediately (without queue)
   */
  async sendEmail(options: SendEmailOptions): Promise<EmailSendResult> {
    if (!this.transporter || !this.isConfigured) {
      logger.warn('Email service not available. Email not sent to:', options.to);
      return {
        success: false,
        error: 'Email service not configured'
      };
    }

    try {
      const mailOptions = {
        from: options.from
          ? (options.fromName ? `${options.fromName} <${options.from}>` : options.from)
          : this.fromEmail,
        to: options.toName ? `${options.toName} <${options.to}>` : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully:', info.messageId);
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error sending email:', error);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Render template with data (simple template engine)
   */
  public renderTemplate(template: string, data: TemplateRenderData): string {
    let rendered = template;

    // Replace {{variable}} with data values
    Object.keys(data).forEach(key => {
      const value = data[key];
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value ?? ''));
    });

    // Handle simple conditional blocks {{#if variable}}...{{/if}}
    rendered = rendered.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, variable, content) => {
      return data[variable] ? content : '';
    });

    // Handle simple loops {{#each array}}...{{/each}}
    rendered = rendered.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (match, variable, content) => {
      const array = data[variable];
      if (Array.isArray(array)) {
        return array.map(item => {
          let itemContent = content;
          if (typeof item === 'object') {
            Object.keys(item).forEach(key => {
              const regex = new RegExp(`{{${key}}}`, 'g');
              itemContent = itemContent.replace(regex, String(item[key] ?? ''));
            });
          }
          return itemContent;
        }).join('');
      }
      return '';
    });

    return rendered;
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string, name: string): Promise<EmailSendResult> {
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
      toName: name,
      subject: 'Reset Your Saintara Password',
      html,
    });
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(email: string, verificationToken: string, name: string): Promise<EmailSendResult> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

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
            <h2>Verify Your Email Address</h2>
            <p>Hello ${name},</p>
            <p>Thank you for registering with Saintara! To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="button">Verify Email</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account with Saintara, you can safely ignore this email.</p>
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
      toName: name,
      subject: 'Verify Your Saintara Email Address',
      html,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, name: string, institutionName?: string): Promise<EmailSendResult> {
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
            ${institutionName ? `<p><strong>Institution:</strong> ${institutionName}</p>` : ''}
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
      toName: name,
      subject: 'Welcome to Saintara - Discover Your True Potential',
      html,
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();
