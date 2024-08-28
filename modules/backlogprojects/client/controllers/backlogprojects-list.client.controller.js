(function () {
  'use strict';

  angular
    .module('backlogprojects')
    .controller('BacklogProjectsListController', BacklogProjectsListController);

  BacklogProjectsListController.$inject = ['$window', 'Notification', 'backlogprojects', 'associatedPlans'];

  function BacklogProjectsListController($window, Notification, backlogprojects, associatedPlans) {
    var vm = this;
    vm.backlogprojects = backlogprojects;
    vm.remove = remove;
    vm.associatedPlans = associatedPlans;

    function remove(backlogproject) {
      var displayName = backlogproject.name;

      if ($window.confirm('Are you sure you want to delete this backlog project "' + displayName + '"?')) {
        backlogproject.$delete()
          .then(successCallback)
          .catch(errorCallback);
      }

      function successCallback() {
        vm.backlogprojects.splice(vm.backlogprojects.indexOf(backlogproject), 1);
        Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Backlog Project "' + displayName + '" deleted successfully!' });
      }

      function errorCallback(res) {
        Notification.error({
          message: res.data.message,
          title: '<i class="glyphicon glyphicon-remove"></i> Backlog Project "' + displayName + '" deletion failed!!'
        });
      }
    }
  }
}());
