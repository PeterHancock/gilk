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
For CLI usage and API see the gilk generated [docs](https://PetereHancock.github.io/gilk)
