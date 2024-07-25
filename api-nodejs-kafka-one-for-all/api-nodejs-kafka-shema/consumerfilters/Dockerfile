FROM node:16

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY consumerfilters.js ./
COPY schema.avsc ./

CMD ["node", "consumerfilters.js"]