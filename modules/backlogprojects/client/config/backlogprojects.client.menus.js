(function () {
  'use strict';

  angular
    .module('backlogprojects')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      title: 'Project Backlog',
      state: 'backlogprojects.list',
      position: 4,
      roles: ['*']
    });
  }
}());
