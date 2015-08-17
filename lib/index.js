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
            pageTmpl: null,
            title: 'Home',
            /* Optional js script */
            js: null,
            /* Optional css script */
            css: null,
            'exclude-source': null
        },
        /* Override default properties and add custom properties */
        config);

    /* Retrieve page template content */
    var pageTmpl = fs.readFileSync(config.pageTmpl || path.join(templates, 'page.tmpl')).toString(),
        sources = [],
        tasks = [];
    if (!config.pageTmpl) {
        /* stream static resources associated with the  default template */
        tasks.push(new Promise(function(resolve) {
            vinylFs.src(path.join(publicSrc, '**/*')).pipe(through(function(resource) {
                stream.queue(resource);
            }, resolve));
        }));
    }

    /* The documentation transform stream */
    var stream = through(function(file) {
        var docFile = renderDocFile(pageTmpl, file, config);
        var sourcePath = path.relative(file.base, docFile.path);
        sources.push({
            href: sourcePath,
            name: path.join(path.dirname(sourcePath), path.basename(sourcePath, '.html')).split(path.sep).join('/')
        });
        /* stream source js file */
        if (!config['exclude-source']) {
            this.queue(file);
        }
        /* stream doc html */
        this.queue(docFile);
    }, function() {
        /* stream a JSON representation of the TOC */
        stream.queue(new File({
            path: 'toc.json',
            contents: new Buffer(JSON.stringify(sources))
        }));
        if (config.index) {
            /* Render the index page */
            tasks.push(
                renderIndex(pageTmpl, sources, config).then(function(contents) {
                    stream.queue(new File({
                        path: 'index.html',
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

function renderDocFile(pageTmpl, file, config) {
    var ext = path.extname(file.path),
        filename = path.basename(file.path, ext);
    var comments = dox.parseComments(file.contents.toString());
    var doc = Mustache.render(pageTmpl,
        assign({
            srcfile: path.relative(config.base, file.path),
            comments: comments
                /* All `config` properties are available in the page template */
        }, config));
    return assign(file.clone(), {
        contents: new Buffer(doc),
        path: file.path.replace(/\.js$/, '.html')
    });
}

function renderIndex(pageTmpl, sources, config) {
    return new Promise(function (resolve, reject) {
        var ext = path.extname(config.index),
            name = path.basename(config.index, ext);

        fs.readFile(config.index, function (err, buf) {
            var comments = [{
                description: {
                    full: markdown(buf.toString())
                }
            }];
            resolve(Mustache.render(pageTmpl,
                assign({
                    isIndex: true,
                    comments: comments,
                    toc: {
                        sources: sources
                    }
                },
                /* All `config` properties are available in the page template */
                config)
            ));
        });
    });
}
