FROM node:4.6.1
WORKDIR /usr/src/app
COPY . /usr/src/app/
RUN npm install
ENV NODE_ENV=production
CMD npm run start
EXPOSE 8060
