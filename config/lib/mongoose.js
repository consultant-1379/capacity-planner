'use strict';

/**
 * Module dependencies.
 */
var config = require('../config'),
  chalk = require('chalk'),
  path = require('path'),
  logger = require('./logger'),
  mongoose = require('mongoose');

// Load the mongoose models
module.exports.loadModels = function (callback) {
  // Globbing model files
  config.files.server.models.forEach(function (modelPath) {
    require(path.resolve(modelPath)); // eslint-disable-line global-require
  });

  if (callback) callback();
};

// Initialize Mongoose
module.exports.connect = function (cb) {
  mongoose.Promise = config.db.promise;

  mongoose.connect(config.db.uri, config.db.options, function (err, db) {
    // Log Error
    if (err) {
      logger.error(chalk.red('Could not connect to MongoDB!'));
      logger.error(err);
    } else {
      // Enabling mongoose debug mode if required
      mongoose.set('debug', config.db.debug);
      // Call callback FN
      if (cb) cb(db);
    }
  });
};

module.exports.disconnect = function (cb) {
  mongoose.disconnect(function (err) {
    logger.info(chalk.yellow('Disconnected from MongoDB.'));
    cb(err);
  });
};
