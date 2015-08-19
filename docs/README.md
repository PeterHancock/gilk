# [gilk](/docs/)

## Table of Content
* [bin/cmd](/docs/bin/cmd.md)
* [lib/index](/docs/lib/index.md)

# gilk

Convert literate-style `js` to `html`

## Install

```
npm install -g gilk
```

## Usage

```
gilk  <glob> [<glob>...] [options]
```

Example: Generate gilk docs

```
gilk bin/cmd.js lib/*.js --index README.md --dest docs/public --title gilk --exclude-source
```
For CLI usage and API see the  [docs](https://PeterHancock.github.io/gilk)

