FROM node:12
ARG DEPLOYMENT
ENV DEPLOYMENT ${DEPLOYMENT:-local}
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn
COPY . ./
RUN yarn build
RUN yarn --production
EXPOSE 80
CMD yarn start