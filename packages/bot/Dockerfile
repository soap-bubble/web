FROM node:10
# Doing this first because we don't want to change this layer often
RUN mkdir -p /opt/app
COPY . /opt/app
WORKDIR /opt/app
RUN npm install --quiet;\
    npm run build;\
    npm install --quiet --production
ENV NODE_ENV=production
CMD npm run start
EXPOSE 80
