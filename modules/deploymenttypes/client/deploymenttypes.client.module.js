(function (app) {
  'use strict';

  app.registerModule('deploymenttypes', ['core']);
  app.registerModule('deploymenttypes.services');
  app.registerModule('deploymenttypes.routes', ['ui.router', 'core.routes', 'deploymenttypes.services', 'projects.services']);
}(ApplicationConfiguration));
