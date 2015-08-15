#!/usr/bin/env node

var gilk = require('../index'),
    assign = require('object-assign')
    vinylFs = require('vinyl-fs');

/*
##CLI
*/
var args = require('minimist')(process.argv.slice(2)),
    config = assign({
        base: '.',
        title: 'Home',
        dest: '.',
        /* optional js script */
        js: null,
        /* optional css script */
        css: null,
        /* optional Mustache template for the page */
        pageTmpl: null
    /* CLI args for config */
    }, args),

    /* files under base to process */
    files = args._;

console.log('gilk: started ...');
/*
##API
*/
vinylFs.src(files, {base: config.base})
    .pipe(gilk(config))
    .on('end', function () {
        console.log('gilk: completed');
    })
    .on('error', function (err) {
        console.error('gilk: error', err);
    })
    .pipe(vinylFs.dest(config.dest));
