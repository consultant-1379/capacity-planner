'use strict';

var backlogprojects = require('../controllers/backlogprojects.server.controller');

module.exports = function (app) {
  app.route('/api/backlogprojects')
    .get(backlogprojects.list)
    .post(backlogprojects.create);

  app.route('/api/backlogprojects/:backlogprojectId')
    .get(backlogprojects.read)
    .put(backlogprojects.update)
    .delete(backlogprojects.delete);

  app.param('backlogprojectId', backlogprojects.findById);
};
