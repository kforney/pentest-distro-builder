'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const vscode = require("vscode");
// REMIND: move this into own file? seems handy
const findCfg = checkPath => {
    try {
        fs.accessSync(path.join(checkPath, '.rubocop.yml'));
        return checkPath;
    }
    catch (e) {
        let nextCheckPath = path.dirname(checkPath);
        if (nextCheckPath && nextCheckPath !== checkPath)
            return findCfg(nextCheckPath);
    }
};
//
// Wrapper class around rubocop. AutoCorrect parses options and runs rubocop to
// format documents.
//
class AutoCorrect {
    constructor() {
        // Arguments for running rubocop.
        //
        // REMIND: is this useful? Might be better to just allow
        // ruby.lint.rubocop = { args : "xxx" }
        this.args = (root) => {
            let args = ['-a', '-f', 'simple'];
            if (root) {
                const cfgPath = findCfg(root);
                if (cfgPath) {
                    args = args.concat(['-c', path.join(cfgPath, '.rubocop.yml')]);
                }
            }
            const opts = this.opts;
            if (opts.lint) {
                args.push('-l');
            }
            if (opts.only) {
                args = args.concat('--only', opts.only.join(','));
            }
            if (opts.except) {
                args = args.concat('--except', opts.except.join(','));
            }
            if (opts.rails) {
                args.push('-R');
            }
            if (opts.require) {
                args = args.concat('-r', opts.require.join(','));
            }
            return args;
        };
        //
        // Is rubocop ready to run? Really important to have decent error messages
        // here to make it easier for users to debug config issues.
        //
        this.spawn = (args, options) => {
            const exe = this.exe;
            const spawnOpt = options ? options : {};
            if (!spawnOpt.cwd) {
                spawnOpt.cwd = vscode.workspace.rootPath;
            }
            return cp.spawn(exe.shift(), exe.concat(args), spawnOpt);
        };
    }
    // get options from ruby.lint.rubocop. We have to do this every time because
    // options can change while the extension is loaded.
    get opts() {
        const opts = vscode.workspace.getConfiguration('ruby.lint.rubocop');
        if (!opts || opts === true) {
            return {};
        }
        return opts;
    }
    // What's the exe name for rubocop?
    get exe() {
        const opts = this.opts;
        if (opts.exe) {
            return [opts.exe];
        }
        const ext = process.platform === 'win32' ? '.bat' : '';
        if (vscode.workspace.getConfiguration('ruby').useBundler) {
            return [`bundle${ext}`, 'exec', 'rubocop'];
        }
        return [`rubocop${ext}`];
    }
    test() {
        return new Promise((resolve, reject) => {
            const rubo = this.spawn(['-v']);
            rubo.on('error', err => {
                if (err.message.includes('ENOENT')) {
                    vscode.window.showErrorMessage(`couldn't find ${this.exe} for formatting (ENOENT)`);
                }
                else {
                    vscode.window.showErrorMessage(`couldn't run ${this.exe} '${err.message}'`);
                }
                reject(err);
            });
            rubo.stderr.on('data', data => {
                // for debugging
                console.log(`rubocop stderr ${data}`);
            });
            rubo.stdout.on('data', data => {
                // for debugging
                console.log(`rubocop stdout ${data}`);
            });
            rubo.on('exit', code => {
                if (code) {
                    vscode.window.showErrorMessage(`rubocop failed with code=${code}`);
                    return reject();
                }
                // success!
                console.log(`rubocop is ready to go!`);
                resolve();
            });
        });
    }
    //
    // format!
    //
    // Write to a temp file, format the file, then return the result.
    //
    correct(data, root) {
        return new Promise((resolve, reject) => fs.mkdtemp(path.join(os.tmpdir(), 'rubocop'), (err, folder) => {
            if (err)
                return reject(err); // not common
            const args = this.args(root);
            const tmpfile = path.join(folder, 'tmp.rb');
            args.push(tmpfile);
            fs.writeFile(tmpfile, data, err => {
                if (err)
                    return reject(err); // not common
                console.log(`${this.exe} ${args.join(' ')}`);
                const startTm = new Date().getTime();
                const rubo = this.spawn(args, {
                    cwd: root || process.cwd(),
                    env: process.env,
                });
                rubo.on('error', error => {
                    vscode.window.showErrorMessage(`couldn't run rubocop '${error.message}'`);
                    reject(error);
                });
                rubo.stderr.on('data', data => {
                    // for debugging
                    console.log(`rubocop stderr ${data}`);
                });
                rubo.on('exit', code => {
                    // https://github.com/bbatsov/rubocop/blob/master/manual/basic_usage.md
                    if (code && code !== 1) {
                        vscode.window.showErrorMessage(`rubocop failed with code=${code}`);
                        return reject();
                    }
                    fs.readFile(tmpfile, 'utf8', (err, result) => {
                        if (err)
                            reject(err); // not common
                        // success!
                        const elapsedTm = new Date().getTime() - startTm;
                        console.log(`rubocop ran in ${elapsedTm}ms`);
                        resolve(result);
                    });
                });
            });
        }));
    }
}
exports.AutoCorrect = AutoCorrect;
//# sourceMappingURL=RuboCop.js.map