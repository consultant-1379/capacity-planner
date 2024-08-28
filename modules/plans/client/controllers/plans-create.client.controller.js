(function () {
  'use strict';

  angular
    .module('pods')
    .controller('PlansCreateController', PlansCreateController);

  PlansCreateController.$inject = ['plan', 'pods', 'projects', 'backlogprojects', 'deploymentTypes', 'teams', 'creatingFromScratch', 'Notification', '$state'];

  function PlansCreateController(plan, pods, projects, backlogprojects, deploymentTypes, teams, creatingFromScratch, Notification, $state) {
    var vm = this;
    vm.pods = pods;
    vm.plan = plan;
    vm.deploymentTypes = deploymentTypes;
    vm.projects = projects;
    vm.backlogprojects = backlogprojects;
    vm.teams = teams;
    vm.teamAllocations = [];
    vm.usedDeploymentTypes = [];
    vm.statuses = ['IN PROGRESS', 'READY'];
    vm.fields = [
      { name: 'cpu', title: 'CPU' },
      { name: 'memory_mb', title: 'Memory (MB)' },
      { name: 'cinder_gb', title: 'Cinder Storage (GB)' },
      { name: 'cinder_iops', title: 'Cinder IOPS' },
      { name: 'enfs_gb', title: 'ENFS Storage (GB)' },
      { name: 'enfs_iops', title: 'ENFS IOPS' }
    ];
    var defaultPodsData = [];
    vm.pods.forEach(function (pod) {
      defaultPodsData.push({
        pod_id: pod._id,
        backlog_project_ids: [],
        deleted_project_ids: [],
        per_plan_project_ids: []
      });
    });
    if (creatingFromScratch) {
      _.extend(vm.plan, {
        status: 'IN PROGRESS',
        pods: defaultPodsData
      });
    } else {
      defaultPodsData.forEach(function (pod) {
        var foundPlanPod = vm.plan.pods.find(function (planPod) {
          return planPod.pod_id === pod.pod_id;
        });
        if (!foundPlanPod) {
          vm.plan.pods.push(pod);
        }
      });
    }

    vm.isBacklogProjectInPodPlan = function (pod, backlogproject) {
      return vm.plan.pods.some(function (planPod) {
        if (pod._id === planPod.pod_id) {
          if (planPod.backlog_project_ids.includes(backlogproject._id)) {
            return true;
          }
        }
        return false;
      });
    };

    vm.submitForm = async function () {
      vm.plan.pods = vm.plan.pods.map(function (pod) {
        pod.per_plan_project_ids = pod.per_plan_project_ids.filter(vm.doesProjectExist);
        pod.deleted_project_ids = pod.deleted_project_ids.filter(vm.doesProjectExist);
        return pod;
      });
      var planStatus = (creatingFromScratch ? 'creation' : 'update');
      try {
        vm.formSubmitting = true;
        await vm.plan.createOrUpdate();
      } catch (err) {
        vm.formSubmitting = false;
        Notification.error({ message: err.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Plan ' + planStatus + ' error!' });
        return;
      }
      $state.go('plans.list');
      Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Plan ' + planStatus + ' successful!' });
    };

    vm.doesProjectExist = function (projectId) {
      return vm.projects.some(function (project) {
        return project._id === projectId;
      });
    };
    function getAllProjectsInUseForPod(pod) {
      return getNonDeletedProjectsForPod(pod).concat(getBacklogProjectsForPod(pod)).concat(getPerPlanProjectsForPod(pod));
    }

    function getNonDeletedProjectsForPod(pod) {
      return vm.projects.filter(function (project) {
        if (project.pod_id === pod._id && !vm.isProjectDeleted(project, pod)) {
          return true;
        }
        return false;
      });
    }

    function isBacklogProjectInPlan(pod) {
      return function (backlogproject) {
        if (pod.backlog_project_ids.includes(backlogproject._id)) {
          return true;
        }
        return false;
      };
    }

    function isPerPlanProjectInPlan(pod) {
      return function (project) {
        if (pod.per_plan_project_ids.includes(project._id)) {
          return true;
        }
        return false;
      };
    }

    function getBacklogProjectsForPod(pod) {
      return vm.plan.pods.reduce(function (currentList, planPod) {
        if (pod._id === planPod.pod_id) {
          return currentList.concat(vm.backlogprojects.filter(isBacklogProjectInPlan(planPod)));
        }
        return currentList;
      }, []);
    }

    function getPerPlanProjectsForPod(pod) {
      return vm.plan.pods.reduce(function (currentList, planPod) {
        if (pod._id === planPod.pod_id) {
          return currentList.concat(vm.projects.filter(isPerPlanProjectInPlan(planPod)));
        }
        return currentList;
      }, []);
    }

    function getDeploymentTypeForProject(project) {
      return vm.deploymentTypes.find(function (deploymentType) {
        return project.deploymenttype_id === deploymentType._id;
      });
    }

    vm.sumProjectFields = function (pod, fieldName) {
      return getAllProjectsInUseForPod(pod).reduce(function (sum, project) {
        var fieldValue = 0;
        var projectDeploymentType = getDeploymentTypeForProject(project);
        if (projectDeploymentType[fieldName]) {
          fieldValue = projectDeploymentType[fieldName];
        }
        return sum + parseInt(fieldValue, 10);
      }, 0);
    };

    vm.populatePodDeltasForField = function (pod, fieldName) {
      var podField = fieldName;
      if (fieldName === 'cpu') {
        podField = 'cpu_after_contention_ratio';
      }
      pod.deltas[fieldName] = Math.round(pod[podField] - pod.project_totals[fieldName]);
    };

    vm.populatePodCapacityForField = function (pod, fieldName) {
      if (fieldName === 'cpu') {
        pod.cpu_after_contention_ratio = Math.round(pod.cpu * pod.cpu_contention_ratio);
        vm.populatePodDeltasForField(pod, fieldName);
      }
    };

    vm.populatePodProjectTotalsForField = function (pod, fieldName) {
      var projectFieldSum = vm.sumProjectFields(pod, fieldName);
      pod.project_totals[fieldName] = projectFieldSum;
      vm.populatePodDeltasForField(pod, fieldName);
    };

    vm.populatePodProjectTotalsForAllFields = function (pod) {
      vm.fields.forEach(function (field) {
        vm.populatePodProjectTotalsForField(pod, field.name);
      });
      vm.populateTeamAllocations();
    };

    vm.changedProjectDeploymentType = function (pod, project) {
      vm.populatePodProjectTotalsForAllFields(pod);
    };

    vm.removeBacklogProjectFromPlan = function (pod, backlogproject) {
      var planPodIndex = vm.plan.pods.findIndex(function (planPod) {
        return pod._id === planPod.pod_id;
      });
      vm.plan.pods[planPodIndex].backlog_project_ids = vm.plan.pods[planPodIndex].backlog_project_ids.filter(function (planBacklogProject) {
        if (planBacklogProject === backlogproject._id) {
          return false;
        }
        return true;
      });
      vm.populatePodProjectTotalsForAllFields(pod);
    };

    vm.findPlanPodById = function (podId) {
      return vm.plan.pods.find(function (planPod) {
        if (planPod.pod_id === podId) {
          return true;
        }
        return false;
      });
    };

    vm.findPodById = function (podId) {
      return vm.pods.find(function (pod) {
        if (pod._id === podId) {
          return true;
        }
        return false;
      });
    };

    vm.removeProject = function (pod, projectToRemove) {
      var foundPod = vm.findPlanPodById(pod._id);
      foundPod.deleted_project_ids.push(projectToRemove._id);
      vm.populatePodProjectTotalsForAllFields(pod);
    };

    vm.addPerPlanProject = function (selectedPerPlanProject, pod) {
      if (pod._id === selectedPerPlanProject.pod_id) {
        vm.reAddProject(pod, selectedPerPlanProject);
      } else {
        var foundPod = vm.findPlanPodById(pod._id);
        foundPod.per_plan_project_ids.push(selectedPerPlanProject._id);
      }
      vm.populatePodProjectTotalsForAllFields(pod);
    };

    vm.removeProjectFromPerPlan = function (pod, projectToRemove) {
      var foundPod = vm.findPlanPodById(pod._id);
      foundPod.per_plan_project_ids.splice(foundPod.per_plan_project_ids.indexOf(projectToRemove._id), 1);
      vm.populatePodProjectTotalsForAllFields(pod);
    };

    vm.reAddProject = function (pod, projectToReAdd) {
      var foundPlanPod = vm.plan.pods.find(function (planPod) {
        return planPod.per_plan_project_ids.includes(projectToReAdd._id);
      });
      if (foundPlanPod) {
        var foundProjectsPod = vm.findPodById(foundPlanPod.pod_id);
        Notification.error({ message: 'Project in use in pod ' + foundProjectsPod.name, title: '<i class="glyphicon glyphicon-remove"></i> Re-Adding Project error!' });
      } else {
        var foundPod = vm.findPlanPodById(pod._id);
        foundPod.deleted_project_ids.splice(foundPod.deleted_project_ids.indexOf(projectToReAdd._id), 1);
        vm.populatePodProjectTotalsForAllFields(pod);
      }
    };

    vm.isProjectDeleted = function (project) {
      return vm.plan.pods.some(function (planPod) {
        return planPod.deleted_project_ids.includes(project._id);
      });
    };

    vm.isProjectInPodsPerPlanIds = function (pod, project) {
      var foundPod = vm.findPlanPodById(pod._id);
      if (foundPod.per_plan_project_ids.includes(project._id)) {
        return true;
      }
      return false;
    };

    vm.isProjectNotInPerPlan = function (project) {
      return !vm.plan.pods.some(function (planPod) {
        return planPod.per_plan_project_ids.includes(project._id);
      });
    };

    vm.isBacklogProjectNotInAPlan = function (backlogproject) {
      return !vm.plan.pods.some(function (planPod) {
        return planPod.backlog_project_ids.includes(backlogproject._id);
      });
    };

    vm.isProjectDeleted = function (project) {
      return vm.plan.pods.some(function (planPod) {
        return planPod.deleted_project_ids.includes(project._id);
      });
    };

    vm.addBacklogProject = function (backlogProjectId, pod) {
      var podPlanIndex = vm.plan.pods.findIndex(function (podPlan) {
        return podPlan.pod_id === pod._id;
      });
      if (podPlanIndex !== -1) {
        vm.plan.pods[podPlanIndex].backlog_project_ids.push(backlogProjectId);
      } else {
        vm.plan.pods.push({
          pod_id: pod._id,
          backlog_project_ids: [backlogProjectId]
        });
      }
      vm.populatePodProjectTotalsForAllFields(pod);
    };

    vm.changedPodPhysicalResourcesField = function (pod, fieldName) {
      vm.populatePodCapacityForField(pod, fieldName);
      vm.populatePodDeltasForField(pod, fieldName);
    };

    vm.populateTeamAllocations = function () {
      var teamAllocations = [];
      var usedDeploymentTypes = [];

      for (var teamIndex = 0; teamIndex < vm.teams.length; teamIndex += 1) {
        var teamData = {
          name: vm.teams[teamIndex].name,
          cpu: 0,
          memory_mb: 0,
          cinder_gb: 0,
          cinder_iops: 0,
          enfs_gb: 0,
          enfs_iops: 0,
          deployment_type_counts: {}
        };

        var foundTeamData = false;
        for (var podsIndex = 0; podsIndex < vm.pods.length; podsIndex += 1) {
          var podProjects = getAllProjectsInUseForPod(vm.pods[podsIndex]);
          for (var podProjectsIndex = 0; podProjectsIndex < podProjects.length; podProjectsIndex += 1) {
            if (podProjects[podProjectsIndex].team_id === vm.teams[teamIndex]._id) {
              foundTeamData = true;
              var deploymentType = getDeploymentTypeForProject(podProjects[podProjectsIndex]);
              var deploymentTypeCount = 0;
              if (teamData.deployment_type_counts[deploymentType.name]) {
                deploymentTypeCount = teamData.deployment_type_counts[deploymentType.name];
              }
              teamData.deployment_type_counts[deploymentType.name] = deploymentTypeCount + 1;
              usedDeploymentTypes.push(deploymentType.name);
              for (var fieldsIndex = 0; fieldsIndex < vm.fields.length; fieldsIndex += 1) {
                teamData[vm.fields[fieldsIndex].name] += deploymentType[vm.fields[fieldsIndex].name];
              }
            }
          }
        }
        if (foundTeamData) {
          teamAllocations.push(teamData);
        }
      }
      vm.teamAllocations = teamAllocations;
      vm.usedDeploymentTypes = Array.from(new Set(usedDeploymentTypes)).sort();
    };

    function populateOriginalFieldValues(pod) {
      var allFields = vm.fields.concat({ name: 'cpu_contention_ratio' });
      allFields.forEach(function (field) {
        pod[field.name + '_original'] = pod[field.name];
      });
      return pod;
    }

    vm.pods = vm.pods.map(function (pod) {
      pod.project_totals = {};
      pod.deltas = {};
      return pod;
    });
    vm.pods = vm.pods.map(populateOriginalFieldValues);
    vm.pods.forEach(function (pod) {
      vm.populatePodCapacityForField(pod, 'cpu');
      vm.populatePodProjectTotalsForAllFields(pod);
    });
    vm.populateTeamAllocations();
  }
}());
