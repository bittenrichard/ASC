# --- Estágio 1: Build do TypeScript
# Usa uma imagem Node.js moderna para garantir a compatibilidade
FROM node:20-alpine AS build

# Define o diretório de trabalho
WORKDIR /app

# O asterisco (*) garante que o package.json E o package-lock.json sejam copiados.
COPY package*.json ./

# Instala as dependências exatas definidas no lockfile
RUN npm install

# Copia todo o código-fonte do projeto
COPY . .
# Usa o comando de build padrão definido no package.json
RUN npm run build

# --- Estágio 2: Serve
# Usa uma imagem Nginx leve para servir os arquivos estáticos
FROM nginx:stable-alpine AS production

# Copia os arquivos de build gerados
COPY --from=build /app/dist /usr/share/nginx/html

# Copia a configuração personalizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80
EXPOSE 80

# Comando para iniciar o servidor Nginx
CMD ["nginx", "-g", "daemon off;"]