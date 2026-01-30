# 🚀 Security Implementation Guide

Quick guide to implement security features in your MetinAnaliz application.

## 📋 Quick Start

### 1. Install Security Dependencies

```bash
# Navigate to your project directory
cd d:\Github\MetinAnaliz

# Install security packages
pip install -r requirements-security.txt
```

### 2. Set Up Environment Variables

```bash
# Copy example environment file
copy .env.example .env

# Edit .env file and update with your values
notepad .env
```

**Important:** Add `.env` to your `.gitignore`:
```bash
echo .env >> .gitignore
```

### 3. Choose Your Implementation

#### Option A: Quick Start (Minimal Changes)

Add just the essential security features to your existing `main.py`:

```python
# Add to the top of main.py
from security_middleware import (
    sanitize_text_input,
    validate_text_content,
)

# Update analyze endpoint
@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_endpoint(payload: AnalyzeRequest) -> AnalyzeResponse:
    try:
        # Add these two lines:
        sanitized_text = sanitize_text_input(payload.text)
        validate_text_content(sanitized_text)

        return analyze_text(sanitized_text, payload.analysis_type)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
```

#### Option B: Full Security (Recommended)

Replace your `main.py` with the secure version:

```bash
# Backup original
copy main.py main.py.backup

# Use secure version
copy main_secure.py main.py
```

### 4. Configure CORS

Update allowed origins in `.env`:

```env
# Development
ALLOWED_ORIGINS=http://localhost:4200

# Production (update with your actual domain)
ALLOWED_ORIGINS=https://yourdomain.com
```

### 5. Test Your Application

```bash
# Start the backend
python main.py

# In another terminal, run a test
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{"text":"Merhaba dünya. Bu bir test cümlesidir."}'
```

---

## 🔐 Security Features Implemented

### Backend (FastAPI)

| Feature | Status | Priority |
|---------|--------|----------|
| Input Sanitization | ✅ | **HIGH** |
| Input Validation | ✅ | **HIGH** |
| Rate Limiting | ✅ | **HIGH** |
| CORS Configuration | ✅ | **HIGH** |
| Security Headers | ✅ | **HIGH** |
| Request Size Limits | ✅ | **MEDIUM** |
| HTTPS Redirect | ✅ | **HIGH** (production) |
| Logging | ✅ | **MEDIUM** |
| Error Handling | ✅ | **HIGH** |

### Frontend (Angular)

| Feature | Status | Priority |
|---------|--------|----------|
| XSS Prevention | ✅ (Built-in) | **HIGH** |
| Input Validation | ⚠️ To Do | **MEDIUM** |
| CSP Headers | ⚠️ To Do | **HIGH** |
| HTTPS Enforcement | ⚠️ To Do | **HIGH** |

---

## 📝 Frontend Security To-Do

### 1. Add Input Validation (5 minutes)

Update `analyze.page.ts`:

```typescript
validateInput(text: string): boolean {
  // Check length
  if (text.length > 100000) {
    this.errorMessage = "Metin çok uzun (maksimum 100,000 karakter)";
    return false;
  }

  // Check minimum length
  if (text.trim().length < 10) {
    this.errorMessage = "Lütfen daha uzun bir metin girin";
    return false;
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      this.errorMessage = "Metin geçersiz karakterler içeriyor";
      return false;
    }
  }

  return true;
}

async analyze(): Promise<void> {
  // Add validation before API call
  if (!this.validateInput(this.text)) {
    return;
  }

  this.errorMessage = "";
  this.result = null;
  this.loading = true;

  try {
    const response = await firstValueFrom(
      this.api.analyze(this.text, this.analysisType).pipe(timeout(30000)),
    );
    this.result = response;
    this.cdr.detectChanges();
  } catch (err: any) {
    this.errorMessage =
      err?.error?.detail || "Analiz sırasında bir hata oluştu.";
    this.cdr.detectChanges();
  } finally {
    this.loading = false;
    this.cdr.detectChanges();
  }
}
```

### 2. Add CSP Headers (2 minutes)

Update `index.html` in the `<head>` section:

