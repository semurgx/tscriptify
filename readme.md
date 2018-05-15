# tscriptify
> Browserify TypeScript transform

## Installation

```console
$ npm install browserify
$ npm install typescript
$ npm install tscriptify
```

## Usage

### Browserify API

Browserify by default discover only `.js` and `.json` files. To enable compiling `.ts` and `.tsx` files you should pass `extensions` option to Browserify.

```js
const browserify = require('browserify');
const tscriptify = require('tscriptify');

const bundler = browserify({extensions: ['.ts']});
bundler.add('example.ts');
bundler.transform(tscriptify, {noImplicitAny: true});
const bundle = bundler.bundle();
bundle.pipe(process.stdout);

```

> TScriptify passes transform options with some changes to TypeScript compiler directly, in other words we can say that the transform options is the compiler options.

> If you're adding a read stream, you should pass `file` option containing the file path.

```js
const fileReadStream = fs.createReadStream(filePath);
bundler.add(fileReadStream {file: filePath});
```

### noEmitOnError

TypeScript by default always emits the source text in spite of errors. If you want to override this behavior pass `noEmitOnError = true` with compiler options. In this case you may hook to Browserify's `'erorr'` event.

```js
bundler.transform(tscriptify, {noEmitOnErrors: true});
const bundle = bundler.bundle();
bundle.on('error', error => {
    console.log(error.message);
});
bundle.pipe(process.stdout);
```

Error will contain only the first diagnostic message.

## Events

### Diagnostics

TScriptify transform has own events, and one of them in a `'diagnostics'` which contains the file path as the first argument and diagnostics array as the second. Browserify doesn't pass-through transform emitted events, so before you can attach a listener for the event you should get reference of the transform:

```js
bundler.on('transform', transform => {
    if(transform instanceof tscriptify.Tscriptifier) {
        transform.on('diagnostics', (filePath, diagnostics) => {
            /* ... */
        });
    }
});
```

### Declarations

Another transform's events is a `'declaration'`. As a `'diagnostics'` events it contains the file path as the first argument; and declaration text as the second. Don't forget to pass `declaration = true` with compilerOptions:

```js
bundler.transform(tscriptify, {declaration: true});
bundler.on('transform', transform => {
    if(transform instanceof tscriptify.Tscriptifier) {
        transform.on('declaration', (filePath, declarationText) => {
            /* ... */
        });
    }
});
```

## Options

### Source Maps
Use Browserify's `debug` option. TypeSriptify will implicitly set `inlineSourceMap = true` in compiler options. But if you want to include sources inlinely in the output source maps, pass `inlineSources = true` implicitly with compiler options.

```js
const bundler = browserify({debug: true, extensions: ['.ts']});
bundler.add('example.ts');
bundler.transform(tscriptify, {noImplicitAny: true, inlineSources: true});
```

### Overrided Compiler Options

#### declarationDir = '', emitBom = false, mapRoot = false, noEmit = false, out = '', outDir = '', outFile = '', rootDir = '', rootDirs = [], sourceMap = false, suppressOutputPathCheck = true

TScriptify doesn't write any files, these options is pontless.

#### inlineSourceMap

`inlieSourceMaps` value depends on Browserify's `debug` option as described in Source Maps.

#### module = 'CommonJS'

Browserify can bundle only CommonJS modules.

#### moduleResolution = 'NodeJS'

Browserify uses NodeJS strategy for module resolution.

## tsconfig.json

Just pass `tsconfig.json` contents as compiler options:

```js
bundler.transform(tscriptify, require('./tsconfig.json'))
```

or

```js
bundler.transform(tscriptify, require('./tsconfig.json').compilerOptions)
```

## Watchify

Because TScriptify is a simple transform, watchify works well as for the other transforms.

## License

MIT
