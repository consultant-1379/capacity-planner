(function () {
  'use strict';

  angular
    .module('deploymenttypes')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      title: 'Deployment Types',
      state: 'deploymenttypes.list',
      position: 6,
      roles: ['*']
    });
  }
}());
