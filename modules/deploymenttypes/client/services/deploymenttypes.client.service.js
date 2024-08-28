(function () {
  'use strict';

  angular
    .module('deploymenttypes.services')
    .factory('DeploymentTypesService', DeploymentTypesService);

  DeploymentTypesService.$inject = ['$resource', '$log'];

  function DeploymentTypesService($resource, $log) {
    var DeploymentType = $resource('/api/deploymenttypes/:deploymenttypeId', {
      deploymenttypeId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });

    angular.extend(DeploymentType.prototype, {
      createOrUpdate: function () {
        var deploymenttype = this;
        return createOrUpdate(deploymenttype);
      }
    });
    return DeploymentType;

    function createOrUpdate(deploymenttype) {
      if (deploymenttype._id) {
        return deploymenttype.$update(onSuccess, onError);
      }
      return deploymenttype.$save(onSuccess, onError);

      function onSuccess() {
      }

      function onError(errorResponse) {
        $log.error(errorResponse.data);
      }
    }
  }
}());
