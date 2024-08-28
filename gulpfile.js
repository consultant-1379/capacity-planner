'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  fs = require('fs'),
  defaultAssets = require('./config/assets/default'),
  testAssets = require('./config/assets/test'),
  mongoose = require('./config/lib/mongoose.js'),
  glob = require('glob'),
  gulp = require('gulp'),
  pump = require('pump'),
  gulpLoadPlugins = require('gulp-load-plugins'),
  plugins = gulpLoadPlugins({
    rename: {
      'gulp-angular-templatecache': 'templateCache',
      'gulp-clean-css': 'cleanCSS'
    }
  }),
  wiredep = require('wiredep').stream,
  path = require('path'),
  endOfLine = require('os').EOL,
  protractor = require('gulp-protractor').protractor,
  jsonMerger = require('gulp-merge-json'),
  webdriverUpdate = require('gulp-protractor').webdriver_update,
  webdriverStandalone = require('gulp-protractor').webdriver_standalone,
  del = require('del'),
  KarmaServer = require('karma').Server,
  logger = require(path.resolve('./config/lib/logger'));

// Local settings
var changedTestFiles = [];

// Set NODE_ENV to 'test'
gulp.task('env:test', function (done) {
  process.env.NODE_ENV = 'test';
  done();
});

// Set NODE_ENV to 'development'
gulp.task('env:dev', function (done) {
  process.env.NODE_ENV = 'development';
  done();
});

// Set NODE_ENV to 'production'
gulp.task('env:prod', function (done) {
  process.env.NODE_ENV = 'production';
  done();
});

// Nodemon task
gulp.task('nodemon', function () {
  return plugins.nodemon({
    script: 'server.js',
    nodeArgs: ['--inspect'],
    ext: 'js,html',
    verbose: true,
    watch: _.union(defaultAssets.server.views, defaultAssets.server.allJS, defaultAssets.server.config)
  });
});

// Nodemon task without verbosity or debugging
gulp.task('nodemon-nodebug', function () {
  return plugins.nodemon({
    script: 'server.js',
    ext: 'js,html',
    watch: _.union(defaultAssets.server.views, defaultAssets.server.allJS, defaultAssets.server.config)
  });
});

// Watch Files For Changes
gulp.task('watch', function () {
  // Start livereload
  plugins.refresh.listen();

  // Add watch rules
  gulp.watch(defaultAssets.server.swagger).on('change', function () {
    gulp.series('buildSwaggerJSON');
  });
  gulp.watch(defaultAssets.server.views).on('change', plugins.refresh.changed);
  gulp.watch(defaultAssets.server.allJS).on('change', plugins.refresh.changed);
  gulp.watch(defaultAssets.client.js).on('change', plugins.refresh.changed);
  gulp.watch(defaultAssets.client.css).on('change', plugins.refresh.changed);

  if (process.env.NODE_ENV === 'production') {
    gulp.watch(defaultAssets.server.gulpConfig, ['templatecache']);
    gulp.watch(defaultAssets.client.views, ['templatecache']).on('change', plugins.refresh.changed);
  } else {
    gulp.watch(defaultAssets.client.views).on('change', plugins.refresh.changed);
  }
});

// Watch server test files
gulp.task('watch:server:run-tests', function () {
  // Start livereload
  plugins.refresh.listen();

  // Add Server Test file rules
  gulp.watch([testAssets.tests.server, defaultAssets.server.allJS], ['test:server']).on('change', function (file) {
    changedTestFiles = [];

    // iterate through server test glob patterns
    _.forEach(testAssets.tests.server, function (pattern) {
      // determine if the changed (watched) file is a server test
      _.forEach(glob.sync(pattern), function (f) {
        var filePath = path.resolve(f);

        if (filePath === path.resolve(file.path)) {
          changedTestFiles.push(f);
        }
      });
    });

    plugins.refresh.changed();
  });
});

// CSS linting task
gulp.task('csslint', function () {
  return gulp.src(defaultAssets.client.css)
    .pipe(plugins.csslint('.csslintrc'))
    .pipe(plugins.csslint.formatter())
    .pipe(plugins.csslint.failFormatter());
});

