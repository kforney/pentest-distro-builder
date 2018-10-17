Object.defineProperty(exports, "__esModule", { value: true });
var ArchType;
(function (ArchType) {
    ArchType[ArchType["ia32"] = 0] = "ia32";
    ArchType[ArchType["x64"] = 1] = "x64";
})(ArchType = exports.ArchType || (exports.ArchType = {}));
class ArchitectureReplacer {
    static checkAndReplaceWSLPipeProgram(pipeProgramStr, expectedArch) {
        let replacedPipeProgram = null;
        const winDir = process.env.WINDIR ? process.env.WINDIR.toLowerCase() : null;
        const winDirAltDirSep = process.env.WINDIR ? process.env.WINDIR.replace('\\', '/').toLowerCase() : null;
        const winDirEnv = "${env:windir}";
        if (winDir && winDirAltDirSep && (pipeProgramStr.indexOf(winDir) === 0 || pipeProgramStr.indexOf(winDirAltDirSep) === 0 || pipeProgramStr.indexOf(winDirEnv) === 0)) {
            if (expectedArch === ArchType.x64) {
                const pathSep = ArchitectureReplacer.checkForFolderInPath(pipeProgramStr, "sysnative");
                if (pathSep) {
                    replacedPipeProgram = pipeProgramStr.replace(`${pathSep}sysnative${pathSep}`, `${pathSep}system32${pathSep}`);
                }
            }
            else if (expectedArch === ArchType.ia32) {
                const pathSep = ArchitectureReplacer.checkForFolderInPath(pipeProgramStr, "system32");
                if (pathSep) {
                    replacedPipeProgram = pipeProgramStr.replace(`${pathSep}system32${pathSep}`, `${pathSep}sysnative${pathSep}`);
                }
            }
        }
        return replacedPipeProgram;
    }
    static checkForFolderInPath(path, folder) {
        if (path.indexOf(`/${folder}/`) >= 0) {
            return '/';
        }
        else if (path.indexOf(`\\${folder}\\`) >= 0) {
            return '\\';
        }
        return "";
    }
}
exports.ArchitectureReplacer = ArchitectureReplacer;
//# sourceMappingURL=utils.js.map