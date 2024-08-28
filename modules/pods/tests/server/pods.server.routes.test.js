'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  Pod = mongoose.model('Pod'),
  Project = mongoose.model('Project'),
  Team = mongoose.model('Team'),
  DeploymentType = mongoose.model('DeploymentType'),
  BacklogProject = mongoose.model('BacklogProject'),
  Plan = mongoose.model('Plan'),
  _ = require('lodash'),
  express = require(path.resolve('./config/lib/express'));

var app,
  agent,
  pod;

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

const validProject = {
  name: 'validProject',
  pod_id: '',
  team_id: '',
  deploymenttype_id: '',
  cpu: 100,
  memory_mb: 200,
  cinder_gb: 300
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

const validBacklogProject = {
  name: 'validBacklogProject',
  team_id: '',
  deploymenttype_id: ''
};

const requiredKeys = [
  'name',
  'authUrl',
  'project',
  'username',
  'password',
  'cpu',
  'memory_mb',
  'cinder_gb',
  'cinder_iops',
  'enfs_gb',
  'enfs_iops',
  'cpu_contention_ratio'
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
    key: 'name', value: 'xxxx', responseCode: 400, responseString: 'Path `name` (`xxxx`) is shorter than the minimum allowed length (5).'
  }, {
    key: 'name', value: 'xxxxx', responseCode: 201, responseCodePut: 200
  }, {
    key: 'name', value: 'xxxxxxxxxxxxxxxxxxxx', responseCode: 201, responseCodePut: 200
  }, {
    key: 'name', value: 'xxxxxxxxxxxxxxxxxxxxx', responseCode: 400, responseString: 'Path `name` (`xxxxxxxxxxxxxxxxxxxxx`) is longer than the maximum allowed length (20).'
  }, {
    key: 'authUrl', value: 'htp://', responseCode: 400, responseString: 'htp:// is not correct. The authUrl must be a valid url.'
  }, {
    key: 'cpu_contention_ratio', value: 0, responseCode: 400, responseString: 'Path `cpu_contention_ratio` (0) is less than minimum allowed value (0.01).'
  }, {
    key: 'cpu_contention_ratio', value: 0.01, responseCode: 201, responseCodePut: 200
  }
]);

