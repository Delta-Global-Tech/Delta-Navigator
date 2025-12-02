# Dockerfile para Iugu Server - Production Ready
FROM node:18-alpine

RUN apk add --no-cache curl tini

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY . .

RUN mkdir -p /app/logs

EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3005/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "--max-old-space-size=512", "server.js"]
