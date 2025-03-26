# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache python3 make g++ && \
    npm install --legacy-peer-deps && \
    npm rebuild bcrypt --build-from-source
COPY . .
RUN npm run build && npx prisma generate

# Production Stage
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
USER node
RUN npx prisma generate
EXPOSE 3000
ENTRYPOINT ["dumb-init", "node", "dist/main.js"]