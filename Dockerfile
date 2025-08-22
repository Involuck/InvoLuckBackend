# Multi-stage Dockerfile for InvoLuck Backend
# Optimized for production deployment with security and performance best practices

# Stage 1: Build dependencies and compile TypeScript
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy source code
COPY . .

# Build email templates
RUN npm run email:build

# Build TypeScript
RUN npm run build

# Remove dev dependencies and files not needed in production
RUN rm -rf src/ \
    .eslintrc.cjs \
    .prettierrc.json \
    jest.config.ts \
    nodemon.json \
    tsconfig.json \
    .env.example \
    .gitignore \
    README.md \
    src/emails/maizzle/

# Stage 2: Production image
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S involuck -u 1001

# Set working directory
WORKDIR /app

# Install only production runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl

# Copy built application from builder stage
COPY --from=builder --chown=involuck:nodejs /app/dist ./dist
COPY --from=builder --chown=involuck:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=involuck:nodejs /app/package.json ./package.json
COPY --from=builder --chown=involuck:nodejs /app/src/emails/compiled ./src/emails/compiled

# Create logs directory
RUN mkdir -p /app/logs && \
    chown involuck:nodejs /app/logs

# Switch to non-root user
USER involuck

# Expose port
EXPOSE 5000

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"]

# Metadata
LABEL \
    org.opencontainers.image.title="InvoLuck Backend" \
    org.opencontainers.image.description="Professional invoice management system backend" \
    org.opencontainers.image.version="1.0.0" \
    org.opencontainers.image.authors="InvoLuck Team <team@involuck.dev>" \
    org.opencontainers.image.url="https://involuck.dev" \
    org.opencontainers.image.source="https://github.com/involuck/backend" \
    org.opencontainers.image.licenses="MIT"
