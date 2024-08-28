(function () {
  'use strict';

  angular
    .module('teams.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('teams', {
        abstract: true,
        url: '/teams',
        template: '<ui-view/>'
      })

      .state('teams.list', {
        url: '',
        templateUrl: '/modules/teams/client/views/teams-list.client.view.html',
        controller: 'TeamsListController',
        controllerAs: 'vm',
        resolve: {
          teams: getTeams
        }
      })
      .state('teams.create', {
        url: '/create',
        templateUrl: '/modules/teams/client/views/teams-create.client.view.html',
        controller: 'TeamsCreateController',
        controllerAs: 'vm',
        resolve: {
          team: newTeam,
          creatingFromScratch: function () { return true; }
        }
      })
      .state('teams.view', {
        url: '/view/{teamId}',
        templateUrl: '/modules/teams/client/views/teams-view.client.view.html',
        controller: 'TeamsViewController',
        controllerAs: 'vm',
        resolve: {
          team: getTeam,
          dependentProjects: getDependentProjects
        }
      })
      .state('teams.edit', {
        url: '/edit/{teamId}',
        templateUrl: '/modules/teams/client/views/teams-create.client.view.html',
        controller: 'TeamsCreateController',
        controllerAs: 'vm',
        resolve: {
          team: getTeam,
          creatingFromScratch: function () { return false; }
        }
      });
  }

  getTeam.$inject = ['$stateParams', 'TeamsService'];
  function getTeam($stateParams, TeamsService) {
    return TeamsService.get({
      teamId: $stateParams.teamId
    }).$promise;
  }

  getTeams.$inject = ['TeamsService'];
  function getTeams(teamsService) {
    return teamsService.query().$promise;
  }

  newTeam.$inject = ['TeamsService'];
  function newTeam(TeamsService) {
    return new TeamsService();
  }
  getDependentProjects.$inject = ['$stateParams', 'ProjectsService'];
  function getDependentProjects($stateParams, ProjectsService) {
    return ProjectsService.query({ q: 'team_id=' + $stateParams.teamId, fields: '_id,name' }).$promise;
  }
}());
