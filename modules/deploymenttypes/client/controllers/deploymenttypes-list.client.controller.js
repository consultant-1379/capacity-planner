(function () {
  'use strict';

  angular
    .module('deploymenttypes')
    .controller('DeploymentTypesListController', DeploymentTypesListController);

  DeploymentTypesListController.$inject = ['$window', 'Notification', 'deploymenttypes'];

  function DeploymentTypesListController($window, Notification, deploymenttypes) {
    var vm = this;
    vm.deploymenttypes = deploymenttypes;

    vm.remove = remove;

    function remove(deploymenttype) {
      if ($window.confirm('Are you sure you want to delete this Deployment Type?')) {
        deploymenttype.$delete()
          .then(successCallback)
          .catch(errorCallback);
      }

      function successCallback() {
        vm.deploymenttypes.splice(vm.deploymenttypes.indexOf(deploymenttype), 1);
        Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Deployment Type "' + deploymenttype.name + '" deleted successfully!' });
      }

      function errorCallback(res) {
        Notification.error({
          message: res.data.message,
          title: '<i class="glyphicon glyphicon-remove"></i> Deployment Type "' + deploymenttype.name + '" deletion failed!!'
        });
      }
    }
  }
}());
