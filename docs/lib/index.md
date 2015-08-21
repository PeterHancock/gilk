# [gilk](/docs/)


# index.js

'require'd modules

``` javascript
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
```

Configuration for the Markdown renderer

``` javascript
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
```

gilk module API

``` javascript
module.exports = function gilk(config) {
```

Default configuration

``` javascript
config = assign({
        dest: '.',
        base: '.',
```

Optional custom Mustache page template

``` javascript
template: null,
markdown: false,
baseurl: '',
title: 'Home',
```

Optional js script

``` javascript
js: null,
```

Optional css script

``` javascript
css: null,
'include-source': false
        },
```

Override default properties and add custom properties

``` javascript
config);

    var defaultTmpl = config.markdown ? 'md.tmpl' : 'html.tmpl';

    var ext =  config.markdown ? '.md' : '.html';
```

Retrieve template content

``` javascript
var tmpl = fs.readFileSync(config.template || path.join(templates, defaultTmpl)).toString(),
    sources = [],
    tasks = [];
if (!config.markdown && !config.template) {
```

stream static resources associated with the default doc template

``` javascript
tasks.push(new Promise(function(resolve) {
    vinylFs.src(path.join(publicSrc, '**/*')).pipe(through(function(resource) {
        stream.queue(resource);
    }, resolve));
}));
    }
```

The documentation transform stream

``` javascript
var stream = through(function(file) {
    var docFile = renderDocFile(tmpl, file, ext, config);
    var sourcePath = path.relative(file.base, docFile.path);
    sources.push({
        href: sourcePath,
        path: file.relative,
        base: file.base
    });
```

stream source js file

``` javascript
if (config['include-source']) {
    this.queue(file);
}
```

stream doc file

``` javascript
this.queue(docFile);
    }, function() {
```

stream a JSON representation of the TOC

``` javascript
stream.queue(new File({
    path: 'toc.json',
    contents: new Buffer(JSON.stringify(sources))
}));
if (config.index) {
```

Render the index doc

``` javascript
var index = config.markdown ? 'README.md' : 'index.html';
tasks.push(
    renderIndex(tmpl, sources, config).then(function(contents) {
        stream.queue(new File({
            path: index,
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
srcfile: file.relative,
comments: comments
```

All `config` properties are available in the doc template

``` javascript
}, config));
    return assign(file.clone({ contents: false }), {
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
```

All `config` properties are available in the doc template

``` javascript
config)
            ));
        });
    });
}
```

