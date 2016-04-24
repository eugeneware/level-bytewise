var level = require('level-hyper'),
    bytewise = require('bytewise'),
    sublevel = require('level-sublevel/bytewise'),
    xtend = require('xtend');

module.exports = bytewiseDb;
function bytewiseDb(location, opts, cb) {
  opts = xtend({ keyEncoding: bytewise, valueEncoding: 'json' }, opts);
  var rootDb = level.call(level, location, opts, cb);
  var db = sublevel(rootDb);
  db.rootDb = rootDb;
  return db;
}
