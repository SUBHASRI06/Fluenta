FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Install a simple static server
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "80"]
EXPOSE 80
