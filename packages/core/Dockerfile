FROM node:boron
# Doing this first because we don't want to change this layer often
RUN mkdir -p /opt/app
COPY package.json /opt/app/
WORKDIR /opt/app
RUN npm install --quiet
COPY . /opt/app
RUN npm run build;\
 npm install --production --quiet
CMD npm run start
EXPOSE 8060
