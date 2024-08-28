FROM node:8.16.0-alpine

# 80 = HTTP, 443 = HTTPS, 3000 = MEAN.JS server
EXPOSE 80 443 3000 35729 8080

# Set production environment as default
ENV NODE_ENV development

# The node image has a very verbose logging level for npm, this sets it back to the default level
ENV NPM_CONFIG_LOGLEVEL warn

# Set display and chrome env variables for use in client tests
ENV DISPLAY :99.0
ENV CHROME_BIN /usr/bin/chromium-browser

# Set the working directory
WORKDIR /opt/mean.js

# Install required packages
RUN apk add --no-cache git chromium xvfb dbus xorg-server mesa-dri-swrast ttf-freefont

# Install the production packages
COPY package.json /opt/mean.js/package.json
RUN npm install && npm cache clean --force \
  && npm link gulp

# Copy the build related files and install build packages. Also perform the actual production build.
COPY .bowerrc bower.json /opt/mean.js/
RUN npm link bower \
  && bower install --allow-root --config.interactive=false

CMD npm start
