(function () {
  'use strict';

  angular
    .module('plans.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('plans', {
        abstract: true,
        url: '/plans',
        template: '<ui-view/>'
      })
      .state('plans.list', {
        url: '',
        templateUrl: '/modules/plans/client/views/plans-list.client.view.html',
        controller: 'PlansListController',
        controllerAs: 'vm',
        resolve: {
          plans: getPlans
        }
      })
      .state('plans.create', {
        url: '/create',
        templateUrl: '/modules/plans/client/views/plans-create.client.view.html',
        controller: 'PlansCreateController',
        controllerAs: 'vm',
        resolve: {
          plan: newPlan,
          pods: getPods,
          projects: getProjects,
          backlogprojects: getBacklogProjects,
          teams: getTeams,
          deploymentTypes: getDeploymentTypes,
          creatingFromScratch: function () { return true; }
        }
      })
      .state('plans.edit', {
        url: '/edit/{planId}',
        templateUrl: '/modules/plans/client/views/plans-create.client.view.html',
        controller: 'PlansCreateController',
        controllerAs: 'vm',
        resolve: {
          plan: getPlan,
          pods: getPods,
          projects: getProjects,
          backlogprojects: getBacklogProjects,
          teams: getTeams,
          deploymentTypes: getDeploymentTypes,
          creatingFromScratch: function () { return false; }
        }
      });
  }

  getPods.$inject = ['PodsService'];
  function getPods(podsService) {
    return podsService.query().$promise;
  }

  getProjects.$inject = ['ProjectsService'];
  function getProjects(projectsService) {
    return projectsService.query().$promise;
  }

  getBacklogProjects.$inject = ['BacklogProjectsService'];
  function getBacklogProjects(BacklogProjectsService) {
    return BacklogProjectsService.query().$promise;
  }

  getTeams.$inject = ['TeamsService'];
  function getTeams(TeamsService) {
    return TeamsService.query().$promise;
  }

  getPlans.$inject = ['PlansService'];
  function getPlans(PlansService) {
    return PlansService.query().$promise;
  }

  getDeploymentTypes.$inject = ['DeploymentTypesService'];
  function getDeploymentTypes(deploymentTypesService) {
    return deploymentTypesService.query().$promise;
  }

  newPlan.$inject = ['PlansService'];
  function newPlan(PlansService) {
    return new PlansService();
  }

  getPlan.$inject = ['$stateParams', 'PlansService'];
  function getPlan($stateParams, PlansService) {
    return PlansService.get({
      planId: $stateParams.planId
    }).$promise;
  }
}());
