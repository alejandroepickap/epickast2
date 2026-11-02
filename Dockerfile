# Servidor de señalización EpicKast para desplegar 24/7 gratis en Render.com / Fly.io / Railway
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --ignore-scripts ws
COPY server ./server
ENV PORT=7777
ENV EPICKAST_DATA=/app/data
EXPOSE 7777
CMD ["node", "server/server.js"]
