import {app, BrowserWindow, nativeImage, session} from 'electron';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import zlib from 'zlib';

import unzip from 'unzip-crx';
import StreamZip from 'node-stream-zip';
// import {loadAsync} from "jszip";
import semver from 'semver';
import AsyncLock from 'async-lock';

import {adblockerInstallFinishEvent} from './main/adblocker';
import {hostileInstallFinishEvent} from './main/hosts';

import config from "./configs/app.config";
import {moduleInstallSucc} from './shared/settings';

// import {DownloaderHelper} from 'node-downloader-helper';

/*
var remote = require('electron').remote;
var app = remote.app;
var path = require('path');
var fs = require('fs');
var http = require('http');
var https = require('https');
*/

/**
 * 获取UserData路径
 * @returns {string}
 */
export const getUserData = () => {
    return app.getPath('userData');
};

/**
 * 获取appData路径
 * @returns {string}
 */
export const getAppData = () => {
    return app.getPath('appData');
};

/**
 * 获取Electron Cache路径
 * @returns {string}
 */
export const getElectronCachePath = () => {
    return checkPath(path.join(process.env.LOCALAPPDATA, 'electron', 'Cache'));
};

/**
 * 获取Adblock路径
 * @returns {string}
 */
export const getAdblockPath = () => {
    return checkPath(path.join(getUserData(), 'Adblocker'));
};

/**
 * 获取扩展路径
 * @returns {string}
 */
export const getExtensionsPath = () => {
    const savePath = getUserData();
    return checkPath(path.resolve(`${savePath}/extensions/`));
};

/**
 * 获取YiyiNet根目录
 * @returns {string}
 */
export const getRootPath = () => {
    return path.dirname(process.execPath);
};

/**
 * 获取NPM模块安装路径
 * @returns {string}
 */
export const getNpmInstallPath = () => {
    // 保存在getUserData() + 'node_modules'中未解决加载时的路径问题
    const savePath = path.join(getRootPath(), 'resources', 'app'); // process.resourcesPath
    return checkPath(path.resolve(`${savePath}/node_modules/`));
};

export function checkPath(filePath) {
    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, {recursive: true});
    }
    return filePath;
}
/**
 * 为NPM增加扫描路径
 * @returns {string}
 */
export const addNpmModulePath = () => {
    // let modulePath = process.env.APPDATA + '\\' + process.env.npm_package_productName + '\\node_modules';
    // require('module').globalPaths.push(modulePath);
    // require('module').globalPaths.push(getNpmInstallPath());
    // module.paths.push(getNpmInstallPath());
};

/**
 * 获取chromedriver路径
 */
export const getChromedriverFilePath = () => {
    return path.join(getRootPath(), getChromedriverExeName());
};

/**
 * 获取chromedriver文件名（平台兼容）
 */
export const getChromedriverExeName = () => {
    return 'chromedriver' + (process.platform === 'win32' ? '.exe' : '');
};

/**
 * 根据地址获取http或者https
 * @param url
 * @returns {any}
 */
export function getHttpOrHttps(url) {
    return !url.charAt(4).localeCompare('s') ? https : http;
}

/**
 * 检查链接地址是否可用
 * isUrlValid('https://www.baidu.com', (flag)=>{console.log(flag)});
 */
export function isUrlValid(url) {
    const proto = getHttpOrHttps(url);
    return new Promise((resolve, reject) => {
        let req = proto.get(url, response => {
            return resolve(response.statusCode === 200 || (response.statusCode >= 300 && response.statusCode));
        }).on('error', (err) => {
            return resolve(false);
        });
        req.end();
    });
}

/**
 * 下载并保存文件
 * @param url
 * @param filePath
 * @returns {Promise<unknown>}
 */
