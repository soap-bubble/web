FROM node:14
ARG DEPLOYMENT
ENV DEPLOYMENT ${DEPLOYMENT:-local}
WORKDIR /app
COPY package.json ./
RUN yarn
COPY . ./
RUN yarn build
ENV PORT=80
EXPOSE 80
CMD yarn start
