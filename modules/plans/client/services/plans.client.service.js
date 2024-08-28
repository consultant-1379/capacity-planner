(function () {
  'use strict';

  angular
    .module('plans.services')
    .factory('PlansService', PlansService);

  PlansService.$inject = ['$resource', '$log'];

  function PlansService($resource, $log) {
    var Plan = $resource('/api/plans/:planId', {
      planId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });

    angular.extend(Plan.prototype, {
      createOrUpdate: function () {
        var plan = this;
        return createOrUpdate(plan);
      }
    });
    return Plan;

    function createOrUpdate(plan) {
      if (plan._id) {
        return plan.$update(onSuccess, onError);
      }
      return plan.$save(onSuccess, onError);

      function onSuccess() {
      }

      function onError(errorResponse) {
        $log.error(errorResponse.data);
      }
    }
  }
}());