describe('Pods', function () {
  before(async function () {
    app = express.init(mongoose);
    agent = request.agent(app);
  });
  beforeEach(async function () {
    pod = _.cloneDeep(validPod);
  });
  describe('POST', function () {
    it('should create a new pod and update the db', async function () {
      var response = await agent.post('/api/pods').send(pod).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal('/api/pods/' + response.body._id);
      var podReturned = await Pod.findById(response.body._id).exec();
      response.body.should.containDeep(pod);
      podReturned.should.containDeep(pod);
    });

    it('should not post more than one pod with the same name', async function () {
      var response = await agent.post('/api/pods').send(pod).expect(201);
      response = await agent.post('/api/pods').send(pod).expect(422);
      response.body.message.should.equal('Name already exists');
    });

    it('should not post more than one pod with the same authUrl', async function () {
      await agent.post('/api/pods').send(pod).expect(201);
      pod.name = 'secondPod';
      var response = await agent.post('/api/pods').send(pod).expect(422);
      response.body.message.should.equal('AuthUrl already exists');
    });

    it('should respond with bad request with invalid json', async function () {
      pod = '{';
      var response = await agent.post('/api/pods').send(pod).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    requiredKeys.forEach(function (key) {
      it(`given key '${key}' is missing, it should return code 400`, async function () {
        delete pod[key];
        var response = await agent.post('/api/pods').send(pod).expect(400);
        response.body.message.should.equal('Path `' + key + '` is required.');
      });
    });

    keySpecificTestData.forEach(function (testData) {
      it(`Given that '${testData.key}' is set to ${testData.value}, ` +
      `it should return code ${testData.responseCode} and body should contain "${testData.responseString}"`, async function () {
        pod[testData.key] = testData.value;
        var response = await agent.post('/api/pods').send(pod).expect(testData.responseCode);
        if (testData.responseString) {
          response.body.message.should.containEql(testData.responseString);
        }
      });
    });
  });

  describe('GET', function () {
    it('should be able to get an empty pod list', async function () {
      var response = await agent.get('/api/pods').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should be able to get a pod list with one element', async function () {
      await agent.post('/api/pods').send(pod).expect(201);
      var response = await agent.get('/api/pods').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(1);
      response.body[0].should.containDeep(pod);
    });

    it('should be able to get a pod list with more than one element', async function () {
      await agent.post('/api/pods').send(pod).expect(201);
      var secondValidPod = _.cloneDeep(pod);
      secondValidPod.name = 'secondPod';
      secondValidPod.authUrl = 'http://another.com';
      await agent.post('/api/pods').send(secondValidPod).expect(201);
      var response = await agent.get('/api/pods').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(2);
      response.body[0].should.containDeep(secondValidPod);
      response.body[1].should.containDeep(pod);
    });

    it('should be able to get a single pod', async function () {
      var response = await agent.post('/api/pods').send(pod).expect(201);
      response = await agent.get('/api/pods/' + response.body._id).expect(200);
      response.body.should.containDeep(pod);
    });

    it('should throw 404 when id is not in database', async function () {
      var response = await agent.get('/api/pods/000000000000000000000000').expect(404);
      response.body.message.should.equal('A pod with that id does not exist');
    });

    it('should throw 404 when an invalid id is used to search the db', async function () {
      var response = await agent.get('/api/pods/0').expect(404);
      response.body.message.should.equal('A pod with that id does not exist');
    });
  });

  describe('PUT', function () {
    it('should return the updated pod with the same id and the db should be updated', async function () {
      var response = await agent.post('/api/pods').send(pod).expect(201);
      pod.name = 'updatedName';
      var response2 = await agent.put('/api/pods/' + response.body._id).send(pod).expect(200);
      var podReturned = await Pod.findById(response.body._id).exec();
      response2.body._id.should.equal(response.body._id);
      response2.body.should.containDeep(pod);
      podReturned.should.containDeep(pod);
    });

    it('should not update with more than one pod with the same name', async function () {
      await agent.post('/api/pods').send(pod).expect(201);
      var secondValidPod = _.cloneDeep(pod);
      secondValidPod.name = 'secondPod';
      secondValidPod.authUrl = 'http://another.com';
      var response = await agent.post('/api/pods').send(secondValidPod).expect(201);
      secondValidPod.name = pod.name;
      response = await agent.put('/api/pods/' + response.body._id).send(secondValidPod).expect(422);
      response.body.message.should.equal('Name already exists');
    });

    it('should not update with more than one pod with the same authUrl', async function () {
      await agent.post('/api/pods').send(pod).expect(201);
      var secondValidPod = _.cloneDeep(pod);
      secondValidPod.name = 'secondPod';
      secondValidPod.authUrl = 'http://another.com';
      var response = await agent.post('/api/pods').send(secondValidPod).expect(201);
      secondValidPod.authUrl = pod.authUrl;
      response = await agent.put('/api/pods/' + response.body._id).send(secondValidPod).expect(422);
      response.body.message.should.equal('AuthUrl already exists');
    });

    it('should respond with bad request with invalid json', async function () {
      var response = await agent.post('/api/pods').send(pod).expect(201);
      pod = '{';
      response = await agent.post('/api/pods/' + response.body._id).send(pod).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    keySpecificTestData.forEach(function (testData) {
      it(`Given that '${testData.key}' is set to ${testData.value}, ` +
      `it should return code ${testData.responseCode} and body should contain "${testData.responseString}"`, async function () {
        var response = await agent.post('/api/pods').send(pod).expect(201);
        pod[testData.key] = testData.value;
        var response2 = await agent.put('/api/pods/' + response.body._id).send(pod).expect(testData.responseCodePut || testData.responseCode);
        if (testData.responseString) {
          response2.body.message.should.containEql(testData.responseString);
        }
      });
    });
  });

  describe('DELETE', function () {
    it('should delete a single pod', async function () {
      var response = await agent.post('/api/pods/').send(pod).expect(201);
      response = await agent.delete('/api/pods/' + response.body._id).expect(200);
      response.body.should.containDeep(pod);
      var count = await Pod.count().exec();
      count.should.equal(0);
    });

    it('should have 1 element in db after 2 creations and 1 pod deletion', async function () {
      var secondValidPod = _.cloneDeep(pod);
      secondValidPod.name = 'secondPod';
      secondValidPod.authUrl = 'http://another.com';
      var response = await agent.post('/api/pods/').send(pod).expect(201);
      response = await agent.post('/api/pods/').send(secondValidPod).expect(201);
      response = await agent.delete('/api/pods/' + response.body._id).expect(200);
      var count = await Pod.count().exec();
      count.should.equal(1);
    });

    it('should fail when attempting to delete a pod that does not exist', async function () {
      var response = await agent.delete('/api/pods/000000000000000000000000').expect(404);
      response.body.message.should.equal('A pod with that id does not exist');
    });

    it('should fail when attempting to delete a pod which has dependent projects', async function () {
      var deploymentTypesResponse = await agent.post('/api/deploymenttypes/').send(validDeploymentType).expect(201);
      var teamsResponse = await agent.post('/api/teams/').send(validTeam).expect(201);
      var podsResponse = await agent.post('/api/pods/').send(pod).expect(201);
      var project = _.clone(validProject);
      project = _.extend(project, {
        pod_id: podsResponse.body._id,
        team_id: teamsResponse.body._id,
        deploymenttype_id: deploymentTypesResponse.body._id
      });
      var projectsResponse = await agent.post('/api/projects/').send(project).expect(201);
      podsResponse = await agent.delete('/api/pods/' + podsResponse.body._id).expect(422);
      podsResponse.body.message.should.equal('Can\'t delete pod, it has 1 dependent project');
      var count = await Pod.count().exec();
      count.should.equal(1);
    });

    it('should fail when attempting to delete a pod which has dependent plans', async function () {
      var deploymentTypesResponse = await agent.post('/api/deploymenttypes/').send(validDeploymentType).expect(201);
      var teamsResponse = await agent.post('/api/teams/').send(validTeam).expect(201);
      var podsResponse = await agent.post('/api/pods/').send(pod).expect(201);
      var backlogproject = _.cloneDeep(validBacklogProject);
      backlogproject = _.extend(backlogproject, {
        team_id: teamsResponse.body._id,
        deploymenttype_id: deploymentTypesResponse.body._id
      });
      var backlogProjectsResponse = await agent.post('/api/backlogprojects').send(backlogproject).expect(201);
      var plan = _.cloneDeep(validPlan);
      plan.pods = [{
        pod_id: podsResponse.body._id,
        backlog_project_ids: [
          backlogProjectsResponse.body._id
        ]
      }];
      var plansResponse = await agent.post('/api/plans').send(plan).expect(201);
      podsResponse = await agent.delete('/api/pods/' + podsResponse.body._id).expect(422);
      podsResponse.body.message.should.equal('Can\'t delete pod, it has 1 dependent plan');
      var count = await Pod.count().exec();
      count.should.equal(1);
    });
  });

  afterEach(async function () {
    await Project.remove().exec();
    await Pod.remove().exec();
    await Team.remove().exec();
    await DeploymentType.remove().exec();
    await BacklogProject.remove().exec();
    await Plan.remove().exec();
  });
});
