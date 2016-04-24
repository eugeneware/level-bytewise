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

## Example Usage

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
