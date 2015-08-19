#!/usr/bin/env node

/*
# gilk CLI

`./bin/cli.js <glob> [<glob>...] [options]`

*/

/*
`require` gilk
*/
var gilk = require('../lib/index'),
    vfs = require('vinyl-fs');

var config = require('minimist')(process.argv.slice(2)),
    files = config._;

config.markdown = (config.markdown === 'true');

console.error('gilk: started ...');
/*
## API usage
*/
vfs.src(files, { base: config.base || '.' })
/*
gilk CLI options are passed as-is to gilk API
*/
    .pipe(gilk(config))
    .on('end', function () {
        console.error('gilk: completed');
    })
    .on('error', function (err) {
        console.error('gilk: error', err);
    })
    .pipe(vfs.dest(config.dest || '.'));
