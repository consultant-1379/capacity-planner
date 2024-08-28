(function () {
  'use strict';

  angular
    .module('pods')
    .controller('PodsCreateController', PodsCreateController);

  PodsCreateController.$inject = ['$scope', '$state', 'pod', 'creatingFromScratch', 'Notification',
    'ProjectsService', '$window'];

  function PodsCreateController(
    $scope, $state, pod, creatingFromScratch, Notification,
    ProjectsService, $window
  ) {
    var vm = this;
    vm.pod = pod;
    vm.urlregex = '^(https?://)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*)(.*)$';
    if (creatingFromScratch) {
      vm.pageTitle = 'Creating pod';
      _.extend(vm.pod, {
        cpu_contention_ratio: 2.5,
        cpu: 0,
        memory_mb: 0,
        cinder_gb: 0,
        cinder_iops: 0,
        enfs_gb: 0,
        enfs_iops: 0
      });
    } else {
      vm.pageTitle = 'Editing pod';
    }

    vm.submitForm = async function () {
      var podStatus = (creatingFromScratch ? 'creation' : 'update');
      try {
        vm.formSubmitting = true;
        await vm.pod.createOrUpdate();
      } catch (err) {
        vm.formSubmitting = false;
        Notification.error({ message: err.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Pod ' + podStatus + ' error!' });
        return;
      }
      $state.go('pods.list');
      Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Pod ' + podStatus + ' successful!' });
    };
  }
}());
