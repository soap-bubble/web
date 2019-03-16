FROM node:dubnium
# Doing this first because we don't want to change this layer often
RUN mkdir -p /opt/app
COPY package.json /opt/app/
WORKDIR /opt/app
RUN npm install --quiet
COPY . /opt/app
ENV NODE_ENV=production
RUN npm run build
RUN npm install --quiet --production
CMD npm run start
EXPOSE 8050
