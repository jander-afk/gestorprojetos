# Imagem única usada pelos serviços `web` e `worker` (comandos diferentes).
FROM node:20-bookworm-slim

# openssl é exigido pelo engine do Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependências (inclui devDeps: tsx e prisma são necessários em runtime/build)
COPY package*.json ./
RUN npm install

# Código + build
COPY . .
RUN npx prisma generate && npm run build

EXPOSE 3000

# Default = web. O serviço `worker` sobrescreve o command no compose.
CMD ["npm", "run", "start"]
