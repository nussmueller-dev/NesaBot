FROM node:lts-alpine
ENV TZ=Europe/Zurich

RUN apk add --no-cache chromium && apk add tzdata

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY ./src .

RUN echo -n > data.json

CMD [ "node", "index.js" ]