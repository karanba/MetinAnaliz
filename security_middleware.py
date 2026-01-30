"""
Security middleware and utilities for MetinAnaliz API
Provides protection against common web vulnerabilities
"""
import re
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import html
from typing import Optional


# ============================================
# 1. INPUT SANITIZATION
# ============================================

def sanitize_text_input(text: str, max_length: int = 100000) -> str:
    """
    Sanitize user text input to prevent XSS and other injection attacks.

    Args:
        text: Raw user input
        max_length: Maximum allowed text length

    Returns:
        Sanitized text safe for processing

    Raises:
        ValueError: If input is invalid or contains suspicious patterns
    """
    if not isinstance(text, str):
        raise ValueError("Input must be a string")

    # Check length
    if len(text) > max_length:
        raise ValueError(f"Text exceeds maximum length of {max_length} characters")

    # Remove null bytes (can cause security issues)
    if '\x00' in text:
        raise ValueError("Text contains invalid null bytes")

    # Check for suspicious script patterns (basic XSS detection)
    suspicious_patterns = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'on\w+\s*=',  # onclick, onerror, etc.
        r'<iframe',
        r'<object',
        r'<embed',
    ]

    text_lower = text.lower()
    for pattern in suspicious_patterns:
        if re.search(pattern, text_lower, re.IGNORECASE | re.DOTALL):
            raise ValueError("Text contains potentially malicious content")

    # HTML escape the text to prevent any HTML injection
    # Note: For Turkish text analysis, we still preserve the actual characters
    # but escape HTML entities if they exist
    sanitized = html.escape(text, quote=False)

    return sanitized


def validate_text_content(text: str) -> None:
    """
    Additional validation for text content.
    Checks for reasonable character distribution and content.
    """
    if not text.strip():
        raise ValueError("Text cannot be empty or only whitespace")

    # Check for excessive repeated characters (possible DoS attempt)
    if re.search(r'(.)\1{1000,}', text):
        raise ValueError("Text contains excessive character repetition")

    # Ensure text contains some actual letters (not just symbols)
    letter_count = sum(1 for c in text if c.isalpha())
    if letter_count < len(text) * 0.1:  # At least 10% letters
        raise ValueError("Text must contain a reasonable amount of actual text")


# ============================================
# 2. RATE LIMITING MIDDLEWARE
# ============================================

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiting middleware.
    For production, use Redis-based rate limiting.
    """
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_counts: dict = {}

    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"

        # Simple rate limiting logic
        import time
        current_minute = int(time.time() / 60)
        key = f"{client_ip}:{current_minute}"

        # Clean old entries
        old_keys = [k for k in self.request_counts.keys()
                   if int(k.split(':')[1]) < current_minute - 1]
        for old_key in old_keys:
            del self.request_counts[old_key]

        # Check rate limit
        self.request_counts[key] = self.request_counts.get(key, 0) + 1

        if self.request_counts[key] > self.requests_per_minute:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please try again later."}
            )

        response = await call_next(request)
        return response


# ============================================
# 3. SECURITY HEADERS MIDDLEWARE
# ============================================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all responses.
    Protects against XSS, clickjacking, and other attacks.
    """
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Content Security Policy - Prevent XSS
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' https://pagead2.googlesyndication.com https://www.googletagmanager.com 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self'; "
            "frame-ancestors 'none';"
        )

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Enable XSS filter in browsers
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions policy (formerly Feature-Policy)
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=()"
        )

        return response


# ============================================
# 4. REQUEST SIZE LIMITER
# ============================================

class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """
    Limit request body size to prevent memory exhaustion attacks.
    """
    def __init__(self, app, max_size: int = 1024 * 1024):  # 1MB default
        super().__init__(app)
        self.max_size = max_size

    async def dispatch(self, request: Request, call_next):
        if request.method in ["POST", "PUT", "PATCH"]:
            # Check Content-Length header
            content_length = request.headers.get("content-length")
            if content_length and int(content_length) > self.max_size:
                return JSONResponse(
                    status_code=413,
                    content={"detail": f"Request body too large. Maximum size: {self.max_size} bytes"}
                )

        response = await call_next(request)
        return response


# ============================================
# 5. SQL INJECTION PREVENTION
# ============================================

def validate_no_sql_injection(input_str: str) -> None:
    """
    Check for common SQL injection patterns.
    Note: Since we're not using a database, this is preventive for future use.
    """
    sql_patterns = [
        r"('\s*(or|and)\s*'?\d)",
        r"(union\s+select)",
        r"(drop\s+table)",
        r"(insert\s+into)",
        r"(delete\s+from)",
        r"(update\s+\w+\s+set)",
        r"(exec\s*\()",
        r"(execute\s*\()",
    ]

    input_lower = input_str.lower()
    for pattern in sql_patterns:
        if re.search(pattern, input_lower, re.IGNORECASE):
            raise ValueError("Input contains potentially malicious SQL patterns")


# ============================================
# 6. OUTPUT ENCODING
# ============================================

def encode_json_output(data: dict) -> dict:
    """
    Ensure all string values in JSON output are properly encoded.
    Prevents injection attacks in API responses.
    """
    if isinstance(data, dict):
        return {k: encode_json_output(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [encode_json_output(item) for item in data]
    elif isinstance(data, str):
        # HTML escape string values
        return html.escape(data, quote=True)
    else:
        return data


# ============================================
# USAGE NOTES
# ============================================

"""
To use these security features, update your main.py:

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from security_middleware import (
    RateLimitMiddleware,
    SecurityHeadersMiddleware,
    RequestSizeLimitMiddleware,
    sanitize_text_input,
    validate_text_content,
)

app = FastAPI(title="Metin Analiz API")

# Add security middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, requests_per_minute=60)
app.add_middleware(RequestSizeLimitMiddleware, max_size=1024 * 1024)  # 1MB

# Configure CORS properly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Specify your frontend domain
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    max_age=3600,
)

# In your endpoint:
@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_endpoint(payload: AnalyzeRequest) -> AnalyzeResponse:
    try:
        # Sanitize and validate input
        sanitized_text = sanitize_text_input(payload.text)
        validate_text_content(sanitized_text)

        return analyze_text(sanitized_text, payload.analysis_type)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
"""
