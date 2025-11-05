/**
 * Email Service Tests
 */

import { emailService } from '../src/services/email.service';

describe('EmailService', () => {
  describe('Template Rendering', () => {
    it('should render simple variables', () => {
      const template = 'Hello {{name}}, your email is {{email}}';
      const data = { name: 'John', email: 'john@example.com' };

      const result = emailService.renderTemplate(template, data);

      expect(result).toBe('Hello John, your email is john@example.com');
    });

    it('should handle missing variables', () => {
      const template = 'Hello {{name}}, your email is {{email}}';
      const data = { name: 'John' };

      const result = emailService.renderTemplate(template, data);

      expect(result).toBe('Hello John, your email is ');
    });

    it('should render conditional blocks - truthy', () => {
      const template = 'Hello {{name}}{{#if premium}}, Premium User{{/if}}!';
      const data = { name: 'John', premium: true };

      const result = emailService.renderTemplate(template, data);

      expect(result).toBe('Hello John, Premium User!');
    });

    it('should render conditional blocks - falsy', () => {
      const template = 'Hello {{name}}{{#if premium}}, Premium User{{/if}}!';
      const data = { name: 'John', premium: false };

      const result = emailService.renderTemplate(template, data);

      expect(result).toBe('Hello John!');
    });

    it('should render loops', () => {
      const template = 'Items: {{#each items}}- {{name}} {{/each}}';
      const data = {
        items: [
          { name: 'Item 1' },
          { name: 'Item 2' },
          { name: 'Item 3' },
        ],
      };

      const result = emailService.renderTemplate(template, data);

      expect(result).toBe('Items: - Item 1 - Item 2 - Item 3 ');
    });

    it('should handle empty loops', () => {
      const template = 'Items: {{#each items}}- {{name}} {{/each}}';
      const data = { items: [] };

      const result = emailService.renderTemplate(template, data);

      expect(result).toBe('Items: ');
    });

    it('should handle non-array in loops', () => {
      const template = 'Items: {{#each items}}- {{name}} {{/each}}';
      const data = { items: 'not an array' };

      const result = emailService.renderTemplate(template, data);

      expect(result).toBe('Items: ');
    });
  });

  describe('Service Configuration', () => {
    it('should indicate if service is ready', () => {
      const isReady = emailService.isReady();

      // Depending on environment variables, this could be true or false
      expect(typeof isReady).toBe('boolean');
    });
  });

  describe('Email Sending', () => {
    it('should return success: false when not configured', async () => {
      // This test assumes email is not configured in test environment
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      // If not configured, should return failure
      if (!emailService.isReady()) {
        expect(result.success).toBe(false);
        expect(result.error).toBe('Email service not configured');
      }
    });
  });

  describe('stripHtml', () => {
    it('should strip HTML tags', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      // Access private method through any type for testing
      const stripped = (emailService as any).stripHtml(html);

      expect(stripped).toBe('Hello World');
    });

    it('should handle plain text', () => {
      const text = 'Hello World';
      const stripped = (emailService as any).stripHtml(text);

      expect(stripped).toBe('Hello World');
    });
  });
});
