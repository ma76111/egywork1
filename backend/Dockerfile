FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN node seed.js
EXPOSE 5000
CMD ["node", "index.js"]
