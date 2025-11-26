# Use a lighter base image
FROM node:18-alpine AS development

WORKDIR /app

# Set npm config to use faster registry (optional)
RUN npm config set registry https://registry.npmmirror.com

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Install dependencies with legacy peer deps to avoid conflicts
RUN npm install --legacy-peer-deps

# Copy rest of the application
COPY . .

# Expose port
EXPOSE 3000

# Set environment variable
ENV CHOKIDAR_USEPOLLING=true

# Start development server
CMD ["npm", "start"]
