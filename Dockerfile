# Use Puppeteer base image that already includes Chromium
FROM ghcr.io/puppeteer/puppeteer:24.10.0

# Set working directory
WORKDIR /app

# Copy only package files first (for caching npm install)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the rest of the app
COPY . .

# Ensure Puppeteer finds Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Reduce noise and prevent zombie processes
ENV NODE_ENV=production \
    PUPPETEER_CACHE_DIR=/tmp/.puppeteer_cache \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Expose the service port
EXPOSE 8080

# Add a basic healthcheck (optional but useful)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:8080 || exit 1

# Run the service
CMD ["node", "index.js"]
