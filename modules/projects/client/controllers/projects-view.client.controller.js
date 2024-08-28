(function () {
  'use strict';

  angular
    .module('projects')
    .controller('ProjectsViewController', ProjectsViewController);

  ProjectsViewController.$inject = ['$scope', '$state', 'project', 'pod', 'team', 'deploymenttype'];

  function ProjectsViewController($scope, $state, project, pod, team, deploymenttype) {
    var vm = this;
    vm.project = project;
    vm.pod = pod;
    vm.team = team;
    vm.deploymenttype = deploymenttype;
  }
}());
