(function () {
  'use strict';

  angular
    .module('teams')
    .controller('TeamsListController', TeamsListController);

  TeamsListController.$inject = ['$window', 'Notification', 'teams'];

  function TeamsListController($window, Notification, teams) {
    var vm = this;
    vm.teams = teams;
    vm.remove = remove;

    function remove(team) {
      if ($window.confirm('Are you sure you want to delete this team?')) {
        team.$delete()
          .then(successCallback)
          .catch(errorCallback);
      }

      function successCallback() {
        vm.teams.splice(vm.teams.indexOf(team), 1);
        Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Team "' + team.name + '" deleted successfully!' });
      }

      function errorCallback(res) {
        Notification.error({
          message: res.data.message,
          title: '<i class="glyphicon glyphicon-remove"></i> Team "' + team.name + '" deletion failed!!'
        });
      }
    }
  }
}());
