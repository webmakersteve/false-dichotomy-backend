FROM node:10.6.0-slim

WORKDIR /usr/local/falsedichotomy

COPY build-proto.sh .
COPY proto proto

RUN set -ex && \
  apt-get update && \
  apt-get install -y protobuf-compiler && \
  ./build-proto.sh && \
  apt-get remove -y protobuf-compiler && \
  apt-get autoremove && \
  rm -rf /var/lib/apt/lists/* && \
  rm build-proto.sh .

COPY package.json .
COPY package-lock.json .
RUN npm install --production

COPY config config
COPY data data
COPY lib lib
COPY index.js .

CMD [ "/usr/local/bin/npm", "start" ]
