(function () {
  'use strict';

  angular
    .module('users')
    .controller('PasswordController', PasswordController);

  PasswordController.$inject = ['$scope', '$stateParams', 'UsersService',
    '$location', 'Authentication', 'Notification'];

  function PasswordController($scope, $stateParams, UsersService, $location, Authentication, Notification) {
    var vm = this;
    vm.authentication = Authentication;

    // If user is signed in then redirect back home
    if (vm.authentication.user) {
      $location.path('/');
    }
  }
}());
