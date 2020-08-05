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

function afterAllArtifactBuild(buildResult) {
    // console.log('\toutDir：' + buildResult.outDir);
    // console.log('\tartifactPaths：' + buildResult.artifactPaths);
    // console.log('\tplatformToTargets：' + JSON.stringify(buildResult.platformToTargets));
    // console.log('\tconfiguration：' + JSON.stringify(buildResult.configuration));

    var artifactPaths = buildResult.artifactPaths;
    artifactPaths.forEach((artifact, index) => {
        // console.log(index + artifact);
        let json = buildResult.configuration;
        let target = Array.isArray(json.win.target) ? json.win.target[0] : json.win.target;
        if (artifact.endsWith('.exe') || artifact.endsWith('.exe.blockmap')) {
            var artifactNew = null;
            if (target.target === 'nsis-web') {
                artifactNew = artifact.replace("-Setup-win", "-Web-Setup-win-x64-ia32");
            } else if (target.target === 'nsis') {
                let arch = Array.isArray(target.arch) ? (target.arch.length > 1 ? 'x64-ia32' : target.arch[0]) : target.arch;
                artifactNew = artifact.replace("-win-", "-win-" + arch + '-');
            }
            if (artifactNew !== null) {
                fs.renameSync(artifact, artifactNew);
                console.log('\t重命名[' + artifact + ']=>[' + artifactNew + ']');
                artifactPaths[index] = artifactNew;
            }
        }
    })
    // console.log('\t发布文件列表：' + artifactPaths);
    return artifactPaths;
}

module.exports = afterAllArtifactBuild;