export const downloadFile = (url, filePath) => {
    const proto = getHttpOrHttps(url);
    return new Promise((resolve, reject) => {
        let file = fs.createWriteStream(filePath);
        let request = proto.get(url, response => {
            // console.log('response.headers: '); console.dir(response.headers);
            if (response.statusCode !== 200) {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    return downloadFile(response.headers.location, filePath).then(resolve).catch(reject);
                } else {
                    reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                    return;
                }
            }
            switch (response.headers['content-encoding']) {
                case 'br':
                    response.pipe(zlib.createBrotliDecompress()).pipe(file);
                    break;
                case 'gzip': // 或者, 只是使用 zlib.createUnzip() 方法去处理这两种情况：
                    response.pipe(zlib.createGunzip()).pipe(file);
                    break;
                case 'deflate':
                    response.pipe(zlib.createInflate()).pipe(file);
                    break;
                default:
                    response.pipe(file);
                    break;
            }
        });
        // The destination stream is ended by the time it's called
        file.on('finish', () => resolve());
        request.on('error', err => {
            file.close();
            fs.unlink(filePath, () => reject(err));
        });
        file.on('error', err => {
            file.close();
            fs.unlink(filePath, () => reject(err));
        });
        request.end();
    });
};

/**
 * 解压文件
 * @param from
 * @param to
 * @returns {Promise<unknown>}
 */
async function extractFile(from, to) {

}

/**
 * 下载Chromedriver
 */
export function downloadChromedriver() {
    let chromedriverFilePath = getChromedriverFilePath(); //
    if (fs.existsSync(chromedriverFilePath)) {
        return;
    }

    let chromedriverName = getChromedriverExeName();
    let ver = process.versions.electron, platform = process.platform, arch = process.arch;
    let cachePath = getElectronCachePath();

    // 下载并将chromedriver放到根目录
    let chromedriverFilename = 'chromedriver-v' + ver + '-' + platform + '-' + arch;
    let chromedriverLocalZip = path.join(cachePath, chromedriverFilename + '.zip');
    let chromedriverExe = path.join(cachePath, chromedriverFilename, chromedriverName);

    // 检测是否下载，未下载，则下载
    // let chromedriverUrl = 'https://npm.taobao.org/mirrors/electron/9.1.2/chromedriver-v9.1.2-win32-x64.zip';
    let chromedriverUrl = 'https://cdn.npm.taobao.org/dist/electron/' + ver + '/' + chromedriverFilename + '.zip';
    let iLock = new AsyncLock({timeout: 60000});
    if (!fs.existsSync(chromedriverLocalZip)) {
        iLock.acquire("downloadChromedriver", function (done) {
            console.log('下载chromedriver：' + chromedriverUrl);
            downloadFile(chromedriverUrl, chromedriverLocalZip).then(() => {
                done();
            })
        }, function (err, ret) {
        }, {});
    }

    // 下载完成后解压
    if (!fs.existsSync(chromedriverExe)) {
        iLock.acquire("downloadChromedriver", function (done) {
            console.log('解压chromedriver：' + chromedriverLocalZip);
            let folder = path.join(cachePath, chromedriverFilename);
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder, {recursive: true});
            }
            /*// 采用JSZip反应太慢
            fs.readFile(chromedriverLocalZip, function(err, data) {
                if (err) throw err;
                loadAsync(data).then(zip => {
                    // console.log(zip.files);
                    zip.files[chromedriverName].nodeStream().pipe(fs.createWriteStream(path.join(folder, chromedriverName)))
                        .on('finish', function () {
                            done();
                        });
                });
            });*/
            const zip = new StreamZip({
                file: chromedriverLocalZip,
                storeEntries: true
            });
            zip.on('error', err => {
                // 如果出错，说明压缩包有问题，将其删除
                fs.unlinkSync(chromedriverLocalZip);
            });
            zip.on('ready', () => {
                zip.extract(null, folder, (err, count) => {
                    zip.close();
                    done();
                });
            });
        }, function (err, ret) {
        }, {});
    }

    // 复制到软件根目录
    iLock.acquire("downloadChromedriver", function (done) {
        if (fs.existsSync(chromedriverExe)) {
            fs.copyFile(chromedriverExe, chromedriverFilePath, (err) => {
                if (err) throw err;
                console.log('复制以下文件到根目录：' + chromedriverExe);
                done();
            });
        }
    }, function (err, ret) {
    }, {});
}

