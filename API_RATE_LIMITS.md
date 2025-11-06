# 🚦 API Rate Limiting Guide

This document explains the rate limiting implemented in the Saintara API to prevent abuse and ensure fair usage.

## Overview

Rate limiting helps protect the API from:
- **Brute force attacks** (password guessing, etc.)
- **DoS/DDoS attacks** (overwhelming the server)
- **Resource exhaustion** (too many requests from one user)
- **API abuse** (scraping, automated bots)

## Rate Limit Configuration

### General API Rate Limit

**Applies to**: All API endpoints (`/api/*`)

- **Limit**: 100 requests per 15 minutes
- **Per**: IP address
- **Response on limit**: HTTP 429 (Too Many Requests)

```javascript
// Implementation
generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
});
```

### Authentication Rate Limits

#### Login / Register

**Applies to**: `/api/auth/login`, `/api/auth/register`

- **Limit**: 5 requests per 15 minutes
- **Per**: IP address
- **Purpose**: Prevent brute force password attacks
- **Response on limit**: HTTP 429

```javascript
authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again after 15 minutes.',
});
```

#### Password Reset

**Applies to**: `/api/auth/forgot-password`, `/api/auth/reset-password`

- **Limit**: 3 requests per hour
- **Per**: IP address
- **Purpose**: Prevent password reset flooding
- **Response on limit**: HTTP 429

```javascript
passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset attempts, please try again after 1 hour.',
});
```

### Test Submission Rate Limit

**Applies to**: `/api/tests/:id/submit`

- **Limit**: 10 requests per hour
- **Per**: User (authenticated)
- **Purpose**: Prevent test spam and ensure fair usage
- **Response on limit**: HTTP 429

```javascript
testSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many test submissions, please wait before submitting again.',
});
```

### File Upload Rate Limit

**Applies to**: `/api/upload/*`

- **Limit**: 20 requests per hour
- **Per**: User (authenticated)
- **Purpose**: Prevent storage abuse
- **Response on limit**: HTTP 429

```javascript
uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many file uploads, please try again later.',
});
```

### Bulk Import Rate Limit

**Applies to**: `/api/customers/bulk/import`

- **Limit**: 5 requests per hour
- **Per**: User (admin only)
- **Purpose**: Prevent database overload from bulk operations
- **Response on limit**: HTTP 429

```javascript
bulkImportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many bulk import requests, please try again later.',
});
```

## Rate Limit Headers

When you make a request, the API returns these headers:

```http
X-RateLimit-Limit: 100          # Total requests allowed in window
X-RateLimit-Remaining: 95       # Requests remaining in current window
X-RateLimit-Reset: 1642339200   # Unix timestamp when limit resets
Retry-After: 900                # Seconds until you can retry (only when limited)
```

## HTTP 429 Response

When rate limit is exceeded:

```json
{
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": 900
}
```

## Handling Rate Limits

### Frontend Best Practices

#### 1. **Exponential Backoff**

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, retryAfter));
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded');
}
```

#### 2. **Display Retry Timer**

```javascript
if (error.response?.status === 429) {
  const retryAfter = error.response.data.retryAfter;
  toast.error(`Too many requests. Please wait ${retryAfter} seconds.`);
}
```

#### 3. **Debounce/Throttle User Actions**

```javascript
import { debounce } from 'lodash';

const handleSearch = debounce(async (query) => {
  await api.search(query);
}, 500); // Wait 500ms after user stops typing
```

### Mobile App Best Practices

#### 1. **Cache Responses**

```javascript
const cache = new Map();

async function getCachedData(key, fetcher, ttl = 60000) {
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

#### 2. **Batch Requests**

Instead of:
```javascript
// ❌ Multiple individual requests
await api.getUser(1);
await api.getUser(2);
await api.getUser(3);
```

Do:
```javascript
// ✅ Single batch request
await api.getUsers([1, 2, 3]);
```

## Bypassing Rate Limits (Not Recommended)

### API Keys for Trusted Clients

If you need higher rate limits (e.g., for integrations), contact the API administrator to get an API key with increased limits.

```javascript
// Example: Custom rate limit for API key
const apiKeyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // 10x higher limit
  skip: (req) => !req.headers['x-api-key'], // Only for requests with API key
});
```

## Rate Limit Strategies

### IP-Based (Current)

**Pros**:
- Simple to implement
- No authentication required
- Works for public endpoints

**Cons**:
- Shared IPs (NAT, VPN) affect multiple users
- Easy to bypass with VPN/proxy

### User-Based (For Authenticated Endpoints)

**Pros**:
- Fair per-user limits
- No shared IP issues
- Better tracking

**Cons**:
- Requires authentication
- Doesn't protect unauthenticated endpoints

### Token Bucket Algorithm

**Pros**:
- Allows bursts
- More flexible
- Better user experience

**Cons**:
- More complex to implement
- Requires state management (Redis)

## Monitoring Rate Limits

### Check Rate Limit Status

```bash
# Make request and check headers
curl -I https://api.saintara.com/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Output:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 95
# X-RateLimit-Reset: 1642339200
```

### Admin Dashboard

Admins can view rate limit violations:

```
GET /api/admin/rate-limits/violations
```

Response:
```json
{
  "violations": [
    {
      "ip": "192.168.1.100",
      "endpoint": "/api/auth/login",
      "count": 25,
      "lastViolation": "2025-01-15T10:30:00Z"
    }
  ]
}
```

## Troubleshooting

### "Too many requests" error

**Problem**: You're hitting the rate limit

**Solutions**:
1. **Wait**: Respect the `Retry-After` header
2. **Reduce frequency**: Batch requests or add delays
3. **Cache**: Store responses to avoid repeated requests
4. **Contact support**: If you have legitimate high-volume needs

### Rate limit not working

**Problem**: Rate limit not applied

**Check**:
1. Is rate limit middleware applied to the route?
2. Is Redis/store configured correctly?
3. Are proxies forwarding real IP addresses?

```javascript
// Trust proxy for accurate IP detection
app.set('trust proxy', 1);
```

## Best Practices

### For API Users

1. ✅ **Respect rate limits** - Don't try to bypass them
2. ✅ **Implement exponential backoff** - Retry with increasing delays
3. ✅ **Cache responses** - Reduce unnecessary requests
4. ✅ **Batch requests** - Combine multiple operations
5. ✅ **Monitor headers** - Track your usage

### For API Developers

1. ✅ **Set appropriate limits** - Not too strict, not too loose
2. ✅ **Return clear errors** - Include retry information
3. ✅ **Log violations** - Monitor for abuse patterns
4. ✅ **Document limits** - Make them discoverable
5. ✅ **Provide alternatives** - Batch endpoints, webhooks

## Future Enhancements

### Planned Features

- [ ] **User-based rate limits** for authenticated endpoints
- [ ] **API key system** for trusted integrations
- [ ] **Dynamic rate limits** based on user tier (free, pro, enterprise)
- [ ] **Redis-based store** for distributed rate limiting
- [ ] **Rate limit dashboard** for admins
- [ ] **Webhook rate limits** for event notifications

---

## Support

If you're experiencing rate limit issues:

1. Check the rate limit headers in your responses
2. Review this documentation for best practices
3. Implement proper error handling and retry logic
4. Contact support if you need higher limits

**Last Updated**: 2025-01-15
**Maintainer**: API Team
