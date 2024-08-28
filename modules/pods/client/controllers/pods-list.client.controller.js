(function () {
  'use strict';

  angular
    .module('pods')
    .controller('PodsListController', PodsListController);

  PodsListController.$inject = ['$window', 'Notification', 'pods'];

  function PodsListController($window, Notification, pods) {
    var vm = this;
    vm.pods = pods;

    vm.remove = remove;

    function remove(pod) {
      if ($window.confirm('Are you sure you want to delete this pod?')) {
        pod.$delete()
          .then(successCallback)
          .catch(errorCallback);
      }

      function successCallback() {
        vm.pods.splice(vm.pods.indexOf(pod), 1);
        Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Pod "' + pod.name + '" deleted successfully!' });
      }

      function errorCallback(res) {
        Notification.error({
          message: res.data.message,
          title: '<i class="glyphicon glyphicon-remove"></i> Pod "' + pod.name + '" deletion failed!!'
        });
      }
    }
  }
}());
