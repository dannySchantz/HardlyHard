# Use Node.js LTS with glibc (not musl) for better Prisma compatibility
FROM node:18-slim

# Install system dependencies for Prisma
RUN apt-get update -y && apt-get install -y \
    openssl \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src/

# Generate Prisma client for production
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PRISMA_CLI_TELEMETRY_DISABLED=1

# Start server
CMD ["npm", "start"] 