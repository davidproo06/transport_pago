FROM node:20-alpine

WORKDIR /app

# Copy root and client package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN npm --prefix client install

# Copy source files
COPY . .

# Build frontend
RUN npm --prefix client run build

# Expose port
EXPOSE 4000

ENV PORT=4000
ENV NODE_ENV=production

# Start application
CMD ["npm", "start"]
