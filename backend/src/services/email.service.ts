import nodemailer, { Transporter } from 'nodemailer';
import {
  EmailConfig,
  SendEmailOptions,
  EmailSendResult,
  TemplateRenderData
} from '../types/email.types';
import logger from '../config/logger';

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

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmationEmail(
    email: string,
    name: string,
    transaction: any,
    voucherCode?: string
  ): Promise<EmailSendResult> {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; padding: 20px; text-align: center; }
          .header h1 { color: #fff; margin: 0; }
          .content { background-color: #f9f9f9; padding: 30px; }
          .success-icon { font-size: 48px; text-align: center; color: #4CAF50; }
          .details { background: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4CAF50;
            color: #fff;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
          }
          .voucher-code {
            background: #FEC53D;
            padding: 15px;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Successful!</h1>
          </div>
          <div class="content">
            <div class="success-icon">✓</div>
            <h2>Hello ${name}!</h2>
            <p>Thank you for your payment. Your transaction has been completed successfully.</p>

            <div class="details">
              <h3>Transaction Details</h3>
              <div class="detail-row">
                <span><strong>Transaction Code:</strong></span>
                <span>${transaction.transaction_code}</span>
              </div>
              <div class="detail-row">
                <span><strong>Package:</strong></span>
                <span>${transaction.package_type}</span>
              </div>
              <div class="detail-row">
                <span><strong>Amount:</strong></span>
                <span>Rp ${transaction.amount.toLocaleString('id-ID')}</span>
              </div>
              <div class="detail-row">
                <span><strong>Payment Method:</strong></span>
                <span>${transaction.payment_method}</span>
              </div>
            </div>

            ${voucherCode ? `
              <div class="voucher-code">
                <p style="margin: 0;">Your Voucher Code</p>
                <p style="margin: 5px 0; font-size: 28px;">${voucherCode}</p>
              </div>
              <p style="text-align: center;">Use this code to access your test.</p>
            ` : ''}

            <p style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
            </p>

            <p>If you have any questions, please don't hesitate to contact us.</p>
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
      subject: 'Payment Successful - Saintara',
      html,
    });
  }

  /**
   * Send payment failure email
   */
  async sendPaymentFailureEmail(
    email: string,
    name: string,
    transaction: any
  ): Promise<EmailSendResult> {
    const retryUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/products`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f44336; padding: 20px; text-align: center; }
          .header h1 { color: #fff; margin: 0; }
          .content { background-color: #f9f9f9; padding: 30px; }
          .error-icon { font-size: 48px; text-align: center; color: #f44336; }
          .details { background: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
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
            <h1>Payment Failed</h1>
          </div>
          <div class="content">
            <div class="error-icon">✗</div>
            <h2>Hello ${name}</h2>
            <p>Unfortunately, your payment could not be processed.</p>

            <div class="details">
              <h3>Transaction Details</h3>
              <div class="detail-row">
                <span><strong>Transaction Code:</strong></span>
                <span>${transaction.transaction_code}</span>
              </div>
              <div class="detail-row">
                <span><strong>Package:</strong></span>
                <span>${transaction.package_type}</span>
              </div>
              <div class="detail-row">
                <span><strong>Amount:</strong></span>
                <span>Rp ${transaction.amount.toLocaleString('id-ID')}</span>
              </div>
              ${transaction.payment_failure_reason ? `
              <div class="detail-row">
                <span><strong>Reason:</strong></span>
                <span>${transaction.payment_failure_reason}</span>
              </div>
              ` : ''}
            </div>

            <p><strong>What you can do:</strong></p>
            <ul>
              <li>Check your payment method details</li>
              <li>Ensure you have sufficient funds</li>
              <li>Try a different payment method</li>
              <li>Contact your bank if the issue persists</li>
            </ul>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${retryUrl}" class="button">Try Again</a>
            </p>

            <p>If you need assistance, please contact our support team.</p>
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
      subject: 'Payment Failed - Saintara',
      html,
    });
  }

  /**
   * Send partnership application notification to admin
   */
  async sendPartnershipNotificationEmail(
    applicationData: {
      name: string;
      email: string;
      phone: string;
      organization?: string;
      message?: string;
      experience?: string;
      social_media?: string;
      application_id: number;
    }
  ): Promise<EmailSendResult> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@saintara.com';
    const reviewUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/approvals`;

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
          .info-box {
            background: #fff;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #FEC53D;
          }
          .info-row {
            margin: 12px 0;
            padding-bottom: 12px;
            border-bottom: 1px solid #eee;
          }
          .info-row:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #666; display: inline-block; width: 140px; }
          .value { color: #333; }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #FEC53D;
            color: #000;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 New Partnership Application</h1>
          </div>
          <div class="content">
            <h2>New Partnership Request Received</h2>
            <p>A new partnership application has been submitted. Please review the details below:</p>

            <div class="info-box">
              <div class="info-row">
                <span class="label">Application ID:</span>
                <span class="value">#${applicationData.application_id}</span>
              </div>
              <div class="info-row">
                <span class="label">Name:</span>
                <span class="value">${applicationData.name}</span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">${applicationData.email}</span>
              </div>
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="value">${applicationData.phone}</span>
              </div>
              ${applicationData.organization ? `
              <div class="info-row">
                <span class="label">Organization:</span>
                <span class="value">${applicationData.organization}</span>
              </div>
              ` : ''}
              ${applicationData.experience ? `
              <div class="info-row">
                <span class="label">Experience:</span>
                <span class="value">${applicationData.experience}</span>
              </div>
              ` : ''}
              ${applicationData.social_media ? `
              <div class="info-row">
                <span class="label">Social Media:</span>
                <span class="value">${applicationData.social_media}</span>
              </div>
              ` : ''}
              ${applicationData.message ? `
              <div class="info-row">
                <span class="label">Message:</span>
                <div class="value" style="margin-top: 8px; white-space: pre-wrap;">${applicationData.message}</div>
              </div>
              ` : ''}
            </div>

            <p style="text-align: center;">
              <a href="${reviewUrl}" class="button">Review Application</a>
            </p>

            <p style="color: #666; font-size: 14px;">
              <strong>Next Steps:</strong><br>
              1. Review the application details<br>
              2. Contact the applicant if needed<br>
              3. Approve or reject the application from the admin panel
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Saintara. All rights reserved.</p>
            <p>This is an automated notification from the Saintara partnership system.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `🤝 New Partnership Application from ${applicationData.name}`,
      html,
    });
  }

  /**
   * Send refund confirmation email
   */
  async sendRefundConfirmationEmail(
    email: string,
    name: string,
    transaction: any
  ): Promise<EmailSendResult> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; padding: 20px; text-align: center; }
          .header h1 { color: #fff; margin: 0; }
          .content { background-color: #f9f9f9; padding: 30px; }
          .info-icon { font-size: 48px; text-align: center; color: #2196F3; }
          .details { background: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Refund Processed</h1>
          </div>
          <div class="content">
            <div class="info-icon">ℹ</div>
            <h2>Hello ${name}</h2>
            <p>Your refund has been processed successfully.</p>

            <div class="details">
              <h3>Refund Details</h3>
              <div class="detail-row">
                <span><strong>Transaction Code:</strong></span>
                <span>${transaction.transaction_code}</span>
              </div>
              <div class="detail-row">
                <span><strong>Package:</strong></span>
                <span>${transaction.package_type}</span>
              </div>
              <div class="detail-row">
                <span><strong>Refund Amount:</strong></span>
                <span>Rp ${transaction.amount.toLocaleString('id-ID')}</span>
              </div>
              <div class="detail-row">
                <span><strong>Payment Method:</strong></span>
                <span>${transaction.payment_method}</span>
              </div>
            </div>

            <p><strong>Please note:</strong></p>
            <ul>
              <li>The refund will be credited to your original payment method</li>
              <li>It may take 5-10 business days for the refund to appear in your account</li>
              <li>Any vouchers associated with this transaction have been invalidated</li>
            </ul>

            <p>If you have any questions about this refund, please contact our support team.</p>
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
      subject: 'Refund Processed - Saintara',
      html,
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();
