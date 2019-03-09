FROM node:carbon
ARG LE_SSL_EMAIL
ARG LE_SSL_DEBUG
ENV LE_SSL_EMAIL=$LE_SSL_EMAIL
ENV LE_SSL_DEBUG=$LE_SSL_DEBUG
# Doing this first because we don't want to change this layer often
RUN mkdir -p /opt/app
COPY package.json /opt/app/
WORKDIR /opt/app
RUN npm install --production --quiet
COPY . /opt/app
CMD node index
EXPOSE 80
EXPOSE 443
