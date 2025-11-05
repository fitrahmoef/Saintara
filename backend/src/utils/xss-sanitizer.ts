/**
 * XSS Sanitization Utilities
 *
 * Provides functions to sanitize user-generated content and prevent XSS attacks
 */

const xss = require('xss');

/**
 * Default XSS filter options for general text (no HTML allowed)
 */
const strictOptions = {
  whiteList: {}, // No HTML tags allowed
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
};

/**
 * XSS filter options for rich text content (limited HTML allowed)
 * Allows safe HTML tags for articles and formatted content
 */
const richTextOptions = {
  whiteList: {
    // Text formatting
    p: ['class', 'style'],
    span: ['class', 'style'],
    br: [],
    strong: [],
    b: [],
    em: [],
    i: [],
    u: [],
    s: [],
    mark: [],
    small: [],

    // Headings
    h1: ['class', 'id'],
    h2: ['class', 'id'],
    h3: ['class', 'id'],
    h4: ['class', 'id'],
    h5: ['class', 'id'],
    h6: ['class', 'id'],

    // Lists
    ul: ['class'],
    ol: ['class', 'start'],
    li: ['class'],

    // Links
    a: ['href', 'title', 'target', 'rel'],

    // Images (with restrictions)
    img: ['src', 'alt', 'title', 'width', 'height'],

    // Tables
    table: ['class'],
    thead: [],
    tbody: [],
    tr: [],
    th: ['class'],
    td: ['class'],

    // Quotes and code
    blockquote: ['class'],
    code: ['class'],
    pre: ['class'],

    // Divisions
    div: ['class', 'id'],

    // Horizontal rule
    hr: [],
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
  css: false, // Disable inline styles in sanitized output
};

/**
 * Sanitize plain text input (no HTML allowed)
 * Use for: names, emails, titles, short descriptions
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return '';
  return xss(input, strictOptions);
}

/**
 * Sanitize rich text content (limited HTML allowed)
 * Use for: article content, formatted descriptions, user bios
 */
export function sanitizeHTML(input: string | null | undefined): string {
  if (!input) return '';

  // First pass: sanitize with rich text options
  let sanitized = xss(input, richTextOptions);

  // Additional validation: ensure links use safe protocols
  sanitized = sanitized.replace(
    /href\s*=\s*["']?(javascript:|data:|vbscript:)[^"'>]*/gi,
    'href="#"'
  );

  return sanitized;
}

/**
 * Sanitize object recursively
 * Useful for sanitizing entire request bodies
 */
export function sanitizeObject(obj: any, fieldsToSanitize: string[] = []): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, fieldsToSanitize));
  }

  const sanitized: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      // If field is in fieldsToSanitize list, sanitize it
      if (fieldsToSanitize.includes(key) && typeof value === 'string') {
        sanitized[key] = sanitizeText(value);
      }
      // Recursively sanitize nested objects
      else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value, fieldsToSanitize);
      }
      // Keep other values as-is
      else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

/**
 * Sanitize specific fields in articles
 */
export function sanitizeArticle(article: any): any {
  return {
    ...article,
    title: sanitizeText(article.title),
    content: sanitizeHTML(article.content),
    category: article.category ? sanitizeText(article.category) : null,
  };
}

/**
 * Sanitize user profile fields
 */
export function sanitizeUserProfile(profile: any): any {
  return {
    ...profile,
    name: sanitizeText(profile.name),
    nickname: profile.nickname ? sanitizeText(profile.nickname) : null,
    email: sanitizeText(profile.email),
    phone: profile.phone ? sanitizeText(profile.phone) : null,
    city: profile.city ? sanitizeText(profile.city) : null,
    country: profile.country ? sanitizeText(profile.country) : null,
  };
}

/**
 * Middleware to sanitize request body
 */
export function xssSanitizationMiddleware(fieldsToSanitize: string[] = []) {
  return (req: any, res: any, next: any) => {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body, fieldsToSanitize);
    }
    next();
  };
}

export default {
  sanitizeText,
  sanitizeHTML,
  sanitizeObject,
  sanitizeArticle,
  sanitizeUserProfile,
  xssSanitizationMiddleware,
};
