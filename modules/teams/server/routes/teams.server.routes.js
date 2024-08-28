'use strict';

var teams = require('../controllers/teams.server.controller');

module.exports = function (app) {
  app.route('/api/teams')
    .get(teams.list)
    .post(teams.create);

  app.route('/api/teams/:teamId')
    .get(teams.read)
    .put(teams.update)
    .delete(teams.delete);

  app.param('teamId', teams.findById);
};
