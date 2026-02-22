FROM node:20-alpine

WORKDIR /app

# Herramientas de compilación necesarias para better-sqlite3 (módulo nativo)
RUN apk add --no-cache python3 make g++

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar código fuente y compilar el frontend
COPY . .
RUN npm run build

# Carpeta de datos para la base de datos SQLite
RUN mkdir -p /app/data

EXPOSE 9977
ENV SERVER_PORT=9977

CMD ["node", "server/index.js"]
