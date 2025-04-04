# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++

# Copy package files first for better caching
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm install --legacy-peer-deps && \
    npm rebuild bcrypt --build-from-source

# Copy the rest of the application
COPY . .


# Generate Prisma client and build the application
RUN npx prisma generate 
RUN npm run build

# Production Stage
FROM node:20-alpine
WORKDIR /app

# Copy necessary files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Ensure correct permissions
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Default command
CMD ["node", "dist/main.js"]