FROM node:dubnium
ARG BOT_PRODUCTION_TWITCH_CLIENT_ID
ENV BOT_PRODUCTION_TWITCH_CLIENT_ID=$BOT_PRODUCTION_TWITCH_CLIENT_ID
ARG BOT_PRODUCTION_TWITCH_CALLBACK_URL
ENV BOT_PRODUCTION_TWITCH_CALLBACK_URL=$BOT_PRODUCTION_TWITCH_CALLBACK_URL
ARG BOT_STAGING_TWITCH_CLIENT_ID
ENV BOT_STAGING_TWITCH_CLIENT_ID=$BOT_STAGING_TWITCH_CLIENT_ID
ARG BOT_STAGING_TWITCH_CALLBACK_URL
ENV BOT_STAGING_TWITCH_CALLBACK_URL=$BOT_STAGING_TWITCH_CALLBACK_URL
ARG CORE_FB_APP_ID
ENV CORE_FB_APP_ID=$CORE_FB_APP_ID
ARG CORE_GOOGLE_ANALYTICS_ID
ENV CORE_GOOGLE_ANALYTICS_ID=$CORE_GOOGLE_ANALYTICS_ID
ARG CORE_CONTENTFUL_SPACE
ENV CORE_CONTENTFUL_SPACE=$CORE_CONTENTFUL_SPACE
ARG CORE_CONTENTFUL_ACCESS
ENV CORE_CONTENTFUL_ACCESS=$CORE_CONTENTFUL_ACCESS
RUN mkdir -p /opt/app
COPY . /opt/app
WORKDIR /opt/app
RUN npm install --quiet;\
    npm run build;\
    npm install --production --quiet
ENV NODE_ENV=production
CMD node lib/index
EXPOSE 80
