# --- Estágio 1: Build ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./

RUN npm install

# Copia TODOS os arquivos do projeto para o contêiner
COPY . .

# --- CORREÇÃO FINAL ---
# Força o build a usar nosso arquivo de configuração específico.
RUN npx vite build --config vite.config.ts

# --- Estágio 2: Serve ---
FROM nginx:stable-alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]