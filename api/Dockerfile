FROM node:22-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
USER appuser
EXPOSE 5000
CMD ["node", "app.js"]