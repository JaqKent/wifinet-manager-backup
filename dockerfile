FROM node:16 as development
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY ./ ./
CMD [ "npm", "run", "start:dev" ]
