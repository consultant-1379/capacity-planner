'use strict';

/**
 * Module dependencies
 */
var users = require('../controllers/users.server.controller'); // User Routes

module.exports = function (app) {
  // Setting up the users authentication api
  app.route('/api/auth/signin').post(users.signin);
  app.route('/api/auth/signout').get(users.signout);
};
