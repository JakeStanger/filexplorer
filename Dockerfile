FROM node:18-alpine3.15

RUN apk --no-cache upgrade && apk add yarn

ENV HOSTNAME=0.0.0.0
ENV PORT=5000
ENV DATABASE_PATH=/data.db
ENV SERVE_DIRECTORY=/srv/http

WORKDIR /opt/filexplorer
COPY ./package.json package.json
COPY ./yarn.lock yarn.lock
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

RUN mkdir -p /srv/http

EXPOSE 5000

ENTRYPOINT ["yarn", "start"]

HEALTHCHECK CMD curl http://localhost:$PORT || exit 1
