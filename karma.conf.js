'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  config = require('./config/config'),
  testAssets = require('./config/assets/test'),
  testConfig = require('./config/env/test'),
  karmaReporters = ['mocha'];

// Karma configuration
module.exports = function (karmaConfig) {
  karmaConfig.set({
    frameworks: ['jasmine'],

    preprocessors: {
      'modules/*/client/views/**/*.html': ['ng-html2js']
    },

    ngHtml2JsPreprocessor: {
      moduleName: 'mean',

      cacheIdFromPath: function (filepath) {
        return filepath;
      }
    },

    // List of files / patterns to load in the browser
    files: _.union(
      config.assets.client.lib.js, config.assets.client.lib.tests,
      config.assets.client.js, testAssets.tests.client, config.assets.client.views
    ),

    // Test results reporter to use
    // Possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: karmaReporters,

    // Web server port
    port: 9876,

    // Enable / disable colors in the output (reporters and logs)
    colors: true,

    // Level of logging
    // Possible values: karmaConfig.LOG_DISABLE || karmaConfig.LOG_ERROR ||
    // karmaConfig.LOG_WARN || karmaConfig.LOG_INFO || karmaConfig.LOG_DEBUG
    logLevel: karmaConfig.LOG_INFO,

    // Enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['ChromeNoSandbox'],

    customLaunchers: {
      ChromeNoSandbox: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,

    // Continuous Integration mode
    // If true, it capture browsers, run tests and exit
    singleRun: true
  });
};