// ESLint JS linting task
gulp.task('eslint', function (callback) {
  var assets = _.union(
    defaultAssets.server.gulpConfig,
    defaultAssets.server.allJS,
    defaultAssets.client.js,
    testAssets.tests.server,
    testAssets.tests.client,
    testAssets.tests.e2e
  );
  return gulp.src(assets)
    .pipe(plugins.eslint())
    .pipe(plugins.eslint.format())
    .pipe(plugins.eslint.failAfterError());
});

// HTML linting task
// CSS linting task
gulp.task('htmlhint', function () {
  var assets = _.union(
    defaultAssets.client.views,
    defaultAssets.server.views
  );
  return gulp.src(assets)
    .pipe(plugins.htmlhint('.htmlhintrc'))
    .pipe(plugins.htmlhint.failReporter());
});
// JS minifying task
gulp.task('uglify', function (callback) {
  var assets = _.union(
    defaultAssets.client.js,
    defaultAssets.client.templates
  );
  del(['public/dist/*']);
  pump([
    gulp.src(assets),
    plugins.uglifyEs.default({
      mangle: false
    }),
    plugins.concat('application.min.js'),
    plugins.rev(),
    gulp.dest('public/dist')
  ], callback);
});

// CSS minifying task
gulp.task('cssmin', function () {
  return gulp.src(defaultAssets.client.css)
    .pipe(plugins.cleanCSS())
    .pipe(plugins.concat('application.min.css'))
    .pipe(plugins.rev())
    .pipe(gulp.dest('public/dist'));
});

// Swagger concatenation task
gulp.task('buildSwaggerJSON', function () {
  return gulp.src(defaultAssets.server.swagger)
    .pipe(jsonMerger({
      fileName: 'swagger.json',
      concatArrays: true
    }))
    .pipe(gulp.dest('./'));
});

// wiredep task to production
gulp.task('wiredep', function () {
  return gulp.src(['config/assets/development.js', 'config/assets/production.js'])
    .pipe(wiredep({
      ignorePath: '../../',
      fileTypes: {
        js: {
          replace: {
            css: function (filePath) {
              var minFilePath = filePath.replace('.css', '.min.css');
              var fullPath = path.join(process.cwd(), minFilePath);
              if (!fs.existsSync(fullPath)) {
                return '\'' + filePath + '\',';
              }
              return '\'' + minFilePath + '\',';
            },
            js: function (filePath) {
              var minFilePath = filePath.replace('.js', '.min.js');
              var fullPath = path.join(process.cwd(), minFilePath);
              if (!fs.existsSync(fullPath)) {
                return '\'' + filePath + '\',';
              }
              return '\'' + minFilePath + '\',';
            }
          }
        }
      }
    }))
    .pipe(gulp.dest('config/assets/'));
});

// Angular template cache task
gulp.task('templatecache', function () {
  return gulp.src(defaultAssets.client.views)
    .pipe(plugins.templateCache('templates.js', {
      root: 'modules/',
      module: 'core',
      templateHeader: '(function () {' + endOfLine + '  \'use strict\';' + endOfLine + endOfLine + '  angular' + endOfLine +
        '    .module(\'<%= module %>\'<%= standalone %>)' + endOfLine + '    .run(templates);' + endOfLine + endOfLine +
        '  templates.$inject = [\'$templateCache\'];' + endOfLine + endOfLine + '  function templates($templateCache) {' + endOfLine,
      templateBody: '    $templateCache.put(\'<%= url %>\', \'<%= contents %>\');',
      templateFooter: '  }' + endOfLine + '})();' + endOfLine
    }))
    .pipe(gulp.dest('build'));
});

// Mocha tests task
gulp.task('mocha', function (done) {
  // Open mongoose connections
  var testSuites = changedTestFiles.length ? changedTestFiles : testAssets.tests.server;
  var error;

  // Connect mongoose
  mongoose.connect(function () {
    mongoose.loadModels();
    // Run the tests
    gulp.src(testSuites)
      .pipe(plugins.mocha({
        reporter: 'spec',
        timeout: 10000
      }))
      .on('error', function (err) {
        // If an error occurs, save it
        error = err;
        logger.error(err);
        process.exit(1);
      })
      .on('end', function () {
        // When the tests are done, disconnect mongoose and pass the error state back to gulp
        mongoose.disconnect(function () {
          done(error);
          process.exit(0);
        });
      });
  });
});

