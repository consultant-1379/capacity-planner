'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  Pod = mongoose.model('Pod'),
  Project = mongoose.model('Project'),
  BacklogProject = mongoose.model('BacklogProject'),
  Team = mongoose.model('Team'),
  DeploymentType = mongoose.model('DeploymentType'),
  _ = require('lodash'),
  express = require(path.resolve('./config/lib/express'));

var app,
  agent,
  deploymentType;

const validDeploymentType = {
  name: 'deploymentType',
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

const validTeam = {
  name: 'validTeam'
};

const validPod = {
  name: 'validPod',
  authUrl: 'http://pod.athtem.eei.ericsson.se:5000/v2.0',
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
  'cpu',
  'memory_mb',
  'cinder_gb',
  'cinder_iops',
  'enfs_gb',
  'enfs_iops'
];

const integerKeys = [
  'cpu',
  'memory_mb',
  'cinder_gb',
  'cinder_iops',
  'enfs_gb',
  'enfs_iops'
];

var integerKeysTestData = [];
integerKeys.forEach(function (key) {
  integerKeysTestData = integerKeysTestData.concat([
    {
      key: key, value: 0, responseCode: 201, responseCodePut: 200
    }, {
      key: key, value: -1, responseCode: 400, responseString: `Path \`${key}\` (-1) is less than minimum allowed value (0).`
    }, {
      key: key, value: 1.1, responseCode: 400, responseString: `${key} is not valid, 1.1 is not an integer`
    }, {
      key: key, value: 'a', responseCode: 400, responseString: `Cast to Number failed for value "a" at path "${key}"`
    }
  ]);
});

const keySpecificTestData = integerKeysTestData.concat([
  {
    key: 'rogueKey', value: 'rogueValue', responseCode: 400, responseString: 'Field `rogueKey` is not in schema and strict mode is set to throw.'
  }, {
    key: 'name', value: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', responseCode: 201, responseCodePut: 200
  }, {
    key: 'name', value: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', responseCode: 400, responseString: 'Path `name` (`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`) is longer than the maximum allowed length (50).'
  }
]);

describe('Deployment Types', function () {
  before(async function () {
    app = express.init(mongoose);
    agent = request.agent(app);
  });
  beforeEach(async function () {
    deploymentType = _.cloneDeep(validDeploymentType);
  });

  describe('POST', function () {
    it('should create a new deployment type and update the db', async function () {
      var response = await agent.post('/api/deploymenttypes').send(deploymentType).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal('/api/deploymenttypes/' + response.body._id);
      var deploymentTypeReturned = await DeploymentType.findById(response.body._id).exec();
      response.body.should.containDeep(deploymentType);
      deploymentTypeReturned.should.containDeep(deploymentType);
    });

    it('should not post more than one deployment type with the same name', async function () {
      var response = await agent.post('/api/deploymenttypes').send(deploymentType).expect(201);
      response = await agent.post('/api/deploymenttypes').send(deploymentType).expect(422);
      response.body.message.should.equal('Name already exists');
    });

    it('should respond with bad request with invalid json', async function () {
      deploymentType = '{';
      var response = await agent.post('/api/deploymenttypes').send(deploymentType).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    requiredKeys.forEach(function (key) {
      it(`given key '${key}' is missing, it should return code 400`, async function () {
        delete deploymentType[key];
        var response = await agent.post('/api/deploymenttypes').send(deploymentType).expect(400);
        response.body.message.should.equal('Path `' + key + '` is required.');
      });
    });

    keySpecificTestData.forEach(function (testData) {
      it(`Given that '${testData.key}' is set to ${testData.value}, ` +
      `it should return code ${testData.responseCode} and body should contain "${testData.responseString}"`, async function () {
        deploymentType[testData.key] = testData.value;
        var response = await agent.post('/api/deploymenttypes').send(deploymentType).expect(testData.responseCode);
        if (testData.responseString) {
          response.body.message.should.containEql(testData.responseString);
        }
      });
    });
  });

  describe('GET', function () {
    it('should be able to get an empty deployment type list', async function () {
      var response = await agent.get('/api/deploymenttypes').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should be able to get a deployment type list with one element', async function () {
      await agent.post('/api/deploymenttypes').send(deploymentType).expect(201);
      var response = await agent.get('/api/deploymenttypes').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(1);
      response.body[0].should.containDeep(deploymentType);
    });

    it('should be able to get a deployment type list with more than one element', async function () {
      await agent.post('/api/deploymenttypes').send(deploymentType).expect(201);
      var secondDeploymentType = _.cloneDeep(deploymentType);
      secondDeploymentType.name = 'secondDeploymentType';
      await agent.post('/api/deploymenttypes').send(secondDeploymentType).expect(201);
      var response = await agent.get('/api/deploymenttypes').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(2);
      response.body[0].should.containDeep(deploymentType);
      response.body[1].should.containDeep(secondDeploymentType);
    });

    it('should be able to get a single deployment type', async function () {
      var response = await agent.post('/api/deploymenttypes').send(deploymentType).expect(201);
      response = await agent.get('/api/deploymenttypes/' + response.body._id).expect(200);
      response.body.should.containDeep(deploymentType);
    });

    it('should throw 404 when id is not in database', async function () {
      var response = await agent.get('/api/deploymenttypes/000000000000000000000000').expect(404);
      response.body.message.should.equal('A deployment type with that id does not exist');
    });

    it('should throw 404 when an invalid id is used to search the db', async function () {
      var response = await agent.get('/api/deploymenttypes/0').expect(404);
      response.body.message.should.equal('A deployment type with that id does not exist');
    });
  });

  describe('PUT', function () {
    it('should return the updated deployment type with the same id and the db should be updated', async function () {
      var response = await agent.post('/api/deploymenttypes').send(deploymentType).expect(201);
      deploymentType.name = 'updatedName';
      var response2 = await agent.put('/api/deploymenttypes/' + response.body._id).send(deploymentType).expect(200);
      var deploymentTypeReturned = await DeploymentType.findById(response.body._id).exec();
      response2.body._id.should.equal(response.body._id);
      response2.body.should.containDeep(deploymentType);
      deploymentTypeReturned.should.containDeep(deploymentType);
    });

    it('should not update with more than one deployment type with the same name', async function () {
      await agent.post('/api/deploymenttypes').send(deploymentType).expect(201);
      var secondDeploymentType = _.cloneDeep(deploymentType);
      secondDeploymentType.name = 'secondDeploymentType';
      var response = await agent.post('/api/deploymenttypes').send(secondDeploymentType).expect(201);
      secondDeploymentType.name = deploymentType.name;
      response = await agent.put('/api/deploymenttypes/' + response.body._id).send(secondDeploymentType).expect(422);
      response.body.message.should.equal('Name already exists');
    });

    it('should respond with bad request with invalid json', async function () {
      var response = await agent.post('/api/deploymenttypes').send(deploymentType).expect(201);
      deploymentType = '{';
      response = await agent.post('/api/deploymenttypes/' + response.body._id).send(deploymentType).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    keySpecificTestData.forEach(function (testData) {
      it(`Given that '${testData.key}' is set to ${testData.value}, ` +
      `it should return code ${testData.responseCode} and body should contain "${testData.responseString}"`, async function () {
        var response = await agent.post('/api/deploymenttypes').send(deploymentType).expect(201);
        deploymentType[testData.key] = testData.value;
        var response2 = await agent.put('/api/deploymenttypes/' + response.body._id).send(deploymentType).expect(testData.responseCodePut || testData.responseCode);
        if (testData.responseString) {
          response2.body.message.should.containEql(testData.responseString);
        }
      });
    });
  });

  describe('DELETE', function () {
    it('should delete a single pod', async function () {
      var response = await agent.post('/api/deploymenttypes/').send(deploymentType).expect(201);
      response = await agent.delete('/api/deploymenttypes/' + response.body._id).expect(200);
      response.body.should.containDeep(deploymentType);
      var count = await DeploymentType.count().exec();
      count.should.equal(0);
    });

    it('should have 1 element in db after 2 creations and 1 deployment type deletion', async function () {
      var secondDeploymentType = _.cloneDeep(deploymentType);
      secondDeploymentType.name = 'secondDeploymentType';
      var response = await agent.post('/api/deploymenttypes/').send(deploymentType).expect(201);
      response = await agent.post('/api/deploymenttypes/').send(secondDeploymentType).expect(201);
      response = await agent.delete('/api/deploymenttypes/' + response.body._id).expect(200);
      var count = await DeploymentType.count().exec();
      count.should.equal(1);
    });

    it('should fail when attempting to delete a deployment type that does not exist', async function () {
      var response = await agent.delete('/api/deploymenttypes/000000000000000000000000').expect(404);
      response.body.message.should.equal('A deployment type with that id does not exist');
    });

    it('should fail when attempting to delete a deployment type which has dependent projects', async function () {
      var deploymentTypesResponse = await agent.post('/api/deploymenttypes/').send(deploymentType).expect(201);
      var teamsResponse = await agent.post('/api/teams/').send(validTeam).expect(201);
      var podsResponse = await agent.post('/api/pods/').send(validPod).expect(201);
      var project = _.cloneDeep(validProject);
      _.extend(project, {
        pod_id: podsResponse.body._id,
        team_id: teamsResponse.body._id,
        deploymenttype_id: deploymentTypesResponse.body._id
      });
      var projectsResponse = await agent.post('/api/projects/').send(project).expect(201);
      deploymentTypesResponse = await agent.delete('/api/deploymenttypes/' + deploymentTypesResponse.body._id).expect(422);
      deploymentTypesResponse.body.message.should.equal('Can\'t delete deployment type, it has 1 dependent project');
      var count = await DeploymentType.count().exec();
      count.should.equal(1);
    });

    it('should fail when attempting to delete a deployment type which has dependent backlog projects', async function () {
      var deploymentTypesResponse = await agent.post('/api/deploymenttypes/').send(deploymentType).expect(201);
      var teamsResponse = await agent.post('/api/teams/').send(validTeam).expect(201);
      var backlogProject = _.cloneDeep(validBacklogProject);
      _.extend(backlogProject, {
        team_id: teamsResponse.body._id,
        deploymenttype_id: deploymentTypesResponse.body._id
      });
      await agent.post('/api/backlogprojects/').send(backlogProject).expect(201);
      deploymentTypesResponse = await agent.delete('/api/deploymenttypes/' + deploymentTypesResponse.body._id).expect(422);
      deploymentTypesResponse.body.message.should.equal('Can\'t delete deployment type, it has 1 dependent backlogproject');
      var count = await DeploymentType.count().exec();
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
