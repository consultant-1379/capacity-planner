'use strict';

/* eslint comma-dangle:[0, "only-multiline"] */
module.exports = {
  client: {
    lib: {
      css: [
        // bower:css
        'public/lib/angular-ui-notification/dist/angular-ui-notification.min.css',
        // endbower
      ],
      js: [
        // Manually adding this until we can bring in ajv
        // via bower. Currently they dont support bower
        'public/lib/ajv.min.js',
        // bower:js
        'public/lib/angular/angular.min.js',
        'public/lib/angular-animate/angular-animate.min.js',
        'public/lib/angular-bootstrap/ui-bootstrap-tpls.min.js',
        'public/lib/angular-messages/angular-messages.min.js',
        'public/lib/angular-mocks/angular-mocks.js',
        'public/lib/angular-resource/angular-resource.min.js',
        'public/lib/angular-ui-notification/dist/angular-ui-notification.min.js',
        'public/lib/angular-ui-router/release/angular-ui-router.min.js',
        'public/lib/file-saver/FileSaver.min.js',
        'public/lib/lodash/lodash.js',
        'public/lib/semver/semver.browser.js',
        // endbower
      ]
    }
  }
};
