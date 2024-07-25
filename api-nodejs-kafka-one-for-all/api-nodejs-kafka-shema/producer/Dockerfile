# producer/Dockerfile
FROM node:16

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY producer.js ./
COPY schema.avsc ./

CMD ["node", "producer.js"]