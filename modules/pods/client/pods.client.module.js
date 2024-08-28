(function (app) {
  'use strict';

  app.registerModule('pods', ['core']);
  app.registerModule('pods.services');
  app.registerModule('pods.routes', ['ui.router', 'core.routes', 'pods.services', 'projects.services']);
}(ApplicationConfiguration));
