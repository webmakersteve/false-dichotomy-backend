FROM node:10.6.0-slim

WORKDIR /usr/local/falsedichotomy

COPY package.json .
COPY package-lock.json .

RUN npm install --production

COPY config config
COPY data data
COPY lib lib
COPY index.js .

CMD [ "/usr/local/bin/npm", "start" ]
