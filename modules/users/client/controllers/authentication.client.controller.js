(function () {
  'use strict';

  angular
    .module('users')
    .controller('AuthenticationController', AuthenticationController);

  AuthenticationController.$inject = ['$scope', '$state', 'UsersService',
    '$location', '$window', 'Authentication', 'Notification'];

  function AuthenticationController($scope, $state, UsersService, $location, $window, Authentication, Notification) {
    var vm = this;

    vm.authentication = Authentication;
    vm.signin = signin;

    // If user is signed in then redirect back home
    if (vm.authentication.user) {
      $location.path('/');
    }

    function signin(isValid) {
      UsersService.userSignin(vm.credentials)
        .then(onUserSigninSuccess)
        .catch(onUserSigninError);
    }

    // Authentication Callbacks
    function onUserSigninSuccess(response) {
      // If successful we assign the response to the global user model
      vm.authentication.user = response;
      Notification.info({ message: 'Welcome ' + response.firstName });
      // And redirect to the previous or home page
      if ($state.previous) {
        $state.go($state.previous.state.name || 'home', $state.previous.params);
      } else {
        $state.go('home');
      }
    }

    function onUserSigninError(response) {
      Notification.error({
        message: response.data.message,
        title: '<i class="glyphicon glyphicon-remove"></i> Signin Error!',
        delay: 6000
      });
    }
  }
}());
