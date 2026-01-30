# 🔒 Security Guide - MetinAnaliz

This document outlines security best practices and implementations for the MetinAnaliz application.

## Table of Contents
- [Backend Security (FastAPI)](#backend-security-fastapi)
- [Frontend Security (Angular)](#frontend-security-angular)
- [Deployment Security](#deployment-security)
- [Security Checklist](#security-checklist)

---

## Backend Security (FastAPI)

### 1. Input Validation & Sanitization ✅

**Why:** Prevents XSS (Cross-Site Scripting), SQL Injection, and other injection attacks.

**Implementation:**
```python
# Use the provided security_middleware.py

from security_middleware import sanitize_text_input, validate_text_content

@app.post("/analyze")
def analyze_endpoint(payload: AnalyzeRequest):
    # Sanitize input
    sanitized_text = sanitize_text_input(payload.text, max_length=100000)
    validate_text_content(sanitized_text)

    return analyze_text(sanitized_text, payload.analysis_type)
```

**What it does:**
- ✅ Removes null bytes
- ✅ Detects `<script>` tags and JavaScript injection
- ✅ Checks for suspicious patterns (onclick, onerror, etc.)
- ✅ HTML escapes the text
- ✅ Validates reasonable text content
- ✅ Limits input length to prevent DoS

### 2. Rate Limiting ⚡

**Why:** Prevents brute force attacks and API abuse.

**Implementation:**
```python
from security_middleware import RateLimitMiddleware

app.add_middleware(RateLimitMiddleware, requests_per_minute=60)
```

**For Production:** Use Redis-based rate limiting with [slowapi](https://github.com/laurentS/slowapi):
```bash
pip install slowapi redis
```

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/analyze")
@limiter.limit("60/minute")
def analyze_endpoint(request: Request, payload: AnalyzeRequest):
    ...
```

### 3. CORS Configuration 🌐

**Why:** Controls which domains can access your API.

**Implementation:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourdomain.com",  # Production
        "http://localhost:4200"     # Development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # Only methods you need
    allow_headers=["Content-Type", "Authorization"],
    max_age=3600,
)
```

**Never use in production:**
```python
allow_origins=["*"]  # ❌ DANGEROUS - allows any domain
```

### 4. Security Headers 🛡️

**Why:** Protects against XSS, clickjacking, MIME sniffing attacks.

**Implementation:**
```python
from security_middleware import SecurityHeadersMiddleware

app.add_middleware(SecurityHeadersMiddleware)
```

**Headers added:**
- `Content-Security-Policy`: Prevents XSS
- `X-Frame-Options`: Prevents clickjacking
- `X-Content-Type-Options`: Prevents MIME sniffing
- `X-XSS-Protection`: Browser XSS filter
- `Referrer-Policy`: Controls referrer information
- `Permissions-Policy`: Restricts browser features

### 5. Request Size Limits 📏

**Why:** Prevents memory exhaustion and DoS attacks.

**Implementation:**
```python
from security_middleware import RequestSizeLimitMiddleware

app.add_middleware(RequestSizeLimitMiddleware, max_size=1024 * 1024)  # 1MB
```

### 6. HTTPS Only 🔐

**Why:** Encrypts all traffic between client and server.

**Implementation:**
```python
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

# Only in production
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(HTTPSRedirectMiddleware)
```

### 7. Environment Variables 🔑

**Why:** Keeps secrets out of code.

**Implementation:**
Create `.env` file (add to `.gitignore`):
```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://...
ALLOWED_ORIGINS=https://yourdomain.com
ENVIRONMENT=production
```

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    secret_key: str
    database_url: str
    allowed_origins: str
    environment: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()
```

### 8. Logging & Monitoring 📊

**Why:** Detect and respond to security incidents.

**Implementation:**
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

@app.post("/analyze")
def analyze_endpoint(request: Request, payload: AnalyzeRequest):
    client_ip = request.client.host
    logger.info(f"Analysis request from {client_ip}, text_length={len(payload.text)}")

    try:
        result = analyze_text(payload.text)
        return result
    except ValueError as e:
        logger.warning(f"Invalid input from {client_ip}: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
```

---

## Frontend Security (Angular)

### 1. XSS Prevention 🚫

**Angular's Built-in Protection:**
Angular automatically sanitizes values to prevent XSS attacks when using:
- `{{ value }}` (interpolation)
- `[property]="value"` (property binding)

**⚠️ NEVER use `innerHTML` with user content:**
```typescript
// ❌ DANGEROUS
this.element.innerHTML = userInput;

// ✅ SAFE - Angular sanitizes automatically
<div>{{ userInput }}</div>

// ✅ SAFE - If you must use innerHTML, sanitize first
import { DomSanitizer } from '@angular/platform-browser';

constructor(private sanitizer: DomSanitizer) {}

getSafeHtml(html: string) {
  return this.sanitizer.sanitize(SecurityContext.HTML, html);
}
```

### 2. Content Security Policy (CSP) 🛡️

**Implementation in `index.html`:**
```html
<head>
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' https://pagead2.googlesyndication.com https://www.googletagmanager.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https://yourapi.com;
    frame-ancestors 'none';
  ">
</head>
```

### 3. Input Validation 📝

**Client-side validation (user experience):**
```typescript
// analyze.page.ts
validateInput(text: string): boolean {
  // Check length
  if (text.length > 100000) {
    this.errorMessage = "Metin çok uzun (maksimum 100,000 karakter)";
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
  if (!this.validateInput(this.text)) {
    return;
  }

  // Continue with API call...
}
```

**Note:** Client-side validation is for UX only. Always validate on the backend!

### 4. HTTPS Only 🔒

**Force HTTPS in production:**
```typescript
// main.ts
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();

  // Redirect to HTTPS
  if (location.protocol !== 'https:') {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
  }
}
```

### 5. Secure API Communication 🔐

**Use HttpClient with interceptors:**
```typescript
// http-security.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';

@Injectable()
export class HttpSecurityInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    // Add security headers
    const secureReq = req.clone({
      setHeaders: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    return next.handle(secureReq);
  }
}

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([httpSecurityInterceptor])
    )
  ]
};
```

### 6. Avoid eval() and Function() ❌

```typescript
// ❌ NEVER DO THIS
eval(userInput);
new Function(userInput)();

// ✅ Use safe alternatives
const result = JSON.parse(userInput);  // For JSON
```

### 7. Dependency Security 🔄

**Regularly update dependencies:**
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update Angular
ng update @angular/core @angular/cli
```

**Use npm scripts in `package.json`:**
```json
{
  "scripts": {
    "security-check": "npm audit",
    "security-fix": "npm audit fix"
  }
}
```

---

## Deployment Security

### 1. Environment Configuration ⚙️

**Production checklist:**
- ✅ Use HTTPS (SSL/TLS certificate)
- ✅ Set secure CORS origins
- ✅ Enable rate limiting
- ✅ Use environment variables for secrets
- ✅ Disable debug mode
- ✅ Enable logging and monitoring
- ✅ Use secure headers
- ✅ Implement request size limits

### 2. Server Configuration 🖥️

**Nginx example:**
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Request size limit
    client_max_body_size 1M;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Database Security 🗄️

**If you add a database later:**
- ✅ Use parameterized queries (prevents SQL injection)
- ✅ Encrypt sensitive data at rest
- ✅ Use connection pooling
- ✅ Limit database user permissions
- ✅ Enable database audit logs

---

## Security Checklist

### Backend
- [ ] Input validation and sanitization implemented
- [ ] Rate limiting enabled
- [ ] CORS properly configured (no wildcard in production)
- [ ] Security headers added
- [ ] Request size limits set
- [ ] HTTPS enforced in production
- [ ] Environment variables used for secrets
- [ ] Logging and monitoring enabled
- [ ] Dependencies regularly updated
- [ ] Error messages don't expose sensitive info

### Frontend
- [ ] No use of `innerHTML` with user content
- [ ] Content Security Policy configured
- [ ] Client-side input validation for UX
- [ ] HTTPS enforced
- [ ] HTTP interceptors for security headers
- [ ] No use of `eval()` or `Function()`
- [ ] Dependencies regularly audited
- [ ] Angular's built-in sanitization not bypassed

### Deployment
- [ ] SSL/TLS certificate installed
- [ ] Firewall configured
- [ ] Server security headers enabled
- [ ] Request size limits on server
- [ ] Regular security updates applied
- [ ] Monitoring and alerting setup
- [ ] Backup strategy in place
- [ ] Incident response plan documented

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Angular Security Guide](https://angular.io/guide/security)
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)

---

## Reporting Security Issues

If you discover a security vulnerability, please email: [your-email@domain.com]

**Do not** create a public GitHub issue for security vulnerabilities.
