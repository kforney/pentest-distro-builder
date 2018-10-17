'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable: no-any one-line no-suspicious-comment prefer-template prefer-const no-unnecessary-callback-wrapper no-function-expression no-string-literal no-control-regex no-shadowed-variable
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const vscode_1 = require("vscode");
const sysTypes_1 = require("./variables/sysTypes");
exports.IS_WINDOWS = /^win/.test(process.platform);
exports.Is_64Bit = os.arch() === 'x64';
exports.PATH_VARIABLE_NAME = exports.IS_WINDOWS ? 'Path' : 'PATH';
function fsExistsAsync(filePath) {
    return new Promise(resolve => {
        fs.exists(filePath, exists => {
            return resolve(exists);
        });
    });
}
exports.fsExistsAsync = fsExistsAsync;
function fsReaddirAsync(root) {
    return new Promise(resolve => {
        // Now look for Interpreters in this directory
        fs.readdir(root, (err, subDirs) => {
            if (err) {
                return resolve([]);
            }
            resolve(subDirs.map(subDir => path.join(root, subDir)));
        });
    });
}
exports.fsReaddirAsync = fsReaddirAsync;
function formatErrorForLogging(error) {
    let message = '';
    if (typeof error === 'string') {
        message = error;
    }
    else {
        if (error.message) {
            message = `Error Message: ${error.message}`;
        }
        if (error.name && error.message.indexOf(error.name) === -1) {
            message += `, (${error.name})`;
        }
        const innerException = error.innerException;
        if (innerException && (innerException.message || innerException.name)) {
            if (innerException.message) {
                message += `, Inner Error Message: ${innerException.message}`;
            }
            if (innerException.name && innerException.message.indexOf(innerException.name) === -1) {
                message += `, (${innerException.name})`;
            }
        }
    }
    return message;
}
exports.formatErrorForLogging = formatErrorForLogging;
function getSubDirectories(rootDir) {
    return new Promise(resolve => {
        fs.readdir(rootDir, (error, files) => {
            if (error) {
                return resolve([]);
            }
            const subDirs = [];
            files.forEach(name => {
                const fullPath = path.join(rootDir, name);
                try {
                    if (fs.statSync(fullPath).isDirectory()) {
                        subDirs.push(fullPath);
                    }
                }
                // tslint:disable-next-line:no-empty
                catch (ex) { }
            });
            resolve(subDirs);
        });
    });
}
exports.getSubDirectories = getSubDirectories;
function getWindowsLineEndingCount(document, offset) {
    const eolPattern = new RegExp('\r\n', 'g');
    const readBlock = 1024;
    let count = 0;
    let offsetDiff = offset.valueOf();
    // In order to prevent the one-time loading of large files from taking up too much memory
    for (let pos = 0; pos < offset; pos += readBlock) {
        let startAt = document.positionAt(pos);
        let endAt;
        if (offsetDiff >= readBlock) {
            endAt = document.positionAt(pos + readBlock);
            offsetDiff = offsetDiff - readBlock;
        }
        else {
            endAt = document.positionAt(pos + offsetDiff);
        }
        let text = document.getText(new vscode_1.Range(startAt, endAt));
        let cr = text.match(eolPattern);
        count += cr ? cr.length : 0;
    }
    return count;
}
exports.getWindowsLineEndingCount = getWindowsLineEndingCount;
function arePathsSame(path1, path2) {
    path1 = path.normalize(path1);
    path2 = path.normalize(path2);
    if (exports.IS_WINDOWS) {
        return path1.toUpperCase() === path2.toUpperCase();
    }
    else {
        return path1 === path2;
    }
}
exports.arePathsSame = arePathsSame;
function getRandom() {
    let num = 0;
    const buf = crypto.randomBytes(2);
    num = (buf.readUInt8(0) << 8) + buf.readUInt8(1);
    const maxValue = Math.pow(16, 4) - 1;
    return (num / maxValue);
}
function getRandomBetween(min = 0, max = 10) {
    const randomVal = getRandom();
    return min + (randomVal * (max - min));
}
exports.getRandomBetween = getRandomBetween;
class Random {
    getRandomInt(min = 0, max = 10) {
        return getRandomBetween(min, max);
    }
}
exports.Random = Random;
/**
 * Return [parent name, name] for the given qualified (dotted) name.
 *
 * Examples:
 *  'x.y'   -> ['x', 'y']
 *  'x'     -> ['', 'x']
 *  'x.y.z' -> ['x.y', 'z']
 *  ''      -> ['', '']
 */
function splitParent(fullName) {
    if (fullName.length === 0) {
        return ['', ''];
    }
    const pos = fullName.lastIndexOf('.');
    if (pos < 0) {
        return ['', fullName];
    }
    const parentName = fullName.slice(0, pos);
    const name = fullName.slice(pos + 1);
    return [parentName, name];
}
exports.splitParent = splitParent;
/**
 * Return the range represented by the given string.
 *
 * If a number is provided then it is used as both lines and the
 * character are set to 0.
 *
 * Examples:
 *  '1:5-3:5' -> Range(1, 5, 3, 5)
 *  '1-3'     -> Range(1, 0, 3, 0)
 *  '1:3-1:5' -> Range(1, 3, 1, 5)
 *  '1-1'     -> Range(1, 0, 1, 0)
 *  '1'       -> Range(1, 0, 1, 0)
 *  '1:3-'    -> Range(1, 3, 1, 0)
 *  '1:3'     -> Range(1, 3, 1, 0)
 *  ''        -> Range(0, 0, 0, 0)
 *  '3-1'     -> Range(1, 0, 3, 0)
 */
function parseRange(raw) {
    if (sysTypes_1.isNumber(raw)) {
        return new vscode_1.Range(raw, 0, raw, 0);
    }
    if (raw === '') {
        return new vscode_1.Range(0, 0, 0, 0);
    }
    const parts = raw.split('-');
    if (parts.length > 2) {
        throw new Error(`invalid range ${raw}`);
    }
    const start = parsePosition(parts[0]);
    let end = start;
    if (parts.length === 2) {
        end = parsePosition(parts[1]);
    }
    return new vscode_1.Range(start, end);
}
exports.parseRange = parseRange;
/**
 * Return the line/column represented by the given string.
 *
 * If a number is provided then it is used as the line and the character
 * is set to 0.
 *
 * Examples:
 *  '1:5' -> Position(1, 5)
 *  '1'   -> Position(1, 0)
 *  ''    -> Position(0, 0)
 */
function parsePosition(raw) {
    if (sysTypes_1.isNumber(raw)) {
        return new vscode_1.Position(raw, 0);
    }
    if (raw === '') {
        return new vscode_1.Position(0, 0);
    }
    const parts = raw.split(':');
    if (parts.length > 2) {
        throw new Error(`invalid position ${raw}`);
    }
    let line = 0;
    if (parts[0] !== '') {
        if (!/^\d+$/.test(parts[0])) {
            throw new Error(`invalid position ${raw}`);
        }
        line = +parts[0];
    }
    let col = 0;
    if (parts.length === 2 && parts[1] !== '') {
        if (!/^\d+$/.test(parts[1])) {
            throw new Error(`invalid position ${raw}`);
        }
        col = +parts[1];
    }
    return new vscode_1.Position(line, col);
}
exports.parsePosition = parsePosition;
//# sourceMappingURL=utils.js.map