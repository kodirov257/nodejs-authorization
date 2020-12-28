FROM node:lts-alpine3.12

WORKDIR /app

COPY package.json  .
RUN npm install
RUN npm install -g nodemon


#RUN echo "fs.inotify.max_user_watches=524288" >> /etc/sysctl.conf
#RUN echo fs.inotify.max_user_watches=524288 | tee -a /etc/sysctl.conf
#RUN sysctl -p

COPY . .
ADD . .


EXPOSE 4000


CMD ["npm", "start"]
