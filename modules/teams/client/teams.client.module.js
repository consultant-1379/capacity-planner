(function (app) {
  'use strict';

  app.registerModule('teams', ['core']);
  app.registerModule('teams.services');
  app.registerModule('teams.routes', ['ui.router', 'core.routes', 'teams.services', 'projects.services']);
}(ApplicationConfiguration));
