'use strict';

var mongoose = require('mongoose');
var path = require('path');
var commonValidators = require(path.resolve('./modules/core/server/controllers/validators.server.controller'));
var Pod = require(path.resolve('./modules/pods/server/models/pods.server.model.js')).Schema;
var Team = require(path.resolve('./modules/teams/server/models/teams.server.model.js')).Schema;
var DeploymentType = require(path.resolve('./modules/deploymenttypes/server/models/deploymenttypes.server.model.js')).Schema;
var MongooseSchema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');

var Project = new MongooseSchema({
  pod_id: {
    type: MongooseSchema.ObjectId,
    ref: 'Pod',
    required: true
  },
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
    required: true
  },
  cpu: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: commonValidators.isInteger,
      message: '{PATH} is not valid, {VALUE} is not an integer'
    }
  },
  memory_mb: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: commonValidators.isInteger,
      message: '{PATH} is not valid, {VALUE} is not an integer'
    }
  },
  cinder_gb: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: commonValidators.isInteger,
      message: '{PATH} is not valid, {VALUE} is not an integer'
    }
  }
}, { strict: 'throw' });

Project.index({ name: 1, pod_id: 1 }, { unique: true });
Project.plugin(uniqueValidator, { message: 'You cannot have the same project name twice in the same pod' });

Project.pre('save', async function (next) {
  try {
    var project = this;
    var pod = await Pod.findOne({ _id: project.pod_id }).select('_id').lean().exec();
    if (!pod) {
      return await Promise.reject(new Error('The given pod id ' + project.pod_id + ' could not be found'));
    }
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

module.exports.Schema = mongoose.model('Project', Project);
