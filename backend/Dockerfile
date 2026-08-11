FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 4000

# Applies pending migrations then starts the API. DATABASE_URL, JWT_SECRET,
# etc. are supplied at runtime via environment variables / docker-compose.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
