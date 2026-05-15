FROM node:20-alpine

WORKDIR /app

# Herramientas de compilación necesarias para better-sqlite3 (módulo nativo)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

EXPOSE 3001
ENV PORT=3001

CMD ["node", "src/server.js"]
