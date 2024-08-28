(function () {
  'use strict';

  angular
    .module('backlogprojects')
    .controller('BacklogProjectsViewController', BacklogProjectsViewController);

  BacklogProjectsViewController.$inject = ['backlogproject', 'team', 'deploymenttype', 'associatedPlans'];

  function BacklogProjectsViewController(backlogproject, team, deploymenttype, associatedPlans) {
    var vm = this;
    vm.backlogproject = backlogproject;
    vm.team = team;
    vm.deploymenttype = deploymenttype;
    vm.associatedPlans = associatedPlans;
  }
}());