/**
 * 修改目录权限
 * @param dir
 * @param mode
 */
export const changePermissions = (dir, mode) => {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filePath = path.join(dir, file);
        fs.chmodSync(filePath, parseInt(mode, 8));
        if (fs.statSync(filePath).isDirectory()) {
            changePermissions(filePath, mode);
        }
    });
};

/**
 * 删除文件夹
 * @param {string} dir_path
 * @see https://stackoverflow.com/a/42505874/3027390
 */
export function delFolder(dir_path) {
    if (fs.existsSync(dir_path)) {
        fs.readdirSync(dir_path).forEach(function (entry) {
            let entry_path = path.join(dir_path, entry);
            if (fs.lstatSync(entry_path).isDirectory()) {
                delFolder(entry_path);
            } else {
                fs.unlinkSync(entry_path);
            }
        });
        fs.rmdirSync(dir_path);
    }
}

/**
 * 根据chromeStoreID下载crx插件
 * @param chromeStoreID
 * @param forceDownload
 * @param attempts
 * @returns {Promise<unknown>}
 */
export const downloadChromeExtension = (chromeStoreID, forceDownload, attempts = 5) => {
    const extensionsStore = getExtensionsPath();
    if (!fs.existsSync(extensionsStore)) {
        fs.mkdirSync(extensionsStore, {recursive: true});
    }
    const extensionFolder = path.resolve(`${extensionsStore}/${chromeStoreID}`);
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(extensionFolder) || forceDownload) {
            if (fs.existsSync(extensionFolder)) {
                delFolder(extensionFolder);
            }
            const fileURL = `https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&x=id%3D${chromeStoreID}%26uc&prodversion=32`; // eslint-disable-line
            const filePath = path.resolve(`${extensionFolder}.crx`);
            downloadFile(fileURL, filePath)
                .then(() => {
                    unzip(filePath, extensionFolder)
                        .then(() => {
                            changePermissions(extensionFolder, 755);
                            resolve(extensionFolder);
                        })
                        .catch((err) => {
                            if (!fs.existsSync(path.resolve(extensionFolder, 'manifest.json'))) {
                                return reject(err);
                            }
                        });
                })
                .catch((err) => {
                    console.log(`Failed to fetch extension, trying ${attempts - 1} more times`); // eslint-disable-line
                    if (attempts <= 1) {
                        return reject(err);
                    }
                    setTimeout(() => {
                        downloadChromeExtension(chromeStoreID, forceDownload, attempts - 1)
                            .then(resolve)
                            .catch(reject);
                    }, 500);
                });
        } else {
            resolve(extensionFolder);
        }
    });
};

/**
 * 安装插件
 * 参见 https://github.com/MarshallOfSound/electron-devtools-installer
 * @param extensionReference
 * @param forceDownload
 * @returns {Promise<never>|Promise<unknown>|*}
 * app.whenReady().then(() => {
 *     installExtension({id: 'bmdblncegkenkacieihfhpjfppoconhi', electron: '>=1.2.1'})
 *        .then((name) => console.log(`Added Extension: ${name}`))
 *        .catch((err) => console.log('An error occurred: ', err));
 * });
 */
