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

    var pageTmplFile = config.pageTmpl || templates + 'page.tmpl';

    var pageTmpl = fs.readFileSync(pageTmplFile).toString();


    config.title = config.title || 'Home';

    var sources = [];

    var tasks = [];

    if (!config.pageTmpl) {
        tasks.push(new Promise(function (resolve) {
            vinylFs.src(publicSrc + '**/*').pipe(through(function (resource) {
                stream.queue(resource);
            }, resolve));
        }));
    }

    var stream = through(function (file) {
        var docFile = renderDocFile(pageTmpl, file, config, config.title);
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
        if (config.index) {
            tasks.push(
                renderIndex(pageTmpl, sources, config).then(function (contents) {
                    stream.queue(new File({
                        path: 'index.html',
                        contents: new Buffer(contents)
                    }));
                })
            );
        }
        Promise.all(tasks).then(function () {
            stream.queue(null);
        }, function (err) {
            console.error(err);
        });
    });

    return stream;
};

function renderDocFile(pageTmpl, file, config, title) {
    var ext = path.extname(file.path),
        specName = path.basename(file.path, ext),
        specFile = path.basename(file.path);
    var comments = dox.parseComments(file.contents.toString());
    var doc = Mustache.render(pageTmpl,
        _.extend({
            title: title,
            specName: specName,
            specFile: specFile,
            comments: comments
        }, config))
    var docFile = file.clone();
    docFile.contents = new Buffer(doc);
    docFile.path = file.path.replace(/\.js$/, '.html');
    return docFile;
}

function renderIndex(pageTmpl, sources, config) {
    return new Promise(function (resolve, reject) {
        var ext = path.extname(config.index),
            name  = path.basename(config.index, ext);
        var comments = [{
            description: {
                full: markdown(fs.readFileSync(config.index).toString())
            }}];
        var doc = Mustache.render(pageTmpl, {
                isIndex: true,
                title: config.title,
                comments: comments,
                toc: {
                    sources: sources
                }
            });
        resolve(doc);
    });
}
