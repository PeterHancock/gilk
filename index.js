#!/usr/bin/env node

require('shelljs/global');

var Promise = require('es6-promise').Promise,
    fs = require('fs'),
    path = require('path'),
    _ = require('underscore'),
    docco = require('docco'),
    cheerio = require('cheerio');

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

    var files = config.files; //TODO validate
    var title = config.title || 'Home';
    var js = config.js;
    var css = config.css;
    var indexFile = config.indexFile;

    function destination(file) {
        return path.join(doccoOutput, path.basename(file, path.extname(file)) + '.html');
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

    function postProc(resolve, reject) {
        files.forEach(function (file) {
            var ext = path.extname(file),
            specName = path.basename(file, ext),
            specFile = path.basename(file),
            $ = cheerio.load(fs.readFileSync(doccoOutput + specName + '.html'));

            if (css) {
                $('head').append('<link rel="stylesheet" media="all" href="custom.css">');
            }

            $('body').prepend(navbar);

            if (js) {
                $('body').append('<script type="text/javascript" src="custom.js"></script>');
            }

            $('body').append('<script type="text/javascript" src="' + specFile + '"></script>');

            fs.writeFileSync(publicDest + specName + '.html', $.html());
            //TODO do this async
            cp(file, publicDest + specFile);
        });
        resolve();
    };


    mkdir('-p', doccoOutput);

    mkdir('-p', publicDest);

    var documentSpecs = new Promise( function (resolve, reject) {
        docco.document({
            args: files,
            output: doccoOutput,
            template: templates + 'page.jst',
            css: '?' // Supresses warning
        }, function () {
            postProc(resolve, reject);
        });

    });

    var copyResources = new Promise(function (resolve, reject) {
        // Add resources to public dir
        cp('-R', publicSrc + '*', publicDest);

        if (js) {
            cp(js, publicDest + 'custom.js');
        }

        if (css) {
            cp(css, publicDest + 'custom.css');
        }
        resolve();
    });

    var promises = [documentSpecs, copyResources];

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

    return Promise.all(promises);
}
