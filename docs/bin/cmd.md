# [gilk](/docs/)


# gilk CLI

`./bin/cli.js <glob> [<glob>...] [options]`
``` javascript
var gilk = require('../lib/index'),
    vfs = require('vinyl-fs');

var config = require('minimist')(process.argv.slice(2)),
    files = config._;

config.markdown = (config.markdown === 'true');

console.error('gilk: started ...');
```
## API
see [index.js](/gilk/lib/index)
``` javascript
vfs.src(files, { base: config.base || '.' })
```
gilk CLI Options are passed as-is to `gilk`
``` javascript
.pipe(gilk(config))
.on('end', function () {
    console.error('gilk: completed');
})
.on('error', function (err) {
    console.error('gilk: error', err);
})
.pipe(vfs.dest(config.dest || '.'));
```
