FROM node:14
# Doing this first because we don't want to change this layer often
WORKDIR /opt/app
COPY package.json ./
RUN npm install --quiet
COPY . ./
RUN npm run build
ENV NODE_ENV=production
CMD npm run start
EXPOSE 80
