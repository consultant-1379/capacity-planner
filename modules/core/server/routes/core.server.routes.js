'use strict';

// Root routing
var core = require('../controllers/core.server.controller');

module.exports = function (app) {
  app.route('/api/version').get(core.getVersion);
  // Return a 404 for all undefined api, module or lib routes
  app.route('/:url(api|modules|lib)/*').get(core.renderNotFound);

  // Define application route
  app.route('/*').get(core.renderIndex);
};
