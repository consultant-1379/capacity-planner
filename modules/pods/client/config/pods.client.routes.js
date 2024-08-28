(function () {
  'use strict';

  angular
    .module('pods.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('pods', {
        abstract: true,
        url: '/pods',
        template: '<ui-view/>'
      })

      .state('pods.list', {
        url: '',
        templateUrl: '/modules/pods/client/views/pods-list.client.view.html',
        controller: 'PodsListController',
        controllerAs: 'vm',
        resolve: {
          pods: getPods
        }
      })
      .state('pods.create', {
        url: '/create',
        templateUrl: '/modules/pods/client/views/pods-create.client.view.html',
        controller: 'PodsCreateController',
        controllerAs: 'vm',
        resolve: {
          pod: newPod,
          creatingFromScratch: function () { return true; }
        }
      })
      .state('pods.view', {
        url: '/view/{podId}',
        templateUrl: '/modules/pods/client/views/pods-view.client.view.html',
        controller: 'PodsViewController',
        controllerAs: 'vm',
        resolve: {
          pod: getPod,
          dependentProjects: getDependentProjects
        }
      })
      .state('pods.edit', {
        url: '/edit/{podId}',
        templateUrl: '/modules/pods/client/views/pods-create.client.view.html',
        controller: 'PodsCreateController',
        controllerAs: 'vm',
        resolve: {
          pod: getPod,
          creatingFromScratch: function () { return false; }
        }
      });
  }

  getPod.$inject = ['$stateParams', 'PodsService'];
  function getPod($stateParams, PodsService) {
    return PodsService.get({
      podId: $stateParams.podId
    }).$promise;
  }

  getPods.$inject = ['PodsService'];
  function getPods(podsService) {
    return podsService.query().$promise;
  }

  newPod.$inject = ['PodsService'];
  function newPod(PodsService) {
    return new PodsService();
  }
  getDependentProjects.$inject = ['$stateParams', 'ProjectsService'];
  function getDependentProjects($stateParams, ProjectsService) {
    return ProjectsService.query({ q: 'pod_id=' + $stateParams.podId, fields: '_id,name' }).$promise;
  }
}());
