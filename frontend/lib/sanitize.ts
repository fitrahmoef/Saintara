/**
 * Input Sanitization Utility
 * Protects against XSS attacks by sanitizing user input
 */

import DOMPurify from 'dompurify'

/**
 * Sanitize HTML string to prevent XSS
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') {
    // Server-side: just return the string (DOMPurify requires DOM)
    return dirty
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  })
}

/**
 * Sanitize plain text (remove all HTML)
 */
export function sanitizeText(dirty: string): string {
  if (typeof window === 'undefined') {
    // Server-side: basic sanitization
    return dirty.replace(/<[^>]*>/g, '')
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
}

/**
 * Sanitize user input before sending to API
 * - Trims whitespace
 * - Removes HTML tags
 * - Limits length
 */
export function sanitizeInput(
  input: string,
  maxLength: number = 1000
): string {
  let sanitized = input.trim()
  sanitized = sanitizeText(sanitized)
  sanitized = sanitized.slice(0, maxLength)
  return sanitized
}

/**
 * Sanitize email
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

/**
 * Sanitize object (sanitize all string values)
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj }

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key])
    }
  }

  return sanitized
}
