(function () {
  'use strict';

  angular
    .module('pods')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      title: 'Pods',
      state: 'pods.list',
      position: 2,
      roles: ['*']
    });
  }
}());