export const installExtension = (extensionReference, forceDownload = false) => {
    let IDMap = {};
    const getIDMapPath = () => path.resolve(getExtensionsPath(), 'IDMap.json');
    if (fs.existsSync(getIDMapPath())) {
        try {
            IDMap = JSON.parse(fs.readFileSync(getIDMapPath(), 'utf8'));
        } catch (err) {
            console.error('electron-devtools-installer: Invalid JSON present in the IDMap file');
        }
    }

    if (process.type !== 'browser') {
        return Promise.reject(
            new Error('electron-devtools-installer can only be used from the main process'),
        );
    }

    if (Array.isArray(extensionReference)) {
        return extensionReference.reduce(
            (accum, extension) => accum.then(() => install(extension, forceDownload)),
            Promise.resolve(),
        );
    }
    let chromeStoreID;
    if (typeof extensionReference === 'object' && extensionReference.id) {
        chromeStoreID = extensionReference.id;
        const electronVersion = process.versions.electron.split('-')[0];
        if (!semver.satisfies(electronVersion, extensionReference.electron)) {
            return Promise.reject(
                new Error(
                    `Version of Electron: ${electronVersion} does not match required range ${extensionReference.electron} for extension ${chromeStoreID}`,
                ), // eslint-disable-line
            );
        }
    } else if (typeof extensionReference === 'string') {
        chromeStoreID = extensionReference;
    } else {
        return Promise.reject(
            new Error(`Invalid extensionReference passed in: "${extensionReference}"`),
        );
    }
    const extensionName = IDMap[chromeStoreID];
    let extensionInstalled = extensionName;

    // For Electron >=9.
    if (session.defaultSession.getExtension) {
        extensionInstalled =
            extensionInstalled &&
            session.defaultSession.getAllExtensions().find((e) => e.name === extensionName);
    } else {
        extensionInstalled =
            extensionInstalled &&
            BrowserWindow.getDevToolsExtensions &&
            BrowserWindow.getDevToolsExtensions().hasOwnProperty(extensionName);
    }

    if (!forceDownload && extensionInstalled) {
        return Promise.resolve(IDMap[chromeStoreID]);
    }

    return downloadChromeExtension(chromeStoreID, forceDownload).then((extensionFolder) => {
        // Use forceDownload, but already installed
        if (extensionInstalled) {
            // For Electron >=9.
            if (session.defaultSession.removeExtension) {
                const extensionId = session.defaultSession.getAllExtensions().find((e) => e.name).id;
                session.defaultSession.removeExtension(extensionId);
            } else {
                BrowserWindow.removeDevToolsExtension(extensionName);
            }
        }

        // For Electron >=9.
        if (session.defaultSession.loadExtension) {
            return session.defaultSession.loadExtension(extensionFolder).then((ext) => {
                return Promise.resolve(ext.name);
            });
        }

        const name = BrowserWindow.addDevToolsExtension(extensionFolder); // eslint-disable-line

        fs.writeFileSync(
            getIDMapPath(),
            JSON.stringify(
                Object.assign(IDMap, {
                    [chromeStoreID]: name,
                }),
            ),
        );
        return Promise.resolve(name);
    });
};

/**
 * 返回NPM镜像路径 参见：https://github.com/gucong3000/mirror-config-china
 * @returns {{registry: string, phantomjs_cdnurl: string, node_sqlite3_binary_host_mirror: string, electron_mirror: string, puppeteer_download_host: string, selenium_cdnurl: string, disturl: string, operadriver_cdnurl: string, npm_config_disturl: string, profiler_binary_host_mirror: string, node_inspector_cdnurl: string, python_mirror: string, chromedriver_cdnurl: string, electron_builder_binaries_mirror: string, sass_binary_site: string, npm_config_profiler_binary_host_mirror: string}}
 */
