'use strict';

var path = require('path');
var commonController = require(path.resolve('./modules/core/server/controllers/common.server.controller'));
var modelName = 'DeploymentType';
var dependentModelsDetails = [{ modelName: 'Project', modelKey: 'deploymenttype_id' }, { modelName: 'BacklogProject', modelKey: 'deploymenttype_id' }];
var sortOrder = 'name';
commonController = commonController(modelName, dependentModelsDetails, sortOrder);

exports.create = commonController.create;
exports.read = commonController.read;
exports.list = commonController.list;
exports.update = commonController.update;
exports.delete = commonController.delete;
exports.findById = commonController.findById;
