FROM node:alpine as base

WORKDIR /app

COPY package.json ./

RUN rm -rf node_modules && npm install

COPY . .

CMD ["node", "./server.js"]