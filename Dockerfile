# Stage 1: Build Angular frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production runtime
FROM python:3.11-slim

# Install nginx and supervisor
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Copy frontend build
COPY --from=frontend-build /app/dist/metin-analiz-ui/browser /usr/share/nginx/html

# Setup backend
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./

# Copy configuration files
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create temp directory for PDF processing
RUN mkdir -p /app/backend/temp/pdf_processing

# Create log directory for supervisor
RUN mkdir -p /var/log/supervisor

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
