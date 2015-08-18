/*
# index.js
*/

/*
deps
*/
var Promise = require('es6-promise').Promise,
    assign = require('object-assign'),
    fs = require('fs-extra'),
    path = require('path'),
    dox = require('dox'),
    File = require('vinyl'),
    vinylFs = require('vinyl-fs'),
    Mustache = require('mustache'),
    through = require('through'),
    markdown = require('marked');

var root = path.join(__dirname, '..'),
    templates = path.join(root, 'templates'),
    publicSrc = path.join(root, 'public');

/*
Configuration for the Markdown renderer
*/
markdown.setOptions({
    renderer: new markdown.Renderer(),
    gfm: true,
    tables: true,
    breaks: true,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false
});

module.exports = function gilk(config) {
    /*
    Default configuration
    */
    config = assign({
            base: '.',
            dest: '.',
            /* Optional custom Mustache page template */
            template: null,
            markdown: false,
            baseurl: '',
            title: 'Home',
            /* Optional js script */
            js: null,
            /* Optional css script */
            css: null,
            'exclude-source': null
        },
        /* Override default properties and add custom properties */
        config);

    var defaultTmpl = config.markdown ? 'md.tmpl' : 'html.tmpl';

    var ext =  config.markdown ? '.md' : '.html';

    /* Retrieve template content */
    var tmpl = fs.readFileSync(config.template || path.join(templates, defaultTmpl)).toString(),
        sources = [],
        tasks = [];
    if (!config.markdown && !config.template) {
        /* stream static resources associated with the default doc template */
        tasks.push(new Promise(function(resolve) {
            vinylFs.src(path.join(publicSrc, '**/*')).pipe(through(function(resource) {
                stream.queue(resource);
            }, resolve));
        }));
    }

    /* The documentation transform stream */
    var stream = through(function(file) {
        var docFile = renderDocFile(tmpl, file, ext, config);
        var sourcePath = path.relative(file.base, docFile.path);
        sources.push({
            href: sourcePath,
            name: path.join(path.dirname(sourcePath), path.basename(sourcePath, ext)).split(path.sep).join('/')
        });
        /* stream source js file */
        if (!config['exclude-source']) {
            this.queue(file);
        }
        /* stream doc file */
        this.queue(docFile);
    }, function() {
        /* stream a JSON representation of the TOC */
        stream.queue(new File({
            path: 'toc.json',
            contents: new Buffer(JSON.stringify(sources))
        }));
        if (config.index) {
            /* Render the index doc*/
            tasks.push(
                renderIndex(tmpl, sources, config).then(function(contents) {
                    stream.queue(new File({
                        path: 'index' + ext,
                        contents: new Buffer(contents)
                    }));
                })
            );
        }
        Promise.all(tasks).then(function() {
            stream.queue(null);
        }, function(err) {
            console.error(err);
        });
    });

    return stream;
};

function renderDocFile(tmpl, file, extension, config) {
    var ext = path.extname(file.path),
        filename = path.basename(file.path, ext);
    var comments = dox.parseComments(file.contents.toString(), {raw: config.markdown});
    var doc = Mustache.render(tmpl,
        assign({
            srcfile: path.relative(config.base, file.path),
            comments: comments
                /* All `config` properties are available in the doc template */
        }, config));
    return assign(file.clone(), {
        contents: new Buffer(doc),
        path: file.path.replace(/\.js$/, extension)
    });
}

function renderIndex(tmpl, sources, config) {
    return new Promise(function (resolve, reject) {
        var ext = path.extname(config.index),
            name = path.basename(config.index, ext);

        fs.readFile(config.index, function (err, buf) {
            var md = config.markdown ? buf.toString() : markdown(buf.toString());
            var comments = [{
                description: {
                    full: md
                }
            }];
            resolve(Mustache.render(tmpl,
                assign({
                    isIndex: true,
                    comments: comments,
                    toc: {
                        sources: sources
                    }
                },
                /* All `config` properties are available in the doc template */
                config)
            ));
        });
    });
}
