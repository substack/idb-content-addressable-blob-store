var store = require('../');
var blob = store();
var stdout = require('console-stream')();

var w = blob.createWriteStream(function (err, meta) {
    console.log('# hash=', meta.key);
    blob.createReadStream(meta.key).pipe(stdout);
});
w.end('abcdefg');
