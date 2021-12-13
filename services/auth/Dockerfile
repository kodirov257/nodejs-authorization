FROM node:16-alpine3.14

WORKDIR /app

COPY package.json  ./
RUN yarn install
RUN npm install -g nodemon

COPY . .
ADD . .


EXPOSE 4000

USER node

CMD ["npm", "start"]