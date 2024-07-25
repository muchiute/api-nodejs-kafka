FROM node:16

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY consumerone.js ./
COPY schema.avsc ./

CMD ["node", "consumerone.js"]