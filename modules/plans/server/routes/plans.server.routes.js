'use strict';

var plans = require('../controllers/plans.server.controller');

module.exports = function (app) {
  app.route('/api/plans')
    .get(plans.list)
    .post(plans.create);

  app.route('/api/plans/:planId')
    .get(plans.read)
    .put(plans.update)
    .delete(plans.delete);

  app.param('planId', plans.findById);
};
