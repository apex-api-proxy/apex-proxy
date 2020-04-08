FROM node:13.8.0

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
# RUN npm ci --only=production

COPY . .

Expose 1989

CMD [ "npm", "start" ]
