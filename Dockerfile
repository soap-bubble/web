FROM node:boron
COPY package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/
WORKDIR /opt/app
COPY . /opt/app
ENV NODE_ENV=production
CMD npm run production
EXPOSE 8060
