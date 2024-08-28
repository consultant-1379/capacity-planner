(function () {
  'use strict';

  angular
    .module('deploymenttypes')
    .controller('DeploymentTypesViewController', DeploymentTypesViewController);

  DeploymentTypesViewController.$inject = ['$scope', '$state', 'deploymenttype', 'dependentProjects'];

  function DeploymentTypesViewController($scope, $state, deploymenttype, dependentProjects) {
    var vm = this;
    vm.deploymenttype = deploymenttype;
    vm.dependentProjects = dependentProjects;
  }
}());
