var debug = Meteor.npmRequire("debug")("loki:publication");

Meteor.publish('jobs', function() {
  return Jobs.find({isDeleted: false});
});

Meteor.publish('recycledJobs', function() {
  if (Roles.userIsInRole(this.userId, ['job-creator'])) {
    return Jobs.find({$and: [{isDeleted: true}, {owner: this.userId}]});
  } else {
    // user not authorized.
    this.stop();
    return;
  }
});

Meteor.publish("eventsCount", function() {
  var self = this;
  var count = 0;
  var initializing = true;
  var handle = Events.find({}).observeChanges({
    added: function (id) {
      count++;
      if (!initializing)
        self.changed("eventsCount", "countId", {count: count});
    },
    removed: function (id) {
      count--;
      self.changed("eventsCount", "countId", {count: count});
    }
  });
  initializing = false;
  self.added("eventsCount", "countId", {count: count});
  self.ready();

  self.onStop(function () {
    handle.stop();
  });
});

Meteor.publish("events", function(from, sortOptions, filterOptions) {
  //FIXME do some checks on the parameters
  var self = this;
  var count = 10;
  var max = Events.find({}).count();
  var actualFrom = max > count?Math.min(from, max - count):from;
  var filterOpt = {};
  if (typeof filterOptions != "undefined") {
    filterOpt = filterOptions;
  }

  var handle = Events.find(filterOpt, {sort: sortOptions, limit: count, skip: actualFrom, fields: {jobId:1,etime:1,deltas:1,isProblematic:1,status:1,series:1,observations:1,ert:1, responseTime:1, size: 1}}).observeChanges({
    added: function (id, fields) {
      var jobStats = EventStats.findOne({_id: fields.jobId}, {fields: {avg:1}});
      fields.avg = jobStats?jobStats.avg:0;
      self.added('events', id, fields);
    },
    changed: function (id, fields) {
      self.changed('events', id, fields);
    },
    removed: function (id) {
      var theEventJobId = Events.findOne({_id: id}, {fields: {jobId:1}}).jobId;
      var jobStats = EventStats.findOne({_id: theEventJobId}, {fields: {avg:1}});
      if (jobStats) {
        jobStats[id] && jobStats[id].stop();
      }
      self.removed('events', id);
    }
  });
  self.ready();
  self.onStop(function() { handle.stop(); });
});

Meteor.publish('eventStats', function() {
  return EventStats.find({});
});

Meteor.publish('usersRoles', function() {
  if (Roles.userIsInRole(this.userId, ['bofh'])) {
    return Meteor.users.find({}, {fields: {'_id': 1, 'roles': 1, 'username': 1, 'profile.name': 1, 'createdAt': 1}});
  } else {
    // user not authorized.
    this.stop();
    return;
  }
});
