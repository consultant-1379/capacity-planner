'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  Plan = mongoose.model('Plan'),
  Pod = mongoose.model('Pod'),
  Project = mongoose.model('Project'),
  BacklogProject = mongoose.model('BacklogProject'),
  DeploymentType = mongoose.model('DeploymentType'),
  Team = mongoose.model('Team'),
  _ = require('lodash'),
  express = require(path.resolve('./config/lib/express'));

var app,
  agent,
  plan;

const validPlan = {
  name: 'validPlan',
  pods: [],
  status: 'IN PROGRESS'
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

const validBacklogProject = {
  name: 'validBacklogProject',
  team_id: '',
  deploymenttype_id: ''
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

const requiredKeys = [
  'name',
  'pods[0].pod_id',
  'status'
];

const keySpecificTestData = [
  {
    key: 'rogueKey', value: 'rogueValue', responseCode: 400, responseString: 'Field `rogueKey` is not in schema and strict mode is set to throw.'
  }, {
    key: 'pods[0].rogueKey', value: 'rogueValue', responseCode: 400, responseString: 'Cast to Array failed for value'
  }, {
    key: 'name', value: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', responseCode: 201, responseCodePut: 200
  }, {
    key: 'name', value: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', responseCode: 400, responseString: 'Path `name` (`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`) is longer than the maximum allowed length (50).'
  }, {
    key: 'status', value: 'INVALID', responseCode: 400, responseString: '`INVALID` is not a valid enum value for path `status`'
  }, {
    key: 'status', value: 'IN PROGRESS', responseCode: 201, responseCodePut: 200
  }, {
    key: 'status', value: 'READY', responseCode: 201, responseCodePut: 200
  }, {
    key: 'pods', value: [], responseCode: 201, responseCodePut: 200
  }, {
    key: 'pods[0].pod_id', value: 'invalid', responseCode: 400, responseString: 'Cast to ObjectID failed for value'
  }, {
    key: 'pods[0].pod_id', value: '000000000000000000000000', responseCode: 422, responseString: 'The given pod id 000000000000000000000000 could not be found'
  }, {
    key: 'pods[0].backlog_project_ids', value: [], responseCode: 201, responseCodePut: 200
  }, {
    key: 'pods[0].backlog_project_ids[0]', value: 'invalid', responseCode: 400, responseString: 'Cast to Array failed for value'
  }, {
    key: 'pods[0].backlog_project_ids[0]', value: '000000000000000000000000', responseCode: 422, responseString: 'The given backlog project id 000000000000000000000000 could not be found'
  }, {
    key: 'pods[0].deleted_project_ids', value: [], responseCode: 201, responseCodePut: 200
  }, {
    key: 'pods[0].deleted_project_ids[0]', value: 'invalid', responseCode: 400, responseString: 'Cast to Array failed for value'
  }, {
    key: 'pods[0].deleted_project_ids[0]', value: '000000000000000000000000', responseCode: 422, responseString: 'The given deleted project id 000000000000000000000000 could not be found'
  }, {
    key: 'pods[0].per_plan_project_ids', value: [], responseCode: 201, responseCodePut: 200
  }, {
    key: 'pods[0].per_plan_project_ids[0]', value: 'invalid', responseCode: 400, responseString: 'Cast to Array failed for value'
  }, {
    key: 'pods[0].per_plan_project_ids[0]', value: '000000000000000000000000', responseCode: 422, responseString: 'The given per plan project id 000000000000000000000000 could not be found'
  }
];

describe('Plans', function () {
  before(async function () {
    app = express.init(mongoose);
    agent = request.agent(app);
  });
  beforeEach(async function () {
    var deploymentTypesResponse = await agent.post('/api/deploymenttypes/').send(validDeploymentType).expect(201);
    var teamsResponse = await agent.post('/api/teams/').send(validTeam).expect(201);
    var backlogProject = _.cloneDeep(validBacklogProject);
    backlogProject = _.extend(backlogProject, {
      team_id: teamsResponse.body._id,
      deploymenttype_id: deploymentTypesResponse.body._id
    });
    var backlogProjectsResponse = await agent.post('/api/backlogprojects/').send(backlogProject).expect(201);
    var podsResponse = await agent.post('/api/pods/').send(validPod).expect(201);
    plan = _.cloneDeep(validPlan);
    plan.pods = [{
      pod_id: podsResponse.body._id,
      backlog_project_ids: [
        backlogProjectsResponse.body._id
      ],
      deleted_project_ids: [
      ],
      per_plan_project_ids: [
      ]
    }];
  });

  describe('POST', function () {
    it('should create a new plan and update the db', async function () {
      var response = await agent.post('/api/plans').send(plan).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal('/api/plans/' + response.body._id);
      var planReturned = await Plan.findById(response.body._id).lean().exec();
      response.body.should.containDeep(plan);
      JSON.parse(JSON.stringify(planReturned)).should.containDeep(plan);
    });

    it('should create a new plan with deleted project and update the db', async function () {
      var podsResponse = await agent.get('/api/pods/');
      var deploymentTypesResponse = await agent.get('/api/deploymenttypes/');
      var teamsResponse = await agent.get('/api/teams/');
      var deletedProject = _.cloneDeep(validBacklogProject);
      deletedProject = _.extend(validProject, {
        name: 'deletedProject',
        pod_id: podsResponse.body[0]._id,
        team_id: teamsResponse.body[0]._id,
        deploymenttype_id: deploymentTypesResponse.body[0]._id
      });
      var deletedProjectsResponse = await agent.post('/api/projects/').send(deletedProject).expect(201);
      plan.pods[0].deleted_project_ids.push(deletedProjectsResponse.body._id);
      var response = await agent.post('/api/plans').send(plan).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal('/api/plans/' + response.body._id);
      var planReturned = await Plan.findById(response.body._id).lean().exec();
      response.body.should.containDeep(plan);
      JSON.parse(JSON.stringify(planReturned)).should.containDeep(plan);
    });

    it('should create a new plan with a perPlanProject and update the db', async function () {
      var podsResponse = await agent.get('/api/pods/');
      var deploymentTypesResponse = await agent.get('/api/deploymenttypes/');
      var teamsResponse = await agent.get('/api/teams/');
      var perPlanProject = _.cloneDeep(validBacklogProject);
      perPlanProject = _.extend(validProject, {
        name: 'perPlanProject',
        pod_id: podsResponse.body[0]._id,
        team_id: teamsResponse.body[0]._id,
        deploymenttype_id: deploymentTypesResponse.body[0]._id
      });
      var perPlanProjectsResponse = await agent.post('/api/projects/').send(perPlanProject).expect(201);
      var secondValidPod = _.cloneDeep(validPod);
      secondValidPod.name = 'newValidPod';
      secondValidPod.authUrl = 'http://pod.athtem.eei.ericsson.se:5000/v1.0';
      var secondPodsResponse = await agent.post('/api/pods/').send(secondValidPod).expect(201);
      plan.pods.push({
        pod_id: secondPodsResponse.body._id,
        backlog_project_ids: [
        ],
        deleted_project_ids: [
        ],
        per_plan_project_ids: [
          perPlanProjectsResponse.body._id
        ]
      });
      plan.pods[0].deleted_project_ids = [
        perPlanProjectsResponse.body._id
      ];
      var response = await agent.post('/api/plans').send(plan).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal('/api/plans/' + response.body._id);
      var planReturned = await Plan.findById(response.body._id).lean().exec();
      response.body.should.containDeep(plan);
      JSON.parse(JSON.stringify(planReturned)).should.containDeep(plan);
    });

    it('should not post more than one plan with the same name', async function () {
      var response = await agent.post('/api/plans').send(plan).expect(201);
      response = await agent.post('/api/plans').send(plan).expect(422);
      response.body.message.should.equal('Name already exists');
    });

    it('should respond with bad request with invalid json', async function () {
      plan = '{';
      var response = await agent.post('/api/plans').send(plan).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    it('should respond with unprocessable entity with duplicate pod_ids', async function () {
      plan.pods.push(plan.pods[0]);
      var response = await agent.post('/api/plans').send(plan).expect(422);
      response.body.message.should.equal('There are duplicate pod ids assigned to this plan.');
    });

    it('should respond with unprocessable entity with duplicate backlog project ids', async function () {
      plan.pods[0].backlog_project_ids.push(plan.pods[0].backlog_project_ids[0]);
      var response = await agent.post('/api/plans').send(plan).expect(422);
      response.body.message.should.equal('There are duplicate backlog project ids assigned to this plan.');
    });

    it('should respond with unprocessable entity with duplicate deleted project ids', async function () {
      var podsResponse = await agent.get('/api/pods/');
      var deploymentTypesResponse = await agent.get('/api/deploymenttypes/');
      var teamsResponse = await agent.get('/api/teams/');
      var deletedProject = _.cloneDeep(validBacklogProject);
      deletedProject = _.extend(validProject, {
        name: 'deletedProject',
        pod_id: podsResponse.body[0]._id,
        team_id: teamsResponse.body[0]._id,
        deploymenttype_id: deploymentTypesResponse.body[0]._id
      });
      var deletedProjectsResponse = await agent.post('/api/projects/').send(deletedProject).expect(201);
      plan.pods[0].deleted_project_ids.push(deletedProjectsResponse.body._id);
      var response = await agent.post('/api/plans').send(plan).expect(201);
      plan.pods[0].deleted_project_ids.push(deletedProjectsResponse.body._id);
      response = await agent.post('/api/plans').send(plan).expect(422);
      response.body.message.should.equal('There are duplicate deleted project ids assigned to this plan.');
    });

    it('should respond with unprocessable entity when deleted project does not belong to the pod', async function () {
      var secondValidPod = _.cloneDeep(validPod);
      secondValidPod.name = 'newValidPod';
      secondValidPod.authUrl = 'http://pod.athtem.eei.ericsson.se:50001/v1.0';
      var podsResponse = await agent.post('/api/pods/').send(secondValidPod).expect(201);
      var deploymentTypesResponse = await agent.get('/api/deploymenttypes/');
      var teamsResponse = await agent.get('/api/teams/');
      var deletedProject = _.cloneDeep(validBacklogProject);
      deletedProject = _.extend(validProject, {
        pod_id: podsResponse.body._id,
        team_id: teamsResponse.body[0]._id,
        deploymenttype_id: deploymentTypesResponse.body[0]._id
      });
      var deletedProjectsResponse = await agent.post('/api/projects/').send(deletedProject).expect(201);
      plan.pods[0].deleted_project_ids.push(deletedProjectsResponse.body._id);
      var response = await agent.post('/api/plans').send(plan).expect(422);
      response.body.message.should.equal('The given deleted project id ' + deletedProjectsResponse.body._id + ' could not be found in pod id' + plan.pods[0].pod_id);
    });

    it('should respond with unprocessable entity with duplicate per plan project ids', async function () {
      var podsResponse = await agent.get('/api/pods/');
      var deploymentTypesResponse = await agent.get('/api/deploymenttypes/');
      var teamsResponse = await agent.get('/api/teams/');
      var perPlanProject = _.cloneDeep(validBacklogProject);
      perPlanProject = _.extend(validProject, {
        name: 'perPlanProject',
        pod_id: podsResponse.body[0]._id,
        team_id: teamsResponse.body[0]._id,
        deploymenttype_id: deploymentTypesResponse.body[0]._id
      });
      var perPlanProjectsResponse = await agent.post('/api/projects/').send(perPlanProject).expect(201);
      var secondValidPod = _.cloneDeep(validPod);
      secondValidPod.name = 'newValidPod';
      secondValidPod.authUrl = 'http://pod.athtem.eei.ericsson.se:5000/v1.0';
      var secondPodsResponse = await agent.post('/api/pods/').send(secondValidPod).expect(201);
      plan.pods.push({
        pod_id: secondPodsResponse.body._id,
        backlog_project_ids: [
        ],
        deleted_project_ids: [
        ],
        per_plan_project_ids: [
          perPlanProjectsResponse.body._id
        ]
      });
      plan.pods[0].deleted_project_ids = [
        perPlanProjectsResponse.body._id
      ];
      var response = await agent.post('/api/plans').send(plan).expect(201);
      plan.pods[1].per_plan_project_ids.push(perPlanProjectsResponse.body._id);
      response = await agent.post('/api/plans').send(plan).expect(422);
      response.body.message.should.equal('There are duplicate per plan project ids assigned to this plan.');
    });

    it('should respond with unprocessable entity when per plan project belongs to the pod', async function () {
      var plansResponse = await agent.post('/api/plans').send(plan).expect(201);
      var podsResponse = await agent.get('/api/pods/');
      var deploymentTypesResponse = await agent.get('/api/deploymenttypes/');
      var teamsResponse = await agent.get('/api/teams/');
      var perPlanProject = _.cloneDeep(validBacklogProject);
      perPlanProject = _.extend(validProject, {
        name: 'perPlanProject',
        pod_id: podsResponse.body[0]._id,
        team_id: teamsResponse.body[0]._id,
        deploymenttype_id: deploymentTypesResponse.body[0]._id
      });
      var perPlanProjectsResponse = await agent.post('/api/projects/').send(perPlanProject).expect(201);
      var projectResponse = await agent.get('/api/projects/');
      plan.pods = [{
        pod_id: podsResponse.body[0]._id,
        backlog_project_ids: [
        ],
        per_plan_project_ids: [
          projectResponse.body[0]._id
        ]
      }];
      plansResponse = await agent.post('/api/plans').send(plan).expect(422);
      plansResponse.body.message.should.equal('The given per plan project id ' + projectResponse.body[0]._id + ' should not belong in pod id ' + plan.pods[0].pod_id);
    });

    it('should respond with unprocessable entity with per plan project id is not in the other pods deleted project ids', async function () {
      var podsResponse = await agent.get('/api/pods/');
      var deploymentTypesResponse = await agent.get('/api/deploymenttypes/');
      var teamsResponse = await agent.get('/api/teams/');
      var perPlanProject = _.cloneDeep(validBacklogProject);
      perPlanProject = _.extend(validProject, {
        name: 'perPlanProject',
        pod_id: podsResponse.body[0]._id,
        team_id: teamsResponse.body[0]._id,
        deploymenttype_id: deploymentTypesResponse.body[0]._id
      });
      var perPlanProjectsResponse = await agent.post('/api/projects/').send(perPlanProject).expect(201);
      var secondValidPod = _.cloneDeep(validPod);
      secondValidPod.name = 'newValidPod';
      secondValidPod.authUrl = 'http://pod.athtem.eei.ericsson.se:5000/v1.0';
      var secondPodsResponse = await agent.post('/api/pods/').send(secondValidPod).expect(201);
      plan.pods.push({
        pod_id: secondPodsResponse.body._id,
        backlog_project_ids: [
        ],
        deleted_project_ids: [
        ],
        per_plan_project_ids: [
          perPlanProjectsResponse.body._id
        ]
      });
      var plansResponse = await agent.post('/api/plans').send(plan).expect(422);
      plansResponse.body.message.should.equal('The given per plan project id ' + perPlanProjectsResponse.body._id + ' should exist in the deleted_project_ids of pod id ' + plan.pods[0].pod_id);
    });

    requiredKeys.forEach(function (key) {
      it(`given key '${key}' is missing, it should return code 400`, async function () {
        _.unset(plan, key);
        var response = await agent.post('/api/plans').send(plan).expect(400);
        response.body.message.should.equal('Path `' + key.split('.').slice(-1)[0] + '` is required.');
      });
    });

    keySpecificTestData.forEach(function (testData) {
      it(`Given that '${testData.key}' is set to ${testData.value}, ` +
      `it should return code ${testData.responseCode} and body should contain "${testData.responseString}"`, async function () {
        _.set(plan, testData.key, testData.value);
        var response = await agent.post('/api/plans').send(plan).expect(testData.responseCode);
        if (testData.responseString) {
          response.body.message.should.containEql(testData.responseString);
        }
      });
    });
  });

  describe('GET', function () {
    it('should be able to get an empty plan list', async function () {
      var response = await agent.get('/api/plans').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should be able to get a plan list with one element', async function () {
      await agent.post('/api/plans').send(plan).expect(201);
      var response = await agent.get('/api/plans').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(1);
      response.body[0].should.containDeep(plan);
    });

    it('should be able to get a plan list with more than one element', async function () {
      await agent.post('/api/plans').send(plan).expect(201);
      var secondValidPlan = _.cloneDeep(plan);
      secondValidPlan.name = 'secondPlan';
      await agent.post('/api/plans').send(secondValidPlan).expect(201);
      var response = await agent.get('/api/plans').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(2);
      response.body[0].should.containDeep(secondValidPlan);
      response.body[1].should.containDeep(plan);
    });

    it('should be able to get a single plan', async function () {
      var response = await agent.post('/api/plans').send(plan).expect(201);
      response = await agent.get('/api/plans/' + response.body._id).expect(200);
      response.body.should.containDeep(plan);
    });

    it('should throw 404 when id is not in database', async function () {
      var response = await agent.get('/api/plans/000000000000000000000000').expect(404);
      response.body.message.should.equal('A plan with that id does not exist');
    });

    it('should throw 404 when an invalid id is used to search the db', async function () {
      var response = await agent.get('/api/plans/0').expect(404);
      response.body.message.should.equal('A plan with that id does not exist');
    });
  });

  describe('PUT', function () {
    it('should return the updated plan with the same id and the db should be updated', async function () {
      var response = await agent.post('/api/plans').send(plan).expect(201);
      plan.name = 'updatedName';
      var response2 = await agent.put('/api/plans/' + response.body._id).send(plan).expect(200);
      var planReturned = await Plan.findById(response.body._id).exec();
      response2.body._id.should.equal(response.body._id);
      response2.body.should.containDeep(plan);
      JSON.parse(JSON.stringify(planReturned)).should.containDeep(plan);
    });

    it('should not update with more than one plan with the same name', async function () {
      await agent.post('/api/plans').send(plan).expect(201);
      var secondValidPlan = _.cloneDeep(plan);
      secondValidPlan.name = 'secondPlan';
      var response = await agent.post('/api/plans').send(secondValidPlan).expect(201);
      secondValidPlan.name = plan.name;
      response = await agent.put('/api/plans/' + response.body._id).send(secondValidPlan).expect(422);
      response.body.message.should.equal('Name already exists');
    });

    it('should respond with bad request with invalid json', async function () {
      var response = await agent.post('/api/plans').send(plan).expect(201);
      plan = '{';
      response = await agent.put('/api/plans/' + response.body._id).send(plan).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    it('should respond with unprocessable entity with duplicate pod_ids', async function () {
      var response = await agent.post('/api/plans').send(plan).expect(201);
      plan.pods.push(plan.pods[0]);
      response = await agent.put('/api/plans/' + response.body._id).send(plan).expect(422);
      response.body.message.should.equal('There are duplicate pod ids assigned to this plan.');
    });

    it('should respond with unprocessable entity with duplicate backlog project ids', async function () {
      var response = await agent.post('/api/plans').send(plan).expect(201);
      plan.pods[0].backlog_project_ids.push(plan.pods[0].backlog_project_ids[0]);
      response = await agent.put('/api/plans/' + response.body._id).send(plan).expect(422);
      response.body.message.should.equal('There are duplicate backlog project ids assigned to this plan.');
    });

    it('should respond with unprocessable entity with duplicate deleted project ids', async function () {
      var podsResponse = await agent.get('/api/pods/');
      var deploymentTypesResponse = await agent.get('/api/deploymenttypes/');
      var teamsResponse = await agent.get('/api/teams/');
      var deletedProject = _.cloneDeep(validBacklogProject);
      deletedProject = _.extend(validProject, {
        name: 'deletedProject',
        pod_id: podsResponse.body[0]._id,
        team_id: teamsResponse.body[0]._id,
        deploymenttype_id: deploymentTypesResponse.body[0]._id
      });
      var deletedProjectsResponse = await agent.post('/api/projects/').send(deletedProject).expect(201);
      plan.pods[0].deleted_project_ids.push(deletedProjectsResponse.body._id);
      var response = await agent.post('/api/plans').send(plan).expect(201);
      plan.pods[0].deleted_project_ids.push(deletedProjectsResponse.body._id);
      response = await agent.put('/api/plans/' + response.body._id).send(plan).expect(422);
      response.body.message.should.equal('There are duplicate deleted project ids assigned to this plan.');
    });

    it('should respond with unprocessable entity when deleted project does not belong to the pod', async function () {
      var response = await agent.post('/api/plans').send(plan).expect(201);
      var secondValidPod = _.cloneDeep(validPod);
      secondValidPod.name = 'newValidPod';
      secondValidPod.authUrl = 'http://pod.athtem.eei.ericsson.se:50001/v1.0';
      var podsResponse = await agent.post('/api/pods/').send(secondValidPod).expect(201);
      var deploymentTypesResponse = await agent.get('/api/deploymenttypes/');
      var teamsResponse = await agent.get('/api/teams/');
      var deletedProject = _.cloneDeep(validBacklogProject);
      deletedProject = _.extend(validProject, {
        pod_id: podsResponse.body._id,
        team_id: teamsResponse.body[0]._id,
        deploymenttype_id: deploymentTypesResponse.body[0]._id
      });
      var deletedProjectsResponse = await agent.post('/api/projects/').send(deletedProject).expect(201);
      plan.pods[0].deleted_project_ids.push(deletedProjectsResponse.body._id);
      response = await agent.put('/api/plans/' + response.body._id).send(plan).expect(422);
      response.body.message.should.equal('The given deleted project id ' + deletedProjectsResponse.body._id + ' could not be found in pod id' + plan.pods[0].pod_id);
    });

    it('should respond with unprocessable entity with duplicate per plan project ids', async function () {
      var podsResponse = await agent.get('/api/pods/');
      var deploymentTypesResponse = await agent.get('/api/deploymenttypes/');
      var teamsResponse = await agent.get('/api/teams/');
      var perPlanProject = _.cloneDeep(validBacklogProject);
      perPlanProject = _.extend(validProject, {
        name: 'perPlanProject',
        pod_id: podsResponse.body[0]._id,
        team_id: teamsResponse.body[0]._id,
        deploymenttype_id: deploymentTypesResponse.body[0]._id
      });
      var perPlanProjectsResponse = await agent.post('/api/projects/').send(perPlanProject).expect(201);
      var secondValidPod = _.cloneDeep(validPod);
      secondValidPod.name = 'newValidPod';
      secondValidPod.authUrl = 'http://pod.athtem.eei.ericsson.se:5000/v1.0';
      var secondPodsResponse = await agent.post('/api/pods/').send(secondValidPod).expect(201);
      plan.pods.push({
        pod_id: secondPodsResponse.body._id,
        backlog_project_ids: [
        ],
        deleted_project_ids: [
        ],
        per_plan_project_ids: [
          perPlanProjectsResponse.body._id
        ]
      });
      plan.pods[0].deleted_project_ids = [
        perPlanProjectsResponse.body._id
      ];
      var response = await agent.post('/api/plans').send(plan).expect(201);
      plan.pods[1].per_plan_project_ids.push(perPlanProjectsResponse.body._id);
      response = await agent.put('/api/plans/' + response.body._id).send(plan).expect(422);
      response.body.message.should.equal('There are duplicate per plan project ids assigned to this plan.');
    });

    it('should respond with unprocessable entity with per plan project id is not in the other pods deleted project ids', async function () {
      var podsResponse = await agent.get('/api/pods/');
      var deploymentTypesResponse = await agent.get('/api/deploymenttypes/');
      var teamsResponse = await agent.get('/api/teams/');
      var perPlanProject = _.cloneDeep(validBacklogProject);
      perPlanProject = _.extend(validProject, {
        name: 'perPlanProject',
        pod_id: podsResponse.body[0]._id,
        team_id: teamsResponse.body[0]._id,
        deploymenttype_id: deploymentTypesResponse.body[0]._id
      });
      var perPlanProjectsResponse = await agent.post('/api/projects/').send(perPlanProject).expect(201);
      var secondValidPod = _.cloneDeep(validPod);
      secondValidPod.name = 'newValidPod';
      secondValidPod.authUrl = 'http://pod.athtem.eei.ericsson.se:5000/v1.0';
      var secondPodsResponse = await agent.post('/api/pods/').send(secondValidPod).expect(201);
      var response = await agent.post('/api/plans').send(plan).expect(201);
      plan.pods.push({
        pod_id: secondPodsResponse.body._id,
        backlog_project_ids: [
        ],
        deleted_project_ids: [
        ],
        per_plan_project_ids: [
          perPlanProjectsResponse.body._id
        ]
      });
      response = await agent.put('/api/plans/' + response.body._id).send(plan).expect(422);
      response.body.message.should.equal('The given per plan project id ' + perPlanProjectsResponse.body._id + ' should exist in the deleted_project_ids of pod id ' + plan.pods[0].pod_id);
    });

    it('should respond with unprocessable entity when per plan project belongs to the pod', async function () {
      var response = await agent.post('/api/plans').send(plan).expect(201);
      var podsResponse = await agent.get('/api/pods/');
      var deploymentTypesResponse = await agent.get('/api/deploymenttypes/');
      var teamsResponse = await agent.get('/api/teams/');
      var perPlanProject = _.cloneDeep(validBacklogProject);
      perPlanProject = _.extend(validProject, {
        name: 'perPlanProject',
        pod_id: podsResponse.body[0]._id,
        team_id: teamsResponse.body[0]._id,
        deploymenttype_id: deploymentTypesResponse.body[0]._id
      });
      var perPlanProjectsResponse = await agent.post('/api/projects/').send(perPlanProject).expect(201);
      var projectResponse = await agent.get('/api/projects/');
      plan.pods = [{
        pod_id: podsResponse.body[0]._id,
        backlog_project_ids: [
        ],
        per_plan_project_ids: [
          projectResponse.body[0]._id
        ]
      }];
      response = await agent.put('/api/plans/' + response.body._id).send(plan).expect(422);
      response.body.message.should.equal('The given per plan project id ' + projectResponse.body[0]._id + ' should not belong in pod id ' + plan.pods[0].pod_id);
    });
    keySpecificTestData.forEach(function (testData) {
      it(`Given that '${testData.key}' is set to ${testData.value}, ` +
      `it should return code ${testData.responseCode} and body should contain "${testData.responseString}"`, async function () {
        var response = await agent.post('/api/plans').send(plan).expect(201);
        _.set(plan, testData.key, testData.value);
        var response2 = await agent.put('/api/plans/' + response.body._id).send(plan).expect(testData.responseCodePut || testData.responseCode);
        if (testData.responseString) {
          response2.body.message.should.containEql(testData.responseString);
        }
      });
    });
  });

  describe('DELETE', function () {
    it('should delete a single plan', async function () {
      var response = await agent.post('/api/plans/').send(plan).expect(201);
      response = await agent.delete('/api/plans/' + response.body._id).expect(200);
      response.body.should.containDeep(plan);
      var count = await Plan.count().exec();
      count.should.equal(0);
    });

    it('should have 1 element in db after 2 creations and 1 plan deletion', async function () {
      var secondValidPlan = _.cloneDeep(plan);
      secondValidPlan.name = 'secondPlan';
      var response = await agent.post('/api/plans/').send(plan).expect(201);
      response = await agent.post('/api/plans/').send(secondValidPlan).expect(201);
      response = await agent.delete('/api/plans/' + response.body._id).expect(200);
      var count = await Plan.count().exec();
      count.should.equal(1);
    });

    it('should fail when attempting to delete a plan that does not exist', async function () {
      var response = await agent.delete('/api/plans/000000000000000000000000').expect(404);
      response.body.message.should.equal('A plan with that id does not exist');
    });
  });

  afterEach(async function () {
    await Plan.remove().exec();
    await Pod.remove().exec();
    await BacklogProject.remove().exec();
    await DeploymentType.remove().exec();
    await Team.remove().exec();
    await Project.remove().exec();
  });
});