export const npmConfig = () => {
    return {
        'chromedriver-cdnurl': 'https://npm.taobao.org/mirrors/chromedriver',
        'chromedriver_cdnurl': 'https://npm.taobao.org/mirrors/chromedriver',
        'couchbase-binary-host-mirror': 'https://npm.taobao.org/mirrors/couchbase/v{version}',
        'debug-binary-host-mirror': 'https://npm.taobao.org/mirrors/node-inspector',
        'disturl': 'https://npm.taobao.org/dist',
        'electron-mirror': 'https://npm.taobao.org/mirrors/electron/',
        'electron_builder_binaries_mirror': 'http://npm.taobao.org/mirrors/electron-builder-binaries/',
        'electron_mirror': 'https://npm.taobao.org/mirrors/electron/',
        'flow-bin-binary-host-mirror': 'https://npm.taobao.org/mirrors/flow/v',
        'fse-binary-host-mirror': 'https://npm.taobao.org/mirrors/fsevents',
        'fuse-bindings-binary-host-mirror': 'https://npm.taobao.org/mirrors/fuse-bindings/v{version}',
        'git4win-mirror': 'https://npm.taobao.org/mirrors/git-for-windows',
        'gl-binary-host-mirror': 'https://npm.taobao.org/mirrors/gl/v{version}',
        'grpc-node-binary-host-mirror': 'https://npm.taobao.org/mirrors',
        'hackrf-binary-host-mirror': 'https://npm.taobao.org/mirrors/hackrf/v{version}',
        'leveldown-binary-host-mirror': 'https://npm.taobao.org/mirrors/leveldown/v{version}',
        'leveldown-hyper-binary-host-mirror': 'https://npm.taobao.org/mirrors/leveldown-hyper/v{version}',
        'mknod-binary-host-mirror': 'https://npm.taobao.org/mirrors/mknod/v{version}',
        'node-sqlite3-binary-host-mirror': 'https://npm.taobao.org/mirrors',
        'node-tk5-binary-host-mirror': 'https://npm.taobao.org/mirrors/node-tk5/v{version}',
        'node_inspector_cdnurl': 'http://npm.taobao.org/mirrors/node-inspector/',
        'node_sqlite3_binary_host_mirror': 'http://npm.taobao.org/mirrors',
        'nodegit-binary-host-mirror': 'https://npm.taobao.org/mirrors/nodegit/v{version}/',
        'npm_config_disturl': 'https://npm.taobao.org/mirrors/atom-shell',
        'npm_config_profiler_binary_host_mirror': 'http://npm.taobao.org/mirrors/node-inspector/',
        'operadriver-cdnurl': 'https://npm.taobao.org/mirrors/operadriver',
        'operadriver_cdnurl': 'http://npm.taobao.org/mirrors/operadriver',
        'phantomjs-cdnurl': 'https://npm.taobao.org/mirrors/phantomjs',
        'phantomjs_cdnurl': 'http://npm.taobao.org/mirrors/phantomjs',
        'profiler-binary-host-mirror': 'https://npm.taobao.org/mirrors/node-inspector/',
        'profiler_binary_host_mirror': 'http://npm.taobao.org/mirrors/node-inspector/',
        'puppeteer-download-host': 'https://npm.taobao.org/mirrors',
        'puppeteer_download_host': 'https://npm.taobao.org/mirrors',
        'python-mirror': 'https://npm.taobao.org/mirrors/python',
        'python_mirror': 'http://npm.taobao.org/mirrors/python',
        'rabin-binary-host-mirror': 'https://npm.taobao.org/mirrors/rabin/v{version}',
        'registry': 'https://registry.npm.taobao.org/',
        'sass-binary-site': 'https://npm.taobao.org/mirrors/node-sass',
        'sass_binary_site': 'https://npm.taobao.org/mirrors/node-sass/',
        'selenium_cdnurl': 'https://npm.taobao.org/mirrors/selenium',
        'sodium-prebuilt-binary-host-mirror': 'https://npm.taobao.org/mirrors/sodium-prebuilt/v{version}',
        'sqlite3-binary-site': 'https://npm.taobao.org/mirrors/sqlite3',
        'utf-8-validate-binary-host-mirror': 'https://npm.taobao.org/mirrors/utf-8-validate/v{version}',
        'utp-native-binary-host-mirror': 'https://npm.taobao.org/mirrors/utp-native/v{version}',
        'zmq-prebuilt-binary-host-mirror': 'https://npm.taobao.org/mirrors/zmq-prebuilt/v{version}'
    }
};

