FROM node:lts-alpine
ENV TZ=Europe/Zurich

RUN apk add --no-cache chromium && apk add tzdata

WORKDIR /usr/src/app

COPY . .

RUN npm ci --only=production
RUN npm install --save typescript rimraf
RUN npm run build

CMD [ "node", "./build/index.js" ]