(function () {
  'use strict';

  angular
    .module('backlogprojects')
    .controller('BacklogProjectsCreateController', BacklogProjectsCreateController);

  BacklogProjectsCreateController.$inject = ['$state', 'backlogproject', 'creatingFromScratch',
    'teams', 'deploymentTypes', 'Notification'];

  function BacklogProjectsCreateController(
    $state, backlogproject, creatingFromScratch,
    teams, deploymentTypes, Notification
  ) {
    var vm = this;
    vm.backlogproject = backlogproject;
    vm.teams = teams;
    vm.deploymentTypes = deploymentTypes;

    if (creatingFromScratch) {
      vm.pageTitle = 'Creating project backlog item';
    } else {
      vm.pageTitle = 'Editing project backlog item';
    }

    vm.submitForm = async function () {
      var backlogProjectStatus = (creatingFromScratch ? 'creation' : 'update');
      try {
        vm.formSubmitting = true;
        await vm.backlogproject.createOrUpdate();
      } catch (err) {
        vm.formSubmitting = false;
        Notification.error({ message: err.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Project Backlog item ' + backlogProjectStatus + ' error!' });
        return;
      }
      $state.go('backlogprojects.list');
      Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Project Backlog item ' + backlogProjectStatus + ' successful!' });
    };
  }
}());
