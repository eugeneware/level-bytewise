var redtape = require('redtape'),
    rimraf = require('rimraf'),
    os = require('os'),
    xtend = require('xtend'),
    hooks = require('level-hooks'),
    path = require('path'),
    timestamp = require('monotonic-timestamp'),
    levelBytewise = require('..');

var dbPath = path.join(os.tmpdir(), 'bytewise-db-' + Date.now());
var it = redtape({
  beforeEach: function (cb) {
    rimraf(dbPath, cb);
  },
  afterEach: function (cb) {
    cb();
  }
});

it('should be able to create a database', function(t) {
  var db = levelBytewise(dbPath);
  t.ok(db, 'database exists');
  close(t, db);
});

it('should be able to write to the database', function(t) {
  var db = levelBytewise(dbPath);
  db.put(['user', 'eugene'], { color: 'black' }, function (err) {
    t.error(err, 'error writing data');
    read();
  });

  function read() {
    db.get(['user', 'eugene'], function (err, data) {
      t.error(err, 'error reading data');
      t.deepEqual(data, { color: 'black' }, 'data equal');
      close(t, db);
    });
  }
});

it('should be able to do batch puts', function(t) {
  var db = levelBytewise(dbPath);
  var data = [
    { type: 'put', key: ['user', 'eugene'], value: { color: 'black' } },
    { type: 'put', key: ['user', 'susan'],  value: { color: 'green' } }
  ];
  db.batch(data, function (err) {
    t.error(err, 'batch put error');
    read();
  });
  function read() {
    var results = [];
    db.createReadStream()
      .on('data', function (data) {
        results.push(data);
      })
      .on('end', function () {
        t.equal(results.length, 2, 'correct data length');
        var expected = data.map(function (item) {
          var copy = xtend(item);
          delete copy.type;
          return copy;
        });
        t.deepEqual(results, expected, 'data is equal');
        close(t, db);
      });
  }
});

it('should be able to use sublevels', function(t) {
  var db = levelBytewise(dbPath);
  var users = db.sublevel('users');
  var data = [
    { type: 'put', key: ['eugene'], value: { color: 'black' } },
    { type: 'put', key: ['susan'],  value: { color: 'green' } }
  ];
  users.batch(data, function (err) {
    t.error(err, 'batch put error');
    read();
  });
  function read() {
    var results = [];
    users.createReadStream()
      .on('data', function (data) {
        results.push(data);
      })
      .on('end', function () {
        t.equal(results.length, 2, 'correct data length');
        var expected = data.map(function (item) {
          var copy = xtend(item);
          delete copy.type;
          return copy;
        });
        t.deepEqual(results, expected, 'data is equal');
        topRead();
      });
  }
  function topRead() {
    var results = [];
    db.createReadStream()
      .on('data', function (data) {
        results.push(data);
      })
      .on('end', function () {
        t.equal(results.length, 0, 'correct data length');
        var expected = [];
        t.deepEqual(results, expected, 'data is equal');
        rootRead();
      });
  }
  function rootRead() {
    var results = [];
    db.rootDb.createReadStream()
      .on('data', function (data) {
        results.push(data);
      })
      .on('end', function () {
        t.equal(results.length, 2, 'correct data length');
        var expected = data.map(function (item) {
          var ret = xtend(item, { key: [['users'], item.key] });
          delete ret.type;
          return ret;
        });
        t.deepEqual(results, expected, 'data is equal');
        close(t, db);
      });
  }
});

it('should be able to use hooks to build indexes', function(t) {
  var db = levelBytewise(dbPath);
  var users = db.sublevel('users');
  var colors = db.sublevel('colors');
  users.pre(function (change, add, batch) {
    // build an index on `color`
    add({
      key: [change.value.color, timestamp()],
      value: change.key,
      prefix: colors
    });
  });
  var data = [
    { type: 'put', key: ['edmund'], value: { color: 'black' } },
    { type: 'put', key: ['eugene'], value: { color: 'black' } },
    { type: 'put', key: ['susan'],  value: { color: 'green' } }
  ];
  users.batch(data, function (err) {
    t.error(err, 'batch put error');
    read();
  });
  function read() {
    var results = [];
    users.createReadStream()
      .on('data', function (data) {
        results.push(data);
      })
      .on('end', function () {
        t.equal(results.length, 3, 'correct data length');
        var expected = data.map(function (item) {
          var copy = xtend(item);
          delete copy.type;
          return copy;
        });
        t.deepEqual(results, expected, 'data is equal');
        indexRead();
      });
  }
  function indexRead() {
    var results = [];
    colors.createReadStream({ start: ['black', -Infinity], end: ['black', +Infinity]})
      .on('data', function (data) {
        results.push(data);
      })
      .on('end', function () {
        t.equal(results.length, 2, 'correct data length');
        var hits = results.map(function (item) {
          return item.value;
        });
        var expected = [['edmund'], ['eugene']];
        t.deepEqual(hits, expected, 'data is equal');
        close(t, db);
      });
  }
});

function close(t, db) {
  db.close(function (err) {
    t.error(err, 'problem closing db');
    t.end();
  });
}
