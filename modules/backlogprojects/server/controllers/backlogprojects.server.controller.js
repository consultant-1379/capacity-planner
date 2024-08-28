'use strict';

var path = require('path');
var commonController = require(path.resolve('./modules/core/server/controllers/common.server.controller'));
var modelName = 'BacklogProject';
var dependentModelsDetails = [{ modelName: 'Plan', modelKey: 'pods.backlog_project_ids' }];
var sortOrder = 'name';
commonController = commonController(modelName, dependentModelsDetails, sortOrder);
var errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

exports.create = commonController.create;
exports.read = commonController.read;
exports.list = commonController.list;
exports.update = commonController.update;
exports.delete = commonController.delete;
exports.findById = commonController.findById;
