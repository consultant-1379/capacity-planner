'use strict';

/**
 * Module dependencies
 */
var passport = require('passport'),
  LdapStrategy = require('passport-ldapauth'),
  User = require('mongoose').model('User'),
  path = require('path'),
  config = require(path.resolve('./config/config')),
  baseDNArray;

/**
 * Module init function
 */
module.exports = function (app) {
  // Serialize sessions
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  // Deserialize sessions
  passport.deserializeUser(function (id, done) {
    User.findOne({
      _id: id
    }, '-salt -password', function (err, user) {
      done(err, user);
    });
  });

  var loginSuccess = function (user, done) {
    return done(null, user);
  };

  var getLDAPConfiguration = function (req, callback) {
    var baseDn = baseDNArray.pop();
    process.nextTick(function () {
      var opts = {
        server: {
          url: process.env.LDAP_URL,
          bindDn: 'cn=' + req.body.username + ',' + baseDn,
          bindCredentials: req.body.password,
          searchBase: baseDn,
          searchFilter: process.env.SEARCH_FILTER
        }
      };
      callback(null, opts);
    });
  };

  // Create Ldap strategies from baseDN list.
  var baseDNList = process.env.BASE_DN_LIST;
  if (baseDNList) {
    baseDNArray = baseDNList.split(':');
    for (var i = 0; i < baseDNArray.length; i += 1) {
      passport.use('ldap' + i, new LdapStrategy(getLDAPConfiguration, loginSuccess));
    }
  }

  // Add passport's middleware
  app.use(passport.initialize());
  app.use(passport.session());
};
