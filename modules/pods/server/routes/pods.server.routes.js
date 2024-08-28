'use strict';

var pods = require('../controllers/pods.server.controller');

module.exports = function (app) {
  app.route('/api/pods')
    .get(pods.list)
    .post(pods.create);

  app.route('/api/pods/:podId')
    .get(pods.read)
    .put(pods.update)
    .delete(pods.delete);

  app.param('podId', pods.findById);
};
