# StealthLink Mini App Dockerfile
# Multi-stage build for optimal image size

# Stage 1: Build dependencies
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci --only=production

# Stage 2: Production image
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S stealthchat -u 1001

# Copy production dependencies from builder stage
COPY --from=builder --chown=stealthchat:nodejs /app/node_modules ./node_modules

# Copy application files
COPY --chown=stealthchat:nodejs . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV WS_PORT=3001

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Switch to non-root user
USER stealthchat

# Start the application
CMD ["node", "bot-server.js"]

# Development stage (for development builds)
FROM node:18-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies including dev dependencies
RUN npm install

# Copy source code
COPY . .

# Expose ports
EXPOSE 3000 3001

# Start in development mode
CMD ["npm", "run", "dev"]

# ============================================================================
# DOCKER COMMANDS
# ============================================================================

# Build production image:
# docker build -t stealth-chat .

# Build development image:
# docker build --target development -t stealth-chat:dev .

# Run production container:
# docker run -p 3000:3000 -p 3001:3001 --env-file .env stealth-chat

# Run development container:
# docker run -p 3000:3000 -p 3001:3001 --env-file .env stealth-chat:dev

# Run with Docker Compose (see docker-compose.yml):
# docker-compose up -d

# ============================================================================
# DOCKER COMPOSE EXAMPLE
# ============================================================================

# Create docker-compose.yml:
# version: '3.8'
# services:
#   stealth-chat:
#     build: .
#     ports:
#       - "3000:3000"
#       - "3001:3001"
#     environment:
#       - NODE_ENV=production
#       - BOT_TOKEN=${BOT_TOKEN}
#     env_file:
#       - .env
#     restart: unless-stopped
#     healthcheck:
#       test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
#       interval: 30s
#       timeout: 10s
#       retries: 3

# ============================================================================
# SECURITY NOTES
# ============================================================================

# 1. Non-root user: The container runs as 'stealthchat' user (UID 1001)
# 2. Minimal base image: Alpine Linux for smaller attack surface
# 3. Health check: Automatic container health monitoring
# 4. Multi-stage build: Separate build and runtime environments
# 5. No secrets in image: Use environment variables or secrets management

# ============================================================================
# PRODUCTION DEPLOYMENT
# ============================================================================

# For production deployment, consider:
# 1. Use a reverse proxy (nginx) for SSL termination
# 2. Set up proper logging (e.g., ELK stack, Papertrail)
# 3. Configure monitoring (Prometheus, Grafana)
# 4. Set up automated backups
# 5. Use Kubernetes for orchestration (if needed)
# 6. Configure resource limits and requests