```html
<head>
  <!-- Existing Google tags -->

  <!-- Add CSP header -->
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' https://pagead2.googlesyndication.com https://www.googletagmanager.com 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' http://localhost:8000 https://yourapi.com;
    frame-ancestors 'none';
  ">

  <!-- Rest of head content -->
</head>
```

### 3. Force HTTPS in Production (3 minutes)

Update `main.ts`:

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();

  // Force HTTPS
  if (location.protocol !== 'https:') {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
  }
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
```

---

## 🧪 Testing Security

### Test Input Sanitization

```bash
# Test with malicious input (should be rejected)
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{"text":"<script>alert(\"XSS\")</script>"}'

# Expected: 422 error with "potentially malicious content"
```

### Test Rate Limiting

```bash
# Send 65 requests rapidly (should hit rate limit)
for i in {1..65}; do
  curl -X POST "http://localhost:8000/analyze" \
    -H "Content-Type: application/json" \
    -d '{"text":"Test"}' &
done

# Expected: Some requests return 429 "Rate limit exceeded"
```

### Test Request Size Limit

```bash
# Create a large file (>1MB)
python -c "print('a' * 2000000)" > large.txt

# Try to send it (should be rejected)
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"$(cat large.txt)\"}"

# Expected: 413 "Request body too large"
```

---

## 🚀 Deployment Checklist

Before deploying to production:

### Backend
- [ ] Update `ALLOWED_ORIGINS` in `.env` with your production domain
- [ ] Set `ENVIRONMENT=production` in `.env`
- [ ] Enable HTTPS (get SSL certificate)
- [ ] Configure production rate limiting (use Redis)
- [ ] Set up logging and monitoring
- [ ] Configure firewall rules
- [ ] Remove debug mode/verbose logging
- [ ] Review all error messages (don't expose internals)
- [ ] Test all security features
- [ ] Set up automated backups

### Frontend
- [ ] Update CSP headers with production API URL
- [ ] Enable production mode in Angular
- [ ] Force HTTPS redirect
- [ ] Remove console.log statements
- [ ] Build with production configuration: `ng build --configuration=production`
- [ ] Test on production domain

### Infrastructure
- [ ] Configure web server (Nginx/Apache) with security headers
- [ ] Set up SSL/TLS certificate (Let's Encrypt)
- [ ] Configure firewall (allow only 80, 443)
- [ ] Enable DDoS protection (Cloudflare, etc.)
- [ ] Set up monitoring (Sentry, New Relic, etc.)
- [ ] Configure automated security updates
- [ ] Document incident response procedure

---

## 📊 Monitoring & Logs

### What to Monitor

```python
# Add to your logging
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Log important events
logger.info(f"Analysis request: ip={client_ip}, text_length={len(text)}")
logger.warning(f"Invalid input: ip={client_ip}, error={error_msg}")
logger.error(f"System error: {error_msg}")
```

### Key Metrics

- Request rate per IP
- Failed validation attempts
- Error rates
- Response times
- Unusual patterns (very long texts, repeated requests)

---

## 🆘 Incident Response

If you detect a security issue:

1. **Isolate** - Block the attacking IP
2. **Investigate** - Check logs for pattern
3. **Document** - Record what happened
4. **Fix** - Patch the vulnerability
5. **Monitor** - Watch for similar attacks
6. **Update** - Improve security measures

---

## 📚 Additional Resources

- [SECURITY.md](./SECURITY.md) - Complete security documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Angular Security](https://angular.io/guide/security)

---

## ❓ Need Help?

- Check [SECURITY.md](./SECURITY.md) for detailed information
- Review error logs in `app.log`
- Test with curl commands above
- Check that all dependencies are installed: `pip list`

---

## 🎯 Quick Wins (Start Here!)

If you're short on time, implement these three things first:

1. **Input Sanitization** (5 min)
   - Add `sanitize_text_input()` to your analyze endpoint

2. **Rate Limiting** (2 min)
   - Add `RateLimitMiddleware` to your app

3. **CORS Configuration** (1 min)
   - Set proper `allow_origins` (no wildcards!)

These three changes will protect against the most common attacks!
