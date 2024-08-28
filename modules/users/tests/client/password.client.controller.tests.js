'use strict';

(function () {
  // Password controller Spec
  describe('PasswordController', function () {
    // Initialize global variables
    var PasswordController,
      scope,
      $httpBackend,
      $stateParams,
      $location,
      $window,
      Notification;

    beforeEach(function () {
      jasmine.addMatchers({
        toEqualData: function (util, customEqualityTesters) {
          return {
            compare: function (actual, expected) {
              return {
                pass: angular.equals(actual, expected)
              };
            }
          };
        }
      });
    });

    // Load the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    describe('Logged in user', function () {
      beforeEach(inject(function (
        $controller, $rootScope, _UsersService_,
        _Authentication_, _$stateParams_, _$httpBackend_, _$location_
      ) {
        // Set a new global scope
        scope = $rootScope.$new();

        // Point global variables to injected services
        $stateParams = _$stateParams_;
        $httpBackend = _$httpBackend_;
        $location = _$location_;
        $location.path = jasmine.createSpy().and.returnValue(true);

        // Ignore parent template gets on state transition
        $httpBackend.whenGET('/modules/core/client/views/404.client.view.html').respond(200);

        // Mock logged in user
        _Authentication_.user = {
          username: 'test',
          roles: ['user']
        };

        // Initialize the Authentication controller
        PasswordController = $controller('PasswordController as vm', {
          $scope: scope
        });
      }));

      it('should redirect logged in user to home', function () {
        expect($location.path).toHaveBeenCalledWith('/');
      });
    });

    describe('Logged out user', function () {
      beforeEach(inject(function (
        $controller, $rootScope, _$window_,
        _$stateParams_, _$httpBackend_, _$location_, _Notification_
      ) {
        // Set a new global scope
        scope = $rootScope.$new();

        // Point global variables to injected services
        $stateParams = _$stateParams_;
        $httpBackend = _$httpBackend_;
        $location = _$location_;
        $location.path = jasmine.createSpy().and.returnValue(true);
        $window = _$window_;
        $window.user = null;
        Notification = _Notification_;

        spyOn(Notification, 'error');
        spyOn(Notification, 'success');

        // Ignore parent template gets on state transition
        $httpBackend.whenGET('/modules/core/client/views/404.client.view.html').respond(200);
        $httpBackend.whenGET('/modules/core/client/views/400.client.view.html').respond(200);

        // Initialize the Authentication controller
        PasswordController = $controller('PasswordController as vm', {
          $scope: scope
        });
      }));

      it('should not redirect to home', function () {
        expect($location.path).not.toHaveBeenCalledWith('/');
      });
    });
  });
}());
