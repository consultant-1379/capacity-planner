'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  mongoose = require('mongoose'),
  passport = require('passport'),
  User = mongoose.model('User');

// URLs for which user can't be redirected on signin
var noReturnUrls = [
  '/authentication/signin'
];

exports.determineStrategyNames = async function () {
  var strategyNames = [];
  var baseDNArray = process.env.BASE_DN_LIST.split(':');
  for (var i = 0; i < baseDNArray.length; i += 1) {
    strategyNames.push('ldap' + i);
  }
  return strategyNames;
};

exports.signin = async function (req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var invalidUsernameOrPasswordError = {
    message: errorHandler.getErrorMessage('Invalid username or password')
  };
  var ldapCalls = [];
  var returnedUsers = [];

  async function getUsersFromStrategies() {
    var strategyNames = await exports.determineStrategyNames();
    for (var i = 0; i < strategyNames.length; i += 1) {
      ldapCalls.push(getUserFromPassportStrategy(strategyNames[i]));
    }
    var unfilteredUsers = await Promise.all(ldapCalls);
    return unfilteredUsers.filter(user => user !== undefined);
  }

  function getUserFromPassportStrategy(strategyName) {
    return new Promise((resolve, reject) => {
      passport.authenticate(strategyName, function (err, ldapUser) {
        if (ldapUser) {
          resolve(ldapUser);
        }
        resolve();
      })(req, res);
    });
  }

  var ditUser = await User.findOne({ username: username });
  if (ditUser && ditUser.authenticate(password)) {
    req.login(ditUser, function (err) {
      if (err) {
        return res.status(400).send(err);
      }
      return res.json(ditUser);
    });
  } else {
    returnedUsers = await getUsersFromStrategies();
    if (returnedUsers.length === 0) {
      return res.status(422).send(invalidUsernameOrPasswordError);
    }

    for (var ldapUser in returnedUsers) {
      if (!ditUser) {
        ditUser = new User();
        ditUser.displayName = returnedUsers[ldapUser].displayName;
        ditUser.firstName = returnedUsers[ldapUser].givenName;
        ditUser.lastName = returnedUsers[ldapUser].sn;
        ditUser.username = returnedUsers[ldapUser].cn;
        ditUser.email = returnedUsers[ldapUser].mail;
        ditUser.password = password;
      } else if (!ditUser.authenticate(password)) {
        ditUser.password = password;
      }
    }

    await ditUser.save();

    req.login(ditUser, function (err) {
      if (err) {
        return res.status(400).send(err);
      }
      ditUser.password = undefined;
      ditUser.salt = undefined;
      return res.json(ditUser);
    });
  }
};

exports.signout = function (req, res) {
  req.logout();
  res.redirect('/');
};

/**
 * OAuth provider call
 */
exports.oauthCall = function (strategy, scope) {
  return function (req, res, next) {
    if (req.query && req.query.redirect_to) { req.session.redirect_to = req.query.redirect_to; }

    // Authenticate
    passport.authenticate(strategy, scope)(req, res, next);
  };
};

/**
 * OAuth callback
 */
exports.oauthCallback = function (strategy) {
  return function (req, res, next) {
    // info.redirect_to contains inteded redirect path
    passport.authenticate(strategy, function (err, user, info) {
      if (err) {
        return res.redirect('/authentication/signin?err=' + encodeURIComponent(errorHandler.getErrorMessage(err)));
      }
      if (!user) {
        return res.redirect('/authentication/signin');
      }
      req.login(user, function (err) {
        if (err) {
          return res.redirect('/authentication/signin');
        }

        return res.redirect(info.redirect_to || '/');
      });
    })(req, res, next);
  };
};

/**
 * Helper function to save or update a OAuth user profile
 */
exports.saveOAuthUserProfile = function (req, providerUserProfile, done) {
  // Setup info object
  var info = {};

  // Set redirection path on session.
  // Do not redirect to a signin or signup page
  if (noReturnUrls.indexOf(req.session.redirect_to) === -1) { info.redirect_to = req.session.redirect_to; }

  if (!req.user) {
    // Define a search query fields
    var searchMainProviderIdentifierField = 'providerData.' + providerUserProfile.providerIdentifierField;
    var searchAdditionalProviderIdentifierField = 'additionalProvidersData.'
    + providerUserProfile.provider + '.' + providerUserProfile.providerIdentifierField;

    // Define main provider search query
    var mainProviderSearchQuery = {};
    mainProviderSearchQuery.provider = providerUserProfile.provider;
    mainProviderSearchQuery[searchMainProviderIdentifierField] =
    providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

    // Define additional provider search query
    var additionalProviderSearchQuery = {};
    additionalProviderSearchQuery[searchAdditionalProviderIdentifierField] =
    providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

    // Define a search query to find existing user with current provider profile
    var searchQuery = {
      $or: [mainProviderSearchQuery, additionalProviderSearchQuery]
    };

    User.findOne(searchQuery, function (err, user) {
      if (err) {
        return done(err);
      } else if (!user) {
        var possibleUsername = providerUserProfile.username || ((providerUserProfile.email) ? providerUserProfile.email.split('@')[0] : '');

        User.findUniqueUsername(possibleUsername, null, function (availableUsername) {
          user = new User({
            firstName: providerUserProfile.firstName,
            lastName: providerUserProfile.lastName,
            username: availableUsername,
            displayName: providerUserProfile.displayName,
            provider: providerUserProfile.provider,
            providerData: providerUserProfile.providerData
          });

          // Email intentionally added later to allow defaults (sparse settings) to be applid.
          // Handles case where no email is supplied.
          // See comment: https://github.com/meanjs/mean/pull/1495#issuecomment-246090193
          user.email = providerUserProfile.email;

          // And save the user
          user.save(function (err) {
            return done(err, user, info);
          });
        });
      } else {
        return done(err, user, info);
      }
    });
  } else {
    // User is already logged in, join the provider data to the existing user
    var user = req.user;

    // Check if user exists, is not signed in using this provider, and doesn't have that provider data already configured
    if (user.provider !== providerUserProfile.provider &&
      (!user.additionalProvidersData || !user.additionalProvidersData[providerUserProfile.provider])) {
      // Add the provider data to the additional provider data field
      if (!user.additionalProvidersData) {
        user.additionalProvidersData = {};
      }

      user.additionalProvidersData[providerUserProfile.provider] = providerUserProfile.providerData;

      // Then tell mongoose that we've updated the additionalProvidersData field
      user.markModified('additionalProvidersData');

      // And save the user
      user.save(function (err) {
        return done(err, user, info);
      });
    } else {
      return done(new Error('User is already connected using this provider'), user);
    }
  }
};
