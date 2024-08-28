'use strict';

var mongoose = require('mongoose');
var path = require('path');
var commonValidators = require(path.resolve('./modules/core/server/controllers/validators.server.controller'));
var Team = require(path.resolve('./modules/teams/server/models/teams.server.model.js')).Schema;
var DeploymentType = require(path.resolve('./modules/deploymenttypes/server/models/deploymenttypes.server.model.js')).Schema;
var MongooseSchema = mongoose.Schema;

var BacklogProject = new MongooseSchema({
  team_id: {
    type: MongooseSchema.ObjectId,
    ref: 'Team',
    required: true
  },
  deploymenttype_id: {
    type: MongooseSchema.ObjectId,
    ref: 'DeploymentType',
    required: true
  },
  name: {
    type: String,
    required: true,
    unique: true
  }
}, { strict: 'throw' });

BacklogProject.pre('save', async function (next) {
  try {
    var project = this;
    var team = await Team.findOne({ _id: project.team_id }).select('_id').lean().exec();
    if (!team) {
      return await Promise.reject(new Error('The given team id ' + project.team_id + ' could not be found'));
    }
    var deploymentType = await DeploymentType.findOne({ _id: project.deploymenttype_id }).select('_id').lean().exec();
    if (!deploymentType) {
      return await Promise.reject(new Error('The given deployment type id ' + project.deploymenttype_id + ' could not be found'));
    }
    return next();
  } catch (error) {
    return next(error);
  }
});

module.exports.Schema = mongoose.model('BacklogProject', BacklogProject);
