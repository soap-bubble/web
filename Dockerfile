FROM node:boron
COPY package.json /tmp/package.json
RUN cd /tmp && npm install --quiet
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/
WORKDIR /opt/app
COPY . /opt/app
CMD npm run build && npm start
EXPOSE 4000
