'use strict';

var mongoose = require('mongoose');
var MongooseSchema = mongoose.Schema;
var Pod = require('../../../pods/server/models/pods.server.model.js').Schema;
var BacklogProject = require('../../../backlogprojects/server/models/backlogprojects.server.model.js').Schema;
var Project = require('../../../projects/server/models/projects.server.model.js').Schema;
var _ = require('lodash');

var PodPlan = new MongooseSchema({
  _id: false,
  pod_id: {
    type: MongooseSchema.ObjectId,
    ref: 'Pod',
    required: true
  },
  backlog_project_ids: {
    type: [{
      type: MongooseSchema.ObjectId,
      ref: 'BacklogProject'
    }]
  },
  deleted_project_ids: {
    type: [{
      type: MongooseSchema.ObjectId,
      ref: 'Project'
    }]
  },
  per_plan_project_ids: {
    type: [{
      type: MongooseSchema.ObjectId,
      ref: 'Project'
    }]
  }
}, { strict: 'throw' });

var Plan = new MongooseSchema({
  name: {
    type: 'string',
    trim: true,
    required: true,
    unique: true,
    maxlength: 50
  },
  pods: {
    type: [PodPlan]
  },
  status: {
    type: String,
    enum: ['IN PROGRESS', 'READY'],
    required: true
  }
}, { strict: 'throw' });

async function preventDuplicatePodIds(plan) {
  var planPodIds = plan.pods.map(function (pod) {
    return pod.pod_id.toString();
  });
  if (_.uniq(planPodIds).length !== planPodIds.length) {
    throw new Error('There are duplicate pod ids assigned to this plan.');
  }
}
async function preventDuplicateBacklogProjectIds(plan) {
  var planBacklogProjectIds = plan.pods.reduce(function (idArray, pod) {
    return idArray.concat(pod.backlog_project_ids.map(function (backlogProject) {
      return backlogProject.toString();
    }));
  }, []);

  if (_.uniq(planBacklogProjectIds).length !== planBacklogProjectIds.length) {
    throw new Error('There are duplicate backlog project ids assigned to this plan.');
  }
}
async function preventDuplicateDeletedProjectIds(plan) {
  var deletedProjectIds = plan.pods.reduce(function (idArray, pod) {
    return idArray.concat(pod.deleted_project_ids.map(function (project) {
      return project.toString();
    }));
  }, []);

  if (_.uniq(deletedProjectIds).length !== deletedProjectIds.length) {
    throw new Error('There are duplicate deleted project ids assigned to this plan.');
  }
}

async function preventInvalidPodIds(plan) {
  var validPodIds = await Pod.find().lean().distinct('_id');
  validPodIds = validPodIds.map(function (podId) {
    return podId.toString();
  });
  plan.pods.forEach(function (pod) {
    if (!validPodIds.includes(pod.pod_id.toString())) {
      throw new Error('The given pod id ' + pod.pod_id + ' could not be found');
    }
  });
}

async function preventInvalidBacklogProjectIds(plan) {
  var validBacklogProjectIds = await BacklogProject.find().lean().distinct('_id');
  validBacklogProjectIds = validBacklogProjectIds.map(function (v) {
    return v.toString();
  });
  plan.pods.forEach(function (pod) {
    pod.backlog_project_ids.forEach(function (backlogProjectIds) {
      if (!validBacklogProjectIds.includes(backlogProjectIds.toString())) {
        throw new Error('The given backlog project id ' + backlogProjectIds + ' could not be found');
      }
    });
  });
}

async function preventInvalidDeletedProjectIds(plan) {
  var validProjectIds = await Project.find().lean().distinct('_id');
  validProjectIds = validProjectIds.map(function (projectId) {
    return projectId.toString();
  });
  plan.pods.forEach(function (pod) {
    pod.deleted_project_ids.forEach(function (deletedProjectId) {
      if (!validProjectIds.includes(deletedProjectId.toString())) {
        throw new Error('The given deleted project id ' + deletedProjectId + ' could not be found');
      }
    });
  });
}

