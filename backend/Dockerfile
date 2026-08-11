FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
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
