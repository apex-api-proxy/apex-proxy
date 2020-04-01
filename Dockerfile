FROM node:12.4-alpine
RUN mkdir /app
WORKDIR /app
COPY package.json package.json
RUN npm install && mv node_modules /node_modules
COPY . .
LABEL maintainer="Apex Team"
CMD npm start