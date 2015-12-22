var through = require('through2');
var writeonly = require('write-only-stream');
var readonly = require('read-only-stream');
var defined = require('defined');

var SHA = require('sha.js/sha256')
var IDB = require('idb-blob-store');

module.exports = CA;

function CA (opts) {
    if (!(this instanceof CA)) return new CA(opts);
    var self = this;
    this._idb = new IDB(opts);
}

CA.prototype.createWriteStream = function (opts, cb) {
    var self = this;
    if (!opts) opts = {};
    if (typeof opts === 'function') {
        cb = opts;
        opts = {};
    }
    if (typeof opts !== 'object') opts = {};
    if (!cb) cb = function () {};
    
    var kbytes = window.crypto.getRandomValues(new Uint8Array(32));
    var params = {
        key: Buffer(kbytes).toString('hex'),
        size: opts.size
    };
    
    var h = new SHA;
    var hash = null;
    var w = through(write, end);
    var outer = writeonly(w);
    
    w.pipe(this._idb.createWriteStream(params, function (err, meta) {
        if (err) return cb(err);
        self.exists(hash, function (err, ex) {
            if (err) cb(err)
            else if (ex) remove()
            else create()
        });
        function remove () {
            self._idb.remove(params.key, function (err) {
                if (err) cb(err)
                else cb(null, { key: hash, size: meta.size });
            });
        }
        function create () {
            self._idb._put(hash, meta.key, function (err) {
                if (err) return cb(err)
                outer.size = meta.size;
                cb(null, { key: hash, size: meta.size });
            });
        }
    }));
    return outer;
    
    function write (buf, enc, next) {
        h.update(buf);
        this.push(buf);
        next();
    }
    function end () {
        hash = h.digest().toString('hex');
        outer.key = hash;
        this.push(null);
    }
};

CA.prototype.createReadStream = function (opts) {
    var self = this;
    if (typeof opts === 'string') opts = { key: opts };
    if (!opts) opts = {};
    var key = opts.key || 'undefined';
    var stream = through();
    
    self._idb._get(key, function (err, value) {
        if (err) stream.emit('error', err);
        else if (value) {
            var r = self._idb.createReadStream(value);
            r.on('error', function (err) { stream.emit('error', err) });
            r.pipe(stream);
        }
        else stream.emit('error', new Error('key not found: ' + key));
    });
    return readonly(stream);
};

CA.prototype.exists = function (opts, cb) {
    var self = this;
    if (typeof opts === 'string') opts = { key: opts };
    var key = defined(opts.key, 'undefined');
    self._idb._get(key, function (err, value) {
        if (err) return cb(err);
        if (value === undefined) return cb(null, false);
        self._idb.exists(value, cb);
    });
};

CA.prototype.remove = function (opts, cb) {
    var self = this;
    if (typeof opts === 'string') opts = { key: opts };
    var key = defined(opts.key, 'undefined');
    self._idb._get(key, function (err, value) {
        if (err) cb(err)
        else self._idb.remove(value, cb)
    });
};
