(function () {
  'use strict';

  angular
    .module('teams')
    .controller('TeamsViewController', TeamsViewController);

  TeamsViewController.$inject = ['$scope', '$state', 'team', 'dependentProjects'];

  function TeamsViewController($scope, $state, team, dependentProjects) {
    var vm = this;
    vm.team = team;
    vm.dependentProjects = dependentProjects;
  }
}());
