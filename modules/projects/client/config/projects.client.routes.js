(function () {
  'use strict';

  angular
    .module('projects.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('projects', {
        abstract: true,
        url: '/projects',
        template: '<ui-view/>'
      })

      .state('projects.list', {
        url: '',
        templateUrl: '/modules/projects/client/views/projects-list.client.view.html',
        controller: 'ProjectsListController',
        controllerAs: 'vm',
        resolve: {
          projects: getProjects,
          pods: getPods
        }
      })
      .state('projects.create', {
        url: '/create',
        templateUrl: '/modules/projects/client/views/projects-create.client.view.html',
        controller: 'ProjectsCreateController',
        controllerAs: 'vm',
        resolve: {
          project: newProject,
          pods: getPods,
          teams: getTeams,
          deploymentTypes: getDeploymentTypes,
          pod: function () { return null; },
          creatingFromScratch: function () { return true; }
        }
      })
      .state('projects.view', {
        url: '/view/{projectId}',
        templateUrl: '/modules/projects/client/views/projects-view.client.view.html',
        controller: 'ProjectsViewController',
        controllerAs: 'vm',
        resolve: {
          project: getProject,
          pod: ['project', 'PodsService', getPod],
          team: ['project', 'TeamsService', getTeam],
          deploymenttype: ['project', 'DeploymentTypesService', getDeploymentType]
        }
      })
      .state('projects.edit', {
        url: '/edit/{projectId}',
        templateUrl: '/modules/projects/client/views/projects-create.client.view.html',
        controller: 'ProjectsCreateController',
        controllerAs: 'vm',
        resolve: {
          project: getProject,
          pods: getPods,
          teams: getTeams,
          deploymentTypes: getDeploymentTypes,
          pod: ['project', 'PodsService', getPod],
          creatingFromScratch: function () { return false; }
        }
      });
  }

  getProject.$inject = ['$stateParams', 'ProjectsService'];

  function getProject($stateParams, ProjectsService) {
    return ProjectsService.get({
      projectId: $stateParams.projectId
    }).$promise;
  }

  getProjects.$inject = ['ProjectsService'];
  function getProjects(ProjectsService) {
    return ProjectsService.query({ fields: '_id,name,pod_id' }).$promise;
  }

  newProject.$inject = ['ProjectsService'];
  function newProject(ProjectsService) {
    return new ProjectsService();
  }

  getPods.$inject = ['PodsService'];
  function getPods(podsService) {
    return podsService.query({ fields: '_id,name' }).$promise;
  }

  getTeams.$inject = ['TeamsService'];
  function getTeams(teamsService) {
    return teamsService.query({ fields: '_id,name' }).$promise;
  }

  getDeploymentTypes.$inject = ['DeploymentTypesService'];
  function getDeploymentTypes(deploymentTypesService) {
    return deploymentTypesService.query({ fields: '_id,name' }).$promise;
  }

  function getPod(project, PodsService) {
    return PodsService.get({ podId: project.pod_id }).$promise;
  }

  function getTeam(project, TeamsService) {
    return TeamsService.get({ teamId: project.team_id }).$promise;
  }

  function getDeploymentType(project, DeploymentTypesService) {
    return DeploymentTypesService.get({ deploymenttypeId: project.deploymenttype_id }).$promise;
  }
}());