async function preventDeletedProjectIdsInInvalidPods(plan) {
  var allProjects = await Project.find().lean().select('_id pod_id');
  plan.pods.forEach(function (pod) {
    allProjects.forEach(function (project) {
      var found = pod.deleted_project_ids.find(function (deletedProjectIds) {
        return deletedProjectIds.toString() === project._id.toString();
      });
      if (found) {
        if (pod.pod_id.toString() !== project.pod_id.toString()) {
          throw new Error('The given deleted project id ' + project._id + ' could not be found in pod id' + pod.pod_id);
        }
      }
    });
  });
}
async function preventDuplicatePerPlanProjectIds(plan) {
  var perPlanProjectIds = plan.pods.reduce(function (idArray, pod) {
    return idArray.concat(pod.per_plan_project_ids.map(function (project) {
      return project.toString();
    }));
  }, []);

  if (_.uniq(perPlanProjectIds).length !== perPlanProjectIds.length) {
    throw new Error('There are duplicate per plan project ids assigned to this plan.');
  }
}

async function preventInvalidPerPlanProjectIds(plan) {
  var validPerPlanProjectIds = await Project.find().lean().distinct('_id');
  validPerPlanProjectIds = validPerPlanProjectIds.map(function (projectId) {
    return projectId.toString();
  });
  plan.pods.forEach(function (pod) {
    pod.per_plan_project_ids.forEach(function (perPlanProjectIds) {
      if (!validPerPlanProjectIds.includes(perPlanProjectIds.toString())) {
        throw new Error('The given per plan project id ' + perPlanProjectIds + ' could not be found');
      }
    });
  });
}

async function preventPerPlanProjectIdsInInvalidPods(plan) {
  var allProjects = await Project.find().lean().select('_id pod_id');
  plan.pods.forEach(function (pod) {
    pod.per_plan_project_ids.forEach(function (perPlanProjectId) {
      var perPlanProjectObject = allProjects.find(function (project) {
        return perPlanProjectId.toString() === project._id.toString();
      });
      if (pod.pod_id.toString() === perPlanProjectObject.pod_id.toString()) {
        throw new Error('The given per plan project id ' + perPlanProjectId + ' should not belong in pod id ' + pod.pod_id);
      }
    });
  });
}

async function preventPerPlanProjectIdsNotDeletedInParentPod(plan) {
  var allProjects = await Project.find().lean().select('_id pod_id');
  plan.pods.forEach(function (pod) {
    pod.per_plan_project_ids.forEach(function (perPlanProjectId) {
      var perPlanProjectObject = allProjects.find(function (project) {
        return perPlanProjectId.toString() === project._id.toString();
      });
      var perPlanProjectIdsPod = plan.pods.find(function (pod2) {
        return pod2.pod_id.toString() === perPlanProjectObject.pod_id.toString();
      });
      var podDeletedProjectIds = perPlanProjectIdsPod.deleted_project_ids.map(function (deletedProjectId) {
        return deletedProjectId.toString();
      });
      if (!podDeletedProjectIds.includes(perPlanProjectId.toString())) {
        throw new Error('The given per plan project id ' + perPlanProjectId + ' should exist in the deleted_project_ids of pod id ' + perPlanProjectIdsPod.pod_id);
      }
    });
  });
}


Plan.pre('save', async function (next) {
  try {
    var plan = this;
    await preventDuplicatePodIds(plan);
    await preventDuplicateBacklogProjectIds(plan);
    await preventDuplicateDeletedProjectIds(plan);
    await preventInvalidPodIds(plan);
    await preventInvalidDeletedProjectIds(plan);
    await preventInvalidBacklogProjectIds(plan);
    await preventDeletedProjectIdsInInvalidPods(plan);
    await preventDuplicatePerPlanProjectIds(plan);
    await preventInvalidPerPlanProjectIds(plan);
    await preventPerPlanProjectIdsInInvalidPods(plan);
    await preventPerPlanProjectIdsNotDeletedInParentPod(plan);
    return next();
  } catch (error) {
    return next(error);
  }
});

module.exports.Schema = mongoose.model('Plan', Plan);
