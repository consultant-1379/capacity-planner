'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  Pod = mongoose.model('Pod'),
  Project = mongoose.model('Project'),
  Team = mongoose.model('Team'),
  DeploymentType = mongoose.model('DeploymentType'),
  _ = require('lodash'),
  express = require(path.resolve('./config/lib/express'));

var app,
  agent,
  project;

const validProject = {
  name: 'validProject',
  pod_id: '',
  team_id: '',
  deploymenttype_id: '',
  cpu: 100,
  memory_mb: 200,
  cinder_gb: 300
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

const requiredKeys = [
  'name',
  'pod_id',
  'team_id',
  'deploymenttype_id',
  'cpu',
  'memory_mb',
  'cinder_gb'
];

const integerKeys = [
  'cpu',
  'memory_mb',
  'cinder_gb'
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
    key: 'pod_id', value: 'invalid', responseCode: 400, responseString: 'Cast to ObjectID failed for value'
  }, {
    key: 'pod_id', value: '000000000000000000000000', responseCode: 422, responseString: 'The given pod id 000000000000000000000000 could not be found'
  }, {
    key: 'team_id', value: '000000000000000000000000', responseCode: 422, responseString: 'The given team id 000000000000000000000000 could not be found'
  }, {
    key: 'deploymenttype_id', value: '000000000000000000000000', responseCode: 422, responseString: 'The given deployment type id 000000000000000000000000 could not be found'
  }
]);

