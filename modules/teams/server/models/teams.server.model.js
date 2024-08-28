'use strict';

var mongoose = require('mongoose');
var MongooseSchema = mongoose.Schema;

var Team = new MongooseSchema({
  name: {
    type: 'string',
    trim: true,
    required: true,
    unique: true,
    maxlength: 50
  }
}, { strict: 'throw' });

module.exports.Schema = mongoose.model('Team', Team);
