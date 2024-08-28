(function () {
  'use strict';

  describe('Users Route Tests', function () {
    // Initialize global variables
    var $scope,
      Authentication,
      $httpBackend;

    // We can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($rootScope, _Authentication_) {
      // Set a new global scope
      $scope = $rootScope.$new();
      Authentication = _Authentication_;
    }));

    describe('Authentication Route Config', function () {
      describe('Main Route', function () {
        var mainstate;
        beforeEach(inject(function ($state) {
          mainstate = $state.get('authentication');
        }));

        it('Should have the correct URL', function () {
          expect(mainstate.url).toEqual('/authentication');
        });

        it('Should be abstract', function () {
          expect(mainstate.abstract).toBe(true);
        });

        it('Should have templateUrl', function () {
          expect(mainstate.templateUrl).toBe('/modules/users/client/views/authentication/authentication.client.view.html');
        });
      });

      describe('Signin Route', function () {
        var signinstate;
        beforeEach(inject(function ($state) {
          signinstate = $state.get('authentication.signin');
        }));

        it('Should have the correct URL', function () {
          expect(signinstate.url).toEqual('/signin?err');
        });

        it('Should not be abstract', function () {
          expect(signinstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(signinstate.templateUrl).toBe('/modules/users/client/views/authentication/signin.client.view.html');
        });
      });
    });
  });
}());