describe('Projects', function () {
  before(async function () {
    app = express.init(mongoose);
    agent = request.agent(app);
  });
  beforeEach(async function () {
    var deploymentTypesResponse = await agent.post('/api/deploymenttypes/').send(validDeploymentType).expect(201);
    var teamsResponse = await agent.post('/api/teams/').send(validTeam).expect(201);
    var podsResponse = await agent.post('/api/pods/').send(validPod).expect(201);
    project = _.cloneDeep(validProject);
    project = _.extend(project, {
      pod_id: podsResponse.body._id,
      team_id: teamsResponse.body._id,
      deploymenttype_id: deploymentTypesResponse.body._id
    });
  });

  describe('POST', function () {
    it('should create a new project and update the db', async function () {
      var response = await agent.post('/api/projects').send(project).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal('/api/projects/' + response.body._id);
      var projectReturned = await Project.findById(response.body._id).lean().exec();
      response.body.should.containDeep(project);
      JSON.parse(JSON.stringify(projectReturned)).should.containDeep(project);
    });

    it('should not post more than one project with the same name and pod id', async function () {
      var response = await agent.post('/api/projects').send(project).expect(201);
      response = await agent.post('/api/projects').send(project).expect(400);
      response.body.message.should.equal('You cannot have the same project name twice in the same pod');
    });

    it('should allow two projects with the same name and different pod id', async function () {
      var response = await agent.post('/api/projects').send(project).expect(201);
      var pod = _.cloneDeep(validPod);
      pod.name = 'secondPod';
      pod.authUrl = 'http://another.com';
      response = await agent.post('/api/pods').send(pod).expect(201);
      project.pod_id = response.body._id;
      response = await agent.post('/api/projects').send(project).expect(201);
    });

    it('should allow two projects with the different names and same pod id', async function () {
      var response = await agent.post('/api/projects').send(project).expect(201);
      project.name = 'secondProject';
      response = await agent.post('/api/projects').send(project).expect(201);
    });

    it('should respond with bad request with invalid json', async function () {
      project = '{';
      var response = await agent.post('/api/projects').send(project).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    requiredKeys.forEach(function (key) {
      it(`given key '${key}' is missing, it should return code 400`, async function () {
        delete project[key];
        var response = await agent.post('/api/projects').send(project).expect(400);
        response.body.message.should.equal('Path `' + key + '` is required.');
      });
    });

    keySpecificTestData.forEach(function (testData) {
      it(`Given that '${testData.key}' is set to ${testData.value}, ` +
      `it should return code ${testData.responseCode} and body should contain "${testData.responseString}"`, async function () {
        project[testData.key] = testData.value;
        var response = await agent.post('/api/projects').send(project).expect(testData.responseCode);
        if (testData.responseString) {
          response.body.message.should.containEql(testData.responseString);
        }
      });
    });
  });

  describe('GET', function () {
    it('should be able to get an empty project list', async function () {
      var response = await agent.get('/api/projects').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should be able to get a project list with one element', async function () {
      await agent.post('/api/projects').send(project).expect(201);
      var response = await agent.get('/api/projects').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(1);
      response.body[0].should.containDeep(project);
    });

    it('should be able to get a project list with more than one element', async function () {
      await agent.post('/api/projects').send(project).expect(201);
      var secondProject = _.cloneDeep(project);
      secondProject.name = 'secondProject';
      await agent.post('/api/projects').send(secondProject).expect(201);
      var response = await agent.get('/api/projects').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(2);
      response.body[0].should.containDeep(secondProject);
      response.body[1].should.containDeep(project);
    });

    it('should be able to get a single pproject', async function () {
      var response = await agent.post('/api/projects').send(project).expect(201);
      response = await agent.get('/api/projects/' + response.body._id).expect(200);
      response.body.should.containDeep(project);
    });

    it('should throw 404 when id is not in database', async function () {
      var response = await agent.get('/api/projects/000000000000000000000000').expect(404);
      response.body.message.should.equal('A project with that id does not exist');
    });

    it('should throw 404 when an invalid id is used to search the db', async function () {
      var response = await agent.get('/api/projects/0').expect(404);
      response.body.message.should.equal('A project with that id does not exist');
    });
  });

  describe('PUT', function () {
    it('should return the updated project with the same id and the db should be updated', async function () {
      var response = await agent.post('/api/projects').send(project).expect(201);
      project.name = 'updatedName';
      var response2 = await agent.put('/api/projects/' + response.body._id).send(project).expect(200);
      var projectReturned = await Project.findById(response.body._id).lean().exec();
      response2.body._id.should.equal(response.body._id);
      response2.body.should.containDeep(project);
      JSON.parse(JSON.stringify(projectReturned)).should.containDeep(project);
    });

    it('should not update with more than one project with the same name in the same pod', async function () {
      await agent.post('/api/projects').send(project).expect(201);
      project.name = 'secondProject';
      var response = await agent.post('/api/projects').send(project).expect(201);
      project.name = validProject.name;
      response = await agent.put('/api/projects/' + response.body._id).send(project).expect(400);
      response.body.message.should.equal('You cannot have the same project name twice in the same pod');
    });

    it('should respond with bad request with invalid json', async function () {
      var response = await agent.post('/api/projects').send(project).expect(201);
      project = '{';
      response = await agent.post('/api/projects/' + response.body._id).send(project).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    keySpecificTestData.forEach(function (testData) {
      it(`Given that '${testData.key}' is set to ${testData.value}, ` +
      `it should return code ${testData.responseCode} and body should contain "${testData.responseString}"`, async function () {
        var response = await agent.post('/api/projects').send(project).expect(201);
        project[testData.key] = testData.value;
        var response2 = await agent.put('/api/projects/' + response.body._id).send(project).expect(testData.responseCodePut || testData.responseCode);
        if (testData.responseString) {
          response2.body.message.should.containEql(testData.responseString);
        }
      });
    });
  });

  describe('DELETE', function () {
    it('should delete a single project', async function () {
      var response = await agent.post('/api/projects/').send(project).expect(201);
      response = await agent.delete('/api/projects/' + response.body._id).expect(200);
      response.body.should.containDeep(project);
      var count = await Project.count().exec();
      count.should.equal(0);
    });

    it('should have 1 element in db after 2 creations and 1 project deletion', async function () {
      var secondValidPod = _.cloneDeep(project);
      secondValidPod.name = 'secondPod';
      var response = await agent.post('/api/projects/').send(project).expect(201);
      response = await agent.post('/api/projects/').send(secondValidPod).expect(201);
      response = await agent.delete('/api/projects/' + response.body._id).expect(200);
      var count = await Project.count().exec();
      count.should.equal(1);
    });

    it('should fail when attempting to delete a project that does not exist', async function () {
      var response = await agent.delete('/api/projects/000000000000000000000000').expect(404);
      response.body.message.should.equal('A project with that id does not exist');
    });
  });

  afterEach(async function () {
    await Project.remove().exec();
    await Pod.remove().exec();
    await Team.remove().exec();
    await DeploymentType.remove().exec();
  });
});
