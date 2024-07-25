FROM node:16

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY consumernew.js ./
COPY schema.avsc ./

CMD ["node", "consumernew.js"]