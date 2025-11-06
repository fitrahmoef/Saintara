# Security Testing Checklist for Saintara

## OWASP Top 10 Security Tests

### 1. Injection
- [ ] SQL Injection testing on all input fields
- [ ] NoSQL Injection testing (if applicable)
- [ ] Command Injection testing
- [ ] LDAP Injection testing

**Tools:**
```bash
# SQL Injection
sqlmap -u "http://localhost:5000/api/tests?id=1" --batch

# Manual testing
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com''' OR 1=1--","password":"anything"}'
```

### 2. Broken Authentication
- [ ] Test weak password policy
- [ ] Test session timeout
- [ ] Test concurrent sessions
- [ ] Test credential stuffing protection
- [ ] Test 2FA implementation
- [ ] Test password reset flow

**Tools:**
```bash
# Brute force protection test
hydra -l admin@saintara.com -P passwords.txt localhost http-post-form "/api/auth/login:email=^USER^&password=^PASS^:Invalid credentials"
```

### 3. Sensitive Data Exposure
- [ ] Check HTTPS enforcement
- [ ] Check secure cookie flags
- [ ] Check sensitive data in logs
- [ ] Check data encryption at rest
- [ ] Check data encryption in transit
- [ ] Test for information disclosure in error messages

**Manual Tests:**
```bash
# Check security headers
curl -I https://saintara.com

# Check for sensitive data in responses
curl https://api.saintara.com/api/users/1 | grep -i "password\|secret\|token"
```

### 4. XML External Entities (XXE)
- [ ] Test XML parsing endpoints
- [ ] Test file upload with XML
- [ ] Test SVG uploads

### 5. Broken Access Control
- [ ] Test horizontal privilege escalation
- [ ] Test vertical privilege escalation
- [ ] Test IDOR vulnerabilities
- [ ] Test direct object references

**Tests:**
```bash
# IDOR test - Try accessing other user's data
curl -H "Authorization: Bearer USER_A_TOKEN" \
  http://localhost:5000/api/users/USER_B_ID

# Privilege escalation test
curl -H "Authorization: Bearer REGULAR_USER_TOKEN" \
  http://localhost:5000/api/admin/users
```

### 6. Security Misconfiguration
- [ ] Check for default credentials
- [ ] Check for directory listing
- [ ] Check for unnecessary HTTP methods
- [ ] Check for verbose error messages
- [ ] Check for security headers

**Tools:**
```bash
# Security headers check
npm install -g observatory-cli
observatory saintara.com

# Or use online tool: https://securityheaders.com
```

### 7. Cross-Site Scripting (XSS)
- [ ] Test reflected XSS
- [ ] Test stored XSS
- [ ] Test DOM-based XSS
- [ ] Check Content-Security-Policy header

**Tests:**
```bash
# XSS payloads
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg/onload=alert('XSS')>

# Test with curl
curl -X POST http://localhost:5000/api/comments \
  -H "Content-Type: application/json" \
  -d '{"text":"<script>alert(1)</script>"}'
```

### 8. Insecure Deserialization
- [ ] Test JSON parsing
- [ ] Test session deserialization
- [ ] Test data import features

### 9. Using Components with Known Vulnerabilities
- [ ] Run npm audit
- [ ] Check Snyk reports
- [ ] Update dependencies regularly

**Commands:**
```bash
# Backend
cd backend && npm audit
npm audit fix

# Frontend
cd frontend && npm audit
npm audit fix

# Snyk scanning
npx snyk test
```

### 10. Insufficient Logging & Monitoring
- [ ] Check authentication logging
- [ ] Check authorization logging
- [ ] Check error logging
- [ ] Check security event logging
- [ ] Test log injection

## Additional Security Tests

### API Security
- [ ] Test rate limiting
- [ ] Test input validation
- [ ] Test API versioning
- [ ] Test CORS configuration
- [ ] Test API authentication

**Rate Limiting Test:**
```bash
# Rapid fire requests
for i in {1..100}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}' &
done
```

### File Upload Security
- [ ] Test file type validation
- [ ] Test file size limits
- [ ] Test malicious file upload
- [ ] Test path traversal
- [ ] Check antivirus scanning

**Tests:**
```bash
# Upload malicious file
curl -X POST http://localhost:5000/api/upload \
  -F "file=@malware.exe"

# Path traversal
curl -X POST http://localhost:5000/api/upload \
  -F "file=@../../etc/passwd"
```

### Payment Security
- [ ] Test payment amount manipulation
- [ ] Test currency manipulation
- [ ] Test transaction replay
- [ ] Check webhook signature validation

## Automated Security Scanning

### OWASP ZAP
```bash
# Install OWASP ZAP
docker pull owasp/zap2docker-stable

# Quick scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000

# Full scan
docker run -t owasp/zap2docker-stable zap-full-scan.py \
  -t http://localhost:3000
```

### Nikto
```bash
# Install Nikto
sudo apt-get install nikto

# Scan
nikto -h http://localhost:3000
```

### SAST (Static Analysis)
```bash
# SonarQube
docker run -d --name sonarqube -p 9000:9000 sonarqube

# ESLint security plugins
npm install --save-dev eslint-plugin-security
npm install --save-dev eslint-plugin-no-secrets
```

## Penetration Testing Checklist

### Pre-Test
- [ ] Get written authorization
- [ ] Define scope
- [ ] Set up testing environment
- [ ] Backup production data

### During Test
- [ ] Document all findings
- [ ] Take screenshots
- [ ] Record video if needed
- [ ] Keep detailed notes

### Post-Test
- [ ] Generate report
- [ ] Present findings
- [ ] Provide remediation recommendations
- [ ] Schedule retest

## Security Monitoring

### Continuous Monitoring
- [ ] Set up Sentry for error tracking
- [ ] Set up security alerts
- [ ] Monitor authentication failures
- [ ] Monitor privilege escalations
- [ ] Track suspicious activities

### Log Analysis
```bash
# Check for authentication failures
grep "authentication failed" /var/log/saintara/backend.log

# Check for SQL injection attempts
grep -i "select.*from\|union.*select" /var/log/saintara/backend.log

# Check for XSS attempts
grep -i "<script>" /var/log/saintara/backend.log
```

## Compliance Checks

### GDPR
- [ ] Data export functionality
- [ ] Right to deletion
- [ ] Consent management
- [ ] Data breach notification

### PCI DSS (if handling cards)
- [ ] Secure card storage
- [ ] Encryption in transit
- [ ] Access controls
- [ ] Regular security testing

## Security Headers Checklist

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'self'
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Tools Summary

| Tool | Purpose | Command |
|------|---------|---------|
| OWASP ZAP | Web app scanner | `zap-baseline.py -t URL` |
| Burp Suite | Web proxy & scanner | GUI tool |
| SQLMap | SQL injection | `sqlmap -u URL` |
| Nikto | Web server scanner | `nikto -h URL` |
| npm audit | Dependency check | `npm audit` |
| Snyk | Vulnerability scanner | `snyk test` |
| SonarQube | Code quality | Web interface |

## Reporting Template

### Vulnerability Report Format
1. **Title**: Brief description
2. **Severity**: Critical/High/Medium/Low
3. **CVSS Score**: If applicable
4. **Description**: Detailed explanation
5. **Steps to Reproduce**: Clear steps
6. **Impact**: Business impact
7. **Remediation**: How to fix
8. **References**: Links to resources
