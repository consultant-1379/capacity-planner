'use strict';

function StrategyMock() {}

StrategyMock.prototype.authenticate = function authenticate(req) {
  var user = {
    firstName: 'mockLdapFirstName',
    givenName: 'mockLdapFirstName',
    lastName: 'mockLdapLastName',
    displayName: 'mockLdapDisplayName',
    email: 'mockLdapEmail@email.com',
    username: req.body.username,
    password: req.body.password,
    sn: 'mockLdapLastName',
    cn: req.body.username
  };
  if (req.body.username !== 'ldapuser') {
    this.fail();
  } else {
    this.success(user);
  }
};

module.exports = StrategyMock;