/**
 * 根据图标生成指定大小的缩略图，以显示在菜单前
 * @param name
 * @param size
 * @returns {*}
 */
export function getIco(name, size) {
    if (size === undefined) {
        size = 16;
    }
    let img = nativeImage.createFromPath(path.join(__dirname, './../assets/icon/' + name));
    if (size > 0) {
        img = img.resize({width: size});
    }
    return img;
}

/**
 * 检查Module是否安装，而不加载Module
 * @param req_module
 * @returns {boolean}
 */
export function hasModule(req_module) {
    try {
        require.resolve(req_module);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 是否是调试的地址（用于菜单和打开开发者工具）
 */
export function isDebugUrl() {
    let url = config.mainUrl;
    return !app.isPackaged || (app.isPackaged && (url.indexOf('localhost') >= 0 || url.indexOf('cnbeta.com') >= 0));
}

/**
 * Require each JS file in the main dir
 */
function loadMainJS() {
    const glob = require('glob');
    var files = glob.sync(path.join(__dirname, 'main/*.js'));
    files.forEach(function (file) {
        require(file);
    })
}

function asarPath() {
    // https://newsn.net/say/electron-detect-asar.html
    /*const path = require('path');
    var path_arr=__dirname.split(path.sep);
    var entry_relative = path.sep + ""; //入口文件相对于项目根目录
    var res_relative = path.sep + "res" + path.sep; //资源文件夹相对于入口文件js
    var res_dir=__dirname + res_relative;
    if(path_arr.indexOf("app.asar")>=0){
      res_dir = __dirname + entry_relative + ".." + res_relative;
    }
    var res_path=path.join(res_dir, 'res_name.dll');
    console.log(res_path);

    __dirname.split(path.sep).indexOf("app.asar")&gt;=0*/
}

/**
 * package.json的内容
 * @returns {*}
 */
export function packageJson() {
    let packagePath;
    if (app.isPackaged) {
        packagePath = path.join(__dirname, '..', 'package.json');
    } else {
        packagePath = "./../package.json";
    }
    return require(packagePath);
}

/**
 * 切换显示/隐藏
 */
export function toggleShowHide(mainWindow) {
    if (mainWindow !== null) {
        if (mainWindow.isVisible()) {
            if (mainWindow.isFocused()) {
                mainWindow.hide();
            } else {
                mainWindow.focus();
            }
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
    }
}

/**
 * 初始化YiyiNet，安装模块等
 */
export function initYiyiNet() {
    // 安装模块
    installClientModule();

    // 下载Chromedriver
    downloadChromedriver();


}

/**
 * 安装需在客户端上使用的模块
 */
export function installClientModule() {
    let needInstall = getNeedInstallModule();
    installModule(needInstall);
}

/**
 * 获取需要安装的模块列表
 * @returns {*}
 */
function getNeedInstallModule() {
    let json = packageJson();
    return json.clientDependencies;
}

/**
 * 安装模块
 * @param needInstall ｛‘module1': 'version1', ‘module2': 'version2'...｝
 * @returns {Promise<void>}
 */
export function installModule(needInstall) {
    // module.paths.push(getNpmInstallPath());
    // console.log(module.paths);

    const {PluginManager} = require('live-plugin-manager');
    let manager = new PluginManager({
        pluginsPath: getNpmInstallPath(),
        npmRegistryUrl: 'https://registry.npm.taobao.org/'
    });

    let modules = Object.keys(needInstall);
    let lock = new AsyncLock({timeout: 300000});
    let succNum = 0, errNum = 0;
    let moNum = modules.length;
    for (let i = 0; i < moNum; i++) {
        let moduleStr = modules[i];
        let ver = needInstall[moduleStr];
        ver = ver === '' ? 'latest' : ver;

        lock.acquire("installModule", function (done) {
            try {
                let logStr = '[' + (i + 1) + '/' + moNum + ']安装模块[' + moduleStr + ']';
                console.time(logStr + '安装所耗时间');
                console.log(logStr + '，版本[' + ver + ']。。。');
                manager.install(moduleStr, ver).then(res => {
                    console.log(logStr + '，版本[' + ver + ']，安装[成功]：name=' + res.name + '[' + res.version + ']，依赖：' + Object.keys(res.dependencies));
                    // console.dir(res);
                    succNum++;

                    console.timeEnd(logStr + '安装所耗时间');
                    if (i === moNum - 1) {
                        console.log('模块[' + modules + ']已完成安装，其中成功[' + succNum + ']个，失败[' + errNum + ']个');
                        if (errNum === 0) {
                            moduleInstallSucc();
                        }
                    }
                    done();
                    moduleInstallDoneEvent(moduleStr, res.version.replace("^", ""));
                })
            } catch (error) {
                errNum++;
                console.log('[' + (i + 1) + '/' + moNum + ']安装模块[' + moduleStr + ':' + ver + ']出现错误，将跳过: ' + error);
            }
        }, function (err, ret) {
        }, {});
    }
}

function moduleInstallDoneEvent(moduleStr, version) {
    // 广告过滤事件
    adblockerInstallFinishEvent(moduleStr, version);

    // 修改Hosts解决Github无法访问的问题
    hostileInstallFinishEvent(moduleStr, version);

}

async function installModule2(needInstall, type) {
    var previous = null, project = null;
    if (type === undefined || type === "undefined" || type === '' || type === null) {
        type = 'livepluginmanager'; // type = 'livepluginmanager';
    }
    if (needInstall.includes('npm')) {
        type = 'livepluginmanager';
    }
    if (app.isPackaged) {
        previous = process.execPath.substring(0, process.execPath.lastIndexOf('\\'));
        project = path.join(previous, 'resources');
    } else {
        previous = process.execPath.substring(0, process.execPath.lastIndexOf('node_modules') - 1);
        project = previous;
    }

    if (process.cwd() !== project) {
        console.log('(安装)目录由[' + process.cwd() + ']切换到[' + project + ']');
        process.chdir(project);
    }

    try {
        if (type === "npm") {
            let npm = require('npm');
            await npm.load(function (err) {
                // 设置NPM参数（注意必须放在npm.load函数中）
                let configKeys = Object.keys(npmConfig());
                console.log('设置NPM参数值，包括以下字段：' + configKeys);
                configKeys.forEach(key => {
                    npm.config.set(key, npmConfig[key]);
                });

                console.log('安装模块(NPM)：' + needInstall);
                // 安装模块
                npm.commands.install(needInstall, function (er, data) {
                    console.log(data); // log errors or data
                });
                npm.on('log', function (message) {
                    console.log('安装模块NPM日志：' + message); // log errors or data
                });
            });
        } else {
            const {PluginManager} = require('live-plugin-manager');
            let manager = new PluginManager({
                cwd: project,
                pluginsPath: './node_modules',
                npmRegistryUrl: 'https://registry.npm.taobao.org/'
            });
            for (let dependency of needInstall) {
                console.log('安装模块(LIVE-PLUGIN-MANAGER)：' + dependency);
                await manager.installFromNpm(dependency);
            }
        }
    } catch (error) {
        console.log('安装模块出现错误: ' + error);
    } finally {
        if (process.cwd() !== previous) {
            console.log('(还原)目录由[' + process.cwd() + ']切换到[' + previous + ']');
            process.chdir(previous); // 还原到原目录
        }
    }
    return {'module': needInstall, 'type': type, 'succ': true, 'msg': '安装成功'};
}

