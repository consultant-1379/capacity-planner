'use strict';

var path = require('path');
var commonValidators = require(path.resolve('./modules/core/server/controllers/validators.server.controller'));
var mongoose = require('mongoose');
var MongooseSchema = mongoose.Schema;

var DeploymentType = new MongooseSchema({
  name: {
    type: 'string',
    trim: true,
    required: true,
    unique: true,
    maxlength: 50
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
  },
  cinder_iops: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: commonValidators.isInteger,
      message: '{PATH} is not valid, {VALUE} is not an integer'
    }
  },
  enfs_gb: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: commonValidators.isInteger,
      message: '{PATH} is not valid, {VALUE} is not an integer'
    }
  },
  enfs_iops: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: commonValidators.isInteger,
      message: '{PATH} is not valid, {VALUE} is not an integer'
    }
  }
}, { strict: 'throw' });

module.exports.Schema = mongoose.model('DeploymentType', DeploymentType);
