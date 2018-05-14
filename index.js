const {Transform} = require('stream');
const ts = require('typescript');

const defaultCompilerOptions = {
    charset: 'utf8',
    target: ts.ScriptTarget.ES3
};
const overridedCompilerOptions = {
    allowNonTsExtensions: true,
    declarationDir: '',
    emitBOM: false,
    inlineSourceMap: false,
    mapRoot: '',
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    noEmit: false,
    out: '',
    outDir: '',
    outFile: '',
    rootDir: '',
    rootDirs: [],
    sourceMap: false,
    suppressOutputPathCheck: true
};
const cache = new Map();
let program = null;

class Tscriptifier extends Transform {
    constructor(filePath, compilerOptions = {}) {
        compilerOptions = {
            ...defaultCompilerOptions,
            ...compilerOptions,
            ...overridedCompilerOptions
        };
        compilerOptions.inlineSourceMap = compilerOptions._flag && compilerOptions._flag.debug;

        super({encoding: compilerOptions.charset});

        this.filePath = filePath;
        this.compilerOptions = compilerOptions;
        this.sourceText = '';
    }

    _transform(data, encoding, callback) {
        this.sourceText += data.toString();
        callback(null);
    }

    _flush(callback) {
        const normalizedFilePath = ts.normalizePath(this.filePath);
        let outputText = '';

        const sourceFile = ts.createSourceFile(
            normalizedFilePath,
            this.sourceText,
            this.compilerOptions.target,
            false,
            ts.getScriptKindFromFileName(normalizedFilePath)
        );

        const compilerOptionsDiagnostics = [];
        this.compilerOptions = ts.fixupCompilerOptions(this.compilerOptions, compilerOptionsDiagnostics);

        const defaultCompilerHost = ts.createCompilerHost(this.compilerOptions);
        const compilerHost = {
            ...defaultCompilerHost,
            fileExists: filePath => normalizedFilePath === filePath ? true : defaultCompilerHost.fileExists(filePath),
            getSourceFile: filePath => normalizedFilePath === filePath ? sourceFile : defaultCompilerHost.getSourceFile(filePath),
            readFile: filePath => normalizedFilePath === filePath ? this.sourceText : defaultCompilerHost.readFile(filePath),
            writeFile: (filePath, text) => {
                if(ts.fileExtensionIs(filePath, '.d.ts')) {
                    this.emit('declaration', this.filePath, text);
                    return;
                }

                outputText = text;
            }
        };

        program = ts.createProgram(
            [this.filePath],
            this.compilerOptions,
            compilerHost,
            program
        );
        const emitResult = program.emit(sourceFile);

        const diagnostics = [
            ...compilerOptionsDiagnostics,
            ...ts.getPreEmitDiagnostics(program),
            ...emitResult.diagnostics
        ];

        this.emit('diagnostics', this.filePath, diagnostics);

        if(emitResult.emitSkipped) {
            callback(new Error(ts.formatDiagnostic(diagnostics[0], compilerHost)));
        } else {
            callback(null, outputText);
        }
    }
}

const tscriptify = (filePath, compilerOptions) => {
    return new Tscriptifier(filePath, compilerOptions);
};

tscriptify.Tscriptifier = Tscriptifier;

module.exports = tscriptify;
