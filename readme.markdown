# idb-content-addressable-blob-store

content-addressable IndexedDB blob store

[![blob-store-compatible](https://raw.githubusercontent.com/maxogden/abstract-blob-store/master/badge.png)](https://github.com/maxogden/abstract-blob-store)

# example

``` js
var store = require('idb-content-addressable-blob-store');
var blob = store();
var stdout = require('console-stream')();

var w = blob.createWriteStream(function (err, meta) {
    console.log('# hash=', meta.key);
    blob.createReadStream(meta.key).pipe(stdout);
});
w.end('abcdefg');
```

# methods

``` js
var store = require('idb-content-addressable-blob-store')
```

## var blob = store()

Create a new blob store.

## blob.createWriteStream(opts, cb)

Create a new blob with chunks of size `opts.size`, default: 16384.

The key will be generated from the sha256 of the content and is available from
`meta.key` in `cb(err, meta)`.

## blob.createReadStream(opts)

Create a read stream for the chunks at `opts.key`.

## blob.exists(opts, cb)

Check if `opts.key` exists with `cb(err, exists)`.

## blob.remove(opts, cb)

Remove the key at `opts.key`.

# install

With [npm](https://npmjs.org) do:

```
npm install idb-content-addressable-blob-store
```

# license

MIT
