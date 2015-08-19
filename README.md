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
For full CLI usage and API see
* gilk generated [markdown](https://github.com/PeterHancock/gilk/tree/master/docs)
* gilk generated [html](http://peterhancock.github.io/gilk/)
