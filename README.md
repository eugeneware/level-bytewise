# level-bytewise

leveldb with bytewise key encodings and bytewise friendly sublevels.

Ie. a "batteries included" distribution of [`levelup`](https://github.com/Level/levelup)
that has friendly key sorting and sublevels that work with bytewise encodings.

[![build status](https://secure.travis-ci.org/eugeneware/level-bytewise.png)](http://travis-ci.org/eugeneware/level-bytewise)

## Installation

This module is installed via npm:

``` bash
$ npm install level-bytewise
```

## Example Usage (put and get)

``` js
var levelBytewise = require('level-bytewise');
var db = levelBytewise('/tmp/path-to-db')
var users = db.sublevel('users');
users.put(['eugene'], { color: 'black' }, function (err) {
  if (err) throw err;
  users.get(['eugene'], function (err, data) {
    if (err) throw err;
    console.log(data);
    // { color: 'black }
  });
});
```

## Example Usage (build and index on color)

``` js
var levelBytewise = require('level-bytewise'),
    timestamp = require('monotonic-timestamp');
var db = levelBytewise('/tmp/path-to-db')
var users = db.sublevel('users');
var colors = db.sublevel('colors');
users.pre(function (change, add, batch) {
  // build an index on `color` and store it in the `colors` sublevel
  add({
    key: [change.value.color, timestamp()],
    value: change.key,
    prefix: colors
  });
});
users.put(['eugene'], { color: 'black' }, function (err) {
  if (err) throw err;
  colors.createReadStream()
    .on('data', console.log);
  // { key: ['black', 1461480614762], value: ['eugene'] }
});
```
