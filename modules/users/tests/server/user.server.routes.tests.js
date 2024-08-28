'use strict';

var semver = require('semver'),
  should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  express = require(path.resolve('./config/lib/express')),
  passport = require('passport'),
  StrategyMock = require('../../tests/server/config/strategies/strategy-mock'),
  sinon = require('sinon'),
  authenticationCtrl = require('../../server/controllers/users/users.authentication.server.controller');

var app,
  agent,
  credentials,
  ldapCredentials,
  user,
  _user,
  _ldapUser,
  ldapUser;

describe('User CRUD tests', function () {
  before(async function () {
    app = express.init(mongoose);
    agent = request.agent(app);

    var getMockLDAPConfig = function (req, callback) {
      process.nextTick(function () {
        callback(null, null);
      });
    };
    passport.use('mockLdap', new StrategyMock(getMockLDAPConfig));
    sinon.stub(authenticationCtrl, 'determineStrategyNames').returns(['mockLdap']);
  });

  beforeEach(async function () {
    credentials = {
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    ldapCredentials = {
      username: 'ldapuser',
      password: 'ldap_M3@n.jsI$Aw3$0m3'
    };

    _user = {
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local'
    };

    _ldapUser = {
      firstName: 'Full',
      lastName: 'Names',
      displayName: 'Full Name',
      email: 'ldapTest@test.com',
      username: ldapCredentials.username,
      password: ldapCredentials.password,
      provider: 'mockLdap'
    };

    user = new User(_user);
    ldapUser = new User(_ldapUser);

    await user.save();
  });

  it('should be able to successfully login/logout with username/password without contacting mock ldap', async function () {
    await agent.post('/api/auth/signin').send(credentials).expect(200);
    var response = await agent.get('/api/auth/signout').expect(302);
    response.redirect.should.equal(true);
    response.text.should.equal('Found. Redirecting to /');
  });

  it('should not be able login with invalid username and password', async function () {
    var response = await agent.post('/api/auth/signin').send({ username: 'invalid', password: 'invalid' }).expect(422);
    response.redirect.should.equal(false);
    response.body.message.should.equal('Invalid username or password');
  });

  it('should be able to successfully login/logout with username/password with mock ldap strategy', async function () {
    await agent.post('/api/auth/signin').send(ldapCredentials).expect(200);
    var response = await agent.get('/api/auth/signout').expect(302);
    response.redirect.should.equal(true);
    response.text.should.equal('Found. Redirecting to /');
  });

  it('should be able to successfully login/logout with username, new password and with mock ldap strategy', async function () {
    await ldapUser.save();
    ldapCredentials.password = 'old_ldap_M3@n.jsI$Aw3$0m3';

    await agent.post('/api/auth/signin').send(ldapCredentials).expect(200);
    var response = await agent.get('/api/auth/signout').expect(302);
    response.redirect.should.equal(true);
    response.text.should.equal('Found. Redirecting to /');
  });

  it('should not be able to get any user details if not logged in', async function () {
    var response = await agent.get('/api/users/me').expect(200);
    should.not.exist(response.body);
  });

  afterEach(async function () {
    await User.remove().exec();
  });
});
