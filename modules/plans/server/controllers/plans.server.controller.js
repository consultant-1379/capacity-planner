'use strict';

var path = require('path');
var commonController = require(path.resolve('./modules/core/server/controllers/common.server.controller'));
var modelName = 'Plan';
var dependentModelsDetails = [];
var sortOrder = 'name';
commonController = commonController(modelName, dependentModelsDetails, sortOrder);

exports.create = commonController.create;
exports.read = commonController.read;
exports.list = commonController.list;
exports.update = commonController.update;
exports.delete = commonController.delete;
exports.findById = commonController.findById;
