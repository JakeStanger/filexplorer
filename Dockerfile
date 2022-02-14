FROM node:alpine

RUN apk --no-cache upgrade && apk add yarn

ENV ROOT_PATH=/var/www/filebrowser
ENV PORT=5000

WORKDIR /opt/filebrowser
COPY ./package.json package.json
COPY ./yarn.lock yarn.lock
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

RUN mkdir -p /var/www/filebrowser

EXPOSE 5000

ENTRYPOINT ["yarn", "start"]