/**
 * @jest-environment jsdom
 */
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeInput,
  sanitizeEmail,
  sanitizeObject,
} from '@/lib/sanitize';

describe('Sanitize Utility', () => {
  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const output = sanitizeHtml(input);

      expect(output).toContain('<p>');
      expect(output).toContain('<strong>');
      expect(output).toContain('Hello');
      expect(output).toContain('World');
    });

    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>';
      const output = sanitizeHtml(input);

      expect(output).not.toContain('<script>');
      expect(output).not.toContain('alert');
      expect(output).toContain('Hello');
    });

    it('should remove onclick handlers', () => {
      const input = '<p onclick="alert(\'XSS\')">Click me</p>';
      const output = sanitizeHtml(input);

      expect(output).not.toContain('onclick');
      expect(output).not.toContain('alert');
    });

    it('should allow links with href', () => {
      const input = '<a href="https://example.com">Link</a>';
      const output = sanitizeHtml(input);

      expect(output).toContain('<a');
      expect(output).toContain('href');
      expect(output).toContain('example.com');
    });

    it('should remove javascript: protocol from links', () => {
      const input = '<a href="javascript:alert(\'XSS\')">Bad Link</a>';
      const output = sanitizeHtml(input);

      expect(output).not.toContain('javascript:');
      expect(output).not.toContain('alert');
    });

    it('should allow bold tags', () => {
      const input = '<b>Bold text</b>';
      const output = sanitizeHtml(input);

      expect(output).toContain('<b>');
      expect(output).toContain('Bold text');
    });

    it('should allow italic tags', () => {
      const input = '<i>Italic text</i>';
      const output = sanitizeHtml(input);

      expect(output).toContain('<i>');
      expect(output).toContain('Italic text');
    });

    it('should allow em tags', () => {
      const input = '<em>Emphasized text</em>';
      const output = sanitizeHtml(input);

      expect(output).toContain('<em>');
      expect(output).toContain('Emphasized text');
    });

    it('should allow br tags', () => {
      const input = 'Line 1<br>Line 2';
      const output = sanitizeHtml(input);

      expect(output).toContain('<br>');
    });

    it('should remove disallowed tags', () => {
      const input = '<div><span>Text</span></div>';
      const output = sanitizeHtml(input);

      expect(output).not.toContain('<div>');
      expect(output).not.toContain('<span>');
      expect(output).toContain('Text');
    });

    it('should handle nested allowed tags', () => {
      const input = '<p><strong><em>Nested</em></strong></p>';
      const output = sanitizeHtml(input);

      expect(output).toContain('<p>');
      expect(output).toContain('<strong>');
      expect(output).toContain('<em>');
      expect(output).toContain('Nested');
    });
  });

  describe('sanitizeText', () => {
    it('should remove all HTML tags', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const output = sanitizeText(input);

      expect(output).not.toContain('<p>');
      expect(output).not.toContain('<strong>');
      expect(output).toBe('Hello World');
    });

    it('should remove script tags and content', () => {
      const input = 'Text<script>alert("XSS")</script>More text';
      const output = sanitizeText(input);

      expect(output).not.toContain('<script>');
      expect(output).not.toContain('alert');
      expect(output).toContain('Text');
      expect(output).toContain('More text');
    });

    it('should handle empty string', () => {
      const output = sanitizeText('');
      expect(output).toBe('');
    });

    it('should handle plain text without HTML', () => {
      const input = 'Plain text without HTML';
      const output = sanitizeText(input);

      expect(output).toBe(input);
    });

    it('should remove all attributes', () => {
      const input = '<div class="test" id="main">Content</div>';
      const output = sanitizeText(input);

      expect(output).not.toContain('class');
      expect(output).not.toContain('id');
      expect(output).not.toContain('<div>');
      expect(output).toContain('Content');
    });

    it('should handle malformed HTML', () => {
      const input = '<p>Unclosed paragraph';
      const output = sanitizeText(input);

      expect(output).not.toContain('<p>');
      expect(output).toContain('Unclosed paragraph');
    });
  });

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const output = sanitizeInput(input);

      expect(output).toBe('Hello World');
    });

    it('should remove HTML tags', () => {
      const input = '<p>Hello</p>';
      const output = sanitizeInput(input);

      expect(output).not.toContain('<p>');
      expect(output).toBe('Hello');
    });

    it('should limit length to default 1000 characters', () => {
      const input = 'A'.repeat(1500);
      const output = sanitizeInput(input);

      expect(output.length).toBe(1000);
    });

    it('should limit length to custom maxLength', () => {
      const input = 'A'.repeat(500);
      const output = sanitizeInput(input, 100);

      expect(output.length).toBe(100);
    });

    it('should handle empty string', () => {
      const output = sanitizeInput('');
      expect(output).toBe('');
    });

    it('should handle string with only whitespace', () => {
      const input = '   ';
      const output = sanitizeInput(input);

      expect(output).toBe('');
    });

    it('should combine trimming, sanitizing, and length limiting', () => {
      const input = '  <script>alert("XSS")</script>  ' + 'A'.repeat(2000);
      const output = sanitizeInput(input, 500);

      expect(output).not.toContain('<script>');
      expect(output).not.toContain('alert');
      expect(output.length).toBeLessThanOrEqual(500);
    });
  });

  describe('sanitizeEmail', () => {
    it('should convert email to lowercase', () => {
      const input = 'USER@EXAMPLE.COM';
      const output = sanitizeEmail(input);

      expect(output).toBe('user@example.com');
    });

    it('should trim whitespace', () => {
      const input = '  user@example.com  ';
      const output = sanitizeEmail(input);

      expect(output).toBe('user@example.com');
    });

    it('should handle mixed case', () => {
      const input = 'UsEr@ExAmPlE.CoM';
      const output = sanitizeEmail(input);

      expect(output).toBe('user@example.com');
    });

    it('should handle empty string', () => {
      const output = sanitizeEmail('');
      expect(output).toBe('');
    });

    it('should preserve + in email addresses', () => {
      const input = 'user+tag@example.com';
      const output = sanitizeEmail(input);

      expect(output).toBe('user+tag@example.com');
    });

    it('should preserve dots in email addresses', () => {
      const input = 'first.last@example.com';
      const output = sanitizeEmail(input);

      expect(output).toBe('first.last@example.com');
    });

    it('should handle subdomain emails', () => {
      const input = 'user@mail.example.com';
      const output = sanitizeEmail(input);

      expect(output).toBe('user@mail.example.com');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize all string values in object', () => {
      const input = {
        name: '<p>John</p>',
        email: '  user@example.com  ',
        bio: '<script>alert("XSS")</script>',
      };

      const output = sanitizeObject(input);

      expect(output.name).toBe('John');
      expect(output.email).toBe('user@example.com');
      expect(output.bio).not.toContain('<script>');
    });

    it('should preserve non-string values', () => {
      const input = {
        name: 'John',
        age: 30,
        active: true,
        score: 95.5,
      };

      const output = sanitizeObject(input);

      expect(output.name).toBe('John');
      expect(output.age).toBe(30);
      expect(output.active).toBe(true);
      expect(output.score).toBe(95.5);
    });

    it('should handle empty object', () => {
      const input = {};
      const output = sanitizeObject(input);

      expect(output).toEqual({});
    });

    it('should handle object with null values', () => {
      const input = {
        name: 'John',
        middleName: null,
        age: 30,
      };

      const output = sanitizeObject(input);

      expect(output.name).toBe('John');
      expect(output.middleName).toBeNull();
      expect(output.age).toBe(30);
    });

    it('should handle object with undefined values', () => {
      const input = {
        name: 'John',
        middleName: undefined,
        age: 30,
      };

      const output = sanitizeObject(input);

      expect(output.name).toBe('John');
      expect(output.middleName).toBeUndefined();
      expect(output.age).toBe(30);
    });

    it('should not mutate original object', () => {
      const input = {
        name: '<p>John</p>',
        age: 30,
      };

      const output = sanitizeObject(input);

      expect(input.name).toBe('<p>John</p>'); // Original unchanged
      expect(output.name).toBe('John'); // Output sanitized
    });

    it('should handle nested objects (shallow sanitization)', () => {
      const input = {
        name: '<p>John</p>',
        address: {
          street: '<b>Main St</b>',
        },
      };

      const output = sanitizeObject(input);

      expect(output.name).toBe('John');
      // Note: sanitizeObject only sanitizes top-level strings
      expect(typeof output.address).toBe('object');
    });

    it('should handle arrays in object', () => {
      const input = {
        name: '<p>John</p>',
        tags: ['<script>tag1</script>', '<b>tag2</b>'],
      };

      const output = sanitizeObject(input);

      expect(output.name).toBe('John');
      expect(Array.isArray(output.tags)).toBe(true);
    });
  });

  describe('XSS Attack Prevention', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(\'XSS\')">',
      '<svg onload="alert(\'XSS\')">',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')">',
      '<body onload="alert(\'XSS\')">',
      '<input onfocus="alert(\'XSS\')" autofocus>',
      '<select onfocus="alert(\'XSS\')" autofocus>',
      '<textarea onfocus="alert(\'XSS\')" autofocus>',
      '<marquee onstart="alert(\'XSS\')">',
    ];

    xssPayloads.forEach((payload) => {
      it(`should neutralize XSS payload: ${payload.substring(0, 30)}...`, () => {
        const outputHtml = sanitizeHtml(payload);
        const outputText = sanitizeText(payload);
        const outputInput = sanitizeInput(payload);

        // None should contain script execution code
        expect(outputHtml).not.toContain('alert');
        expect(outputText).not.toContain('alert');
        expect(outputInput).not.toContain('alert');

        expect(outputHtml).not.toContain('javascript:');
        expect(outputText).not.toContain('javascript:');
        expect(outputInput).not.toContain('javascript:');
      });
    });
  });

  describe('Special Characters', () => {
    it('should handle special HTML entities', () => {
      const input = '&lt;script&gt;alert("XSS")&lt;/script&gt;';
      const output = sanitizeText(input);

      // Entities should be decoded and tags removed
      expect(output).not.toContain('<script>');
    });

    it('should preserve quotes in plain text', () => {
      const input = 'He said "Hello World"';
      const output = sanitizeText(input);

      expect(output).toBe(input);
    });

    it('should preserve apostrophes in plain text', () => {
      const input = "It's a beautiful day";
      const output = sanitizeText(input);

      expect(output).toBe(input);
    });

    it('should handle newlines', () => {
      const input = 'Line 1\nLine 2\nLine 3';
      const output = sanitizeInput(input);

      expect(output).toContain('Line 1');
      expect(output).toContain('Line 2');
      expect(output).toContain('Line 3');
    });
  });
});
