(function () {
  'use strict';

  angular
    .module('backlogprojects.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('backlogprojects', {
        abstract: true,
        url: '/backlogprojects',
        template: '<ui-view/>'
      })

      .state('backlogprojects.list', {
        url: '',
        templateUrl: '/modules/backlogprojects/client/views/backlogprojects-list.client.view.html',
        controller: 'BacklogProjectsListController',
        controllerAs: 'vm',
        resolve: {
          backlogprojects: getBacklogProjects,
          associatedPlans: ['PlansService', 'PodsService', 'backlogprojects', determineAssociatedPlans]
        }
      })
      .state('backlogprojects.create', {
        url: '/create',
        templateUrl: '/modules/backlogprojects/client/views/backlogprojects-create.client.view.html',
        controller: 'BacklogProjectsCreateController',
        controllerAs: 'vm',
        resolve: {
          backlogproject: newBacklogProject,
          teams: getTeams,
          deploymentTypes: getDeploymentTypes,
          creatingFromScratch: function () { return true; }
        }
      })
      .state('backlogprojects.edit', {
        url: '/edit/{backlogprojectId}',
        templateUrl: '/modules/backlogprojects/client/views/backlogprojects-create.client.view.html',
        controller: 'BacklogProjectsCreateController',
        controllerAs: 'vm',
        resolve: {
          backlogproject: getBacklogProject,
          teams: getTeams,
          deploymentTypes: getDeploymentTypes,
          creatingFromScratch: function () { return false; }
        }
      })
      .state('backlogprojects.view', {
        url: '/view/{backlogprojectId}',
        templateUrl: '/modules/backlogprojects/client/views/backlogprojects-view.client.view.html',
        controller: 'BacklogProjectsViewController',
        controllerAs: 'vm',
        resolve: {
          backlogproject: getBacklogProject,
          team: ['backlogproject', 'TeamsService', getTeam],
          deploymenttype: ['backlogproject', 'DeploymentTypesService', getDeploymentType],
          associatedPlans: ['PlansService', 'PodsService', 'backlogproject', determineAssociatedPlans]
        }
      });
  }

  getBacklogProject.$inject = ['$stateParams', 'BacklogProjectsService'];
  function getBacklogProject($stateParams, BacklogProjectsService) {
    return BacklogProjectsService.get({
      backlogprojectId: $stateParams.backlogprojectId
    }).$promise;
  }

  getBacklogProjects.$inject = ['BacklogProjectsService'];
  function getBacklogProjects(BacklogProjectsService) {
    return BacklogProjectsService.query({ fields: '_id,name' }).$promise;
  }

  newBacklogProject.$inject = ['BacklogProjectsService'];
  function newBacklogProject(BacklogProjectsService) {
    return new BacklogProjectsService();
  }

  getTeams.$inject = ['TeamsService'];
  function getTeams(teamsService) {
    return teamsService.query({ fields: '_id,name' }).$promise;
  }

  getDeploymentTypes.$inject = ['DeploymentTypesService'];
  function getDeploymentTypes(deploymentTypesService) {
    return deploymentTypesService.query({ fields: '_id,name' }).$promise;
  }

  function getTeam(project, TeamsService) {
    return TeamsService.get({ teamId: project.team_id }).$promise;
  }

  function getDeploymentType(project, DeploymentTypesService) {
    return DeploymentTypesService.get({ deploymenttypeId: project.deploymenttype_id }).$promise;
  }

  getPods.$inject = ['PodsService'];
  function getPods(podsService) {
    return podsService.query({ fields: '_id,name' }).$promise;
  }

  function isBacklogProject(project) {
    return this.includes(project._id);
  }

  function getCorrespondingPod(pod) {
    return pod._id === this;
  }

  determineAssociatedPlans.$inject = ['PlansService', 'PodsService'];
  async function determineAssociatedPlans(plansService, podsService, projects) {
    if (!(projects instanceof Array)) {
      projects = [projects];
    }
    var plans = await plansService.query({ fields: '_id,name,pods' }).$promise;
    var pods = await podsService.query({ fields: '_id,name' }).$promise;
    var associatedPlans = [];
    for (var i = 0; i < plans.length; i += 1) {
      for (var x = 0; x < plans[i].pods.length; x += 1) {
        var backlogProjects = projects.filter(isBacklogProject, plans[i].pods[x].backlog_project_ids);
        for (var y = 0; y < backlogProjects.length; y += 1) {
          var pod = pods.find(getCorrespondingPod, plans[i].pods[x].pod_id);
          associatedPlans.push({
            _id: plans[i]._id,
            name: plans[i].name,
            pod_name: pod.name,
            backlogprojectId: backlogProjects[y]._id
          });
        }
      }
    }
    return associatedPlans;
  }
}());
