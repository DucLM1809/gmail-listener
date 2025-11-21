# ===== STAGE 1: Build =====
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files trước để tận dụng cache
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ source
COPY . .

# Build (NestJS hoặc ReactJS)
RUN npm run build


# ===== STAGE 2: Production Image =====
FROM node:22-alpine

WORKDIR /app

# Copy file package để cài prod deps
COPY package*.json ./

# Cài production dependencies
RUN npm install --only=production

# Copy build output từ builder vào
COPY --from=builder /app/dist ./dist

# Expose port (thay 3000 bằng port app bạn)
EXPOSE 3000

# Run app
CMD ["node", "dist/main.js"]
