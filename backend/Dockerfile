# Imagen de la API (Node). La usa deploy/docker/docker-compose.yml.
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY . .
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=30s --start-interval=2s CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "server.js"]
