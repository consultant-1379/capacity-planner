(function () {
  'use strict';

  angular
    .module('plans')
    .controller('PlansListController', PlansListController);

  PlansListController.$inject = ['$window', 'Notification', 'PlansService', 'plans'];

  function PlansListController($window, Notification, PlansService, plans) {
    var vm = this;
    vm.plans = plans;
    vm.remove = remove;
    vm.copy = copy;

    async function copy(plan) {
      var name = prompt('Please enter the name of the new plan:', plan.name + '_copy');
      if (name == null) {
        return;
      }
      var originalPlan = await PlansService.get({ planId: plan._id }).$promise;
      delete originalPlan._id;
      originalPlan.name = name;
      try {
        await originalPlan.createOrUpdate();
      } catch (err) {
        Notification.error({ message: err.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Plan copy error!' });
        return;
      }
      vm.plans.push(originalPlan);
      Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Plan copied successfully!' });
    }

    function remove(plan) {
      if ($window.confirm('Are you sure you want to delete this plan?')) {
        plan.$delete()
          .then(successCallback)
          .catch(errorCallback);
      }

      function successCallback() {
        vm.plans.splice(vm.plans.indexOf(plan), 1);
        Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Plan "' + plan.name + '" deleted successfully!' });
      }

      function errorCallback(res) {
        Notification.error({
          message: res.data.message,
          title: '<i class="glyphicon glyphicon-remove"></i> Plan "' + plan.name + '" deletion failed!!'
        });
      }
    }
  }
}());
