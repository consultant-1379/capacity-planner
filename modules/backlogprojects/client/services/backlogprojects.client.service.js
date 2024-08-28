(function () {
  'use strict';

  angular
    .module('backlogprojects.services')
    .factory('BacklogProjectsService', BacklogProjectsService);

  BacklogProjectsService.$inject = ['$resource', '$log'];

  function BacklogProjectsService($resource, $log) {
    var BacklogProject = $resource('/api/backlogprojects/:backlogprojectId', {
      backlogprojectId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });

    angular.extend(BacklogProject.prototype, {
      createOrUpdate: function () {
        var backlogproject = this;
        return createOrUpdate(backlogproject);
      }
    });
    return BacklogProject;

    function createOrUpdate(backlogproject) {
      if (backlogproject._id) {
        return backlogproject.$update(onSuccess, onError);
      }
      return backlogproject.$save(onSuccess, onError);

      function onSuccess() {
      }

      function onError(errorResponse) {
        $log.error(errorResponse.data);
      }
    }
  }
}());
