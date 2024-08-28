(function (app) {
  'use strict';

  app.registerModule('backlogprojects', ['core']);
  app.registerModule('backlogprojects.services');
  app.registerModule('backlogprojects.routes', ['ui.router', 'core.routes', 'backlogprojects.services']);
}(ApplicationConfiguration));
