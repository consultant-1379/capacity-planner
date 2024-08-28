'use strict';

var path = require('path');
var commonValidators = require(path.resolve('./modules/core/server/controllers/validators.server.controller'));
var mongoose = require('mongoose');
var MongooseSchema = mongoose.Schema;

var Pod = new MongooseSchema({
  name: {
    type: 'string',
    trim: true,
    required: true,
    unique: true,
    minlength: 5,
    maxlength: 20
  },
  authUrl: {
    type: 'string',
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /^(https?:\/\/)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*)(.*)$/.test(v);
      },
      message: '{VALUE} is not correct. The authUrl must be a valid url.'
    }
  },
  project: {
    type: 'string',
    required: true
  },
  username: {
    type: 'string',
    required: true
  },
  password: {
    type: 'string',
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
  },
  cpu_contention_ratio: {
    type: Number,
    required: true,
    min: 0.01
  }
}, { strict: 'throw' });

module.exports.Schema = mongoose.model('Pod', Pod);
