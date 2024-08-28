(function (app) {
  'use strict';

  app.registerModule('projects', ['core']);
  app.registerModule('projects.services');
  app.registerModule('projects.routes', ['ui.router', 'core.routes', 'projects.services', 'pods.services']);
}(ApplicationConfiguration));
