FROM node:boron
RUN mkdir -p /opt/app
COPY package.json /opt/app/
WORKDIR /opt/app
RUN npm install
COPY . /opt/app
CMD npm run build && npm start
EXPOSE 4000
