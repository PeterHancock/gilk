#!/usr/bin/env node

var Promise = require('es6-promise').Promise,
    denodeify = require('es6-denodeify')(Promise),
    fs = require('fs-extra'),
    path = require('path'),
    _ = require('underscore'),
    docco = require('docco'),
    cheerio = require('cheerio'),
    copy = denodeify(fs.copy),
    mkdirs = denodeify(fs.mkdirs);

var root = __dirname;
var templates = root + '/templates/';
var publicSrc = root + '/public/';

var doccoOutput = 'build/docco-out/';
var publicDest = 'build/public/';

/*
{
    files: [],
    title: '',
    js: '',
    css: '',
    indexFile: ''
}
*/
module.exports = function gilk(config) {

    var files = config.files || [];
    var title = config.title || 'Home';
    var js = config.js;
    var css = config.css;
    var indexFile = config.indexFile;

    function destination(file) {
        return path.join(doccoOutput, path.basename(file, path.extname(file)) + '.html');
    };

    function postProc(resolve, reject) {
        var promises = files.map(function (file) {
            var ext = path.extname(file),
            specName = path.basename(file, ext),
            specFile = path.basename(file);
            return new Promise(function (resolve, reject) {
                fs.readFile(doccoOutput + specName + '.html', function (err, content) {
                    var $ = cheerio.load(content);
                    if (css) {
                        $('head').append('<link rel="stylesheet" media="all" href="custom.css">');
                    }
                    $('body').prepend(navbar);
                    if (js) {
                        $('body').append('<script type="text/javascript" src="custom.js"></script>');
                    }
                    $('body').append('<script type="text/javascript" src="' + specFile + '"></script>');
                    fs.writeFile(publicDest + specName + '.html', $.html(), function () {
                        copy(file, publicDest + specFile).then(resolve, reject);
                    });
                });
            });
        });
        Promise.all(promises).then(resolve);
    };

    var sources = files.map(function (source) {
        return {
            href: path.basename(destination(source)),
            name: path.basename(source)
        }
    });

    navbar = _.template(fs.readFileSync(templates + 'navbar.jst').toString())({
        title: title,
        sources: sources
    });

    return Promise.all([mkdirs(doccoOutput), mkdirs(publicDest)])
        .then(function () {

            var promises = [];

            var documentSpecs = new Promise(function (resolve, reject) {
                docco.document({
                    args: files,
                    output: doccoOutput,
                    template: templates + 'page.jst',
                    css: '?' // Supresses warning
                }, function () {
                    postProc(resolve, reject);
                });

            });

            if (indexFile) {
                var createIndex = new Promise(function (resolve, reject) {
                    var ext = path.extname(indexFile),
                    name  = path.basename(indexFile, ext),
                    toc = _.template(fs.readFileSync(templates + 'toc.jst').toString())({
                        title: 'Table of Contents',
                        sources: sources
                    });
                    docco.document({
                        args: [indexFile],
                        output: doccoOutput,
                        template: templates + 'page.jst',
                        css: '?' // Supresses warning
                    }, function () {
                        var $ = cheerio.load(fs.readFileSync(doccoOutput + name + '.html'));
                        $('body').prepend(navbar);
                        if (sources.length > 1) {
                            $('.header').append(toc);
                        }
                        fs.writeFileSync(publicDest +  'index.html', $.html());
                        resolve();
                    });
                });
                promises.push(createIndex);
            }

            promises.push(documentSpecs);

            // Add resources to public dir
            promises.push(copy(publicSrc, publicDest));

            if (js) {
                promises.push(copy(js, publicDest + 'custom.js'));
            }

            if (css) {
                promises.push(copy(css, publicDest + 'custom.css'));
            }
            return Promise.all(promises);
        });
}