// Prepare istanbul coverage test
gulp.task('pre-test', function () {
  // Display coverage for all server JavaScript files
  return gulp.src(defaultAssets.server.allJS)
    // Covering files
    .pipe(plugins.istanbul())
    // Force `require` to return covered files
    .pipe(plugins.istanbul.hookRequire());
});

// Run istanbul test and write report
gulp.task('mocha:coverage', gulp.parallel('pre-test', 'mocha'), function () {
  var testSuites = changedTestFiles.length ? changedTestFiles : testAssets.tests.server;

  return gulp.src(testSuites)
    .pipe(plugins.istanbul.writeReports({
      reportOpts: { dir: './coverage/server' }
    }));
});

// Karma test runner task
gulp.task('karma', function (done) {
  new KarmaServer({
    configFile: path.join(__dirname, '/karma.conf.js')
  }, done).start();
});

// Run karma with coverage options set and write report
gulp.task('karma:coverage', function (done) {
  new KarmaServer({
    configFile: path.join(__dirname, '/karma.conf.js'),
    preprocessors: {
      'modules/*/client/views/**/*.html': ['ng-html2js'],
      'modules/core/client/app/config.js': ['coverage'],
      'modules/core/client/app/init.js': ['coverage'],
      'modules/*/client/*.js': ['coverage'],
      'modules/*/client/config/*.js': ['coverage'],
      'modules/*/client/controllers/*.js': ['coverage'],
      'modules/*/client/directives/*.js': ['coverage'],
      'modules/*/client/services/*.js': ['coverage']
    },
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      dir: 'coverage/client',
      reporters: [
        { type: 'lcov', subdir: '.' }
        // printing summary to console currently weirdly causes gulp to hang so disabled for now
        // https://github.com/karma-runner/karma-coverage/issues/209
        // { type: 'text-summary' }
      ]
    }
  }, done).start();
});

// Drops the MongoDB database, used in e2e testing
gulp.task('dropdb', function (done) {
  // Use mongoose configuration

  mongoose.connect(function (db) {
    db.db.dropDatabase(function (err) {
      if (err) {
        logger.error(err);
      } else {
        logger.info('Successfully dropped db: ', db.db.databaseName);
      }
      db.db.close(done);
    });
  });
});

// Downloads the selenium webdriver
gulp.task('webdriver_update', webdriverUpdate);

// Start the standalone selenium server
// NOTE: This is not needed if you reference the
// seleniumServerJar in your protractor.conf.js
gulp.task('webdriver_standalone', webdriverStandalone);

// Protractor test runner task
gulp.task('protractor', gulp.series('webdriver_update'), function () {
  gulp.src([])
    .pipe(protractor({
      configFile: 'protractor.conf.js'
    }))
    .on('end', function () {
      logger.info('E2E Testing complete');
      // exit with success.
      process.exit(0);
    })
    .on('error', function (err) {
      logger.error('E2E Tests failed:');
      logger.error(err);
      process.exit(1);
    });
});

// Lint CSS and JavaScript files.
gulp.task('lint', gulp.series('eslint', 'htmlhint', 'csslint'));

// Lint project files and minify them into two production files.
gulp.task('build', gulp.series('wiredep', 'lint', gulp.parallel('uglify', 'cssmin')));

// Run the project tests
gulp.task('test:server', gulp.series('env:test', 'dropdb', 'mocha'));

gulp.task('test', gulp.series('env:test', 'test:server', 'karma', 'nodemon', 'protractor'));

// Watch all server files for changes & run server tests (test:server) task on changes
gulp.task('test:server:watch', gulp.series('test:server', 'watch:server:run-tests'));

gulp.task('test:client', gulp.series('env:test', 'dropdb', 'karma'));

gulp.task('test:e2e', gulp.series('env:test', 'lint', 'dropdb', 'nodemon', 'protractor'));

gulp.task('test:coverage', gulp.series('env:test', 'dropdb', 'lint', 'mocha:coverage', 'karma:coverage'));

// Run the project in debug mode
gulp.task('debug', gulp.series('env:dev', 'lint', gulp.parallel('nodemon-nodebug', 'watch')));

// Run the project in development mode
gulp.task('default', gulp.series('env:dev', 'wiredep', gulp.parallel('nodemon', 'watch'), 'buildSwaggerJSON'));

// Run the project in production mode
gulp.task('build:prod', gulp.series('env:prod', 'templatecache', 'wiredep', gulp.parallel('uglify', 'cssmin')));
