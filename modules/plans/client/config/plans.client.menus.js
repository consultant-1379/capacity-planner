(function () {
  'use strict';

  angular
    .module('plans')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      title: 'Plans',
      state: 'plans.list',
      position: 1,
      roles: ['*']
    });
  }
}());
