FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

run npm run build

EXPOSE 4000

CMD ["node", "dist/index.js"]