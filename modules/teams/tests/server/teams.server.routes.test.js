'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  Team = mongoose.model('Team'),
  Project = mongoose.model('Project'),
  BacklogProject = mongoose.model('BacklogProject'),
  Pod = mongoose.model('Pod'),
  DeploymentType = mongoose.model('DeploymentType'),
  _ = require('lodash'),
  express = require(path.resolve('./config/lib/express'));

var app,
  agent,
  team;

const validTeam = {
  name: 'validTeam'
};

const validPod = {
  name: 'validPod',
  authUrl: 'http://validPod.athtem.eei.ericsson.se:5000/v2.0',
  project: 'validProject',
  username: 'validUser',
  password: 'validPassword',
  cpu_contention_ratio: 2.5,
  cpu: 100,
  memory_mb: 200,
  cinder_gb: 300,
  cinder_iops: 400,
  enfs_gb: 500,
  enfs_iops: 600
};

const validProject = {
  name: 'validProject',
  pod_id: '',
  team_id: '',
  deploymenttype_id: '',
  cpu: 100,
  memory_mb: 200,
  cinder_gb: 300
};

const validBacklogProject = {
  name: 'validProject',
  team_id: '',
  deploymenttype_id: ''
};

const validDeploymentType = {
  name: 'validDeploymentType',
  cpu: 100,
  memory_mb: 200,
  cinder_gb: 300,
  cinder_iops: 400,
  enfs_gb: 500,
  enfs_iops: 600
};

const requiredKeys = [
  'name'
];

const keySpecificTestData = [
  {
    key: 'rogueKey', value: 'rogueValue', responseCode: 400, responseString: 'Field `rogueKey` is not in schema and strict mode is set to throw.'
  }, {
    key: 'name', value: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', responseCode: 201, responseCodePut: 200
  }, {
    key: 'name', value: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', responseCode: 400, responseString: 'Path `name` (`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`) is longer than the maximum allowed length (50).'
  }
];

