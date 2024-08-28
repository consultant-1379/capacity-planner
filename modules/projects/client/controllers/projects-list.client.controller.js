(function () {
  'use strict';

  angular
    .module('projects')
    .controller('ProjectsListController', ProjectsListController);

  ProjectsListController.$inject = ['$window', 'Notification', 'projects', 'pods'];

  function ProjectsListController($window, Notification, projects, pods) {
    var vm = this;
    vm.projects = projects;
    vm.pods = pods;
    vm.remove = remove;

    function remove(project) {
      var displayName = project.name;

      if ($window.confirm('Are you sure you want to delete this project "' + displayName + '"?')) {
        project.$delete()
          .then(successCallback)
          .catch(errorCallback);
      }

      function successCallback() {
        vm.projects.splice(vm.projects.indexOf(project), 1);
        Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Project "' + displayName + '" deleted successfully!' });
      }

      function errorCallback(res) {
        Notification.error({
          message: res.data.message,
          title: '<i class="glyphicon glyphicon-remove"></i> Project "' + displayName + '" deletion failed!!'
        });
      }
    }
  }
}());
