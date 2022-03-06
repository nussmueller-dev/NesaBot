FROM node:lts-alpine
ENV TZ=Europe/Zurich

RUN apk add --no-cache chromium && apk add tzdata

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# If not production
#RUN npm install
# If you are building your code for production
RUN npm ci --only=production

# Bundle app source
COPY . .

RUN echo -n > data.json

CMD [ "node", "index.js" ]