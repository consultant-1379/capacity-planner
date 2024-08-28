(function () {
  'use strict';

  angular
    .module('deploymenttypes.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('deploymenttypes', {
        abstract: true,
        url: '/deploymenttypes',
        template: '<ui-view/>'
      })

      .state('deploymenttypes.list', {
        url: '',
        templateUrl: '/modules/deploymenttypes/client/views/deploymenttypes-list.client.view.html',
        controller: 'DeploymentTypesListController',
        controllerAs: 'vm',
        resolve: {
          deploymenttypes: getDeploymentTypes
        }
      })
      .state('deploymenttypes.create', {
        url: '/create',
        templateUrl: '/modules/deploymenttypes/client/views/deploymenttypes-create.client.view.html',
        controller: 'DeploymentTypesCreateController',
        controllerAs: 'vm',
        resolve: {
          deploymenttype: newDeploymentType,
          creatingFromScratch: function () { return true; }
        }
      })
      .state('deploymenttypes.view', {
        url: '/view/{deploymenttypeId}',
        templateUrl: '/modules/deploymenttypes/client/views/deploymenttypes-view.client.view.html',
        controller: 'DeploymentTypesViewController',
        controllerAs: 'vm',
        resolve: {
          deploymenttype: getDeploymentType,
          dependentProjects: getDependentProjects
        }
      })
      .state('deploymenttypes.edit', {
        url: '/edit/{deploymenttypeId}',
        templateUrl: '/modules/deploymenttypes/client/views/deploymenttypes-create.client.view.html',
        controller: 'DeploymentTypesCreateController',
        controllerAs: 'vm',
        resolve: {
          deploymenttype: getDeploymentType,
          creatingFromScratch: function () { return false; }
        }
      });
  }

  getDeploymentType.$inject = ['$stateParams', 'DeploymentTypesService'];
  function getDeploymentType($stateParams, DeploymentTypesService) {
    return DeploymentTypesService.get({
      deploymenttypeId: $stateParams.deploymenttypeId
    }).$promise;
  }

  getDeploymentTypes.$inject = ['DeploymentTypesService'];
  function getDeploymentTypes(deploymenttypesService) {
    return deploymenttypesService.query().$promise;
  }

  newDeploymentType.$inject = ['DeploymentTypesService'];
  function newDeploymentType(DeploymentTypesService) {
    return new DeploymentTypesService();
  }
  getDependentProjects.$inject = ['$stateParams', 'ProjectsService'];
  function getDependentProjects($stateParams, ProjectsService) {
    return ProjectsService.query({ q: 'deploymenttype_id=' + $stateParams.deploymenttypeId, fields: '_id,name' }).$promise;
  }
}());
