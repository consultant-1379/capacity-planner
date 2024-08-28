(function () {
  'use strict';

  angular
    .module('projects')
    .controller('ProjectsCreateController', ProjectsCreateController);

  ProjectsCreateController.$inject = ['$scope', '$state', 'project', 'pods', 'pod', 'creatingFromScratch',
    'teams', 'deploymentTypes', 'Notification', 'PodsService', '$window'];

  function ProjectsCreateController(
    $scope, $state, project, pods, pod, creatingFromScratch,
    teams, deploymentTypes, Notification, PodsService, $window
  ) {
    var vm = this;
    vm.project = project;
    vm.pods = pods;
    vm.teams = teams;
    vm.deploymentTypes = deploymentTypes;
    vm.pod = pod;

    if (creatingFromScratch) {
      vm.pageTitle = 'Creating project';
    } else {
      vm.pageTitle = 'Editing project';
    }

    vm.submitForm = async function () {
      var projectStatus = (creatingFromScratch ? 'creation' : 'update');
      try {
        vm.formSubmitting = true;
        await vm.project.createOrUpdate();
      } catch (err) {
        vm.formSubmitting = false;
        Notification.error({ message: err.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Project ' + projectStatus + ' error!' });
        return;
      }
      $state.go('projects.list');
      Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Project ' + projectStatus + ' successful!' });
    };
  }
}());
