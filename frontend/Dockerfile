# Use Node.js Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install Angular CLI globally
RUN npm install -g @angular/cli

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose Angular development server port
EXPOSE 4200

# Start Angular development server
CMD ["ng", "serve", "--host", "0.0.0.0", "--poll", "2000"] 