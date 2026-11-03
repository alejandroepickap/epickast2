# Servidor EpicKast 24/7 listo para desplegar gratis en Render.com / Koyeb / Fly.io / Railway
FROM node:24-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --ignore-scripts ws && mkdir -p /app/data/uploads
COPY server ./server
COPY release ./release
ENV PORT=7777
ENV EPICKAST_DATA=/app/data
EXPOSE 7777
CMD ["node", "server/server.js"]
