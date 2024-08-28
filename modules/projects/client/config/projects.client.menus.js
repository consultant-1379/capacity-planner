(function () {
  'use strict';

  angular
    .module('projects')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      title: 'Projects',
      state: 'projects.list',
      position: 3,
      roles: ['*']
    });
  }
}());
