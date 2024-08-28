(function () {
  'use strict';

  angular
    .module('teams')
    .controller('TeamsCreateController', TeamsCreateController);

  TeamsCreateController.$inject = ['$scope', '$state', 'team', 'creatingFromScratch', 'Notification',
    'ProjectsService', '$window'];

  function TeamsCreateController(
    $scope, $state, team, creatingFromScratch, Notification,
    ProjectsService, $window
  ) {
    var vm = this;
    vm.team = team;
    vm.urlregex = '^(https?://)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*)(.*)$';
    if (creatingFromScratch) {
      vm.pageTitle = 'Creating team';
    } else {
      vm.pageTitle = 'Editing team';
    }

    vm.submitForm = async function () {
      var teamStatus = (creatingFromScratch ? 'creation' : 'update');
      try {
        vm.formSubmitting = true;
        await vm.team.createOrUpdate();
      } catch (err) {
        vm.formSubmitting = false;
        Notification.error({ message: err.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Team ' + teamStatus + ' error!' });
        return;
      }
      $state.go('teams.list');
      Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Team ' + teamStatus + ' successful!' });
    };
  }
}());
