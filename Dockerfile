FROM node:dubnium-alpine

WORKDIR /app

COPY package.json  ./
RUN yarn install
RUN npm install -g nodemon

USER root

#RUN echo "fs.inotify.max_user_watches=524288" >> /etc/sysctl.conf
#RUN echo fs.inotify.max_user_watches=524288 | tee -a /etc/sysctl.conf
#RUN sysctl -p

COPY auth .
ADD auth .


EXPOSE 4000

USER node

CMD ["npm", "start"]
