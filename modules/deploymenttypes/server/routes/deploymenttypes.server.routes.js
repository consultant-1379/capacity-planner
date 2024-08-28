'use strict';

var deploymenttypes = require('../controllers/deploymenttypes.server.controller');

module.exports = function (app) {
  app.route('/api/deploymenttypes')
    .get(deploymenttypes.list)
    .post(deploymenttypes.create);

  app.route('/api/deploymenttypes/:deploymenttypeId')
    .get(deploymenttypes.read)
    .put(deploymenttypes.update)
    .delete(deploymenttypes.delete);

  app.param('deploymenttypeId', deploymenttypes.findById);
};
