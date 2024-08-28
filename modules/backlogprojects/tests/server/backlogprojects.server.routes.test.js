'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  BacklogProject = mongoose.model('BacklogProject'),
  Pod = mongoose.model('Pod'),
  Plan = mongoose.model('Plan'),
  Team = mongoose.model('Team'),
  DeploymentType = mongoose.model('DeploymentType'),
  _ = require('lodash'),
  express = require(path.resolve('./config/lib/express'));

var app,
  agent,
  backlogproject;

const validBacklogProject = {
  name: 'validBacklogProject',
  team_id: '',
  deploymenttype_id: ''
};

const validDeploymentType = {
  name: 'deploymentType',
  cpu: 100,
  memory_mb: 200,
  cinder_gb: 300,
  cinder_iops: 400,
  enfs_gb: 500,
  enfs_iops: 600
};

const validTeam = {
  name: 'validTeam'
};

const validPlan = {
  name: 'validPlan',
  pods: [],
  status: 'IN PROGRESS'
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

const requiredKeys = [
  'name',
  'team_id',
  'deploymenttype_id'
];

const keySpecificTestData = [
  {
    key: 'rogueKey', value: 'rogueValue', responseCode: 400, responseString: 'Field `rogueKey` is not in schema and strict mode is set to throw.'
  }, {
    key: 'team_id', value: '000000000000000000000000', responseCode: 422, responseString: 'The given team id 000000000000000000000000 could not be found'
  }, {
    key: 'team_id', value: 'invalid', responseCode: 400, responseString: 'Cast to ObjectID failed for value "invalid" at path "team_id"'
  }, {
    key: 'deploymenttype_id', value: '000000000000000000000000', responseCode: 422, responseString: 'The given deployment type id 000000000000000000000000 could not be found'
  }, {
    key: 'deploymenttype_id', value: 'invalid', responseCode: 400, responseString: 'Cast to ObjectID failed for value "invalid" at path "deploymenttype_id"'
  }
];

describe('Backlog Projects', function () {
  before(async function () {
    app = express.init(mongoose);
    agent = request.agent(app);
  });
  beforeEach(async function () {
    var deploymentTypesResponse = await agent.post('/api/deploymenttypes/').send(validDeploymentType).expect(201);
    var teamsResponse = await agent.post('/api/teams/').send(validTeam).expect(201);
    backlogproject = _.cloneDeep(validBacklogProject);
    backlogproject = _.extend(backlogproject, {
      team_id: teamsResponse.body._id,
      deploymenttype_id: deploymentTypesResponse.body._id
    });
  });

  describe('POST', function () {
    it('should create a new backlogproject and update the db', async function () {
      var response = await agent.post('/api/backlogprojects').send(backlogproject).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal('/api/backlogprojects/' + response.body._id);
      var backlogprojectReturned = await BacklogProject.findById(response.body._id).lean().exec();
      response.body.should.containDeep(backlogproject);
      JSON.parse(JSON.stringify(backlogprojectReturned)).should.containDeep(backlogproject);
    });

    it('should not post more than one backlog project with the same name', async function () {
      var response = await agent.post('/api/backlogprojects').send(backlogproject).expect(201);
      response = await agent.post('/api/backlogprojects').send(backlogproject).expect(422);
      response.body.message.should.equal('Name already exists');
    });

    it('should allow two backlog projects with different names', async function () {
      var response = await agent.post('/api/backlogprojects').send(backlogproject).expect(201);
      backlogproject.name = 'secondBacklogProject';
      response = await agent.post('/api/backlogprojects').send(backlogproject).expect(201);
    });

    it('should respond with bad request with invalid json', async function () {
      backlogproject = '{';
      var response = await agent.post('/api/backlogprojects').send(backlogproject).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    requiredKeys.forEach(function (key) {
      it(`given key '${key}' is missing, it should return code 400`, async function () {
        delete backlogproject[key];
        var response = await agent.post('/api/backlogprojects').send(backlogproject).expect(400);
        response.body.message.should.equal('Path `' + key + '` is required.');
      });
    });

    keySpecificTestData.forEach(function (testData) {
      it(`Given that '${testData.key}' is set to ${testData.value}, ` +
      `it should return code ${testData.responseCode} and body should contain "${testData.responseString}"`, async function () {
        backlogproject[testData.key] = testData.value;
        var response = await agent.post('/api/backlogprojects').send(backlogproject).expect(testData.responseCode);
        if (testData.responseString) {
          response.body.message.should.containEql(testData.responseString);
        }
      });
    });
  });

  describe('GET', function () {
    it('should be able to get an empty backlog project list', async function () {
      var response = await agent.get('/api/backlogprojects').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should be able to get a backlog project list with one element', async function () {
      await agent.post('/api/backlogprojects').send(backlogproject).expect(201);
      var response = await agent.get('/api/backlogprojects').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(1);
      response.body[0].should.containDeep(backlogproject);
    });

    it('should be able to get a backlog project list with more than one element', async function () {
      await agent.post('/api/backlogprojects').send(backlogproject).expect(201);
      var secondBacklogProject = _.cloneDeep(backlogproject);
      secondBacklogProject.name = 'secondBacklogProject';
      await agent.post('/api/backlogprojects').send(secondBacklogProject).expect(201);
      var response = await agent.get('/api/backlogprojects').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(2);
      response.body[0].should.containDeep(secondBacklogProject);
      response.body[1].should.containDeep(backlogproject);
    });

    it('should be able to get a single backlog project', async function () {
      var response = await agent.post('/api/backlogprojects').send(backlogproject).expect(201);
      response = await agent.get('/api/backlogprojects/' + response.body._id).expect(200);
      response.body.should.containDeep(backlogproject);
    });

    it('should throw 404 when id is not in database', async function () {
      var response = await agent.get('/api/backlogprojects/000000000000000000000000').expect(404);
      response.body.message.should.equal('A backlog project with that id does not exist');
    });

    it('should throw 404 when an invalid id is used to search the db', async function () {
      var response = await agent.get('/api/backlogprojects/0').expect(404);
      response.body.message.should.equal('A backlog project with that id does not exist');
    });
  });

  describe('PUT', function () {
    it('should return the updated backlog project with the same id and the db should be updated', async function () {
      var response = await agent.post('/api/backlogprojects').send(backlogproject).expect(201);
      backlogproject.name = 'updatedName';
      var response2 = await agent.put('/api/backlogprojects/' + response.body._id).send(backlogproject).expect(200);
      var backlogprojectReturned = await BacklogProject.findById(response.body._id).lean().exec();
      response2.body._id.should.equal(response.body._id);
      response2.body.should.containDeep(backlogproject);
      JSON.parse(JSON.stringify(backlogprojectReturned)).should.containDeep(backlogproject);
    });

    it('should not update with more than one backlog project with the same name', async function () {
      await agent.post('/api/backlogprojects').send(backlogproject).expect(201);
      backlogproject.name = 'secondBacklogProject';
      var response = await agent.post('/api/backlogprojects').send(backlogproject).expect(201);
      backlogproject.name = validBacklogProject.name;
      response = await agent.put('/api/backlogprojects/' + response.body._id).send(backlogproject).expect(422);
      response.body.message.should.equal('Name already exists');
    });

    it('should respond with bad request with invalid json', async function () {
      var response = await agent.post('/api/backlogprojects').send(backlogproject).expect(201);
      backlogproject = '{';
      response = await agent.post('/api/backlogprojects/' + response.body._id).send(backlogproject).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    requiredKeys.forEach(function (key) {
      it(`given key '${key}' is missing, it should complete a partial update`, async function () {
        var response = await agent.post('/api/backlogprojects').send(backlogproject).expect(201);
        delete backlogproject[key];
        await agent.put('/api/backlogprojects/' + response.body._id).send(backlogproject).expect(200);
      });
    });

    keySpecificTestData.forEach(function (testData) {
      it(`Given that '${testData.key}' is set to ${testData.value}, ` +
      `it should return code ${testData.responseCode} and body should contain "${testData.responseString}"`, async function () {
        var response = await agent.post('/api/backlogprojects').send(backlogproject).expect(201);
        backlogproject[testData.key] = testData.value;
        var response2 = await agent.put('/api/backlogprojects/' + response.body._id).send(backlogproject).expect(testData.responseCodePut || testData.responseCode);
        if (testData.responseString) {
          response2.body.message.should.containEql(testData.responseString);
        }
      });
    });
  });

  describe('DELETE', function () {
    it('should delete a single backlog project', async function () {
      var response = await agent.post('/api/backlogprojects/').send(backlogproject).expect(201);
      response = await agent.delete('/api/backlogprojects/' + response.body._id).expect(200);
      response.body.should.containDeep(backlogproject);
      var count = await BacklogProject.count().exec();
      count.should.equal(0);
    });

    it('should have 1 element in db after 2 creations and 1 backlog project deletion', async function () {
      var secondValidPod = _.cloneDeep(backlogproject);
      secondValidPod.name = 'secondPod';
      var response = await agent.post('/api/backlogprojects/').send(backlogproject).expect(201);
      response = await agent.post('/api/backlogprojects/').send(secondValidPod).expect(201);
      response = await agent.delete('/api/backlogprojects/' + response.body._id).expect(200);
      var count = await BacklogProject.count().exec();
      count.should.equal(1);
    });

    it('should fail when attempting to delete a backlog project that does not exist', async function () {
      var response = await agent.delete('/api/backlogprojects/000000000000000000000000').expect(404);
      response.body.message.should.equal('A backlog project with that id does not exist');
    });

    it('should fail when attempting to delete a backlog project which has dependent plans', async function () {
      var backlogProjectsResponse = await agent.post('/api/backlogprojects').send(backlogproject).expect(201);
      var podsResponse = await agent.post('/api/pods').send(validPod).expect(201);
      var plan = _.cloneDeep(validPlan);
      plan.pods = [{
        pod_id: podsResponse.body._id,
        backlog_project_ids: [
          backlogProjectsResponse.body._id
        ]
      }];
      await agent.post('/api/plans').send(plan).expect(201);
      var backlogProjectsDeleteResponse = await agent.delete('/api/backlogprojects/' + backlogProjectsResponse.body._id).expect(422);
      backlogProjectsDeleteResponse.body.message.should.equal('Can\'t delete backlog project, it has 1 dependent plan');
      var count = await BacklogProject.count().exec();
      count.should.equal(1);
    });
  });

  afterEach(async function () {
    await Team.remove().exec();
    await DeploymentType.remove().exec();
    await BacklogProject.remove().exec();
    await Pod.remove().exec();
    await Plan.remove().exec();
  });
});
