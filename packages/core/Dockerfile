FROM node:carbon
ARG GOOGLE_ANALYTICS_ID
ARG SOAPBUBBLE_CONTENTFUL_ACCESS
ARG SOAPBUBBLE_CONTENTFUL_SPACE
ARG SOAPBUBBLE_FB_APP_ID
# Doing this first because we don't want to change this layer often
RUN mkdir -p /opt/app
COPY package.json /opt/app/
WORKDIR /opt/app
RUN npm install --quiet
COPY . /opt/app
RUN npm run build;\
 npm install --production --quiet
CMD node lib/index
EXPOSE 8060
