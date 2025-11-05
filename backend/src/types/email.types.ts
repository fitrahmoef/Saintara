// Email-related type definitions

export interface EmailConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface SendEmailOptions {
  to: string;
  toName?: string;
  from?: string;
  fromName?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface QueueEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html?: string;
  text?: string;
  templateName?: string;
  templateData?: Record<string, unknown>;
  priority?: number; // 1 (highest) to 10 (lowest)
  scheduledAt?: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate?: string;
  description?: string;
  variables: string[];
  active: boolean;
}

export interface EmailQueueItem {
  id: string;
  toEmail: string;
  toName?: string;
  fromEmail?: string;
  fromName?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  templateName?: string;
  templateData?: Record<string, unknown>;
  priority: number;
  status: EmailQueueStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  scheduledAt: Date;
  sentAt?: Date;
  failedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type EmailQueueStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';

export interface BulkEmailOptions {
  recipients: Array<{
    email: string;
    name?: string;
    customData?: Record<string, unknown>;
  }>;
  templateName: string;
  commonData?: Record<string, unknown>;
  priority?: number;
  scheduledAt?: Date;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface TemplateRenderData {
  [key: string]: unknown;
}
