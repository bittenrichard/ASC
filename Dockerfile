# Dockerfile para o Frontend (React App)

# --- Estágio 1: Build ---
# Usa uma imagem Node para construir a aplicação
FROM node:18-alpine AS build

# Define o diretório de trabalho
WORKDIR /app

# Copia o package.json e package-lock.json
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o resto do código da aplicação
COPY . .

# Executa o build de produção, criando a pasta /dist
RUN npm run build

# --- Estágio 2: Serve ---
# Usa uma imagem Nginx super leve para servir os arquivos estáticos
FROM nginx:stable-alpine

# Copia a configuração personalizada do Nginx que vamos criar
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos construídos do estágio anterior para a pasta pública do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expõe a porta 80, que é a porta padrão para web
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]