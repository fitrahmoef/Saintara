import { Pool } from 'pg';
import logger from '../config/logger'
import { emailService } from './email.service';
import logger from '../config/logger'
import {
import logger from '../config/logger'
  QueueEmailOptions,
  EmailQueueItem,
  EmailQueueStatus,
  BulkEmailOptions,
  EmailTemplate
} from '../types/email.types';

class EmailQueueService {
  private pool: Pool;
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly PROCESS_INTERVAL_MS = 10000; // Process every 10 seconds
  private readonly MAX_BATCH_SIZE = 10; // Process 10 emails at a time

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Start the email queue processor
   */
  public startProcessor(): void {
    if (this.processingInterval) {
      logger.info('Email queue processor already running');
      return;
    }

    logger.info('Starting email queue processor...');
    this.processingInterval = setInterval(
      () => this.processQueue(),
      this.PROCESS_INTERVAL_MS
    );

    // Process immediately on start
    this.processQueue();
  }

  /**
   * Stop the email queue processor
   */
  public stopProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      logger.info('Email queue processor stopped');
    }
  }

  /**
   * Add email to queue
   */
  async queueEmail(options: QueueEmailOptions): Promise<string> {
    const query = `
      INSERT INTO email_queue (
        to_email, to_name, subject, html_body, text_body,
        template_name, template_data, priority, scheduled_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    const values = [
      options.to,
      options.toName || null,
      options.subject,
      options.html || null,
      options.text || null,
      options.templateName || null,
      options.templateData ? JSON.stringify(options.templateData) : null,
      options.priority || 5,
      options.scheduledAt || new Date()
    ];

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      logger.error('Error queueing email:', error);
      throw error;
    }
  }

  /**
   * Queue bulk emails (for multiple recipients)
   */
  async queueBulkEmails(options: BulkEmailOptions): Promise<string[]> {
    const ids: string[] = [];

    // Get template if template name is provided
    let template: EmailTemplate | null = null;
    if (options.templateName) {
      template = await this.getTemplate(options.templateName);
      if (!template) {
        throw new Error(`Template '${options.templateName}' not found`);
      }
    }

    for (const recipient of options.recipients) {
      const templateData = {
        ...(options.commonData || {}),
        ...(recipient.customData || {}),
        email: recipient.email,
        name: recipient.name || ''
      };

      const id = await this.queueEmail({
        to: recipient.email,
        toName: recipient.name,
        subject: template?.subject || '',
        templateName: options.templateName,
        templateData,
        priority: options.priority,
        scheduledAt: options.scheduledAt
      });

      ids.push(id);
    }

    return ids;
  }

  /**
   * Get email template by name
   */
  async getTemplate(name: string): Promise<EmailTemplate | null> {
    const query = `
      SELECT id, name, subject, html_template as "htmlTemplate",
             text_template as "textTemplate", description,
             variables, active
      FROM email_templates
      WHERE name = $1 AND active = true
    `;

    try {
      const result = await this.pool.query(query, [name]);
      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching template:', error);
      return null;
    }
  }

  /**
   * Process email queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    if (!emailService.isReady()) {
      logger.warn('Email service not configured, skipping queue processing');
      return;
    }

    this.isProcessing = true;

    try {
      // Get pending emails ordered by priority and scheduled time
      const query = `
        SELECT id, to_email as "toEmail", to_name as "toName",
               subject, html_body as "htmlBody", text_body as "textBody",
               template_name as "templateName", template_data as "templateData",
               priority, attempts, max_attempts as "maxAttempts"
        FROM email_queue
        WHERE status = 'pending'
          AND scheduled_at <= NOW()
          AND attempts < max_attempts
        ORDER BY priority ASC, scheduled_at ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      `;

      const result = await this.pool.query(query, [this.MAX_BATCH_SIZE]);
      const emails = result.rows;

      if (emails.length === 0) {
        this.isProcessing = false;
        return;
      }

      logger.info(`Processing ${emails.length} emails from queue...`);

      // Process emails in parallel
      await Promise.all(
        emails.map(email => this.processEmail(email))
      );

    } catch (error) {
      logger.error('Error processing email queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process single email
   */
  private async processEmail(email: EmailQueueItem): Promise<void> {
    try {
      // Mark as processing
      await this.updateEmailStatus(email.id, 'processing');

      // Render template if needed
      let html = email.htmlBody;
      let text = email.textBody;

      if (email.templateName && email.templateData) {
        const template = await this.getTemplate(email.templateName);
        if (template) {
          html = emailService.renderTemplate(
            template.htmlTemplate,
            email.templateData
          );
          if (template.textTemplate) {
            text = emailService.renderTemplate(
              template.textTemplate,
              email.templateData
            );
          }

          // Render subject with template data
          const subject = emailService.renderTemplate(
            template.subject,
            email.templateData
          );

          // Update subject if it was rendered from template
          if (subject) {
            email.subject = subject;
          }
        }
      }

      // Send email
      const result = await emailService.sendEmail({
        to: email.toEmail,
        toName: email.toName,
        subject: email.subject,
        html: html || '',
        text: text
      });

      if (result.success) {
        // Mark as sent
        await this.markEmailSent(email.id);
        logger.info(`Email ${email.id} sent successfully`);
      } else {
        // Mark as failed and retry
        await this.markEmailFailed(
          email.id,
          result.error || 'Unknown error',
          email.attempts + 1
        );
        logger.error(`Email ${email.id} failed:`, result.error);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error processing email ${email.id}:`, error);

      await this.markEmailFailed(
        email.id,
        errorMessage,
        email.attempts + 1
      );
    }
  }

  /**
   * Update email status
   */
  private async updateEmailStatus(id: string, status: EmailQueueStatus): Promise<void> {
    const query = `
      UPDATE email_queue
      SET status = $1, updated_at = NOW()
      WHERE id = $2
    `;

    await this.pool.query(query, [status, id]);
  }

  /**
   * Mark email as sent
   */
  private async markEmailSent(id: string): Promise<void> {
    const query = `
      UPDATE email_queue
      SET status = 'sent', sent_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `;

    await this.pool.query(query, [id]);
  }

  /**
   * Mark email as failed
   */
  private async markEmailFailed(id: string, error: string, attempts: number): Promise<void> {
    const query = `
      UPDATE email_queue
      SET status = CASE
                    WHEN attempts >= max_attempts THEN 'failed'::VARCHAR
                    ELSE 'pending'::VARCHAR
                  END,
          attempts = $2,
          last_error = $3,
          failed_at = CASE
                        WHEN attempts >= max_attempts THEN NOW()
                        ELSE NULL
                      END,
          updated_at = NOW()
      WHERE id = $1
    `;

    await this.pool.query(query, [id, attempts, error]);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    total: number;
  }> {
    const query = `
      SELECT
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(*) as total
      FROM email_queue
      WHERE created_at > NOW() - INTERVAL '7 days'
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting queue stats:', error);
      return { pending: 0, processing: 0, sent: 0, failed: 0, total: 0 };
    }
  }

  /**
   * Retry failed emails
   */
  async retryFailedEmails(limit: number = 10): Promise<number> {
    const query = `
      UPDATE email_queue
      SET status = 'pending',
          attempts = 0,
          last_error = NULL,
          failed_at = NULL,
          updated_at = NOW()
      WHERE status = 'failed'
        AND id IN (
          SELECT id FROM email_queue
          WHERE status = 'failed'
          ORDER BY created_at DESC
          LIMIT $1
        )
      RETURNING id
    `;

    try {
      const result = await this.pool.query(query, [limit]);
      return result.rows.length;
    } catch (error) {
      logger.error('Error retrying failed emails:', error);
      return 0;
    }
  }

  /**
   * Clean old emails from queue
   */
  async cleanOldEmails(daysOld: number = 30): Promise<number> {
    const query = `
      DELETE FROM email_queue
      WHERE created_at < NOW() - INTERVAL '${daysOld} days'
        AND status IN ('sent', 'failed', 'cancelled')
      RETURNING id
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows.length;
    } catch (error) {
      logger.error('Error cleaning old emails:', error);
      return 0;
    }
  }
}

export default EmailQueueService;
