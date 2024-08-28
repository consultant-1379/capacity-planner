'use strict';

// User Routes
var users = require('../controllers/users.server.controller');

module.exports = function (app) {
  // Setting up the users profile api
  app.route('/api/users/me').get(users.me);
  app.route('/api/users').put(users.update);

  // Finish by binding the user middleware
  app.param('userId', users.userByID);
};
