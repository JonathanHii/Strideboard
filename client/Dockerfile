FROM node:20-alpine

WORKDIR /app

# Copy dependency files first 
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy the rest of your frontend code
COPY . .

# Build the Next.js application
RUN npm run build

# Open the port Next.js runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]