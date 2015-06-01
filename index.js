var Promise = require('es6-promise').Promise,
    fs = require('fs-extra'),
    path = require('path'),
    _ = require('underscore'),
    dox = require('dox'),
    cheerio = require('cheerio'),
    File = require('vinyl'),
    vinylFs = require('vinyl-fs'),
    Mustache = require('mustache'),
    through = require('through');


var root = __dirname;
var templates = root + '/templates/';
var publicSrc = root + '/public/';

var pageTmpl = fs.readFileSync(templates + 'page.tmpl').toString();
var navbarTmpl = fs.readFileSync(templates + 'navbar.tmpl').toString();
var navbarJSTmpl = fs.readFileSync(templates + 'navbarJS.tmpl').toString();

var markdown = require('marked');

var renderer = new markdown.Renderer();

renderer.heading = function (text, level) {
    return '<h' + level + '>' + text + '</h' + level + '>\n';
};

renderer.paragraph = function (text) {
    return '<p>' + text + '</p>';
};

renderer.br = function () {
    return '<br />';
};

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

    var navbar = Mustache.render(navbarTmpl, {
        title: config.title
    });

    var p = new Promise(function (resolve) {
        vinylFs.src(publicSrc + '**/*').pipe(through(function (resource) {
            stream.queue(resource);
        }, resolve));
    });

    var stream = through(function (file) {
        var docFile = renderDocFile(file, config, navbar);
        var sourcePath = path.relative(file.base, docFile.path);
        sources.push({
            href: sourcePath,
            name: path.basename(sourcePath, '.html')
        });
        this.queue(file);
        this.queue(docFile);
    }, function () {
        stream.queue(new File({
            path: 'navbar.js',
            contents: new Buffer(renderNavbarJS(sources))
        }));
        var waitFor = [p];
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

function renderDocFile(file, config, navbar) {
    var ext = path.extname(file.path),
    specName = path.basename(file.path, ext),
    specFile = path.basename(file.path);
    var comments = dox.parseComments(file.contents.toString());
    var doc = Mustache.render(pageTmpl,
        _.extend({
            navbar: true,
            specFile: specFile,
            comments: comments
        }, config))
    var docFile = file.clone();
    var $ = cheerio.load(doc);
    $('body').prepend(navbar);
    docFile.contents = new Buffer($.html());
    docFile.path = file.path.replace(/\.js$/, '.html');
    return docFile;
}

function renderIndex(sources, config) {
    return new Promise(function (resolve, reject) {
        var ext = path.extname(config.index),
            name  = path.basename(config.index, ext),
            toc = Mustache.render(fs.readFileSync(templates + 'toc.tmpl').toString(), {
                title: 'Table of Contents',
                sources: sources
            }),
            navbar = Mustache.render(navbarTmpl, {
                title: config.title,
                sources: sources
            });
        var comments = [{
            description: {
                full: markdown(fs.readFileSync(config.index).toString())
            }}];
        var doc = Mustache.render(pageTmpl, {
                title: config.title,
                comments: comments
            });
        var $ = cheerio.load(doc);
        $('body').prepend(navbar);
        $('.header').append(toc);
        resolve($.html());
    });
}

function renderNavbarJS(sources) {
    return Mustache.render(navbarJSTmpl, {
        sources: sources
    });
}
