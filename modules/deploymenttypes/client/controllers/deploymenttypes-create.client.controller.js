(function () {
  'use strict';

  angular
    .module('deploymenttypes')
    .controller('DeploymentTypesCreateController', DeploymentTypesCreateController);

  DeploymentTypesCreateController.$inject = ['$scope', '$state', 'deploymenttype', 'creatingFromScratch', 'Notification',
    'ProjectsService', '$window'];

  function DeploymentTypesCreateController($scope, $state, deploymenttype, creatingFromScratch, Notification, ProjectsService, $window) {
    var vm = this;
    vm.deploymenttype = deploymenttype;
    vm.urlregex = '^(https?://)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*)(.*)$';
    if (creatingFromScratch) {
      vm.pageTitle = 'Creating Deployment Type';
    } else {
      vm.pageTitle = 'Editing Deployment Type';
    }

    vm.submitForm = async function () {
      var deploymenttypeStatus = (creatingFromScratch ? 'creation' : 'update');
      try {
        vm.formSubmitting = true;
        await vm.deploymenttype.createOrUpdate();
      } catch (err) {
        vm.formSubmitting = false;
        Notification.error({ message: err.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Deployment Type ' + deploymenttypeStatus + ' error!' });
        return;
      }
      $state.go('deploymenttypes.list');
      Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Deployment Type ' + deploymenttypeStatus + ' successful!' });
    };
  }
}());
