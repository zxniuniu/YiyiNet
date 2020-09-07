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


async function doExtractNodeModules(context) {
    let asar = require('asar');
    let resourcesDir = path.join(context.appOutDir, 'resources');
    let appDir = path.join(resourcesDir, 'app');
    let asarDir = path.join(resourcesDir, 'app.asar');

    // 解压后复制node_modules
    await asar.extractAll(asarDir, appDir);
    fs.renameSync(path.join(appDir, 'node_modules'), path.join(resourcesDir, 'node_modules'))
    // await copyDir(path.join(resourcesDir, 'app', 'node_modules'), path.join(resourcesDir, 'node_modules'), console.log);

    // 重新压缩asar文件
    asar.createPackage(appDir, asarDir).then(() => {
        removeDir(appDir);
        console.log('\t解压app.asar中的node_modules文件夹到资源目录，并已重新生成app.asar文件');
    });
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

    // 解压app.asar并将node_modules拷贝到文件夹外面
    doExtractNodeModules(context);

}

/*
 * 复制目录、子目录，及其中的文件
 * @param src {String} 要复制的目录
 * @param dist {String} 复制到目标目录
 */
function copyDir(src, dist, callback) {
    fs.access(dist, function (err) {
        if (err) {
            // 目录不存在时创建目录
            fs.mkdirSync(dist);
        }
        _copy(null, src, dist);
    });

    function _copy(err, src, dist) {
        if (err) {
            callback(err);
        } else {
            fs.readdir(src, function (err, paths) {
                if (err) {
                    callback(err)
                } else {
                    paths.forEach(function (path) {
                        let _src = src + '/' + path;
                        let _dist = dist + '/' + path;
                        fs.stat(_src, function (err, stat) {
                            if (err) {
                                callback(err);
                            } else {
                                // 判断是文件还是目录
                                if (stat.isFile()) {
                                    fs.writeFileSync(_dist, fs.readFileSync(_src));
                                } else if (stat.isDirectory()) {
                                    // 当是目录是，递归复制
                                    copyDir(_src, _dist, callback)
                                }
                            }
                        })
                    })
                }
            })
        }
    }
}

function removeDir(dir) {
    let files = fs.readdirSync(dir)
    for (var i = 0; i < files.length; i++) {
        let newPath = path.join(dir, files[i]);
        let stat = fs.statSync(newPath)
        if (stat.isDirectory()) {
            //如果是文件夹就递归下去
            removeDir(newPath);
        } else {
            //删除文件
            fs.unlinkSync(newPath);
        }
    }
    fs.rmdirSync(dir)//如果文件夹是空的，就将自己删除掉
}


module.exports = afterPack;