describe('Teams', function () {
  before(async function () {
    app = express.init(mongoose);
    agent = request.agent(app);
  });
  beforeEach(async function () {
    team = _.cloneDeep(validTeam);
  });

  describe('POST', function () {
    it('should create a new team and update the db', async function () {
      var response = await agent.post('/api/teams').send(team).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal('/api/teams/' + response.body._id);
      var teamReturned = await Team.findById(response.body._id).exec();
      response.body.should.containDeep(team);
      teamReturned.should.containDeep(team);
    });

    it('should not post more than one team with the same name', async function () {
      var response = await agent.post('/api/teams').send(team).expect(201);
      response = await agent.post('/api/teams').send(team).expect(422);
      response.body.message.should.equal('Name already exists');
    });

    it('should respond with bad request with invalid json', async function () {
      team = '{';
      var response = await agent.post('/api/teams').send(team).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    requiredKeys.forEach(function (key) {
      it(`given key '${key}' is missing, it should return code 400`, async function () {
        delete team[key];
        var response = await agent.post('/api/teams').send(team).expect(400);
        response.body.message.should.equal('Path `' + key + '` is required.');
      });
    });

    keySpecificTestData.forEach(function (testData) {
      it(`Given that '${testData.key}' is set to ${testData.value}, ` +
      `it should return code ${testData.responseCode} and body should contain "${testData.responseString}"`, async function () {
        team[testData.key] = testData.value;
        var response = await agent.post('/api/teams').send(team).expect(testData.responseCode);
        if (testData.responseString) {
          response.body.message.should.containEql(testData.responseString);
        }
      });
    });
  });
  describe('GET', function () {
    it('should be able to get an empty team list', async function () {
      var response = await agent.get('/api/teams').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should be able to get a team list with one element', async function () {
      await agent.post('/api/teams').send(team).expect(201);
      var response = await agent.get('/api/teams').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(1);
      response.body[0].should.containDeep(team);
    });

    it('should be able to get a team list with more than one element', async function () {
      await agent.post('/api/teams').send(team).expect(201);
      var secondValidTeam = _.cloneDeep(team);
      secondValidTeam.name = 'secondTeam';
      await agent.post('/api/teams').send(secondValidTeam).expect(201);
      var response = await agent.get('/api/teams').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(2);
      response.body[0].should.containDeep(secondValidTeam);
      response.body[1].should.containDeep(team);
    });

    it('should be able to get a single team', async function () {
      var response = await agent.post('/api/teams').send(team).expect(201);
      response = await agent.get('/api/teams/' + response.body._id).expect(200);
      response.body.should.containDeep(team);
    });

    it('should throw 404 when id is not in database', async function () {
      var response = await agent.get('/api/teams/000000000000000000000000').expect(404);
      response.body.message.should.equal('A team with that id does not exist');
    });

    it('should throw 404 when an invalid id is used to search the db', async function () {
      var response = await agent.get('/api/teams/0').expect(404);
      response.body.message.should.equal('A team with that id does not exist');
    });
  });

  describe('PUT', function () {
    it('should return the updated team with the same id and the db should be updated', async function () {
      var response = await agent.post('/api/teams').send(team).expect(201);
      team.name = 'updatedName';
      var response2 = await agent.put('/api/teams/' + response.body._id).send(team).expect(200);
      var teamReturned = await Team.findById(response.body._id).exec();
      response2.body._id.should.equal(response.body._id);
      response2.body.should.containDeep(team);
      teamReturned.should.containDeep(team);
    });

    it('should not update with more than one team with the same name', async function () {
      await agent.post('/api/teams').send(team).expect(201);
      var secondValidTeam = _.cloneDeep(team);
      secondValidTeam.name = 'secondTeam';
      var response = await agent.post('/api/teams').send(secondValidTeam).expect(201);
      secondValidTeam.name = team.name;
      response = await agent.put('/api/teams/' + response.body._id).send(secondValidTeam).expect(422);
      response.body.message.should.equal('Name already exists');
    });

    it('should respond with bad request with invalid json', async function () {
      var response = await agent.post('/api/teams').send(team).expect(201);
      team = '{';
      response = await agent.post('/api/teams/' + response.body._id).send(team).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    keySpecificTestData.forEach(function (testData) {
      it(`Given that '${testData.key}' is set to ${testData.value}, ` +
      `it should return code ${testData.responseCode} and body should contain "${testData.responseString}"`, async function () {
        var response = await agent.post('/api/teams').send(team).expect(201);
        team[testData.key] = testData.value;
        var response2 = await agent.put('/api/teams/' + response.body._id).send(team).expect(testData.responseCodePut || testData.responseCode);
        if (testData.responseString) {
          response2.body.message.should.containEql(testData.responseString);
        }
      });
    });
  });

  describe('DELETE', function () {
    it('should delete a single team', async function () {
      var response = await agent.post('/api/teams/').send(team).expect(201);
      response = await agent.delete('/api/teams/' + response.body._id).expect(200);
      response.body.should.containDeep(team);
      var count = await Team.count().exec();
      count.should.equal(0);
    });

    it('should have 1 element in db after 2 creations and 1 team deletion', async function () {
      var secondValidTeam = _.cloneDeep(team);
      secondValidTeam.name = 'secondTeam';
      var response = await agent.post('/api/teams/').send(team).expect(201);
      response = await agent.post('/api/teams/').send(secondValidTeam).expect(201);
      response = await agent.delete('/api/teams/' + response.body._id).expect(200);
      var count = await Team.count().exec();
      count.should.equal(1);
    });

    it('should fail when attempting to delete a team that does not exist', async function () {
      var response = await agent.delete('/api/teams/000000000000000000000000').expect(404);
      response.body.message.should.equal('A team with that id does not exist');
    });

    it('should fail when attempting to delete a team which has dependent projects', async function () {
      var deploymentTypesResponse = await agent.post('/api/deploymenttypes/').send(validDeploymentType).expect(201);
      var teamsResponse = await agent.post('/api/teams/').send(team).expect(201);
      var podsResponse = await agent.post('/api/pods/').send(validPod).expect(201);
      var project = _.clone(validProject);
      project = _.extend(project, {
        pod_id: podsResponse.body._id,
        team_id: teamsResponse.body._id,
        deploymenttype_id: deploymentTypesResponse.body._id
      });
      var projectsResponse = await agent.post('/api/projects/').send(project).expect(201);
      teamsResponse = await agent.delete('/api/teams/' + teamsResponse.body._id).expect(422);
      teamsResponse.body.message.should.equal('Can\'t delete team, it has 1 dependent project');
      var count = await Team.count().exec();
      count.should.equal(1);
    });

    it('should fail when attempting to delete a team which has dependent backlog projects', async function () {
      var deploymentTypesResponse = await agent.post('/api/deploymenttypes/').send(validDeploymentType).expect(201);
      var teamsResponse = await agent.post('/api/teams/').send(team).expect(201);
      var backlogProject = _.clone(validBacklogProject);
      backlogProject = _.extend(backlogProject, {
        team_id: teamsResponse.body._id,
        deploymenttype_id: deploymentTypesResponse.body._id
      });
      await agent.post('/api/backlogprojects').send(backlogProject).expect(201);
      teamsResponse = await agent.delete('/api/teams/' + teamsResponse.body._id).expect(422);
      teamsResponse.body.message.should.equal('Can\'t delete team, it has 1 dependent backlogproject');
      var count = await Team.count().exec();
      count.should.equal(1);
    });
  });

  afterEach(async function () {
    await Project.remove().exec();
    await BacklogProject.remove().exec();
    await Pod.remove().exec();
    await Team.remove().exec();
    await DeploymentType.remove().exec();
  });
});
