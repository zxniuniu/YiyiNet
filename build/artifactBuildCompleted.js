/*var builder = require('electron-builder');

var packageJson = require('./package.json');
var options = packageJson.build;

var allType = ['nsis-web', 'x64', 'ia32'];

// create the installer
var electronBuilder = builder.init();
electronBuilder.build(options, function(){

});
*/

const fs = require("fs");
const archEnum = ['ia32', 'x64', 'armv7l', 'arm64'];
const debug = false;

function artifactBuildCompleted(artifactCreated) {
    if (debug) {
        console.log('\tfile：' + artifactCreated.file);
        console.log('\tfileContent：' + artifactCreated.fileContent);
        console.log('\tarch：' + archEnum[artifactCreated.arch]);

        console.log('\tsafeArtifactName：' + artifactCreated.safeArtifactName);

        console.log('\tpackager.packagerOptions：' + JSON.stringify(artifactCreated.packager.packagerOptions));
        console.log('\tpackager.projectDir：' + artifactCreated.packager.projectDir);
        console.log('\tpackager.config：' + JSON.stringify(artifactCreated.packager.config));
        console.log('\tpackager.resourceList：' + JSON.stringify(artifactCreated.packager.resourceList));
        console.log('\tpackager.appInfo' + artifactCreated.packager.appInfo);

        console.log('\ttarget.outDir：' + artifactCreated.target.outDir);
        console.log('\ttarget.options：' + JSON.stringify(artifactCreated.target.options));

        console.log('\tupdateInfo：' + JSON.stringify(artifactCreated.updateInfo));

        console.log('\tpublishConfig：' + artifactCreated.publishConfig);
        console.log('\tisWriteUpdateInfo：' + artifactCreated.isWriteUpdateInfo);
    }

    if (artifactCreated.file.endsWith('.exe') || artifactCreated.file.endsWith('.exe.blockmap')) {
        var target = artifactCreated.packager.config.win.target;
        var fileNew = null;
        if (target.target === 'nsis-web') {
            fileNew = artifactCreated.file.replace("-Setup-win", "-Web-Setup-win-x64-ia32");
        } else if (target.target === 'nsis') {
            let arch = Array.isArray(target.arch) ? (target.arch.length > 1 ? 'x64-ia32' : target.arch[0]) : target.arch;
            fileNew = artifactCreated.file.replace("-win-", "-win-" + arch + '-');
        }
        if (fileNew !== null) {
            fs.renameSync(artifactCreated.file, fileNew);
            console.log('\t重命名[' + artifactCreated.file + ']=>[' + fileNew + ']');
            artifactCreated.file = fileNew;
        }
    }
}

module.exports = artifactBuildCompleted;