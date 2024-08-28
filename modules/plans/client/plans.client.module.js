(function (app) {
  'use strict';

  app.registerModule('plans', ['core']);
  app.registerModule('plans.services');
  app.registerModule('plans.routes', ['ui.router', 'core.routes', 'plans.services']);
}(ApplicationConfiguration));
