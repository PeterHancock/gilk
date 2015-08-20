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

var config = require('minimist')(process.argv.slice(2),
        { boolean: ['markdown', 'include-source'] }),
    files = config._;

console.error('gilk: started ...');
/*
## API usage
*/
var base = config.base || '.';
vfs.src(files, { cwd: base, base: base })
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
