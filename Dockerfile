FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS backend
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production
COPY server/ ./server/
COPY --from=frontend-builder /app/dist ./dist
ENV PORT=8080
EXPOSE 8080
WORKDIR /app/server
CMD ["node", "index.js"]
