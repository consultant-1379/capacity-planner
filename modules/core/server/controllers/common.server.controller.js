'use strict';

var path = require('path'),
  mongoose = require('mongoose'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));
var _ = require('lodash');
var querystring = require('querystring');
var mongoMask = require('mongo-mask');

function toLowerCase(input) {
  return input.toLowerCase();
}

module.exports = function (modelName, dependentModelsDetails, sortOrder) {
  var module = {};
  var modelNameLowercase = modelName.toLowerCase();
  var modelNameLowercaseWithSpaces = modelName.match(/[A-Z][a-z]+/g).map(toLowerCase).join(' ');
  var Model = mongoose.model(modelName);

  module.create = async function (req, res) {
    try {
      var modelInstance = new Model(req.body);
      var modelInstanceReturned = await modelInstance.save();
      res.location('/api/' + modelNameLowercase + 's/' + modelInstance._id).status(201).json(modelInstance);
    } catch (err) {
      var statusCode;
      if (err.name === 'ValidationError' || err.name === 'StrictModeError') {
        statusCode = 400;
      } else {
        statusCode = 422;
      }
      return res.status(statusCode).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
  };

  module.delete = async function (req, res) {
    var modelInstance = req[modelNameLowercase];
    var dependentInstancesPromises = [];
    var dependentModelNames = [];

    try {
      for (var i = 0; i < dependentModelsDetails.length; i += 1) {
        var dependentModelDetails = dependentModelsDetails[i];
        var dependentModelKey = dependentModelDetails.modelKey;
        var dependentModelName = dependentModelDetails.modelName;
        dependentModelNames.push(dependentModelName.toLowerCase());
        var DependentModel = mongoose.model(dependentModelName);
        var findObject = {};
        findObject[dependentModelKey] = modelInstance._id;
        dependentInstancesPromises.push(DependentModel.find(findObject).exec());
      }
      var dependentInstances = await Promise.all(dependentInstancesPromises);
      for (var x = 0; x < dependentInstances.length; x += 1) {
        if (dependentInstances[x].length > 0) {
          var plural;
          if (dependentInstances[x].length === 1) {
            plural = '';
          } else {
            plural = 's';
          }
          return res.status(422).send({
            message: 'Can\'t delete ' + modelNameLowercaseWithSpaces + ', it has ' +
            dependentInstances[x].length + ' dependent ' + dependentModelNames[x] + plural
          });
        }
      }
      await modelInstance.remove();
      res.json(modelInstance);
    } catch (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
  };

  function isValidSearch(query) {
    for (var key in query) {
      if (key !== 'fields' && key !== 'q') {
        return false;
      } else if (!query[key]) {
        return false;
      }
    }
    return true;
  }

  module.list = function (req, res) {
    var query;
    if (!isValidSearch(req.query)) {
      return res.status(422).send({
        message: 'Improperly structured query. Make sure to use ?q=<key>=<value> syntax'
      });
    }

    if (req.query.q) {
      query = querystring.parse(req.query.q);
    }

    var fields;
    if (req.query.fields) {
      fields = mongoMask(req.query.fields, {});
    } else {
      fields = null;
    }

    Model.find(query).select(fields).sort(sortOrder).exec(function (err, modelInstances) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.json(modelInstances);
    });
  };

  module.read = function (req, res) {
    // convert mongoose modelInstance to JSON
    var modelInstance = req[modelNameLowercase] ? req[modelNameLowercase].toJSON() : {};
    res.json(modelInstance);
  };

  module.findAdditionalKeys = function (ModelType, document, updates) {
    var temp = new ModelType(_.extend({}, document, updates));
  };

  module.update = async function (req, res) {
    try {
      module.findAdditionalKeys(Model, req[modelNameLowercase]._doc, req.body, res);
      var modelInstance = _.extend(req[modelNameLowercase], req.body);
      var modelInstanceReturned = await modelInstance.save();
      return res.json(modelInstance);
    } catch (err) {
      var statusCode;
      if (err.name === 'ValidationError' || err.name === 'StrictModeError') {
        statusCode = 400;
      } else {
        statusCode = 422;
      }
      return res.status(statusCode).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
  };

  module.findById = function (req, res, next, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).send({
        message: 'A ' + modelNameLowercaseWithSpaces + ' with that id does not exist'
      });
    }
    var fields;
    if (req.query.fields) {
      fields = mongoMask(req.query.fields, {});
    } else {
      fields = null;
    }
    Model.findById(id).select(fields).exec(function (err, modelInstance) {
      if (err) {
        return next(err);
      } else if (!modelInstance) {
        return res.status(404).send({
          message: 'A ' + modelNameLowercaseWithSpaces + ' with that id does not exist'
        });
      }
      req[modelNameLowercase] = modelInstance;
      return next();
    });
  };
  return module;
};
