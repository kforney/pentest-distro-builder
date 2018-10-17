Object.defineProperty(exports, "__esModule", { value: true });
class InstallationInformation {
    constructor() {
        this.hasError = false;
        this.telemetryProperties = {};
    }
}
exports.InstallationInformation = InstallationInformation;
let installBlob;
function getInstallationInformation() {
    if (!installBlob) {
        installBlob = new InstallationInformation();
    }
    return installBlob;
}
exports.getInstallationInformation = getInstallationInformation;
function setInstallationStage(stage) {
    getInstallationInformation().stage = stage;
}
exports.setInstallationStage = setInstallationStage;
//# sourceMappingURL=installationInformation.js.map