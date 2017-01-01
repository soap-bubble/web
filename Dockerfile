FROM node:4.6.1
COPY package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/
WORKDIR /usr/src/app
COPY . /usr/src/app/
ENV NODE_ENV=production
CMD npm run start
EXPOSE 8060
