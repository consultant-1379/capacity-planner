(function () {
  'use strict';

  angular
    .module('teams')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      title: 'Teams',
      state: 'teams.list',
      position: 5,
      roles: ['*']
    });
  }
}());
