var Promise = require('es6-promise').Promise,
    fs = require('fs-extra'),
    path = require('path'),
    _ = require('underscore'),
    dox = require('dox'),
    File = require('vinyl'),
    vinylFs = require('vinyl-fs'),
    Mustache = require('mustache'),
    through = require('through');


var root = __dirname;
var templates = root + '/templates/';
var publicSrc = root + '/public/';

var pageTmpl = fs.readFileSync(templates + 'page.tmpl').toString();

var markdown = require('marked');

var renderer = new markdown.Renderer();

var markedOptions = {
    renderer: renderer
    , gfm: true
    , tables: true
    , breaks: true
    , pedantic: false
    , sanitize: false
    , smartLists: true
    , smartypants: false
};

markdown.setOptions(markedOptions);

/*
{
    title: '',
    js: '',
    css: '',
    index: ''
}
*/
module.exports = function gilk(config) {

    config.title = config.title || 'Home';

    var sources = [];

    var staticResources = new Promise(function (resolve) {
        vinylFs.src(publicSrc + '**/*').pipe(through(function (resource) {
            stream.queue(resource);
        }, resolve));
    });

    var stream = through(function (file) {
        var docFile = renderDocFile(file, config, config.title);
        var sourcePath = path.relative(file.base, docFile.path);
        sources.push({
            href: sourcePath,
            name: path.basename(sourcePath, '.html')
        });
        this.queue(file);
        this.queue(docFile);
    }, function () {
        stream.queue(new File({
            path: 'toc.json',
            contents: new Buffer(JSON.stringify(sources))
        }));
        var waitFor = [staticResources];
        if (config.index) {
            waitFor.push(
                renderIndex(sources, config).then(function (contents) {
                    stream.queue(new File({
                        path: 'index.html',
                        contents: new Buffer(contents)
                    }));
                })
            );
        }
        Promise.all(waitFor).then(function () {
            stream.queue(null);
        }, function (err) {
            console.error(err);
        });
    });

    return stream;
};

function renderDocFile(file, config, title) {
    var ext = path.extname(file.path),
    specName = path.basename(file.path, ext),
    specFile = path.basename(file.path);
    var comments = dox.parseComments(file.contents.toString());
    var doc = Mustache.render(pageTmpl,
        _.extend({
            title: title,
            specFile: specFile,
            comments: comments
        }, config))
    var docFile = file.clone();
    docFile.contents = new Buffer(doc);
    docFile.path = file.path.replace(/\.js$/, '.html');
    return docFile;
}

function renderIndex(sources, config) {
    return new Promise(function (resolve, reject) {
        var ext = path.extname(config.index),
            name  = path.basename(config.index, ext);
        var comments = [{
            description: {
                full: markdown(fs.readFileSync(config.index).toString())
            }}];
        var doc = Mustache.render(pageTmpl, {
                title: config.title,
                comments: comments,
                toc: {
                    sources: sources
                }
            });
        resolve(doc);
    });
}
