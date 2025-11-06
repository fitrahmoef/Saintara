# 📊 Monitoring & Observability Guide

This document explains how to set up and use monitoring, error tracking, and observability tools for the Saintara platform.

## Table of Contents

- [Error Tracking with Sentry](#error-tracking-with-sentry)
- [Application Performance Monitoring](#application-performance-monitoring)
- [Logging Infrastructure](#logging-infrastructure)
- [Health Checks](#health-checks)
- [Metrics & Alerts](#metrics--alerts)

---

## 🎯 Error Tracking with Sentry

### What is Sentry?

Sentry is a real-time error tracking platform that helps you monitor and fix crashes in production. It provides:

- **Automatic error reporting** with stack traces
- **User context** for debugging (which user experienced the error)
- **Performance monitoring** (API response times, database query performance)
- **Real-time alerts** via email, Slack, etc.
- **Release tracking** to know which version introduced bugs

### Setting Up Sentry

#### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io) and sign up for a free account
2. Create a new project for Saintara:
   - **Backend**: Select "Node.js" as the platform
   - **Frontend**: Select "Next.js" as the platform
3. Copy your DSN (Data Source Name) - it looks like:
   ```
   https://abc123@o123456.ingest.sentry.io/789012
   ```

#### 2. Configure Environment Variables

Add your Sentry DSN to your environment variables:

**For Backend** (`.env`):
```bash
SENTRY_DSN=https://your_backend_sentry_dsn@sentry.io/project_id
```

**For Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_SENTRY_DSN=https://your_frontend_sentry_dsn@sentry.io/project_id
```

**For Docker** (`docker-compose.yml` or `.env`):
```bash
SENTRY_DSN=https://your_backend_sentry_dsn@sentry.io/project_id
NEXT_PUBLIC_SENTRY_DSN=https://your_frontend_sentry_dsn@sentry.io/project_id
```

#### 3. Verify Installation

Start your application and trigger a test error:

**Backend Test**:
```bash
curl http://localhost:5000/api/test-error
```

**Frontend Test**:
Open your browser console and run:
```javascript
throw new Error("Sentry test error");
```

Check your Sentry dashboard - you should see the errors appear within seconds!

### Sentry Features Enabled

#### Backend (Node.js/Express)

✅ **Automatic Error Capture**
- All unhandled exceptions are automatically sent to Sentry
- Stack traces with file names and line numbers
- Request context (URL, method, headers, body)

✅ **Performance Monitoring**
- API endpoint response times
- Database query performance
- External API call monitoring

✅ **Breadcrumbs**
- HTTP requests
- Database queries
- Console logs
- User actions

✅ **User Context**
- User ID and email attached to errors
- Session tracking

✅ **Sensitive Data Filtering**
- Automatic removal of:
  - Authorization headers
  - Cookies
  - Password fields
  - Tokens

#### Frontend (Next.js)

✅ **Automatic Error Capture**
- JavaScript errors
- Promise rejections
- React component errors

✅ **Session Replay**
- Video-like reproductions of user sessions
- DOM mutations and interactions
- Console logs and network requests

✅ **Performance Monitoring**
- Page load times
- Component render times
- API call durations

✅ **User Context**
- User ID and email
- Browser and OS information
- Screen resolution

### Manual Error Reporting

#### Backend

```typescript
import { captureException, captureMessage, setUser, addBreadcrumb } from './config/sentry';

// Capture an exception
try {
  // your code
} catch (error) {
  captureException(error, {
    user_id: user.id,
    endpoint: '/api/users',
  });
}

// Capture a message
captureMessage('Payment processing started', 'info');

// Set user context
setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// Add breadcrumb for debugging
addBreadcrumb('User clicked checkout button', 'user', {
  amount: 100,
  currency: 'USD',
});
```

#### Frontend

```typescript
import * as Sentry from '@sentry/nextjs';

// Capture an exception
try {
  // your code
} catch (error) {
  Sentry.captureException(error);
}

// Capture a message
Sentry.captureMessage('User viewed product page', 'info');

// Set user context
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// Add breadcrumb
Sentry.addBreadcrumb({
  category: 'payment',
  message: 'User initiated payment',
  level: 'info',
  data: {
    amount: 100,
  },
});
```

### Sentry Dashboard

Access your Sentry dashboard to:

1. **View Errors**: See all errors with stack traces and context
2. **Filter Issues**: By release, environment, user, etc.
3. **Assign & Resolve**: Assign issues to team members and mark as resolved
4. **Set Alerts**: Get notified via email, Slack, PagerDuty, etc.
5. **Track Releases**: See which release introduced bugs
6. **View Performance**: Monitor API response times and slow queries

### Best Practices

1. **Don't Send Too Much**
   - Adjust `tracesSampleRate` in production (0.1 = 10% of transactions)
   - Use `ignoreErrors` to filter out expected errors

2. **Add Context**
   - Always attach user information to errors
   - Add breadcrumbs for important user actions
   - Include relevant metadata (transaction ID, etc.)

3. **Use Environments**
   - Separate `development`, `staging`, and `production` environments
   - Different alert rules for each environment

4. **Set Alerts**
   - Alert for new issues
   - Alert for regression (resolved issues that reappear)
   - Alert for spike in error rate

5. **Review Regularly**
   - Check Sentry dashboard daily
   - Triage and prioritize issues
   - Track metrics (error rate, affected users)

---

## 📈 Application Performance Monitoring

### Backend Performance Metrics

Sentry automatically tracks:

- **API Response Times**: How long each endpoint takes
- **Database Query Performance**: Slow queries and N+1 problems
- **External API Calls**: Stripe, Xendit, email service
- **Memory Usage**: Heap size and memory leaks

### Frontend Performance Metrics

Sentry automatically tracks:

- **Page Load Times**: Time to first byte (TTFB), first contentful paint (FCP)
- **Component Render Times**: Which components are slow
- **API Call Durations**: How long API requests take
- **Web Vitals**: LCP, FID, CLS (Google's Core Web Vitals)

### Custom Performance Tracking

```typescript
// Backend
import * as Sentry from '@sentry/node';

const transaction = Sentry.startTransaction({
  op: 'process-payment',
  name: 'Process Stripe Payment',
});

try {
  // your code
  const span = transaction.startChild({
    op: 'stripe-api',
    description: 'Create payment intent',
  });

  // call Stripe API

  span.finish();
} finally {
  transaction.finish();
}
```

---

## 📝 Logging Infrastructure

### Winston Logger (Backend)

The backend uses Winston for structured logging.

**Log Levels**: `error`, `warn`, `info`, `debug`

**Log Destinations**:
- **Console**: Colorized output in development
- **File**: `logs/combined.log` (all logs)
- **File**: `logs/error.log` (errors only)

**Usage**:

```typescript
import logger from './config/logger';

logger.info('User logged in', { userId: user.id, email: user.email });
logger.warn('Rate limit exceeded', { ip: req.ip, endpoint: req.path });
logger.error('Payment failed', { error: error.message, transactionId: tx.id });
logger.debug('Database query', { query: 'SELECT * FROM users', duration: '12ms' });
```

### Log Rotation

Logs are automatically rotated:
- **Max Size**: 5MB per file
- **Max Files**: 5 (oldest deleted automatically)

### Centralized Logging (Future)

For production, consider:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Grafana Loki** (lightweight alternative)
- **AWS CloudWatch Logs**
- **Google Cloud Logging**

---

## 🏥 Health Checks

### Backend Health Check

**Endpoint**: `GET /health`

**Response** (Healthy):
```json
{
  "status": "success",
  "message": "Server is healthy",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Response** (Unhealthy):
```json
{
  "status": "error",
  "message": "Database connection failed"
}
```

### Docker Health Checks

Both backend and frontend containers have built-in health checks:

**Backend**:
- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3
- Start period: 40 seconds

**Frontend**:
- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3
- Start period: 60 seconds

### Monitoring Health Checks

Use these services to monitor uptime:

1. **UptimeRobot** (Free)
   - https://uptimerobot.com
   - Monitor `/health` endpoint every 5 minutes
   - Email/SMS alerts on downtime

2. **Pingdom** (Paid)
   - https://pingdom.com
   - More features and faster checks

3. **Better Uptime** (Free/Paid)
   - https://betteruptime.com
   - Beautiful status pages

---

## 🔔 Metrics & Alerts

### Key Metrics to Track

#### Application Metrics

1. **Error Rate**: Percentage of requests that fail
   - Target: < 1%
   - Alert if: > 5% for 5 minutes

2. **Response Time (p95)**: 95th percentile response time
   - Target: < 500ms
   - Alert if: > 1000ms for 5 minutes

3. **Throughput**: Requests per second
   - Monitor for unusual spikes or drops

4. **Availability**: Uptime percentage
   - Target: 99.9% (8.76 hours downtime per year)

#### Business Metrics

1. **User Registrations**: New users per day/week
2. **Test Completions**: Tests completed per day
3. **Payment Success Rate**: Successful payments / total attempts
   - Target: > 95%
4. **Email Delivery Rate**: Emails sent successfully
   - Target: > 98%

### Setting Up Alerts

#### Sentry Alerts

1. Go to **Project Settings** > **Alerts**
2. Create alert rules:
   - New issue created
   - Issue regression (resolved issue reappears)
   - Error spike (10x increase in error rate)
3. Configure notification channels:
   - Email
   - Slack
   - PagerDuty

#### Email Alerts (Winston)

Configure Winston to send email on critical errors:

```typescript
import winston from 'winston';
import nodemailer from 'nodemailer';

const emailTransport = new winston.transports.Stream({
  stream: nodemailer.createTransport({
    // your SMTP config
  }).createReadStream(),
});

logger.add(emailTransport);
```

---

## 🚀 Production Readiness Checklist

Before going to production, ensure:

- [ ] Sentry is configured and tested (backend + frontend)
- [ ] Environment-specific Sentry projects (staging, production)
- [ ] Sentry tracesSampleRate adjusted for production (0.1 or lower)
- [ ] Alerts configured for critical errors
- [ ] Health check endpoints monitored by uptime service
- [ ] Log rotation configured
- [ ] Winston log level set to `info` (not `debug`)
- [ ] Sensitive data filtered from Sentry events
- [ ] Session replay enabled for frontend issues
- [ ] Performance monitoring enabled
- [ ] Team members added to Sentry organization

---

## 📚 Additional Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry Node.js Guide](https://docs.sentry.io/platforms/node/)
- [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [Monitoring Best Practices](https://sre.google/sre-book/monitoring-distributed-systems/)

---

## 🆘 Troubleshooting

### Sentry Not Capturing Errors

1. **Check DSN**: Ensure `SENTRY_DSN` is set correctly
2. **Check Environment**: Sentry might be disabled in development
3. **Check Network**: Ensure your server can reach sentry.io
4. **Check beforeSend**: You might be filtering out too many errors

### High Error Volume

1. **Check ignoreErrors**: Add common errors to ignore list
2. **Adjust Sample Rate**: Lower `tracesSampleRate` to reduce volume
3. **Rate Limits**: Sentry has rate limits on free plans

### Missing Context

1. **Add User Context**: Call `setUser()` after authentication
2. **Add Breadcrumbs**: Add breadcrumbs for important actions
3. **Add Tags**: Use tags to categorize errors

---

**Need Help?** Check the [Sentry Community Forum](https://forum.sentry.io/) or contact support.
