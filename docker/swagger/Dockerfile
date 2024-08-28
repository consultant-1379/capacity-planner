FROM swaggerapi/swagger-ui:v3.4.4

RUN mkdir -p /opt/meanjs
WORKDIR /opt/meanjs
ENV HOME /opt/meanjs

COPY ["modules/*/swagger/*.json", "./swagger/"]
COPY docker/swagger/gulpfile.js gulpfile.js
COPY docker/swagger/package.json package.json
COPY VERSION VERSION

RUN apk add --update nodejs \
  && npm install && npm cache clean --force \
  && npm link gulp \
  && gulp \
  && npm prune \
  && npm cache clean --force \
  && apk del nodejs \
  && rm -rf node_modules
