FROM debian

ARG protocVersion="3.9.0"

WORKDIR /tmp

RUN set -ex && \
  apt-get update && \
  apt-get install -y wget unzip && \
  wget --quiet "https://github.com/protocolbuffers/protobuf/releases/download/v$protocVersion/protoc-$protocVersion-linux-x86_64.zip" && \
  rm -rf /var/lib/apt/lists/* && \
  unzip "protoc-$protocVersion-linux-x86_64.zip" && \
  mv include/* /usr/include && \
  mv bin/* /usr/bin

COPY build-proto.sh .
COPY proto proto

RUN ./build-proto.sh

FROM node:10.6.0-slim

WORKDIR /usr/local/falsedichotomy

COPY package.json .
COPY package-lock.json .
RUN npm install --production

COPY config config
COPY data data
COPY lib lib
COPY index.js .
COPY --from=0 /tmp/proto proto

CMD [ "/usr/local/bin/npm", "start" ]
