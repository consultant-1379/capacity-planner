(function () {
  'use strict';

  angular
    .module('pods')
    .controller('PodsViewController', PodsViewController);

  PodsViewController.$inject = ['$scope', '$state', 'pod', 'dependentProjects'];

  function PodsViewController($scope, $state, pod, dependentProjects) {
    var vm = this;
    vm.pod = pod;
    vm.dependentProjects = dependentProjects;
  }
}());
