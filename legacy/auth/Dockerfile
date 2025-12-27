FROM node:dubnium
RUN mkdir -p /opt/app
COPY . /opt/app
WORKDIR /opt/app
RUN npm install; \
  npm run build; \
  npm install --production
ENV NODE_ENV=production
CMD npm start
EXPOSE 4000
