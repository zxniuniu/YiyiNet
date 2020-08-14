const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

const deleteFiles = ['LICENSE.electron.txt', 'LICENSES.chromium.html'];
const archEnum = ['ia32', 'x64', 'armv7l', 'arm64'];
const debug = false;

/**
 * Downloads file from remote HTTP[S] host and puts its contents to the specified location.
 */
async function downloadFile(url, filePath) {
    const proto = !url.charAt(4).localeCompare('s') ? https : http;

    return new Promise((resolve, reject) => {
        var file = fs.createWriteStream(filePath);
        var fileInfo = null;

        var request = proto.get(url, response => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }
            fileInfo = {
                mime: response.headers['content-type'],
                size: parseInt(response.headers['content-length'], 10),
            };
            response.pipe(file);
        });

        // The destination stream is ended by the time it's called
        file.on('finish', () => resolve(fileInfo));

        request.on('error', err => {
            fs.unlink(filePath, () => reject(err));
        });

        file.on('error', err => {
            fs.unlink(filePath, () => reject(err));
        });

        request.end();
    });
}

function deleteLocalFile(context) {
    // 删除多余的locale文件
    let localeDir = path.join(context.appOutDir, 'locales');
    // https://jnelson.in/node-js/list-all-files-in-a-directory-using-node-js-recursively-in-a-synchronous-fashion/
    let files = fs.readdirSync(localeDir);
    files.forEach(function (file) {
        let delFilePath = path.join(localeDir, file);
        if (file !== 'zh-CN.pak' && fs.existsSync(delFilePath)) {
            if (file === 'zh-TW.pak') {
                console.log('\t删除：' + delFilePath);
            }
            fs.unlinkSync(delFilePath);
        }
    });
}

function deleteOther(context) {
    // 删除不需要的license文件
    deleteFiles.forEach(function (file) {
        let delFilePath = path.join(context.appOutDir, file);
        if (fs.existsSync(delFilePath)) {
            console.log('\t删除：' + delFilePath);
            fs.unlinkSync(delFilePath);
        }
    });
}

function getElectronVer() {
    var packageJson = require('./../package.json');
    let ver = packageJson.devDependencies.electron.replace('^', '').replace('~', '');
    console.log('\t打包采用的Electron版本：' + ver);
    return ver;
}

async function downloadChromedriver(context) {
    let ver = getElectronVer();
    // 下载并将chromedriver放到根目录
    let chromedriverFilename = 'chromedriver-v' + ver + '-' + context.electronPlatformName + '-' + archEnum[context.arch];
    let chromedriverLocalZip = path.join(process.env.LOCALAPPDATA, 'electron', 'Cache', chromedriverFilename + '.zip');
    let chromedriverExe = path.join(process.env.LOCALAPPDATA, 'electron', 'Cache', chromedriverFilename, 'chromedriver.exe');
    // 检测是否下载，未下载，则下载
    var chromedriverUrl;
    if (!fs.existsSync(chromedriverLocalZip)) {
        // let chromedriverUrl = 'https://npm.taobao.org/mirrors/electron/' + ver + '/' + chromedriverFilename + '.zip';
        chromedriverUrl = 'https://cdn.npm.taobao.org/dist/electron/' + ver + '/' + chromedriverFilename + '.zip';
        console.log('\t下载chromedriver：' + chromedriverUrl);
        await downloadFile(chromedriverUrl, chromedriverLocalZip);
    }
    // 下载完成后解压
    if (!fs.existsSync(chromedriverExe)) {
        const extract = require('extract-zip');

        console.log('\t解压chromedriver：' + chromedriverLocalZip);
        await extract(chromedriverLocalZip, {dir: path.join(process.env.LOCALAPPDATA, 'electron', 'Cache', chromedriverFilename)})
    }

    if (fs.existsSync(chromedriverExe)) {
        fs.copyFileSync(chromedriverExe, path.join(context.appOutDir, 'chromedriver.exe'));
        console.log('\t复制文件到打包根目录：' + chromedriverExe);
    } else {
        console.log('\t文件不存在，请从npm.taobao.com下载：' + chromedriverUrl);
    }
}

async function afterPack(context) {
    // 删除 README 文件，使其不加入 Setup 包中。
    /*let readmePath = path.join(context.appOutDir,"resources/app.asar.unpacked/README.md");
    if(fs.existsSync(readmePath)){
        fs.unlinkSync(readmePath);
    }*/

    if (debug) {
        console.log('\toutDir：' + context.outDir);
        console.log('\tappOutDir：' + context.appOutDir);
        console.log('packager：' + context.packager);
        console.log('\telectronPlatformName：' + context.electronPlatformName);
        console.log('\tarch：' + archEnum[context.arch]);
        console.log('targets：' + context.targets);
    }

    deleteLocalFile(context);
    deleteOther(context);

    // 目前不下载并复制到打包目录了，软件在打开时自动下载
    // await downloadChromedriver(context);
}

module.exports = afterPack;